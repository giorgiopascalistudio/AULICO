# Automazioni Aulico — cron GRATIS (GitHub Actions)

Esegue ogni giorno reminder e alert **senza Blaze e senza Cloud Functions**.
Gira su GitHub Actions (gratis) e scrive le notifiche in-app sul Realtime
Database con `firebase-admin`. Le legge l'app come le altre notifiche.

Cosa fa ogni giorno:
- reminder **ferie** (7 gg prima) + **scadenze** finanziarie (entro 3 gg)
- alert **scadenze documenti/contratti** (60/30/15/7/0 gg)
- **consegne Materico in ritardo** (1/7/14/30 gg) → "valuta penale"
- **report attività**: settimanale (lunedì) e mensile (giorno 1)
- **KPI social automatici** — fase 1: **Google Analytics 4** → canale "Sito web"
  del Centro Marketing (utenti, sessioni, % stranieri). Vedi sotto.

> Niente email (per restare 100% gratis). Solo notifiche in-app. L'email si può
> aggiungere dopo con un provider free (Brevo/Resend).

## Cosa devi fare tu (una volta sola)

### 1) Genera la chiave service account (gratis)
Firebase Console → ⚙️ **Project settings** → scheda **Service accounts** →
**Generate new private key** → scarica il file JSON.

### 2) Mettila nei secrets del repo GitHub
Repo su GitHub → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**:
- **`FIREBASE_SERVICE_ACCOUNT`** = incolla **tutto** il contenuto del file JSON
- **`FIREBASE_DB_URL`** = `https://aulico-228bd-default-rtdb.europe-west1.firebasedatabase.app`

### 3) Fatto
Il workflow `.github/workflows/cron.yml` parte **ogni giorno alle ~08:00**
(ora italiana). Puoi anche lanciarlo a mano: tab **Actions** → *Aulico —
automazioni* → **Run workflow**.

> ⚠️ Non committare mai il file JSON della service account: va **solo** nei
> secrets di GitHub.

## KPI automatici da Google Analytics 4 (canale "Sito web")

Aggiorna in automatico i KPI del canale **Sito web** di ogni account del Centro
Marketing, **riusando la stessa service account** già configurata sopra: non serve
un nuovo secret. Il sync gira ogni giorno e tiene aggiornato il mese corrente (e il
precedente nei primi 3 giorni del mese). Scrive solo le metriche di GA4 in **merge**
con l'inserimento manuale: le altre voci (es. *lead*) restano.

**Cosa devi fare tu (una volta per ogni sito):**

1. **Dai accesso alla service account su GA4.** In Google Analytics della proprietà →
   **Amministrazione** → **Gestione dell'accesso alla proprietà** → **+** → aggiungi
   l'email della service account (il campo `client_email` dentro il JSON del secret,
   tipo `xxx@aulico-228bd.iam.gserviceaccount.com`) con ruolo **Visualizzatore**.
2. **Abilita l'API.** Google Cloud Console del progetto `aulico-228bd` → **API e
   servizi** → abilita **Google Analytics Data API**.
3. **Incolla l'ID proprietà nel gestionale.** Aulico → Strategico → **Centro
   Marketing** → apri l'account → **Panoramica** → campo *Google Analytics · ID
   proprietà GA4*: metti l'**ID numerico** (GA4 → Amministrazione → *Impostazioni
   proprietà* → **ID proprietà**, es. `123456789`). ⚠️ È l'ID numerico, **non** il
   codice di misurazione `G-XXXXXXX`.

Fatto: al prossimo giro del cron (o lanciandolo a mano dal tab *Actions*) i KPI del
sito si popolano da soli. Nella tab **KPI → Sito web** compare "Sito web aggiornato
da Google Analytics".

> Mappatura: `Utenti attivi ← activeUsers` · `Nuovi utenti ← newUsers` ·
> `Sessioni ← sessions` · `Interazioni ← engagedSessions` ·
> `% stranieri ← sessioni non-Italia / totali`.

## Test in locale (facoltativo)
```bash
cd automation
npm install
FIREBASE_SERVICE_ACCOUNT="$(cat /percorso/chiave.json)" \
FIREBASE_DB_URL="https://aulico-228bd-default-rtdb.europe-west1.firebasedatabase.app" \
node cron.mjs
```
