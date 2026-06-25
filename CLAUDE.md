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
`ClientPortalView` (portale cliente/partner, ~2400 righe; la **tab Dashboard è una HOME**:
benvenuto + griglia di box-sezione stile app + box "Il tuo percorso" (`PercorsoBox`,
gamification, espandibile) + `DailyQuiz` — **niente progetti nella dashboard**; i progetti
vivono nella tab **lavori/Progetti**, dove se il cliente ne ha **più di uno** compaiono delle
**card selezionabili** (come il portale team) che impostano `activePid`), `ServicesShowcase`
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
