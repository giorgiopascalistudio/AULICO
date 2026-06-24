# Manuale funzionale — Aulico (ex Onirico Studio OS)

> **Scopo.** Tutorial accurato dell'intera piattaforma: cosa fa ogni parte, chi
> la usa, come opera e dove vivono i dati. Pensato come base per una **mappa
> concettuale**: la struttura segue i livelli naturali (Attori → Aree → Moduli →
> Funzioni → Dati → Flussi). Per lo stile grafico vedi `LINEE-GUIDA-GRAFICHE.md`;
> per i dettagli tecnici di implementazione vedi `CLAUDE.md` nella root.
>
> **Stato.** Questo manuale descrive la piattaforma **as-is** (ciò che esiste
> oggi). Le estensioni richieste dal feedback strategico ("Aulico") sono raccolte
> in **`VISIONE-AULICO.md`** e marcate qui come *(target Aulico)* dove pertinente.
>
> **Rebrand:** l'app si chiama ora **Aulico**; il verticale `studio` si chiama in
> UI **"Onirico"**. Le **chiavi nel codice e i nodi DB restano invariati** — vedi
> mappa nomi sotto.

### Mappa nomi (business ↔ codice)

| Nome business | Chiave codice | Ruolo |
|---|---|---|
| **Aulico** | l'app / Holding | piattaforma + DB centrale + servizi comuni |
| **Strategico** | `strategico` | hub: admin di gruppo, contabilità, marketing, SW |
| **Onirico** | `studio` | studio architettura/ingegneria |
| **Materico** | `materico` | esecuzione lavori + subappaltatori |
| **Unico** | `unico` | investimenti immobiliari |

---

## Indice / mappa di alto livello

```
ONIRICO STUDIO OS  (gestionale/ERP della holding Onirico)
│
├─ A. ATTORI (chi usa l'app)
│    ├─ Team interno: admin · manager · staff
│    └─ Portale: cliente · azienda · partner · investitore
│
├─ B. SOCIETÀ DELLA HOLDING
│    ├─ Studio       (architettura/ingegneria)        → nero
│    ├─ Materico     (forniture/posa, subappalto)      → arancio
│    ├─ Unico        (immobili: acquisto→ristruttura→rivendita) → indaco
│    └─ Strategico   (marketing)                        → ambra
│
├─ C. LATO STUDIO (interfaccia interna)
│    Dashboard · Calendario/Agenda · Progetti(+divisioni) · CRM · Richieste
│    clienti · Finanze(+Statistiche/BEP) · Team · Cestino
│
├─ D. LATO PORTALE (cliente/partner/investitore)
│    Vetrina cinematica · Portale cliente · Portale partner Materico ·
│    Portale partner Cantiere · Portale investitore Unico
│
├─ E. MODULI TRASVERSALI
│    Documenti · Arredi & Moodboard(2D/3D) · Cantiere · Notifiche · Ferie ·
│    Preventivi & Parcelle · Trash/doppia conferma · Vetrina/showcase
│
└─ F. INFRASTRUTTURA
     Auth & ruoli · Realtime DB (nodi) · Regole sicurezza · Cloud Functions ·
     Google Drive · Firebase Storage · Routing a hash
```

---

# A. Attori e ruoli

L'accesso avviene con **email+password** oppure **Google** (`AuthFlow`). Ogni
account vive nel nodo `users/<uid>`. Il **tipo account** scelto all'iscrizione
determina il percorso.

| Tipo account (`accountType`) | Ruolo (`role`) | Approvazione | Cosa vede |
|---|---|---|---|
| **cliente** (privato) | `cliente` | automatica (`approved`) | Portale: propri progetti + richieste |
| **azienda** (con P.IVA/CF/PEC/SDI) | `cliente` | automatica | come cliente (distinto solo dai dati) |
| **team** (collaboratore) | nessuno finché approvato | **pending** → admin/manager assegna ruolo | dati studio |
| (assegnato dal team) | `partner` | — | Portale partner (Materico/Cantiere) |
| (collegato a un deal) | `cliente`+investitore | — | Portale + "I miei investimenti" |

**Ruoli interni** (team "active", `active:true`):
- **admin** — tutto, incl. creazione admin, finanza, gestione accessi, Team, Cestino.
- **manager** — come admin ma **non** crea admin; ha finanza e gestione accessi.
- **staff** — vede i dati studio; **niente finanza**.

**Ruoli portale** (`active:false`): `cliente` e `partner` vedono solo i propri
dati (progetti via `clientUid`, richieste Materico, cantieri assegnati, ecc.).

**Bootstrap admin:** il primo utente in assoluto, **oppure** l'email
`giorgio.pascali990@gmail.com`, diventa admin automaticamente.

> **(target Aulico) RBAC granulare per-società.** Il modello `admin/manager/staff`
> è oggi piatto. Aulico richiede permessi **per-società** e **per-livello**
> (`none|view|operate|admin` su studio/strategico/materico/unico) per coprire
> figure come "operativo multi-società", "tecnico settoriale", "monitoraggio in
> sola lettura", più un permesso esplicito su **chi vede i lead** (privacy/GDPR).
> Specifica e matrice completa in `VISIONE-AULICO.md` §3 e §11.

**Concetti chiave dell'identità:**
- `currentUser` = utente operativo (solo se `approved` + ruolo).
- `ownProfile` = il proprio record `users/<uid>` sempre (anche non-active) → il
  render decide registrazione/attesa/rifiuto.
- `directory/<uid>` = elenco membri studio leggibile anche dai portali.
- **Gestione accessi** (`AccessRequests`): admin e manager approvano i "team"
  pending e assegnano ruoli.

---

# B. Le quattro società (modello di business)

| Società | Cosa fa | Modello di ricavo (motore `finance.ts`) |
|---|---|---|
| **Studio** | architettura, pratiche edilizie (catasto, CILA/SCIA, APE) | **15%** su (computo + arredi fissi) **+ 20%** su arredi mobili se gestiti dallo Studio. Pagamento a SAL. |
| **Materico** | riceve richieste clienti (forniture/posa), subappalta a partner con margine | **ricarico 15%** sul costo partner (il margine è il ricavo) |
| **Unico** | compra immobili → ristruttura (via Materico) → rivende, con investitori | margine = rivendita − acquisto − ristrutturazione (ROI investitori). *(target Aulico: cascata ROE analitica — vedi sotto)* |
| **Strategico** | marketing per le altre società e clienti esterni; *(target Aulico: hub/Point of Entry dei lead + contabilità di gruppo)* | contratti/retainer, time tracking, spese campagne/ads → tutto in Finanza con `sector:'strategico'` |

> **(target Aulico) Cascata ROE di Unico** — modello analitico richiesto:
> Terreno/Immobile + Agenzia **3%** + Notaio + **Progettazione Onirico 15%** (del
> costo di realizzazione) + Opere + **Promozione Strategico €10.000** + **Rivendita
> 4%** → confronto col prezzo di rivendita = margine netto, tempi di ritorno, ROE.
> Le voci "Onirico 15%" e "Strategico €10k" sono i **flussi inter-società** resi
> espliciti (costi per Unico, ricavi per le altre). Dettaglio in `VISIONE-AULICO.md` §6.

I colori società (`COMPANY_COLOR`) attraversano tutta l'UI per orientare a colpo
d'occhio.

---

# C. Lato Studio — interfaccia interna

Navigazione: **Sidebar** (desktop) / **Navbar** (mobile). Routing **a hash**
(`#dashboard`, `#progetto/<id>`…). Voci sidebar (dipendono dal ruolo):

`Dashboard · Calendario · Progetti · CRM(admin/manager) · Richieste(admin/manager) ·
Finanze(admin/manager) · Team(admin) · Cestino(admin/manager)`.

## C1. Dashboard (`DashboardView`)
Home operativa: panoramica progetti attivi, **Agenda di oggi**, box **"Messaggi &
richieste"**, elementi pinnati. Punto di partenza giornaliero. Gli archiviati non
compaiono.

## C2. Calendario / Agenda (`CalendarView`)
- Viste **Giorno · Settimana · Mese** (tasti statici).
- Mostra **task dell'utente** (anche multi-assegnatario, `Task.assignees`) +
  **appuntamenti** di cui è partecipante.
- **Appuntamenti** (`appointments/<id>`) multi-partecipante: `participants
  {uid: pending|confermato|rifiutato}`. Stato complessivo grigio finché tutti
  confermano → verde. Notifiche su invito/conferma/rifiuto/annullamento.
- Popup **"Nuovo appuntamento"**: selezione libera "Con" tra team+clienti+partner.
- Popup **"Nuovo impegno"** (task): più assegnatari, collegabile a una pratica
  (`projectId`) → il task appare anche nel fascicolo.
- **Pannello Ferie/assenze** (`teamLeave`): inserimento con notifica a tutto il
  team (reminder 7gg prima via Cloud Function / fallback in-app).

## C3. Progetti (`ProjectsView`) — il cuore operativo
Organizzato per **divisioni** (tab società). Lista pratiche → **fascicolo
progetto** (`#progetto/<id>`) con tab interne.

**Creazione progetto (`Nuovo progetto`):**
- divisione dedotta dal tab attivo;
- **cliente dalla rubrica** (`clientRecordId`, auto-compila) + opzionale
  collegamento all'account portale (`clientUid`);
- indirizzo strutturato (via/civico/cap/comune/provincia → `indirizzoImmobile`);
- **dati catastali multipli** (`catastali[]`);
- dalla **data inizio**: i task delle fasi vengono **pianificati in sequenza**
  (`durationDays`) e **auto-assegnati per mansione** (`UserProfile.functions`) al
  membro con meno task aperti.

**Tab del fascicolo** (variano per divisione/ruolo):
- **Fasi & avanzamento** — fasi/task, modello 13 step con viewer 3D
  (`ThreeDProgress`, GLB in `public/model/`).
- **Documenti** (`DocumentsView`) — vedi E1.
- **Arredi & Moodboard** (`FurnishingsBoard`) — vedi E2.
- **Cantiere** (`CantiereBoard`) — vedi E3.
- **Contabilità di commessa** (admin/manager) — quadro economico automatico
  (valore opera, parcella, ricavi/incassato/da-incassare, margine, SAL); i
  pulsanti Registra costo/ricavo/scadenza scrivono sui **nodi finanza globali**
  con `projectId`+`sector` → confluiscono nel consolidato.
- **Contabilità & Bilancio** → pannello **Preventivi & Parcelle** (`QuoteEditor`).
- **STRATEGICO** (per admin/manager): la divisione mostra **direttamente**
  `StrategicoView` (modulo marketing project-centric, vedi E6).
- **UNICO** → sotto-tab **"Operazioni & Investitori"** (`UnicoStudioView`, E5).

**Archiviazione**: `Project.archived` → esce da tutte le liste, compare solo nel
filtro "Archivio".

## C4. CRM (`CrmView`) — admin/manager
- **Pipeline lead** (`crmLeads`): conversione lead → commessa.
- **Fornitori/partner** (`crmSuppliers`): match per tipo lavorazione (usato da
  Materico per suggerire partner).
- **Rubrica clienti** (`clients`, `ClientRecord`): anagrafica riutilizzabile,
  anche clienti **senza login** (privato/azienda con CF/P.IVA/PEC/SDI). Campi
  estesi: `tier` (fasce 1/2/3 + filtro), `responsabili`, `whatsapp`. Scheda con
  storico progetti + **quadro pagamenti** (fatturato/incassato/da incassare +
  scadenze da sollecitare con link email/WhatsApp). Auto-compila il form progetto.

## C5. Richieste clienti (`ClientRequestsView`) — admin/manager, `#richieste-clienti`
Brief inviati dai clienti dal portale ("La tua idea", `clientRequests`). Azioni:
**Prendi in carico** · **Converti in progetto** (crea `projects/<pid>`, collega
cliente, porta la moodboard 3D, notifica) · **Chiudi**. Le richieste Materico dal
flusso unificato generano comunque una `MatericoRequest`.

## C6. Finanze (`FinanzeView`) — admin/manager
Hub finanziario della holding. Selettore **Società** (Studio·Strategico·Materico·
Unico·**Consolidato**). Tab:
- **Parcelle & Onorari** — calcolo automatico (motore `finance.ts`).
- **Preventivi & Parcelle** (`QuotesView`, `quotes`) — vedi E7.
- **SAL** — SAL approvati non fatturati → "Emetti bozza fattura".
- **Fatture attive/passive, Scadenze, Banca** — libri per società, numerazione
  `FE-STU/STR/MAT/UNI`; import computo da **CSV**; Conto Economico per società +
  Consolidato. Cash-flow/banca **simulati** (etichettati).
- **Statistiche & BEP** (`StatsView`) — cruscotto direzionale: redditività per
  società+gruppo, incassato vs da incassare, **break even point**, andamento 12
  mesi, portafoglio commesse + pipeline preventivi, carico per risorsa. Calcola
  su dati esistenti, nessun nodo nuovo. (`#statistiche` redirige qui col tab.)

**Motore `finance.ts`** (funzioni pure): `studioParcella`, `matericoMargin`,
`unicoMargin`, `consolidato`, `arrediTotals`, `computoTotal`, `quoteTotals`,
`docTotals`/`invoiceTotals`, parser CSV. Costanti override-abili: `STUDIO_FEE_PCT
=0.15`, `ARREDI_MOBILI_FEE_PCT=0.20`, `MATERICO_MARKUP_PCT=0.15`, IVA 22%, cassa 4%.

## C7. Team (`TeamView`) — admin
Gestione iscritti: ruoli, **mansioni** (`functions`, usate per l'auto-assegnazione
task), dati. **Dashboard produttività** per collaboratore (task aperti/urgenti/
scaduti/completati per settimana/mese).

## C8. Cestino (`TrashView`) — admin/manager, `#cestino`
Ogni eliminazione passa di qui per **60 giorni** poi purge automatico. Ripristino
per sezione. Vedi E8.

---

# D. Lato Portale (cliente / partner / investitore)

## D0. Vetrina cinematica (`CinematicShowcase`) — landing pubblica
La landing di `AuthFlow` è una pagina cinematica a tutto schermo con **video
continuo** di sfondo: rotella/swipe scorrono il video tra **scene** mappate su
secondi precisi. CTA "Inizia il tuo progetto" (registrazione) / "Sono già cliente"
(login). Config `LANDING_SHOWCASE` in `showcaseData.ts`.

## D1. Portale cliente (`ClientPortalView`)
Per `cliente`/`azienda`. Vede **solo i propri progetti** (via `clientUid`) e:
- **Fascicolo** dei propri progetti (fasi/avanzamento, documenti, messaggi/chat).
- **Quadro economico** read-only (`projectEconomics`, scritto dallo studio): solo
  ricavi (computo, arredi, parcella, piano SAL, fatture/scadenze). Mai costi/margine.
- **Arredi & Moodboard** (anche moodboard 3D) — può creare/aggiornare i propri item.
- **"La tua idea" / Richieste** (`ClientRequestPanel`): brief per Studio/Strategico/
  Unico (+ moodboard 3D opzionale) e richieste Materico — lista unificata.
- **Richieste/Preventivi Materico** e **Lavori in corso** (flusso Materico, E4).
- **I miei investimenti** (`MyInvestmentsPanel`, se investitore Unico, E5).
- **Marketing** (`MarketingPortalPanel`): RSVP eventi, compilazione sondaggi.
- **Vetrina servizi** (`ServicesShowcase`): pagine Studio/Materico/Strategico/Unico;
  Unico mostra gli immobili-investimento **pubblicati** (`unicoShowcase`), con tour
  video cinematico; fallback demo se vuoto.
- **i18n IT/EN** (layer in casa `src/i18n.tsx`) per tutto il client/login/vetrina.

## D2. Portale partner Materico (`MatericoPortal`)
Per `partner`. Riceve richieste inoltrate, invia **offerte** (importo + note).

## D3. Portale partner Cantiere
Per `materico_partner`: tab **"Cantieri"** (cantieri assegnati via
`partnerCantieri`) + **"La mia impresa"** (`ImpresaArea`: profilo impresa
riutilizzabile). Stesso `CantiereBoard` con `mode:'partner'`. Vedi E3.

## D4. Portale investitore Unico
Pannello "I miei investimenti": posizione **privata** (`unicoInvestorPositions/
<uid>`) — conferito, quota%, n° quote, rendimento atteso, aggiornamenti, proprie
distribuzioni. Mai costi/nomi altrui. Vedi E5.

---

# E. Moduli trasversali (dettaglio operativo)

## E1. Documenti (`DocumentsView`)
Nodo `documents/<pid>/<docId>` (scrittura **mirata per-elemento** così anche i
clienti creano i propri). Chat di progetto: `projectMessages/<pid>/<msgId>`
(unsend entro 60s lato portale). Include il **generatore modulistica**
(`public/generatore-modulistica.html`).

## E2. Arredi & Moodboard (`FurnishingsBoard`)
Nodo `projectFurnishings/<pid>/<itemId>` (`Furnishing`):
- arredi **fissi** (impatto progettuale + scadenza) vs **mobili** (estetici), con
  `price`/`quantity` → entrano nella base parcella;
- **Moodboard 3D** (R3F, `src/components/moodboard3d/`): overlay a tutto schermo,
  nodo `projectMoodboard3d/<pid>`, autosave (debounce ~1,5s) + salva alla chiusura.
  Lazy-loaded (chunk separato). La vecchia lavagna 2D (`Furnishing.board`) è
  deprecata.
Usato identico lato studio e lato cliente.

## E3. Cantiere (`CantiereBoard`, `mode:'studio'|'partner'`)
Modulo studio ↔ impresa partner, modellato sul PDF a **3 aree**:
- **Campi condivisi**: Panoramica (`CantierePanoramica`, KPI cliccabili), Giornale
  di cantiere (`GiornaleCantiere`, calendario + voce D.M. 49/2018), Dati generali,
  Localizzazione, Cliente, Foto (timestamp + GPS best-effort), Attività & Scadenze,
  Documenti, Comunicazioni/Chat (`cantiereMessages`, unsend 60s).
- **Area Tecnici**: SAL, Cronoprogramma, Verifiche, Non conformità, Verbali/Ordini
  di servizio, Sicurezza POS/PSC/DUVRI, Progettazione, Doc tecnica, Controllo
  qualità (Collaudi & test materiali), Storico.
- **Area Impresa** (profilo partner riutilizzabile, keyed per uid): Documentazione
  (`impresaDocs`), Squadre/Operai/Mezzi/Sicurezza (`impresaRecords`), Magazzino &
  ordini, Manutenzioni & guasti.

**Dati**: `cantieri/<cid>` (record, `partnerUids`) + sotto-collezioni per-elemento
(`cantiereRapportini|Presenze|Foto|Materiali|Checklist|Documenti|Sal|Log|Records|
Messages`). Indice inverso `partnerCantieri/<uid>/<cid>` per la lista lato partner.
Registri generici: `cantiereRecords` (discriminato da `section`), `cantiereDocumenti`
(con `section`/`category`/`expiry`).

**Flussi chiave**: lo studio (DL) compila voci giornale auto-approvate, il partner
invia rapportini da approvare; **SAL → finanza** (`handleApproveSal` → in Finanze
"Emetti bozza fattura", `linkedInvoiceId` evita doppioni); avanzamento allineato
all'ultimo SAL approvato. **File**: `DriveUploader` (Google Drive reale, vedi F)
con fallback "incolla link".

## E4. Materico (flusso forniture/posa)
1. **Cliente** crea richiesta (titolo, tipo lavorazione, quantità, link, note).
2. **Operatore** (`MatericoView`, admin/manager): inbox → suggerisce partner per
   tipo lavorazione → **inoltra** ai partner selezionati.
3. **Partner** invia offerta (`offers[uid]`).
4. Operatore vede offerte **ordinate per prezzo**, applica il **margine**, invia
   al cliente con **bozza contratto**.
5. **Cliente** accetta/rifiuta, scarica la bozza.

**Dati**: `matericoRequests/<id>` (blindato: read collezione solo studio;
cliente/partner per-`$id`). Indici inversi `clientMaterico/<uid>` e
`partnerMaterico/<uid>`. Scritture partner/cliente granulari (`offers/<uid>`,
`status`). `forwardedTo` = mappa `{uid:true}`. TODO: firma digitale, PDF.

## E5. Unico (operazioni immobiliari + investitori)
Lato studio (`UnicoStudioView`, sotto-tab di Progetti/UNICO):
- **Operazioni** (`unicoDeals`, `UnicoDeal`): acquisto/ristrutturazione/rivendita,
  ROI/margine; **SPV/cap table** (`spvName`/`spvVat`/`unitPrice` + quote per
  investitore).
- Tab **Rendiconto** (riparto profitto + distribuzioni) e pannello **Aggiornamenti**
  (notifica gli investitori collegati).
- Pulsante **"Vetrina"** → `UnicoShowcaseEditor` (vedi E9).

**Snapshot derivati** (write-through da `saveUnicoDeals`):
- `unicoShowcase/<dealId>` — **pubblico**, solo campi divulgabili (no costi/nomi).
- `unicoInvestorPositions/<uid>/<dealId>` — **privato** per investitore (solo la
  sua posizione). Letto dal portale ("I miei investimenti").

## E6. Strategico / Marketing (`StrategicoView`) — architettura project-centric
Dentro Progetti → divisione STRATEGICO (admin/manager). **Organizzato per
progetto** (`MktProject`), IA a 3 livelli:
- **Livello 0/1 — Home**: pillbar Dashboard · Progetti · Lead · Contratti ·
  Consensi · Libreria · Automation. La Dashboard è overview (KPI globali + griglia
  progetti + alert + Analisi).
- **Livello 2 — workspace di progetto** (`ProjectWorkspace`): Panoramica ·
  Deliverable · Revisioni · Campagne · Social · Eventi · Ads · SEO · Sondaggi ·
  Analytics · Time · Inbox · Report. Ogni entità filtrata per `mktProjectId`.

**Aree funzionali e nodi:**
- **Acquisizione**: Lead (`mktLeads`, pipeline 6 fasi + scoring), Automation
  (`mktFlows`, nurturing multi-step via link), SEO (`mktSeo`, keyword + brief con
  outline AI), Ads (`mktAds`, spesa → fattura passiva Finanza).
- **Produzione**: Asset library (`mktAssets`), Deliverable kanban
  (`mktDeliverables`, 5 colonne), Proofing/Revisioni (`mktProofs`, annotazioni
  contestuali + versioning).
- **Relazione**: Eventi & inviti (`mktEvents`, RSVP dal portale via
  `mktInvitesIndex`), Campagne & follow-up (`mktCampaigns`, link mailto/wa.me),
  Sondaggi (`mktSurveys` + `mktSurveyResponses`), Social (`mktSocial`, calendario
  editoriale), Inbox (`mktInbox`).
- **Economia** → confluisce in Finanza (`sector:'strategico'`): Contratti/Retainer
  (`mktContracts`, MRR + emissione fatture), Time tracking (`mktTimeEntries`,
  ore → fatturazione).
- **Dati & Compliance**: Analytics (`mktMetrics`, manuale/pluggable), Consensi GDPR
  (`mktConsents`), Attività (feed derivato).
- **Direzione**: Report white-label stampabile + **AI assist** (`AiAssist` →
  Cloud Function `aiGenerate` Anthropic).

Le entità globali (non per progetto) restano senza scope: `MktLead, MktContract,
MktConsent, MktAsset, MktFlow`. Voci legacy senza `mktProjectId` → bucket
"Non assegnati".

## E7. Preventivi & Parcelle (`QuotesView` + `QuoteEditor`)
Vivono in **Finanze → tab "Preventivi & Parcelle"** (differenziato per società).
Nodo `quotes/<id>` (`Quote`): `docKind` preventivo|parcella, righe per macro-voce,
stati (Elaborato/In attesa/Accettato/Rifiutato), **IVA/cassa spuntabili**, **piano
pagamenti** (`PaymentMilestone`). Cliente dalla rubrica. `handleEmitMilestone`:
una rata → bozza fattura attiva + scadenza nei nodi finanza. Editor riusato nel
fascicolo progetto.

## E8. Cestino, doppia conferma, archiviazione
- **Cestino** (`trash/<id>`, `TrashItem`): `moveToTrash(section, label, payload…)`;
  ripristino `handleRestoreTrash` (switch per `section`); purge dopo 60gg.
  Copre quasi tutte le sezioni (progetti, task, preventivi, fatture, scadenze,
  documenti, arredi, appuntamenti, Materico, rubrica, CRM, Unico, cantieri+voci,
  Area Impresa, ferie, tutti i `mkt-*`).
- **Doppia conferma** (`ConfirmDeleteModal` + `askDelete`): primo click arma,
  secondo conferma. Tutti i delete passano di qui (niente `window.confirm`).
- **Archiviazione progetti** (`Project.archived`).

## E9. Vetrina / Showcase (`CinematicShowcase`, `ServicesShowcase`)
- Landing login = cinematica (`LANDING_SHOWCASE`).
- Per-operazione Unico: `UnicoShowcaseEditor` → `UnicoDeal.showcase` + `published`
  → write-through su `unicoShowcase` (solo campi divulgabili).
- Cliente: `ServicesShowcase` usa le entry pubblicate (tour video cinematico),
  fallback demo `UNICO_PROPERTIES`.
- Video **sempre URL online** (Firebase Storage), un mp4 continuo per pagina.

## E10. Notifiche & reminder
- `notifications/<uid>/<id>` (`Notification`): persistenti. Scritte da
  `pushNotification`/`notifyStudio` (App) e dalle Cloud Functions. Centro Notifiche
  desktop+mobile; click apre `link` (hash).
- **Reminder**: Cloud Function `dailyReminders` (ferie 7gg, scadenze 3gg) **o**
  fallback in-app "soft" se le Functions non sono deployate (dedup per id).

---

# F. Infrastruttura

## F1. Stack
React 19 + TypeScript, **Vite 6**, Tailwind v4, `firebase` v11 (Auth Google +
Realtime DB), `three` r0.184 (viewer 3D + moodboard R3F), `motion`, `lucide-react`.
Routing **a hash**, `base:'./'` (gira su qualunque path GitHub Pages).

## F2. Architettura codice
- **`src/App.tsx`** (~3100 righe): stato globale, sottoscrizioni Firebase, tutti
  gli handler, router a hash (`renderView()` con `switch(route)`), modali,
  notifiche. La maggior parte delle feature si cabla qui.
- **`src/firebase.ts`**: init + helper (`watchNode`, `getNode`, `writeNode`,
  `updateNode`, `removeNode`, `clean()`, auth/account helpers, `callAi`).
- **`src/types.ts`**: tutte le interfacce.
- **`src/finance.ts`**: motore finanziario + costanti + colori/label società.
- **`src/utils.ts`**: `safeUrl`, `composeAddress`, normalizzazione legacy, ecc.
- **`src/components/`**: viste e widget.
- **`firebase-rules.json`**: regole DB (da ripubblicare a mano quando si aggiunge
  un nodo).
- **`functions/`**: Cloud Functions (TS, region europe-west1).

## F3. Persistenza (come si scrive sul DB)
- `syncState(key, val)` scrive l'intero nodo (mappa `KEY2PATH`, es.
  `finance→studioFinance`). `users` → per-uid.
- Le collection a regole granulari (`documents`, `projectMessages`,
  `matericoRequests`, sotto-collezioni cantiere, `projectFurnishings`) si scrivono
  **per-elemento**, non come oggetto intero.
- Sottoscrizioni keyed su `currentUser.uid/role`: ramo **studio** (tutte le
  collection) vs ramo **cliente/partner** (solo i propri dati).
- **Sempre `clean()`** scrivendo (rimuove `undefined`; `writeNode` lo fa già).

## F4. Sicurezza (`firebase-rules.json`)
Team active legge/scrive dati studio; finanza solo admin/manager; clienti accedono
ai propri progetti via `clientUid`; `users` protetto da auto-promozione (whitelist
email admin). `matericoRequests` blindato (read collezione solo studio).
**Regola operativa: ogni nuovo nodo → aggiornare le regole + ricordare all'utente
di ripubblicarle** (altrimenti "permission denied" con write silenziose lato client).

## F5. Backend — Cloud Functions (`functions/`)
firebase-functions v2, SendGrid (`SENDGRID_KEY`), Anthropic (`ANTHROPIC_KEY`).
Funzioni: `onQuoteStatusChange`, `dailyReminders`, `weeklyReport`/`monthlyReport`,
`aiGenerate` (callable AI), `marketingMonthlyReport`. **Deploy a carico utente**
(Blaze + secrets). Fallback in-app dove possibile.

## F6. Integrazioni esterne (setup utente, una tantum)
- **Auth**: abilitare Google + Email/Password + domini autorizzati.
- **Realtime DB**: pubblicare `firebase-rules.json`.
- **Google Drive** (upload Cantiere): Drive API + OAuth client → `src/drive.ts`
  (`DEFAULT_CLIENT_ID`). Senza config → fallback "incolla link".
- **Firebase Storage** (video vetrina): piano Blaze; caricare mp4 in `vetrina/` →
  URL di download nel campo Video.
- Modelli **GLB** in `public/model/step-01..13.glb`.

## F7. Build & deploy
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # dist/ (esbuild: NON fa type-check)
```
Deploy automatico: push su `main` → GitHub Pages (`.github/workflows/deploy.yml`).
`npx tsc --noEmit` ha errori di tipo **preesistenti** (codice ereditato) che **non
bloccano** `vite build` — non inseguirli, verifica con `npm run build`.

---

# G. Glossario dei nodi Realtime DB (riferimento rapido)

| Nodo | Contenuto | Scope |
|---|---|---|
| `users/<uid>` | account/profilo | per-uid |
| `directory/<uid>` | `{name,role}` membri studio | leggibile anche portali |
| `projects/<pid>`, `tasks`, `templates`, `projectsInternal`, `estimates` | progetti & affini | studio |
| `documents/<pid>/<id>`, `projectMessages/<pid>/<id>` | documenti & chat | granulare |
| `projectFurnishings/<pid>/<id>` | arredi/moodboard 2D | studio + cliente |
| `projectMoodboard3d/<pid>` | moodboard 3D (nodo intero) | studio + cliente |
| `projectEconomics/<pid>` | quadro economico read-only portale | write studio, read cliente |
| `appointments/<id>` | agenda multi-partecipante | partecipanti |
| `studioFinance` + `finComputi`/`finInvoicesActive`/`finInvoicesPassive`/`finScadenze`/`finBank` | finanza | admin/manager |
| `quotes/<id>` | preventivi & parcelle | admin/manager |
| `crmLeads`, `crmSuppliers`, `clients/<id>` | CRM + rubrica | studio (clients: admin/manager) |
| `matericoRequests/<id>` + `clientMaterico`/`partnerMaterico` | flusso Materico | blindato |
| `clientRequests/<clientUid>/<id>` | "La tua idea" | cliente + studio |
| `notifications/<uid>/<id>`, `teamLeave/<id>` | notifiche, ferie | per-uid / studio |
| `unicoDeals` + `unicoShowcase/<id>` + `unicoInvestorPositions/<uid>/<id>` | Unico (privato/pubblico/investitore) | misto |
| `cantieri/<cid>` + `cantiere*` + `partnerCantieri/<uid>` | Cantiere | studio + partner assegnato |
| `impresaDocs/<uid>`, `impresaRecords/<uid>` | Area Impresa | partner proprietario + studio |
| `trash/<id>` | Cestino | team active non-cliente |
| `mktProjects` + `mktEvents`/`mktCampaigns`/`mktSurveys`/`mktSurveyResponses`/`mktSocial`/`mktContracts`/`mktTimeEntries`/`mktAssets`/`mktDeliverables`/`mktProofs`/`mktLeads`/`mktFlows`/`mktSeo`/`mktAds`/`mktMetrics`/`mktInbox`/`mktConsents` + `mktInvitesIndex/<uid>` | Strategico/Marketing | studio (alcuni leggibili dal portale) |

---

# H. Spunti per la mappa concettuale

Nodi di primo livello suggeriti per il diagramma:
1. **Attori** (A) → linee verso le aree che usano.
2. **Società** (B) → ognuna collegata ai suoi moduli (Studio→Progetti/Cantiere/
   Finanze; Materico→flusso Materico; Unico→operazioni+vetrina+investitori;
   Strategico→marketing).
3. **Aree applicative** (C lato studio / D portale) → moduli trasversali (E).
4. **Moduli** (E) → nodi DB (G) e handler in App.tsx.
5. **Infrastruttura** (F) come strato trasversale sotto tutto.

Relazioni "interessanti" da evidenziare:
- *Cliente↔Pratica* via `clientUid` + `projectIds`.
- *Preventivo/SAL/Time/Ads/Contratto → Finanza* (tutti convergono nei nodi finanza
  con `projectId`/`sector`).
- *Studio → Snapshot read-only* per i portali (`projectEconomics`, `unicoShowcase`,
  `unicoInvestorPositions`).
- *Indici inversi* che abilitano le viste portale (`clientMaterico`,
  `partnerMaterico`, `partnerCantieri`, `mktInvitesIndex`).
- *Cestino* come "rete di sicurezza" sotto ogni eliminazione.

---

# I. Estensioni Aulico (target — da implementare)

Sintesi delle funzionalità richieste dal feedback strategico ma **non ancora nel
codice**. Specifica completa + riconciliazione in **`VISIONE-AULICO.md`**.

1. **Rebrand Aulico** + RBAC granulare per-società (§A note target).
2. **Strategico Point of Entry**: tutti i lead/richieste preventivo entrano da
   Strategico e vengono smistati.
3. **Onirico — funnel commessa**: voci di costo predefinite → preventivo rapido →
   **firma OTP** → generazione automatica "Cartella Cliente" + task. Fasi
   Pianificazione/Progettazione/Esecuzione/**Abilitazione**. Naming commessa
   obbligatorio `Cliente + Località`. **Gamification** cliente al rilascio agibilità.
4. **Unico — cascata ROE** analitica (§B note target).
5. **Materico — contratti OTP, penali automatiche** sui ritardi, **point system**
   incentivi, report cantiere sicurezza/pulizia/logistica.
6. **Automazioni**: render **AI da foto+questionario**; **alert 60gg** scelte
   estetiche con remind giornaliero + blocco cantiere; **report settimanale
   automatico** al cliente; **WhatsApp + OTP** (backend/provider).
7. **KPI di gruppo**: funnel Preventivato → Venduto → Erogato → Fatturato →
   Incassato → Liquidità, per società + consolidato (estensione di `StatsView`).
8. **Futuro**: 5ª società **Gestione Immobili / affitti** sullo stesso hub.

---

*Manuale di riferimento. Quando si aggiunge un modulo, aggiornare la sezione
pertinente + il glossario nodi (G) + `CLAUDE.md` + `VISIONE-AULICO.md`.*
