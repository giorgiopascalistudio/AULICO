/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager' | 'staff' | 'cliente' | 'partner';

/** Cosa sceglie l'utente in fase di iscrizione. */
export type AccountType = 'cliente' | 'azienda' | 'team';

/**
 * RBAC granulare per-società/per-modulo (visione Aulico).
 * Livello crescente: none < view < operate < admin.
 */
export type AccessLevel = 'none' | 'view' | 'operate' | 'admin';

/** Le società del gruppo (chiavi codice invariate; "studio" = etichetta UI "Onirico"). */
export type Societa = 'studio' | 'strategico' | 'materico' | 'unico' | 'fantastico' | 'holding';

/** Permesso su una singola società: default + override opzionali per modulo. */
export interface SocietaAccess {
  default: AccessLevel;
  modules?: Record<string, AccessLevel>;
}

/** Mappa permessi dell'utente per società. Assente ⇒ fallback al ruolo legacy. */
export type AccessMap = Partial<Record<Societa, SocietaAccess>>;

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  functions?: string[];
  active?: boolean;
  /** RBAC granulare per-società/modulo. Se assente, si usa il fallback dal `role`. */
  access?: AccessMap;
  createdAt: number;
  projectIds?: Record<string, boolean>;
  telefono?: string;
  pending?: boolean;
  sector?: 'studio' | 'strategico' | 'materico' | 'unico' | 'partner' | 'altro';
  // Controllo accessi (Firebase)
  status?: 'pending' | 'approved' | 'rejected';
  lang?: 'it' | 'en';            // lingua preferita del portale (default: italiano)
  photoURL?: string;
  approvedBy?: string;
  approvedAt?: number;
  // ---- Onboarding / iscrizione ----
  accountType?: AccountType;     // cliente | azienda | team (scelto all'iscrizione)
  profileComplete?: boolean;     // true quando il form di registrazione è stato completato
  firstName?: string;
  lastName?: string;
  residenza?: string;            // indirizzo di residenza (privato)
  privacyAccepted?: boolean;
  privacyAcceptedAt?: number;
  // ---- Dati azienda (accountType === 'azienda') ----
  companyName?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  pec?: string;
  sdi?: string;                  // codice destinatario fatturazione elettronica
  companyAddress?: string;       // sede legale
}

export interface ProjectTask {
  id?: string;
  title: string;
  order: number;
  done: boolean;
  role?: string | null;
  assignee?: string | null;
  due?: string | null;
  durationDays?: number | null;  // durata stimata (per la pianificazione da data inizio)
}

export interface Phase {
  id?: string;
  name: string;
  order: number;
  tasks: Record<string, ProjectTask>;
}

export interface Project {
  id: string;
  name: string;
  code?: string | null;
  client?: string | null;
  location?: string | null;
  manager?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  status: 'attivo' | 'completato' | 'sospeso' | 'annullato';
  archived?: boolean;            // archiviato: escluso dalle liste di default (filtro "Archivio")
  icon?: string;
  templateId?: string | null;
  templateName?: string | null;
  clientUid?: string | null;
  clientRecordId?: string | null;   // anagrafica nella Rubrica clienti (nodo `clients`)
  committente?: string | null;
  indirizzoImmobile?: string | null;   // composto da via/civico/cap/comune/provincia (o testo libero legacy)
  // Indirizzo immobile strutturato
  via?: string | null;
  civico?: string | null;
  cap?: string | null;
  comune?: string | null;
  provincia?: string | null;
  foglio?: string | null;              // legacy: primo identificativo catastale
  particella?: string | null;
  sub?: string | null;
  /** Identificativi catastali multipli (il primo popola anche foglio/particella/sub legacy). */
  catastali?: { foglio: string; particella: string; sub?: string | null }[] | null;
  tipoIntervento?: string | null;
  interventoEdilizio?: string | null;   // id intervento edilizio (configuratore Studio)
  titoloAbilitativo?: string | null;    // id titolo abilitativo: CILA/SCIA/PdC...
  clientMessage?: string | null;
  clientMessageAt?: number | null;
  clientMessageBy?: string | null;
  phases: Record<string, Phase>;
  createdAt: number;
  updatedAt: number;
  division?: 'studio' | 'strategico' | 'materico' | 'unico';
  studioManagesArrediMobili?: boolean;   // lo Studio cura scelta+approvvigionamento arredi mobili → fee 20%
  studioFeePct?: number;                  // override % onorari Studio (default 0.15)
  arrediMobiliFeePct?: number;            // override % fee arredi mobili (default 0.20)
  marketingBudget?: number;
  marketingChannels?: string;
  marketingGoal?: string;
  matericoEstimatedBudget?: number;
  matericoFinitureType?: string;
  matericoSottofondiStatus?: string;
}

export interface MatericoEstimate {
  id: string;
  projectId: string;
  itemName?: string;
  itemDescription?: string;
  partnerName: string;
  basePrice?: number;
  baseCost?: number;
  markupPercent?: number;
  markupPercentage?: number;
  finalPrice?: number;
  finalClientPrice?: number;
  status: 'richiesto' | 'preventivato_partner' | 'proposto_cliente' | 'accettato' | 'rifiutato' | 'pending_client' | 'approvato';
  notes?: string;
  requestNotes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  priority: 'urgente' | 'alta' | 'media' | 'bassa';
  tipo?: string | null;          // tipologia attività (rilievo, progetto 3D, computo…)
  activityId?: string | null;    // attività del catalogo punti (auto-punteggio al completamento)
  assignee?: string | null;      // primo assegnatario (compat: filtri/regole esistenti)
  assignees?: string[] | null;   // multi-assegnatario: il task compare nel calendario di tutti
  projectId?: string | null;
  owner?: string | null;
  notes?: string | null;
  done: boolean;
  completions?: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  _proj?: boolean; // synthesized flag for client-side project task mapping
}

/** Notifica persistente (nodo notifications/<uid>/<id>); scritta da app o Cloud Functions. */
export interface Notification {
  id: string;
  type: string;                  // es. 'ferie','preventivo','scadenza','task','appuntamento'
  title: string;
  body?: string | null;
  link?: string | null;          // hash di destinazione (es. '#preventivi')
  read: boolean;
  at: number;
  by?: string | null;
  byName?: string | null;
}

// ---- Preventivi studio (nodo quotes/<id>) ----
export type QuoteMacro = 'progettazione' | 'consulenza' | 'opere_edili' | 'impiantistica' | 'materiali' | 'altro';

export interface QuoteLine {
  id: string;
  macro: QuoteMacro;
  desc: string;
  qty: number;
  unitPrice: number;
  amount: number;            // qty * unitPrice
}

export interface PaymentMilestone {
  id: string;
  label: string;             // es. 'Acconto', 'SAL 1', 'Saldo'
  percent?: number | null;   // % del totale (opzionale)
  amount: number;            // importo della rata
  dueDate?: string | null;   // yyyy-mm-dd
  status: 'da_emettere' | 'fatturato' | 'incassato';
  invoiceId?: string | null; // fattura attiva collegata (finInvoicesActive)
}

export type QuoteStatus = 'elaborato' | 'in_attesa' | 'accettato' | 'rifiutato';

export interface Quote {
  id: string;
  number: string;            // numero preventivo (es. PRV-2026-001)
  docKind?: 'preventivo' | 'parcella';  // tipo documento (default 'preventivo')
  clientRecordId?: string | null;
  clientName: string;
  projectId?: string | null;
  division: 'studio' | 'strategico' | 'materico' | 'unico';
  status: QuoteStatus;
  lines: QuoteLine[];
  total: number;             // imponibile = Σ righe (IVA/cassa escluse)
  // IVA e Cassa previdenziale spuntabili (il totale documento si calcola con quoteTotals in finance.ts)
  vatEnabled?: boolean;      // default true
  vatPct?: number;           // default 22
  cassaEnabled?: boolean;    // default false (Inarcassa/cassa previdenziale)
  cassaPct?: number;         // default 4
  paymentPlan?: PaymentMilestone[];
  validUntil?: string | null;
  notes?: string | null;
  createdAt: number;
  updatedAt?: number;
  createdBy?: string;
}

/** Voce del registro attività / audit log (nodo `auditLog/<id>`): trail delle azioni dello studio. */
export interface AuditEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'login' | 'other';
  section: string;            // area (progetti, preventivi, finanza, lead, cantiere…)
  label: string;              // descrizione leggibile dell'elemento/azione
  detail?: string | null;
  by: string;                 // uid autore
  byName?: string | null;
  at: number;
}

/** Voce di listino riusabile per comporre velocemente preventivi/computi (nodo `priceList`, array). */
export interface PriceItem {
  id: string;
  label: string;             // descrizione voce
  macro: QuoteMacro;         // macro-categoria del preventivo
  unit?: string | null;      // unità di misura (es. mq, cad, h)
  unitPrice: number;         // prezzo unitario di default (imponibile)
  division?: 'studio' | 'strategico' | 'materico' | 'unico' | null; // filtro/origine opzionale
  createdAt: number;
}

/** Elemento nel Cestino (nodo trash/<id>): conservato 60 giorni, poi eliminato definitivamente. */
export interface TrashItem {
  id: string;
  section: string;               // sezione di provenienza (es. 'progetti','preventivi','fatture_attive'…)
  label: string;                 // nome leggibile dell'elemento
  detail?: string | null;
  payload: any;                  // l'elemento eliminato (per il ripristino)
  meta?: Record<string, string> | null; // info extra per il ripristino (es. pid del documento)
  deletedAt: number;
  deletedBy: string;
  deletedByName?: string | null;
}

/** Ferie/assenze del team (nodo teamLeave/<id>). */
export interface TeamLeave {
  id: string;
  uid: string;
  name: string;
  dateFrom: string;              // yyyy-mm-dd
  dateTo: string;                // yyyy-mm-dd
  type: 'ferie' | 'permesso' | 'malattia';
  note?: string | null;
  at: number;
}

export interface TemplateTask {
  title: string;
  order: number;
  role?: string | null;          // mansione di riferimento (auto-assegnazione)
  durationDays?: number | null;  // durata stimata in giorni (pianificazione sequenziale)
}

export interface TemplatePhase {
  name: string;
  order: number;
  tasks: Record<string, TemplateTask>;
}

export interface Template {
  id: string;
  name: string;
  desc?: string | null;
  icon: string;
  builtin?: boolean;
  order: number;
  phases: Record<string, TemplatePhase>;
  createdAt: number;
  createdBy?: string;
}

export interface FinanceMovement {
  id: string;
  kind: 'entrata' | 'uscita';
  desc: string;
  amount: number;
  date: string;
  category: string;
  note?: string | null;
  projectId?: string | null;
  by: string;
  at: number;
}

export interface ProjectMessage {
  id: string;
  from: string;
  role: UserRole;
  name: string;
  text: string;
  at: number;
}

export interface TaskAttachment {
  name: string;
  size?: number;
  type?: string;
  url: string;
  path?: string;
  by: string;
  at: number;
}

export interface TaskMeta {
  note?: string | null;
  attachments?: Record<string, TaskAttachment>;
}

export interface ProjectInternal {
  notes?: string | null;
  taskMeta?: Record<string, Record<string, TaskMeta>>; // phId -> tId -> TaskMeta
}

export interface Appointment {
  id: string;
  title: string;
  date: string;            // ISO yyyy-mm-dd
  time?: string | null;
  ownerUid: string;        // di chi è l'agenda (legacy) / creatore
  ownerName?: string;
  createdBy: string;       // uid creatore
  createdByName?: string;
  withName?: string;       // controparte (legacy) / riepilogo nomi partecipanti
  note?: string;
  kind: 'appuntamento' | 'nota';
  /** Stato complessivo: 'pending' (grigio) finché tutti i partecipanti non confermano → 'confermato' (verde). */
  status: 'confermato' | 'pending' | 'rifiutato';
  /** Partecipanti multi-persona (team + clienti + partner): uid → stato conferma. Il creatore è auto-confermato. */
  participants?: Record<string, 'pending' | 'confermato' | 'rifiutato'>;
  participantNames?: Record<string, string>;   // uid → nome (per render senza lookup)
  projectId?: string | null;
  createdAt: number;
}

// ---- Unico (lato studio): operazioni immobiliari + investitori ----
export type UnicoDealStatus =
  | 'valutazione'      // immobile individuato, analisi
  | 'acquisizione'     // in fase di acquisto / raccolta capitale
  | 'ristrutturazione' // lavori in corso (via Materico)
  | 'vendita'          // sul mercato
  | 'concluso';        // venduto / operazione chiusa

export interface UnicoInvestor {
  id: string;
  name: string;
  amount: number;        // capitale conferito (€)
  contact?: string | null;
  email?: string | null;
  investorUid?: string | null; // account portale collegato (come clientUid) → vede la propria posizione
  units?: number;        // n° quote sottoscritte (se unitPrice impostato; altrimenti derivato)
  committedAt?: number;  // data sottoscrizione/conferimento
  at: number;
}

// Aggiornamento/avanzamento di un'operazione, condiviso con gli investitori collegati.
export interface UnicoUpdate {
  id: string;
  title: string;
  body: string;
  at: number;
  by?: string | null;    // nome di chi pubblica
}

// Distribuzione effettuata a un investitore (rimborso capitale, rendimento, plusvalenza).
export type UnicoDistributionKind = 'capitale' | 'rendimento' | 'plusvalenza';
export interface UnicoDistribution {
  id: string;
  investorId: string;
  amount: number;
  date: number;
  kind: UnicoDistributionKind;
  note?: string | null;
}

export interface UnicoDeal {
  id: string;
  title: string;
  type: string;              // Trullo, Masseria, Villa, Palazzo...
  location: string;
  status: UnicoDealStatus;
  acquisitionCost: number;   // costo di acquisto
  renovationBudget: number;  // budget ristrutturazione (Materico)
  targetSalePrice: number;   // prezzo di rivendita atteso
  capitalGoal: number;       // capitale da raccogliere dagli investitori
  minInvestment?: number;    // quota minima (vetrina)
  targetRoi?: number;        // rendimento atteso annuo % (vetrina)
  durationMonths?: number;
  // SPV (società veicolo) + cap table
  spvName?: string | null;   // ragione sociale SPV dedicata all'operazione
  spvVat?: string | null;    // P.IVA / CF della SPV
  spvNotes?: string | null;
  unitPrice?: number;        // valore nominale di una quota (€) → n° quote = capitalGoal / unitPrice
  investors: UnicoInvestor[];
  updates?: UnicoUpdate[];           // comunicazioni agli investitori
  distributions?: UnicoDistribution[]; // distribuzioni/rendimenti erogati
  matericoProjectId?: string | null; // commessa Materico collegata (ristrutturazione)
  published?: boolean;       // pubblicato nella vetrina Unico
  showcase?: UnicoShowcaseConfig | null; // pagina vetrina cinematica (video + scene)
  // ---- Cascata ROE + commesse interne (visione Aulico) ----
  roe?: UnicoRoeConfig;              // configurazione costi/cascata ROE (override per operazione)
  internalOrderIds?: string[];      // commesse interne generate (Onirico/Materico/Strategico)
  notes?: string | null;
  createdAt: number;
  updatedAt?: number;
}

/* ---------- Commesse interne + cascata ROE (visione Aulico, vedi docs/SCHEMA-COMMESSE-INTERNE.md) ---------- */

/** Le società del gruppo coinvolte nei movimenti intercompany. */
export type GroupCompany = 'studio' | 'strategico' | 'materico' | 'unico';

export type InternalOrderType =
  | 'progettazione_dl'   // Onirico → progetto + direzione lavori (Unico: 15% su costo realizzazione)
  | 'ristrutturazione'   // Materico → opere/lavori
  | 'promozione'         // Strategico → promozione/vendita (Unico: €10k fisso)
  | 'marketing'          // Strategico → marketing generico
  | 'lead_smistato'      // Strategico → assegnazione lead a un verticale
  | 'altro';

export type InternalOrderStatus = 'bozza' | 'confermata' | 'in_corso' | 'completata' | 'annullata';

/** Come si calcola l'importo della commessa interna. */
export type InternalOrderBasis =
  | { mode: 'percent'; pct: number; ofAmount: number } // es. 15% del costo realizzazione
  | { mode: 'fixed'; amount: number }                  // es. €10.000
  | { mode: 'manual'; amount: number };                // importo digitato

/** Commessa interna (nodo internalOrders/<id>): "contratto" tra due società del gruppo. */
export interface InternalOrder {
  id: string;
  code: string;                  // numerazione leggibile progressiva: "CI-001", "CI-002"…
  type: InternalOrderType;
  title: string;
  status: InternalOrderStatus;   // bozza → confermata (→ scrive finanza) → in_corso → completata
  // chi ORDINA (cliente interno) e chi ESEGUE (fornitore interno)
  committente: { company: GroupCompany; refType: 'project' | 'deal' | 'lead'; refId: string };
  fornitore: { company: GroupCompany };
  basis: InternalOrderBasis;
  amount: number;                // risultato del calcolo (denormalizzato dal basis)
  description?: string | null;
  dueDate?: string | null;
  // collegamento alle scritture finanza generate (coppia intercompany)
  financeRefs?: {
    costInvoiceId?: string;      // fattura passiva lato committente
    revenueInvoiceId?: string;   // fattura attiva lato fornitore
    scadenzaId?: string;
  } | null;
  createdAt: number;
  createdBy?: string | null;
  updatedAt?: number;
}

/** Configurazione cascata ROE di un'operazione Unico (default override-abili). */
export interface UnicoRoeConfig {
  // costi base (input dell'operazione)
  landCost: number;               // terreno/immobile
  notaryCost: number;             // oneri notarili
  worksCost: number;              // opere/lavori (idealmente = somma commesse Materico)
  resalePrice: number;            // prezzo di rivendita atteso/finale
  // percentuali/fissi — override per deal (se assenti → default in finance.ts)
  agencyPct?: number;             // default 3 (su landCost)
  oniricoPct?: number;            // default 15 (su worksCost)
  strategicoFee?: number;         // default 10000 (fisso)
  resalePct?: number;             // default 4 (su resalePrice)
  // date per il payback
  purchaseDate?: string | null;
  resaleDate?: string | null;
}

/* ---------- Incentivi & Point system (team interno + subappaltatori) ---------- */

/** A chi si applica un'attività a punti. */
export type PointAudience = 'team' | 'partner' | 'both';

/** Voce del catalogo attività a punti (default in src/points.ts, override futuri). */
export interface PointActivity {
  id: string;
  label: string;
  points: number;          // positivo = merito; negativo = penalità (precisione/affidabilità)
  category: string;        // es. 'Produttività','Qualità','Puntualità','Relazione'
  audience: PointAudience;
  value?: number;          // valore economico "erogato" (€) dell'attività
}

/** Evento punti assegnato (nodo pointEvents/<id>). */
export interface PointEvent {
  id: string;
  uid: string;             // chi riceve i punti (team o partner)
  activityId: string;      // id catalogo oppure 'manual'
  label: string;           // descrizione (denormalizzata)
  points: number;          // anche negativo
  value?: number | null;   // valore economico "erogato" (€) generato dall'attività
  auto?: boolean;          // true se generato automaticamente dalla produttività (completamento task)
  date: string;            // yyyy-mm-dd
  note?: string | null;
  refType?: string | null; // 'project'|'task'|'cantiere'|'materico'…
  refId?: string | null;
  by?: string | null;      // chi ha assegnato
  byName?: string | null;
  createdAt: number;
}

/** Soglia/fascia bonus (ranking). */
export interface BonusTier {
  id: string;
  label: string;           // es. 'Bronzo','Argento','Oro','Platino'
  minPoints: number;
  bonusPct?: number;       // % bonus sul compenso (team)
  perk?: string;           // descrizione vantaggio
  color: string;
}

/* ---------- Vetrina cinematica Unico (pagina "villa-omnia") ---------- */
// Una scena = un punto temporale del video continuo, con titolo e testo.
export interface UnicoShowcaseScene {
  time: number;      // secondo del video a cui si trova la scena
  subtitle: string;  // titolo scena (es. "Scena 01 • L'Ingresso")
  text: string;      // descrizione narrativa
}

// Config di allestimento per-operazione (vive dentro UnicoDeal.showcase).
export interface UnicoShowcaseConfig {
  image?: string | null;          // copertina card vetrina (URL immagine online)
  videoUrl?: string | null;       // video continuo ONLINE (Firebase Storage / URL diretto mp4)
  summary?: string | null;        // descrizione breve (card + dettaglio)
  highlights?: string[];          // punti di forza (dettaglio)
  scenes?: UnicoShowcaseScene[];  // scene mappate sui secondi del video
}

// Snapshot PUBBLICO per la vetrina clienti — nodo `unicoShowcase/<dealId>`.
// Scritto dallo studio (saveUnicoDeals) solo per i deal `published`; contiene
// SOLO campi divulgabili (niente costi di acquisto/ristrutturazione né nomi
// investitori). Strutturalmente compatibile con InvestProperty (showcaseData).
export interface UnicoShowcaseEntry {
  id: string;
  title: string;
  type: string;
  location: string;
  status: 'aperto' | 'in_corso' | 'completato' | 'in_arrivo';
  price: number;          // valore operazione (prezzo di rivendita atteso)
  minInvestment: number;
  targetRoi: number;
  durationMonths: number;
  goal: number;           // capitale da raccogliere
  raised: number;         // capitale raccolto (somma conferimenti)
  investors: number;      // numero investitori (solo conteggio)
  summary: string;
  highlights: string[];
  image: string;
  videoUrl?: string | null;
  scenes?: UnicoShowcaseScene[];
  updatedAt: number;
}

// Snapshot PRIVATO per il singolo investitore — nodo `unicoInvestorPositions/<uid>/<dealId>`.
// Scritto dallo studio (saveUnicoDeals write-through) per gli investitori con `investorUid`.
// Contiene SOLO la posizione del destinatario: niente costi d'acquisto/ristrutturazione,
// niente nomi/importi degli altri investitori. Letto dall'investitore collegato.
export interface UnicoInvestorPositionDistribution {
  id: string;
  amount: number;
  date: number;
  kind: UnicoDistributionKind;
  note?: string | null;
}
export interface UnicoInvestorPosition {
  dealId: string;
  title: string;
  type: string;
  location: string;
  status: UnicoDealStatus;
  investorName: string;
  amount: number;          // capitale conferito dal destinatario
  units: number;           // sue quote
  quotaPct: number;        // % sul capitale obiettivo
  targetRoi: number;
  durationMonths: number;
  goal: number;            // capitale obiettivo dell'operazione
  raised: number;          // totale raccolto (aggregato, no nomi)
  spvName?: string | null;
  expectedReturn: number;  // rendimento atteso stimato sul conferito (quota del profitto)
  distributed: number;     // totale già distribuito al destinatario
  updates: UnicoUpdate[];
  distributions: UnicoInvestorPositionDistribution[];
  updatedAt: number;
}

export interface Furnishing {
  id: string;
  projectId: string;
  kind: 'fisso' | 'mobile';                 // fisso = impatto progettuale; mobile = estetico
  category?: string | null;                  // es. 'Sanitari','Cucina','Armadi a incasso','Illuminazione','Tessili'
  title: string;
  status: 'da_scegliere' | 'proposto' | 'scelto' | 'confermato';
  deadline?: string | null;                  // yyyy-mm-dd (per voce; rilevante per i fissi)
  imageUrl?: string | null;                  // immagine di riferimento (URL incollato)
  link?: string | null;                      // link prodotto/riferimento
  color?: string | null;                     // swatch colore (campioni/moodboard)
  note?: string | null;
  board?: { x: number; y: number; w?: number; rot?: number } | null; // posizione sulla lavagna moodboard
  price?: number | null;                     // prezzo unitario (€) — base parcella arredi
  quantity?: number | null;                  // quantità (default 1)
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  at: number;
  updatedAt?: number;
}

// ============================================================
// Modulo Cantiere (multi-attore studio ↔ impresa partner)
// Nodo `cantieri/<cid>` + sotto-collezioni granulari per-elemento.
// ============================================================
export type CantiereStatus = 'pianificazione' | 'in_corso' | 'sospeso' | 'concluso';

export interface Cantiere {
  id: string;
  projectId: string;
  name: string;
  status: CantiereStatus;
  division: 'studio' | 'materico' | 'unico';
  partnerUids?: Record<string, boolean>;       // imprese partner assegnate (con account portale)
  partnerRecordIds?: Record<string, boolean>;  // imprese dalla rubrica (anche senza portale)
  taskRefs?: Record<string, boolean>;          // '<phId>::<tId>' → riferimenti SOLO lettura ai task del fascicolo
  progressPct?: number | null;                 // avanzamento 0-100 (gestito dallo studio)
  startDate?: string | null;
  dueDate?: string | null;
  location?: string | null;
  notes?: string | null;
  createdBy: string;
  createdByName?: string;
  createdAt: number;
  updatedAt?: number;
}

/** Riga manodopera del giornale di cantiere: qualifica e numero operai (D.M. 49/2018, art. 14). */
export interface RapportinoManodopera {
  qualifica: string;                           // es. 'Operaio specializzato'
  n: number;                                   // numero operai
}

/**
 * Voce del Giornale di cantiere (nodo `cantiereRapportini`). Campi strutturati
 * sul modello del giornale dei lavori D.M. 49/2018: lavorazioni, manodopera
 * (qualifica+numero), mezzi, meteo, eventi/annotazioni. Lo studio (DL) scrive
 * voci auto-approvate; l'impresa invia rapportini da approvare.
 */
export interface Rapportino {
  id: string;
  date: string;                                // yyyy-mm-dd
  partnerUid: string;                          // uid autore (impresa O membro studio)
  partnerName?: string;
  authorRole?: 'studio' | 'impresa' | null;    // chi ha compilato (voci storiche: impresa)
  meteo?: string | null;                       // condizioni meteo
  tempMin?: number | null;                     // °C
  tempMax?: number | null;                     // °C
  ore?: number | null;                         // ore lavorate complessive
  manodopera?: RapportinoManodopera[];         // qualifica e numero operai impiegati
  mezzi?: string | null;                       // attrezzatura tecnica impiegata
  descrizione: string;                         // lavorazioni eseguite
  annotazioni?: string | null;                 // circostanze/eventi: visite, ordini di servizio, sospensioni, infortuni
  fotoIds?: string[];                          // riferimenti a cantiereFoto
  status: 'inviato' | 'approvato' | 'rifiutato';
  approvedBy?: string;                         // solo studio
  at: number;
}

export interface Presenza {
  id: string;
  date: string;
  partnerUid: string;
  lavoratore: string;
  ore: number;
  mansione?: string | null;
  at: number;
}

export interface CantiereFoto {
  id: string;
  driveFileId?: string | null;                 // upload reale su Google Drive
  driveUrl?: string | null;
  link?: string | null;                        // fallback: link incollato
  caption?: string | null;
  by: string;
  role: string;
  at: number;
  takenAt?: number | null;                     // timestamp di scatto/caricamento (foto cantiere)
  lat?: number | null;                         // geolocalizzazione (browser, best-effort)
  lng?: number | null;
}

export interface CantiereMateriale {
  id: string;
  desc: string;
  qty: number;
  unit: string;
  tipo: 'consegna' | 'impiego';
  date: string;
  by: string;
  note?: string | null;
  at: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  doneBy?: string | null;
  doneAt?: number | null;
  category?: string | null;
  order: number;
}

export interface CantiereDoc {
  id: string;
  name: string;
  driveFileId?: string | null;
  driveUrl?: string | null;
  link?: string | null;
  section?: string | null;     // sezione di destinazione (es. 'documenti','sicurezza','verbali','permessi'…)
  category?: string | null;    // sotto-categoria libera (es. 'Disegni','Contratti','POS','DURC'…)
  expiry?: string | null;      // yyyy-mm-dd: scadenza documento (DURC/polizze/permessi…)
  by: string;
  role: string;
  at: number;
}

/**
 * Registro voci generico per-cantiere (sezioni "lista" della struttura PDF:
 * non conformità, ordini di servizio, verifica lavorazioni, varianti, collaudi,
 * test, scadenze, cronoprogramma…). Discriminato da `section`.
 */
export interface CantiereRecord {
  id: string;
  section: string;             // es. 'nonconformita','ordini_servizio','cronoprogramma','scadenze'…
  title: string;
  date?: string | null;        // yyyy-mm-dd (data evento/scadenza/inizio)
  dateEnd?: string | null;     // yyyy-mm-dd (fine, per cronoprogramma)
  status?: string | null;      // stato libero per sezione (es. 'aperta','chiusa','in_corso')
  fields?: Record<string, string>; // campi extra specifici della sezione
  note?: string | null;
  by: string;
  byName?: string | null;
  role?: string | null;
  at: number;
}

/** Chat di cantiere (mirror del pattern projectMessages, per-cantiere). */
export interface CantiereMessage {
  id: string;
  from: string;
  role: UserRole;
  name: string;
  text: string;
  at: number;
}

// ---- Area Impresa: profilo dell'impresa partner (riusabile su tutti i suoi cantieri) ----
/** Documentazione impresa: DURC, Visure, Polizze, Certificazioni SOA, Documenti dipendenti. */
export interface ImpresaDoc {
  id: string;
  docType: string;             // es. 'DURC','visura','polizza','SOA','dipendente'
  name: string;
  expiry?: string | null;      // yyyy-mm-dd: scadenza (DURC/polizze…)
  driveFileId?: string | null;
  driveUrl?: string | null;
  link?: string | null;
  note?: string | null;
  by: string;
  at: number;
}

/** Registro voci dell'impresa: squadre, operai, mezzi, attrezzature, DPI, formazione… */
export interface ImpresaRecord {
  id: string;
  section: string;             // es. 'squadre','operai','mezzi','attrezzature','dpi','formazione','incidenti'…
  title: string;
  date?: string | null;
  status?: string | null;
  fields?: Record<string, string>;
  note?: string | null;
  by: string;
  at: number;
}

// ---- Rubrica clienti (anagrafica riutilizzabile, anche senza login) ----
export interface ClientRecord {
  id: string;
  category?: 'cliente' | 'partner';   // rubrica divisa tra clienti e imprese partner
  type: 'privato' | 'azienda';
  name: string;                // nome completo o ragione sociale (display)
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;    // numero per link wa.me (se diverso dal telefono)
  address?: string | null;     // residenza / sede legale
  codiceFiscale?: string | null;
  companyName?: string | null; // (azienda)
  partitaIva?: string | null;  // (azienda)
  pec?: string | null;         // (azienda)
  sdi?: string | null;         // (azienda) codice destinatario FE
  tier?: 1 | 2 | 3 | null;     // fascia/classificazione cliente (1/2/3 Fascia)
  responsabili?: Record<string, boolean>; // uid dei membri studio responsabili
  responsabileNome?: string | null;   // nome responsabile (testo, es. da import registro)
  accountUid?: string | null;  // opz.: account portale collegato (users/<uid>)
  // --- Campi Registro Clienti (import Excel) ---
  stato?: 'attivo' | 'chiuso' | null;         // stato pratica/rapporto
  riferimentoComunicazione?: string | null;   // referente per le comunicazioni
  preventivoStato?: 'firmato' | 'non_firmato' | null;
  saldato?: boolean | null;
  dataInizio?: string | null;  // ISO yyyy-mm-dd (o testo)
  dataFine?: string | null;
  // --- Registro Unico delle Persone (CRM Fase 1) ---
  roles?: Record<string, boolean>;     // tipi contatto multipli: cliente/lead/ex_cliente/investitore/
                                       // investitore_potenziale/fornitore/impresa/agenzia_immobiliare/
                                       // sponsor/conoscente/istituzionale
  societies?: Record<string, boolean>; // appartenenza multi-società: studio/strategico/materico/unico/fantastico
  targetTags?: string[] | null;        // etichette libere (es. "Imprese di Ostuni")
  acquisitionChannel?: string | null;  // canale acquisizione (social/sito/passaparola/agenzia…)
  codiceReferenza?: string | null;     // codice referral PROPRIO del contatto (auto, univoco: nome+anno)
  referredByCode?: string | null;      // codice referral di CHI lo ha portato (referral/segnalazione)
  // --- Scheda strategica (CRM Fase 2/3, da prototipo) ---
  brandAsset?: BrandAsset | null;            // clienti marketing: obiettivi/tono/target/asset
  credentials?: ContactCredential[] | null;  // credenziali protette (social/gestionali)
  privacyLiberatoria?: boolean;              // liberatoria immagini/video cantiere firmata
  interactions?: ContactInteraction[] | null; // memoria storica (riunioni/eventi/campagne/regali)
  // --- Ranking partner/fornitori (valutazione a stelle 0–5 per criterio) ---
  partnerRating?: {
    tempistiche?: number;      // rispetto dei tempi concordati
    qualita?: number;          // qualità delle lavorazioni
    preventivazione?: number;  // velocità di preventivazione
    costo?: number;            // competitività di costo
    organizzazione?: number;   // organizzazione di cantiere & maestranze
  } | null;
  notes?: string | null;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

// ---- Governance & Organigrammi (Strategico/HR) ----
export type OrgKind = 'societa' | 'area' | 'ruolo';
export type OrgIdentita = 'amministratore' | 'socio' | 'dipendente' | 'collaboratore';
/** Arco verso un nodo-genitore, con quota % sul collegamento (es. socio → società). */
export interface OrgParentRef { id: string; quota?: number | null; }
/** Nodo dell'organigramma dinamico (nodo `governanceOrg/<id>`).
 * Supporta PIÙ genitori (grafo/DAG): un box può essere posseduto/dipendere da più elementi
 * ognuno con la propria quota (es. Materico ← DF Holdings 60% + Epifani 20% + Zivoli 20%).
 * `parentId` resta per retro-compatibilità (equivale a un solo genitore). */
export interface OrgNode {
  id: string;
  parentId?: string | null;      // legacy: singolo genitore (null = radice)
  parents?: OrgParentRef[];       // NEW: genitori multipli con quota sull'arco
  kind: OrgKind;
  chart?: 'societario' | 'funzionale'; // a quale organigramma appartiene (default funzionale)
  label: string;                 // nome società / area / ruolo
  person?: string | null;        // nome persona associata (livello persone)
  personUid?: string | null;     // collegamento account team
  quota?: number | null;         // % nodo (legacy; nel societario si preferisce la quota sull'arco)
  identita?: OrgIdentita | null; // Amministratore/Socio/Dipendente/Collaboratore
  desc?: string | null;          // descrizione/settore sotto il nome (es. "Servizi di Ingegneria")
  mansioni?: string | null;      // elenco compiti/responsabilità
  pfv?: string | null;           // Prodotto Finale di Valore
  societa?: string | null;       // chiave società di appartenenza (per filtri)
  order?: number;
  createdAt: number;
  updatedAt?: number;
}
/** Voce del mansionario (nodo `governanceMansionari/<id>`): ruolo codificato con mansioni + PFV.
 * Indipendente dall'organigramma (aggiungibile/modificabile/rimovibile a mano). */
export interface GovernanceMansionario {
  id: string;
  role: string;                  // titolo del ruolo / figura
  person?: string | null;        // persona che lo ricopre (facoltativo)
  area?: string | null;          // area / società di riferimento
  identita?: OrgIdentita | null; // Amministratore/Socio/Dipendente/Collaboratore
  mansioni?: string | null;      // compiti & responsabilità
  pfv?: string | null;           // Prodotto Finale di Valore
  requisiti?: string | null;     // competenze/requisiti richiesti
  order?: number;
  createdAt: number;
  updatedAt?: number;
}
/** Categoria di una credenziale nella cassaforte password. */
export type VaultCategory = 'sito' | 'portale' | 'software' | 'strumento' | 'social' | 'altro';
/** Voce della cassaforte credenziali (nodo `governanceVault/<id>`): password di siti/portali/software/strumenti.
 * L'accesso alla sezione è protetto da una master password (hash in `governanceVaultConfig`). */
export interface VaultEntry {
  id: string;
  label: string;                 // nome del servizio/strumento
  category?: VaultCategory;
  url?: string | null;
  username?: string | null;
  password?: string | null;
  note?: string | null;
  createdAt: number;
  updatedAt?: number;
  by?: string | null;
}
/** Config della cassaforte (nodo `governanceVaultConfig`): hash della master password + salt. */
export interface VaultConfig {
  passHash?: string | null;
  salt?: string | null;
  updatedAt?: number;
  by?: string | null;
}
/** Categoria evento dell'agenda Risorse Umane. */
export type HrEventCategory =
  | 'riunione_1_1' | 'riunione_tecnica' | 'riunione_amministrativa' | 'riunione_marketing'
  | 'team_building' | 'formazione_gruppo' | 'viaggio_formazione' | 'assenza' | 'vacanza';
/** Evento dell'agenda Risorse Umane (nodo `hrEvents/<id>`). */
export interface HrEvent {
  id: string;
  title: string;
  category: HrEventCategory;
  date: string;                // yyyy-mm-dd (inizio)
  endDate?: string | null;     // yyyy-mm-dd (fine, per periodi: assenza/vacanza/viaggio)
  time?: string | null;        // HH:mm (per le riunioni)
  allDay?: boolean;
  participants?: Record<string, boolean>; // uid dei membri coinvolti
  location?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: number;
  updatedAt?: number;
}
/** Procedura operativa standard (nodo `governanceSop/<id>`): guida passo-passo. */
export interface GovernanceSop {
  id: string;
  title: string;
  area?: string | null;          // società/area di riferimento
  description?: string | null;
  steps: string[];
  createdAt: number;
  updatedAt?: number;
  createdBy?: string | null;
}

export interface BrandAsset {
  obiettivi?: string | null;
  tonoVoce?: string | null;
  targetRiferimento?: string | null;
  assetGrafici?: string[] | null;   // nomi/URL file
}
export interface ContactCredential {
  id: string;
  service: string;
  username?: string | null;
  password?: string | null;         // NB: salvata in chiaro nel nodo clients (vedi nota sicurezza)
  note?: string | null;
}
export interface ContactInteraction {
  id: string;
  tipo: 'riunione' | 'evento' | 'campagna' | 'regalo';
  data: string;                     // ISO yyyy-mm-dd
  titolo: string;
  descrizione?: string | null;
  dettagli?: string | null;         // es. "Pensiero di Natale", "Newsletter primavera"
}

export interface CantiereSal {
  id: string;
  number: number;
  periodFrom?: string | null;
  periodTo?: string | null;
  descrizione?: string | null;
  importo?: number | null;
  progressPct?: number | null;
  status: 'bozza' | 'inviato' | 'approvato';
  approvedBy?: string;
  linkedInvoiceId?: string | null;             // collega cantiere ↔ fattura attiva (finanza)
  at: number;
}

export interface CantiereLog {
  id: string;
  action: string;                              // es. 'rapportino.approvato'
  entity: string;                              // es. 'rapportino'
  by: string;
  role: string;
  at: number;
  detail?: string | null;
}

export interface MatericoItem {
  id: string;
  desc: string;
  qty: number;
  unit: string;
}
export interface MatericoOffer {
  partnerUid: string;
  partnerName: string;
  amount: number;
  note?: string;
  at: number;
}
export interface MatericoRequest {
  id: string;
  clientUid: string;
  clientName: string;
  title: string;
  description?: string;
  category?: string;          // tipo di lavorazione (es. "Gres/Pavimenti")
  items?: MatericoItem[];      // quantità inserite dal cliente
  links?: string[];
  note?: string;
  status: 'nuova' | 'inoltrata' | 'offerte' | 'inviata_cliente' | 'accettata' | 'rifiutata';
  forwardedTo?: Record<string, boolean>; // mappa {uid:true} partner a cui è inoltrata (legacy: string[])
  offers?: Record<string, MatericoOffer>;
  selectedPartnerUid?: string | null;
  marginPct?: number;
  clientPrice?: number | null; // prezzo finale al cliente (con margine Materico)
  contractText?: string | null;
  // ---- Penali per ritardo (subappalto) ----
  agreedDeliveryDate?: string | null;  // scadenza concordata col partner
  completedDate?: string | null;       // consegna effettiva
  penalty?: MatericoPenalty | null;
  createdAt: number;
  updatedAt?: number;
}

/** Penale per ritardo del partner (% al giorno con tetto). */
export interface MatericoPenalty {
  days: number;            // giorni di ritardo
  pctPerDay: number;       // % al giorno applicata
  capPct: number;          // tetto % sul costo partner
  base: number;            // costo partner (base di calcolo)
  amount: number;          // importo penale (con tetto)
  capped: boolean;         // true se ha raggiunto il tetto
  status: 'proposta' | 'applicata' | 'annullata';
  invoiceId?: string | null; // nota di credito (fattura passiva negativa) collegata
  appliedAt?: number | null;
  appliedBy?: string | null;
}

// ============================================================
// Richiesta cliente / "La tua idea" (nodo clientRequests/<clientUid>/<id>)
// Brief inviato dal cliente per Studio/Strategico/Unico, con descrizione libera
// e moodboard 3D opzionale. Lo studio la valuta e la converte in progetto.
// (Per Materico il flusso resta MatericoRequest col bidding partner.)
// ============================================================
export type ClientRequestStatus = 'inviata' | 'presa_in_carico' | 'convertita' | 'chiusa';

export interface ClientRequest {
  id: string;
  clientUid: string;
  clientName: string;
  clientEmail?: string | null;
  division: 'studio' | 'strategico' | 'unico';   // Materico → MatericoRequest separata
  title: string;
  description: string;                            // "descrivi la tua idea"
  budget?: number | null;
  location?: string | null;                       // dove (indirizzo/zona libera)
  links?: string[] | null;
  moodboard?: any[] | null;                       // elementi moodboard 3D (BoardElement[]) — idea visiva
  draftImage?: string | null;                     // bozza generata via AI (data URL PNG) da foto + stile
  status: ClientRequestStatus;
  projectId?: string | null;                      // progetto creato alla conversione
  studioNote?: string | null;                     // nota interna dello studio
  handledBy?: string | null;
  handledByName?: string | null;
  createdAt: number;
  updatedAt?: number;
}

/* =====================================================================
 * MODULO STRATEGICO / MARKETING (società controllata Strategico)
 * Nodi: mktEvents, mktCampaigns, mktSurveys, mktSurveyResponses, mktSocial,
 * mktInvitesIndex. Vedi §22 di CLAUDE.md.
 * =================================================================== */

export type RsvpStatus = 'invitato' | 'accettato' | 'rifiutato' | 'forse';

// Singolo invitato a un evento. Può essere un contatto della rubrica (clientId)
// e/o un account portale (uid) → riceve l'invito e può rispondere (RSVP).
export interface EventInvitee {
  name: string;
  email?: string | null;
  clientId?: string | null;
  uid?: string | null;        // account portale (per RSVP + indice mktInvitesIndex)
  status: RsvpStatus;
  respondedAt?: number | null;
}

export interface MarketingEvent {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  title: string;
  date: number;               // data/ora evento
  location?: string | null;
  kind?: string | null;       // tipo (open day, inaugurazione, webinar…)
  description?: string | null;
  capacity?: number | null;
  coverUrl?: string | null;
  invitees: Record<string, EventInvitee>; // keyed (uid o id contatto) → RSVP granulare
  status?: 'bozza' | 'pubblicato' | 'concluso';
  // Economia evento (→ confluisce in Finanza, sector:'strategico')
  budget?: number | null;          // costo previsto/sostenuto
  revenue?: number | null;         // ricavi (biglietti/sponsor)
  financeRefs?: string[];          // id voci finanza generate
  createdAt: number;
  updatedAt?: number;
}

export type CampaignChannel = 'email' | 'whatsapp' | 'social' | 'misto';
export type CampaignStatus = 'bozza' | 'attiva' | 'conclusa';
// Passo di follow-up della campagna (offset giorni dall'avvio + messaggio).
export interface CampaignStep {
  id: string;
  offsetDays: number;
  channel: CampaignChannel;
  message: string;
}
export interface Campaign {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  name: string;
  channel: CampaignChannel;
  season?: string | null;     // stagionalità (es. "Natale 2026")
  goal?: string | null;
  audienceTiers?: number[];    // fasce rubrica destinatarie (1/2/3)
  audienceSector?: string | null;
  message?: string | null;     // messaggio principale
  steps?: CampaignStep[];      // follow-up pianificati
  status: CampaignStatus;
  sentCount?: number;          // contatori manuali
  responses?: number;
  // Economia campagna (→ confluisce in Finanza, sector:'strategico')
  budget?: number | null;      // budget pianificato
  spend?: number | null;       // spesa effettiva (es. ads)
  utm?: CampaignUtm | null;    // tracciamento UTM
  financeRefs?: string[];      // id voci finanza generate
  startAt?: number | null;
  createdAt: number;
  updatedAt?: number;
}

export type SurveyQuestionType = 'rating' | 'choice' | 'text';
export interface SurveyQuestion {
  id: string;
  text: string;
  type: SurveyQuestionType;
  options?: string[];          // per 'choice'
}
export interface Survey {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  title: string;
  intro?: string | null;
  questions: SurveyQuestion[];
  audience?: 'tutti' | 'clienti' | 'partner';
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}
// Risposta di un utente — nodo mktSurveyResponses/<surveyId>/<uid>.
export interface SurveyResponse {
  surveyId: string;
  uid: string;
  name?: string | null;
  answers: Record<string, string | number>; // questionId → valore
  at: number;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube';
export type SocialStatus = 'idea' | 'bozza' | 'programmato' | 'pubblicato';
// Voce del calendario editoriale social.
export interface SocialPost {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  platform: SocialPlatform;
  caption: string;
  hashtags?: string | null;    // hashtag del post (testo libero, es. "#onirico #puglia")
  mediaUrl?: string | null;    // link/asset (renderizzato con safeUrl)
  link?: string | null;
  scheduledAt?: number | null;
  status: SocialStatus;
  pillar?: string | null;      // pilastro/tema editoriale
  campaignId?: string | null;  // campagna collegata
  reach?: number | null;       // metriche manuali
  likes?: number | null;
  createdAt: number;
  updatedAt?: number;
}

// Parametri UTM di una campagna (UTM builder, Strategico).
export interface CampaignUtm {
  baseUrl?: string | null;     // URL di destinazione
  source?: string | null;      // utm_source
  medium?: string | null;      // utm_medium
  campaign?: string | null;    // utm_campaign
  term?: string | null;        // utm_term
  content?: string | null;     // utm_content
}

// ============================================================
// Strategico — Economia (Blocco A): contratti/retainer + time tracking.
// I dati economici confluiscono SEMPRE nei nodi finanza globali
// (finInvoicesActive/finScadenze/finInvoicesPassive) con sector:'strategico'.
// ============================================================
export type MktContractCadence = 'mensile' | 'trimestrale' | 'annuale' | 'una_tantum';
export type MktContractStatus = 'attivo' | 'sospeso' | 'concluso';
// Una emissione (fattura+scadenza) generata da un contratto/retainer.
export interface MktContractEmission {
  id: string;
  invoiceId: string;           // id fattura attiva generata (finInvoicesActive)
  scadenzaId?: string | null;  // id scadenza generata (finScadenze)
  periodLabel: string;         // es. "Giugno 2026"
  amount: number;              // imponibile emesso
  at: number;
}
// Contratto/retainer marketing — nodo mktContracts/<id>.
export interface MktContract {
  id: string;
  title: string;
  clientId?: string | null;        // rubrica clients
  clientName: string;
  amount: number;                  // imponibile per periodo
  cadence: MktContractCadence;
  vatPct?: number | null;          // default 22 (null/0 = no IVA)
  cassaPct?: number | null;        // cassa previdenziale
  startAt: number;
  endAt?: number | null;           // scadenza/rinnovo
  autoRenew?: boolean;
  status: MktContractStatus;
  scope?: string | null;           // servizi inclusi
  projectId?: string | null;
  emissions?: MktContractEmission[]; // storico fatturazioni ricorrenti
  createdAt: number;
  updatedAt?: number;
}

// ============================================================
// Strategico — Produzione (Blocco B): asset library, kanban deliverable, proofing.
// ============================================================
export type MktAssetKind = 'immagine' | 'video' | 'documento' | 'link';
// Asset della libreria media — nodo mktAssets/<id>.
export interface MktAsset {
  id: string;
  name: string;
  kind: MktAssetKind;
  url?: string | null;             // link o driveUrl (render con safeUrl)
  driveFileId?: string | null;
  tags?: string[];
  clientId?: string | null;
  campaignId?: string | null;
  note?: string | null;
  by?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export type MktDeliverableStage = 'da_fare' | 'in_lavorazione' | 'in_revisione' | 'approvato' | 'pubblicato';
export type MktPriority = 'bassa' | 'media' | 'alta';
// Deliverable della board kanban marketing — nodo mktDeliverables/<id>.
export interface MktDeliverable {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  title: string;
  stage: MktDeliverableStage;
  clientId?: string | null;
  clientName?: string | null;
  campaignId?: string | null;
  assigneeUid?: string | null;
  assigneeName?: string | null;
  dueAt?: number | null;
  priority?: MktPriority;
  note?: string | null;
  createdAt: number;
  updatedAt?: number;
}

// Annotazione contestuale su una proof (coordinate in % sull'immagine).
export interface ProofAnnotation {
  id: string;
  x: number;                       // 0-100 %
  y: number;                       // 0-100 %
  text: string;
  by?: string | null;
  byName?: string | null;
  at: number;
  resolved?: boolean;
}
export type ProofStatus = 'in_revisione' | 'approvato' | 'modifiche_richieste';
// Proof/revisione di un creativo — nodo mktProofs/<id>.
export interface MktProof {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  title: string;
  imageUrl?: string | null;        // immagine/anteprima (url o driveUrl)
  clientId?: string | null;
  clientName?: string | null;
  version: number;
  status: ProofStatus;
  annotations?: ProofAnnotation[];
  deliverableId?: string | null;
  createdAt: number;
  updatedAt?: number;
}

// ============================================================
// Strategico — Progetto marketing (contenitore principale, §22-sex).
// Le entità operative (eventi, campagne, social, deliverable, proof, ads, seo,
// metriche, time, inbox, sondaggi) sono scoped da `mktProjectId`. Lead, contratti,
// consensi, asset e flussi restano GLOBALI (non hanno mktProjectId obbligatorio).
// ============================================================
export type MktProjectStatus = 'attivo' | 'in_pausa' | 'concluso';
export interface MktProject {
  id: string;
  name: string;
  clientId?: string | null;        // cliente della rubrica
  clientName?: string | null;
  status: MktProjectStatus;
  goal?: string | null;
  color?: string | null;
  startAt?: number | null;
  endAt?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt?: number;
}

// ============================================================
// Strategico — Acquisizione / Dati / Compliance (Blocchi D–K).
// Moduli con dati inseriti a mano, predisposti per ricevere le API esterne
// (SEO/Ads/GA4/social) in un secondo momento. I dati economici (spesa ads)
// confluiscono in Finanza con sector:'strategico'.
// ============================================================

// D. Lead & pipeline marketing — nodo mktLeads/<id>.
export type MktLeadStage = 'nuovo' | 'contattato' | 'qualificato' | 'proposta' | 'vinto' | 'perso';
export interface MktLead {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;          // origine (sito, referral, evento, ads…)
  stage: MktLeadStage;
  score?: number | null;           // 0-100 (suggerito dai campi, override manuale)
  value?: number | null;           // valore potenziale €
  tags?: string[];
  ownerUid?: string | null;
  ownerName?: string | null;
  note?: string | null;
  lastContactAt?: number | null;
  createdAt: number;
  updatedAt?: number;
}

// E. Marketing automation — flussi nurturing — nodo mktFlows/<id>.
export type MktFlowChannel = 'email' | 'whatsapp' | 'sms';
export interface MktFlowStep {
  id: string;
  offsetDays: number;
  channel: MktFlowChannel;
  subject?: string | null;
  message: string;
}
export interface MktFlow {
  id: string;
  name: string;
  trigger?: string | null;         // descrizione trigger (iscrizione, evento, acquisto…)
  audienceTiers?: number[];
  steps: MktFlowStep[];
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}

// F. SEO & Content — nodo mktSeo/<id> (kind discrimina keyword vs brief).
export type MktSeoKind = 'keyword' | 'brief';
export type MktBriefStatus = 'idea' | 'in_lavorazione' | 'pubblicato';
export interface MktSeoItem {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  kind: MktSeoKind;
  keyword?: string | null;
  volume?: number | null;
  difficulty?: number | null;      // 0-100
  position?: number | null;        // posizione attuale (manuale)
  url?: string | null;             // pagina target
  intent?: string | null;
  title?: string | null;           // brief
  outline?: string | null;
  status?: MktBriefStatus;
  clientId?: string | null;
  note?: string | null;
  createdAt: number;
  updatedAt?: number;
}

// G. Advertising & PPC — nodo mktAds/<id>.
export type MktAdPlatform = 'google' | 'meta' | 'tiktok' | 'linkedin';
export type MktAdStatus = 'attiva' | 'in_pausa' | 'conclusa';
export interface MktAdCampaign {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  name: string;
  platform: MktAdPlatform;
  clientId?: string | null;
  clientName?: string | null;
  budget?: number | null;
  spend?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  conversions?: number | null;
  status: MktAdStatus;
  startAt?: number | null;
  endAt?: number | null;
  financeRefs?: string[];          // voci passive generate in Finanza
  createdAt: number;
  updatedAt?: number;
}

// H. Analytics — metriche manuali (pluggable GA4/Ads) — nodo mktMetrics/<id>.
export type MktMetricSource = 'ga4' | 'google_ads' | 'meta' | 'linkedin' | 'tiktok' | 'altro';
export interface MktMetric {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  source: MktMetricSource;
  metric: string;                  // es. sessioni, conversioni, CTR
  value: number;
  date: number;                    // periodo
  clientId?: string | null;
  note?: string | null;
  createdAt: number;
  updatedAt?: number;
}

// I. Inbox unificata (manuale) — nodo mktInbox/<id>.
export type MktInboxChannel = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'email' | 'whatsapp' | 'altro';
export type MktSentiment = 'positivo' | 'neutro' | 'negativo';
export interface MktInboxItem {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  channel: MktInboxChannel;
  from: string;                    // mittente/handle
  text: string;
  clientId?: string | null;
  handled?: boolean;
  sentiment?: MktSentiment | null;
  at: number;
  createdAt: number;
  updatedAt?: number;
}

// J. GDPR — registro consensi — nodo mktConsents/<id>.
export type MktConsentScope = 'marketing' | 'newsletter' | 'profilazione' | 'terzi';
export interface MktConsent {
  id: string;
  subject: string;                 // nominativo/contatto
  email?: string | null;
  clientId?: string | null;
  scopes: MktConsentScope[];
  granted: boolean;
  basis?: string | null;           // base giuridica
  grantedAt?: number | null;
  revokedAt?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt?: number;
}

// Voce di time tracking — nodo mktTimeEntries/<id>.
export interface MktTimeEntry {
  id: string;
  mktProjectId?: string | null;   // progetto marketing (scope §22-sex)
  date: number;
  minutes: number;
  whoUid?: string | null;          // collaboratore
  whoName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  projectId?: string | null;
  campaignId?: string | null;
  activity?: string | null;        // tipologia attività
  note?: string | null;
  rate?: number | null;            // €/h → valore economico
  billable?: boolean;              // fatturabile
  billedInvoiceId?: string | null; // se già fatturata in Finanza
  createdAt: number;
  updatedAt?: number;
}
