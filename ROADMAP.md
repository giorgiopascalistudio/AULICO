# Aulico — Stato & Roadmap

> Aggiornato: **25 giu 2026**. Questo file è la fonte rapida di "cosa è fatto e cosa no".
> Legenda: ✅ fatto · 🟡 manca (richiede provider/servizio esterno) · 🔎 da confermare/affinare.

## In sintesi
La piattaforma è **sostanzialmente completa**. Restano da fare **solo due cose**, entrambe
dipendenti da provider esterni:
- 🟡 **Firma OTP / eIDAS** dei documenti (contratti Onirico/Materico) — oggi: "accetta online" tracciato.
- 🟡 **WhatsApp Business API** (invio automatico) — oggi: link `wa.me` pronti.

Tutto il resto del piano (`docs/VISIONE-AULICO.md`, `docs/REGISTRO-DECISIONI.md`) è implementato:
rebrand Aulico/Onirico, RBAC granulare (`access`), ROE Unico (3%/15%/€10k/4% + payback),
commesse interne `internalOrders`, KPI funnel di gruppo, penali Materico, point system,
lead pipeline + conversione, AI assist/img2img (Worker Cloudflare gratis), portali cliente/
partner/investitore, Cantiere, Strategico/Marketing, Finanza consolidata, Cestino, ecc.

## Lotti in corso
- ✅ **Lotto A — Funnel preventivo→commessa** (25 giu 2026): listino voci riusabili
  (nodo `priceList`, gestione in Finanze → Preventivi → "Listino"), aggiunta righe **da listino**
  in `QuoteEditor`, e **preventivo accettato → genera AUTO la commessa** (progetto con fasi/task
  dalle macro-voci, cliente collegato e notificato) in `handleSetQuoteStatus`.

- ✅ **Lotto D — Catalogo punti esteso** (25 giu 2026): `POINT_CATALOG` ampliato (~60 voci per
  team e partner, categorie multiple) + select raggruppato per categoria in `TeamView`.
- ✅ **Lotto C — Smistamento lead** (25 giu 2026): nel dettaglio lead (`CrmView`) suggerimento della
  società di competenza (`suggestSector`) + assegnazione con conferma (log chi/quando) e notifica al
  team (`handleRouteLead`). Permesso **'gestione lead'** = `canOperate(user,'strategico','lead')`
  (fallback dal ruolo: comportamento invariato).
- ✅ **Lotto B — Audit log globale** (25 giu 2026): nodo `auditLog`, helper `logAudit()` agganciato ai
  punti chiave (delete/restore, creazione progetti, stato preventivo, smistamento lead), vista
  **Registro attività** (`AuditView`, route `#registro`, sidebar admin/manager). Copertura incrementale.

## Stato
**Tutti i lotti A–D completati.** Restano solo **firma OTP** e **WhatsApp** (provider esterni, in coda).
> Se queste sono già coperte altrove (nomi diversi), segnalare il file così si aggiorna lo stato.

## Modifiche del 25 giu 2026 (oggi)
- **Portale cliente — Dashboard come HOME**: benvenuto + griglia di box-sezione (stile app) +
  box "Il tuo percorso" + quiz. **I progetti non stanno più in dashboard**: vivono nella sezione
  **Progetti/lavori**, con **card selezionabili** quando il cliente ha più di un progetto.
- **Quiz giornaliero** a tema costruzioni/architettura + riepilogo finale con risposte corrette.
- **Newsletter**: ora **banner** che appare **solo se non iscritti** (con spunta stile privacy) e
  sparisce all'iscrizione; in registrazione c'è la **spunta newsletter facoltativa**; nel profilo
  la spunta è sempre visibile (iscrivi/disiscrivi).
- **Profilo cliente**: foto **ridimensionata** (max 256px) prima del salvataggio.
- **Worker AI**: hardening — il chiamante deve essere un **account onboardato** (`users/<uid>`
  esistente), per non far sfruttare la quota AI a token "grezzi".
- **firebase.ts**: commento JSDoc rimesso al posto giusto (`callAiImage`).
- Allineato il **project id** nei doc a `aulico-228bd` (il vecchio `oniricoapp-48953` era datato).

## Nota operativa Firebase
⚠️ Dopo il deploy **ripubblicare `firebase-rules.json`** (nodi `newsletter`, `deletionRequests`
e gli altri elencati in CLAUDE.md §13), altrimenti le relative funzioni danno "permission denied".
