/**
 * Aulico AI — Cloudflare Worker (gratis, niente Blaze).
 * Endpoint POST che genera testo con Groq (preferito) o Google Gemini (ripiego).
 * Sostituisce la Cloud Function `aiGenerate` quando non si vuole Blaze.
 *
 * Sicurezza: verifica l'ID token Firebase del chiamante **localmente** (firma JWT
 * RS256 contro le chiavi pubbliche di Google) — così NON dipende da API Firebase
 * soggette all'enforcement di App Check (che un server non può soddisfare) e la
 * chiave AI resta lato server (secret del Worker), mai nel client.
 *
 * Secret da impostare (wrangler secret put ...):
 *  - GROQ_KEY         : chiave Groq (https://console.groq.com/keys) — provider preferito
 *  - GEMINI_KEY       : chiave Google AI Studio (free) — ripiego automatico
 * Var opzionali (vars in wrangler.toml):
 *  - FIREBASE_DB_URL       : URL del Realtime Database (per il controllo profilo)
 *  - FIREBASE_PROJECT_ID   : project id (default 'aulico-228bd')
 * NB: FIREBASE_API_KEY non serve più (la verifica del token è locale).
 *
 * Body atteso: { prompt: string, system?: string, maxTokens?: number }
 * Header:      Authorization: Bearer <Firebase ID token>
 */
const DEFAULT_DB_URL = 'https://aulico-228bd-default-rtdb.europe-west1.firebasedatabase.app';
const DEFAULT_PROJECT_ID = 'aulico-228bd';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors } });

// --- Verifica locale dell'ID token Firebase (JWT RS256) ---------------------
function b64urlToBytes(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += '='.repeat(pad);
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function b64urlToJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

let jwksCache = { at: 0, keys: null };
async function getGoogleKeys() {
  if (jwksCache.keys && Date.now() - jwksCache.at < 3600e3) return jwksCache.keys;
  const r = await fetch(JWKS_URL);
  const j = await r.json();
  jwksCache = { at: Date.now(), keys: j.keys || [] };
  return jwksCache.keys;
}

/** Ritorna l'uid se il token è valido per il progetto, altrimenti null. */
async function verifyIdToken(token, projectId) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const header = b64urlToJson(parts[0]);
    const payload = b64urlToJson(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub) return null;
    if (payload.exp && now >= payload.exp) return null;
    if (payload.iat && payload.iat > now + 300) return null;
    if (header.alg !== 'RS256') return null;

    const keys = await getGoogleKeys();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), data);
    return ok ? payload.sub : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);
    try {
      // 1) autenticazione: verifica LOCALE dell'ID token (niente API App-Check-gated)
      const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!token) return json({ error: 'unauthenticated' }, 401);
      const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
      const uid = await verifyIdToken(token, projectId);
      if (!uid) return json({ error: 'invalid-token' }, 401);

      // 1b) il chiamante dovrebbe essere un account onboardato (profilo users/<uid>).
      //     Controllo BEST-EFFORT: se la lettura è bloccata (es. App Check sul DB) NON
      //     blocchiamo — il token JWT è già verificato e appartiene a questo progetto.
      const dbUrl = env.FIREBASE_DB_URL || DEFAULT_DB_URL;
      const prof = await fetch(`${dbUrl}/users/${uid}.json?auth=${encodeURIComponent(token)}`);
      if (prof.status === 200) {
        const profVal = await prof.json().catch(() => null);
        if (!profVal) return json({ error: 'forbidden', detail: 'Account non abilitato.' }, 403);
      }
      // (status 401/403 = lettura bloccata da App Check/regole → si prosegue)

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
        if (r.ok) {
          const j = await r.json();
          const text = (j.choices?.[0]?.message?.content || '').trim();
          return json({ text });
        }
        // Groq ha fallito (chiave scaduta/errata o modello dismesso): se c'è Gemini
        // ci ripieghiamo automaticamente, altrimenti restituiamo il dettaglio reale.
        const groqDetail = await r.text();
        if (!env.GEMINI_KEY) return json({ error: 'ai-error', detail: `Groq: ${groqDetail}` }, 502);
        // (fall-through al blocco Gemini qui sotto)
      }

      // 3b) Ripiego: Gemini (Google AI Studio). Modello override-abile (GEMINI_MODEL).
      if (!env.GEMINI_KEY) return json({ error: 'ai-not-configured', detail: 'Nessun provider AI configurato (GROQ_KEY o GEMINI_KEY).' }, 501);
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
