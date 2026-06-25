/**
 * Aulico AI — Cloudflare Worker (gratis, niente Blaze).
 * Endpoint POST che genera testo con Google Gemini (free tier). Sostituisce la
 * Cloud Function `aiGenerate` quando non si vuole Blaze.
 *
 * Sicurezza: verifica l'ID token Firebase del chiamante (deve essere un utente
 * autenticato dell'app) prima di chiamare il modello — la chiave AI resta lato
 * server (secret del Worker), mai nel client.
 *
 * Secret da impostare (wrangler secret put ...):
 *  - FIREBASE_API_KEY : la apiKey web del progetto (per verificare l'ID token)
 *  - GEMINI_KEY       : chiave Google AI Studio (free) per Gemini
 * Var opzionale (vars in wrangler.toml):
 *  - FIREBASE_DB_URL  : URL del Realtime Database (per verificare che il chiamante
 *                       sia un account onboardato: deve esistere users/<uid>).
 *
 * Sicurezza: oltre a validare l'ID token, si richiede che esista il profilo
 * users/<uid> nel DB. Così un token ottenuto creando un account "grezzo" via la
 * apiKey pubblica (senza passare dall'onboarding dell'app) NON può sfruttare la
 * quota AI. Clienti e partner (che hanno il profilo) restano abilitati.
 *
 * Body atteso: { prompt: string, system?: string, maxTokens?: number }
 * Header:      Authorization: Bearer <Firebase ID token>
 */
const DEFAULT_DB_URL = 'https://aulico-228bd-default-rtdb.europe-west1.firebasedatabase.app';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);
    try {
      // 1) verifica autenticazione (ID token Firebase)
      const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!token) return json({ error: 'unauthenticated' }, 401);
      const verify = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }) }
      );
      if (!verify.ok) return json({ error: 'invalid-token' }, 401);
      const vj = await verify.json().catch(() => null);
      const uid = vj?.users?.[0]?.localId;
      if (!uid) return json({ error: 'invalid-token' }, 401);

      // 1b) il chiamante deve essere un account onboardato (profilo users/<uid>).
      //     Lettura col token dell'utente (le regole consentono auth.uid==$uid).
      const dbUrl = env.FIREBASE_DB_URL || DEFAULT_DB_URL;
      const prof = await fetch(`${dbUrl}/users/${uid}.json?auth=${encodeURIComponent(token)}`);
      const profVal = prof.ok ? await prof.json().catch(() => null) : null;
      if (!profVal) return json({ error: 'forbidden', detail: 'Account non abilitato.' }, 403);

      // 2) input
      const body = await request.json();
      const { prompt, system, maxTokens } = body;

      // 2-img) Generazione immagine (bozza) da foto reale + stile, via Cloudflare
      //        Workers AI (img2img). Richiede il binding [ai] in wrangler.toml.
      if (body.kind === 'image') {
        if (!env.AI) return json({ error: 'image-not-configured', detail: 'Manca il binding AI (wrangler.toml [ai] binding="AI") — rifai wrangler deploy.' }, 501);
        const b64 = String(body.image || '').replace(/^data:[^,]+,/, '');
        if (!b64) return json({ error: 'missing-image' }, 400);
        let bytes;
        try { bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); }
        catch { return json({ error: 'bad-image' }, 400); }
        const model = env.IMAGE_MODEL || '@cf/runwayml/stable-diffusion-v1-5-img2img';
        try {
          const result = await env.AI.run(model, {
            prompt: String(prompt || 'architectural interior, professional render').slice(0, 1500),
            image: [...bytes],
            strength: typeof body.strength === 'number' ? body.strength : 0.55,
            num_steps: 20,
          });
          return new Response(result, { headers: { 'content-type': 'image/png', ...cors } });
        } catch (e) {
          return json({ error: 'image-error', detail: String((e && e.message) || e) }, 502);
        }
      }

      if (!prompt || !String(prompt).trim()) return json({ error: 'missing-prompt' }, 400);

      const max = Math.min(Number(maxTokens) || 700, 2000);

      // 3a) Provider preferito: GROQ (gratis, senza carta, OpenAI-compatibile).
      //     Si attiva impostando il secret GROQ_KEY. Modello override-abile (GROQ_MODEL).
      if (env.GROQ_KEY) {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${env.GROQ_KEY}` },
          body: JSON.stringify({
            model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            max_tokens: max,
            messages: [
              ...(system ? [{ role: 'system', content: String(system) }] : []),
              { role: 'user', content: String(prompt).slice(0, 8000) },
            ],
          }),
        });
        if (!r.ok) return json({ error: 'ai-error', detail: await r.text() }, 502);
        const j = await r.json();
        const text = (j.choices?.[0]?.message?.content || '').trim();
        return json({ text });
      }

      // 3b) Ripiego: Gemini (Google AI Studio). Modello override-abile (GEMINI_MODEL).
      const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
      const g = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system_instruction: system ? { parts: [{ text: String(system) }] } : undefined,
            contents: [{ role: 'user', parts: [{ text: String(prompt).slice(0, 8000) }] }],
            generationConfig: { maxOutputTokens: max },
          }),
        }
      );
      if (!g.ok) return json({ error: 'ai-error', detail: await g.text() }, 502);
      const data = await g.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      return json({ text });
    } catch (e) {
      return json({ error: 'internal', detail: String(e && e.message || e) }, 500);
    }
  },
};
