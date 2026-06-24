# Registro delle decisioni — Aulico

> **Scopo.** Fonte unica di "cosa è stato deciso" per la trasformazione in Aulico.
> Raccoglie tutte le decisioni prese con il committente, con eventuali note di
> conciliazione. I dettagli tecnici stanno nei doc citati.
>
> ⚠️ **La piattaforma non è ancora stata toccata**: è tutta pianificazione.
> Stato voci: ✅ deciso · 📌 nota di implementazione/conciliazione · ⏳ fase backend.

---

## 1. Identità & branding
- ✅ **Rebrand → "Aulico"** (piattaforma). Verticale `studio` → etichetta **"Onirico"**.
  Chiavi codice e nodi DB **invariati**. → `VISIONE-AULICO.md` §1
- ✅ **Stile grafico = il nostro** (no palette del deck). → `LINEE-GUIDA-GRAFICHE.md`

## 2. Modello a 5 gestionali
- ✅ Aulico (core/Holding) + 4 verticali (Onirico, Materico, Unico, Strategico).
- ✅ I gestionali comunicano **solo** via 5 pattern (snapshot, finance.record,
  commessa interna, indici inversi, servizi core); **nessuna lettura incrociata**.
  → `GESTIONALI-SPECIFICHE.md` §7-8

## 3. Commesse interne (Unico→Onirico 15%, →Materico, →Strategico €10k, lead)
- ✅ **Entità dedicata** `internalOrders/<id>` con numerazione **`CI-` progressiva**.
- ✅ **Generazione automatica al salvataggio** del deal Unico.
- ✅ **Scrittura in finanza alla conferma** della commessa (impegno; rettificabile
  fino a `completata`).
- ✅ **Natura fiscale = IBRIDA**: nasce come **movimento gestionale**, promuovibile a
  **fattura reale intercompany** quando il denaro si muove davvero.
  📌 Lo stato `InternalOrder` deve riflettere i due stadi (gestionale → fatturata);
  l'elisione nel consolidato vale per entrambi. → `SCHEMA-COMMESSE-INTERNE.md` §1
- ✅ **IVA fattura intercompany** = **gestione regimi speciali** (reverse charge/esente
  edilizia), oltre all'ordinaria. 📌 i casi specifici/aliquote si dettagliano in fase fisco.
- ✅ **Invio fattura** = **integrazione SDI reale** (⏳ backend) **+ export PDF + invio
  email/WhatsApp**.
- ✅ Smistamento lead da Strategico (Point of Entry) = **automatico con conferma**
  (+ fallback manuale). → `SCHEMA-COMMESSE-INTERNE.md` §4
- ✅ **Listino "voci di costo predefinite"** (funnel Onirico) = **base importata dai
  computi + editor in app**, alimentato da un **modulo "generatore computi" condiviso**
  (presente sia in **Onirico** sia in **Materico**). 📌 nuovo modulo comune.

## 4. Finanza & ROE
- ✅ Bridge finanza = **servizio core `finance.record()`** (+ `recordIntercompany`);
  giri interni **elisi nel consolidato**. → `SCHEMA-COMMESSE-INTERNE.md` §3
- ✅ **Cascata ROE Unico** = default **override-abili per operazione** (Agenzia 3%,
  Progettazione Onirico 15% su costo realizzazione, Promozione Strategico €10k fisso,
  Rivendita 4%) + **payback** (`purchaseDate`/`resaleDate`). → `SCHEMA-…` §2
- ✅ **Equity per il ROE** = **capitale totale investito** (investitori esterni +
  eventuale quota propria di Unico).

## 5. KPI di gruppo (funnel)
Definizioni operative del funnel Preventivato → Venduto → Erogato → Fatturato →
Incassato → Liquidità:
- ✅ **Venduto** = preventivo/**contratto firmato** (in futuro firma OTP).
- ✅ **Erogato** = **valore dei SAL approvati** (modulo Cantiere).
- ✅ **Liquidità** = ⏳ **integrazione bancaria reale** (fase backend).
  📌 **Interim** (finché non c'è la banca): **calcolata da incassi − pagamenti**,
  etichettata come "stima".
- ✅ Dashboard CRM/Finanza = **estendere gli esistenti** (Consolidato + funnel +
  selettore società su CRM). → `DASHBOARD-E-MODULARITA.md` §3

## 6. Accessi (RBAC) & GDPR
- ✅ Modello permessi = **per-società *e* per-modulo** (`access[societa] =
  {default, modules?}`, livelli none/view/operate/admin). → `VISIONE-AULICO.md` §11
- ✅ **Migrazione utenti esistenti** = **comportamento attuale finché non rivisto**
  (vecchi ruoli validi; nuovo modello per i nuovi, vecchi migrati a mano).
- ✅ **Enforcement** = **regole Firebase complete** (per-società/modulo).
  📌 **Conciliazione** con la migrazione: durante la transizione le regole devono
  onorare **sia** il vecchio modello a ruoli **sia** il nuovo `access` → fallback al
  ruolo quando la mappa `access` è assente.
- ✅ **Lead/privacy** = **permesso esplicito 'gestione lead' + log accessi**.

## 7. Figure utente & onboarding
- ✅ **Investitore** = figura con onboarding/vista dedicati; nella **dashboard adattiva**
  vede i propri investimenti **+** eventuali altri moduli se collegato (es. anche cliente).
- ✅ **Subappaltatore** = **sottotipo del "partner"** (il partner resta il contenitore;
  il subappaltatore è la sua specializzazione Materico/Cantiere, meglio profilata).
  📌 Implica `accountType`/sottotipo + adattamento RBAC/regole + dashboard adattiva.

## 8. Automazioni & contratti
- ✅ **Firma** = **OTP via provider** *e* **firma avanzata/qualificata (eIDAS)** —
  **livello scelto in base al documento** (accettazioni leggere vs contratti veri). ⏳ backend
- ✅ **Point system incentivi** = **team interno *e* subappaltatori**, con **ranking +
  soglie che sbloccano bonus**; alimenta anche il **calcolo compenso** (team) e il
  **livello di affidabilità/precisione** (partner). 📌 valori/soglie esatti da definire.
- ✅ **Penali automatiche Materico** = **proposta automatica + conferma operatore**,
  formula **% per giorno di ritardo con tetto massimo**. 📌 percentuali esatte da definire.
- ⏳ **Backend separato** per OTP/WhatsApp/AI-render/report settimanale (non blocca il resto).

## 9. Dashboard & modularità
- ✅ **Portale cliente/partner = dashboard UNICA ADATTIVA** (registro di moduli
  indipendenti, lazy + error boundary). I moduli si agganciano dalle relazioni
  esistenti. → `DASHBOARD-E-MODULARITA.md`
- ✅ **Raggruppamento** = sezioni per società; **ordine** = per attività recente
  (dentro e tra le sezioni); **stato vuoto** = **wizard guidato** iniziale.
- ✅ **Isolamento** = motivo guida: modificare/rompere un modulo non blocca l'app.

## 10. Trasversali
- ✅ **i18n** = moduli **cliente IT/EN**, strumenti **interni solo IT**.
- ✅ **Naming `Cliente + Località`** = **tutte le società dove ha senso** (campo
  libero come fallback per casi non residenziali).
- ✅ **Audit log = completo** (trail di tutte le azioni).
  📌 È un sottosistema nuovo non banale (nodo audit + scrittura su ogni azione,
  probabilmente con Cloud Function per i casi sensibili) → valutare in fase backend
  per la parte pesante; client-side per le azioni base.

## 11. Roadmap & esecuzione
- ✅ **Primo lotto** = **Rebrand + RBAC + ROE Unico + KPI funnel**.
- ✅ **Ordine** = Rebrand → RBAC → ROE Unico → KPI funnel (rischio crescente, controllato).
- ✅ **Granularità** = **sotto-fasi piccole, più PR** verificabili (deploy frequenti).
- ✅ **Stato globale** = **Context per dominio** (no dipendenze nuove, isolamento moduli).
- ✅ **Provider esterni** = **rosa di opzioni proposta in fase backend** (OTP/eIDAS,
  WhatsApp, AI immagini, open banking/SDI).
- 📌 Migrazione codice a domini (spacchettamento `App.tsx`) = `ARCHITETTURA-TARGET.md` §5.
- 📌 **Nessuna implementazione parte senza via libera esplicito dell'utente.**

---

## Punti residui — SOLO dati/contenuti da popolare (non decisioni di design)
Nessun quesito di design aperto. Restano valori concreti, definibili in corsa:
1. **Aliquote/casistiche IVA** specifiche delle fatture intercompany (reverse charge ecc.).
2. **Contenuto del listino** voci di costo (popolato dai computi reali).
3. **Valori del point system** (punti per attività/soglie bonus) e **% penali** (e tetti).
4. **Scelta dei provider** concreti (in fase backend, su rosa che proporrò).

---

*Registro vivo: aggiornare a ogni nuova decisione. Riferimento incrociato con tutti
i doc in `docs/`.*
