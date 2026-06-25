# Aulico AI — Worker Cloudflare (GRATIS, niente Blaze)

Endpoint che genera testo con **Google Gemini** (free tier). Sostituisce la
Cloud Function `aiGenerate` (Anthropic) per l'AI assist dello Strategico, senza
piano Blaze. La chiave AI resta lato server (secret del Worker); il Worker
verifica l'**ID token Firebase** del chiamante prima di rispondere.

## Cosa devi fare tu (una volta sola)

### 1) Chiave Gemini (gratis, senza carta)
Vai su **https://aistudio.google.com/apikey** → **Create API key** → copiala.

### 2) Installa wrangler e fai login (gratis)
```bash
npm install -g wrangler
wrangler login          # apre il browser per autorizzare (account Cloudflare gratis)
```

### 3) Imposta i secret e fai il deploy
```bash
cd cloudflare-worker
wrangler secret put GEMINI_KEY          # incolla la chiave Gemini
wrangler secret put FIREBASE_API_KEY    # la apiKey web del progetto (è in src/firebase.ts)
wrangler deploy
```
Al termine wrangler stampa l'URL pubblico, es.
`https://aulico-ai.<tuo-subdominio>.workers.dev`

### 4) Dì all'app di usare il Worker
Aggiungi una riga in `index.html` (nella `<head>`, prima dei moduli), con il tuo URL:
```html
<script>window.__AULICO_AI_URL__ = 'https://aulico-ai.<tuo-subdominio>.workers.dev';</script>
```
Fatto: l'AI assist userà il Worker gratis. Se la riga non c'è, l'app ricade
automaticamente sulla Cloud Function `aiGenerate` (che richiede Blaze + Anthropic).

## Costi
Cloudflare Workers free tier: **100.000 richieste/giorno**. Gemini free tier:
ampio per uso interno. Per iniziare **non serve la carta**.
