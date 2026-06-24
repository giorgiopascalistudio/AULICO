# Strategia fork pulito & setup nuovo ambiente Aulico

> **Scopo.** Come creare la nuova piattaforma **Aulico** in una **nuova cartella +
> nuovo repo + nuovo progetto Firebase**, **senza toccare** la piattaforma attuale
> (che resta live come fallback). Strategia "strangler fig": la nuova cresce
> accanto alla vecchia finché non la sostituisce.
>
> **Decisioni prese:**
> - **Fork pulito + refactor** (si parte dalla copia funzionante, non da zero).
> - **Nuovo progetto Firebase isolato** (dati di sviluppo separati; migrazione al cutover).
>
> ⚠️ La piattaforma attuale (`ONIRICOAPP`, repo e Firebase `oniricoapp-48953`)
> **non viene modificata**.

---

## 1. Principio

```
ONIRICOAPP (attuale)            AULICO (nuovo)
├─ repo attuale        ──copia──▶ nuovo repo "aulico"
├─ Firebase oniricoapp           nuovo Firebase "aulico-app" (isolato)
├─ live su GitHub Pages          deploy proprio (Pages del nuovo repo)
└─ RESTA INTATTO & LIVE          qui avvengono rebrand + domini + feature Aulico
```

La vecchia continua a servire l'operatività reale finché la nuova non raggiunge la
**parità**; poi si fa il **cutover** (switch deploy + migrazione dati).

---

## 2. Chi fa cosa (responsabilità)

| Passo | Lo fa Claude | Lo fai tu (account/console) |
|---|---|---|
| Copia locale in nuova cartella `aulico/` (esclude `node_modules`, `dist`, `.git`, cartelle gitignorate pesanti) | ✅ | |
| `git init` + primo commit nel fork | ✅ | |
| Creazione repo GitHub `aulico` | ✅ se `gh` è autenticato | altrimenti lo crei tu |
| `git remote add` + push | ✅ | |
| Nuovo **progetto Firebase** (`aulico-app`) | | ✅ (console Firebase / `firebase login`) |
| Abilitare Auth (Google + Email/Password) + domini | | ✅ |
| Creare Realtime DB + pubblicare `firebase-rules.json` | | ✅ (incolla le regole) |
| Aggiornare `src/firebase.ts` con la **nuova config** | ✅ (mi dai la config) | mi passi i valori |
| Workflow deploy (`.github/workflows/deploy.yml`) per il nuovo repo | ✅ | abilitare Pages lato GitHub |
| `npm install` + `npm run build` di verifica | ✅ | |
| (Cutover, dopo) migrazione dati vecchio→nuovo Firebase | ✅ script | esegui/autorizzi |

> Nota: la creazione del **progetto Firebase** è sempre lato tuo (serve il tuo
> account Google/console). Io preparo tutto il resto e ti do le istruzioni passo-passo.

---

## 3. Fase 0 — Setup (prima di scrivere feature)

1. **Copia** il progetto in `…/APP/COMPASS/AULICO/` (fork pulito, senza artefatti).
2. **Repo**: creo/collego il nuovo repo `aulico` e faccio il primo commit/push
   (il fork parte identico all'attuale, quindi **builda già**).
3. **Firebase isolato**: crei `aulico-app`, abiliti Auth + Realtime DB, pubblichi le
   regole; mi dai la **config** → io aggiorno `src/firebase.ts`.
4. **Deploy**: configuro il workflow; tu abiliti Pages sul nuovo repo.
5. **Verifica**: `npm install` + `npm run build` + smoke test login.

A fine Fase 0 hai **due piattaforme gemelle**: la vecchia live, la nuova
identica ma su repo+DB propri, pronta per le modifiche.

---

## 4. Poi — i lotti Aulico (nel nuovo repo)

Dentro il fork si procede come da `REGISTRO-DECISIONI.md` §11:
- **Primo lotto**: Rebrand → RBAC → ROE Unico → KPI funnel (PR piccole).
- Poi spacchettamento a domini (`ARCHITETTURA-TARGET.md` §5) e le altre feature.

I documenti `docs/` si copiano nel nuovo repo e restano la specifica di lavoro.

---

## 5. Cutover (a parità raggiunta)

1. **Congela** le scritture importanti sulla vecchia (finestra breve).
2. **Migra i dati**: export JSON dal Firebase vecchio → import nel nuovo
   (script; eventuali trasformazioni di schema per le novità Aulico).
3. **Switch deploy/dominio** sul nuovo repo.
4. La vecchia resta come **archivio di sola lettura** (o si dismette).

---

## 6. Vantaggi di questa strategia (perché risponde alla tua priorità)

- **Separazione totale**: repo e DB nuovi → toccare la nuova **non può** rompere la
  vecchia, che resta operativa.
- **Nessuna perdita**: parti dal codice funzionante (no rewrite da zero).
- **Reversibile**: finché non fai il cutover, puoi sempre tornare alla vecchia.
- **Pulizia**: il nuovo repo nasce già con la struttura a domini target.

---

## 7. Cosa serve da te per partire (riepilogo operativo)

1. Conferma il **nome** del nuovo repo e della nuova cartella (proposta: `aulico`).
2. Crei il **nuovo progetto Firebase** e mi passi la **config** (oggetto
   `firebaseConfig`) + confermi di aver pubblicato le regole e abilitato Auth.
3. (Se non uso `gh`) crei il **repo GitHub vuoto** e mi dai l'URL.

Con questi, eseguo la Fase 0. **Non parto finché non mi dai il via.**

---

*Strategia di riferimento. La piattaforma attuale resta invariata fino al cutover.*
