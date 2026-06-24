# Onirico Studio OS — Roadmap integrazioni

Legenda: ✅ già presente · 🟢 costruibile subito (solo app + Firebase) ·
🟡 richiede backend/servizio esterno (server, OAuth o provider terzo).

---

## Anagrafica & CRM
- ✅ Clienti (privati/aziende) — gestiti via accessi + Team
- 🟢 Fornitori e subappaltatori — **FATTO ORA** (CRM → Fornitori)
- ✅ Contatti interni (team) — Team/Accessi
- 🟢 Storico interazioni per soggetto — **FATTO ORA** (note CRM)
- 🟢 Profilazione cliente (tipologia, settore, valore) — settore già c'è; valore stimato nel CRM
- 🟢 Lead & pipeline commerciale — **FATTO ORA** (CRM → Pipeline, da contatto a firmato)

## Gestione Commesse & Progetti
- ✅ Commessa con codice univoco · fasi · stato avanzamento (SAL) · collegamento documenti/3D
- 🟢 Assegnazione risorse per fase (in parte già su task) — da completare
- 🟢 Gantt / timeline visuale — da costruire (vista calendario per progetto già presente)
- 🟢 Checklist milestone per tipo progetto — da costruire (template già esistono)

## Task Management
- ✅ Task con priorità/scadenze · assegnazione · dashboard personale
- 🟢 Stati da fare/in corso/in attesa/completato — da estendere (oggi: aperto/chiuso)
- 🟢 Sotto-task / micro-task — da aggiungere
- 🟢 Registro attività (log storico) per task — da aggiungere (vedi Log azioni)

## Calendario & Agenda
- ✅ Agenda condivisa · appuntamenti · vista per progetto
- 🟢 Promemoria automatici (in-app) — da aggiungere
- 🟡 Sync Google/Outlook Calendar — richiede OAuth + API (server)

## Contabilità & Finanza
- ✅ Preventivi/computi · fatturazione attiva/passiva · scadenziario · conto economico commessa · cash flow (ora **condivisi sul DB**)
- 🟢 SAL finanziari collegati ai SAL tecnici — da collegare
- 🟢 Acconti e saldi — da formalizzare
- 🟡 Fatturazione elettronica SDI reale — richiede intermediario accreditato (si può **generare l'XML FatturaPA** lato app)
- 🟡 Integrazione banca (movimenti automatici) — richiede PSD2/open banking (oggi: import manuale/CSV)

## Preventivazione & Stima Clienti
- 🟢 Configuratore preventivi self-service · prezzi dinamici — da costruire
- 🟢 Generazione PDF preventivo — da costruire (jsPDF lato app)
- 🟢 Preventivo → commessa con un click — base già pronta (vedi conversione lead)
- 🟡 Firma digitale legale del preventivo — richiede provider (oggi: "accetta online" tracciato)

## Gestione Cantiere
- 🟢 Diario di cantiere · presenze · forniture · non conformità · verbali — da costruire (dati+UI)
- ✅ Foto timestampate + geolocalizzate — **FATTO** (geolocation browser best-effort + badge GPS/link mappa nel `CantiereBoard`)

## Risorse Umane & Team
- ✅ Profili con ruoli e permessi
- 🟢 Timesheet ore per commessa · ferie/permessi · costo orario · performance — da costruire

## Reporting & Analytics
- ✅ Dashboard direzionale (base)
- ✅ Redditività · carico per risorsa · avanzamento portafoglio · Break Even Point — **FATTO** (Statistiche, `StatsView`)
- 🟢 Export PDF/Excel — da aggiungere (jsPDF / SheetJS lato app)

## Modulo Immobiliare (Flipping/Crowdfunding)
- ✅ Portafoglio immobili · scheda immobile · investitori · ROI · **SPV/cap table** · **update investitori** · **portale investitore** · **rendiconto/distribuzioni** — **FATTO** (Unico, `UnicoStudioView` + `unicoInvestorPositions`)

## Modulo Strategico / Marketing
- ✅ Eventi & inviti (RSVP) · Campagne & follow-up (link email/WhatsApp) · Sondaggi/customer satisfaction · calendario editoriale Social · Analisi — **FATTO** (`StrategicoView`, nodi `mkt*`)

## Modulo Energia Rinnovabile
- 🟢 Censimento lotti · stato pratiche · offerte · scadenze — modulo nuovo da costruire
- 🟡 Monitoraggio produzione impianti — richiede integrazione inverter/portale

## Gestione Documentale
- ✅ Archivio per commessa e per cliente (sezione Documenti) + generatore modulistica
- 🟢 Versioning file · permessi per tipo documento · template automatici — da aggiungere
- 🟡 Firma digitale integrata — provider esterno

## Integrazioni Esterne
- 🟡 SDI / Agenzia Entrate · banche · Google/MS 365 · WhatsApp · portali catastali — tutte richiedono server/OAuth/provider
- 🟢 Notifiche via email (mailto / link) — base lato app

## Accessi e Sicurezza
- ✅ Multi-utente con ruoli · accesso web + mobile (PWA possibile)
- 🟢 Log di ogni azione — da aggiungere (audit log condiviso)
- ✅ Backup — il Realtime Database è già ridondato; aggiungibile export manuale

---

### Suggerimento di priorità (proposta)
1. CRM ✅ (fatto) → 2. Preventivi self-service + PDF + preventivo→commessa →
3. Cantiere (diario + foto + presenze) → 4. Reporting/redditività →
5. Moduli Immobiliare ed Energia → 6. Integrazioni esterne (server) per ultime.

Le voci 🟡 conviene affrontarle insieme, perché richiedono un piccolo backend
(es. una Cloud Function) e credenziali dei servizi.
