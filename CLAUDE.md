# CLAUDE.md — Aulico (ex Onirico Studio OS)

Contesto progetto per Claude Code. Leggere **tutto** prima di modificare.

## 1. Cos'è
Gestionale/ERP web dello **studio Onirico** (architettura/ingegneria, Puglia) e
delle sue società controllate. Single-page app React con backend **Firebase
Realtime Database**, accesso **Google** con approvazione admin, deploy su
**GitHub Pages**. Tutto ciò che accade nell'app è **condiviso in tempo reale**
sul Database (niente dati locali, niente dati finti).

Le "divisioni"/società:
- **Studio** — architettura, pratiche edilizie (catasto, CILA/SCIA, APE…).
- **Materico** — società controllata: riceve richieste clienti (forniture/posa),
  le subappalta a imprese partner aggiungendo un margine, coordina i lavori.
- **Unico** — società controllata: acquisto immobili → ristrutturazione (via
  Materico) → rivendita, con investitori. Lato studio: modulo **operazioni
  immobiliari + investitori + ROI** (`UnicoStudioView`, sotto-tab "Operazioni &
  Investitori" nella divisione UNICO di Progetti; nodo `unicoDeals`). Lato
  cliente: vetrina investimenti (`ServicesShowcase`: mostra gli immobili
  **pubblicati** dal nodo `unicoShowcase`, fallback demo se vuoto — vedi §21).
- **Strategico** — società controllata: marketing per le altre società e per
  clienti esterni. *(modulo dedicato non ancora costruito)*

## 2. Stack
- React 19 + TypeScript, **Vite 6**, Tailwind v4 (`@tailwindcss/vite`).
- `firebase` v11 (Auth Google + Realtime Database).
- `three` r0.184 (viewer 3D), `motion` (Framer Motion), `lucide-react` (icone).
- Routing **a hash** (`#dashboard`, `#progetto/<id>`…), nessun router lib.
- `base: './'` in `vite.config.ts` → funziona su GitHub Pages a qualsiasi path.

## 3. Avvio / build / deploy
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # output in dist/ (esbuild: NON fa type-check)
```
- Deploy automatico: `.github/workflows/deploy.yml` (push su `main` → Pages).
- **Nota**: `npx tsc --noEmit` riporta errori di tipo *preesistenti* nel codice
  ereditato da Google AI Studio; **non bloccano** `vite build` (esbuild ignora i
  tipi). Non inseguire quegli errori; verifica sempre con `npm run build`.

## 4. Architettura
- **`src/App.tsx`** (~3100 righe) è il cuore: stato globale, sottoscrizioni
  Firebase, tutti gli handler, il router a hash (funzione `renderView()` con uno
  `switch(route)`), i modali, le notifiche. La maggior parte delle feature si
  cabla qui.
- **`src/components/`**: viste e widget (vedi sotto).
- **`src/firebase.ts`**: init Firebase + helper. Config reale già inclusa
  (progetto `aulico-228bd`). Espone: `loginWithGoogle`, `logoutGoogle`,
  `watchAuth`, `watchAccounts`, `watchOwnAccount`, `getAccounts`, `setAccount`,
  `updateAccount`, `removeAccount`, e i generici `watchNode(path,cb)`,
  `getNode(path)`, `writeNode(path,val)`, `updateNode`, `removeNode`, `clean()`.
  `clean()` = `JSON.parse(JSON.stringify(v))` per togliere `undefined` (Firebase
  li rifiuta) — **usare sempre** scrivendo sul DB (writeNode lo fa già).
- **`src/types.ts`**: tutte le interfacce (UserProfile, Project, Task, Template,
  Appointment, MatericoRequest, ecc.).
- **`firebase-rules.json`**: regole del Realtime Database (da pubblicare a mano
  su Firebase Console quando si aggiungono nodi).

### Componenti principali
`Sidebar`/`Navbar` (nav desktop/mobile), `DashboardView`, `CalendarView`
(agenda Giorno·Settimana·Mese), `ProjectsView`, `DocumentsView`, `CrmView`
(pipeline lead + fornitori), `MatericoView` (hub operatore Materico),
`MatericoPortal` (lato cliente/partner), `FinanzeView`, `TeamView`,
`ClientPortalView` (portale cliente/partner, ~3000 righe). Per il **ruolo `cliente`** (`isClientApp`)
è una **shell "app" con bottom-nav fissa a 3 pagine** (`activeSubTab` ∈ `dashboard|progetti|profilo`
+ le tab di **dettaglio progetto**; `SPECIAL_TABS`, `inProjectDetail`, `pillTabs`):
  • **Dashboard** = home che **sta in una schermata** (niente scroll): widget **Avanzamento progetti**
    (→ Progetti) + griglia **Raccontaci il tuo sogno** (`ClientRequestPanel` in overlay), **Avvisi**
    (overlay: messaggi studio + inviti marketing/investimenti), **Quiz del giorno** (`DailyQuiz`),
    **Completa il tuo profilo** (gamification). I widget aprono **overlay** (`dashModal`), non scorrono.
    In più un box **Unico — Investimenti immobiliari** che apre `ServicesShowcase` con `initialView='unico'`
    (la **vetrina immobili** lato cliente). NB: **Unico è escluso da "Racconta il tuo sogno"**
    (`SELECTABLE_DIVISIONS` in `ClientRequestPanel`) — lato cliente è vetrina, non richiesta-progetto.
  • **Progetti** = tutte le **card progetto**; tap → **dettaglio** (pillbar per-progetto:
    Avanzamento/Documenti/Arredi+moodboard/Contabilità/Blog) con back "← Progetti".
  • **Profilo** = `ClientProfileModal` in **`page` mode** (foto, telefono, residenza, password,
    consensi/newsletter inline, elimina account). Il profilo è **tolto dalla topbar**.
  Gli **altri ruoli** (partner/strategico) mantengono il **pillbar** classico (nessuna bottom-nav).
  In topbar il brand è **"Aulico"**; niente selettore progetto né banner newsletter. `ServicesShowcase`
(sezione "Scopri i servizi" del portale: pagine vetrina Studio/Materico/
Strategico/Unico accanto ai progetti; Unico ha la vetrina immobili-investimento
con dati **fittizi** da `src/showcaseData.ts` — contenuti demo, non su Firebase),
`AuthFlow` (onboarding pubblico, vedi §5; la landing è la pagina **cinematica**
`CinematicShowcase`, vedi §21), `UnicoStudioView` (modulo Unico lato
studio: operazioni immobiliari + investitori + ROI, nodo `unicoDeals`; pulsante
"Vetrina" → `UnicoShowcaseEditor`, vedi §21),
`FurnishingsBoard` (modulo "Arredi & Moodboard": scelte materiali/arredi —
**fissi** con impatto progettuale+scadenza vs **mobili** estetici — e lavagna
moodboard drag-and-drop; nodo `projectFurnishings`; usato identico lato studio in
`ProjectsView` tab "Arredi & Moodboard" e lato cliente in `ClientPortalView`),
`CantiereBoard` (modulo "Cantiere", §15: dashboard studio + portale partner — rapportini,
presenze, foto, materiali, checklist, documenti, SAL/avanzamento, storico; include
`DriveUploader` con fallback link), `AccessRequests`
(approvazione accessi), `GoogleLogin`, `Modal`, `ThreeDProgress` (GLB a 13 step),
`SmartText`, `AppleSwitch`, `MotionTabsMenu`, `PinnedList`, `StatusCard`,
`InteractiveView`, `QuotesView`+`QuoteEditor` (preventivi/parcelle, vedi §16 — vivono
dentro Finanze, non più voce sidebar), `TrashView` (Cestino condiviso, vedi §20),
`ConfirmDeleteModal` (doppia conferma eliminazione, vedi §20).

## 5. Autenticazione & ruoli (IMPORTANTE)
- Accesso con **email+password** *oppure* **Google** (`src/components/AuthFlow.tsx`:
  landing pubblica vetrina → Accedi / Registrati → form). Gli account vivono nel
  nodo **`users/<uid>`**. `GoogleLogin.tsx` è il vecchio schermo, non più usato.
- **Iscrizione** = l'utente sceglie il **tipo account** (`accountType`):
  - **`cliente`** (privato) e **`azienda`** (con P.IVA, CF, PEC, SDI, sede, settore)
    → `role:'cliente', status:'approved', active:false` **auto-approvati**: accesso
    immediato al portale. (Distinti solo da `accountType`/dati; stesso ruolo portale.)
  - **`team`** (collaboratore) → `status:'pending'`, **nessun ruolo** finché
    admin/manager non lo approva da **Gestione accessi** (`AccessRequests`).
  - Form raccoglie sempre: nome, cognome, email, telefono, residenza + **privacy**
    (`profileComplete:true` quando finito). Chi entra con Google senza scheda vede
    lo schermo "Completa la registrazione" (stesso form, senza password).
- **Bootstrap admin**: il primo utente in assoluto, **oppure** l'email
  `giorgio.pascali990@gmail.com`, diventa `role:'admin', active:true,
  status:'approved', profileComplete:true` (effetto auth in App + whitelist regole).
- Ruoli: `admin | manager | staff` = **team "active"** (vedono i dati studio;
  finanza solo admin/manager). `cliente | partner` = **portale** (`active:false`,
  vedono solo i propri progetti via `clientUid` + le proprie richieste Materico).
- **Gestione accessi**: admin **e manager** (`canManageAccess`). Il manager può
  approvare/assegnare ruoli ma **non** creare admin (vincolo anche nelle regole).
- `currentUser` impostato solo se `status==='approved' && role`. Lo stato
  **`ownProfile`** tiene il proprio record `users/<uid>` SEMPRE (anche non-active),
  così il render decide registrazione/attesa/rifiuto anche per cliente/azienda
  (non leggibili da `accounts`, popolato solo per utenti active). I clienti
  caricano solo i propri progetti per id. Il nodo **`directory`** dà ai portali
  l'elenco dei membri studio.
- **Collegamento cliente↔pratica**: in Nuovo progetto / Modifica c'è il select
  "Collega cliente registrato" (`pClientUid`) → scrive `clientUid` sul progetto e
  `projectIds[pid]=true` sul cliente. Disponibile ad admin **e manager**.

## 6. Modello dati (nodi Realtime Database)
- `users/<uid>` — account (campi: uid, name, email, photoURL, role, active,
  status, sector?, projectIds?, createdAt…).
- `directory/<uid>` — `{name, role}` dei membri studio (scritto dall'admin; letto
  anche dai portali).
- `projects/<pid>`, `tasks/<id>`, `templates/<id>`, `projectsInternal/<id>`,
  `estimates/<id>`.
- `studioFinance/<id>` + nodi finanza dedicati: `finComputi`, `finInvoicesActive`,
  `finInvoicesPassive`, `finScadenze`, `finBank` (array; admin/manager). Le interfacce
  di questi nodi e il **motore di calcolo** vivono in **`src/finance.ts`** (funzioni
  pure: `studioParcella`, `matericoMargin`, `unicoMargin`, `consolidato`, `arrediTotals`,
  `computoTotal` + parser CSV `parseCsv`/`rowsToComputoItems`; costanti override-abili
  `STUDIO_FEE_PCT=0.15`, `ARREDI_MOBILI_FEE_PCT=0.20`, `MATERICO_MARKUP_PCT=0.15`).
- `projectEconomics/<pid>` — **snapshot read-only per il portale cliente** (scritto da
  `FinanzeView` lato studio): quadro economico calcolato (computo, arredi fissi/mobili,
  parcella 15%/20%, piano SAL) + fatture/scadenze del progetto. Letto dal cliente
  collegato (`clientUid`) in `ClientPortalView` (sostituisce il vecchio localStorage).
- `documents/<pid>/<docId>`, `projectMessages/<pid>/<msgId>` — **scritture
  mirate per-elemento** (così anche i clienti possono creare i propri).
- `projectFurnishings/<pid>/<itemId>` — modulo "Arredi & Moodboard" (tipo
  `Furnishing`): arredi **fissi/mobili** (ora con `price`/`quantity` → base parcella) +
  tile moodboard 2D (campo `board`, **deprecato**: la lavagna 2D è stata sostituita dal
  moodboard 3D, vedi §19). Scrittura **mirata per-elemento** come documents; a
  differenza di documents il cliente può anche **aggiornare** i propri item (non solo
  crearli), quindi la regola di write è a livello `$pid` senza vincolo `!data.exists()`.
- `projectMoodboard3d/<pid>` — **Moodboard 3D per progetto** (vedi §19): `{ elements: BoardElement[],
  updatedAt, by }`. Scrittura del **nodo intero** (non per-elemento). Regole come `projectFurnishings`
  (studio attivo non-cliente **o** cliente collegato `clientUid`, read+write).
- `appointments/<id>` — agenda condivisa (vedi §8).
- `unicoShowcase/<dealId>` — **snapshot PUBBLICO vetrina Unico** (`UnicoShowcaseEntry`, vedi §21):
  scritto in write-through da `saveUnicoDeals` (App) per i soli deal `published`; SOLO campi
  divulgabili (no costi acquisto/ristrutturazione, no nomi investitori). Read: ogni autenticato;
  write: admin/manager.
- `unicoInvestorPositions/<uid>/<dealId>` — **snapshot PRIVATO per investitore** (`UnicoInvestorPosition`):
  scritto in write-through da `saveUnicoDeals` (App, helper `dealToInvestorPositions` in showcaseData) per
  ogni `UnicoDeal.investors[].investorUid` (account portale collegato). Contiene SOLO la posizione del
  destinatario (conferito, quota%, n° quote, rendimento atteso, aggiornamenti, sue distribuzioni) — niente
  costi né nomi/importi altrui. Read: solo `auth.uid==$uid`; write: studio attivo non-cliente/non-partner.
  Letto dal portale (`ClientPortalView` → pannello "I miei investimenti", `MyInvestmentsPanel`). Cleanup
  delle posizioni di investitori scollegati via `prevInvestorUidsRef` in App. Il modulo Unico lato studio
  (`UnicoStudioView`) ora ha SPV/cap table (`spvName`/`spvVat`/`unitPrice`), tab **Rendiconto** (riparto
  profitto + distribuzioni) e pannello **Aggiornamenti** (notifica gli investitori collegati).
  **Monitoraggio fasi** (doc "UNICO il processo"): `UnicoDeal.fasi` = mappa fase→% sulle 8 fasi canoniche
  (`UNICO_FASI` in `showcaseData.ts`: acquisto · prog. preliminare · prog. definitiva · autorizzazioni ·
  permesso di costruire · esecuzione lavori · commercializzazione · vendita), editor a slider nel
  `DealModal`; copiata nelle posizioni (`UnicoInvestorPosition.fasi`) e mostrata come barre "Avanzamento
  operazione" in `MyInvestmentsPanel`. Nessun nodo/regola nuovi.
- `crmLeads`, `crmSuppliers` — array CRM (pipeline + fornitori/partner).
- `clients/<id>` — **Rubrica clienti** (anagrafica riutilizzabile, anche clienti **senza login**:
  privato/azienda con CF/P.IVA/PEC/SDI/indirizzo). Gestita in CRM → tab "Clienti" (admin/manager).
  In Nuovo/Modifica progetto il select "Cliente (rubrica)" auto-compila i campi (`Project.clientRecordId`);
  collegamento all'account portale resta separato e opzionale (`clientUid`).
- `matericoRequests/<id>` — flusso Materico (vedi §9). `forwardedTo` = mappa `{uid:true}`.
  Read di collezione solo studio attivo; cliente/partner leggono per-`$id`. Scritture
  partner/cliente **granulari** (`offers/<uid>`, `status`); oggetto intero solo studio
  (o cliente alla creazione). **Indici inversi** per le read per-portale (RTDB non filtra):
  `clientMaterico/<uid>/<reqId>=true` (scritto dal cliente alla creazione) e
  `partnerMaterico/<uid>/<reqId>=true` (scritto dallo studio all'inoltro) → cliente/partner
  **elencano** le proprie richieste e si sottoscrivono ai singoli `matericoRequests/<id>`.
  Migrazione dati legacy: backfill una-tantum lato studio (admin/manager) all'avvio.
- `clientRequests/<clientUid>/<id>` — **richieste cliente / "La tua idea"** (`ClientRequest`): brief inviato
  dal cliente dal portale per Studio/Strategico/Unico (titolo, descrizione, budget, dove, link e
  **moodboard 3D** opzionale). Annidato per uid come `notifications`: il cliente legge/scrive il proprio
  ramo, lo studio attivo legge tutto. Lo studio (admin/manager) la valuta in **Richieste clienti**
  (`ClientRequestsView`, route `#richieste-clienti`, voce sidebar/navbar): "Prendi in carico" /
  **"Converti in progetto"** (crea `projects/<pid>`, collega il cliente, porta la moodboard su
  `projectMoodboard3d`, notifica il cliente) / "Chiudi". Lato cliente: `ClientRequestPanel`
  (CTA "Nuova richiesta" + lista unificata con le proprie MatericoRequest). **Materico** dal flusso
  unificato genera comunque una `MatericoRequest` (bidding partner invariato).
- `notifications/<uid>/<id>` — **notifiche persistenti** (`Notification`): scritte dall'app
  (`pushNotification`/`notifyStudio` in App) e dalle **Cloud Functions** (Admin SDK). Sostituiscono
  le vecchie notifiche solo-in-memoria; il Centro Notifiche mostra queste + le richieste appuntamento.
  read/write solo del proprio uid (write anche da studio attivo per notificare colleghi).
- `teamLeave/<id>` — **ferie/assenze team** (`TeamLeave`): pannello in `CalendarView`; all'inserimento
  notifica in-app a tutto il team (il reminder 7gg prima è una Cloud Function).
- `quotes/<id>` — **Preventivi & Parcelle** (`Quote`, vedi §16): macro-voci, stati, piano pagamenti,
  `docKind` (preventivo|parcella), **IVA/cassa spuntabili** (`vatEnabled/vatPct/cassaEnabled/cassaPct`,
  calcolo `quoteTotals` in finance.ts); admin/manager. La rata "emessa" genera fattura attiva +
  scadenza nei nodi finanza (eredita IVA/cassa). **Funnel commessa**: un preventivo portato a
  `status:'accettato'` **senza** `projectId` genera **AUTOMATICAMENTE** la commessa
  (`generateProjectFromQuote` in App): progetto con fasi=macro-voci e task=righe, cliente collegato
  (via `clientRecordId→accountUid`) e notificato. Naming "Cliente + Località" se l'indirizzo c'è.
- `priceList` — **Listino voci di costo riusabili** (array, `PriceItem`): per comporre rapidamente i
  preventivi. Gestione in Finanze → Preventivi → "Listino" (admin/manager); in `QuoteEditor` il select
  "+ da listino…" aggiunge una riga pre-compilata. read studio attivo, write admin/manager.
- `trash/<id>` — **Cestino condiviso** (`TrashItem`, vedi §20): elementi eliminati da ogni sezione,
  conservati 60 giorni poi purge automatico client-side; read/write team attivo non-cliente.
- **Modulo Cantiere** (vedi §15): `cantieri/<cid>` (record cantiere, `partnerUids:{uid:true}`) +
  sotto-collezioni granulari per-elemento `cantiereRapportini|cantierePresenze|cantiereFoto|
  cantiereMateriali|cantiereChecklist|cantiereDocumenti|cantiereSal|cantiereLog|cantiereRecords|
  cantiereMessages` (tutte `<cid>/<id>`). `cantiereRecords` = **registro voci generico**
  (discriminato da `section`: scadenze, cronoprogramma, verifiche, nonconformita, ordini_servizio…);
  `cantiereDocumenti` esteso con `section`/`category`/`expiry` = **registro documenti generico**
  (documenti, sicurezza POS/PSC/DUVRI, verbali, progettazione, doc tecnica…); `cantiereMessages` =
  chat di cantiere. **Indice inverso** `partnerCantieri/<uid>/<cid>=true` (scritto dallo studio
  all'assegnazione) → permette al partner di **elencare** i cantieri assegnati (i partner non
  hanno i cid nei loro `projectIds`). Foto/documenti salvano `{driveFileId,driveUrl}` (upload
  reale Google Drive, vedi `src/drive.ts`) **oppure** `link` (fallback). Tipi in `src/types.ts`.
  Le **foto** (`CantiereFoto`) sono **timestampate e geolocalizzate** best-effort: all'upload `FotoTab`
  cattura `navigator.geolocation` (timeout breve, nessun blocco se negata) → salva `takenAt`/`lat`/`lng`;
  la card mostra data·ora e un badge **GPS** con link alla mappa. Upload abilitato a studio e partner.
  La **navigazione sezioni** (livello 2) del `CantiereBoard` è una **griglia uniforme di tile** "Strumenti"
  per area (posizioni stabili/scansionabili) sotto il segmented control delle 3 aree.
- **Area Impresa** (profilo impresa partner, riutilizzabile su tutti i suoi cantieri, keyed per uid):
  `impresaDocs/<uid>/<id>` (DURC/visure/polizze/SOA/doc dipendenti, con `expiry`) e
  `impresaRecords/<uid>/<id>` (squadre/operai/mezzi/attrezzature/sicurezza, discriminati da `section`).
  Scritti dal partner proprietario (read studio). UI: portale partner tab "La mia impresa"
  (`src/components/cantiere/ImpresaArea.tsx`) + Area Impresa dentro al `CantiereBoard`.
- **Modulo Strategico / Marketing** (vedi §22): `mktEvents/<id>` (`MarketingEvent`: eventi + `invitees`
  map con RSVP), `mktCampaigns/<id>` (`Campaign`: canale/stagione/fasce + `steps` follow-up),
  `mktSurveys/<id>` (`Survey`: domande rating/scelta/testo, `active`), `mktSurveyResponses/<sid>/<uid>`
  (`SurveyResponse`), `mktSocial/<id>` (`SocialPost`: calendario editoriale). **Indice inverso**
  `mktInvitesIndex/<uid>/<eid>=true` (scritto dallo studio all'invito) → il portale **elenca** gli eventi
  a cui è invitato e si sottoscrive ai singoli `mktEvents/<id>`. Scritture studio per-elemento; portale
  granulari: RSVP `mktEvents/<id>/invitees/<uid>/status` + risposta `mktSurveyResponses/<sid>/<uid>`.
  `mktSurveys` leggibile da ogni autenticato (no dati sensibili). admin/manager lato studio
  (`StrategicoView`, route `#strategico`); pannello portale `MarketingPortalPanel` in `ClientPortalView`.

### Persistenza
- In App, `syncState(key, val)` scrive l'intero nodo via `writeNode` (mappa
  `KEY2PATH`: es. `finance → studioFinance`). Caso speciale `users` → scrive
  per-uid. **Le collection `documents`/`projectMessages` NON si scrivono intere**
  (regole granulari): gli handler scrivono il singolo elemento.
- Le sottoscrizioni stanno nell'effetto di sync (keyed su `currentUser.uid/role`):
  ramo **studio** (sottoscrive tutte le collection) vs ramo **cliente/partner**
  (solo i propri progetti + directory + matericoRequests).

## 7. Regole di sicurezza
`firebase-rules.json` riflette il modello: team `active` legge/scrive i dati
studio; finanza solo admin/manager; clienti accedono ai propri progetti via
`clientUid`; nodo `users` protetto da auto-promozione (validate su role/active,
whitelist email admin). **Quando si aggiunge un nodo DB, aggiornare ANCHE le
regole** e ricordare all'utente di ripubblicarle.
- `matericoRequests` è **blindato** (vedi §9): read di collezione solo allo studio
  attivo; cliente/partner leggono per-`$id` (`clientUid` / `forwardedTo/<uid>==true`)
  via gli indici inversi `clientMaterico`/`partnerMaterico`. Le scritture di
  partner/cliente sono **granulari** (offerta propria `offers/<uid>` + `status`),
  l'oggetto intero lo scrive solo lo studio (o il cliente alla creazione). `forwardedTo`
  è una **mappa** `{uid:true}` (con normalizzazione legacy array via `forwardedUids`/
  `isForwardedTo` in `utils.ts`).

## 8. Agenda / Appuntamenti
- `CalendarView` ordine **Giorno · Settimana · Mese**, tasti statici (niente
  animazione layout). Mostra i task **dell'utente** (anche multi-assegnatario,
  `Task.assignees` — `assignee` resta il primo per compatibilità) + gli
  appuntamenti di cui è **partecipante**.
- `appointments/<id>` è **multi-partecipante**: `participants {uid: pending|
  confermato|rifiutato}` + `participantNames` (creatore auto-confermato). Il
  popup "Nuovo appuntamento" ha la selezione libera **"Con"** tra team+clienti+
  partner (rimossi "Agenda di", controparte libera e il toggle nota). Stato
  complessivo **grigio (pending)** finché tutti confermano → **verde
  (confermato)**; notifiche in-app su invito/conferma/rifiuto/annullamento.
  Conferma/rifiuto = scrittura **granulare** `participants/<uid>` (le regole la
  consentono anche ai partecipanti non-attivi) + update best-effort di `status`.
  Appuntamenti legacy senza `participants`: fallback su `ownerUid`. I portali
  inviano **richieste** (`status:'pending'`) come prima; Dashboard ha anche il
  box "Messaggi & richieste" sotto l'Agenda di oggi.
- Il popup **"Nuovo impegno"** supporta più assegnatari e suggerisce il
  collegamento a una pratica; i task collegati (`projectId`) compaiono anche
  nel fascicolo tecnico ("Impegni agenda collegati").
- **Nuovo progetto**: divisione dedotta dal tab attivo (niente select);
  indirizzo strutturato `via/civico/cap/comune/provincia` (compone
  `indirizzoImmobile`, helper `composeAddress`); **catastali multipli**
  (`Project.catastali[]`, primo → `foglio/particella/sub` legacy, editor
  `CatastaliEditor`); dalla **data di inizio** i task delle fasi vengono
  pianificati in sequenza (`durationDays`, default 2gg) e **auto-assegnati per
  mansione** (`UserProfile.functions`, scelte da Team → "Modifica iscritto") al
  membro col minor numero di task aperti.

## 9. Modulo Materico (flusso)
1. Cliente (portale, sezioni "Richieste/Preventivi" e "Lavori in corso") crea una
   richiesta: titolo, tipo lavorazione, quantità (voci), link, note.
2. `MatericoView` (hub operatore, menu "Materico", admin/manager): inbox →
   suggerisce partner in base al tipo lavorazione (match con `crmSuppliers`) →
   inoltra ai partner selezionati.
3. Partner (portale) invia offerta (importo + note) → salvata in `offers[uid]`.
4. Operatore vede offerte **ordinate per prezzo**, sceglie la migliore, applica il
   **margine**, **invia al cliente** generando una **bozza contratto** (testo).
5. Cliente accetta/rifiuta dal portale, scarica la bozza contratto.
- TODO: firma digitale (provider esterno), upload file reale (oggi via link),
  blindatura regole, generazione contratto PDF.

## 9-bis. POPUP/OVERLAY — regola d'oro (bug "si aprono a metà")
Un antenato con `transform`/`filter`/`backdrop-filter` inline INTRAPPOLA i discendenti
`position: fixed` (containing block): il popup si apre a metà, tagliato o dietro ad altro.
Framer Motion lascia `filter: blur(0px)` inline a fine animazione → i wrapper di vista DEVONO
avere `transitionEnd: { filter: 'none', transform: 'none' }` nell'`animate` (già fatto nei 4
wrapper: route in App, CalendarView, tab del portale in ClientPortalView, MotionTabsMenu).
`Modal` e `ConfirmDeleteModal` sono in **createPortal(document.body)**. Regole per i NUOVI overlay:
o si usa `Modal`, o si fa createPortal su body; MAI un overlay `fixed` dentro un motion.div che
anima filter/transform senza transitionEnd. Z-index: bottom-nav 50 < overlay ad-hoc 200 < Modal 220
< ConfirmDeleteModal 300.

## 10. Convenzioni di stile (rispettare!)
- Schema grafico: fondo `#F5F5F3`, testo `#161616`, accent nero `#1b1b1b`, card
  bianche `rounded-[22px]/[24px]/[26px]`, bordi `#e2e2e2`. Niente emoji a caso.
- Colori settore (a colpo d'occhio): Studio `#161616`, Strategico `#b45309`
  (ambra), Materico `#c2410c` (arancio), Unico `#4338ca` (indaco).
- Pattern "barra settori" (tabs a pillola) e "box clienti" riusati in più sezioni
  — mantenerli coerenti.
- Modali: o il componente `Modal`, o overlay `fixed inset-0 z-[200] bg-black/40
  backdrop-blur-sm`.
- **Mai** reintrodurre dati seed finti o account di test (l'admin ora ripulisce i
  vecchi account `isTest`/`test-*`).
- **App-like**: il sito è **non zoomabile** (viewport meta in `index.html` + blocco
  ctrl+rotella/±/gesture in `main.tsx`) e **non selezionabile** (`user-select:none`
  su body in `index.css`), con **eccezione** per `input/textarea/select/
  [contenteditable]`. Non rimuovere queste regole; i nuovi campi testo nativi sono
  già coperti.
- **Sicurezza link**: ogni URL inserito dall'utente (campi `link`/`url` di documenti,
  foto, arredi, richieste Materico…) va renderizzato come `href={safeUrl(u) || '#'}`
  (`safeUrl` in `utils.ts`, whitelist http/https/mailto/tel — blocca `javascript:`).
  Sempre `rel="noreferrer"` sui link `target="_blank"`. Niente
  `dangerouslySetInnerHTML`.

## 11. Artefatti React/Vite — vincoli
- Niente `localStorage`/`sessionStorage` per i dati (tutto su Firebase).
- `import.meta.env.BASE_URL` per asset statici (es. modelli GLB in
  `public/model/step-01..13.glb`, e `public/generatore-modulistica.html`).
- Three.js r128-safe nei vecchi artefatti; qui three 0.184 con GLTFLoader da
  `three/examples/jsm/loaders/GLTFLoader.js`.

## 12. Stato / roadmap
Fatto: login+ruoli, DB condiviso, Documenti+generatore modulistica, Finanza
condivisa, CRM, Agenda/appuntamenti, colori settore, Materico (flusso base).
Fatto: modulo **Unico** lato studio (operazioni immobiliari, investitori, ROI/margine — `unicoDeals`);
**pubblicazione in vetrina** (editor per-deal + nodo `unicoShowcase` + pagina cinematica, §21);
**SPV/cap table** (`spvName`/`spvVat`/`unitPrice` + quote/quota per investitore), **portale investitore**
(`unicoInvestorPositions` → "I miei investimenti"), **aggiornamenti** agli investitori (con notifica) e
**rendiconto** (riparto profitto + distribuzioni). Manca: integrazione con i nodi finanza dedicati.
Fatto: modulo **Cantiere** (§15) ampliato alla struttura del PDF a 3 aree (Campi condivisi /
Area Tecnici / Area Impresa): record `cantieri` + sotto-collezioni + registri generici
(`cantiereRecords`/`cantiereDocumenti` con `section`) + chat (`cantiereMessages`) + Area Impresa
riusabile (`impresaDocs`/`impresaRecords`, tab "La mia impresa" nel portale partner); SAL→fattura,
upload Google Drive con fallback link. Alcune sotto-voci del PDF sono placeholder navigabili
("in preparazione") da attivare incrementalmente.
Fatto: **Rubrica clienti** (`clients`) — anagrafica riutilizzabile (CRM → tab "Clienti") che
auto-compila il form progetto.
Fatto: **CRM esteso** (doc CONSIDERAZIONI CRM, §16-18): notifiche persistenti, rubrica con fasce/
responsabili/WhatsApp, Task con priorità urgente/tipologia + dashboard produttività, ferie team,
**Preventivi & Amministrazione** (`quotes` con macro-voci/stati/piano pagamenti → finanza), e
**backend Cloud Functions** (`functions/`: email SendGrid, reminder schedulati, report) — da deployare.
Fatto: **Statistiche & Break Even Point** (`StatsView`, dentro **Finanze → tab "Statistiche & BEP"** —
non più voce sidebar; `#statistiche` redirige a Finanze col tab aperto via `finStartTab`) — cruscotto
direzionale che calcola su dati esistenti (fatture/scadenze/preventivi/
progetti/task): redditività per società+gruppo (motore `consolidato`), incassato vs da incassare,
**punto di pareggio**, andamento 12 mesi ricavi/costi, portafoglio commesse + pipeline preventivi,
carico per risorsa. Nessun nodo/regola nuovi.
Fatto: modulo **Strategico / Marketing** (§22, `StrategicoView`, dentro Progetti → divisione STRATEGICO): **Eventi & inviti**
con RSVP dal portale, **Campagne & follow-up** (link `mailto`/`wa.me`, niente backend), **Sondaggi/Customer
satisfaction** (compilabili dal portale + risultati aggregati), **calendario editoriale Social**, **Analisi**
(tasso adesione/risposta/conversione, soddisfazione media). Nodi `mkt*` + `mktInvitesIndex`.
Da fare (CRM doc, fasi successive): **Incentivi & Performance** (300+ attività a punti), WhatsApp API.
Fatto: tutte le voci Cantiere prima "in preparazione" ora attive come registri
(**Collaudi & test materiali** Area Tecnici; **Magazzino & ordini** e **Manutenzioni & guasti**
Area Impresa).
Da fare: preventivi self-service + PDF + firma, Gantt, timesheet/HR,
reporting/redditività, integrazioni esterne
(SDI reale, banche, Google/Outlook, WhatsApp, catasto — richiedono backend).

## 13. Cosa serve all'utente (setup Firebase, una tantum)
- Authentication → Sign-in method → abilitare **Google** **e Email/Password** +
  Authorized domains (`giorgiopascalistudio.github.io`, `localhost`).
- Realtime Database → Regole → incollare `firebase-rules.json` → Pubblica.
  ⚠️ Le regole `users` ora permettono a cliente/azienda di auto-approvarsi
  (`role:'cliente'`) e al manager di approvare il Team; aggiunto anche il nodo
  `unicoDeals` (admin/manager), il nodo `projectFurnishings` (studio + cliente
  collegato via `clientUid`, in lettura e scrittura) e il nodo **`projectEconomics`**
  (write studio, read cliente collegato — quadro economico del portale). **Vanno
  ripubblicate**, altrimenti la registrazione e i moduli Unico / Arredi / la
  contabilità del portale falliscono con "permission denied".
  ⚠️ Aggiunti anche i nodi del **modulo Cantiere** (`cantieri`, `cantiere*`, `partnerCantieri`):
  **ripubblicare le regole** dopo il deploy, altrimenti i cantieri falliscono con
  "permission denied" e — come per gli arredi — la write resta silenziosa lato client.
  ⚠️ Aggiunti inoltre i nodi `clients` (rubrica clienti, write admin/manager), `cantiereRecords`,
  `cantiereMessages` (per-cantiere, write studio + partner assegnato sui propri elementi) e
  `impresaDocs`/`impresaRecords` (Area Impresa, write del partner proprietario o admin/manager):
  **ripubblicare le regole**, altrimenti rubrica, registri/chat di cantiere e Area Impresa danno
  "permission denied" con write silenziosa lato client.
  ⚠️ Aggiunti infine `notifications/$uid` (read/write proprio uid; write da studio attivo),
  `teamLeave` (read studio; write proprio o admin/manager), `quotes` (admin/manager) e
  `projectMoodboard3d` (come `projectFurnishings`): **ripubblicare le regole** dopo il deploy.
  ⚠️ Aggiunto il nodo **`trash`** (Cestino, §20 — read/write team attivo non-cliente):
  **ripubblicare le regole**, altrimenti il Cestino resta vuoto e i ripristini falliscono
  (le eliminazioni continuano a funzionare ma senza copia di sicurezza).
  ⚠️ **RBAC granulare** (visione Aulico): aggiunto il campo `users/<uid>/access` (AccessMap
  per-società/modulo) con `.validate` che **consente la modifica solo ad admin/manager** (anti
  auto-promozione: la write del proprio nodo è permessa, ma `access` no). **Ripubblicare le regole**,
  altrimenti chi assegna i permessi da Team→Modifica iscritto riceve "permission denied". Finché un
  utente non ha `access` esplicito, vale il **fallback dal ruolo** (`src/access.ts`), quindi il
  comportamento attuale resta invariato.
  ⚠️ Aggiunto il nodo **`unicoShowcase`** (vetrina Unico pubblicata, §21 — read ogni autenticato,
  write admin/manager): **ripubblicare le regole**, altrimenti la pubblicazione vetrina fallisce
  in silenzio e i clienti continuano a vedere i dati demo.
  ⚠️ Aggiunto il nodo **`unicoInvestorPositions/<uid>`** (posizione privata dell'investitore Unico, §6 —
  read solo `auth.uid==$uid`, write studio attivo): **ripubblicare le regole**, altrimenti il portale
  investitore ("I miei investimenti") resta vuoto e la write-through dello studio fallisce in silenzio.
  ⚠️ Aggiunto il nodo **`internalOrders`** (commesse interne intercompany `CI-NNN`, visione Aulico —
  read studio attivo non-cliente/non-partner, write admin/manager): **ripubblicare le regole**,
  altrimenti la creazione/conferma delle commesse interne fallisce con "permission denied". Le scritture
  finanza della coppia intercompany (costo committente + ricavo fornitore) riusano i nodi finanza
  esistenti via il servizio `financeRecord`/`recordIntercompany` in App (marcate `intercompany` +
  `counterpartySector` per l'elisione nel consolidato di gruppo).
  ⚠️ Aggiunto il nodo **`pointEvents/<uid>/<id>`** (Incentivi & Point system, visione Aulico — read
  studio attivo non-cliente/non-partner per la classifica; `$uid` leggibile dal proprietario per il
  portale partner; write admin/manager): **ripubblicare le regole**, altrimenti l'assegnazione punti
  fallisce con "permission denied" e il portale partner non vede l'affidabilità. Catalogo attività +
  fasce bonus + funzioni pure in **`src/points.ts`** (team→bonus, partner→affidabilità 0–100).
  ⚠️ Aggiunto il nodo **`newsletter/<uid>`** (iscrizione newsletter dal portale — read del proprietario
  + studio attivo non-cliente/non-partner; write `auth.uid==$uid`): **ripubblicare le regole**, altrimenti
  il tasto "Iscriviti" del portale (`NewsletterButton`) dà "permission denied". Componente autonomo che
  legge/scrive via watchNode/writeNode. **Resa come BANNER** (`variant='banner'`, default): appare nel
  portale **solo se non iscritti** e con una **spunta** (stile privacy) che, una volta iscritti, lo fa
  sparire; in `ClientProfileModal` usa `variant='inline'` (spunta sempre visibile, iscrivi/disiscrivi).
  In **registrazione** (`AuthFlow`) c'è la **spunta newsletter facoltativa** accanto alla privacy
  (`renderPrivacy`) che alla conferma scrive `newsletter/<uid>`.
  ⚠️ Aggiunto il nodo **`deletionRequests/<uid>`** (richiesta eliminazione account dal Profilo cliente —
  read del proprietario + studio attivo non-cliente/partner; write `auth.uid==$uid`): **ripubblicare le
  regole**. Il cliente la invia da `ClientProfileModal` (+ flag `users/<uid>/deletionRequested`), poi viene
  disconnesso; lo studio elabora la cancellazione. Profilo cliente: foto (data URL su `photoURL`), password
  (`changePassword`, solo account email), residenza, consensi (newsletter), richiesta eliminazione.
  ⚠️ Aggiunti i nodi del **modulo Strategico/Marketing** (§22): **`mktEvents`** (read studio + invitato
  per-`$id`; write studio; RSVP granulare `invitees/$uid`), **`mktCampaigns`** (studio), **`mktSurveys`**
  (read ogni autenticato, write studio), **`mktSurveyResponses/$sid/$uid`** (read/write proprio uid + studio),
  **`mktSocial`** (studio) e l'indice **`mktInvitesIndex/$uid`** (read proprio, write studio):
  **ripubblicare le regole**, altrimenti eventi/inviti/sondaggi del portale non funzionano (write silenziose).
  ⚠️ Aggiornate le regole di **`projectMessages` e `cantiereMessages`** (chat): cliente/partner
  possono **eliminare un proprio messaggio entro 60s** dall'invio (unsend) e il create richiede
  `from == auth.uid` (niente spoofing autore). **Ripubblicare le regole**, altrimenti l'unsend
  fallisce lato portale (per lo studio funziona comunque).
  ⚠️ Aggiornate le regole di **`appointments`** (multi-partecipante): read estesa ai partecipanti
  (`participants/<auth.uid>` esiste) + write granulare `participants/$uid` per il proprio stato di
  conferma. **Ripubblicare le regole**, altrimenti gli inviti non si confermano lato portale.
  ⚠️ Aggiunto il nodo **`clientRequests/<clientUid>`** (richieste cliente "La tua idea", §6 — il cliente
  legge/scrive il proprio ramo, lo studio attivo non-cliente/non-partner legge tutto; convert→progetto
  riservato ad admin/manager): **ripubblicare le regole**, altrimenti l'invio richieste fallisce in
  silenzio lato portale e lo studio non le vede in "Richieste clienti".
  ⚠️ **Blindatura `matericoRequests`** (§9): aggiunti/aggiornati i nodi **`matericoRequests`**
  (read collezione solo studio; read per-`$id` per cliente `clientUid`/partner `forwardedTo`;
  write granulari `offers/<uid>`+`status`) e i due **indici inversi** **`partnerMaterico/<uid>`**
  e **`clientMaterico/<uid>`**: **ripubblicare le regole**, altrimenti cliente/partner non vedono
  le richieste e le offerte falliscono in silenzio (lo studio continua a funzionare). Le richieste
  legacy vengono migrate da un backfill una-tantum quando un admin/manager apre l'app.
  ⚠️ Aggiunti i nodi **Strategico/Economia** (§22-bis): **`mktContracts`** (contratti/retainer — read
  studio attivo non-cliente/non-partner, write admin/manager) e **`mktTimeEntries`** (time tracking —
  read/write studio attivo non-cliente/non-partner): **ripubblicare le regole**, altrimenti contratti e
  time tracking danno "permission denied" con write silenziosa lato client. I dati economici riusano i
  nodi finanza esistenti (nessuna regola nuova lì).
  ⚠️ Aggiunti i nodi **Strategico/Produzione** (§22-ter): **`mktAssets`**, **`mktDeliverables`**,
  **`mktProofs`** (tutti read/write studio attivo non-cliente/non-partner): **ripubblicare le regole**,
  altrimenti asset library, kanban e proofing danno "permission denied" con write silenziosa lato client.
  ⚠️ Aggiunti i nodi **Strategico/Acquisizione-Dati-Compliance** (§22-quinquies): **`mktLeads`**, **`mktFlows`**,
  **`mktSeo`**, **`mktAds`**, **`mktMetrics`**, **`mktInbox`**, **`mktConsents`** (tutti read/write studio attivo
  non-cliente/non-partner): **ripubblicare le regole**, altrimenti lead/automation/SEO/ads/analytics/inbox/consensi
  danno "permission denied" con write silenziosa lato client. La spesa ads riusa i nodi finanza esistenti.
  ⚠️ Aggiunto il nodo **`priceList`** (listino voci di costo riusabili, funnel commessa — read studio
  attivo, write admin/manager): **ripubblicare le regole**, altrimenti il "Listino" in Finanze→Preventivi
  dà "permission denied" con write silenziosa.
  ⚠️ Aggiunto il nodo **`auditLog/<id>`** (Registro attività / audit log — read admin/manager,
  write append-only studio attivo non-cliente/partner): **ripubblicare le regole**. `logAudit()` in App
  scrive il trail (delete via `moveToTrash`, restore, create progetto da preventivo/lead/richiesta,
  cambio stato preventivo, smistamento lead…); vista **`AuditView`** (route `#registro`, voce sidebar
  admin/manager). Copertura **incrementale** (aggiungere `logAudit` ai nuovi handler significativi).
  ⚠️ Aggiunto il nodo **`editorialPosts/<id>`** (Calendario editoriale / "anteprima di pubblicazione",
  §22-bis-cal — read/write studio attivo non-cliente/partner): **ripubblicare le regole**, altrimenti il
  calendario editoriale non salva (write silenziosa). Componente **`EditorialCalendar`**: mese con
  anteprime media per giorno, drag&drop media dal
  dispositivo (immagini **inline** dataURL ridotte via canvas; video/file grandi via **link**) + **import dai
  documenti di una pratica SOLO se il cliente ha `consents.marketing`** (gating fatto in App: `importProjects`
  filtra `projects` per `users[clientUid].consents.marketing`). `>1 media = carosello`. Handler
  `handleSaveEditorialPost`/`handleDeleteEditorialPost` (+ Cestino sezione `editorial`). Tipi `EditorialPost`/
  `EditorialMedia`/`EditorialStatus` in `types.ts`. Consensi cliente: **spunte in registrazione** (`AuthFlow`
  `renderPrivacy`: privacy/newsletter/**marketing**) → `users/<uid>.consents` + `consentsAt`.
  **RISTRUTTURATO (Centro Marketing, §22-septies)**: `EditorialPost.channel` ora è l'**id dell'account
  gestito** (slug società o `acc-…`; i post legacy con label matchano comunque), aggiunti
  `EditorialPost.workflow` (9 fasi con pallini, tipo `EditorialPhase`; stato macro derivato da
  `deriveStatus`) e la prop `lockChannel` (canale fisso, selettore nascosto) su `EditorialCalendar`.
  Il calendario NON è più una voce a sé in Strategico: vive dentro il workspace account del Centro
  Marketing; nelle società operative resta `mkt-calendario` ma in **sola lettura** (consultazione).
  ⚠️ **Centro Marketing (§22-septies)** — la sezione Marketing di Strategico è stata RISTRUTTURATA
  (richiesta esplicita: "non può stare tutto insieme, ogni cliente deve avere il suo calendario").
  Un'unica voce **Strategico → Marketing → "Centro Marketing"** (`view:'marketing-hub'`, componente
  **`MarketingHub`**, lazy) a 2 livelli: 1) **Centro** = salute di TUTTI gli account gestiti (5 società +
  clienti terzi: Regolare/Attenzione/Critico, ultimo post, prossima pubblicazione, oggi in pubblicazione,
  alert automatici, "Report riunione" stampabile con stato account + spese + preventivi Strategico
  inviati/da inviare) + "Nuovo cliente" dalla rubrica; 2) **workspace per account** con tab: Panoramica/
  scheda (obiettivi/target/tono di voce/canali social/budget/**liberatoria → banner "NON PUBBLICARE
  NULLA"**), Calendario (EditorialCalendar bloccato sul canale), Workflow 9 fasi (tabella pallini
  rosso/verde), KPI mensili manuali per piattaforma IG/FB/Google/Sito (delta vs mese precedente +
  grafico, predisposti per API future), Spese & budget (ponte `handleRegisterMktExpense` → fattura
  passiva `sector:'strategico'`), Report mensile stampabile (performance/programmazione/spese/
  conclusioni persistite), Eventi & gadget e Blog (riuso nodo `socMkt` con `soc`=accountId), Altro
  (newsletters/messaggi automatici/recensioni/foto cantieri/archivio idee = "in preparazione").
  Nuovi nodi: **`mktAccounts`**, **`mktKpi`**, **`mktExpenses`**, **`mktReports`** (tutti read/write
  studio attivo non-cliente/non-partner): **ripubblicare le regole**, altrimenti scheda account/KPI/
  spese/report falliscono con write silenziosa. Tipi `MktAccount`/`MktKpiEntry`/`MktExpense`/
  `MktMonthlyReport` in types.ts; Cestino sezioni `mkt-account`/`mkt-spesa`. Gli account delle 5
  società sono **sempre presenti** (id = slug società, merge con `mktAccounts` se salvati); i clienti
  terzi vivono solo in `mktAccounts` (`acc-…`, opzionale `clientRecordId` dalla rubrica).
  **PULIZIA doppioni**: ritirate dalla UI `MarketingSection` (nodo mktSocial, "Marketing operativo"),
  `MarketingSocietaView` (board socMkt per società) e la voce `mkt-strategico` (vecchia StrategicoView
  V1); le società operative hanno SOLO `mkt-calendario` read-only. La rotta legacy `#strategico`
  ora apre il Centro Marketing.
  ⚠️ **Centro Direzione (§23)** — Amministrazione & Contabilità di Strategico RISTRUTTURATA come il
  marketing (Strategico amministra la contabilità di TUTTE le società; modello = PDF "RIUNIONE
  STRATEGICA CONTABILITÀ"). Voce **Strategico → Amministrazione & Contabilità → "Centro Direzione"**
  (`view:'direzione-hub'`, componente **`DirezioneHub`**, lazy) a 2 livelli: 1) **Centro** = card per
  società (fatturato/incassato/costi/liquidità del mese, badge sopra/sotto BEP, avanzamento obiettivo
  fatturato) + KPI di gruppo + alert (sotto BEP, liquidità mancante, scadenze oltre data); 2) **workspace
  per società** con le sezioni della riunione: **KPI** (preventivato con analisi per fascia cliente ·
  venduto · fatturato · incassato · erogato · liquidità · punti — serie mensili CALCOLATE dai dati
  dell'app via `kpiSeries`; la sola liquidità è manuale, cella editabile), **Piano finanziario** (embed
  `PianoFinanziarioView`), **IVA & Fiscale** (situazione IVA trimestrale dalle fatture attive + embed
  `FiscaleView`), **Programmazione** (embed `ProgFatturazioneView` + **Programmazione costi** mensile
  stile Excel con categorie/spunta sostenuta/copia dal mese precedente), **BEP** (CF/CV dal Piano
  finanziario, fallback tutti-i-costi-fissi; `bepRows`), **Budget per aree** (budget vs consuntivo con
  aree standard del PDF + confronto coi costi registrati), **Cicli aperti** (dossier per gruppo),
  **Obiettivi** annuali (8 target con avanzamento) e **Report** riunione stampabile (8 sezioni
  precompilate + conclusioni persistite). Nuovi nodi (tutti **admin/manager**): **`finTargets`**
  (`<soc>-<anno>`), **`finLiquidity`** (`<soc>__<yyyy-mm>`), **`finCostPlan`**, **`finBudget`**,
  **`finCicli`**, **`finReports`**: **ripubblicare le regole**. Tipi in types.ts; Cestino sezioni
  `fin-costplan`/`fin-budget`/`fin-ciclo`. **SNELLITE le società operative**: il gruppo Contabilità &
  Amministrazione di Onirico/Materico/Unico/Fantastico ora ha solo **"Quadro contabile"**
  (`view:'contabilita-read'`, componente **`ContabilitaConsult`**, SOLA consultazione: KPI anno +
  ricavi vs costi + ultime fatture/scadenze) + Credenziali + Registro; rimosse le voci operative
  (Contabilità/Piano finanziario/Prog. fatturazione/Fiscale — vivono nel Centro Direzione);
  **Piano incentivante spostato sotto Risorse umane** (`hr-incentivi`). In Strategico la voce
  `amm-commerciale` è stata rimossa (doppione di Finanze→Preventivi); `amm-contabilita` resta come
  "Contabilità operativa" (FinanzeView completa, con selettore Società — è lì che si registrano
  fatture/scadenze/movimenti; il bottone "Contabilità" del hub ci salta con `financeLock`).
  **Aggiunte post-verifica docs SEZIONI**: 1) Strategico ha ora il gruppo **Commerciale**
  (`comm-preventivi` → `CommercialeView` division strategico + `comm-clienti` → rubrica), come da
  modello a 7 sezioni; 2) i preventivi supportano **sconto/maggiorazione rapidi %**
  (`Quote.discountPct`/`surchargePct`, PDF MKT Richieste): `quoteTotals` in finance.ts li applica
  sull'imponibile PRIMA di cassa/IVA e ritorna anche `righe/sconto/maggiorazione`; UI in `QuoteEditor`
  (pannello "Sconto / maggiorazione"); `Quote.total` resta l'imponibile GIÀ scontato/maggiorato
  (nessun cambiamento a valle); 3) grafici stile PDF nel `DirezioneHub`: **Fatturato vs BEP** (barre +
  soglia tratteggiata, rosso sotto pareggio) nella tab BEP e **Fatturato vs Incassato** affiancati
  nella tab KPI.
  **Generazione documenti da modello (visione Aulico)**: componente **`QuotePrintDoc`** + dati carta
  intestata per società in **`src/companyInfo.ts`** (`COMPANY_DOC`: ragione sociale, P.IVA, IBAN/banca,
  validità default, note importi, testo accettazione, N.B. — presi dai DOCX ESEMPIO di
  `AULICO 2.0/docs/SEZIONI/<soc>/COMMERCIALE`; Unico/Fantastico ancora senza dati → campi vuoti nel
  documento). Pulsante **"Documento"** su ogni card di `CommercialeView` (nuova prop `clients` per
  compilare il committente dalla rubrica): overlay col documento nel formato del modello (committente,
  servizi numerati, sconto/maggiorazione, totale ±IVA/cassa, condizioni di pagamento dal piano rate,
  banca/IBAN, validità, accettazione con eventuale firma OTP, privacy, firme, footer intestato) +
  **Stampa/PDF** (CSS print). Nessun nodo/regola nuovi.
  ⚠️ **Centro Commerciale (§24)** — anche il Commerciale di Strategico gestisce TUTTE le società.
  Voce **Strategico → Commerciale → "Centro Commerciale"** (`view:'commerciale-hub'`, componente
  **`CommercialeHub`**, lazy) a 2 livelli: 1) **Centro** = pipeline per società (in corso/accettati,
  valore, % conversione, in scadenza ≤7gg, risposte dal portale) + alert; 2) **workspace per società**:
  Preventivi & Contratti (`CommercialeView` con firma OTP, stampa Documento e **"Invia al portale"**),
  **Documenti** (generatore contratti da modello, componente **`ContractPrintDoc`**: Arredi Fissi e
  FF&E per Onirico, Accordo imprese per Materico — intestato a Materico —, Manifestazione d'interesse
  per Unico; campi auto-compilati dalla rubrica + OGNI sezione modificabile prima della Stampa/PDF),
  **Contratti imprese** (Materico, embed `MatericoContractsView`) e **Listino** (Materico: embed
  `MatericoListinoView`; altre: tabella `priceList` filtrata). Nelle società operative il gruppo
  Commerciale è **SOLO consultazione** (`CommercialeView` canEdit=false) + rubrica; rimosse le voci
  contratti/listino per-società (vivono nel hub).
  **PREVENTIVO INTERATTIVO nel portale cliente** (definizione utente di "dinamico"): lo studio preme
  "Invia al portale" (`handleShareQuote`: richiede rubrica→`accountUid`) → snapshot divulgabile su
  **`clientQuotes/<uid>/<qid>`** (write-through in `handleSaveQuote` via `updateNode`, così la scelta
  del cliente non viene sovrascritta; helper `quoteToShared`). Il cliente (portale → tile **"I tuoi
  preventivi"** → `ClientQuotesPanel`) **spunta/toglie le voci** non bloccate e vede il **totale
  aggiornarsi in tempo reale** (quoteTotals su voci incluse); togliendo una voce esce il **banner coi
  vantaggi che perde** (`QuoteLine.benefits` oppure catalogo **`src/serviceBenefits.ts`** costruito
  dal DOCX "Modalità operative" di Onirico, match per parole-chiave); "Invia selezione"/"Accetta"
  scrivono `choice` (`QuoteClientChoice`, regola granulare `auth.uid==$uid`) + `notifyStudio`. Lo
  studio vede le risposte in tempo reale (sub `clientQuotes` intera → mappa `quoteChoices` qid→choice,
  badge sulla card + alert nel Centro). Campi `Quote.clientUid/sharedWithClient/sharedAt` e
  `QuoteLine.locked` (checkbox "voce obbligatoria" nel QuoteEditor: il cliente non può escluderla).
  ⚠️ Nodo **`clientQuotes`** in `firebase-rules.json` (read collezione studio attivo; read `$uid`
  proprio; write `$qid` studio; write granulare `choice` del proprietario): **ripubblicare le regole**,
  altrimenti "Invia al portale" fallisce in silenzio e il cliente non vede i preventivi.
  **MOBILE V2 + Cestino & Archivio nei hub**: la **`Navbar`** mobile è stata RISCRITTA sulla struttura
  V2 (niente più voci legacy Dashboard/Progetti/CRM/Documenti): bottom bar **Home · Agenda · Società ·
  Altro** — "Società" apre uno sheet a tutto schermo con l'accordion delle 5 società e le loro sezioni
  a gruppi (STESSA fonte del desktop: `SOCIETY_REGISTRY` + `canViewSection`, nav a hash
  `#<slug>/<sezione>`); "Altro" = sezioni condivise della holding (Registro, Cestino); nel topbar chip
  della società attiva. Props cambiate: `activeSocieta/activeSection/onNav(hash)` (via `route`/`title`).
  Ogni hub (Marketing/Direzione/Commerciale) ha ora il pulsante **"Cestino & Archivio"** nel Centro →
  pannello **`HubCestino`** (riusabile): elementi eliminati dell'area (dal cestino condiviso, filtrati
  per sezione, ripristino + elimina definitivo via `handleRestoreTrash`/`handleTrashDeleteForever`) +
  ARCHIVIO dell'area (Commerciale: preventivi archiviati con "Riattiva"; Marketing: contenuti
  pubblicati; Direzione: cicli chiusi con "Riapri"). Nessun nodo nuovo.
  **Fantastico definito dall'utente** (mancava nei docs): gestione immobiliare — manutenzioni ed
  erogazione servizi tramite partner ("dal tagliare il prato a trovare un van per gli ospiti").
  Modulo da costruire DOPO Unico→Onirico→Materico (ordine scelto dall'utente per la ricostruzione
  delle società operative secondo i 00-DESCRIZIONE.md di AULICO 2.0/docs/SEZIONI).
  ⚠️ **Unico consegna 2 (§25)** — dai 00-DESCRIZIONE: 1) **Piano di Battaglia** (componente
  `PianoBattaglia`, sezione `home-piano` in TUTTE le società operative, nodo **`battlePlan/<id>`**
  tipo `BattleItem`): settimana operativa Lun–Dom + corsia "in settimana", si aggiungono i CICLI
  aperti o attività libere (priorità alta/media/bassa), drag&drop tra i giorni, frecce per spostare
  di settimana, spunta fatto; Cestino sezione `battle`. 2) **Ricerca Opportunità Unico** (componente
  `UnicoOpportunitaView`, sezione `prod-opportunita`, nodo **`unicoOpportunita/<id>`** tipo
  `UnicoOpportunity`): workflow a 9 STEP OBBLIGATORI in ordine (contatto→sopralluogo→raccolta→analisi→
  due diligence→manifestazione→negoziazione→preliminare→atto); la **due diligence è una checklist
  inline** (9 verifiche `DD_ITEMS` + PDF link) che fa da GATE allo step; la **manifestazione
  d'interesse si genera dal modello** (`ContractPrintDoc` template 'manifestazione', nuova prop
  `initialFields` per la precompilazione); a tutti gli step fatti → **"crea l'INVESTIMENTO"**
  (`handleCreateDealFromOpp`: nuovo `UnicoDeal` in `unicoDeals` status 'acquisizione' + opp
  `status:'acquisita'`+`dealId`); scheda con contatto dalla rubrica, link Google Earth/foto/docs,
  prezzo/valutazione; Cestino sezione `unico-opp`. ⚠️ Nodi **`battlePlan`** e **`unicoOpportunita`**
  (read/write studio attivo non-cliente/non-partner): **ripubblicare le regole**.
  ⚠️ **Onirico consegna 3** — **Stima Preliminare a SIMULATORE** (componente
  `StimaPreliminareView` con tipo `StimaPreliminare` e catalogo parametrico interno dal DOCX
  "STIMA PRELIMINARE - Simulatore": abitazione 2000/3000/4000 €/mq, deposito 1000/1500/2000,
  trulli/lamie 3000/4000/5000, pergolato/portico/tettoia/giardino/piazzali/camminamenti, muretti
  €/ml, piscina forfait 50/60/70k, extras a corpo pozzo/imhoff/cisterna/cancello/colonne/
  automazione/fotovoltaico/batteria): si inseriscono SOLO quantità + livello Base/Medio/Alto per
  voce → budget live (`stimaTotal`), cliente dalla rubrica, note, Stampa. Sezione `prod-stima`
  (solo Onirico), nodo **`stimePreliminari/<id>`** (read/write studio attivo non-cliente/partner):
  **ripubblicare le regole**. Cestino sezione `stima`. Evoluzione futura (dal DOCX): valori
  alimentati dai preventivi reali delle imprese partner (listino Materico) per area geografica.
  ⚠️ **Pulizia cross-società + Recruiting**: 1) RIMOSSA la pillbar ONIRICO/STRATEGICO/MATERICO/UNICO
  dentro `ProjectsView` (violava "nessun rimando cross-società nella nav interna"): al suo posto un
  badge STATICO della società corrente — la divisione arriva solo dalla sidebar (preset.division);
  2) **Recruiting Strategico** (sezione `hr-recruiting`, da placeholder a `view:'recruiting'`,
  componente **`RecruitingView`**, nodo **`recruiting/<id>`** tipo `RecruitItem` con `kind`
  annuncio|candidato|inserimento): ANNUNCI di lavoro (testo completo, stato bozza/pubblicato/chiuso,
  stampa), CANDIDATI in pipeline a colonne (candidatura→colloquio→prova→inserito/scartato, CV link,
  annuncio di riferimento), PIANI DI INSERIMENTO a 6 mesi (template GURU JOBS: accoglienza/starter
  kit, ruolo-obiettivi-PFV, formazione/tutor, feedback, verifiche — sezioni compilabili + stampa).
  Cestino sezione `recruiting`. ⚠️ Nodo **`recruiting`** (read/write studio attivo non-cliente/
  partner): **ripubblicare le regole**.
  ⚠️ **Segnalazioni sviluppo / periodo di test (8 lug)** — nodo **`devReports`** (`DevReport`:
  bug|richiesta|errore, con route/device auto-allegati): **read SOLO admin/manager; write per-`$id`
  create-only di chiunque autenticato** (`by == auth.uid`, anche clienti/partner) o admin/manager —
  **ripubblicare le regole**, altrimenti l'invio fallisce con toast di errore. Raccolta in
  **Strategico → Sviluppo Software → "Aulico — Segnalazioni"** (`sw-aulico`, view `dev-reports`,
  componente `DevReportsView` lazy: KPI, filtri, cambio stato, Cestino sezione `dev-report`).
  Invio da: **`FeedbackModal`** (componente riusabile, montato in ENTRAMBI i layout) aperto da
  "Segnala un problema" in `AulicoSidebar` (footer) e nello sheet "Altro" della `Navbar` mobile
  (tab ora sempre visibile), dal pulsante **"Segnala" sui toast di errore** (inoltra il testo del
  box, kind `errore`) e da "Nuova segnalazione" nella vista. Notifica in campanella ad
  admin/manager. Il widget dashboard "Chat recenti" è stato RIMOSSO (doppione di
  "Notifiche & messaggi").
  **Materico consegna 4 (dai 00-DESCRIZIONE)** — 3 upgrade, NESSUN nodo nuovo: 1) **Controllo
  margini PRE-FIRMA** in `MatericoContractsView` (pannello redditività quando il contratto è
  collegato a una commessa: ricavo/costo diretto dal computo, indiretti %, utile, margine % con
  semaforo <15% + warning se l'importo contratto supera il costo diretto); 2) **Azioni dalla Mappa
  operativa** (`MatericoMappaView`, prop `onQuickTask`+`canEdit`): "Segnala problematica" (input
  inline) e "Programma sopralluogo" → creano un'ATTIVITÀ in agenda (`handleQuickTask` in App,
  priorità alta, tipo Cantiere, assegnata a chi la crea); 3) **Valutazione imprese** (PDF: 7 criteri
  1–5 — qualità lavorazioni, affidabilità, rispetto tempistiche, capacità organizzativa, risoluzione
  problemi, specializzazione, qualità/prezzo): campo **`ClientRecord.valutazioni`** + tab
  "Valutazione imprese" nel workspace Materico del `CommercialeHub` (componente `ImpreseRating`,
  stelle + media, classifica "a colpo d'occhio", salva via `handleSaveClient` — riusa nodo `clients`).
  **Automazioni Onirico (PDF §Automazioni)** — 1) blocco **Date importanti** nel fascicolo
  (`ProjectsView`, sopra la pillbar): Firma preventivo (max `signedAt` dei quotes del progetto) ·
  Inizio attività (`startDate`) · Fine attività (`dueDate`); 2) **Proactive Alert scelte estetiche**:
  il banner countdown ≤60gg + "cantiere bloccato" ESISTEVA già in `FurnishingsBoard`; aggiunti i
  **remind giornalieri** nell'effetto softRem di App (helper `pushTo`): arredi FISSI non confermati
  con deadline ≤15gg → notifica giornaliera al CLIENTE (`rem-scelte-<pid>-<giorno>`); scaduti →
  notifica cliente "cantiere in blocco" + notifica studio "Blocco formale cantiere"
  (`rem-blocco[-studio]-<pid>-<giorno>`, dedup per giorno via getNode); 3) **Report settimanale al
  cliente** in `automation/cron.mjs` (`weeklyClientReport`, il VENERDÌ): per ogni progetto attivo
  con clientUid → notifica con avanzamento % dalle fasi + nuove foto cantiere della settimana
  (richiede i secrets GitHub Actions di automation/README). 4) **Render AI preliminare** FATTO
  (ultima automazione del PDF): sezione **Onirico → Produzione → "Render AI"** (`prod-render`,
  view `render-ai`, componente **`RenderAiView`** lazy, NESSUN nodo DB): foto del lotto (resize
  canvas → dataURL) + questionario (tipologia/stile/materiali/esterni/luce/note → prompt inglese)
  + slider trasformazione (→ `strength` 0.35–0.8) → **`callAiImage`** (Worker Cloudflare
  `kind:'image'`, img2img Workers AI — richiede il **binding [ai]** nel worker deployato) →
  render PNG con zoom, **Scarica PNG** (nome file dalla pratica collegata) e storico tentativi
  in-sessione. Banner di avviso se `window.__AULICO_AI_URL__` manca. Il render NON si salva su
  Firebase (dataURL grandi): si scarica e si allega alla pratica dai Documenti se serve.
  **Point of Entry (docs 01-STRATEGICO)** — nuova PRIMA voce di Strategico (`point-of-entry`,
  componente **`PointOfEntryView`**, admin/manager): inbox unificata con i **lead da smistare**
  (crmLeads non `routed`: bottoni Onirico/Strategico/Materico → `saveLeads`+`handleRouteLead`,
  notifica+audit) e le **richieste clienti** dal portale (inviate/prese in carico: prendi in
  carico / converti in progetto / chiudi — riusa gli handler di ClientRequestsView); KPI (da
  smistare, nuove, in carico, smistati 7gg) + link a pipeline completa e a tutte le richieste.
  Nessun nodo nuovo.
  ⚠️ **Fantastico consegna 5 (§26)** — PRODUZIONE di Fantastico costruita sulla definizione utente
  (gestione immobiliare: manutenzioni + servizi via partner): componente **`FantasticoView`**
  (sezione `prod-gestione` "Immobili & Servizi"), nodi **`fantImmobili/<id>`** (`FantImmobile`:
  immobile in gestione, proprietario dalla rubrica, canone mensile, foto/doc link, attivo) e
  **`fantTickets/<id>`** (`FantTicket`: richiesta di servizio con categoria manutenzione/
  giardinaggio/pulizie/trasporti/ospiti, priorità, board stati richiesta→assegnato→in_corso→
  completato, PARTNER esecutore dal Registro Utenti con **costo partner vs prezzo cliente →
  margine**; se il partner ha `accountUid` riceve notifica all'assegnazione). KPI: immobili gestiti,
  richieste aperte, completate nel mese, margine del mese. Cestino sezioni `fant-immobile`/
  `fant-ticket`. ⚠️ Nodi **`fantImmobili`+`fantTickets`** (read/write studio attivo non-cliente/
  partner): **ripubblicare le regole**. CI: `deploy.yml` ora fa **3 tentativi automatici** dello
  step deploy-pages (pausa 90s/180s) — niente più commit vuoti di rilancio.
  ⚠️ **HARDENING sicurezza (7 lug)** — esito audit: XSS pulito (safeUrl ovunque, niente
  dangerouslySetInnerHTML/eval, escape nelle stampe document.write), worker AI protetto (ID token +
  profilo onboardato), root DB chiuso, anti-auto-promozione ok. Fix applicati alle regole —
  **RIPUBBLICARE `firebase-rules.json`**: 1) **`governanceVault` + `governanceVaultConfig` read →
  SOLO admin/manager** (prima: tutto lo studio attivo — le password della cassaforte sono in CHIARO
  nel DB e la master password protegge solo la UI: uno staff poteva leggerle via API); 2) **`trash`
  read → SOLO admin/manager** (i payload eliminati possono contenere dati finanza; write invariata
  così lo staff continua a spostare nel cestino ciò che elimina — per lo staff il Cestino appare
  vuoto, il restore era già admin/manager). 3) **App Check predisposto** (`firebase.ts`:
  `initializeAppCheck` + ReCaptchaV3Provider, attivo SOLO se `window.__AULICO_APPCHECK_KEY__` è
  impostata — placeholder commentato in `index.html`): quando si va in produzione, registrare l'app
  in Console → App Check (reCAPTCHA v3) + abilitare l'enforcement su RTDB e incollare la site key.
  Nota di design: l'apiKey Firebase nel client è pubblica per definizione, i dati sono protetti
  dalle regole; evoluzione futura possibile = cifratura client-side della cassaforte (Web Crypto).
  **Consegna "carta intestata + mobile + permessi" (7 lug, NESSUN nodo/regola nuovi)**:
  1) **Carta intestata ovunque**: pulsante stampa (icona Printer) sulle card di Finanze→Preventivi
  → `QuotePrintDoc` (prima c'era solo nel Centro Commerciale); le **stime** stampano con
  intestazione società da `companyInfo` (blocco `hidden print:block` in `StimaPreliminareView`).
  2) **Stime SOLO nel Centro Commerciale**: tab "Stime" nel workspace per società del
  `CommercialeHub` (gestione, timbro `soc`); nelle società `comm-stime` è `canEdit=false`.
  3) **Mappa operativa in BIANCO E NERO**: classe `grayscale` sull'iframe embed.
  4) **Mobile**: `Modal` a `z-[220]` (sopra bottom-nav z-50 e overlay z-200 — era z-60 e veniva
  coperto), grids del `QuoteEditor` a `grid-cols-1 sm:*`, righe del `PriceListModal` in
  `overflow-x-auto` (min-w-560), tabelle `DirezioneHub` avvolte in overflow-x-auto, slider fasi
  Unico con label `w-28 sm:w-48`.
  5) **PERMESSI PER-SEZIONE** (3 livelli): `SocietaAccess.sections` (`Record<sectionId,
  AccessLevel>`, vince su modules/default; types.ts) + `resolveSectionAccess` in access.ts;
  `canViewSection` ora lo rispetta e c'è `canOperateSection` (societyConfig). In App il case
  `sview` calcola `secOp` e lo mette in AND su TUTTI i `canEdit` delle sezioni → override "Visualizza"
  = sola consultazione anche per admin. Editor in `TeamRegistro` (Permessi per società → <details>
  "Sezioni" per società: Eredita/Nascosta/Visualizza/Opera per singola sezione; al primo override la
  mappa esplicita parte dal `legacyAccess(role)` così le altre società non diventano none). Le regole
  `users/$uid/access` esistenti coprono già il campo nuovo (stesso sottoalbero): NIENTE ripubblicazione.
  ⚠️ **Area Legale (Strategico)**: `legale-contratti` da placeholder a `view:'legale'` → componente
  **`LegaleView`** (lazy, admin/manager) con 3 tab: **Registro legale** (nodo NUOVO
  **`legalDocs/<id>`**, tipo `LegalDoc` in types.ts: contratti/liberatorie/informative/incarichi/
  polizze di TUTTE le società con controparte dalla rubrica, firma/scadenza, alert ≤60gg e badge
  scaduto; self-subscribe watchNode + scritture per-elemento; Cestino sezione **`legale-doc`**),
  **Modelli** (griglia `CONTRACT_TEMPLATES` → `ContractPrintDoc`, gli stessi del Centro
  Commerciale) e **Privacy & liberatorie** (cruscotto READ-ONLY: liberatorie clienti terzi da
  `mktAccounts`, registro consensi GDPR da `mktConsents`, tabella consensi registrazione da
  `users.consents`). ⚠️ Nodo **`legalDocs`** (read/write admin/manager): **ripubblicare le
  regole**, altrimenti il registro legale resta vuoto e i salvataggi falliscono in silenzio.
  **Sezione Computi per-società (NESSUN nodo/regola nuovi)**: `prod-computi` (Produzione di tutte
  le società operative) da placeholder a `view:'computi'` → componente **`ComputiView`** (lazy):
  STESSO nodo `finComputi` di FinanzeView (array intero, un computo per progetto, si sottoscrive
  da solo con watchNode come fa FinanzeView), filtrato sui progetti della società attiva
  (`p.division===soc`, non archiviati). KPI (computi/valore opere/voci/progetti senza computo),
  card per computo → editor con voci raggruppate per categoria, nuova voce inline, **import CSV**
  con modale mappatura colonne (riusa `parseCsv`/`guessMapping`/`rowsToComputoItems` di finance.ts;
  Excel/PDF solo allegato come in FinanzeView), totale live, Stampa (print-area). Il case App gate
  ad admin/manager (regole `finComputi`); delete → Cestino sezione **`computo`** (restore in
  `handleRestoreTrash` via getNode/writeNode perché finComputi non vive nello stato di App).
  **Listini per-società + VALORE IMMOBILE nel preventivo interattivo (spec utente, NESSUN nodo/regola
  nuovi — riusa `priceList` e `clientQuotes`)**: 1) `PriceItem.division` esteso a `fantastico` +
  nuovo **`PriceItem.valuePct`** (= incremento % del valore dell'immobile); il **`PriceListModal`**
  (QuotesView, ora ESPORTATO) è per-società: con `company` mostra/timbra solo le voci di quella
  società e al salvataggio riunisce le altre (il nodo resta un array unico); editabile anche dal
  **Centro Commerciale** (tab Listino → "Modifica listino", prop `onSavePriceList`); 2) **Quote**:
  nuovo **`baseValue`** (valore "stato dei luoghi") e **`QuoteLine.valuePct`** (copiata dal listino,
  editabile per riga in `QuoteEditor`, pannello "Valore immobile" con valore a fine opera live);
  helper **`quoteValue`** in finance.ts (base × (1+Σ%/100)); 3) **portale** (`ClientQuotesPanel`):
  snapshot con `baseValue` (via `quoteToShared`), badge "+X% valore" sulle voci, blocco **"Valore
  dell'immobile"** (stato dei luoghi → valore a fine opera) che sale/scende in tempo reale con le
  spunte + perdita di valore nel banner vantaggi e nella riga "−€ rispetto alla proposta completa";
  4) **stime**: `StimaPreliminare.voci[]` = voci aggiunte **dal listino della società** (select
  "+ dal listino…", qty × prezzo nel totale `stimaTotal`; App passa `priceList` filtrato per soc).
  **Consegna "richieste luglio" (NESSUN nodo/regola nuovi)**: 1) **Calendario editoriale aggregato**
  nella dashboard del Centro Marketing (`MarketingHub` → `Centro`): `EditorialCalendar` con TUTTI i
  canali (canale = account, badge colore account sui chip in vista "Tutti"), `canEdit=false`;
  2) **pannello-giorno** in `EditorialCalendar` (stato `openDay`): click sul giorno → overlay con
  TUTTI i contenuti del giorno (anche oltre i 3 in cella, "+N altri…" cliccabile) + "Aggiungi
  contenuto in questo giorno" → più pianificazioni nello stesso giorno; il click NON apre più
  direttamente l'editor vuoto; 3) **Governance sotto Amministrazione** in Strategico (voce
  `hr-governance` reparent `amm`, id invariato per link/permessi; nelle altre società resta in HR);
  4) **Mappa operativa ridisegnata** (`MatericoMappaView`): KPI per tipo, `KIND_META` con
  colore+icona per tipo di sito, card con ring colorato, barra colore + azioni con icone nel
  pannello mappa; 5) **Ferie & assenze SOLO nell'agenda personale** (prop `showLeave` di
  `CalendarView`, App la passa `true` solo per `activeSocieta==='holding'`); 6) **Stima Preliminare
  spostata nel gruppo Commerciale** di TUTTE le società (`comm-stime`, via da Produzione Onirico):
  per-società via campo `StimaPreliminare.soc` (App filtra e timbra; legacy senza soc = Onirico).
- **Google Drive (upload file del Cantiere, opzionale)**: in Google Cloud Console del progetto
  `aulico-228bd` → abilitare **Google Drive API**; creare un **ID client OAuth → Applicazione
  web** con JS origins `http://localhost:3000` e `https://giorgiopascalistudio.github.io`;
  incollarne l'ID in `src/drive.ts` (`DEFAULT_CLIENT_ID`) o impostare
  `window.__ONIRICO_DRIVE_CLIENT_ID__`. Finché non è configurato, l'upload Drive non parte e la
  UI usa il **fallback "incolla link"** (l'app resta pienamente funzionante).
- **Firebase Storage (video vetrina cinematica, §21)**: Console Firebase → Build → Storage →
  "Inizia" (i progetti recenti richiedono il piano **Blaze** per attivarlo — già previsto per le
  Cloud Functions §18; la quota no-cost resta: **5 GB** archiviati + **1 GB/giorno** di download).
  Caricare gli mp4 da console (cartella `vetrina/`), click sul file → copiare l'**URL di download**
  (con token, funziona nel tag `<video>` senza toccare le regole Storage) → incollarlo nel campo
  "Video" dell'editor vetrina o in `LANDING_SHOWCASE.videoUrl` (`src/showcaseData.ts`).
  Video consigliato: mp4 H.264 muto, ~20-30s, keyframe fitti per lo scrubbing fluido
  (`ffmpeg -i in.mp4 -c:v libx264 -crf 23 -g 15 -movflags +faststart -an out.mp4`).
- Mettere i 13 GLB in `public/model/`.

## 15. Modulo Cantiere (studio ↔ impresa partner)
- **Dove**: tab **"Cantiere"** nel fascicolo progetto (`ProjectsView`, divisioni studio/materico/
  unico) lato studio; tab **"Cantieri"** + **"La mia impresa"** nel portale `materico_partner`
  (`ClientPortalView`) lato partner. Componente unico `CantiereBoard` con prop `mode:'studio'|'partner'`.
- **Struttura (PDF `MODULI/CANTIERE.pdf`)**: navigazione a **3 aree** in `CantiereBoard` →
  **Campi condivisi** (Panoramica, Giornale di cantiere, Dati generali, Localizzazione,
  Cliente/Committente, Foto, Attività & Scadenze, Documenti, Comunicazioni/Chat), **Area Tecnici**
  (SAL, Cronoprogramma, Verifiche, Non conformità, Verbali/Ordini di servizio, Sicurezza
  POS/PSC/DUVRI, Progettazione, Doc tecnica, Controllo qualità, Storico) e **Area Impresa**
  (Documentazione, Squadre, Operai, Presenze, Mezzi, Sicurezza impresa). Config dichiarativa
  `SECTIONS` in `CantiereBoard.tsx`: ogni sezione è `comp` (componente dedicato), `cantdoc`/`cantrec`
  (registro generico), `impdoc`/`imprec` (Area Impresa) o `soon` (placeholder `SectionPlaceholder`
  per le voci ancora da attivare — promuoverle è una riga di config). Componenti riusabili in
  `src/components/cantiere/` (`DocRegistry`, `RecordRegistry`, `DriveUploader`, `SectionPlaceholder`,
  `ImpresaArea`, `GiornaleCantiere`, `CantierePanoramica`).
- **Panoramica** (`CantierePanoramica`, landing della sezione): KPI cliccabili (avanzamento+SAL,
  consegna, giornale, ore manodopera, documenti in scadenza ≤30gg, non conformità aperte, attività,
  checklist qualità) che saltano alla sezione di dettaglio via `goSection`.
- **Giornale di cantiere** (`GiornaleCantiere`, sostituisce il vecchio "Diario"/lista rapportini):
  calendario mensile (dot di stato per voce + indicatore presenze/materiali/foto), click sul giorno
  → voci del giorno + registrazioni collegate a quella data. Voce strutturata sul modello
  **D.M. 49/2018 art. 14** (`Rapportino` esteso, retro-compatibile): meteo + temp min/max,
  manodopera (qualifica×numero, `RapportinoManodopera`), mezzi, lavorazioni, annotazioni/eventi,
  foto. Lo **studio (DL) compila voci auto-approvate** (`authorRole:'studio'`, `status:'approvato'`);
  il partner invia rapportini `inviato` da approvare (come prima). Le regole esistenti coprono già
  la write studio: **nessuna ripubblicazione necessaria**. Modifica voce = riscrittura stesso id
  (il partner che modifica torna a `inviato`).
- **Modello**: vedi §6. Ogni progetto può avere 1+ cantieri (`cantieri/<cid>`, `projectId`).
  Lo studio assegna imprese **partner** per-cantiere (`partnerUids` + indice inverso
  `partnerCantieri/<uid>/<cid>`). Le sotto-collezioni per-cantiere si scrivono **per-elemento**
  (handler generici `handleSaveCantEntity`/`handleDeleteCantEntity`); l'Area Impresa (keyed per uid)
  usa `handleSaveImpresaEntity`/`handleDeleteImpresaEntity` in `App.tsx`. La chat usa
  `handleSendCantiereMessage`; **unsend entro 60s** del proprio messaggio
  (`handleDeleteCantiereMessage`/`handleDeleteProjectMessage` in App + `ChatDeleteButton`,
  componente che si nasconde da solo allo scadere — rimozione diretta, senza doppia
  conferma/cestino: eccezione documentata al pattern `askDelete` di §20). Nella tab SAL
  l'**avanzamento** si allinea automaticamente alla % dell'ultimo SAL approvato
  (`handleApproveSal`) e lo slider salva solo al rilascio.
- **Permessi** (`firebase-rules.json`): cantiere/sotto-collezioni leggibili da studio attivo
  **o** partner assegnato; rapportini/presenze/foto/materiali/documenti/records/messages scrivibili
  dal partner assegnato solo per **propri** elementi (`by`/`partnerUid`/`from == auth.uid`);
  approvazioni (`status:'approvato'`, `approvedBy`), checklist, SAL e log scrivibili **solo dallo
  studio**. `impresaDocs`/`impresaRecords/<uid>` scrivibili dal partner proprietario (`auth.uid==$uid`)
  o admin/manager, leggibili da tutto lo studio attivo.
- **Sottoscrizioni** (`App.tsx`): studio sottoscrive tutti i nodi `cantier*`; il partner
  sottoscrive `partnerCantieri/<uid>` e poi, per ogni `cid`, il cantiere e le sotto-collezioni.
- **SAL → finanza**: lo studio approva un `cantiereSal` (`handleApproveSal`); in `FinanzeView`
  → tab **SAL** compaiono i SAL approvati non fatturati con "Emetti bozza fattura"
  (`handleGenerateCantiereSalInvoice`, riusa la logica di `handleGenerateSalInvoice`); il
  `linkedInvoiceId` collega cantiere↔fattura ed evita doppioni.
- **File**: `DriveUploader` (`src/components/cantiere/DriveUploader.tsx`, usato da `CantiereBoard`,
  `DocRegistry`, `ImpresaArea`) carica su Google Drive (vedi §13) e in mancanza ricade su link
  incollato. In Firebase si salva solo `{driveFileId,driveUrl}` o `link`.
- **Collegamento ai task del fascicolo**: solo riferimento in lettura (`taskRefs`), nessun
  cambio di stato dei task.

## 14. Finanza holding (parcelle + libri per società)
- **Motore**: `src/finance.ts` (vedi §6). Regole ricavo: **Studio 15%** su
  (computo + arredi fissi) **+ 20%** arredi mobili se `Project.studioManagesArrediMobili`;
  **Materico 15%** sul costo partner; **Unico** = rivendita − acquisto − ristrutturazione.
- **`FinanzeView`**: selettore **Società** (Studio·Strategico·Materico·**Unico**·
  **Consolidato**); tab **Parcelle & Onorari** (calcolo automatico); import computo da
  **CSV** (Excel/PDF → allegato `sourceFileName`, no parsing); SAL derivati dalla parcella;
  numerazione fatture per società (`FE-STU/STR/MAT/UNI`); Conto Economico per società +
  Consolidato di gruppo. Cash-flow/banca restano **simulati** ma etichettati.
- Excel parsing: richiede **SheetJS (`xlsx`)** — non installato (oggi solo CSV nativo).
- **Contabilità di commessa** (per-progetto): tab **"Contabilità di commessa"**
  (`projTab === 'finanziario'`) nel fascicolo (`ProjectsView`, solo admin/manager).
  Riusa il motore `finance.ts` per il quadro economico automatico (valore opera =
  computo + arredi **fissi confermati**; parcella; ricavi/incassato/da-incassare da
  `finInvoicesActive`; costi da `finInvoicesPassive`; margine atteso/realizzato;
  avanzamento %; piano SAL). I pulsanti **Registra costo/ricavo/scadenza** scrivono
  sui **nodi finanza globali** (`finInvoicesPassive`/`finInvoicesActive`/`finScadenze`)
  con `projectId` + `sector = division` → confluiscono nel **consolidato** di `FinanzeView`.
  Unica fonte di verità: nessun nodo per-progetto dedicato. App sottoscrive i 4 nodi
  strutturati (gated `canFinance`) e passa array + handler (`handleSaveFinanceItem`/
  `handleDeleteFinanceItem`) sia a `ProjectsView` sia (indirettamente) accanto a
  `FinanzeView`. I "movimenti liberi" (cassa) restano su `studioFinance` e **non**
  entrano nel margine. Lo snapshot `projectEconomics` per il cliente resta **solo
  ricavi** (niente costi/margine dello studio).

## 16. Preventivi & Amministrazione (CRM esteso)
- **`QuotesView`** vive in **Finanze → tab "Preventivi & Parcelle"** (la voce sidebar "Preventivi"
  è stata rimossa; la route `#preventivi` redirige a Finanze col tab aperto). **Sempre differenziato
  per società**: segue il selettore Società di FinanzeView; con "Tutte/Consolidato" la lista è
  raggruppata per divisione con i colori settore. Nodo `quotes/<id>` (`Quote`):
  `docKind` **preventivo|parcella**, righe per **macro-voce** (Progettazione/Consulenza/Opere edili/
  Impiantistica/Materiali/Altro), **stati** (Elaborato/In attesa/Accettato/Rifiutato), **IVA e Cassa
  previdenziale spuntabili** (default IVA 22% on, cassa 4% off; totali con `quoteTotals`), **piano
  pagamenti** (`PaymentMilestone`: acconto/rate/saldo con % o importo + scadenza, importi imponibili).
  Cliente dalla rubrica `clients`. Editor riusabile **`QuoteEditor`**: usato anche dal fascicolo
  progetto (`ProjectsView` tab "Contabilità & Bilancio" → pannello "Preventivi & Parcelle", con
  progetto/divisione bloccati) — stesso nodo, stessa lista in Finanze.
- Anche le **fatture attive** (`InvoiceActive`) hanno IVA (`taxRate`, 0 = niente IVA) e
  **`cassaPct`** spuntabili nel form di FinanzeView; helper `docTotals`/`invoiceTotals` in
  `finance.ts` (la cassa concorre alla base imponibile IVA).
- **Collegamento a finanza**: `handleEmitMilestone` (App) genera da una rata una **bozza fattura
  attiva** (`finInvoicesActive`) + **scadenza** (`finScadenze`) via `handleSaveFinanceItem`
  (con `projectId`/`sector=division`) → consolidato `FinanzeView`; la milestone tiene `invoiceId`.
- **Quadro pagamenti per cliente**: nella scheda cliente del CRM (fatturato/incassato/da incassare +
  scadenze da sollecitare con pulsanti email/WhatsApp). Notifica al team su preventivo accettato.

## 17. CRM esteso — rubrica, produttività, ferie, notifiche
- **Notifiche persistenti** (vedi §6 `notifications`): `pushNotification(uid,…)` / `notifyStudio(…)`
  in `App.tsx`; il Centro Notifiche (desktop+mobile) legge il nodo; click apre `link` (hash).
- **Rubrica clienti potenziata** (`CrmView` tab Clienti): `ClientRecord.tier` (fasce 1/2/3 + filtro),
  `responsabili` (più membri), `whatsapp`; scheda con storico progetti + quadro pagamenti + WhatsApp/email.
- **Task & Produttività**: `Task.priority` include **'urgente'**, `Task.tipo` (tipologia, datalist);
  notifica al collaboratore alla (ri)assegnazione; **dashboard produttività** per collaboratore in
  `TeamView` (aperti/urgenti/scaduti/completati, settimana/mese).
- **Ferie team** (vedi §6 `teamLeave`): pannello in `CalendarView` + notifica in-app a tutti.

## 18. Backend — Cloud Functions (automazioni)
- Cartella **`functions/`** (TS, firebase-functions v2, region `europe-west1`), config `firebase.json`
  + `.firebaserc` (progetto `aulico-228bd`). Email via **SendGrid** (secret `SENDGRID_KEY`).
- Funzioni: `onQuoteStatusChange` (preventivo accettato → notifica+email), `dailyReminders`
  (ferie 7gg prima + scadenze 3gg), `weeklyReport`/`monthlyReport` (attività completate per
  collaboratore), **`aiGenerate`** (callable AI Anthropic, §22-quater — secret `ANTHROPIC_KEY`, solo studio
  attivo), **`marketingMonthlyReport`** (sintesi marketing mensile ad admin/manager),
  **`expiryAlerts`** (alert scadenze documenti/contratti a 60/30/15/7/0 gg — `impresaDocs`/
  `cantiereDocumenti.expiry` + `mktContracts.endAt`) e **`matericoDelayCheck`** (consegne Materico
  oltre la scadenza concordata a 1/7/14/30 gg → "valuta penale"). Scrivono notifiche su
  `notifications/<uid>` (Admin SDK, bypassa le regole).
- **Deploy a carico utente** (vedi `functions/README.md`): `firebase login`, piano **Blaze**,
  `firebase functions:secrets:set SENDGRID_KEY` (+ `ANTHROPIC_KEY` per l'AI assist),
  `firebase deploy --only functions`. Non verificabile
  da Claude (serve auth/Blaze/API key). WhatsApp automatico = futuro (oggi link `wa.me` in app).
- **Fallback senza Blaze — reminder in-app "soft"** (`App.tsx`, effetto `softRemRef`): finché le
  Functions non sono deployate, quando un membro dello studio apre l'app vengono generate notifiche
  in-app una-tantum per ferie/assenze dei colleghi in arrivo (≤7gg) e scadenze finanziarie aperte
  (≤3gg, solo admin/manager). Solo in-app (niente email/cron); ognuno scrive sul **proprio**
  `notifications/<uid>`; dedup con id deterministico (`rem-leave-<id>`/`rem-scad-<id>`) + check
  `getNode` per non sovrascrivere lo stato "letto". Convive con `dailyReminders` (id diversi).
- **Alternativa GRATIS senza Blaze (consigliata pre-lancio)**: invece delle Cloud Functions si usano
  due servizi gratuiti che NON richiedono carta:
  - **`automation/`** (cron via **GitHub Actions**, `.github/workflows/cron.yml` + `automation/cron.mjs`
    con `firebase-admin`): replica reminder/expiryAlerts/matericoDelayCheck/report scrivendo
    `notifications/<uid>`. Gira anche se nessuno apre l'app. Secrets repo: `FIREBASE_SERVICE_ACCOUNT`,
    `FIREBASE_DB_URL` (vedi `automation/README.md`).
  - **`cloudflare-worker/`** (AI via **Cloudflare Worker** + **Gemini** free): sostituisce `aiGenerate`.
    `callAi` in `src/firebase.ts` usa il Worker se `window.__AULICO_AI_URL__` è impostato (in `index.html`),
    altrimenti fallback alla Cloud Function. Secrets Worker: `GEMINI_KEY`, `FIREBASE_API_KEY`
    (vedi `cloudflare-worker/README.md`).
  Le Cloud Functions in `functions/` restano valide per chi preferisce Blaze; i due percorsi sono
  alternativi e scrivono sugli stessi nodi.

## 19. Moodboard 3D (R3F)
- **Dove**: tab **"Arredi & Moodboard"** (`FurnishingsBoard`) → sezione **Moodboard**: anteprima +
  pulsante **"Apri moodboard 3D"** che apre l'editor in **overlay a tutto schermo**. Sostituisce la
  vecchia lavagna 2D (drag tile su `Furnishing.board`, ora deprecata). Disponibile lato studio
  (`ProjectsView`) e portale cliente (`ClientPortalView`).
- **Origine**: prototipo esterno (`moodboard-3d/`, **gitignorato** assieme alla libreria texture PBR
  ~3,6 GB non usata dal codice/non deployabile) integrato in **`src/components/moodboard3d/`**
  (`Moodboard3D` overlay + `MoodboardCanvas`/`Sidebar`/`Toolbar`/`PropertiesPanel` + `data/types/utils`).
- **Stack**: `@react-three/fiber` + `@react-three/drei` + `three` (già presente). I materiali della
  libreria caricano texture da **URL Unsplash** (le PBR locali NON sono collegate — fase futura:
  ottimizzare un subset e ospitarlo in `public/` o Firebase Storage). Il modulo è **lazy-loaded**
  (`React.lazy` in `FurnishingsBoard`) → chunk separato `Moodboard3D-*.js`, scaricato solo all'apertura.
- **Persistenza**: nodo `projectMoodboard3d/<pid>` (vedi §6). `Moodboard3D` riceve `elements`+`onSave`;
  salva su click **Salva**, alla **chiusura** e in **autosave** (debounce ~1,5s). App: stato
  `moodboard3d`, sub (studio: nodo intero; cliente: per-pid), handler `handleSaveMoodboard3d`.
- **Adeguamento grafico**: chrome (header/overlay/gizmo/tooltip) in stile Onirico; i colori "cablati"
  dei pannelli del prototipo sono rimappati ai token via CSS scoped `.mb3d` in `src/index.css`
  (chiaro + dark). Funzionalità del prototipo **invariate** (rimosso solo lo share-link `#board=`
  che confliggeva col router a hash).
- ⚠️ Regole: aggiunto `projectMoodboard3d` in `firebase-rules.json` → **ripubblicare**.

## 20. Cestino, doppia conferma, archiviazione
- **Cestino** (`TrashView`, voce sidebar admin/manager, route `#cestino`; nodo `trash/<id>`,
  tipo `TrashItem`): OGNI eliminazione passa da qui per **60 giorni** (`TRASH_RETENTION_DAYS`),
  poi purge automatico client-side (effetto in App). Helper in App: `moveToTrash(section,label,
  payload,meta?,detail?)` (no-op per cliente/partner: niente write su trash), `handleRestoreTrash`
  (switch per `section` → riscrive nel nodo di origine), `handleTrashDeleteForever`.
  Sezioni coperte: progetti, task, preventivi, fatture attive/passive, scadenze, movimenti,
  documenti, arredi, appuntamenti, richieste/preventivi Materico, rubrica, lead/fornitori CRM,
  operazioni Unico, cantieri + voci cantiere, Area Impresa, ferie.
- **Doppia conferma**: `ConfirmDeleteModal` (stato `confirmDel` in App, helper
  `askDelete(title,message,onConfirm,permanent?)`): il primo click su "Elimina" arma il pulsante,
  il secondo conferma. Renderizzata sia nel layout studio sia nel portale cliente/partner.
  TUTTI gli handler di delete in App passano da `askDelete`; i componenti che eliminano
  internamente (CrmView, UnicoStudioView, FinanzeView-computi) ricevono `askDelete`/`onTrashItem`
  come prop (con fallback `confirm()`). **Niente più `window.confirm` diretti** nelle eliminazioni.
- **Archiviazione progetti**: `Project.archived` + `handleToggleArchiveProject` (App). Pulsante
  archivia/ripristina nell'header del fascicolo e nel modale "Modifica pratica". Gli archiviati
  escono da tutte le liste di default (Dashboard, filtri Attivi/Completati/Tutti) e compaiono solo
  nel filtro **"Archivio"** di ProjectsView (insieme a sospesi/annullati), con badge ambra.
- **Colori società**: `COMPANY_COLOR` in `finance.ts` (unica fonte; usato da Dashboard, Preventivi,
  liste progetti). Non ridefinire i colori inline nei nuovi componenti.

## 21. Vetrina cinematica (login + immobili Unico)
- **`CinematicShowcase`** (`src/components/CinematicShowcase.tsx`): pagina a tutto schermo con
  **video continuo** di sfondo; rotella/swipe fanno scorrere il video con easing tra **scene**
  mappate su secondi precisi (`UnicoShowcaseScene { time, subtitle, text }`), pallini di
  navigazione, vignette per contrasto. Props: `videoUrl` (sempre **online**, fallback `poster`
  immagine se manca/fallisce), `scenes`, `brand`/`brandSub`, `footer` (ReactNode fisso sotto al
  testo), `onDiscover`/`discoverLabel` (CTA sull'ultima scena), `onClose` (uso overlay).
  Origine: prototipo `MODULI/villa-omnia.zip`, senza l'uploader runtime.
- **Login**: la landing di `AuthFlow` È il CinematicShowcase (config **`LANDING_SHOWCASE`** in
  `src/showcaseData.ts` — sostituire lì il `videoUrl` placeholder con l'URL Firebase Storage),
  con i tasti "Inizia il tuo progetto" (→ registrazione) e "Sono già cliente" (→ login) nel
  footer. Le schermate login/registrazione sono invariate.
- **Allestimento per-operazione**: in `UnicoStudioView` ogni card deal ha il pulsante **"Vetrina"**
  (pallino indigo se pubblicata) → **`UnicoShowcaseEditor`** (copertina, video URL online,
  descrizione, punti di forza, scene sec/titolo/testo, **anteprima** fullscreen, checkbox
  pubblica). Salva in `UnicoDeal.showcase` (`UnicoShowcaseConfig`) + `published`.
- **Pubblicazione**: `saveUnicoDeals` (App) riscrive in write-through il nodo intero
  **`unicoShowcase`** con `dealToShowcaseEntry(deal)` (`src/showcaseData.ts`) per i soli deal
  `published` → depubblicazioni/eliminazioni sempre in sync. Lo snapshot è **solo campi
  divulgabili** (vendita/quota/ROI/durata/raccolto/n.investitori, MAI costi né nomi investitori).
- **Lato cliente**: App sottoscrive `unicoShowcase` (entrambi i rami) e lo passa via
  `ClientPortalView` a `ServicesShowcase`: la vetrina Unico usa le entry reali (badge "Tour video"
  sulle card con video; click → pagina cinematica con CTA "Dettagli & investi" → modale dettaglio);
  senza entry pubblicate restano i demo `UNICO_PROPERTIES` (disclaimer "dati dimostrativi" solo lì).
- **Video**: SEMPRE URL online (Firebase Storage consigliato, vedi §13) — un unico mp4 continuo
  per pagina; le scene puntano ai suoi secondi. Niente upload dal client.

## 22-sex. Strategico — architettura project-centric (IA a 3 livelli)
**IMPORTANTE**: il modulo NON è più una lista piatta di sezioni globali. È organizzato **per progetto**
(richiesta esplicita utente: "non posso mischiare i dati a caso"). `StrategicoView` ha 3 livelli:
- **Livello 0/1 — Home** (`homeTab`): pillbar **Dashboard · Progetti · Lead · Contratti · Consensi · Libreria ·
  Automation**. La **Dashboard** (`DashboardTab`) è solo overview (KPI globali + griglia progetti cliccabile +
  alert "richiede attenzione" + `AnalisiTab`). **Progetti** (`MktProjectsTab`) elenca i progetti marketing.
- **Livello 2 — dentro un progetto** (`activeId` ≠ null → `ProjectWorkspace`): pillbar di progetto
  **Panoramica · Deliverable · Revisioni · Campagne · Social · Eventi · Ads · SEO · Sondaggi · Analytics · Time ·
  Inbox · Report**. Ogni entità è **filtrata per `mktProjectId`** (`inProj`) e le nuove voci vengono **timbrate**
  col progetto + cliente (`stamp`). `ProjectPanoramica` = tile-KPI del progetto con salto alle sezioni.
- **Contenitore**: nuova entità **`MktProject`** (`mktProjects/<id>`) — `{name, clientId, status, color…}`,
  legata a un cliente della rubrica. Handler `handleSaveMktProject`/`handleDeleteMktProject` (Cestino `mkt-progetto`).
- **Campo `mktProjectId`** aggiunto alle entità operative: `MarketingEvent, Campaign, SocialPost, Survey,
  MktDeliverable, MktProof, MktAdCampaign, MktSeoItem, MktMetric, MktInboxItem, MktTimeEntry`. Le entità
  **globali** (NON per progetto) restano senza scope: `MktLead, MktContract, MktConsent, MktAsset, MktFlow`.
- **Migrazione**: le voci legacy senza `mktProjectId` finiscono nel bucket **"Non assegnati"** (pseudo-progetto
  `__unassigned__` in `MktProjectsTab`), apribile per riassegnarle. Nessun dato perso.
- Il `ReportTab` accetta `reportTitle` ed è usato sia globale sia per-progetto (dati filtrati). `EconomiaTab`/
  `ActivityTab` legacy non più montati (codice morto, sostituiti da Dashboard/Panoramica).
- ⚠️ Regole: aggiunto nodo **`mktProjects`** in `firebase-rules.json` → ripubblicare.

## 22. Modulo Strategico / Marketing
- **Dove**: **dentro Progetti**, divisione **STRATEGICO**. Per admin/manager (`isInternalBoss`) la divisione
  mostra **direttamente** `StrategicoView` (`showStrategicoStudio = divisionFilter==='strategico' && isInternalBoss`):
  **l'interruttore "Progetti | Marketing & Eventi" è stato RIMOSSO** — Strategico è una società di marketing,
  non ha pratiche, il suo "progetto" è il **progetto marketing** (`MktProject`, §22-sex). **Non** è una voce
  sidebar/route a sé. Componente `src/components/StrategicoView.tsx`. Colore settore **ambra `#b45309`** (§10).
  Architettura **project-centric a 3 livelli**: vedi **§22-sex** (Dashboard → Progetti → workspace di progetto).
- **Economia (§22-bis, Blocco A) — ogni dato economico confluisce in Finanza** con `sector:'strategico'`
  (nessun nodo finanza nuovo; stesso schema di `handleEmitMilestone`):
  - **Contratti & Retainer** (`mktContracts/<id>`, tipo `MktContract`): abbonamenti ricorrenti
    (mensile/trimestrale/annuale/una_tantum) con alert rinnovo (`endAt`). Pulsante "Emetti <periodo>"
    (`handleEmitContractInvoice`) → bozza **fattura attiva** + **scadenza**, dedup per `periodLabel` nello
    storico `emissions`. KPI MRR.
  - **Time tracking** (`mktTimeEntries/<id>`, tipo `MktTimeEntry`): ore per cliente/progetto/campagna,
    tariffa €/h, `billable`. Selezione multipla → "Fattura in Finanza" (`handleBillTimeEntries`) genera
    fattura attiva + scadenza e marca `billedInvoiceId`.
  - **Economia** (read-only): ricavi/costi/margine/incassato/da-incassare filtrati su `sector==='strategico'`
    + MRR + valore ore non fatturate.
  - **Campagne**: campi `budget`/`spend` + **UTM builder** (`Campaign.utm`); "Registra spesa"
    (`handleRegisterCampaignSpend`) → **fattura passiva**. **Eventi**: `budget`/`revenue`; "Registra in
    Finanza" (`handleRegisterEventFinance`) → ricavi=fattura attiva, costo=fattura passiva.
  - App: stato `mktContracts`/`mktTime`, sub studio sui due nodi, handler save/delete (+ Cestino, sezioni
    `mkt-contratto`/`mkt-time`) e i bridge-finanza sopra; props via `ProjectsView` → `StrategicoView`.
- **Produzione (§22-ter, Blocco B) — gruppo "Produzione" in `StrategicoView`** (studio, admin/manager):
  - **Asset library** (`mktAssets/<id>`, tipo `MktAsset`): libreria media (immagine/video/documento/link)
    con **tag** + ricerca, cliente/campagna collegati, URL Drive/link (`safeUrl`). Sezione Cestino `mkt-asset`.
  - **Deliverable kanban** (`mktDeliverables/<id>`, tipo `MktDeliverable`): board a 5 colonne
    (`da_fare|in_lavorazione|in_revisione|approvato|pubblicato`), cliente/campagna/assegnatario/scadenza/priorità;
    spostamento con frecce; notifica all'assegnatario. Sezione Cestino `mkt-deliverable`.
  - **Proofing/Revisioni** (`mktProofs/<id>`, tipo `MktProof`): creativo (immagine via URL) con **annotazioni
    contestuali** (`ProofAnnotation` x/y%) cliccando sull'immagine (`ProofViewer`), stato
    `in_revisione|approvato|modifiche_richieste`, **versioning** (`version`, "Nuova versione" tiene solo le note
    aperte). Sezione Cestino `mkt-proof`.
  - App: stato `mktAssets`/`mktDeliverables`/`mktProofs`, sub studio, handler save/delete; props via
    `ProjectsView` → `StrategicoView` (passa anche `users` come `team` per gli assegnatari). **Da fare (B,
    fase portale)**: approvazione proof/deliverable e commenti lato cliente nel portale; lead scoring/segmentazione.
- **Direzione (§22-quater, Blocco C) — gruppo "Panoramica" → tab "Report" + AI assist**:
  - **Report white-label** (`ReportTab`, client-side, nessun nodo): KPI aggregati di Strategico (eventi/
    adesione, campagne, social/reach, sondaggi/soddisfazione media, economia ricavi/costi/margine/MRR, ore) +
    pulsante **Stampa/PDF** (CSS `@media print` con `.print-area`/`.no-print` in `index.css`, brandizzato).
  - **AI assist** (`AiAssist`): componente che chiama la Cloud Function **`aiGenerate`** (Anthropic) via
    `callAi` in `src/firebase.ts` (`getFunctions(app,'europe-west1')` + `httpsCallable`). Usato per generare il
    **messaggio campagna** (CampaignModal) e la **sintesi direzionale** del report. **Predisposto**: senza deploy
    Functions / senza secret `ANTHROPIC_KEY` mostra un avviso e non blocca nulla.
  - **Backend** (`functions/src/index.ts`): `aiGenerate` (onCall, secret `ANTHROPIC_KEY`, solo studio attivo —
    chiama l'API Anthropic Messages, modello default `claude-sonnet-4-6`) e `marketingMonthlyReport` (onSchedule,
    sintesi mensile ad admin/manager via notifica + email SendGrid). Deploy a carico utente (vedi §18 e README).
- **Acquisizione / Dati / Compliance (§22-quinquies, Blocchi D–K)** — 8 moduli, tutti in `StrategicoView`
  (studio attivo non-cliente/non-partner). Dove servirebbero API esterne, i dati sono **manuali e predisposti**
  per ricevere le API in seguito. Nuovi nodi: `mktLeads`, `mktFlows`, `mktSeo`, `mktAds`, `mktMetrics`,
  `mktInbox`, `mktConsents` (gruppi pillbar **Acquisizione** e **Dati & Compliance**):
  - **Lead** (`mktLeads`, `MktLead`): pipeline a 6 fasi + **lead scoring** (`suggestScore` da email/telefono/
    azienda/valore/fase, override manuale) + valore pipeline/conversione.
  - **Automation** (`mktFlows`, `MktFlow`): flussi nurturing multi-step (email/whatsapp/sms) con trigger; i
    messaggi sono testo per gli invii via link (no invio automatico, coerente con la scelta "solo link").
  - **SEO & Content** (`mktSeo`, `MktSeoItem`, `kind: keyword|brief`): keyword (volume/difficoltà/posizione
    manuali) + content brief con **outline via AI** (`AiAssist`).
  - **Advertising/PPC** (`mktAds`, `MktAdCampaign`): campagne paid per piattaforma con budget/metriche manuali;
    "Registra spesa" (`handleRegisterAdsSpend`) → **fattura passiva** in Finanza (`sector:'strategico'`).
  - **Analytics** (`mktMetrics`, `MktMetric`): metriche GA4/Ads/social inserite a mano (pluggable API).
  - **Inbox** (`mktInbox`, `MktInboxItem`): messaggi/commenti social unificati manuali, sentiment + gestito.
  - **Consensi GDPR** (`mktConsents`, `MktConsent`): registro consensi (finalità/base giuridica/grant-revoke).
  - **Attività** (`ActivityTab`, **derivato**, nessun nodo): feed delle modifiche recenti su tutti i nodi `mkt*`.
  - App: stato/sub/handler save-delete per i 7 nodi (+ Cestino, sezioni `mkt-lead|mkt-flow|mkt-seo|mkt-ad|
    mkt-metric|mkt-inbox|mkt-consent`) + `handleRegisterAdsSpend`; props via `ProjectsView` → `StrategicoView`.
- **Eventi & inviti** (`mktEvents`): evento con `invitees` (map keyed per uid/contatto, RSVP
  `invitato|accettato|rifiutato|forse`). Invitati aggiunti dalla **rubrica `clients`**; chi ha
  `accountUid` riceve l'invito (notifica + indice `mktInvitesIndex/<uid>`) e risponde dal portale.
- **Campagne & follow-up** (`mktCampaigns`): canale (email/whatsapp/social/misto), stagionalità, fasce
  destinatarie, `steps` di follow-up. I destinatari si generano dalla rubrica come **link `mailto:`/`wa.me`**
  pronti (coerente con la scelta "solo link", niente invio automatico senza backend — vedi memoria CRM).
- **Sondaggi** (`mktSurveys` + risposte `mktSurveyResponses/<sid>/<uid>`): domande rating/scelta/testo,
  `audience` (clienti/partner/tutti), `active`. Il cliente li compila dal portale (`MarketingPortalPanel`),
  lo studio vede i **risultati aggregati** (media voti, distribuzione scelte, risposte testo).
- **Social** (`mktSocial`): **calendario editoriale** a colonne per stato (idea/bozza/programmato/pubblicato),
  piattaforma (IG/FB/LinkedIn/TikTok/YouTube), caption, data, link media (`safeUrl`), campagna collegata,
  metriche manuali (reach/like).
- **Analisi**: cruscotto calcolato sui dati esistenti (tasso adesione eventi, tasso risposta inviti,
  conversione campagne, soddisfazione media sondaggi, reach social). Nessun nodo nuovo.
- **App wiring**: stato `mktEvents/mktCampaigns/mktSurveys/mktSocial/mktResponses`; sub studio su tutti i
  nodi `mkt*`; sub portale su `mktSurveys` (+ propria risposta per-sid) e `mktInvitesIndex/<uid>` → singoli
  `mktEvents/<id>`. Handler `handleSaveMktEvent/Campaign/Survey/SocialPost` (+ delete via `askDelete`/Cestino,
  sezioni `mkt-evento|mkt-campagna|mkt-sondaggio|mkt-social`), `handleRsvpEvent`, `handleSubmitSurveyResponse`
  (granulari, con `notifyStudio`). Regole: vedi §6/§7/§13.
