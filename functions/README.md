# Onirico — Cloud Functions (automazioni)

Backend per le automazioni del gestionale: **notifiche in-app**, **email (SendGrid)**,
**reminder schedulati** (ferie 7 giorni prima, scadenze finanziarie), **report** settimanali/mensili.

> ⚠️ Questo codice è **scaffold pronto al deploy**. Il deploy e la verifica reali sono a tuo carico
> (richiedono `firebase login`, il **piano Blaze** e la **API key SendGrid**). Finché non è deployato,
> l'app resta pienamente funzionante: le notifiche in-app create dall'app continuano a funzionare,
> mancano solo le automazioni "che partono da sole".

## Funzioni incluse (`functions/src/index.ts`)
| Funzione | Tipo | Quando | Cosa fa |
|---|---|---|---|
| `onQuoteStatusChange` | Trigger RTDB `quotes/{id}/status` | preventivo → *accettato* | notifica in-app a tutto il team + email |
| `dailyReminders` | Schedulata (ogni giorno 08:00) | ferie che iniziano fra 7 gg; scadenze entro 3 gg | notifiche + email |
| `weeklyReport` | Schedulata (lunedì 08:00) | settimanale | report attività completate per collaboratore |
| `monthlyReport` | Schedulata (1° del mese 08:00) | mensile | report attività completate per collaboratore |
| `aiGenerate` | Callable (onCall) | dal modulo Strategico (AI assist) | genera testo via API Anthropic (copy campagne, sintesi report) — solo studio attivo |
| `marketingMonthlyReport` | Schedulata (1° del mese 08:30) | mensile | sintesi marketing (eventi/campagne/sondaggi/economia) ad admin/manager |

Regione: **europe-west1** (coerente con la RTDB). Le notifiche vengono scritte su `notifications/<uid>`
(le legge l'app). Le email partono da `FROM_EMAIL` in `index.ts` — **da sostituire** con un mittente
verificato su SendGrid.

## Setup (una tantum)
1. **Firebase CLI**: `npm install -g firebase-tools` poi `firebase login`.
2. **Piano Blaze**: nella Console Firebase del progetto `oniricoapp-48953` passa al piano **Blaze**
   (a consumo): le Functions schedulate e l'invio email lo richiedono. Ha una soglia gratuita ampia.
3. **SendGrid**: crea un account, un **Single Sender verificato** (o autentica il dominio) e una **API key**.
   Imposta `FROM_EMAIL` in `functions/src/index.ts` con il mittente verificato.
4. **Secret SendGrid**:
   ```bash
   firebase functions:secrets:set SENDGRID_KEY
   # incolla la API key quando richiesto
   ```
5. **AI assist (opzionale, Strategico)**: per abilitare la generazione testi/sintesi (`aiGenerate`)
   imposta la chiave Anthropic:
   ```bash
   firebase functions:secrets:set ANTHROPIC_KEY
   # incolla la API key (console.anthropic.com) quando richiesto
   ```
   Finché non è impostata, nell'app i pulsanti "Genera con AI" mostrano un avviso e il resto funziona.
   Modello default `claude-sonnet-4-6` (modificabile nel parametro `model` della chiamata).

## Build & deploy
```bash
cd functions
npm install
npm run build          # compila TypeScript → lib/ (verifica che non ci siano errori)
cd ..
firebase deploy --only functions
```
Per pubblicare anche le regole del Database via CLI (in alternativa alla Console):
```bash
firebase deploy --only database
```

## Note
- Gli scheduler usano Cloud Scheduler (creato in automatico al primo deploy della funzione schedulata).
- Per i log: `firebase functions:log` oppure `npm run logs` dentro `functions/`.
- WhatsApp automatico **non** è incluso (in app ci sono i link `wa.me` manuali). Si potrà aggiungere qui
  una funzione che chiama Twilio / Meta WhatsApp Cloud API riusando gli stessi helper.
