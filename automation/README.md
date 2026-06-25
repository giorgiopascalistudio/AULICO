# Automazioni Aulico — cron GRATIS (GitHub Actions)

Esegue ogni giorno reminder e alert **senza Blaze e senza Cloud Functions**.
Gira su GitHub Actions (gratis) e scrive le notifiche in-app sul Realtime
Database con `firebase-admin`. Le legge l'app come le altre notifiche.

Cosa fa ogni giorno:
- reminder **ferie** (7 gg prima) + **scadenze** finanziarie (entro 3 gg)
- alert **scadenze documenti/contratti** (60/30/15/7/0 gg)
- **consegne Materico in ritardo** (1/7/14/30 gg) → "valuta penale"
- **report attività**: settimanale (lunedì) e mensile (giorno 1)

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

## Test in locale (facoltativo)
```bash
cd automation
npm install
FIREBASE_SERVICE_ACCOUNT="$(cat /percorso/chiave.json)" \
FIREBASE_DB_URL="https://aulico-228bd-default-rtdb.europe-west1.firebasedatabase.app" \
node cron.mjs
```
