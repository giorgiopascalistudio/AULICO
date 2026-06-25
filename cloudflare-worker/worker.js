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
 *
 * Body atteso: { prompt: string, system?: string, maxTokens?: number }
 * Header:      Authorization: Bearer <Firebase ID token>
 */

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

      // 2) input
      const { prompt, system, maxTokens } = await request.json();
      if (!prompt || !String(prompt).trim()) return json({ error: 'missing-prompt' }, 400);

      // 3) chiamata Gemini (free tier)
      const model = 'gemini-2.0-flash';
      const g = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system_instruction: system ? { parts: [{ text: String(system) }] } : undefined,
            contents: [{ role: 'user', parts: [{ text: String(prompt).slice(0, 8000) }] }],
            generationConfig: { maxOutputTokens: Math.min(Number(maxTokens) || 700, 2000) },
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
