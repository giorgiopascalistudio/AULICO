/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Folder,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  AlertTriangle,
  LogOut,
  User,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkle,
  Bell,
  Check,
  X,
  LayoutGrid,
  CalendarDays
} from 'lucide-react';

import {
  UserProfile,
  Project,
  Task,
  Template,
  FinanceMovement,
  ProjectMessage,
  ProjectInternal,
  Phase,
  ProjectTask,
  TaskAttachment,
  MatericoEstimate,
  Appointment,
  MatericoRequest,
  ClientRequest,
  UnicoDeal,
  UnicoShowcaseEntry,
  UnicoInvestorPosition,
  UnicoUpdate,
  UnicoDistribution,
  Furnishing,
  Cantiere,
  Rapportino,
  Presenza,
  CantiereFoto,
  CantiereMateriale,
  ChecklistItem,
  CantiereDoc,
  CantiereSal,
  CantiereLog,
  CantiereRecord,
  CantiereMessage,
  ImpresaDoc,
  ImpresaRecord,
  ClientRecord,
  Notification,
  TeamLeave,
  Quote,
  PaymentMilestone,
  PriceItem,
  AuditEntry,
  TrashItem,
  UserRole,
  MarketingEvent,
  Campaign,
  Survey,
  SurveyResponse,
  SocialPost,
  MktContract,
  MktTimeEntry,
  MktAsset,
  MktDeliverable,
  MktProof,
  MktLead,
  MktFlow,
  MktSeoItem,
  MktAdCampaign,
  MktMetric,
  MktInboxItem,
  MktConsent,
  MktProject,
  RsvpStatus,
  AccessMap,
  AccessLevel,
  InternalOrder,
  PointEvent,
  MatericoPenalty,
  OrgNode,
  OrgParentRef,
  GovernanceSop,
  GovernanceMansionario,
  VaultEntry,
  VaultConfig,
  HrEvent,
  MatericoDeal,
  MatericoPriceItem,
  MatericoContract,
  PianoFinanziario,
  FatturazionePlanItem,
} from './types';
import { activityById, activityValue, PRIORITY_POINTS, catalogFor } from './points';

import { SOCIETA, SOCIETA_LABEL, LEVELS, LEVEL_LABEL, canAdmin, canAnywhere, canView, canOperate } from './access';

import {
  SEED_USERS,
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_FINANCE,
  SEED_TEMPLATES,
  SEED_INTERNAL,
  SEED_ESTIMATES,
  MANSIONI
} from './constants';

import {
  isoDate,
  todayISO,
  addDays,
  fmtDay,
  eur,
  initials,
  avColor,
  sameDay,
  forwardedUids,
  TRASH_RETENTION_DAYS
} from './utils';

import {
  INTERVENTI_EDILIZI,
  TITOLI_ABILITATIVI,
  STUDIO_CATEGORIE_BY_FASE,
  buildStudioPhases,
  studioSummary,
  interventoById,
  interventoLabel,
  DEFAULT_INTERVENTO
} from './studioConfig';

// Subviews — code-splitting per route (React.lazy): ogni vista pesante vive in
// un chunk separato scaricato solo alla prima navigazione → bundle iniziale
// molto più leggero (prestazioni mobile / PageSpeed). DashboardView resta
// statica perché è la landing di default del team.
import { DashboardView } from './components/DashboardView';
const CalendarView = React.lazy(() => import('./components/CalendarView').then((m) => ({ default: m.CalendarView })));
const ProjectsView = React.lazy(() => import('./components/ProjectsView').then((m) => ({ default: m.ProjectsView })));
const ClientPortalView = React.lazy(() => import('./components/ClientPortalView').then((m) => ({ default: m.ClientPortalView })));
const FinanzeView = React.lazy(() => import('./components/FinanzeView').then((m) => ({ default: m.FinanzeView })));
const TeamView = React.lazy(() => import('./components/TeamView').then((m) => ({ default: m.TeamView })));
const InteractiveView = React.lazy(() => import('./components/InteractiveView').then((m) => ({ default: m.InteractiveView })));
const DocumentsView = React.lazy(() => import('./components/DocumentsView').then((m) => ({ default: m.DocumentsView })));
const CrmView = React.lazy(() => import('./components/CrmView').then((m) => ({ default: m.CrmView })));
const TrashView = React.lazy(() => import('./components/TrashView').then((m) => ({ default: m.TrashView })));
const AuditView = React.lazy(() => import('./components/AuditView').then((m) => ({ default: m.AuditView })));
const ClientRequestsView = React.lazy(() => import('./components/ClientRequestsView').then((m) => ({ default: m.ClientRequestsView })));

// Subcomponents
import { Sidebar } from './components/Sidebar';
import { AulicoSidebar } from './components/AulicoSidebar';
import { SocietyDashboard } from './components/SocietyDashboard';
import { SectionPlaceholder } from './components/SectionPlaceholder';
import { GroupTabBar } from './components/GroupTabBar';
import { MarketingSection } from './components/sections/MarketingSection';
const GovernanceView = React.lazy(() => import('./components/GovernanceView').then((m) => ({ default: m.GovernanceView })));
const HrAgendaView = React.lazy(() => import('./components/HrAgendaView').then((m) => ({ default: m.HrAgendaView })));
const MatericoDealsView = React.lazy(() => import('./components/MatericoDealsView').then((m) => ({ default: m.MatericoDealsView })));
const MatericoListinoView = React.lazy(() => import('./components/MatericoListinoView').then((m) => ({ default: m.MatericoListinoView })));
const MatericoContractsView = React.lazy(() => import('./components/MatericoContractsView').then((m) => ({ default: m.MatericoContractsView })));
const MatericoMappaView = React.lazy(() => import('./components/MatericoMappaView').then((m) => ({ default: m.MatericoMappaView })));
const MatericoHomeView = React.lazy(() => import('./components/MatericoHomeView').then((m) => ({ default: m.MatericoHomeView })));
const PianoFinanziarioView = React.lazy(() => import('./components/PianoFinanziarioView').then((m) => ({ default: m.PianoFinanziarioView })));
const ProgFatturazioneView = React.lazy(() => import('./components/ProgFatturazioneView').then((m) => ({ default: m.ProgFatturazioneView })));
const CommercialeView = React.lazy(() => import('./components/CommercialeView').then((m) => ({ default: m.CommercialeView })));
import {
  SOCIETY_REGISTRY, getSociety, findSection, slugToSocieta, societaSlug,
  firstAuthorizedHash, canViewSection, DEFAULT_DASHBOARD, type SectionConfig, type DashboardCtx,
} from './societyConfig';
import type { Societa } from './types';
import { TeamAssistant } from './components/TeamAssistant';
import { Navbar } from './components/Navbar';
import { Modal } from './components/Modal';
import { AppleSwitch } from './components/AppleSwitch';
import { injectSmartTextStyles } from './components/SmartText';
import { AuthFlow } from './components/AuthFlow';
import { LangProvider } from './i18n';
import { AccessRequests } from './components/AccessRequests';
import type { Lead, Supplier } from './components/CrmView';
import { ConfirmDeleteModal, type ConfirmDeleteRequest } from './components/ConfirmDeleteModal';
import {
  watchAuth,
  logoutGoogle,
  watchAccounts,
  watchOwnAccount,
  getAccounts,
  setAccount,
  updateAccount,
  removeAccount,
  watchNode,
  getNode,
  writeNode,
  updateNode,
  removeNode,
  type User as GUser
} from './firebase';

import {
  Computo,
  InvoiceActive,
  InvoicePassive,
  ScadenzaItem,
  FinanceRecordInput,
  COMPANY_LABEL,
  COMPANY_INVOICE_PREFIX,
  UNICO_ONIRICO_PCT,
  UNICO_STRATEGICO_FEE,
  matericoMargin,
  matericoPenalty,
  delayDays,
} from './finance';
import { dealToShowcaseEntry, dealToInvestorPositions } from './showcaseData';

interface Toast {
  id: string;
  msg: string;
  type?: 'ok' | 'err';
}

// Fallback Suspense per le viste lazy (code-splitting per route)
const ViewLoader: React.FC = () => (
  <div className="w-full flex items-center justify-center py-24">
    <span className="text-[13px] font-bold text-[#8a8a8a] animate-pulse">Caricamento…</span>
  </div>
);

// Metadati divisioni (settori): il modale "nuova commessa" si adatta al settore selezionato in Progetti.
const DIVISION_META: Record<'studio' | 'strategico' | 'materico' | 'unico', { label: string; color: string; desc: string; cta: string }> = {
  studio: { label: 'Onirico', color: '#161616', desc: 'Architettura, pratiche edilizie e catasto', cta: 'Crea pratica Onirico' },
  strategico: { label: 'Strategico', color: '#b45309', desc: 'Marketing, brand e campagne', cta: 'Crea progetto Strategico' },
  materico: { label: 'Materico', color: '#c2410c', desc: 'Forniture e posa con partner', cta: 'Crea commessa Materico' },
  unico: { label: 'Unico', color: '#4338ca', desc: 'Atelier di lusso su misura', cta: 'Crea progetto Unico' }
};

// Compone l'indirizzo immobile leggibile dai campi strutturati (via, civico, CAP, comune, provincia).
const composeAddress = (via: string, civico: string, cap: string, comune: string, provincia: string): string =>
  [
    via.trim() && `${via.trim()}${civico.trim() ? ' ' + civico.trim() : ''}`,
    [cap.trim(), comune.trim()].filter(Boolean).join(' '),
    provincia.trim() && `(${provincia.trim().toUpperCase()})`
  ].filter(Boolean).join(', ');

// Normalizza le righe catastali del form: trim + scarta le righe vuote.
const normalizeCatastali = (rows: { foglio: string; particella: string; sub: string }[]) =>
  rows
    .map((r) => ({ foglio: r.foglio.trim(), particella: r.particella.trim(), sub: r.sub.trim() || null }))
    .filter((r) => r.foglio || r.particella || r.sub);

// Editor identificativi catastali multipli (Foglio/Particella/Sub ripetibili, layout allineato).
// La nuova riga eredita il foglio dalla precedente per non ripetere dati inutilmente.
const CatastaliEditor: React.FC<{
  rows: { foglio: string; particella: string; sub: string }[];
  onChange: (rows: { foglio: string; particella: string; sub: string }[]) => void;
}> = ({ rows, onChange }) => {
  const set = (i: number, k: 'foglio' | 'particella' | 'sub', v: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] px-1">
        <span>Foglio</span>
        <span>Particella</span>
        <span>Sub</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
          <input value={r.foglio} onChange={(e) => set(i, 'foglio', e.target.value)} placeholder="12" className="input text-xs bg-white h-9 font-mono text-center" />
          <input value={r.particella} onChange={(e) => set(i, 'particella', e.target.value)} placeholder="450" className="input text-xs bg-white h-9 font-mono text-center" />
          <input value={r.sub} onChange={(e) => set(i, 'sub', e.target.value)} placeholder="3" className="input text-xs bg-white h-9 font-mono text-center" />
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="w-8 h-8 rounded-lg bg-white border border-[#e2e2e2] hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
              title="Rimuovi riga"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { foglio: rows[rows.length - 1]?.foglio || '', particella: '', sub: '' }])}
        className="self-start text-[11px] font-bold text-[#161616] bg-[#f0f0f0] hover:bg-[#e2e2e2] border-none rounded-full px-3 py-1.5 cursor-pointer"
      >
        + Aggiungi particella
      </button>
    </div>
  );
};

const projTaskCounts = (p: Project) => {
  let done = 0, tot = 0;
  Object.values(p.phases || {}).forEach(ph => {
    Object.values(ph.tasks || {}).forEach(t => {
      tot++;
      if (t.done) done++;
    });
  });
  return { done, tot };
};

const autoUpdateProjectsCompletion = (allProjects: Record<string, Project>): Record<string, Project> => {
  const next = { ...allProjects };
  Object.keys(next).forEach(id => {
    const p = next[id];
    const { done, tot } = projTaskCounts(p);
    if (tot > 0 && done === tot) {
      if (p.status !== 'completato') {
        next[id] = { ...p, status: 'completato', updatedAt: Date.now() };
      }
    } else if (p.status === 'completato' && tot > 0 && done < tot) {
      next[id] = { ...p, status: 'attivo', updatedAt: Date.now() };
    }
  });
  return next;
};

export default function App() {
  // ----------------------------------------------------
  // LOCAL PERSISTENCE + SEED STATE
  // ----------------------------------------------------
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [finances, setFinances] = useState<Record<string, FinanceMovement>>({});
  // Nodi finanza strutturati (admin/manager): condivisi con FinanzeView + contabilità di commessa
  const [finComputi, setFinComputi] = useState<Computo[]>([]);
  const [finInvoicesActive, setFinInvoicesActive] = useState<InvoiceActive[]>([]);
  const [finInvoicesPassive, setFinInvoicesPassive] = useState<InvoicePassive[]>([]);
  const [finScadenze, setFinScadenze] = useState<ScadenzaItem[]>([]);
  const [projectsInternal, setProjectsInternal] = useState<Record<string, ProjectInternal>>({});
  const [projectMessages, setProjectMessages] = useState<Record<string, Record<string, ProjectMessage>>>({});
  const [documents, setDocuments] = useState<Record<string, Record<string, any>>>({});
  const [furnishings, setFurnishings] = useState<Record<string, Record<string, Furnishing>>>({});
  // Moodboard 3D per progetto: projectMoodboard3d/<pid> = { elements: BoardElement[], updatedAt, by }
  const [moodboard3d, setMoodboard3d] = useState<Record<string, any>>({});

  // Modulo Cantiere (record + sotto-collezioni keyed per cantiereId)
  const [cantieri, setCantieri] = useState<Record<string, Cantiere>>({});
  const [cantRapportini, setCantRapportini] = useState<Record<string, Record<string, Rapportino>>>({});
  const [cantPresenze, setCantPresenze] = useState<Record<string, Record<string, Presenza>>>({});
  const [cantFoto, setCantFoto] = useState<Record<string, Record<string, CantiereFoto>>>({});
  const [cantMateriali, setCantMateriali] = useState<Record<string, Record<string, CantiereMateriale>>>({});
  const [cantChecklist, setCantChecklist] = useState<Record<string, Record<string, ChecklistItem>>>({});
  const [cantDocumenti, setCantDocumenti] = useState<Record<string, Record<string, CantiereDoc>>>({});
  const [cantSal, setCantSal] = useState<Record<string, Record<string, CantiereSal>>>({});
  const [cantLog, setCantLog] = useState<Record<string, Record<string, CantiereLog>>>({});
  const [cantRecords, setCantRecords] = useState<Record<string, Record<string, CantiereRecord>>>({});
  const [cantMessages, setCantMessages] = useState<Record<string, Record<string, CantiereMessage>>>({});

  // Area Impresa — profilo dell'impresa partner (riusabile su tutti i suoi cantieri), keyed per uid
  const [impresaDocs, setImpresaDocs] = useState<Record<string, Record<string, ImpresaDoc>>>({});
  const [impresaRecords, setImpresaRecords] = useState<Record<string, Record<string, ImpresaRecord>>>({});

  // Rubrica clienti (anagrafica riutilizzabile)
  const [clients, setClients] = useState<Record<string, ClientRecord>>({});
  // Preventivi studio
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [governanceOrg, setGovernanceOrg] = useState<Record<string, OrgNode>>({});
  const [governanceSop, setGovernanceSop] = useState<Record<string, GovernanceSop>>({});
  const [governanceMansionari, setGovernanceMansionari] = useState<Record<string, GovernanceMansionario>>({});
  const [governanceVault, setGovernanceVault] = useState<Record<string, VaultEntry>>({});
  const [vaultConfig, setVaultConfig] = useState<VaultConfig>({});
  const [newsletterSubs, setNewsletterSubs] = useState<Record<string, any>>({});
  const [hrEvents, setHrEvents] = useState<Record<string, HrEvent>>({});
  const [matericoDeals, setMatericoDeals] = useState<Record<string, MatericoDeal>>({});
  const [matericoListino, setMatericoListino] = useState<Record<string, MatericoPriceItem>>({});
  const [matericoContracts, setMatericoContracts] = useState<Record<string, MatericoContract>>({});
  const [pianoFinanziario, setPianoFinanziario] = useState<Record<string, PianoFinanziario>>({});
  const [pianoAnno, setPianoAnno] = useState(new Date().getFullYear());
  const [fatturazionePlan, setFatturazionePlan] = useState<Record<string, FatturazionePlanItem>>({});
  // Cestino condiviso (elementi eliminati, conservati 60 giorni)
  const [trash, setTrash] = useState<Record<string, TrashItem>>({});
  // Doppia conferma eliminazione (modale condivisa)
  const [confirmDel, setConfirmDel] = useState<ConfirmDeleteRequest | null>(null);
  // Tab iniziale di Finanze (es. 'preventivi' arrivando da #preventivi)
  const [finStartTab, setFinStartTab] = useState<string | null>(null);
  const [finLock, setFinLock] = useState<'studio' | 'strategico' | 'materico' | 'unico' | null>(null);
  const [crmStartTab, setCrmStartTab] = useState<'dashboard' | 'pipeline' | 'fornitori' | 'clienti' | null>(null);

  // CRM (pipeline lead + fornitori)
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [crmSuppliers, setCrmSuppliers] = useState<Supplier[]>([]);
  // Listino voci di costo riusabili (funnel commessa Onirico/Materico)
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  // Registro attività / audit log (visibile admin/manager)
  const [auditLog, setAuditLog] = useState<Record<string, AuditEntry>>({});
  const [unicoDeals, setUnicoDeals] = useState<UnicoDeal[]>([]);
  // Commesse interne (intercompany) — nodo internalOrders
  const [internalOrders, setInternalOrders] = useState<InternalOrder[]>([]);
  // Incentivi & Point system — eventi punti (nodo pointEvents/<uid>/<id>)
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([]);
  // Vetrina Unico pubblicata (snapshot pubblici dei deal `published`, nodo `unicoShowcase`)
  const [unicoShowcase, setUnicoShowcase] = useState<Record<string, UnicoShowcaseEntry>>({});
  // Posizioni private del singolo investitore (nodo unicoInvestorPositions/<uid>), lato portale
  const [unicoPositions, setUnicoPositions] = useState<Record<string, UnicoInvestorPosition>>({});
  // uid che avevano una posizione all'ultima scrittura (per ripulire quelle rimosse)
  const prevInvestorUidsRef = useRef<Set<string>>(new Set());

  // Modulo Strategico / Marketing
  const [mktEvents, setMktEvents] = useState<Record<string, MarketingEvent>>({});
  const [mktCampaigns, setMktCampaigns] = useState<Record<string, Campaign>>({});
  const [mktSurveys, setMktSurveys] = useState<Record<string, Survey>>({});
  const [mktSocial, setMktSocial] = useState<Record<string, SocialPost>>({});
  // Studio: tutte le risposte sondaggio (surveyId → uid → risposta). Portale: solo le proprie.
  const [mktResponses, setMktResponses] = useState<Record<string, Record<string, SurveyResponse>>>({});
  // Strategico — Economia (Blocco A): contratti/retainer + time tracking
  const [mktContracts, setMktContracts] = useState<Record<string, MktContract>>({});
  const [mktTime, setMktTime] = useState<Record<string, MktTimeEntry>>({});
  // Strategico — Produzione (Blocco B): asset library + deliverable kanban + proofing
  const [mktAssets, setMktAssets] = useState<Record<string, MktAsset>>({});
  const [mktDeliverables, setMktDeliverables] = useState<Record<string, MktDeliverable>>({});
  const [mktProofs, setMktProofs] = useState<Record<string, MktProof>>({});
  // Strategico — Acquisizione/Dati/Compliance (Blocchi D–K)
  const [mktLeads, setMktLeads] = useState<Record<string, MktLead>>({});
  const [mktFlows, setMktFlows] = useState<Record<string, MktFlow>>({});
  const [mktSeo, setMktSeo] = useState<Record<string, MktSeoItem>>({});
  const [mktAds, setMktAds] = useState<Record<string, MktAdCampaign>>({});
  const [mktMetrics, setMktMetrics] = useState<Record<string, MktMetric>>({});
  const [mktInbox, setMktInbox] = useState<Record<string, MktInboxItem>>({});
  const [mktConsents, setMktConsents] = useState<Record<string, MktConsent>>({});
  // Strategico — Progetti marketing (contenitore, §22-sex)
  const [mktProjects, setMktProjects] = useState<Record<string, MktProject>>({});

  // Agenda condivisa (appuntamenti / note tra utenti)
  const [appointments, setAppointments] = useState<Record<string, Appointment>>({});
  const [apptOpen, setApptOpen] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTitle, setApptTitle] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptWho, setApptWho] = useState<string[]>([]);   // uid partecipanti (team + clienti + partner)
  const [apptWhoFilter, setApptWhoFilter] = useState('');
  const [apptNote, setApptNote] = useState('');
  const [apptPrivate, setApptPrivate] = useState(false);

  // Elenco pubblico dei membri studio (per i portali cliente/partner)
  const [directory, setDirectory] = useState<Record<string, { name: string; role: string }>>({});

  // Materico — richieste forniture/posa
  const [matericoRequests, setMatericoRequests] = useState<Record<string, MatericoRequest>>({});
  const [clientRequests, setClientRequests] = useState<Record<string, ClientRequest>>({});
  const [estimates, setEstimates] = useState<Record<string, MatericoEstimate>>({});

  // Active session profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  // Proprio record users/<uid> SEMPRE disponibile (anche se non attivo): serve
  // a decidere registrazione/attesa/rifiuto anche per cliente/azienda non-active.
  const [ownProfile, setOwnProfile] = useState<UserProfile | null>(null);

  // Google (Firebase) authentication gate
  const [gUser, setGUser] = useState<GUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Controllo accessi (Realtime Database)
  const [accounts, setAccounts] = useState<Record<string, UserProfile>>({});
  const [accountsReady, setAccountsReady] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false); // modale admin
  const creatingRef = useRef(false); // evita doppia creazione record

  // Router route & params
  const [route, setRoute] = useState<string>('sdash');
  const [routeParam, setRouteParam] = useState<string | null>(null);
  const [peopleTab, setPeopleTab] = useState<'team' | 'clienti' | 'partner'>('team');
  // Aulico V2: società + sezione correnti (navigazione guidata dalle autorizzazioni)
  const [activeSocieta, setActiveSocieta] = useState<Societa>('studio');
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // Navigation calendar states
  const [calView, setCalView] = useState<'month' | 'week' | 'day'>('day');
  const [calDate, setCalDate] = useState<Date>(new Date());

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Notifications states (persistite su notifications/<uid>)
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Ferie/assenze team
  const [teamLeave, setTeamLeave] = useState<Record<string, TeamLeave>>({});

  // ----------------------------------------------------
  // INITIALIZATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // Inject custom animation styles for smart letters
    injectSmartTextStyles();

    // NB: tutti i dati dell'app ora vivono sul Realtime Database condiviso.
    // Il caricamento avviene nell'effetto di sincronizzazione (vedi sotto),
    // in base al ruolo dell'utente approvato. Niente più seed in localStorage.

    // Mappa retrocompat route legacy → (società, sezione) per evidenziare la sidebar.
    const LEGACY_SECTION: Record<string, { soc: Societa; sec: string }> = {
      calendario: { soc: 'holding', sec: 'agenda' },
      progetti: { soc: 'studio', sec: 'home-cicli' },
      progetto: { soc: 'studio', sec: 'home-cicli' },
      crm: { soc: 'strategico', sec: 'hr-crm' },
      'richieste-clienti': { soc: 'studio', sec: 'richieste' },
      documenti: { soc: 'studio', sec: 'documenti' },
      finanze: { soc: 'strategico', sec: 'amm-contabilita' },
      team: { soc: 'strategico', sec: 'hr-team' },
      registro: { soc: 'strategico', sec: 'hr-registro' },
      cestino: { soc: 'holding', sec: 'cestino' },
    };

    // Router hash. Nuovo schema: #<slugSocietà>/<sezione>[/<param>]; legacy retrocompat.
    const handleHash = () => {
      const parts = window.location.hash.slice(1).split('/').filter(Boolean);
      const head = parts[0] || '';

      // --- Nuovo schema società/sezione ---
      const soc = slugToSocieta(head);
      const society = soc ? getSociety(soc) : undefined;
      if (soc && society) {
        const sectionId = parts[1] || (society.sections.find((s) => !s.parent)?.id || 'dashboard');
        const sec = findSection(soc, sectionId);
        setActiveSocieta(soc);
        setActiveSection(sectionId);
        if (sec?.preset?.division) setActiveDivision(sec.preset.division);
        setFinStartTab(sec?.preset?.finStartTab ?? null);
        setFinLock((sec?.preset?.financeLock as any) ?? null);
        setCrmStartTab((sec?.preset?.crmTab as any) ?? null);
        if (!sec || sec.kind === 'dashboard') setRoute('sdash');
        else if (sec.kind === 'group') setRoute('sportal');
        else if (sec.kind === 'placeholder') setRoute('splaceholder');
        else if (sec.view) setRoute('sview');
        else setRoute(sec.legacyRoute || 'sdash');
        setRouteParam(parts[2] || null);
        return;
      }

      // --- Schema legacy (bookmark, link notifiche, navigazioni interne) ---
      let r = head || 'dashboard';
      if (r === 'dashboard') {
        setActiveSocieta('holding');
        setActiveSection('dashboard');
        setFinStartTab(null);
        setRoute('sdash');
        setRouteParam(null);
        return;
      }
      let secSoc: Societa = 'studio';
      let secId = 'dashboard';
      if (r === 'materico') { r = 'progetti'; setActiveDivision('materico'); secSoc = 'materico'; secId = 'home-cicli'; }
      else if (r === 'strategico') { r = 'progetti'; setActiveDivision('strategico'); secSoc = 'strategico'; secId = 'mkt-strategico'; }
      else if (r === 'preventivi') { r = 'finanze'; setFinStartTab('preventivi'); secSoc = 'studio'; secId = 'commerciale'; }
      else if (r === 'statistiche') { r = 'finanze'; setFinStartTab('statistiche'); secSoc = 'strategico'; secId = 'amministrazione'; }
      else {
        setFinStartTab(null);
        const m = LEGACY_SECTION[r];
        if (m) { secSoc = m.soc; secId = m.sec; }
      }
      setActiveSocieta(secSoc);
      setActiveSection(secId);
      setRoute(r);
      setRouteParam(parts[1] || null);
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Watch Firebase Google auth state (gate the whole app)
  useEffect(() => {
    const unsub = watchAuth((u) => {
      setGUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Controllo accessi sul nodo "users". Sottoscrive il PROPRIO record (sempre
  // leggibile dalle regole) e, se sei team attivo, l'intera lista utenti.
  useEffect(() => {
    if (!gUser) {
      setAccounts({});
      setAccountsReady(false);
      setCurrentUser(null);
      setOwnProfile(null);
      setUsers({});
      creatingRef.current = false;
      return;
    }

    let unsubAll: (() => void) | null = null;

    const unsubOwn = watchOwnAccount(gUser.uid, async (mine: any) => {
      setAccountsReady(true);
      setOwnProfile(mine || null);

      if (!mine) {
        // Bootstrap admin: il proprietario o il primissimo utente diventa admin
        // attivo. Tutti gli altri completano la scheda dal form di registrazione
        // (AuthFlow) — qui NON creiamo un record parziale.
        if (!creatingRef.current) {
          creatingRef.current = true;
          const OWNER_EMAIL = 'giorgio.pascali990@gmail.com';
          const email = (gUser.email || '').toLowerCase();
          const isAdminEmail = email === OWNER_EMAIL;
          let isFirst = false;
          try {
            const all = await getAccounts(); // leggibile solo se il nodo è vuoto (bootstrap)
            isFirst = !all || Object.keys(all).length === 0;
          } catch (_) {
            isFirst = false;
          }
          if (isFirst || isAdminEmail) {
            setAccount(gUser.uid, {
              uid: gUser.uid,
              name: gUser.displayName || gUser.email || 'Amministratore',
              email: gUser.email || '',
              photoURL: gUser.photoURL || '',
              createdAt: Date.now(),
              role: 'admin',
              status: 'approved',
              active: true,
              accountType: 'team',
              profileComplete: true
            }).catch(() => {});
          } else {
            // niente record: lascia che AuthFlow mostri il completamento profilo
            creatingRef.current = false;
          }
        }
        setCurrentUser(null);
        return;
      }

      creatingRef.current = false;

      const approvedOk = mine.status === 'approved' && !!mine.role;
      if (approvedOk) {
        setCurrentUser(mine);
        // Solo il team "active" può leggere l'intera lista utenti.
        if (mine.active === true && !unsubAll) {
          unsubAll = watchAccounts(
            (all) => {
              setAccounts(all);
              const approved: Record<string, UserProfile> = {};
              Object.entries(all).forEach(([uid, u]: any) => {
                if (u?.status === 'approved') approved[uid] = u;
              });
              setUsers(approved);
              // L'admin mantiene l'elenco pubblico dei membri studio per i portali
              if (mine.role === 'admin') {
                const dir: Record<string, { name: string; role: string }> = {};
                Object.values(approved).forEach((u: any) => {
                  if (u.role === 'admin' || u.role === 'manager' || u.role === 'staff') {
                    dir[u.uid] = { name: u.name || '', role: u.role };
                  }
                });
                writeNode('directory', dir).catch(() => {});
              }
            },
            () => {}
          );
        }
      } else {
        setCurrentUser(null);
      }
    }, () => { setAccountsReady(true); });

    return () => {
      unsubOwn();
      if (unsubAll) unsubAll();
    };
  }, [gUser]);

  // ---- Azioni admin sul controllo accessi ----
  const isStudioRole = (r: string) => r === 'admin' || r === 'manager' || r === 'staff';
  const handleApproveAccount = (uid: string, role: any, sector?: string) => {
    const patch: any = {
      status: 'approved',
      role,
      active: isStudioRole(role), // studio attivo; cliente/partner accedono solo ai propri progetti
      approvedBy: gUser?.uid || null,
      approvedAt: Date.now()
    };
    if (role === 'cliente' && sector) patch.sector = sector;
    updateAccount(uid, patch)
      .then(() => showToast('Account approvato.'))
      .catch(() => showToast('Errore: controlla le regole del Database.', 'err'));
  };
  const handleRejectAccount = (uid: string) => {
    updateAccount(uid, { status: 'rejected', active: false })
      .then(() => showToast('Richiesta rifiutata.', 'err'))
      .catch(() => showToast('Errore di scrittura.', 'err'));
  };
  const handleChangeAccountRole = (uid: string, role: any, sector?: string) => {
    const patch: any = { role, active: isStudioRole(role) };
    if (role === 'cliente' && sector) patch.sector = sector;
    updateAccount(uid, patch)
      .then(() => showToast('Ruolo aggiornato.'))
      .catch(() => showToast('Errore di scrittura.', 'err'));
  };
  const handleRevokeAccount = (uid: string) => {
    updateAccount(uid, { status: 'pending', active: false })
      .then(() => showToast('Account rimesso in attesa.'))
      .catch(() => showToast('Errore di scrittura.', 'err'));
  };
  const handleRemoveAccount = (uid: string) => {
    askDelete('Eliminare questo account?', 'L\'account verrà eliminato definitivamente (non passa dal Cestino).', () => {
      removeAccount(uid)
        .then(() => showToast('Account eliminato.', 'err'))
        .catch(() => showToast('Errore di scrittura.', 'err'));
    }, true);
  };

  // Mappa chiave-stato -> nodo del Database (le tue regole usano "studioFinance")
  const KEY2PATH: Record<string, string> = { finance: 'studioFinance' };

  // Ogni modifica dell'app viene scritta sul Database condiviso.
  const syncState = (key: string, val: any) => {
    if (key === 'users') {
      // gli utenti si scrivono per-uid (le regole proteggono ogni record)
      Object.entries(val || {}).forEach(([uid, u]) => setAccount(uid, u).catch(() => {}));
      return;
    }
    const path = KEY2PATH[key] || key;
    writeNode(path, val).catch(() => {});
  };

  // ---- CRM: salvataggio + conversione lead in commessa ----
  const saveLeads = (arr: Lead[]) => {
    setCrmLeads(arr);
    writeNode('crmLeads', arr).catch(() => {});
  };
  const saveSuppliers = (arr: Supplier[]) => {
    setCrmSuppliers(arr);
    writeNode('crmSuppliers', arr).catch(() => {});
  };
  // Smistamento lead (Point of Entry Strategico): la card aggiorna il lead via
  // saveLeads; qui notifichiamo il team della società di competenza.
  const handleRouteLead = (lead: Lead, sector: 'studio' | 'strategico' | 'materico') => {
    const lbl = sector === 'strategico' ? 'Strategico' : sector === 'materico' ? 'Materico' : 'Onirico';
    notifyStudio({ type: 'lead', title: `Lead assegnato a ${lbl}`, body: `${lead.name}${lead.company ? ' · ' + lead.company : ''}`, link: '#crm' }, currentUser?.uid);
    logAudit('update', 'lead', `${lead.name} → ${lbl}`, 'smistamento');
  };
  const savePriceList = (arr: PriceItem[]) => {
    setPriceList(arr);
    writeNode('priceList', arr).catch(() => showToast('Errore listino (controlla regole).', 'err'));
  };
  // Unico (lato studio): operazioni immobiliari + investitori (nodo array).
  // Write-through: ricostruisce anche lo snapshot PUBBLICO `unicoShowcase`
  // (solo deal `published`, solo campi divulgabili — vedi dealToShowcaseEntry):
  // scrivere il nodo intero tiene in sync anche depubblicazioni/eliminazioni.
  const saveUnicoDeals = (arr: UnicoDeal[]) => {
    setUnicoDeals(arr);
    writeNode('unicoDeals', arr).catch(() => {});
    const pub: Record<string, UnicoShowcaseEntry> = {};
    arr.filter((d) => d.published).forEach((d) => { pub[d.id] = dealToShowcaseEntry(d); });
    setUnicoShowcase(pub);
    writeNode('unicoShowcase', pub).catch(() => {});
    // Write-through delle posizioni PRIVATE per investitore collegato (investorUid).
    // Aggrega per uid tutte le sue posizioni (su più operazioni) e scrive il nodo intero.
    const byUid: Record<string, Record<string, UnicoInvestorPosition>> = {};
    arr.forEach((d) => {
      const positions = dealToInvestorPositions(d);
      Object.entries(positions).forEach(([uid, pos]) => {
        (byUid[uid] ||= {})[d.id] = pos;
      });
    });
    const nextUids = new Set(Object.keys(byUid));
    Object.entries(byUid).forEach(([uid, map]) => writeNode(`unicoInvestorPositions/${uid}`, map).catch(() => {}));
    // Ripulisce le posizioni degli investitori non più collegati a nessuna operazione.
    prevInvestorUidsRef.current.forEach((uid) => {
      if (!nextUids.has(uid)) removeNode(`unicoInvestorPositions/${uid}`).catch(() => {});
    });
    prevInvestorUidsRef.current = nextUids;
    // Auto-generazione commesse interne dalla cascata ROE (decisione §6.2).
    syncDealInternalOrders(arr);
  };

  /**
   * Materializza/aggiorna le 3 commesse interne (Onirico 15% / Materico opere /
   * Strategico €10k) per ogni deal con `roe`. Idempotente (id deterministico
   * `io-<dealId>-<suffix>`); aggiorna gli importi solo finché la commessa è in
   * `bozza` (per non desincronizzare la finanza già scritta alla conferma).
   * NON scrive finanza: quella avviene alla conferma (handleConfirmInternalOrder).
   */
  const syncDealInternalOrders = (deals: UnicoDeal[]) => {
    if (!deals.some((d) => d.roe)) return;
    const next: InternalOrder[] = [...internalOrders];
    let codeCounter = next.reduce((m, o) => {
      const n = parseInt((o.code || '').replace(/^CI-/, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    let changed = false;
    const upsert = (o: InternalOrder) => {
      const i = next.findIndex((x) => x.id === o.id);
      if (i >= 0) next[i] = o; else next.push(o);
      changed = true;
    };
    deals.forEach((deal) => {
      const r = deal.roe;
      if (!r) return;
      const works = (r.worksCost || deal.renovationBudget || 0);
      const oniricoPct = r.oniricoPct ?? UNICO_ONIRICO_PCT;
      const strategicoFee = r.strategicoFee ?? UNICO_STRATEGICO_FEE;
      const specs: { suffix: string; type: InternalOrder['type']; fornitore: InternalOrder['fornitore']['company']; amount: number; basis: InternalOrder['basis']; label: string }[] = [
        { suffix: 'onirico', type: 'progettazione_dl', fornitore: 'studio', amount: works * (oniricoPct / 100), basis: { mode: 'percent', pct: oniricoPct, ofAmount: works }, label: 'Progettazione + DL (Onirico)' },
        { suffix: 'materico', type: 'ristrutturazione', fornitore: 'materico', amount: works, basis: { mode: 'manual', amount: works }, label: 'Ristrutturazione (Materico)' },
        { suffix: 'strategico', type: 'promozione', fornitore: 'strategico', amount: strategicoFee, basis: { mode: 'fixed', amount: strategicoFee }, label: 'Promozione & vendita (Strategico)' },
      ];
      specs.forEach((s) => {
        const id = `io-${deal.id}-${s.suffix}`;
        const existing = next.find((o) => o.id === id);
        const title = `${s.label} – ${deal.title}`;
        if (existing) {
          if (existing.status === 'bozza' && (existing.amount !== s.amount || existing.title !== title)) {
            upsert({ ...existing, title, amount: s.amount, basis: s.basis });
          }
        } else {
          codeCounter += 1;
          upsert({
            id, code: `CI-${String(codeCounter).padStart(3, '0')}`, type: s.type, title, status: 'bozza',
            committente: { company: 'unico', refType: 'deal', refId: deal.id }, fornitore: { company: s.fornitore },
            basis: s.basis, amount: s.amount, createdAt: Date.now(), createdBy: currentUser?.uid || null,
          });
        }
      });
    });
    if (changed) {
      setInternalOrders(next);
      writeNode('internalOrders', next).catch(() => {});
    }
  };
  // Notifica in-app agli investitori collegati di un'operazione Unico (es. nuovo aggiornamento
  // o distribuzione). I link puntano al portale → sezione "I miei investimenti".
  const notifyUnicoInvestors = (uids: string[], title: string, body: string) => {
    Array.from(new Set(uids.filter(Boolean))).forEach((uid) =>
      pushNotification(uid, { type: 'unico', title, body, link: '#portale/investimenti' })
    );
  };

  // ---- Modulo Strategico / Marketing (studio) ----
  const handleSaveMktEvent = (ev: MarketingEvent) => {
    const enriched: MarketingEvent = { ...ev, updatedAt: Date.now(), createdAt: ev.createdAt || Date.now() };
    setMktEvents((prev) => ({ ...prev, [ev.id]: enriched }));
    writeNode(`mktEvents/${ev.id}`, enriched).catch(() => showToast('Errore eventi (controlla regole).', 'err'));
    // Indice inviti + notifica per gli invitati con account portale
    Object.values(enriched.invitees || {}).forEach((inv) => {
      if (inv.uid) {
        writeNode(`mktInvitesIndex/${inv.uid}/${ev.id}`, true).catch(() => {});
        pushNotification(inv.uid, { type: 'evento', title: `Invito: ${enriched.title}`, body: enriched.date ? new Date(enriched.date).toLocaleString('it-IT') : '', link: '#portale' });
      }
    });
  };
  const handleDeleteMktEvent = (id: string) => {
    const ev = mktEvents[id];
    askDelete('Eliminare questo evento?', ev ? `"${ev.title}"` : null, () => {
      if (ev) moveToTrash('mkt-evento', ev.title || 'Evento', ev);
      setMktEvents((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktEvents/${id}`).catch(() => {});
      Object.values(ev?.invitees || {}).forEach((inv) => { if (inv.uid) removeNode(`mktInvitesIndex/${inv.uid}/${id}`).catch(() => {}); });
    });
  };
  const handleSaveCampaign = (c: Campaign) => {
    const enriched: Campaign = { ...c, updatedAt: Date.now(), createdAt: c.createdAt || Date.now() };
    setMktCampaigns((prev) => ({ ...prev, [c.id]: enriched }));
    writeNode(`mktCampaigns/${c.id}`, enriched).catch(() => showToast('Errore campagne (controlla regole).', 'err'));
  };
  const handleDeleteCampaign = (id: string) => {
    const c = mktCampaigns[id];
    askDelete('Eliminare questa campagna?', c ? `"${c.name}"` : null, () => {
      if (c) moveToTrash('mkt-campagna', c.name || 'Campagna', c);
      setMktCampaigns((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktCampaigns/${id}`).catch(() => {});
    });
  };
  const handleSaveSurvey = (s: Survey) => {
    const enriched: Survey = { ...s, updatedAt: Date.now(), createdAt: s.createdAt || Date.now() };
    setMktSurveys((prev) => ({ ...prev, [s.id]: enriched }));
    writeNode(`mktSurveys/${s.id}`, enriched).catch(() => showToast('Errore sondaggi (controlla regole).', 'err'));
  };
  const handleDeleteSurvey = (id: string) => {
    const s = mktSurveys[id];
    askDelete('Eliminare questo sondaggio?', s ? `"${s.title}"` : null, () => {
      if (s) moveToTrash('mkt-sondaggio', s.title || 'Sondaggio', s);
      setMktSurveys((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktSurveys/${id}`).catch(() => {});
    });
  };
  const handleSaveSocialPost = (p: SocialPost) => {
    const enriched: SocialPost = { ...p, updatedAt: Date.now(), createdAt: p.createdAt || Date.now() };
    setMktSocial((prev) => ({ ...prev, [p.id]: enriched }));
    writeNode(`mktSocial/${p.id}`, enriched).catch(() => showToast('Errore social (controlla regole).', 'err'));
  };
  const handleDeleteSocialPost = (id: string) => {
    const p = mktSocial[id];
    askDelete('Eliminare questo post?', p ? `"${(p.caption || '').slice(0, 40)}"` : null, () => {
      if (p) moveToTrash('mkt-social', (p.caption || 'Post').slice(0, 40), p);
      setMktSocial((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktSocial/${id}`).catch(() => {});
    });
  };

  // ----------------------------------------------------
  // Strategico — Economia (Blocco A): contratti/retainer + time tracking.
  // Ogni voce economica confluisce nei nodi finanza globali con sector:'strategico'.
  // ----------------------------------------------------
  const rndId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
  const cadenceLabel = (c: MktContract['cadence']) =>
    c === 'mensile' ? 'mese' : c === 'trimestrale' ? 'trimestre' : c === 'annuale' ? 'anno' : 'una tantum';

  const handleSaveMktContract = (k: MktContract) => {
    const enriched: MktContract = { ...k, updatedAt: Date.now(), createdAt: k.createdAt || Date.now() };
    setMktContracts((prev) => ({ ...prev, [k.id]: enriched }));
    writeNode(`mktContracts/${k.id}`, enriched).catch(() => showToast('Errore contratti (controlla regole).', 'err'));
  };
  const handleDeleteMktContract = (id: string) => {
    const k = mktContracts[id];
    askDelete('Eliminare questo contratto/retainer?', k ? `"${k.title}" · ${k.clientName}` : null, () => {
      if (k) moveToTrash('mkt-contratto', `${k.title} · ${k.clientName}`, k, undefined, eur(k.amount || 0));
      setMktContracts((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktContracts/${id}`).catch(() => {});
      showToast('Contratto spostato nel Cestino.', 'err');
    });
  };
  // Emette il periodo corrente di un retainer → bozza fattura attiva + scadenza in Finanza.
  const handleEmitContractInvoice = (contractId: string, periodLabel?: string) => {
    const k = mktContracts[contractId];
    if (!k) return;
    const period = periodLabel || new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    if ((k.emissions || []).some((e) => e.periodLabel === period)) { showToast('Periodo già emesso per questo contratto.', 'err'); return; }
    const invId = rndId('inv');
    const scaId = rndId('sca');
    const inv: InvoiceActive = {
      id: invId, clientName: k.clientName, projectId: k.projectId || '', projectName: k.projectId ? (projects[k.projectId]?.name || '') : '',
      amount: k.amount, taxRate: k.vatPct == null ? 22 : k.vatPct, cassaPct: k.cassaPct ?? null,
      status: 'bozza', sdiCode: '', date: todayISO(), dueDate: todayISO(), sector: 'strategico',
    };
    const sca: ScadenzaItem = {
      id: scaId, kind: 'entrata', desc: `Retainer ${k.title} · ${period}`, clientOrSupplier: k.clientName,
      amount: k.amount, dueDate: todayISO(), status: 'pago_attesa', projectId: k.projectId || undefined, sector: 'strategico',
    };
    handleSaveFinanceItem('finInvoicesActive', inv);
    handleSaveFinanceItem('finScadenze', sca);
    const emission = { id: rndId('em'), invoiceId: invId, scadenzaId: scaId, periodLabel: period, amount: k.amount, at: Date.now() };
    handleSaveMktContract({ ...k, emissions: [...(k.emissions || []), emission] });
    showToast(`Retainer "${k.title}" ${period}: bozza fattura + scadenza create in Finanze.`, 'ok');
  };

  const handleSaveMktTimeEntry = (t: MktTimeEntry) => {
    const enriched: MktTimeEntry = { ...t, updatedAt: Date.now(), createdAt: t.createdAt || Date.now() };
    setMktTime((prev) => ({ ...prev, [t.id]: enriched }));
    writeNode(`mktTimeEntries/${t.id}`, enriched).catch(() => showToast('Errore time tracking (controlla regole).', 'err'));
  };
  const handleDeleteMktTimeEntry = (id: string) => {
    const t = mktTime[id];
    askDelete('Eliminare questa voce di time tracking?', t ? `${(t.minutes / 60).toFixed(1)}h · ${t.activity || ''}` : null, () => {
      if (t) moveToTrash('mkt-time', `${(t.minutes / 60).toFixed(1)}h · ${t.clientName || t.activity || ''}`, t);
      setMktTime((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktTimeEntries/${id}`).catch(() => {});
      showToast('Voce spostata nel Cestino.', 'err');
    });
  };
  // Fattura un gruppo di ore fatturabili → bozza fattura attiva + scadenza in Finanza.
  const handleBillTimeEntries = (entryIds: string[]) => {
    const entries = entryIds.map((id) => mktTime[id]).filter((e): e is MktTimeEntry => !!e && !e.billedInvoiceId && !!e.billable);
    if (!entries.length) { showToast('Nessuna ora fatturabile selezionata.', 'err'); return; }
    const total = entries.reduce((s, e) => s + (e.minutes / 60) * (Number(e.rate) || 0), 0);
    if (total <= 0) { showToast('Imposta una tariffa €/h sulle ore da fatturare.', 'err'); return; }
    const clientName = entries[0].clientName || 'Cliente';
    const projectId = entries[0].projectId || '';
    const invId = rndId('inv');
    const inv: InvoiceActive = {
      id: invId, clientName, projectId, projectName: projectId ? (projects[projectId]?.name || '') : '',
      amount: Math.round(total * 100) / 100, taxRate: 22, cassaPct: null,
      status: 'bozza', sdiCode: '', date: todayISO(), dueDate: todayISO(), sector: 'strategico',
    };
    const sca: ScadenzaItem = {
      id: rndId('sca'), kind: 'entrata', desc: `Ore marketing · ${clientName} (${(entries.reduce((s, e) => s + e.minutes, 0) / 60).toFixed(1)}h)`,
      clientOrSupplier: clientName, amount: inv.amount, dueDate: todayISO(), status: 'pago_attesa', projectId: projectId || undefined, sector: 'strategico',
    };
    handleSaveFinanceItem('finInvoicesActive', inv);
    handleSaveFinanceItem('finScadenze', sca);
    entries.forEach((e) => handleSaveMktTimeEntry({ ...e, billedInvoiceId: invId }));
    showToast(`Fatturate ${entries.length} voci ore: bozza fattura + scadenza in Finanze.`, 'ok');
  };

  // Registra la spesa di una campagna come fattura passiva in Finanza (sector:'strategico').
  const handleRegisterCampaignSpend = (campaignId: string) => {
    const c = mktCampaigns[campaignId];
    if (!c) return;
    const amount = Number(c.spend) || Number(c.budget) || 0;
    if (amount <= 0) { showToast('Imposta budget/spesa sulla campagna.', 'err'); return; }
    const invId = rndId('inp');
    const inv: InvoicePassive = {
      id: invId, supplierName: c.name || 'Campagna', projectId: '', projectName: '', amount,
      category: 'Marketing / Advertising', status: 'ricevuta', date: todayISO(), dueDate: todayISO(),
      sector: 'strategico', description: `Spesa campagna ${c.name}${c.channel ? ' · ' + c.channel : ''}`,
    };
    handleSaveFinanceItem('finInvoicesPassive', inv);
    handleSaveCampaign({ ...c, financeRefs: [...(c.financeRefs || []), invId] });
    showToast(`Spesa campagna "${c.name}" registrata in Finanze.`, 'ok');
  };
  // Registra l'economia di un evento: ricavi → fattura attiva, costo → fattura passiva.
  const handleRegisterEventFinance = (eventId: string) => {
    const ev = mktEvents[eventId];
    if (!ev) return;
    const refs: string[] = [...(ev.financeRefs || [])];
    if (Number(ev.revenue) > 0) {
      const id = rndId('inv');
      handleSaveFinanceItem('finInvoicesActive', {
        id, clientName: ev.title || 'Evento', projectId: '', projectName: '', amount: Number(ev.revenue),
        taxRate: 22, cassaPct: null, status: 'bozza', sdiCode: '', date: todayISO(), dueDate: todayISO(), sector: 'strategico',
      } as InvoiceActive);
      refs.push(id);
    }
    if (Number(ev.budget) > 0) {
      const id = rndId('inp');
      handleSaveFinanceItem('finInvoicesPassive', {
        id, supplierName: ev.title || 'Evento', projectId: '', projectName: '', amount: Number(ev.budget),
        category: 'Marketing / Eventi', status: 'ricevuta', date: todayISO(), dueDate: todayISO(),
        sector: 'strategico', description: `Costo evento ${ev.title}`,
      } as InvoicePassive);
      refs.push(id);
    }
    if (refs.length === (ev.financeRefs || []).length) { showToast('Imposta ricavi o costo sull’evento.', 'err'); return; }
    handleSaveMktEvent({ ...ev, financeRefs: refs });
    showToast(`Economia evento "${ev.title}" registrata in Finanze.`, 'ok');
  };

  // ----------------------------------------------------
  // Strategico — Produzione (Blocco B): asset library + deliverable kanban + proofing
  // ----------------------------------------------------
  const handleSaveMktAsset = (a: MktAsset) => {
    const enriched: MktAsset = { ...a, by: a.by || currentUser?.uid || null, updatedAt: Date.now(), createdAt: a.createdAt || Date.now() };
    setMktAssets((prev) => ({ ...prev, [a.id]: enriched }));
    writeNode(`mktAssets/${a.id}`, enriched).catch(() => showToast('Errore asset (controlla regole).', 'err'));
  };
  const handleDeleteMktAsset = (id: string) => {
    const a = mktAssets[id];
    askDelete('Eliminare questo asset?', a ? `"${a.name}"` : null, () => {
      if (a) moveToTrash('mkt-asset', a.name || 'Asset', a);
      setMktAssets((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktAssets/${id}`).catch(() => {});
      showToast('Asset spostato nel Cestino.', 'err');
    });
  };
  const handleSaveMktDeliverable = (d: MktDeliverable) => {
    const enriched: MktDeliverable = { ...d, updatedAt: Date.now(), createdAt: d.createdAt || Date.now() };
    setMktDeliverables((prev) => ({ ...prev, [d.id]: enriched }));
    writeNode(`mktDeliverables/${d.id}`, enriched).catch(() => showToast('Errore deliverable (controlla regole).', 'err'));
    if (d.assigneeUid) pushNotification(d.assigneeUid, { type: 'task', title: `Deliverable: ${d.title}`, body: d.clientName || '', link: '#progetti' });
  };
  const handleDeleteMktDeliverable = (id: string) => {
    const d = mktDeliverables[id];
    askDelete('Eliminare questo deliverable?', d ? `"${d.title}"` : null, () => {
      if (d) moveToTrash('mkt-deliverable', d.title || 'Deliverable', d);
      setMktDeliverables((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktDeliverables/${id}`).catch(() => {});
      showToast('Deliverable spostato nel Cestino.', 'err');
    });
  };
  const handleSaveMktProof = (p: MktProof) => {
    const enriched: MktProof = { ...p, updatedAt: Date.now(), createdAt: p.createdAt || Date.now() };
    setMktProofs((prev) => ({ ...prev, [p.id]: enriched }));
    writeNode(`mktProofs/${p.id}`, enriched).catch(() => showToast('Errore proof (controlla regole).', 'err'));
  };
  const handleDeleteMktProof = (id: string) => {
    const p = mktProofs[id];
    askDelete('Eliminare questa proof?', p ? `"${p.title}"` : null, () => {
      if (p) moveToTrash('mkt-proof', p.title || 'Proof', p);
      setMktProofs((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktProofs/${id}`).catch(() => {});
      showToast('Proof spostata nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Strategico — Progetti marketing (contenitore, §22-sex)
  // ----------------------------------------------------
  const handleSaveMktProject = (p: MktProject) => {
    const enriched: MktProject = { ...p, updatedAt: Date.now(), createdAt: p.createdAt || Date.now() };
    setMktProjects((prev) => ({ ...prev, [p.id]: enriched }));
    writeNode(`mktProjects/${p.id}`, enriched).catch(() => showToast('Errore progetto marketing (controlla regole).', 'err'));
  };
  const handleDeleteMktProject = (id: string) => {
    const p = mktProjects[id];
    askDelete('Eliminare questo progetto marketing?', p ? `"${p.name}" — le voci collegate restano (diventano "Non assegnate")` : null, () => {
      if (p) moveToTrash('mkt-progetto', p.name || 'Progetto', p);
      setMktProjects((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktProjects/${id}`).catch(() => {});
      showToast('Progetto marketing spostato nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Strategico — Acquisizione/Dati/Compliance (Blocchi D–K)
  // ----------------------------------------------------
  const handleSaveMktLead = (l: MktLead) => {
    const enriched: MktLead = { ...l, updatedAt: Date.now(), createdAt: l.createdAt || Date.now() };
    setMktLeads((prev) => ({ ...prev, [l.id]: enriched }));
    writeNode(`mktLeads/${l.id}`, enriched).catch(() => showToast('Errore lead (controlla regole).', 'err'));
  };
  const handleDeleteMktLead = (id: string) => {
    const l = mktLeads[id];
    askDelete('Eliminare questo lead?', l ? `"${l.name}"` : null, () => {
      if (l) moveToTrash('mkt-lead', l.name || 'Lead', l);
      setMktLeads((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktLeads/${id}`).catch(() => {});
      showToast('Lead spostato nel Cestino.', 'err');
    });
  };
  const handleSaveMktFlow = (f: MktFlow) => {
    const enriched: MktFlow = { ...f, updatedAt: Date.now(), createdAt: f.createdAt || Date.now() };
    setMktFlows((prev) => ({ ...prev, [f.id]: enriched }));
    writeNode(`mktFlows/${f.id}`, enriched).catch(() => showToast('Errore automation (controlla regole).', 'err'));
  };
  const handleDeleteMktFlow = (id: string) => {
    const f = mktFlows[id];
    askDelete('Eliminare questo flusso?', f ? `"${f.name}"` : null, () => {
      if (f) moveToTrash('mkt-flow', f.name || 'Flusso', f);
      setMktFlows((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktFlows/${id}`).catch(() => {});
      showToast('Flusso spostato nel Cestino.', 'err');
    });
  };
  const handleSaveMktSeo = (s: MktSeoItem) => {
    const enriched: MktSeoItem = { ...s, updatedAt: Date.now(), createdAt: s.createdAt || Date.now() };
    setMktSeo((prev) => ({ ...prev, [s.id]: enriched }));
    writeNode(`mktSeo/${s.id}`, enriched).catch(() => showToast('Errore SEO (controlla regole).', 'err'));
  };
  const handleDeleteMktSeo = (id: string) => {
    const s = mktSeo[id];
    askDelete('Eliminare questa voce SEO?', s ? `"${s.keyword || s.title || ''}"` : null, () => {
      if (s) moveToTrash('mkt-seo', s.keyword || s.title || 'SEO', s);
      setMktSeo((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktSeo/${id}`).catch(() => {});
      showToast('Voce SEO spostata nel Cestino.', 'err');
    });
  };
  const handleSaveMktAd = (a: MktAdCampaign) => {
    const enriched: MktAdCampaign = { ...a, updatedAt: Date.now(), createdAt: a.createdAt || Date.now() };
    setMktAds((prev) => ({ ...prev, [a.id]: enriched }));
    writeNode(`mktAds/${a.id}`, enriched).catch(() => showToast('Errore advertising (controlla regole).', 'err'));
  };
  const handleDeleteMktAd = (id: string) => {
    const a = mktAds[id];
    askDelete('Eliminare questa campagna ads?', a ? `"${a.name}"` : null, () => {
      if (a) moveToTrash('mkt-ad', a.name || 'Ads', a, undefined, eur(Number(a.spend || a.budget) || 0));
      setMktAds((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktAds/${id}`).catch(() => {});
      showToast('Campagna ads spostata nel Cestino.', 'err');
    });
  };
  // Spesa ads → fattura passiva in Finanza (sector:'strategico')
  const handleRegisterAdsSpend = (id: string) => {
    const a = mktAds[id];
    if (!a) return;
    const amount = Number(a.spend) || Number(a.budget) || 0;
    if (amount <= 0) { showToast('Imposta budget/spesa sulla campagna ads.', 'err'); return; }
    const invId = `inp-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const inv: InvoicePassive = {
      id: invId, supplierName: `${a.platform.toUpperCase()} Ads`, projectId: '', projectName: '', amount,
      category: 'Marketing / Advertising', status: 'ricevuta', date: todayISO(), dueDate: todayISO(),
      sector: 'strategico', description: `Spesa ads ${a.name} (${a.platform})`,
    };
    handleSaveFinanceItem('finInvoicesPassive', inv);
    handleSaveMktAd({ ...a, financeRefs: [...(a.financeRefs || []), invId] });
    showToast(`Spesa ads "${a.name}" registrata in Finanze.`, 'ok');
  };
  const handleSaveMktMetric = (m: MktMetric) => {
    const enriched: MktMetric = { ...m, updatedAt: Date.now(), createdAt: m.createdAt || Date.now() };
    setMktMetrics((prev) => ({ ...prev, [m.id]: enriched }));
    writeNode(`mktMetrics/${m.id}`, enriched).catch(() => showToast('Errore metriche (controlla regole).', 'err'));
  };
  const handleDeleteMktMetric = (id: string) => {
    const m = mktMetrics[id];
    askDelete('Eliminare questa metrica?', m ? `${m.metric} (${m.source})` : null, () => {
      if (m) moveToTrash('mkt-metric', `${m.metric} · ${m.source}`, m);
      setMktMetrics((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktMetrics/${id}`).catch(() => {});
      showToast('Metrica spostata nel Cestino.', 'err');
    });
  };
  const handleSaveMktInbox = (i: MktInboxItem) => {
    const enriched: MktInboxItem = { ...i, updatedAt: Date.now(), createdAt: i.createdAt || Date.now() };
    setMktInbox((prev) => ({ ...prev, [i.id]: enriched }));
    writeNode(`mktInbox/${i.id}`, enriched).catch(() => showToast('Errore inbox (controlla regole).', 'err'));
  };
  const handleDeleteMktInbox = (id: string) => {
    const i = mktInbox[id];
    askDelete('Eliminare questo messaggio?', i ? `${i.from}` : null, () => {
      if (i) moveToTrash('mkt-inbox', `${i.from} · ${i.channel}`, i);
      setMktInbox((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktInbox/${id}`).catch(() => {});
      showToast('Messaggio spostato nel Cestino.', 'err');
    });
  };
  const handleSaveMktConsent = (c: MktConsent) => {
    const enriched: MktConsent = { ...c, updatedAt: Date.now(), createdAt: c.createdAt || Date.now() };
    setMktConsents((prev) => ({ ...prev, [c.id]: enriched }));
    writeNode(`mktConsents/${c.id}`, enriched).catch(() => showToast('Errore consensi (controlla regole).', 'err'));
  };
  const handleDeleteMktConsent = (id: string) => {
    const c = mktConsents[id];
    askDelete('Eliminare questo consenso?', c ? `"${c.subject}"` : null, () => {
      if (c) moveToTrash('mkt-consent', c.subject || 'Consenso', c);
      setMktConsents((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`mktConsents/${id}`).catch(() => {});
      showToast('Consenso spostato nel Cestino.', 'err');
    });
  };

  // ---- Marketing lato portale (cliente/partner) ----
  const handleRsvpEvent = (eventId: string, status: RsvpStatus) => {
    if (!currentUser) return;
    writeNode(`mktEvents/${eventId}/invitees/${currentUser.uid}/status`, status).catch(() => {});
    writeNode(`mktEvents/${eventId}/invitees/${currentUser.uid}/respondedAt`, Date.now()).catch(() => {});
    const ev = mktEvents[eventId];
    notifyStudio({ type: 'evento', title: `RSVP: ${currentUser.name}`, body: `${status} · ${ev?.title || 'evento'}`, link: '#progetti' }, currentUser.uid);
  };
  const handleSubmitSurveyResponse = (surveyId: string, answers: Record<string, string | number>) => {
    if (!currentUser) return;
    const resp: SurveyResponse = { surveyId, uid: currentUser.uid, name: currentUser.name || null, answers, at: Date.now() };
    writeNode(`mktSurveyResponses/${surveyId}/${currentUser.uid}`, resp).catch(() => {});
    const s = mktSurveys[surveyId];
    notifyStudio({ type: 'sondaggio', title: 'Nuova risposta sondaggio', body: s?.title || '', link: '#progetti' }, currentUser.uid);
  };
  const handleConvertLead = (lead: Lead) => {
    const pid = `p-${Date.now()}`;
    const div = (lead.sector || 'studio') as any;
    const newProject: any = {
      id: pid,
      name: lead.company || lead.name,
      code: `${div.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      client: lead.name,
      committente: lead.name,
      status: 'attivo',
      division: div,
      phases: {},
      createdAt: Date.now()
    };
    setProjects((prev) => {
      const next = { ...prev, [pid]: newProject };
      syncState('projects', next);
      return next;
    });
    logAudit('create', 'progetti', newProject.name, 'da lead');
    showToast('Lead convertito in commessa.');
  };

  // ---- Agenda: appuntamenti / note tra utenti ----
  const handleSaveAppointment = (a: Appointment) => {
    setAppointments((prev) => ({ ...prev, [a.id]: a }));
    writeNode(`appointments/${a.id}`, a).catch(() => showToast('Errore salvataggio appuntamento.', 'err'));
  };
  const handleConfirmAppointment = (id: string) => {
    const a = appointments[id];
    if (!a) return;
    const me = currentUser!.uid;
    if (a.participants && a.participants[me]) {
      // Conferma del singolo partecipante: l'appuntamento diventa 'confermato' solo quando tutti hanno confermato.
      const participants = { ...a.participants, [me]: 'confermato' as const };
      const allConfirmed = Object.values(participants).every((s) => s === 'confermato');
      const next: Appointment = { ...a, participants, status: allConfirmed ? 'confermato' : 'pending' };
      setAppointments((prev) => ({ ...prev, [a.id]: next }));
      // scrittura granulare del proprio stato (consentita dalle regole anche ai partecipanti non-attivi),
      // poi aggiornamento dello stato complessivo (riesce per i membri studio; per i portali resta al DL)
      writeNode(`appointments/${a.id}/participants/${me}`, 'confermato').catch(() => showToast('Errore salvataggio conferma.', 'err'));
      updateNode(`appointments/${a.id}`, { status: next.status }).catch(() => {});
      if (allConfirmed) {
        Object.keys(participants).filter((u) => u !== me).forEach((uid) =>
          pushNotification(uid, { type: 'appuntamento', title: 'Appuntamento confermato', body: `"${a.title}" del ${a.date} è stato confermato da tutti i partecipanti.`, link: '#calendario' })
        );
      } else if (a.createdBy && a.createdBy !== me) {
        pushNotification(a.createdBy, { type: 'appuntamento', title: 'Conferma partecipazione', body: `${currentUser!.name} ha confermato "${a.title}" del ${a.date}.`, link: '#calendario' });
      }
      showToast(allConfirmed ? 'Appuntamento confermato da tutti.' : 'Partecipazione confermata.');
      return;
    }
    // Legacy: richieste dal portale senza partecipanti
    handleSaveAppointment({ ...a, status: 'confermato' });
    if (a.createdBy && a.createdBy !== me) {
      pushNotification(a.createdBy, { type: 'appuntamento', title: 'Appuntamento confermato', body: `"${a.title}" del ${a.date}${a.time ? ' alle ' + a.time : ''} è stato confermato.`, link: '#calendario' });
    }
    showToast('Appuntamento confermato.');
  };
  const handleDeclineAppointment = (id: string) => {
    const a = appointments[id];
    if (!a) return;
    const me = currentUser!.uid;
    if (a.participants && a.participants[me]) {
      const participants = { ...a.participants, [me]: 'rifiutato' as const };
      setAppointments((prev) => ({ ...prev, [a.id]: { ...a, participants, status: 'pending' } }));
      writeNode(`appointments/${a.id}/participants/${me}`, 'rifiutato').catch(() => showToast('Errore salvataggio rifiuto.', 'err'));
      updateNode(`appointments/${a.id}`, { status: 'pending' }).catch(() => {});
      if (a.createdBy && a.createdBy !== me) {
        pushNotification(a.createdBy, { type: 'appuntamento', title: 'Partecipazione rifiutata', body: `${currentUser!.name} ha rifiutato "${a.title}" del ${a.date}.`, link: '#calendario' });
      }
      showToast('Partecipazione rifiutata.', 'err');
      return;
    }
    handleSaveAppointment({ ...a, status: 'rifiutato' });
    showToast('Appuntamento rifiutato.', 'err');
  };
  const handleDeleteAppointment = (id: string) => {
    const a = appointments[id];
    askDelete('Eliminare l\'appuntamento?', a ? `"${a.title}" · ${a.date}` : null, () => {
      if (a) {
        moveToTrash('appuntamenti', a.title || 'Appuntamento', a, undefined, a.date);
        // Annullamento: notifica a tutti i partecipanti
        Object.keys(a.participants || {})
          .filter((uid) => uid !== currentUser!.uid)
          .forEach((uid) =>
            pushNotification(uid, { type: 'appuntamento', title: 'Appuntamento annullato', body: `"${a.title}" del ${a.date}${a.time ? ' alle ' + a.time : ''} è stato annullato da ${currentUser!.name}.`, link: '#calendario' })
          );
      }
      setAppointments((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      removeNode(`appointments/${id}`).catch(() => {});
      showToast('Appuntamento spostato nel Cestino.', 'err');
    });
  };

  const handleOpenNewAppointment = (presetDate?: string) => {
    setApptDate(presetDate || todayISO());
    setApptTitle('');
    setApptTime('');
    setApptWho(currentUser ? [currentUser.uid] : []);   // il creatore è preselezionato
    setApptWhoFilter('');
    setApptNote('');
    setApptPrivate(false);
    setApptOpen(true);
  };
  const handleSubmitAppointment = () => {
    if (!apptTitle.trim() || !apptDate) {
      showToast('Inserisci titolo e data.', 'err');
      return;
    }
    const me = currentUser!.uid;
    const who = apptPrivate ? [me] : (apptWho.length ? apptWho : [me]);
    // Partecipanti: il creatore (se coinvolto) è auto-confermato, gli altri in attesa
    const participants: Record<string, 'pending' | 'confermato'> = {};
    const participantNames: Record<string, string> = {};
    who.forEach((uid) => {
      participants[uid] = uid === me ? 'confermato' : 'pending';
      participantNames[uid] = uid === me ? currentUser!.name : users[uid]?.name || '';
    });
    const allConfirmed = Object.values(participants).every((s) => s === 'confermato');
    const otherNames = who.filter((u) => u !== me).map((u) => users[u]?.name).filter(Boolean);
    const a: Appointment = {
      id: `appt-${Date.now()}`,
      title: apptTitle.trim(),
      date: apptDate,
      time: apptTime || null,
      ownerUid: me,
      ownerName: currentUser!.name,
      createdBy: me,
      createdByName: currentUser!.name,
      withName: otherNames.length ? otherNames.join(', ') : undefined,
      note: apptNote.trim() || undefined,
      kind: 'appuntamento',
      // grigio (pending) finché tutti i partecipanti non confermano → verde (confermato)
      status: allConfirmed ? 'confermato' : 'pending',
      participants,
      participantNames,
      private: apptPrivate,
      createdAt: Date.now()
    };
    handleSaveAppointment(a);
    // invito in-app agli altri partecipanti
    who.filter((uid) => uid !== me).forEach((uid) =>
      pushNotification(uid, { type: 'appuntamento', title: 'Invito appuntamento', body: `${currentUser!.name} ti ha invitato: "${a.title}" il ${a.date}${a.time ? ' alle ' + a.time : ''}. Conferma dal calendario.`, link: '#calendario' })
    );
    setApptOpen(false);
    showToast(otherNames.length ? 'Appuntamento creato. Partecipanti avvisati.' : 'Aggiunto in agenda.');
  };

  // Richiesta appuntamento dai portali cliente/partner (resta "in attesa")
  const handleRequestAppointment = (memberUid: string, memberName: string, date: string, time: string, note: string) => {
    const a: Appointment = {
      id: `appt-${Date.now()}`,
      title: `Richiesta appuntamento — ${currentUser!.name}`,
      date,
      time: time || null,
      ownerUid: memberUid,
      ownerName: memberName,
      createdBy: currentUser!.uid,
      createdByName: currentUser!.name,
      withName: currentUser!.name,
      note: note || undefined,
      kind: 'appuntamento',
      status: 'pending',
      participants: { [memberUid]: 'pending', [currentUser!.uid]: 'confermato' },
      participantNames: { [memberUid]: memberName, [currentUser!.uid]: currentUser!.name },
      createdAt: Date.now()
    };
    handleSaveAppointment(a);
    showToast('Richiesta inviata. In attesa di conferma.');
  };

  // ---- MATERICO: richieste, offerte, accettazione ----
  // Scrive la richiesta intera (write riservata allo studio dalle regole, oppure
  // al cliente alla creazione) e riconcilia l'indice inverso partnerMaterico/<uid>
  // così i partner possono ELENCARE le richieste a loro inoltrate senza leggere
  // tutta la collezione (RTDB: le regole non filtrano, vedi nodo partnerCantieri).
  const saveMatericoRequest = (req: MatericoRequest) => {
    const prev = matericoRequests[req.id];
    setMatericoRequests((p) => ({ ...p, [req.id]: req }));
    writeNode(`matericoRequests/${req.id}`, req).catch(() => showToast('Errore salvataggio richiesta.', 'err'));
    const before = new Set(forwardedUids(prev?.forwardedTo));
    const after = new Set(forwardedUids(req.forwardedTo));
    after.forEach((uid) => { if (!before.has(uid)) writeNode(`partnerMaterico/${uid}/${req.id}`, true).catch(() => {}); });
    before.forEach((uid) => { if (!after.has(uid)) removeNode(`partnerMaterico/${uid}/${req.id}`).catch(() => {}); });
  };
  const handleCreateMatericoRequest = (req: MatericoRequest) => {
    saveMatericoRequest(req);
    // Indice inverso del cliente (creatore): legge le proprie richieste per-id
    if (req.clientUid) writeNode(`clientMaterico/${req.clientUid}/${req.id}`, true).catch(() => {});
    showToast('Richiesta inviata a Materico.');
  };
  const handleUpdateMatericoRequest = (req: MatericoRequest) => {
    saveMatericoRequest({ ...req, updatedAt: Date.now() });
  };
  /**
   * Applica la penale di ritardo a una richiesta Materico: nota di credito
   * (fattura passiva NEGATIVA su Materico → riduce il costo partner) + punti
   * negativi di affidabilità al partner. Importi via finance.ts (proposta auto
   * calcolata in UI, qui la conferma).
   */
  const handleApplyMatericoPenalty = (reqId: string) => {
    const r = matericoRequests[reqId];
    if (!r) return;
    const base = matericoMargin(r).baseCost;
    const days = delayDays(r.agreedDeliveryDate, r.completedDate);
    if (days <= 0 || base <= 0) { showToast('Nessun ritardo da penalizzare.', 'err'); return; }
    const calc = matericoPenalty(base, days);
    if (calc.amount <= 0) return;
    const partnerName = (r.selectedPartnerUid && r.offers?.[r.selectedPartnerUid]?.partnerName) || 'Partner';
    const invId = financeRecord({
      sector: 'materico', kind: 'passive', amount: -calc.amount,
      description: `Penale ritardo ${days}gg · ${r.title}`,
      counterparty: partnerName, date: new Date().toISOString().slice(0, 10),
    });
    if (r.selectedPartnerUid) {
      handleAddPointEvent({
        id: `pt-pen-${reqId}`, uid: r.selectedPartnerUid, activityId: 'ritardo_grave',
        label: `Penale ritardo ${days}gg · ${r.title}`, points: -12,
        date: new Date().toISOString().slice(0, 10), note: `Penale ${eur(calc.amount)}`,
        refType: 'materico', refId: reqId, createdAt: Date.now(),
      });
    }
    const penalty: MatericoPenalty = {
      days, pctPerDay: calc.pctPerDay, capPct: calc.capPct, base, amount: calc.amount,
      capped: calc.capped, status: 'applicata', invoiceId: invId,
      appliedAt: Date.now(), appliedBy: currentUser?.uid || null,
    };
    saveMatericoRequest({ ...r, penalty, updatedAt: Date.now() });
    showToast(`Penale di ${eur(calc.amount)} applicata.`, 'ok');
  };
  const handleDeleteMatericoRequest = (id: string) => {
    const r = matericoRequests[id];
    askDelete('Eliminare la richiesta Materico?', r ? `"${r.title}" di ${r.clientName}` : null, () => {
      if (r) moveToTrash('materico', r.title || 'Richiesta', r, undefined, r.clientName);
      setMatericoRequests((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      removeNode(`matericoRequests/${id}`).catch(() => {});
      // Pulisci gli indici inversi (cliente + partner)
      if (r?.clientUid) removeNode(`clientMaterico/${r.clientUid}/${id}`).catch(() => {});
      forwardedUids(r?.forwardedTo).forEach((uid) => removeNode(`partnerMaterico/${uid}/${id}`).catch(() => {}));
      showToast('Richiesta spostata nel Cestino.', 'err');
    });
  };
  // Offerta partner: scritture GRANULARI (le regole consentono al partner solo la
  // propria offerta e lo stato, non l'intero oggetto).
  const handleSubmitMatericoOffer = (reqId: string, amount: number, note: string) => {
    const r = matericoRequests[reqId];
    if (!r) return;
    const offer = {
      partnerUid: currentUser!.uid,
      partnerName: currentUser!.name,
      amount,
      note: note || undefined,
      at: Date.now()
    };
    setMatericoRequests((p) => ({ ...p, [reqId]: { ...r, offers: { ...(r.offers || {}), [currentUser!.uid]: offer }, status: 'offerte' } }));
    writeNode(`matericoRequests/${reqId}/offers/${currentUser!.uid}`, offer).catch(() => showToast('Errore invio offerta.', 'err'));
    writeNode(`matericoRequests/${reqId}/status`, 'offerte').catch(() => {});
    showToast('Offerta inviata a Materico.');
  };
  // Accetta/rifiuta cliente: scrittura GRANULARE del solo stato.
  const handleAcceptMatericoOffer = (reqId: string, accept: boolean) => {
    const r = matericoRequests[reqId];
    if (!r) return;
    const status = accept ? 'accettata' : 'rifiutata';
    setMatericoRequests((p) => ({ ...p, [reqId]: { ...r, status } }));
    writeNode(`matericoRequests/${reqId}/status`, status).catch(() => showToast('Errore aggiornamento richiesta.', 'err'));
    showToast(accept ? 'Offerta accettata. Lavoro avviato.' : 'Offerta rifiutata.', accept ? 'ok' : 'err');
  };

  // ---- RICHIESTE CLIENTI ("La tua idea": Studio/Strategico/Unico) ----
  const saveClientRequest = (req: ClientRequest) => {
    setClientRequests((prev) => ({ ...prev, [req.id]: req }));
    writeNode(`clientRequests/${req.clientUid}/${req.id}`, req).catch(() => showToast('Errore salvataggio richiesta.', 'err'));
  };
  const handleCreateClientRequest = (req: ClientRequest) => {
    saveClientRequest(req);
    showToast('Richiesta inviata allo studio.');
  };
  const handleTakeChargeClientRequest = (req: ClientRequest) => {
    saveClientRequest({ ...req, status: 'presa_in_carico', handledBy: currentUser!.uid, handledByName: currentUser!.name, updatedAt: Date.now() });
    showToast('Richiesta presa in carico.');
  };
  const handleCloseClientRequest = (req: ClientRequest) => {
    saveClientRequest({ ...req, status: 'chiusa', updatedAt: Date.now() });
    showToast('Richiesta chiusa.');
  };
  const handleConvertClientRequest = (req: ClientRequest) => {
    const pid = `p-${Date.now()}`;
    const proj: Project = {
      id: pid,
      name: req.title,
      status: 'attivo',
      division: req.division,
      clientUid: req.clientUid || null,
      client: req.clientName || null,
      location: req.location || null,
      icon: 'folder',
      phases: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects((prev) => {
      const next = autoUpdateProjectsCompletion({ ...prev, [pid]: proj });
      syncState('projects', next);
      return next;
    });
    // La descrizione dell'idea diventa nota interna del progetto
    if (req.description) {
      setProjectsInternal((prev) => {
        const next = { ...prev, [pid]: { ...prev[pid], notes: req.description } };
        syncState('projectsInternal', next);
        return next;
      });
    }
    // Collega il cliente al progetto (projectIds)
    if (req.clientUid) {
      setUsers((prev) => {
        const u = prev[req.clientUid!];
        if (!u) return prev;
        const nextUsers = { ...prev, [req.clientUid!]: { ...u, projectIds: { ...(u.projectIds || {}), [pid]: true } } };
        syncState('users', nextUsers);
        return nextUsers;
      });
    }
    // Porta la moodboard 3D dell'idea sul progetto
    if ((req.moodboard || []).length) handleSaveMoodboard3d(pid, req.moodboard as any[]);
    // Aggiorna la richiesta come convertita
    saveClientRequest({ ...req, status: 'convertita', projectId: pid, handledBy: currentUser!.uid, handledByName: currentUser!.name, updatedAt: Date.now() });
    // Avvisa il cliente
    if (req.clientUid) {
      pushNotification(req.clientUid, { type: 'progetto', title: 'La tua richiesta è stata attivata', body: `"${req.title}" è ora un progetto: seguilo dal tuo portale.`, link: `#progetto/${pid}` });
    }
    logAudit('create', 'progetti', proj.name, 'da richiesta cliente');
    showToast('Progetto creato dalla richiesta.');
    window.location.hash = `#progetto/${pid}`;
  };
  const handleDeleteClientRequest = (req: ClientRequest) => {
    askDelete('Eliminare la richiesta?', `"${req.title}" di ${req.clientName}`, () => {
      moveToTrash('richiesta_cliente', req.title || 'Richiesta', req, undefined, req.clientName);
      setClientRequests((prev) => { const n = { ...prev }; delete n[req.id]; return n; });
      removeNode(`clientRequests/${req.clientUid}/${req.id}`).catch(() => {});
      showToast('Richiesta spostata nel Cestino.', 'err');
    });
  };

  const seededRef = useRef(false);
  const matericoBackfilledRef = useRef(false);
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    const studio = isStudioRole(role);
    // RBAC: finanza = almeno "view" sul modulo finance di una società.
    // Per gli utenti legacy (senza `access`) equivale ad admin|manager.
    const canFinance = canAnywhere(currentUser, 'view', 'finance');
    const subs: Array<() => void> = [];
    const add = (path: string, fn: (v: any) => void) =>
      subs.push(watchNode(path, (v) => fn(v || {}), () => {}));

    // Notifiche persistenti del proprio account (tutti i ruoli)
    subs.push(watchNode(`notifications/${currentUser.uid}`, (v) => {
      const arr = (v ? Object.values(v) : []) as Notification[];
      setNotifications(arr.sort((a, b) => b.at - a.at));
    }, () => {}));

    if (studio) {
      // Seed iniziale dei template (solo admin, solo se vuoti)
      if (role === 'admin' && !seededRef.current) {
        seededRef.current = true;
        getNode('templates')
          .then((t) => {
            if (!t || Object.keys(t).length === 0) writeNode('templates', SEED_TEMPLATES).catch(() => {});
          })
          .catch(() => {});
        // Pulizia: rimuove eventuali account di test rimasti nel Database
        getNode('users')
          .then((all) => {
            Object.entries(all || {}).forEach(([uid, u]: any) => {
              if (u && (u.isTest === true || String(uid).startsWith('test-'))) {
                removeAccount(uid).catch(() => {});
              }
            });
          })
          .catch(() => {});
      }
      add('projects', (v) => setProjects(autoUpdateProjectsCompletion(v)));
      add('tasks', setTasks);
      add('templates', setTemplates);
      add('projectsInternal', setProjectsInternal);
      add('projectMessages', setProjectMessages);
      add('documents', setDocuments);
      add('projectFurnishings', setFurnishings);
      add('projectMoodboard3d', setMoodboard3d);
      add('estimates', setEstimates);
      // CRM (array nodes)
      const toArr = (v: any) => (Array.isArray(v) ? v : v ? Object.values(v) : []);
      if (canFinance) {
        add('studioFinance', setFinances);
        // Nodi finanza strutturati: stessa fonte di FinanzeView, serve alla contabilità di commessa
        // items normalizzato ad array (Firebase non salva gli array vuoti)
        subs.push(watchNode('finComputi', (v) => setFinComputi(toArr(v).map((c: any) => ({ ...c, items: Array.isArray(c.items) ? c.items : c.items ? Object.values(c.items) : [] }))), () => {}));
        subs.push(watchNode('finInvoicesActive', (v) => setFinInvoicesActive(toArr(v)), () => {}));
        subs.push(watchNode('finInvoicesPassive', (v) => setFinInvoicesPassive(toArr(v)), () => {}));
        subs.push(watchNode('finScadenze', (v) => setFinScadenze(toArr(v)), () => {}));
        add('quotes', setQuotes);
      }
      subs.push(watchNode('crmLeads', (v) => setCrmLeads(toArr(v)), () => {}));
      subs.push(watchNode('crmSuppliers', (v) => setCrmSuppliers(toArr(v)), () => {}));
      subs.push(watchNode('priceList', (v) => setPriceList(toArr(v)), () => {}));
      add('governanceOrg', setGovernanceOrg);
      add('governanceSop', setGovernanceSop);
      add('governanceMansionari', setGovernanceMansionari);
      add('governanceVault', setGovernanceVault);
      subs.push(watchNode('governanceVaultConfig', (v) => setVaultConfig(v || {}), () => {}));
      subs.push(watchNode('newsletter', (v) => setNewsletterSubs(v || {}), () => {}));
      add('hrEvents', setHrEvents);
      add('matericoDeals', setMatericoDeals);
      add('matericoListino', setMatericoListino);
      add('matericoContracts', setMatericoContracts);
      add('pianoFinanziario', setPianoFinanziario);
      add('fatturazionePlan', setFatturazionePlan);
      if (role === 'admin' || role === 'manager') add('auditLog', setAuditLog);
      subs.push(watchNode('unicoDeals', (v) => {
        const arr = toArr(v) as UnicoDeal[];
        setUnicoDeals(arr);
        // Allinea il set di uid con posizione, così il cleanup write-through resta corretto
        // anche tra sessioni diverse (investitore scollegato in una sessione successiva).
        const uids = new Set<string>();
        arr.forEach((d) => (d.investors || []).forEach((i) => { if (i.investorUid) uids.add(i.investorUid); }));
        prevInvestorUidsRef.current = uids;
      }, () => {}));
      subs.push(watchNode('unicoShowcase', (v) => setUnicoShowcase(v || {}), () => {}));
      subs.push(watchNode('internalOrders', (v) => setInternalOrders(toArr(v) as InternalOrder[]), () => {}));
      // Point system: lo studio legge tutti gli eventi (pointEvents/<uid>/<id>)
      subs.push(watchNode('pointEvents', (v) => {
        const flat: PointEvent[] = [];
        Object.values(v || {}).forEach((byUid: any) => Object.values(byUid || {}).forEach((e: any) => flat.push(e)));
        setPointEvents(flat);
      }, () => {}));
      // Modulo Strategico / Marketing (studio)
      subs.push(watchNode('mktEvents', (v) => setMktEvents(v || {}), () => {}));
      subs.push(watchNode('mktCampaigns', (v) => setMktCampaigns(v || {}), () => {}));
      subs.push(watchNode('mktSurveys', (v) => setMktSurveys(v || {}), () => {}));
      subs.push(watchNode('mktSocial', (v) => setMktSocial(v || {}), () => {}));
      subs.push(watchNode('mktSurveyResponses', (v) => setMktResponses(v || {}), () => {}));
      subs.push(watchNode('mktContracts', (v) => setMktContracts(v || {}), () => {}));
      subs.push(watchNode('mktTimeEntries', (v) => setMktTime(v || {}), () => {}));
      subs.push(watchNode('mktAssets', (v) => setMktAssets(v || {}), () => {}));
      subs.push(watchNode('mktDeliverables', (v) => setMktDeliverables(v || {}), () => {}));
      subs.push(watchNode('mktProofs', (v) => setMktProofs(v || {}), () => {}));
      subs.push(watchNode('mktLeads', (v) => setMktLeads(v || {}), () => {}));
      subs.push(watchNode('mktFlows', (v) => setMktFlows(v || {}), () => {}));
      subs.push(watchNode('mktSeo', (v) => setMktSeo(v || {}), () => {}));
      subs.push(watchNode('mktAds', (v) => setMktAds(v || {}), () => {}));
      subs.push(watchNode('mktMetrics', (v) => setMktMetrics(v || {}), () => {}));
      subs.push(watchNode('mktInbox', (v) => setMktInbox(v || {}), () => {}));
      subs.push(watchNode('mktConsents', (v) => setMktConsents(v || {}), () => {}));
      subs.push(watchNode('mktProjects', (v) => setMktProjects(v || {}), () => {}));
      subs.push(watchNode('appointments', (v) => setAppointments(v || {}), () => {}));
      subs.push(watchNode('directory', (v) => setDirectory(v || {}), () => {}));
      subs.push(watchNode('matericoRequests', (v) => {
        const all = (v || {}) as Record<string, MatericoRequest>;
        setMatericoRequests(all);
        // Backfill una-tantum (admin/manager: hanno write sugli indici): migra le
        // richieste legacy → forwardedTo array→mappa + popola gli indici inversi
        // clientMaterico/partnerMaterico così cliente/partner tornano a vederle.
        if (canFinance && !matericoBackfilledRef.current) {
          matericoBackfilledRef.current = true;
          Object.values(all).forEach((r) => {
            if (!r || !r.id) return;
            if (Array.isArray(r.forwardedTo)) {
              const map = Object.fromEntries(forwardedUids(r.forwardedTo).map((u) => [u, true]));
              writeNode(`matericoRequests/${r.id}/forwardedTo`, map).catch(() => {});
            }
            if (r.clientUid) writeNode(`clientMaterico/${r.clientUid}/${r.id}`, true).catch(() => {});
            forwardedUids(r.forwardedTo).forEach((u) => writeNode(`partnerMaterico/${u}/${r.id}`, true).catch(() => {}));
          });
        }
      }, () => {}));
      // Richieste clienti (nodo annidato per uid → appiattito per id)
      subs.push(watchNode('clientRequests', (v) => {
        const flat: Record<string, ClientRequest> = {};
        Object.values(v || {}).forEach((byUid: any) =>
          Object.entries(byUid || {}).forEach(([id, req]: any) => { flat[id] = req; })
        );
        setClientRequests(flat);
      }, () => {}));
      // Cantiere (studio vede tutto)
      add('cantieri', setCantieri);
      add('cantiereRapportini', setCantRapportini);
      add('cantierePresenze', setCantPresenze);
      add('cantiereFoto', setCantFoto);
      add('cantiereMateriali', setCantMateriali);
      add('cantiereChecklist', setCantChecklist);
      add('cantiereDocumenti', setCantDocumenti);
      add('cantiereSal', setCantSal);
      add('cantiereLog', setCantLog);
      add('cantiereRecords', setCantRecords);
      add('cantiereMessages', setCantMessages);
      // Area Impresa: profili di tutte le imprese partner (riusabili sui cantieri)
      add('impresaDocs', setImpresaDocs);
      add('impresaRecords', setImpresaRecords);
      // Rubrica clienti
      add('clients', setClients);
      // Ferie/assenze team
      add('teamLeave', setTeamLeave);
      // Cestino condiviso (elementi eliminati, 60 giorni)
      add('trash', setTrash);
    } else {
      // Cliente/Partner: solo i propri progetti (regole via clientUid)
      const watchedSurveyResp = new Set<string>(); // sondaggi di cui seguo già la mia risposta
      subs.push(watchNode('directory', (v) => setDirectory(v || {}), () => {}));
      // Materico: niente lettura dell'intera collezione (le regole RTDB non filtrano).
      // Cliente/partner si sottoscrivono ai SINGOLI matericoRequests/<id> elencati dal
      // proprio indice inverso (clientMaterico / partnerMaterico) — come i cantieri partner.
      {
        const watchedReq = new Set<string>();
        const watchReq = (rid: string) => {
          if (watchedReq.has(rid)) return;
          watchedReq.add(rid);
          subs.push(watchNode(`matericoRequests/${rid}`, (rv) => {
            setMatericoRequests((m) => {
              const n = { ...m };
              if (rv) n[rid] = rv; else delete n[rid];
              return n;
            });
          }, () => {}));
        };
        const matIndex = currentUser.role === 'partner' ? 'partnerMaterico' : 'clientMaterico';
        subs.push(watchNode(`${matIndex}/${currentUser.uid}`, (v) => {
          Object.keys(v || {}).forEach(watchReq);
        }, () => {}));
      }
      // Le proprie richieste (clientRequests/<uid>/<id> → keyed per id)
      subs.push(watchNode(`clientRequests/${currentUser.uid}`, (v) => setClientRequests(v || {}), () => {}));
      // Vetrina Unico pubblicata (snapshot pubblici, leggibili da ogni autenticato)
      subs.push(watchNode('unicoShowcase', (v) => setUnicoShowcase(v || {}), () => {}));
      // Le mie posizioni da investitore (sola lettura, scritte dallo studio)
      subs.push(watchNode(`unicoInvestorPositions/${currentUser.uid}`, (v) => setUnicoPositions(v || {}), () => {}));
      // Marketing lato portale: sondaggi (leggibili da ogni autenticato) + le mie risposte
      subs.push(watchNode('mktSurveys', (v) => {
        const all = (v || {}) as Record<string, Survey>;
        setMktSurveys(all);
        // Per ogni sondaggio attivo, sottoscrivi la MIA risposta (rule: solo auth.uid==$uid)
        Object.keys(all).forEach((sid) => {
          if (watchedSurveyResp.has(sid)) return;
          watchedSurveyResp.add(sid);
          subs.push(watchNode(`mktSurveyResponses/${sid}/${currentUser.uid}`, (rv) => {
            setMktResponses((m) => {
              const n = { ...m };
              const branch = { ...(n[sid] || {}) };
              if (rv) branch[currentUser.uid] = rv as SurveyResponse; else delete branch[currentUser.uid];
              n[sid] = branch;
              return n;
            });
          }, () => {}));
        });
      }, () => {}));
      // Inviti eventi: indice inverso → sottoscrive i singoli mktEvents/<id>
      {
        const watchedEv = new Set<string>();
        subs.push(watchNode(`mktInvitesIndex/${currentUser.uid}`, (v) => {
          Object.keys(v || {}).forEach((eid) => {
            if (watchedEv.has(eid)) return;
            watchedEv.add(eid);
            subs.push(watchNode(`mktEvents/${eid}`, (ev) => {
              setMktEvents((m) => {
                const n = { ...m };
                if (ev) n[eid] = ev; else delete n[eid];
                return n;
              });
            }, () => {}));
          });
        }, () => {}));
      }
      const pids = Object.keys(currentUser.projectIds || {});
      pids.forEach((pid) => {
        subs.push(watchNode(`projects/${pid}`, (v) => {
          if (v) setProjects((p) => ({ ...p, [pid]: v }));
        }, () => {}));
        subs.push(watchNode(`documents/${pid}`, (v) => {
          setDocuments((d) => ({ ...d, [pid]: v || {} }));
        }, () => {}));
        subs.push(watchNode(`projectMessages/${pid}`, (v) => {
          setProjectMessages((m) => ({ ...m, [pid]: v || {} }));
        }, () => {}));
        subs.push(watchNode(`projectFurnishings/${pid}`, (v) => {
          setFurnishings((f) => ({ ...f, [pid]: v || {} }));
        }, () => {}));
        subs.push(watchNode(`projectMoodboard3d/${pid}`, (v) => {
          setMoodboard3d((m) => ({ ...m, [pid]: v || {} }));
        }, () => {}));
      });
      // Point system: il portale legge i propri eventi punti (pointEvents/<uid>)
      subs.push(watchNode(`pointEvents/${currentUser.uid}`, (v) => setPointEvents(Object.values(v || {}) as PointEvent[]), () => {}));
      // Partner: elenca i cantieri assegnati via indice inverso, poi sottoscrive per-cid.
      if (currentUser.role === 'partner') {
        const watched = new Set<string>();
        // Area Impresa propria (riusabile su tutti i cantieri)
        subs.push(watchNode(`impresaDocs/${currentUser.uid}`, (v) => setImpresaDocs((m) => ({ ...m, [currentUser.uid]: v || {} })), () => {}));
        subs.push(watchNode(`impresaRecords/${currentUser.uid}`, (v) => setImpresaRecords((m) => ({ ...m, [currentUser.uid]: v || {} })), () => {}));
        subs.push(watchNode(`partnerCantieri/${currentUser.uid}`, (v) => {
          Object.keys(v || {}).forEach((cid) => {
            if (watched.has(cid)) return;
            watched.add(cid);
            subs.push(watchNode(`cantieri/${cid}`, (cv) => {
              setCantieri((m) => { const n = { ...m }; if (cv) n[cid] = cv; else delete n[cid]; return n; });
            }, () => {}));
            subs.push(watchNode(`cantiereRapportini/${cid}`, (cv) => setCantRapportini((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantierePresenze/${cid}`, (cv) => setCantPresenze((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereFoto/${cid}`, (cv) => setCantFoto((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereMateriali/${cid}`, (cv) => setCantMateriali((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereChecklist/${cid}`, (cv) => setCantChecklist((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereDocumenti/${cid}`, (cv) => setCantDocumenti((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereSal/${cid}`, (cv) => setCantSal((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereRecords/${cid}`, (cv) => setCantRecords((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereMessages/${cid}`, (cv) => setCantMessages((m) => ({ ...m, [cid]: cv || {} })), () => {}));
            subs.push(watchNode(`cantiereLog/${cid}`, (cv) => setCantLog((m) => ({ ...m, [cid]: cv || {} })), () => {}));
          });
        }, () => {}));
      }
    }

    return () => subs.forEach((u) => u());
  }, [currentUser?.uid, currentUser?.role]);

  // ----------------------------------------------------
  // REMINDER IN-APP "SOFT" (fallback senza Cloud Functions / piano Blaze)
  // ----------------------------------------------------
  // Quando un membro dello studio apre l'app, genera notifiche in-app una-tantum per
  // ferie/assenze in arrivo (≤7gg) e scadenze finanziarie aperte (≤3gg). Niente email
  // né cron: copre il caso d'uso quotidiano a costo zero, in attesa di dailyReminders
  // (functions/, vedi §18). Id deterministico per voce + check di esistenza (getNode)
  // → nessun doppione e nessun reset dello stato "letto".
  const softRemRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUser || !isStudioRole(currentUser.role)) return;
    const me = currentUser.uid;
    const isAdminMgr = currentUser.role === 'admin' || currentUser.role === 'manager';
    const today = todayISO();
    const in7 = isoDate(addDays(new Date(), 7));
    const in3 = isoDate(addDays(new Date(), 3));
    const push = (id: string, payload: { type: string; title: string; body?: string | null; link?: string | null }) => {
      if (softRemRef.current.has(id)) return;
      softRemRef.current.add(id);
      getNode(`notifications/${me}/${id}`)
        .then((existing) => {
          if (existing) return; // già presente (anche se letta) → non sovrascrivere
          const ntf: Notification = {
            id, type: payload.type, title: payload.title, body: payload.body || null, link: payload.link || null,
            read: false, at: Date.now(), by: 'system', byName: 'Promemoria'
          };
          writeNode(`notifications/${me}/${id}`, ntf).catch(() => {});
        })
        .catch(() => {});
    };
    // Ferie/assenze dei colleghi in arrivo entro 7 giorni (escluse le proprie)
    Object.values(teamLeave).forEach((l) => {
      if (!l?.dateFrom || l.uid === me) return;
      if (l.dateFrom > today && l.dateFrom <= in7) {
        push(`rem-leave-${l.id}`, { type: 'ferie', title: `Assenza in arrivo: ${l.name}`, body: `${l.type} dal ${fmtDay(l.dateFrom)}${l.dateTo ? ' al ' + fmtDay(l.dateTo) : ''}`, link: '#calendario' });
      }
    });
    // Scadenze finanziarie aperte entro 3 giorni (solo admin/manager)
    if (isAdminMgr) {
      finScadenze.forEach((s) => {
        if (!s?.dueDate || s.status === 'pagato') return;
        if (s.dueDate >= today && s.dueDate <= in3) {
          push(`rem-scad-${s.id}`, { type: 'scadenza', title: `Scadenza in arrivo: ${s.desc || 'Scadenza'}`, body: `${eur(s.amount || 0)} · ${fmtDay(s.dueDate)}`, link: '#finanze' });
        }
      });
    }
  }, [currentUser?.uid, currentUser?.role, teamLeave, finScadenze]);

  // ----------------------------------------------------
  // CESTINO (nodo trash) + DOPPIA CONFERMA ELIMINAZIONE
  // ----------------------------------------------------
  // Purge automatico: gli elementi più vecchi di 60 giorni vengono eliminati definitivamente.
  const purgedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUser || !isStudioRole(currentUser.role)) return;
    const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86400000;
    Object.values(trash).forEach((t) => {
      if (t.deletedAt < cutoff && !purgedRef.current.has(t.id)) {
        purgedRef.current.add(t.id);
        removeNode(`trash/${t.id}`).catch(() => {});
      }
    });
  }, [trash, currentUser?.uid]);

  /** Sposta un elemento eliminato nel Cestino (solo ruoli studio: i portali non hanno write su trash). */
  // Audit log (visione Aulico): trail delle azioni dello studio su auditLog/<id>.
  // Best-effort, append-only; lo leggono admin/manager (Registro attività).
  const logAudit = (action: AuditEntry['action'], section: string, label: string, detail?: string) => {
    if (!currentUser || !isStudioRole(currentUser.role)) return;
    const id = `au-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
    const entry: AuditEntry = { id, action, section, label, detail: detail || null, by: currentUser.uid, byName: currentUser.name || null, at: Date.now() };
    writeNode(`auditLog/${id}`, entry).catch(() => {});
  };
  // Solo admin: rimuove una voce dal Registro attività (le regole consentono il delete solo all'admin).
  const handleDeleteAudit = (id: string) => {
    if (currentUser?.role !== 'admin') return;
    askDelete('Eliminare la voce dal Registro attività?', 'Il registro è pensato per essere inalterabile: elimina solo se necessario.', () => {
      setAuditLog((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`auditLog/${id}`).catch(() => showToast('Errore eliminazione (controlla regole).', 'err'));
    });
  };

  const moveToTrash = (section: string, label: string, payload: any, meta?: Record<string, string>, detail?: string) => {
    if (!currentUser || !isStudioRole(currentUser.role)) return;
    const tid = `tr-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const item: TrashItem = {
      id: tid, section, label, detail: detail || null, payload, meta: meta || null,
      deletedAt: Date.now(), deletedBy: currentUser.uid, deletedByName: currentUser.name || null
    };
    setTrash((prev) => ({ ...prev, [tid]: item }));
    writeNode(`trash/${tid}`, item).catch(() => {});
    logAudit('delete', section, label, detail);
  };

  /** Doppia conferma: apre la modale condivisa; l'azione parte solo dopo la seconda conferma. */
  const askDelete = (title: string, message: string | null, onConfirm: () => void, permanent = false) =>
    setConfirmDel({ title, message, onConfirm, permanent });

  /** Ripristino dal Cestino: riscrive l'elemento nella sua collezione di origine. */
  const handleRestoreTrash = (item: TrashItem) => {
    const pl = item.payload;
    const id = pl?.id;
    logAudit('restore', item.section, item.label);
    try {
      switch (item.section) {
        case 'progetti':
          setProjects((prev) => { const n = { ...prev, [id]: pl }; syncState('projects', n); return n; });
          break;
        case 'task':
          setTasks((prev) => { const n = { ...prev, [id]: pl }; syncState('tasks', n); return n; });
          break;
        case 'preventivi':
          setQuotes((prev) => ({ ...prev, [id]: pl }));
          writeNode(`quotes/${id}`, pl).catch(() => {});
          break;
        case 'fatture_attive':
          handleSaveFinanceItem('finInvoicesActive', pl);
          break;
        case 'fatture_passive':
          handleSaveFinanceItem('finInvoicesPassive', pl);
          break;
        case 'scadenze':
          handleSaveFinanceItem('finScadenze', pl);
          break;
        case 'movimenti':
          setFinances((prev) => { const n = { ...prev, [id]: pl }; syncState('finance', n); return n; });
          break;
        case 'documenti':
          if (item.meta?.pid) {
            setDocuments((prev) => ({ ...prev, [item.meta!.pid]: { ...(prev[item.meta!.pid] || {}), [id]: pl } }));
            writeNode(`documents/${item.meta.pid}/${id}`, pl).catch(() => {});
          }
          break;
        case 'arredi':
          if (item.meta?.pid) {
            setFurnishings((prev) => ({ ...prev, [item.meta!.pid]: { ...(prev[item.meta!.pid] || {}), [id]: pl } }));
            writeNode(`projectFurnishings/${item.meta.pid}/${id}`, pl).catch(() => {});
          }
          break;
        case 'appuntamenti':
          setAppointments((prev) => ({ ...prev, [id]: pl }));
          writeNode(`appointments/${id}`, pl).catch(() => {});
          break;
        case 'materico':
          setMatericoRequests((prev) => ({ ...prev, [id]: pl }));
          writeNode(`matericoRequests/${id}`, pl).catch(() => {});
          break;
        case 'materico-deal':
          setMatericoDeals((prev) => ({ ...prev, [id]: pl }));
          writeNode(`matericoDeals/${id}`, pl).catch(() => {});
          break;
        case 'materico-contract':
          setMatericoContracts((prev) => ({ ...prev, [id]: pl }));
          writeNode(`matericoContracts/${id}`, pl).catch(() => {});
          break;
        case 'richiesta_cliente':
          setClientRequests((prev) => ({ ...prev, [id]: pl }));
          writeNode(`clientRequests/${pl.clientUid}/${id}`, pl).catch(() => {});
          break;
        case 'estimates':
          setEstimates((prev) => { const n = { ...prev, [id]: pl }; syncState('estimates', n); return n; });
          break;
        case 'rubrica':
          setClients((prev) => ({ ...prev, [id]: pl }));
          writeNode(`clients/${id}`, pl).catch(() => {});
          break;
        case 'crm_lead':
          saveLeads([...crmLeads.filter((l) => l.id !== id), pl]);
          break;
        case 'crm_supplier':
          saveSuppliers([...crmSuppliers.filter((s) => s.id !== id), pl]);
          break;
        case 'unico':
          saveUnicoDeals([...unicoDeals.filter((d) => d.id !== id), pl]);
          break;
        case 'commessa_interna': {
          const next = [...internalOrders.filter((o) => o.id !== id), pl];
          setInternalOrders(next);
          writeNode('internalOrders', next).catch(() => {});
          break;
        }
        case 'cantieri':
          setCantieri((prev) => ({ ...prev, [id]: pl }));
          writeNode(`cantieri/${id}`, pl).catch(() => {});
          Object.keys(pl?.partnerUids || {}).forEach((uid) => writeNode(`partnerCantieri/${uid}/${id}`, true).catch(() => {}));
          break;
        case 'cantiere':
          if (item.meta?.coll && item.meta?.cid) writeNode(`${item.meta.coll}/${item.meta.cid}/${id}`, pl).catch(() => {});
          break;
        case 'impresa':
          if (item.meta?.coll && item.meta?.uid) writeNode(`${item.meta.coll}/${item.meta.uid}/${id}`, pl).catch(() => {});
          break;
        case 'ferie':
          setTeamLeave((prev) => ({ ...prev, [id]: pl }));
          writeNode(`teamLeave/${id}`, pl).catch(() => {});
          break;
        case 'mkt-evento':
          setMktEvents((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktEvents/${id}`, pl).catch(() => {});
          break;
        case 'mkt-campagna':
          setMktCampaigns((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktCampaigns/${id}`, pl).catch(() => {});
          break;
        case 'mkt-sondaggio':
          setMktSurveys((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktSurveys/${id}`, pl).catch(() => {});
          break;
        case 'mkt-social':
          setMktSocial((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktSocial/${id}`, pl).catch(() => {});
          break;
        case 'mkt-contratto':
          setMktContracts((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktContracts/${id}`, pl).catch(() => {});
          break;
        case 'mkt-time':
          setMktTime((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktTimeEntries/${id}`, pl).catch(() => {});
          break;
        case 'mkt-asset':
          setMktAssets((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktAssets/${id}`, pl).catch(() => {});
          break;
        case 'mkt-deliverable':
          setMktDeliverables((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktDeliverables/${id}`, pl).catch(() => {});
          break;
        case 'mkt-proof':
          setMktProofs((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktProofs/${id}`, pl).catch(() => {});
          break;
        case 'mkt-lead':
          setMktLeads((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktLeads/${id}`, pl).catch(() => {});
          break;
        case 'mkt-flow':
          setMktFlows((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktFlows/${id}`, pl).catch(() => {});
          break;
        case 'mkt-seo':
          setMktSeo((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktSeo/${id}`, pl).catch(() => {});
          break;
        case 'mkt-ad':
          setMktAds((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktAds/${id}`, pl).catch(() => {});
          break;
        case 'mkt-metric':
          setMktMetrics((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktMetrics/${id}`, pl).catch(() => {});
          break;
        case 'mkt-inbox':
          setMktInbox((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktInbox/${id}`, pl).catch(() => {});
          break;
        case 'mkt-consent':
          setMktConsents((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktConsents/${id}`, pl).catch(() => {});
          break;
        case 'mkt-progetto':
          setMktProjects((prev) => ({ ...prev, [id]: pl }));
          writeNode(`mktProjects/${id}`, pl).catch(() => {});
          break;
        default:
          showToast('Sezione non ripristinabile automaticamente.', 'err');
          return;
      }
      setTrash((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      removeNode(`trash/${item.id}`).catch(() => {});
      showToast('Elemento ripristinato.');
    } catch {
      showToast('Errore nel ripristino.', 'err');
    }
  };

  /** Eliminazione definitiva dal Cestino (con doppia conferma). */
  const handleTrashDeleteForever = (item: TrashItem) => {
    askDelete('Eliminare definitivamente?', `"${item.label}" verrà rimosso per sempre dal Cestino.`, () => {
      setTrash((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      removeNode(`trash/${item.id}`).catch(() => {});
      showToast('Elemento eliminato definitivamente.', 'err');
    }, true);
  };

  // Riconciliazione rubrica: ogni cliente/partner registrato viene salvato in automatico
  // in `clients` (diviso per categoria). Gira lato studio (admin/manager hanno write su clients).
  // Idempotente: crea solo i record mancanti (id deterministico `cli-<uid>`).
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) return;
    const existingUids = new Set(Object.values(clients).map((c) => c.accountUid).filter(Boolean));
    Object.values(users).forEach((u: any) => {
      if (!u || (u.role !== 'cliente' && u.role !== 'partner')) return;
      const recId = `cli-${u.uid}`;
      if (existingUids.has(u.uid) || clients[recId]) return;
      const isAzienda = u.accountType === 'azienda' || u.role === 'partner';
      const rec: ClientRecord = {
        id: recId,
        category: u.role === 'partner' ? 'partner' : 'cliente',
        type: isAzienda ? 'azienda' : 'privato',
        name: (u.role === 'partner' || isAzienda) ? (u.companyName || u.name) : u.name,
        firstName: u.firstName || null,
        lastName: u.lastName || null,
        email: u.email || null,
        phone: u.telefono || null,
        whatsapp: null,
        address: u.companyAddress || u.residenza || null,
        codiceFiscale: u.codiceFiscale || null,
        companyName: u.companyName || null,
        partitaIva: u.partitaIva || null,
        pec: u.pec || null,
        sdi: u.sdi || null,
        tier: null,
        accountUid: u.uid,
        notes: null,
        createdBy: 'system',
        createdAt: u.createdAt || Date.now()
      };
      setClients((prev) => ({ ...prev, [recId]: rec }));
      writeNode(`clients/${recId}`, rec).catch(() => {});
    });
  }, [users, clients, currentUser?.uid, currentUser?.role]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  };

  // ----------------------------------------------------
  // PROFILE SWITCH CHANGER (useful to play around)
  // ----------------------------------------------------
  const handleProfileSwitch = (uid: string) => {
    if (users[uid]) {
      setCurrentUser(users[uid]);
      localStorage.setItem('onirico_logged_uid', uid);
      setRoute('dashboard');
      window.location.hash = '#dashboard';
      showToast(`Accesso cambiato su: ${users[uid].name}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('onirico_logged_uid');
    // For playability, logging out loops back to login options
    setCurrentUser(null);
    // Also sign out from Google so the auth gate is re-shown
    logoutGoogle().catch(() => {});
  };

  // ----------------------------------------------------
  // MODAL SWITCH CONTROLS
  // ----------------------------------------------------
  const [profileOpen, setProfileOpen] = useState(false);
  // Il mio profilo: campi modificabili (nome, telefono, residenza)
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profRes, setProfRes] = useState('');
  
  // Tasks Form (Agenda)
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined);

  const [tTitle, setTTitle] = useState('');
  const [tDateInput, setTDateInput] = useState('');
  const [tTimeInput, setTTimeInput] = useState('');
  const [tFreq, setTFreq] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [tPrio, setTPrio] = useState<'urgente' | 'alta' | 'media' | 'bassa'>('media');
  const [tTipo, setTTipo] = useState('');
  const [tActivityId, setTActivityId] = useState('');
  const [tPrivate, setTPrivate] = useState(false);
  const [tAssignees, setTAssignees] = useState<string[]>([]);   // multi-assegnatario
  const [tProjectId, setTProjectId] = useState('');
  const [tNotes, setTNotes] = useState('');

  // Project Form
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [pTmplPicked, setPTmplPicked] = useState('arch-completo');
  const [pName, setPName] = useState('');
  const [pCode, setPCode] = useState('');
  const [pClient, setPClient] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pClientUid, setPClientUid] = useState('');
  const [pClientRecordId, setPClientRecordId] = useState('');
  // Nuovo cliente inline in rubrica (dal form progetto)
  const [newRubricaOpen, setNewRubricaOpen] = useState(false);
  const [ncDraft, setNcDraft] = useState<Partial<ClientRecord>>({ type: 'privato' });
  const [pManager, setPManager] = useState('admin');
  const [pStart, setPStart] = useState('');
  const [pDue, setPDue] = useState('');
  const [pCommittente, setPCommittente] = useState('');
  const [pIndirizzo, setPIndirizzo] = useState('');
  // Indirizzo immobile strutturato (via, civico, CAP, comune, provincia)
  const [pVia, setPVia] = useState('');
  const [pCivico, setPCivico] = useState('');
  const [pCap, setPCap] = useState('');
  const [pComune, setPComune] = useState('');
  const [pProvincia, setPProvincia] = useState('');
  const [pFoglio, setPFoglio] = useState('');
  const [pParticella, setPParticella] = useState('');
  const [pSub, setPSub] = useState('');
  // Identificativi catastali multipli (layout allineato, righe ripetibili)
  const [pCatastali, setPCatastali] = useState<{ foglio: string; particella: string; sub: string }[]>([{ foglio: '', particella: '', sub: '' }]);
  const [pTipo, setPTipo] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pDivision, setPDivision] = useState<'studio' | 'strategico' | 'materico' | 'unico'>('studio');
  const [activeDivision, setActiveDivision] = useState<'studio' | 'strategico' | 'materico' | 'unico'>('studio');

  // Marketing custom inputs
  const [pMarketingBudget, setPMarketingBudget] = useState<number | ''>('');
  const [pMarketingChannels, setPMarketingChannels] = useState<string>('');
  const [pMarketingGoal, setPMarketingGoal] = useState<string>('');

  // Materico custom inputs
  const [pMatericoEstimatedBudget, setPMatericoEstimatedBudget] = useState<number | ''>('');
  const [pMatericoFinitureType, setPMatericoFinitureType] = useState<string>('');
  const [pMatericoSottofondiStatus, setPMatericoSottofondiStatus] = useState<string>('');

  // Studio configurator (tipo intervento → titolo abilitativo → categorie di lavorazione)
  const [pIntervento, setPIntervento] = useState<string>(DEFAULT_INTERVENTO);
  const [pTitolo, setPTitolo] = useState<string>('scia');
  const [pCategorie, setPCategorie] = useState<string[]>([]);

  // Project Editing
  const [editProjOpen, setEditProjOpen] = useState(false);
  const [editProjId, setEditProjId] = useState<string | null>(null);

  // Phase Form
  const [phaseOpen, setPhaseOpen] = useState(false);
  const [phasePrjId, setPhasePrjId] = useState<string | null>(null);
  const [phaseEditId, setPhaseEditId] = useState<string | null>(null);
  const [phaseName, setPhaseName] = useState('');

  // Project Task (Activity) Form
  const [ptaskOpen, setPtaskOpen] = useState(false);
  const [ptaskPrjId, setPtaskPrjId] = useState<string | null>(null);
  const [ptaskPhId, setPtaskPhId] = useState<string | null>(null);
  const [ptaskEditId, setPtaskEditId] = useState<string | null>(null);
  const [ptTitle, setPtTitle] = useState('');
  const [ptRole, setPtRole] = useState('');
  const [ptAssignee, setPtAssignee] = useState('');
  const [ptDue, setPtDue] = useState('');
  const [ptNote, setPtNote] = useState('');

  // Financial Form
  const [finOpen, setFinOpen] = useState(false);
  const [finCtx, setFinCtx] = useState<'studio' | string>('studio'); // 'studio' or project ID
  const [fnKind, setFnKind] = useState<'entrata' | 'uscita'>('entrata');
  const [fnDesc, setFnDesc] = useState('');
  const [fnAmount, setFnAmount] = useState('');
  const [fnDate, setFnDate] = useState('');
  const [fnCat, setFnCat] = useState('');
  const [fnProjLink, setFnProjLink] = useState('');
  const [fnNote, setFnNote] = useState('');

  // New Account / Client Form
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const [nuName, setNuName] = useState('');
  const [nuEmail, setNuEmail] = useState('');
  const [nuPhone, setNuPhone] = useState('');
  const [nuPass, setNuPass] = useState('');
  const [nuRole, setNuRole] = useState<UserRole>('staff');
  const [nuTitle, setNuTitle] = useState('');
  const [nuFns, setNuFns] = useState<string[]>([]);
  const [nuActive, setNuActive] = useState(true);
  // RBAC granulare per-società (vuoto ⇒ usa il fallback dal ruolo)
  const [nuAccess, setNuAccess] = useState<AccessMap>({});

  // Client description modal
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descTitle, setDescTitle] = useState('');
  const [descBody, setDescBody] = useState('');

  // Anagrafica Practice Forms
  const [anagOpen, setAnagOpen] = useState(false);
  const [anagProjId, setAnagProjId] = useState<string | null>(null);
  const [anagData, setAnagData] = useState<Record<string, Record<string, string>>>({});

  // Client Portal States
  const [clientActivePid, setClientActivePid] = useState<string | null>(null);
  const [clientOpenPh, setClientOpenPh] = useState<string | undefined>(undefined);
  const [isPreview, setIsPreview] = useState(false);

  // ----------------------------------------------------
  // EVENT TRIGGER HANDLERS
  // ----------------------------------------------------
  
  // 1. Task checklist operations
  /** Auto-punteggio dalla produttività: al completamento di un task assegnato,
   * genera (o rimuove) un evento punti per ogni assegnatario. Punti/valore dall'attività
   * di catalogo se indicata, altrimenti dalla priorità. Id deterministico → niente doppioni. */
  const awardTaskPoints = (t: any, date: string, add: boolean) => {
    const assignees: string[] = (t.assignees && t.assignees.length ? t.assignees : (t.assignee ? [t.assignee] : [])).filter(Boolean);
    if (!assignees.length) return;
    const act = t.activityId ? activityById(t.activityId) : undefined;
    const pts = act ? act.points : (PRIORITY_POINTS[t.priority] ?? 2);
    if (!act && pts === 0) return;
    const val = act ? activityValue(act) : 0;
    const isRec = t.frequency && t.frequency !== 'once';
    assignees.forEach((uid) => {
      const eid = isRec ? `auto-task-${t.id}-${uid}-${date}` : `auto-task-${t.id}-${uid}`;
      if (add) {
        const ev: PointEvent = {
          id: eid, uid, activityId: t.activityId || 'produttivita',
          label: act ? act.label : `Completato: ${t.title || 'Task'}`,
          points: pts, value: val, auto: true, date,
          refType: 'task', refId: t.id, by: currentUser?.uid || null, byName: currentUser?.name || null, createdAt: Date.now(),
        };
        setPointEvents((prev) => [...prev.filter((e) => e.id !== eid), ev]);
        writeNode(`pointEvents/${uid}/${eid}`, ev).catch(() => {});
        if (uid !== currentUser?.uid) pushNotification(uid, { type: 'punti', title: `+${pts} punti · ${ev.label}`, link: '#team' });
      } else {
        setPointEvents((prev) => prev.filter((e) => e.id !== eid));
        removeNode(`pointEvents/${uid}/${eid}`).catch(() => {});
      }
    });
  };

  const handleToggleTask = (id: string, date: string) => {
    const t0 = tasks[id];
    setTasks(prev => {
      const t = prev[id];
      if (!t) return prev;
      const nextTasks = { ...prev };
      if (t.frequency === 'once') {
        nextTasks[id] = { ...t, done: !t.done, updatedAt: Date.now() };
      } else {
        const completions = { ...(t.completions || {}) };
        if (completions[date]) {
          delete completions[date];
        } else {
          completions[date] = true;
        }
        nextTasks[id] = { ...t, completions, updatedAt: Date.now() };
      }
      syncState('tasks', nextTasks);
      return nextTasks;
    });
    // Auto-punteggio (fuori dal setter per evitare doppie esecuzioni in strict mode)
    if (t0) {
      const add = t0.frequency === 'once' ? !t0.done : !t0.completions?.[date];
      awardTaskPoints(t0, date, add);
    }
    showToast('Stato task aggiornato!');
  };

  const handleTogglePtask = (projId: string, phId: string, tId: string) => {
    setProjects(prev => {
      const p = prev[projId];
      if (!p || !p.phases[phId] || !p.phases[phId].tasks[tId]) return prev;
      
      const nextProjects = { ...prev };
      const task = nextProjects[projId].phases[phId].tasks[tId];
      nextProjects[projId].phases[phId].tasks[tId] = {
        ...task,
        done: !task.done
      };
      nextProjects[projId].updatedAt = Date.now();
      const updated = autoUpdateProjectsCompletion(nextProjects);
      syncState('projects', updated);
      return updated;
    });
    showToast('Stato attività cantiere aggiornato!');
  };

  const handleEditTask = (id: string) => {
    const t = tasks[id];
    if (!t) return;
    setEditTaskId(id);
    setTTitle(t.title);
    setTDateInput(t.date);
    setTTimeInput(t.time || '');
    setTFreq(t.frequency);
    setTPrio(t.priority);
    setTTipo(t.tipo || '');
    setTActivityId((t as any).activityId || '');
    setTPrivate(!!(t as any).private);
    setTAssignees(t.assignees && t.assignees.length ? t.assignees : t.assignee ? [t.assignee] : []);
    setTProjectId(t.projectId || '');
    setTNotes(t.notes || '');
    setTaskEditorOpen(true);
  };

  const handleSaveTask = () => {
    if (!tTitle.trim()) {
      showToast('Inserisci il titolo del task!', 'err');
      return;
    }

    // notifica ai collaboratori aggiunti (nuova assegnazione o riassegnazione)
    const prevTask = editTaskId ? tasks[editTaskId] : undefined;
    const prevAssignees = prevTask ? (prevTask.assignees && prevTask.assignees.length ? prevTask.assignees : prevTask.assignee ? [prevTask.assignee] : []) : [];
    tAssignees
      .filter((uid) => uid && !prevAssignees.includes(uid) && uid !== currentUser?.uid)
      .forEach((uid) =>
        pushNotification(uid, {
          type: 'task',
          title: `Attività assegnata: ${tTitle.trim()}`,
          body: `${currentUser?.name || 'Lo studio'} ti ha assegnato un'attività${tDateInput ? ` per il ${tDateInput}` : ''}.`,
          link: '#calendario'
        })
      );

    setTasks(prev => {
      const nextTasks = { ...prev };
      const date = tDateInput || todayISO();

      if (editTaskId && prev[editTaskId]) {
        nextTasks[editTaskId] = {
          ...prev[editTaskId],
          title: tTitle.trim(),
          date,
          time: tTimeInput || null,
          frequency: tFreq,
          priority: tPrio,
          tipo: tTipo.trim() || null,
          activityId: tActivityId || null,
          private: tPrivate,
          assignee: tAssignees[0] || null,
          assignees: tAssignees.length ? tAssignees : null,
          projectId: tProjectId || null,
          notes: tNotes.trim() || null,
          updatedAt: Date.now()
        };
        showToast('Task modificato con successo!');
      } else {
        const newId = `task-${Date.now()}`;
        nextTasks[newId] = {
          id: newId,
          title: tTitle.trim(),
          date,
          time: tTimeInput || null,
          frequency: tFreq,
          priority: tPrio,
          tipo: tTipo.trim() || null,
          activityId: tActivityId || null,
          private: tPrivate,
          assignee: tAssignees[0] || null,
          assignees: tAssignees.length ? tAssignees : null,
          projectId: tProjectId || null,
          notes: tNotes.trim() || null,
          done: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: currentUser?.uid || 'admin'
        };
        showToast('Nuovo task aggiunto in agenda!');
      }

      syncState('tasks', nextTasks);
      return nextTasks;
    });

    setTaskEditorOpen(false);
    setEditTaskId(null);
  };

  const handleDeleteTask = () => {
    if (editTaskId) {
      const t = tasks[editTaskId];
      askDelete('Eliminare il task?', t ? `"${t.title}" · ${t.date}` : null, () => {
        if (t) moveToTrash('task', t.title || 'Task', t, undefined, t.date);
        setTasks(prev => {
          const nextTasks = { ...prev };
          delete nextTasks[editTaskId];
          syncState('tasks', nextTasks);
          return nextTasks;
        });
        showToast('Task spostato nel Cestino.', 'err');
        setTaskEditorOpen(false);
        setEditTaskId(null);
      });
    }
  };

  // 2. Project actions
  const handleOpenNewProject = (forcedDiv?: 'studio' | 'strategico' | 'materico' | 'unico' | any) => {
    const div = (forcedDiv && typeof forcedDiv === 'string' && ['studio', 'strategico', 'materico', 'unico'].includes(forcedDiv))
      ? (forcedDiv as 'studio' | 'strategico' | 'materico' | 'unico')
      : (activeDivision || 'studio');
    setPDivision(div);

    // Generate default code and template based on division
    const yr = new Date().getFullYear();
    const count = Object.values(projects).length + 1;
    let prefix = 'ARC';
    let defaultTemplate = 'arch-completo';
    if (div === 'strategico') {
      prefix = 'STR';
      defaultTemplate = 'marketing-strategico';
    } else if (div === 'materico') {
      prefix = 'MAT';
      defaultTemplate = 'fornitura-materico';
    } else if (div === 'unico') {
      prefix = 'UNI';
      defaultTemplate = 'concept-unico';
    }
    setPTmplPicked(defaultTemplate);

    setPCode(`${prefix}-${yr}-${String(count).padStart(3, '0')}`);
    setPName('');
    setPClient('');
    setPLocation('');
    setPClientUid('');
    setPClientRecordId('');
    setPManager('admin');
    setPStart(todayISO());
    setPDue('');
    setPCommittente('');
    setPIndirizzo('');
    setPVia('');
    setPCivico('');
    setPCap('');
    setPComune('');
    setPProvincia('');
    setPFoglio('');
    setPParticella('');
    setPSub('');
    setPCatastali([{ foglio: '', particella: '', sub: '' }]);
    setPTipo('');
    setPNotes('');

    setPMarketingBudget('');
    setPMarketingChannels('');
    setPMarketingGoal('');

    setPMatericoEstimatedBudget('');
    setPMatericoFinitureType('');
    setPMatericoSottofondiStatus('');

    // Configuratore Studio: imposta intervento di default + titolo/categorie suggeriti.
    if (div === 'studio') {
      const it = interventoById(DEFAULT_INTERVENTO) || INTERVENTI_EDILIZI[0];
      setPIntervento(it.id);
      setPTitolo(it.titolo);
      setPCategorie(it.categorie);
    } else {
      setPCategorie([]);
    }

    setNewProjOpen(true);
  };

  // Cambio tipo di intervento edilizio: auto-suggerisce titolo abilitativo e categorie.
  const handleInterventoChange = (id: string) => {
    setPIntervento(id);
    const it = interventoById(id);
    if (it) {
      setPTitolo(it.titolo);
      setPCategorie(it.categorie);
    }
  };

  const toggleCategoria = (cat: string) => {
    setPCategorie(prev => (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]));
  };

  const handleCreateProject = () => {
    if (!pName.trim()) {
      showToast('Inserisci il nome del progetto!', 'err');
      return;
    }

    const nId = `p-${Date.now()}`;
    // Studio: se sono state scelte delle categorie, le fasi/task nascono dalla libreria reale.
    const isStudioConfig = pDivision === 'studio' && pCategorie.length > 0;
    const tm = (!isStudioConfig && pTmplPicked !== '__blank__') ? (templates[pTmplPicked] as any) : null;
    let phases: Record<string, Phase> = {};

    if (isStudioConfig) {
      phases = buildStudioPhases(pCategorie, pTitolo);
    } else if (tm) {
      Object.entries(tm.phases || {}).forEach(([k, ph]: [string, any]) => {
        const tasksMap: Record<string, ProjectTask> = {};
        Object.entries(ph.tasks || {}).forEach(([tk, tt]: [string, any]) => {
          tasksMap[tk] = {
            id: tk,
            title: tt.title,
            order: tt.order,
            done: false,
            role: tt.role || null
          };
        });
        phases[k] = {
          id: k,
          name: ph.name,
          order: ph.order,
          tasks: tasksMap
        };
      });
    }

    // Indirizzo immobile composto dai campi strutturati (via, civico, CAP, comune, provincia)
    const composedAddr = composeAddress(pVia, pCivico, pCap, pComune, pProvincia);
    // Identificativi catastali multipli: il primo popola anche i campi legacy
    const catRows = normalizeCatastali(pCatastali);

    // Pianificazione dalla data di inizio: scadenze in sequenza (durata per task) +
    // auto-assegnazione per mansione al membro più libero (meno task aperti)
    const openCount: Record<string, number> = {};
    Object.values(users).forEach((u: any) => {
      if (!u || !u.active || u.role === 'cliente' || u.role === 'partner') return;
      let n = 0;
      Object.values(projects).forEach((pr: any) =>
        Object.values(pr.phases || {}).forEach((ph: any) =>
          Object.values(ph.tasks || {}).forEach((t: any) => { if (!t.done && t.assignee === u.uid) n++; })
        )
      );
      Object.values(tasks).forEach((t: any) => { if (!t.done && (t.assignee === u.uid || (t.assignees || []).includes(u.uid))) n++; });
      openCount[u.uid] = n;
    });
    const pickAssignee = (role?: string | null): string | null => {
      if (!role) return null;
      const r = role.trim().toLowerCase();
      const cands = Object.values(users).filter(
        (u: any) =>
          u && u.active && u.role !== 'cliente' && u.role !== 'partner' &&
          ((u.functions || []).some((f: string) => (f || '').toLowerCase() === r) || (u.title || '').toLowerCase() === r)
      );
      if (!cands.length) return null;
      cands.sort((a: any, b: any) => (openCount[a.uid] || 0) - (openCount[b.uid] || 0));
      const chosen: any = cands[0];
      openCount[chosen.uid] = (openCount[chosen.uid] || 0) + 1; // bilancia anche tra i task di questo progetto
      return chosen.uid;
    };
    {
      const cursor = new Date(`${pStart || todayISO()}T00:00:00`);
      Object.values(phases)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((ph) => {
          Object.values(ph.tasks || {})
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach((t) => {
              cursor.setDate(cursor.getDate() + (t.durationDays || 2));
              t.due = isoDate(cursor);
              if (!t.assignee) t.assignee = pickAssignee(t.role);
            });
        });
    }

    const newProj: Project = {
      id: nId,
      name: pName.trim(),
      code: pCode.trim() || null,
      client: pClient.trim() || null,
      location: pComune.trim() || pLocation.trim() || null,
      manager: pManager || null,
      startDate: pStart || todayISO(),
      dueDate: pDue || null,
      status: 'attivo',
      icon: isStudioConfig ? 'building' : (tm ? tm.icon : 'folder'),
      templateId: isStudioConfig ? null : (tm ? tm.id : null),
      templateName: isStudioConfig ? interventoLabel(pIntervento) : (tm ? tm.name : null),
      clientUid: pClientUid || null,
      clientRecordId: pClientRecordId || null,
      committente: pCommittente.trim() || null,
      indirizzoImmobile: composedAddr || pIndirizzo.trim() || null,
      via: pVia.trim() || null,
      civico: pCivico.trim() || null,
      cap: pCap.trim() || null,
      comune: pComune.trim() || null,
      provincia: pProvincia.trim() ? pProvincia.trim().toUpperCase() : null,
      foglio: catRows[0]?.foglio || pFoglio.trim() || null,
      particella: catRows[0]?.particella || pParticella.trim() || null,
      sub: catRows[0]?.sub || pSub.trim() || null,
      catastali: catRows.length ? catRows : null,
      tipoIntervento: pDivision === 'studio' ? interventoLabel(pIntervento) : (pTipo.trim() || null),
      interventoEdilizio: pDivision === 'studio' ? pIntervento : undefined,
      titoloAbilitativo: pDivision === 'studio' ? pTitolo : undefined,
      phases,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      division: pDivision,
      marketingBudget: pDivision === 'strategico' && pMarketingBudget !== '' ? Number(pMarketingBudget) : undefined,
      marketingChannels: pDivision === 'strategico' ? pMarketingChannels : undefined,
      marketingGoal: pDivision === 'strategico' ? pMarketingGoal : undefined,
      matericoEstimatedBudget: pDivision === 'materico' && pMatericoEstimatedBudget !== '' ? Number(pMatericoEstimatedBudget) : undefined,
      matericoFinitureType: pDivision === 'materico' ? pMatericoFinitureType : undefined,
      matericoSottofondiStatus: pDivision === 'materico' ? pMatericoSottofondiStatus : undefined,
    };

    setProjects(prev => {
      const nextProjects = { ...prev, [nId]: newProj };
      const updated = autoUpdateProjectsCompletion(nextProjects);
      syncState('projects', updated);
      return updated;
    });

    // Avvisa i membri auto-assegnati in base alla mansione
    {
      const assigned = new Set<string>();
      Object.values(phases).forEach((ph) =>
        Object.values(ph.tasks || {}).forEach((t) => {
          if (t.assignee && t.assignee !== currentUser?.uid) assigned.add(t.assignee);
        })
      );
      assigned.forEach((uid) =>
        pushNotification(uid, {
          type: 'task',
          title: `Nuova pratica: ${pName.trim()}`,
          body: 'Ti sono state assegnate attività in base alla tua mansione.',
          link: `#progetto/${nId}`
        })
      );
    }

    if (pNotes.trim()) {
      setProjectsInternal(prev => {
        const next = { ...prev, [nId]: { ...prev[nId], notes: pNotes.trim() } };
        syncState('projectsInternal', next);
        return next;
      });
    }

    if (pClientUid) {
      setUsers(prev => {
        const u = prev[pClientUid];
        if (u) {
          const nextUsers = { ...prev };
          nextUsers[pClientUid] = {
            ...u,
            projectIds: { ...(u.projectIds || {}), [nId]: true }
          };
          syncState('users', nextUsers);
          return nextUsers;
        }
        return prev;
      });
    }

    showToast('Incarico creato con successo!');
    setNewProjOpen(false);
    window.location.hash = `#progetto/${nId}`;
  };

  const handleEditProject = (id: string) => {
    const p = projects[id];
    if (!p) return;
    setEditProjId(id);
    setPName(p.name);
    setPCode(p.code || '');
    setPClient(p.client || '');
    setPLocation(p.location || '');
    setPClientUid(p.clientUid || '');
    setPClientRecordId(p.clientRecordId || '');
    setPManager(p.manager || 'admin');
    setPStart(p.startDate || '');
    setPDue(p.dueDate || '');
    setPCommittente(p.committente || '');
    setPIndirizzo(p.indirizzoImmobile || '');
    setPVia(p.via || '');
    setPCivico(p.civico || '');
    setPCap(p.cap || '');
    setPComune(p.comune || p.location || '');
    setPProvincia(p.provincia || '');
    setPFoglio(p.foglio || '');
    setPParticella(p.particella || '');
    setPSub(p.sub || '');
    setPCatastali(
      p.catastali && p.catastali.length
        ? p.catastali.map((r) => ({ foglio: r.foglio || '', particella: r.particella || '', sub: r.sub || '' }))
        : [{ foglio: p.foglio || '', particella: p.particella || '', sub: p.sub || '' }]
    );
    setPTipo(p.tipoIntervento || '');
    setPDivision(p.division || 'studio');

    const internal = projectsInternal[id];
    setPNotes(internal?.notes || '');
    setEditProjOpen(true);
  };

  const handleSaveEditProject = () => {
    if (!editProjId) return;
    const p = projects[editProjId];
    if (!p) return;

    setProjects(prev => {
      const next = { ...prev };
      next[editProjId] = {
        ...p,
        name: pName.trim(),
        code: pCode.trim() || null,
        client: pClient.trim() || null,
        location: pComune.trim() || pLocation.trim() || null,
        clientUid: pClientUid || null,
        clientRecordId: pClientRecordId || null,
        manager: pManager,
        startDate: pStart || null,
        dueDate: pDue || null,
        committente: pCommittente.trim() || null,
        indirizzoImmobile: composeAddress(pVia, pCivico, pCap, pComune, pProvincia) || pIndirizzo.trim() || null,
        via: pVia.trim() || null,
        civico: pCivico.trim() || null,
        cap: pCap.trim() || null,
        comune: pComune.trim() || null,
        provincia: pProvincia.trim() ? pProvincia.trim().toUpperCase() : null,
        ...(() => {
          const rows = normalizeCatastali(pCatastali);
          return {
            foglio: rows[0]?.foglio || null,
            particella: rows[0]?.particella || null,
            sub: rows[0]?.sub || null,
            catastali: rows.length ? rows : null
          };
        })(),
        tipoIntervento: pTipo.trim() || null,
        division: pDivision,
        updatedAt: Date.now()
      };
      const updated = autoUpdateProjectsCompletion(next);
      syncState('projects', updated);
      return updated;
    });

    setProjectsInternal(prev => {
      const next = { ...prev };
      next[editProjId] = { ...prev[editProjId], notes: pNotes.trim() || null };
      syncState('projectsInternal', next);
      return next;
    });

    showToast('Fascicolo modificato.');
    setEditProjOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const p = projects[id];
    askDelete('Eliminare la pratica?', p ? `"${p.name}" e il suo fascicolo finiranno nel Cestino per ${TRASH_RETENTION_DAYS} giorni.` : null, () => {
      if (p) moveToTrash('progetti', p.name, p, undefined, p.client || undefined);
      setProjects(prev => {
        const next = { ...prev };
        delete next[id];
        syncState('projects', next);
        return next;
      });
      setEditProjOpen(false);
      showToast('Pratica spostata nel Cestino.', 'err');
      window.location.hash = '#progetti';
    });
  };

  // Archivia/ripristina una pratica (esce dalle liste di default, filtro "Archivio")
  const handleToggleArchiveProject = (id: string) => {
    setProjects(prev => {
      const p = prev[id];
      if (!p) return prev;
      const next = { ...prev, [id]: { ...p, archived: !p.archived, updatedAt: Date.now() } };
      syncState('projects', next);
      showToast(p.archived ? 'Pratica ripristinata dall\'archivio.' : 'Pratica archiviata.');
      return next;
    });
  };

  const handleSaveEstimate = (est: MatericoEstimate) => {
    setEstimates(prev => {
      const next = { ...prev, [est.id]: est };
      syncState('estimates', next);
      return next;
    });
    showToast('Preventivo registrato.');
  };

  const handleDeleteEstimate = (id: string) => {
    const est = estimates[id];
    askDelete('Eliminare il preventivo Materico?', est ? `"${est.itemName || est.itemDescription || est.partnerName}"` : null, () => {
      if (est) moveToTrash('estimates', est.itemName || est.itemDescription || 'Preventivo Materico', est, undefined, est.partnerName);
      setEstimates(prev => {
        const next = { ...prev };
        delete next[id];
        syncState('estimates', next);
        return next;
      });
      showToast('Preventivo spostato nel Cestino.', 'err');
    });
  };

  // 3. Document manager
  const handleUploadDocument = (projId: string, file: File, kind: string = 'allegato') => {
    // Generate mock visual path mapping on local system
    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const newDoc = {
      id: docId,
      name: file.name,
      kind,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200',
      byName: currentUser?.name || 'Studio Admin',
      by: currentUser?.uid || 'admin',
      at: Date.now()
    };

    setDocuments(prev => {
      const prjDocs = { ...(prev[projId] || {}) };
      prjDocs[docId] = newDoc;
      const next = { ...prev, [projId]: prjDocs };
      return next;
    });
    // Scrittura mirata (compatibile con le regole: anche i clienti possono creare)
    writeNode(`documents/${projId}/${docId}`, newDoc).catch(() => {});
    showToast('Documento caricato!');
  };

  /** Sposta un documento in una cartella del cliente: aggiorna folder + percorso leggibile. */
  const handleMoveDocument = (projId: string, docId: string, folder: string | null) => {
    const doc = (documents[projId] || {})[docId];
    if (!doc) return;
    const proj = projects[projId];
    const path = [proj?.client, proj?.name, folder].filter(Boolean).join(' / ') || null;
    const updated = { ...doc, folder: folder || null, path };
    setDocuments(prev => ({ ...prev, [projId]: { ...(prev[projId] || {}), [docId]: updated } }));
    writeNode(`documents/${projId}/${docId}`, updated).catch(() => {});
    showToast(folder ? `Documento spostato in "${folder}".` : 'Documento fuori dalle cartelle.');
  };

  const handleDeleteDocument = (projId: string, docId: string) => {
    const doc = (documents[projId] || {})[docId];
    askDelete(doc?.kind === 'contratto' ? 'Eliminare il contratto?' : 'Eliminare il documento?', doc ? `"${doc.name}"` : null, () => {
      if (doc) moveToTrash('documenti', doc.name || 'Documento', doc, { pid: projId }, projects[projId]?.name);
      setDocuments(prev => {
        const prjDocs = { ...(prev[projId] || {}) };
        delete prjDocs[docId];
        const next = { ...prev, [projId]: prjDocs };
        return next;
      });
      removeNode(`documents/${projId}/${docId}`).catch(() => {});
      showToast('Documento spostato nel Cestino.', 'err');
    });
  };

  // 3b. Arredi & Moodboard (scrittura mirata per-elemento, come i documenti)
  const handleSaveFurnishing = (projId: string, item: Furnishing) => {
    const enriched: Furnishing = {
      ...item,
      createdByName: item.createdByName || currentUser?.name
    };
    setFurnishings((prev) => {
      const prj = { ...(prev[projId] || {}) };
      prj[item.id] = enriched;
      return { ...prev, [projId]: prj };
    });
    writeNode(`projectFurnishings/${projId}/${item.id}`, enriched).catch((e: any) =>
      showToast('Errore salvataggio arredo: ' + (e?.message || e?.code || 'controlla regole/permessi'), 'err')
    );
  };

  const handleDeleteFurnishing = (projId: string, itemId: string) => {
    const item = (furnishings[projId] || {})[itemId];
    askDelete('Eliminare l\'arredo?', item ? `"${item.title}"` : null, () => {
      if (item) moveToTrash('arredi', item.title || 'Arredo', item, { pid: projId }, projects[projId]?.name);
      setFurnishings((prev) => {
        const prj = { ...(prev[projId] || {}) };
        delete prj[itemId];
        return { ...prev, [projId]: prj };
      });
      removeNode(`projectFurnishings/${projId}/${itemId}`).catch(() =>
        showToast('Errore eliminazione arredo (controlla regole/permessi).', 'err')
      );
    });
  };

  // 3b-bis. Moodboard 3D: salva la scena per-progetto (nodo intero)
  const handleSaveMoodboard3d = (projId: string, elements: any[]) => {
    const payload = { elements: elements || [], updatedAt: Date.now(), by: currentUser?.uid || null };
    setMoodboard3d((prev) => ({ ...prev, [projId]: payload }));
    writeNode(`projectMoodboard3d/${projId}`, payload).catch((e: any) =>
      showToast('Errore salvataggio moodboard 3D: ' + (e?.message || e?.code || 'controlla regole/permessi'), 'err')
    );
  };

  // 3c. Flag "lo Studio gestisce gli arredi mobili" (→ fee 20%) sul progetto
  const handleToggleStudioManagesMobili = (projId: string, value: boolean) => {
    setProjects((prev) => {
      const p = prev[projId];
      if (!p) return prev;
      const next = { ...prev, [projId]: { ...p, studioManagesArrediMobili: value, updatedAt: Date.now() } };
      syncState('projects', next);
      return next;
    });
  };

  // 3d. Modulo Cantiere
  const cantSetters: Record<string, (updater: (m: any) => any) => void> = {
    cantiereRapportini: setCantRapportini as any,
    cantierePresenze: setCantPresenze as any,
    cantiereFoto: setCantFoto as any,
    cantiereMateriali: setCantMateriali as any,
    cantiereChecklist: setCantChecklist as any,
    cantiereDocumenti: setCantDocumenti as any,
    cantiereSal: setCantSal as any,
    cantiereRecords: setCantRecords as any,
    cantiereMessages: setCantMessages as any
  };
  // Area Impresa: collection keyed per uid (profilo riusabile del partner)
  const impresaSetters: Record<string, (updater: (m: any) => any) => void> = {
    impresaDocs: setImpresaDocs as any,
    impresaRecords: setImpresaRecords as any
  };
  const cantErr = () => showToast('Errore cantiere (controlla regole/permessi).', 'err');
  // Storico/audit (scrittura solo lato studio: le regole vietano la scrittura ai partner)
  const logCantiere = (cid: string, action: string, entity: string, detail?: string) => {
    if (!currentUser || currentUser.role === 'cliente' || currentUser.role === 'partner') return;
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const entry: CantiereLog = { id, action, entity, by: currentUser.uid, role: currentUser.role, at: Date.now(), detail: detail || null };
    setCantLog((m) => ({ ...m, [cid]: { ...(m[cid] || {}), [id]: entry } }));
    writeNode(`cantiereLog/${cid}/${id}`, entry).catch(() => {});
  };

  const handleSaveCantiere = (c: Cantiere) => {
    const enriched: Cantiere = { ...c, createdByName: c.createdByName || currentUser?.name, updatedAt: Date.now() };
    setCantieri((prev) => ({ ...prev, [c.id]: enriched }));
    writeNode(`cantieri/${c.id}`, enriched).catch(cantErr);
    logCantiere(c.id, 'cantiere.salvato', 'cantiere', c.name);
  };
  const handleDeleteCantiere = (cid: string) => {
    const c = cantieri[cid];
    askDelete('Eliminare il cantiere?', c ? `"${c.name}" finirà nel Cestino per ${TRASH_RETENTION_DAYS} giorni.` : null, () => {
      if (c) moveToTrash('cantieri', c.name || 'Cantiere', c);
      setCantieri((prev) => { const n = { ...prev }; delete n[cid]; return n; });
      removeNode(`cantieri/${cid}`).catch(cantErr);
      // ripulisce l'indice inverso dei partner assegnati
      Object.keys(c?.partnerUids || {}).forEach((uid) => removeNode(`partnerCantieri/${uid}/${cid}`).catch(() => {}));
      showToast('Cantiere spostato nel Cestino.', 'err');
    });
  };
  const handleAssignPartner = (cid: string, uid: string, name: string, on: boolean) => {
    setCantieri((prev) => {
      const c = prev[cid];
      if (!c) return prev;
      const partnerUids = { ...(c.partnerUids || {}) };
      if (on) partnerUids[uid] = true; else delete partnerUids[uid];
      return { ...prev, [cid]: { ...c, partnerUids } };
    });
    if (on) {
      writeNode(`cantieri/${cid}/partnerUids/${uid}`, true).catch(cantErr);
      writeNode(`partnerCantieri/${uid}/${cid}`, true).catch(cantErr);
    } else {
      removeNode(`cantieri/${cid}/partnerUids/${uid}`).catch(cantErr);
      removeNode(`partnerCantieri/${uid}/${cid}`).catch(cantErr);
    }
    logCantiere(cid, on ? 'partner.assegnato' : 'partner.rimosso', 'partner', name);
  };
  const handleSaveCantEntity = (coll: string, cid: string, item: any) => {
    cantSetters[coll]?.((m) => ({ ...m, [cid]: { ...(m[cid] || {}), [item.id]: item } }));
    writeNode(`${coll}/${cid}/${item.id}`, item).catch(cantErr);
  };
  const handleDeleteCantEntity = (coll: string, cid: string, id: string) => {
    const getter: Record<string, any> = {
      cantiereRapportini: cantRapportini, cantierePresenze: cantPresenze, cantiereFoto: cantFoto,
      cantiereMateriali: cantMateriali, cantiereChecklist: cantChecklist, cantiereDocumenti: cantDocumenti,
      cantiereSal: cantSal, cantiereRecords: cantRecords, cantiereMessages: cantMessages
    };
    const item = getter[coll]?.[cid]?.[id];
    const label = item?.name || item?.title || item?.descrizione || item?.desc || item?.caption || 'Voce di cantiere';
    askDelete('Eliminare questa voce di cantiere?', `"${label}"`, () => {
      if (item) moveToTrash('cantiere', label, item, { coll, cid }, cantieri[cid]?.name);
      cantSetters[coll]?.((m) => { const sub = { ...(m[cid] || {}) }; delete sub[id]; return { ...m, [cid]: sub }; });
      removeNode(`${coll}/${cid}/${id}`).catch(cantErr);
    });
  };
  const handleApproveRapportino = (cid: string, id: string, approve: boolean) => {
    const r = cantRapportini[cid]?.[id];
    if (!r) return;
    const next: Rapportino = { ...r, status: approve ? 'approvato' : 'rifiutato', approvedBy: currentUser?.uid };
    handleSaveCantEntity('cantiereRapportini', cid, next);
    logCantiere(cid, approve ? 'rapportino.approvato' : 'rapportino.rifiutato', 'rapportino', r.partnerName || '');
    showToast(approve ? 'Rapportino approvato.' : 'Rapportino rifiutato.', approve ? 'ok' : 'err');
  };
  const handleApproveSal = (cid: string, id: string) => {
    const s = cantSal[cid]?.[id];
    if (!s) return;
    const next: CantiereSal = { ...s, status: 'approvato', approvedBy: currentUser?.uid };
    handleSaveCantEntity('cantiereSal', cid, next);
    // l'avanzamento del cantiere si allinea alla % del SAL approvato
    const cant = cantieri[cid];
    if (cant && s.progressPct != null && s.progressPct !== (cant.progressPct || 0)) {
      handleSaveCantiere({ ...cant, progressPct: Math.min(100, s.progressPct) });
    }
    logCantiere(cid, 'sal.approvato', 'sal', `SAL ${s.number}`);
    showToast('SAL approvato. Emetti la bozza fattura da Finanze → SAL.', 'ok');
  };
  // Collega un SAL di cantiere alla fattura generata (chiamato da FinanzeView)
  const handleLinkCantiereSalInvoice = (cid: string, salId: string, invoiceId: string) => {
    const s = cantSal[cid]?.[salId];
    if (!s) return;
    handleSaveCantEntity('cantiereSal', cid, { ...s, linkedInvoiceId: invoiceId });
    logCantiere(cid, 'sal.fatturato', 'sal', invoiceId);
  };
  // Chat di cantiere (studio + partner assegnato)
  const handleSendCantiereMessage = (cid: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const id = `cmsg-${Date.now()}`;
    const msg: CantiereMessage = {
      id, from: currentUser.uid, role: currentUser.role,
      name: currentUser.name, text: text.trim(), at: Date.now()
    };
    handleSaveCantEntity('cantiereMessages', cid, msg);
  };
  // Elimina un proprio messaggio di cantiere entro 60s ("unsend"): rimozione
  // diretta senza doppia conferma/cestino (vedi handleDeleteProjectMessage).
  const handleDeleteCantiereMessage = (cid: string, id: string) => {
    const m = cantMessages[cid]?.[id];
    if (!m || m.from !== currentUser?.uid) return;
    setCantMessages((mm) => { const sub = { ...(mm[cid] || {}) }; delete sub[id]; return { ...mm, [cid]: sub }; });
    removeNode(`cantiereMessages/${cid}/${id}`).catch(() => showToast('Messaggio non più eliminabile.', 'err'));
  };
  // Area Impresa: save/delete generici keyed per uid del partner
  const handleSaveImpresaEntity = (coll: string, uid: string, item: any) => {
    impresaSetters[coll]?.((m) => ({ ...m, [uid]: { ...(m[uid] || {}), [item.id]: item } }));
    writeNode(`${coll}/${uid}/${item.id}`, item).catch(() => showToast('Errore impresa (controlla regole/permessi).', 'err'));
  };
  const handleDeleteImpresaEntity = (coll: string, uid: string, id: string) => {
    const item = (coll === 'impresaDocs' ? impresaDocs : impresaRecords)[uid]?.[id] as any;
    const label = item?.name || item?.title || 'Voce impresa';
    askDelete('Eliminare questa voce dell\'impresa?', `"${label}"`, () => {
      if (item) moveToTrash('impresa', label, item, { coll, uid });
      impresaSetters[coll]?.((m) => { const sub = { ...(m[uid] || {}) }; delete sub[id]; return { ...m, [uid]: sub }; });
      removeNode(`${coll}/${uid}/${id}`).catch(() => showToast('Errore impresa (controlla regole/permessi).', 'err'));
    });
  };
  // Rubrica clienti (admin/manager)
  const handleSaveClient = (rec: ClientRecord) => {
    const enriched: ClientRecord = { ...rec, createdBy: rec.createdBy || currentUser?.uid || 'admin', updatedAt: Date.now() };
    setClients((prev) => ({ ...prev, [rec.id]: enriched }));
    writeNode(`clients/${rec.id}`, enriched).catch(() => showToast('Errore rubrica clienti (controlla regole).', 'err'));
  };
  const handleDeleteClient = (id: string) => {
    const rec = clients[id];
    askDelete('Eliminare il cliente dalla rubrica?', rec ? `"${rec.name}"` : null, () => {
      if (rec) moveToTrash('rubrica', rec.name || 'Cliente', rec);
      setClients((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`clients/${id}`).catch(() => showToast('Errore rubrica clienti (controlla regole).', 'err'));
      showToast('Cliente spostato nel Cestino.', 'err');
    });
  };
  // Import massivo dal Registro Clienti (CSV). Dedup su nome+telefono; salva i nuovi su `clients`.
  const handleImportClients = (recs: ClientRecord[]): { added: number; skipped: number } => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') return { added: 0, skipped: recs.length };
    const key = (name?: string | null, phone?: string | null) => `${(name || '').trim().toLowerCase()}|${(phone || '').replace(/\s+/g, '')}`;
    const existing = new Set(Object.values(clients).map((c) => key(c.name, c.phone)));
    let added = 0, skipped = 0;
    const toWrite: ClientRecord[] = [];
    recs.forEach((r) => {
      const k = key(r.name, r.phone);
      if (!r.name?.trim() || existing.has(k)) { skipped++; return; }
      existing.add(k);
      const rec: ClientRecord = { ...r, id: r.id || `cli-${Date.now()}-${Math.floor(Math.random() * 90000)}`, createdBy: currentUser?.uid || 'admin', createdAt: Date.now() };
      toWrite.push(rec);
      added++;
    });
    if (toWrite.length) {
      setClients((prev) => { const n = { ...prev }; toWrite.forEach((r) => { n[r.id] = r; }); return n; });
      toWrite.forEach((r) => writeNode(`clients/${r.id}`, r).catch(() => {}));
      logAudit('create', 'rubrica', `Import registro clienti: ${added} contatti`, 'CSV');
    }
    return { added, skipped };
  };
  // Unione duplicati: fonde le schede `dupIds` in `survivor` (progetti ri-puntati, campi combinati, dup nel Cestino).
  const handleMergeClients = (survivor: ClientRecord, dupIds: string[]) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') return;
    const dups = dupIds.map((id) => clients[id]).filter(Boolean) as ClientRecord[];
    if (!dups.length) return;
    askDelete('Unire i duplicati?', `${dups.length} scheda/e verranno unite in "${survivor.name}" e spostate nel Cestino. I progetti collegati passano a questa scheda.`, () => {
      const merged: ClientRecord = { ...survivor };
      const scalarKeys: (keyof ClientRecord)[] = ['email', 'phone', 'whatsapp', 'address', 'codiceFiscale', 'companyName', 'partitaIva', 'pec', 'sdi', 'tier', 'acquisitionChannel', 'notes', 'stato', 'preventivoStato', 'saldato', 'dataInizio', 'dataFine', 'responsabileNome', 'riferimentoComunicazione', 'referredByCode', 'accountUid', 'codiceReferenza'];
      scalarKeys.forEach((k) => { if ((merged as any)[k] == null || (merged as any)[k] === '') { for (const d of dups) { const v = (d as any)[k]; if (v != null && v !== '') { (merged as any)[k] = v; break; } } } });
      (['responsabili', 'roles', 'societies'] as const).forEach((k) => { const m: Record<string, boolean> = { ...((merged as any)[k] || {}) }; dups.forEach((d) => Object.assign(m, (d as any)[k] || {})); if (Object.keys(m).length) (merged as any)[k] = m; });
      if (!merged.partnerRating) { const d = dups.find((x) => x.partnerRating); if (d) merged.partnerRating = d.partnerRating; }
      const ints = [...(survivor.interactions || []), ...dups.flatMap((d) => d.interactions || [])];
      if (ints.length) merged.interactions = ints;
      merged.updatedAt = Date.now();
      // ri-punta i progetti dai duplicati alla scheda superstite
      setProjects((prev) => {
        const next = { ...prev }; let changed = false;
        Object.values(next).forEach((p) => { if (p.clientRecordId && dupIds.includes(p.clientRecordId)) { next[p.id] = { ...p, clientRecordId: survivor.id }; changed = true; } });
        if (changed) syncState('projects', next);
        return next;
      });
      setClients((prev) => { const n = { ...prev }; n[survivor.id] = merged; dupIds.forEach((id) => delete n[id]); return n; });
      writeNode(`clients/${survivor.id}`, merged).catch(() => {});
      dups.forEach((d) => { moveToTrash('rubrica', d.name || 'Cliente', d, undefined, `unito in ${survivor.name}`); removeNode(`clients/${d.id}`).catch(() => {}); });
      logAudit('update', 'rubrica', `Unione duplicati → ${survivor.name}`, `${dups.length} schede`);
      showToast('Duplicati uniti.', 'ok');
    });
  };

  // ---- Governance & Organigrammi ----
  const handleSaveOrgNode = (n: OrgNode) => {
    setGovernanceOrg((prev) => ({ ...prev, [n.id]: n }));
    writeNode(`governanceOrg/${n.id}`, n).catch(() => showToast('Errore Governance (controlla regole).', 'err'));
  };
  // "Carica esempio": scrive il seed e rimuove i residui delle versioni precedenti del seed.
  const handleSeedOrg = (seedNodes: OrgNode[]) => {
    const seededIds = new Set(seedNodes.map((n) => n.id));
    const LEGACY_SEED_IDS = ['s-holding-socio', 's-mat-df', 's-mat-epifani', 's-mat-zivoli', 's-onirico-socio-0', 's-materico-socio-0', 's-materico-socio-1'];
    setGovernanceOrg((prev) => {
      const next = { ...prev };
      LEGACY_SEED_IDS.forEach((id) => { if (next[id] && !seededIds.has(id)) delete next[id]; });
      seedNodes.forEach((n) => { next[n.id] = n; });
      return next;
    });
    LEGACY_SEED_IDS.forEach((id) => { if (governanceOrg[id] && !seededIds.has(id)) removeNode(`governanceOrg/${id}`).catch(() => {}); });
    seedNodes.forEach((n) => writeNode(`governanceOrg/${n.id}`, n).catch(() => showToast('Errore Governance (controlla regole).', 'err')));
  };
  const handleDeleteOrgNode = (id: string) => {
    askDelete('Eliminare dall\'organigramma?', 'Verranno rimossi anche gli elementi che dipendono solo da questo. I riferimenti negli altri box vengono ripuliti.', () => {
      const all = governanceOrg;
      const parentsOf = (x: OrgNode): string[] => (x.parents && x.parents.length ? x.parents.map((p) => p.id) : (x.parentId ? [x.parentId] : []));
      // Elimina un nodo e, a cascata, solo i figli che restano ORFANI (nessun altro genitore).
      const toDel = new Set<string>();
      const collect = (nid: string) => {
        if (toDel.has(nid)) return;
        toDel.add(nid);
        Object.values(all).forEach((x) => {
          const ps = parentsOf(x);
          if (ps.includes(nid) && ps.every((p) => toDel.has(p))) collect(x.id);
        });
      };
      collect(id);
      // Ripulisce i riferimenti (parents/parentId) verso i nodi eliminati nei box superstiti.
      const updates: OrgNode[] = [];
      Object.values(all).forEach((x) => {
        if (toDel.has(x.id)) return;
        const ps = x.parents && x.parents.length ? x.parents : (x.parentId ? [{ id: x.parentId } as OrgParentRef] : []);
        if (ps.some((p) => toDel.has(p.id))) {
          const kept = ps.filter((p) => !toDel.has(p.id));
          updates.push({ ...x, parents: kept, parentId: kept.length === 1 ? kept[0].id : null, updatedAt: Date.now() });
        }
      });
      setGovernanceOrg((prev) => {
        const n = { ...prev };
        toDel.forEach((d) => delete n[d]);
        updates.forEach((u) => { n[u.id] = u; });
        return n;
      });
      toDel.forEach((d) => removeNode(`governanceOrg/${d}`).catch(() => {}));
      updates.forEach((u) => writeNode(`governanceOrg/${u.id}`, u).catch(() => {}));
    });
  };
  const handleSaveSop = (s: GovernanceSop) => {
    const enriched: GovernanceSop = { ...s, createdBy: s.createdBy || currentUser?.uid || null };
    setGovernanceSop((prev) => ({ ...prev, [s.id]: enriched }));
    writeNode(`governanceSop/${s.id}`, enriched).catch(() => showToast('Errore Governance (controlla regole).', 'err'));
  };
  const handleDeleteSop = (id: string) => {
    askDelete('Eliminare la procedura?', null, () => {
      setGovernanceSop((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`governanceSop/${id}`).catch(() => {});
    });
  };
  // ---- Mansionari (governanceMansionari) ----
  const handleSaveMansionario = (m: GovernanceMansionario) => {
    setGovernanceMansionari((prev) => ({ ...prev, [m.id]: m }));
    writeNode(`governanceMansionari/${m.id}`, m).catch(() => showToast('Errore Governance (controlla regole).', 'err'));
  };
  const handleDeleteMansionario = (id: string) => {
    askDelete('Eliminare il mansionario?', null, () => {
      setGovernanceMansionari((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`governanceMansionari/${id}`).catch(() => {});
    });
  };
  // ---- Cassaforte password (governanceVault + governanceVaultConfig) ----
  const handleSaveVaultEntry = (e: VaultEntry) => {
    const enriched: VaultEntry = { ...e, by: e.by || currentUser?.uid || null };
    setGovernanceVault((prev) => ({ ...prev, [e.id]: enriched }));
    writeNode(`governanceVault/${e.id}`, enriched).catch(() => showToast('Errore cassaforte (controlla regole).', 'err'));
  };
  const handleDeleteVaultEntry = (id: string) => {
    askDelete('Eliminare la credenziale?', null, () => {
      setGovernanceVault((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`governanceVault/${id}`).catch(() => {});
    });
  };
  const handleSetVaultConfig = (cfg: VaultConfig) => {
    const enriched: VaultConfig = { ...cfg, updatedAt: Date.now(), by: currentUser?.uid || null };
    setVaultConfig(enriched);
    return writeNode('governanceVaultConfig', enriched).catch(() => { showToast('Errore salvataggio password sezione.', 'err'); throw new Error('vault-config'); });
  };
  // ---- Agenda Risorse Umane (hrEvents) ----
  const handleSaveHrEvent = (e: HrEvent) => {
    const enriched: HrEvent = { ...e, createdBy: e.createdBy || currentUser?.uid || null };
    setHrEvents((prev) => ({ ...prev, [e.id]: enriched }));
    writeNode(`hrEvents/${e.id}`, enriched).catch(() => showToast('Errore agenda HR (controlla regole).', 'err'));
  };
  const handleDeleteHrEvent = (id: string) => {
    askDelete('Eliminare l\'evento dall\'agenda HR?', null, () => {
      setHrEvents((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`hrEvents/${id}`).catch(() => {});
    });
  };
  // ---- Potenziale Cantiere Materico (matericoDeals) ----
  const handleSaveMatericoDeal = (d: MatericoDeal) => {
    const enriched: MatericoDeal = { ...d, createdBy: d.createdBy || currentUser?.uid || null };
    setMatericoDeals((prev) => ({ ...prev, [d.id]: enriched }));
    writeNode(`matericoDeals/${d.id}`, enriched).catch(() => showToast('Errore Potenziale Cantiere (controlla regole).', 'err'));
  };
  const handleDeleteMatericoDeal = (id: string) => {
    const d = matericoDeals[id];
    askDelete('Eliminare la commessa potenziale?', d ? `"${d.title}"` : null, () => {
      if (d) moveToTrash('materico-deal', d.title || 'Commessa', d, undefined, d.clientName || undefined);
      setMatericoDeals((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`matericoDeals/${id}`).catch(() => {});
    });
  };
  // ---- Listino interno Materico (matericoListino, §4) ----
  const handleSaveMatericoListino = (i: MatericoPriceItem) => {
    setMatericoListino((prev) => ({ ...prev, [i.id]: i }));
    writeNode(`matericoListino/${i.id}`, i).catch(() => showToast('Errore listino (controlla regole).', 'err'));
  };
  const handleDeleteMatericoListino = (id: string) => {
    askDelete('Eliminare la voce di listino?', null, () => {
      setMatericoListino((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`matericoListino/${id}`).catch(() => {});
    });
  };
  // ---- Piano finanziario per società/anno (pianoFinanziario) ----
  const handleSavePiano = (p: PianoFinanziario) => {
    const enriched: PianoFinanziario = { ...p, by: currentUser?.uid || null };
    setPianoFinanziario((prev) => ({ ...prev, [p.id]: enriched }));
    writeNode(`pianoFinanziario/${p.id}`, enriched).catch(() => showToast('Errore piano finanziario (controlla regole).', 'err'));
  };
  // ---- Programmazione fatturazione (fatturazionePlan) ----
  const handleSaveFatturazione = (i: FatturazionePlanItem) => {
    const enriched: FatturazionePlanItem = { ...i, by: i.by || currentUser?.uid || null };
    setFatturazionePlan((prev) => ({ ...prev, [i.id]: enriched }));
    writeNode(`fatturazionePlan/${i.id}`, enriched).catch(() => showToast('Errore programmazione (controlla regole).', 'err'));
  };
  const handleDeleteFatturazione = (id: string) => {
    setFatturazionePlan((prev) => { const n = { ...prev }; delete n[id]; return n; });
    removeNode(`fatturazionePlan/${id}`).catch(() => {});
  };
  const handleEmitFatturazione = (i: FatturazionePlanItem) => {
    if (i.status === 'emessa') return;
    const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const inv: any = { id: invId, clientName: i.clientName, projectId: i.projectId || '', projectName: i.projectId ? (projects[i.projectId]?.name || '') : '', amount: i.amount, taxRate: i.taxRate ?? 22, cassaPct: i.cassaPct ?? null, status: 'bozza', sdiCode: '', date: todayISO(), dueDate: i.dueDate || todayISO(), sector: i.soc };
    handleSaveFinanceItem('finInvoicesActive', inv);
    const sca: any = { id: `sca-${Date.now()}-${Math.floor(Math.random() * 900)}`, kind: 'entrata', desc: `Fatturazione · ${i.description || i.clientName}`, clientOrSupplier: i.clientName, amount: i.amount, dueDate: i.dueDate || todayISO(), status: 'pago_attesa', projectId: i.projectId || undefined, sector: i.soc };
    handleSaveFinanceItem('finScadenze', sca);
    handleSaveFatturazione({ ...i, status: 'emessa', invoiceId: invId, updatedAt: Date.now() });
    logAudit('create', 'fatturazione', `Fattura emessa · ${i.clientName}`, eur(i.amount));
    showToast('Fattura emessa (bozza) + scadenza create in Contabilità.', 'ok');
  };
  // ---- Contratti imprese Materico (matericoContracts, §7) ----
  const handleSaveMatericoContract = (c: MatericoContract) => {
    const enriched: MatericoContract = { ...c, createdBy: c.createdBy || currentUser?.uid || null };
    setMatericoContracts((prev) => ({ ...prev, [c.id]: enriched }));
    writeNode(`matericoContracts/${c.id}`, enriched).catch(() => showToast('Errore contratti (controlla regole).', 'err'));
    if (c.status === 'firmato' && matericoContracts[c.id]?.status !== 'firmato') logAudit('update', 'contratti', `Contratto firmato (OTP) · ${c.partnerName}`, c.number);
  };
  const handleDeleteMatericoContract = (id: string) => {
    const c = matericoContracts[id];
    askDelete('Eliminare il contratto?', c ? `"${c.number}"` : null, () => {
      if (c) moveToTrash('materico-contract', c.number || 'Contratto', c, undefined, c.partnerName || undefined);
      setMatericoContracts((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`matericoContracts/${id}`).catch(() => {});
    });
  };
  // ---- Preventivo automatico dal computo di una commessa (§5) ----
  const handleGenerateQuoteFromDeal = (deal: MatericoDeal) => {
    const rows = deal.computo || [];
    if (!rows.length) { showToast('Aggiungi voci al computo prima di generare il preventivo.', 'err'); return; }
    const qId = deal.quoteId || `q-${Date.now()}`;
    const num = Object.values(quotes).find((q) => q.id === qId)?.number || `PRV-MAT-${new Date().getFullYear()}-${String(Object.keys(quotes).length + 1).padStart(3, '0')}`;
    const lines = rows.map((r, i) => ({ id: `ql-${i}`, macro: (r.category || 'opere_edili') as any, desc: r.description || 'Voce', qty: r.qty || 0, unitPrice: r.prezzoUnit || 0, amount: (r.prezzoUnit || 0) * (r.qty || 0) }));
    const total = lines.reduce((s, l) => s + l.amount, 0);
    const quote: Quote = {
      id: qId, number: num, docKind: 'preventivo',
      clientRecordId: deal.clientRecordId || null, clientName: deal.clientName || 'Cliente',
      projectId: deal.projectId || null, division: 'materico', status: 'elaborato',
      lines, total, vatEnabled: true, vatPct: 22, cassaEnabled: false, cassaPct: 4,
      notes: `Generato dal computo della commessa "${deal.title}".`, createdAt: Date.now(), createdBy: currentUser?.uid,
    };
    handleSaveQuote(quote);
    handleSaveMatericoDeal({ ...deal, quoteId: qId, updatedAt: Date.now() });
    logAudit('create', 'preventivi', `Preventivo da computo · ${deal.title}`, 'Materico');
    showToast('Preventivo generato dal computo.');
    window.location.hash = '#preventivi';
  };

  // ---- Notifiche persistenti (notifications/<uid>) ----
  const pushNotification = (uid: string, payload: { type: string; title: string; body?: string | null; link?: string | null }) => {
    if (!uid) return;
    const id = `ntf-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
    const ntf: Notification = {
      id, type: payload.type, title: payload.title, body: payload.body || null, link: payload.link || null,
      read: false, at: Date.now(), by: currentUser?.uid || null, byName: currentUser?.name || null
    };
    writeNode(`notifications/${uid}/${id}`, ntf).catch(() => {});
  };
  // Notifica a tutti i membri studio (esclude opzionalmente un uid, es. l'autore)
  const notifyStudio = (payload: { type: string; title: string; body?: string | null; link?: string | null }, exceptUid?: string) => {
    const uids = new Set<string>([
      ...Object.keys(directory || {}),
      ...Object.values(users).filter((u: any) => u && u.active && u.role !== 'cliente' && u.role !== 'partner').map((u: any) => u.uid)
    ]);
    uids.forEach((uid) => { if (uid && uid !== exceptUid) pushNotification(uid, payload); });
  };
  const markNotificationRead = (id: string) => {
    if (!currentUser) return;
    if (!notifications.some((n) => n.id === id)) return; // sintetiche (es. richieste appuntamento): non persistite
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    updateNode(`notifications/${currentUser.uid}/${id}`, { read: true }).catch(() => {});
  };
  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    notifications.filter((n) => !n.read).forEach((n) => updateNode(`notifications/${currentUser.uid}/${n.id}`, { read: true }).catch(() => {}));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const clearNotifications = () => {
    if (!currentUser) return;
    setNotifications([]);
    removeNode(`notifications/${currentUser.uid}`).catch(() => {});
  };

  // ---- Ferie/assenze team (teamLeave/<id>) ----
  const handleSaveLeave = (leave: TeamLeave) => {
    setTeamLeave((prev) => ({ ...prev, [leave.id]: leave }));
    writeNode(`teamLeave/${leave.id}`, leave)
      .then(() => {
        // notifica in-app a tutto il team (escluso l'autore)
        notifyStudio({
          type: 'ferie',
          title: `${leave.name}: ${leave.type} dal ${leave.dateFrom}`,
          body: leave.dateFrom === leave.dateTo ? `Giorno ${leave.dateFrom}` : `Dal ${leave.dateFrom} al ${leave.dateTo}`,
          link: '#calendario'
        }, leave.uid);
      })
      .catch(() => showToast('Errore ferie (controlla regole/permessi).', 'err'));
  };
  const handleDeleteLeave = (id: string) => {
    const lv = teamLeave[id];
    askDelete('Eliminare l\'assenza?', lv ? `${lv.name}: ${lv.type} dal ${lv.dateFrom}` : null, () => {
      if (lv) moveToTrash('ferie', `${lv.name} · ${lv.type}`, lv, undefined, `${lv.dateFrom} → ${lv.dateTo}`);
      setTeamLeave((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`teamLeave/${id}`).catch(() => showToast('Errore ferie (controlla regole/permessi).', 'err'));
    });
  };
  // Auto-compila i campi del progetto dall'anagrafica selezionata (committente solo se vuoto;
  // pIndirizzo NON viene toccato: è l'indirizzo dell'immobile, non la residenza del cliente)
  const applyClientRecord = (rec: ClientRecord | null) => {
    if (!rec) return;
    setPClient(rec.name || '');
    setPCommittente((prev) => prev || rec.name || '');
    // Collegamento automatico al portale: account esplicito in rubrica, oppure match per email
    if (rec.accountUid) {
      setPClientUid(rec.accountUid);
    } else if (rec.email) {
      const match = Object.values(users).find(
        (u: any) => u.role === 'cliente' && (u.email || '').toLowerCase() === rec.email!.toLowerCase()
      );
      if (match) setPClientUid(match.uid);
    }
  };
  const handleSaveInlineClient = () => {
    const d = ncDraft;
    const name = (d.type === 'azienda' ? (d.companyName || d.name) : (d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim())) || '';
    if (!name.trim()) { showToast('Inserisci nome/ragione sociale del cliente.', 'err'); return; }
    const id = `cli-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const rec: ClientRecord = {
      id,
      category: 'cliente',
      type: (d.type as any) || 'privato',
      name: name.trim(),
      firstName: d.firstName || null,
      lastName: d.lastName || null,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      codiceFiscale: d.codiceFiscale || null,
      companyName: d.companyName || null,
      partitaIva: d.partitaIva || null,
      pec: d.pec || null,
      sdi: d.sdi || null,
      accountUid: d.accountUid || null,
      notes: null,
      createdBy: currentUser?.uid || 'admin',
      createdAt: Date.now()
    };
    handleSaveClient(rec);
    setPClientRecordId(id);
    applyClientRecord(rec);
    setNewRubricaOpen(false);
    setNcDraft({ type: 'privato' });
    showToast('Cliente aggiunto alla rubrica.');
  };

  // 4. Chat messages
  const handleSendClientMessage = (projId: string, text: string) => {
    const mId = `msg-${Date.now()}`;
    const newMsg: ProjectMessage = {
      id: mId,
      from: currentUser?.uid || 'admin',
      role: currentUser?.role || 'admin',
      name: currentUser?.name || 'Progettista',
      text: text.trim(),
      at: Date.now()
    };

    setProjectMessages(prev => {
      const prjMsgs = { ...(prev[projId] || {}) };
      prjMsgs[mId] = newMsg;
      const next = { ...prev, [projId]: prjMsgs };
      return next;
    });
    // Scrittura mirata del singolo messaggio (regole: create consentito anche al cliente)
    writeNode(`projectMessages/${projId}/${mId}`, newMsg).catch(() => {});
  };

  // Elimina un proprio messaggio entro 60s dall'invio ("unsend"; finestra imposta
  // anche dalle regole per cliente/partner). Niente cestino: rimozione diretta.
  const handleDeleteProjectMessage = (projId: string, msgId: string) => {
    const m = projectMessages[projId]?.[msgId];
    if (!m || m.from !== currentUser?.uid) return;
    setProjectMessages(prev => {
      const prjMsgs = { ...(prev[projId] || {}) };
      delete prjMsgs[msgId];
      return { ...prev, [projId]: prjMsgs };
    });
    removeNode(`projectMessages/${projId}/${msgId}`).catch(() => showToast('Messaggio non più eliminabile.', 'err'));
  };

  // 5. User accounts additions
  const handleCreateUser = () => {
    if (!nuName.trim() || !nuEmail.trim()) {
      showToast('Compila nome ed email!', 'err');
      return;
    }

    const nUid = `u-${Date.now()}`;
    const newUser: UserProfile = {
      uid: nUid,
      name: nuName.trim(),
      email: nuEmail.trim(),
      role: nuRole,
      title: nuTitle.trim() || undefined,
      functions: nuFns.length ? nuFns : undefined,
      active: true,
      createdAt: Date.now()
    };

    setUsers(prev => {
      const next = { ...prev, [nUid]: newUser };
      syncState('users', next);
      return next;
    });

    showToast('Nuovo collaboratore inserito!');
    setNewUserOpen(false);
  };

  /** Apre "Il mio profilo" precaricando i campi modificabili. */
  const openProfile = () => {
    setProfName(currentUser?.name || '');
    setProfPhone(currentUser?.telefono || '');
    setProfRes(currentUser?.residenza || '');
    setProfileOpen(true);
  };

  /** Salva i dati personali del proprio profilo (nome, telefono, residenza). */
  const handleSaveOwnProfile = () => {
    if (!currentUser) return;
    if (!profName.trim()) {
      showToast('Il nome non può essere vuoto.', 'err');
      return;
    }
    const updated: UserProfile = {
      ...currentUser,
      name: profName.trim(),
      telefono: profPhone.trim() || undefined,
      residenza: profRes.trim() || undefined
    };
    setUsers(prev => {
      const next = { ...prev, [currentUser.uid]: { ...(prev[currentUser.uid] || updated), ...updated } };
      syncState('users', next);
      return next;
    });
    setCurrentUser(updated);
    // aggiorna anche la directory pubblica (nome visibile nei portali)
    if (isStudioRole(currentUser.role)) {
      writeNode(`directory/${currentUser.uid}`, { name: updated.name, role: updated.role }).catch(() => {});
    }
    showToast('Profilo aggiornato.');
    setProfileOpen(false);
  };

  /** Modifica iscritto da TeamView: dati anagrafici, mansioni e ruolo (il manager non può promuovere admin). */
  const handleSaveEditUser = () => {
    if (!editUserId) return;
    const u = users[editUserId];
    if (!u) return;
    if (!nuName.trim()) {
      showToast('Il nome non può essere vuoto.', 'err');
      return;
    }
    // vincolo ruoli: solo l'admin può assegnare il ruolo admin (riflesso anche nelle regole DB)
    const role: UserRole = nuRole === 'admin' && currentUser?.role !== 'admin' ? u.role : nuRole;
    const isPortal = role === 'cliente' || role === 'partner';
    const updated: UserProfile = {
      ...u,
      name: nuName.trim(),
      telefono: nuPhone.trim() || undefined,
      role,
      title: nuTitle.trim() || undefined,
      functions: nuFns.length ? nuFns : undefined,
      active: isPortal ? false : nuActive,
      // RBAC: salva solo se assegnato e per ruoli interni; altrimenti fallback al ruolo
      access: !isPortal && nuAccess && Object.keys(nuAccess).length > 0 ? nuAccess : undefined,
    };
    setUsers(prev => {
      const next = { ...prev, [editUserId]: updated };
      syncState('users', next);
      return next;
    });
    // directory pubblica per i portali (nome/ruolo dei membri studio)
    if (!isPortal) writeNode(`directory/${editUserId}`, { name: updated.name, role: updated.role }).catch(() => {});
    showToast('Dati iscritto aggiornati.');
    setEditUserOpen(false);
    setEditUserId(null);
  };

  const handleCreateClient = () => {
    if (!nuName.trim() || !nuEmail.trim()) {
      showToast('Compila nome ed email!', 'err');
      return;
    }

    const nUid = `u-${Date.now()}`;
    const nextRole = nuRole === 'partner' ? 'partner' : 'cliente';
    const nextSector = nuRole === 'partner' ? 'partner' : (nuTitle as any || 'studio');

    const newClient: UserProfile = {
      uid: nUid,
      name: nuName.trim(),
      email: nuEmail.trim(),
      role: nextRole,
      sector: nextSector,
      title: nextRole === 'partner' ? 'Partner B2B (Fornitore)' : `Cliente Portale ${nextSector === 'strategico' ? 'Strategico' : nextSector === 'materico' ? 'Materico' : 'Studio'}`,
      active: true,
      createdAt: Date.now()
    };

    setUsers(prev => {
      const next = { ...prev, [nUid]: newClient };
      syncState('users', next);
      return next;
    });

    showToast(nextRole === 'partner' ? 'Nuovo partner B2B registrato!' : 'Nuova anagrafica cliente inserita con successo!');
    setNewClientOpen(false);
  };

  // 6. Finances log moves
  const handleCreateMovement = () => {
    if (!fnDesc.trim() || !fnAmount) {
      showToast('Compila descrizione e importo!', 'err');
      return;
    }

    const amt = parseFloat(fnAmount.replace(/,/g, '.'));
    if (isNaN(amt)) {
      showToast('Importo numerico non valido!', 'err');
      return;
    }

    const mId = `mov-${Date.now()}`;
    const newM: FinanceMovement = {
      id: mId,
      kind: fnKind,
      desc: fnDesc.trim(),
      amount: amt,
      date: fnDate || todayISO(),
      category: fnCat,
      note: fnNote.trim() || null,
      projectId: finCtx === 'studio' ? (fnProjLink || null) : finCtx,
      by: currentUser?.uid || 'admin',
      at: Date.now()
    };

    setFinances(prev => {
      const next = { ...prev, [mId]: newM };
      syncState('finance', next);
      return next;
    });

    showToast('Movimento di bilancio registrato.');
    setFinOpen(false);
  };

  const handleDeleteMovement = (id: string) => {
    const m = finances[id];
    askDelete('Eliminare il movimento?', m ? `"${m.desc}" · ${eur(m.amount)}` : null, () => {
      if (m) moveToTrash('movimenti', m.desc || 'Movimento', m, undefined, `${m.kind} · ${eur(m.amount)}`);
      setFinances(prev => {
        const next = { ...prev };
        delete next[id];
        syncState('finance', next);
        return next;
      });
      showToast('Movimento spostato nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Contabilità di commessa: scritture sui nodi finanza
  // strutturati (fatture attive/passive, scadenze). Stessa
  // fonte di FinanzeView → confluiscono nel consolidato.
  // ----------------------------------------------------
  type FinNode = 'finInvoicesActive' | 'finInvoicesPassive' | 'finScadenze';
  const finStateFor = (node: FinNode): [any[], (v: any[]) => void] =>
    node === 'finInvoicesActive' ? [finInvoicesActive, setFinInvoicesActive] :
    node === 'finInvoicesPassive' ? [finInvoicesPassive, setFinInvoicesPassive] :
    [finScadenze, setFinScadenze];

  const handleSaveFinanceItem = (node: FinNode, item: any) => {
    const [arr, setArr] = finStateFor(node);
    const next = [...arr.filter((x: any) => x.id !== item.id), item];
    setArr(next);
    writeNode(node, next).catch((e: any) =>
      showToast('Errore salvataggio (permessi?): ' + (e?.message || e?.code || ''), 'err')
    );
    showToast('Registrato in contabilità di commessa.');
  };

  const handleDeleteFinanceItem = (node: FinNode, id: string) => {
    const [arr, setArr] = finStateFor(node);
    const item = arr.find((x: any) => x.id === id);
    const section = node === 'finInvoicesActive' ? 'fatture_attive' : node === 'finInvoicesPassive' ? 'fatture_passive' : 'scadenze';
    const label = item
      ? (node === 'finInvoicesActive' ? `Fattura ${item.id} · ${item.clientName || ''}`
        : node === 'finInvoicesPassive' ? `Fattura ${item.id} · ${item.supplierName || ''}`
        : `${item.desc || 'Scadenza'} · ${item.clientOrSupplier || ''}`)
      : 'Voce contabile';
    askDelete('Eliminare la voce contabile?', `${label} (${eur(Number(item?.amount) || 0)})`, () => {
      if (item) moveToTrash(section, label, item, undefined, eur(Number(item.amount) || 0));
      const next = arr.filter((x: any) => x.id !== id);
      setArr(next);
      writeNode(node, next).catch(() => {});
      showToast('Voce spostata nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Servizio core finance.record + commesse interne (intercompany)
  // Vedi docs/SCHEMA-COMMESSE-INTERNE.md §1/§3.
  // ----------------------------------------------------
  /** Bridge unico verso la finanza: scrive un movimento e ritorna l'id creato. */
  const financeRecord = (input: FinanceRecordInput): string => {
    const today = new Date().toISOString().slice(0, 10);
    const date = input.date || today;
    const dueDate = input.dueDate || date;
    const projectName = input.projectId ? (projects[input.projectId]?.name || '') : '';
    const inter = !!input.counterpartySector;
    if (input.kind === 'active') {
      const id = `${COMPANY_INVOICE_PREFIX[input.sector]}-${Date.now()}-${Math.floor(Math.random() * 900)}`;
      const inv: InvoiceActive = {
        id, clientName: input.counterparty || '', projectId: input.projectId || '', projectName,
        amount: input.amount, taxRate: input.taxRate ?? 0, cassaPct: input.cassaPct ?? null,
        status: 'bozza', sdiCode: '', date, dueDate, sector: input.sector,
        internalOrderId: input.internalOrderId || null, counterpartySector: input.counterpartySector || null, intercompany: inter,
      };
      handleSaveFinanceItem('finInvoicesActive', inv);
      return id;
    }
    if (input.kind === 'passive') {
      const id = `FP-${Date.now()}-${Math.floor(Math.random() * 900)}`;
      const inv: InvoicePassive = {
        id, supplierName: input.counterparty || '', projectId: input.projectId || '', projectName,
        amount: input.amount, category: inter ? 'Commessa interna' : 'Costo',
        status: 'ricevuta', date, dueDate, sector: input.sector, description: input.description,
        internalOrderId: input.internalOrderId || null, counterpartySector: input.counterpartySector || null, intercompany: inter,
      };
      handleSaveFinanceItem('finInvoicesPassive', inv);
      return id;
    }
    const id = `SC-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const sca: ScadenzaItem = {
      id, kind: 'uscita', desc: input.description, clientOrSupplier: input.counterparty || '',
      amount: input.amount, dueDate, status: 'pago_attesa', projectId: input.projectId || undefined, sector: input.sector,
      internalOrderId: input.internalOrderId || null, counterpartySector: input.counterpartySector || null, intercompany: inter,
    };
    handleSaveFinanceItem('finScadenze', sca);
    return id;
  };

  /** Scrive la COPPIA intercompany di una commessa interna: costo (committente) + ricavo (fornitore). */
  const recordIntercompany = (order: InternalOrder): { costInvoiceId: string; revenueInvoiceId: string } => {
    const desc = `Commessa interna ${order.code} · ${order.title}`;
    const projectId = order.committente.refType === 'project' ? order.committente.refId : undefined;
    const costInvoiceId = financeRecord({
      sector: order.committente.company, kind: 'passive', amount: order.amount, description: desc,
      counterparty: COMPANY_LABEL[order.fornitore.company], date: new Date().toISOString().slice(0, 10),
      dueDate: order.dueDate || undefined, projectId, internalOrderId: order.id, counterpartySector: order.fornitore.company,
    });
    const revenueInvoiceId = financeRecord({
      sector: order.fornitore.company, kind: 'active', amount: order.amount, description: desc,
      counterparty: COMPANY_LABEL[order.committente.company], date: new Date().toISOString().slice(0, 10),
      dueDate: order.dueDate || undefined, projectId, internalOrderId: order.id, counterpartySector: order.committente.company,
    });
    return { costInvoiceId, revenueInvoiceId };
  };

  /** Prossimo codice progressivo "CI-NNN". */
  const nextInternalOrderCode = (): string => {
    const max = internalOrders.reduce((m, o) => {
      const n = parseInt((o.code || '').replace(/^CI-/, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `CI-${String(max + 1).padStart(3, '0')}`;
  };

  const handleSaveInternalOrder = (order: InternalOrder) => {
    const next = [...internalOrders.filter((o) => o.id !== order.id), { ...order, updatedAt: Date.now() }];
    setInternalOrders(next);
    writeNode('internalOrders', next).catch((e: any) =>
      showToast('Errore commessa interna (regole?): ' + (e?.message || e?.code || ''), 'err'));
  };

  /** Conferma una commessa interna (bozza → confermata): registra la coppia intercompany in finanza. */
  const handleConfirmInternalOrder = (id: string) => {
    const order = internalOrders.find((o) => o.id === id);
    if (!order || order.status !== 'bozza') return;
    if (order.financeRefs?.costInvoiceId) return; // già registrata
    const refs = recordIntercompany(order);
    handleSaveInternalOrder({ ...order, status: 'confermata', financeRefs: refs });
    showToast(`Commessa ${order.code} confermata e registrata in contabilità.`, 'ok');
  };

  const handleDeleteInternalOrder = (id: string) => {
    const order = internalOrders.find((o) => o.id === id);
    askDelete('Eliminare la commessa interna?', order ? `${order.code} · ${order.title} (${eur(order.amount)})` : null, () => {
      if (order) moveToTrash('commessa_interna', `${order.code} · ${order.title}`, order, undefined, eur(order.amount));
      const next = internalOrders.filter((o) => o.id !== id);
      setInternalOrders(next);
      writeNode('internalOrders', next).catch(() => {});
      showToast('Commessa interna spostata nel Cestino.', 'err');
    });
  };

  // ----------------------------------------------------
  // Incentivi & Point system (pointEvents/<uid>/<id>)
  // ----------------------------------------------------
  const handleAddPointEvent = (ev: PointEvent) => {
    const enriched: PointEvent = { ...ev, by: ev.by || currentUser?.uid || null, byName: ev.byName || currentUser?.name || null, createdAt: ev.createdAt || Date.now() };
    setPointEvents((prev) => [...prev.filter((e) => e.id !== ev.id), enriched]);
    writeNode(`pointEvents/${ev.uid}/${ev.id}`, enriched).catch((e: any) =>
      showToast('Errore punti (regole?): ' + (e?.message || e?.code || ''), 'err'));
    // Notifica l'interessato (anche partner)
    pushNotification(ev.uid, {
      type: 'punti',
      title: `${enriched.points >= 0 ? '+' : ''}${enriched.points} punti · ${enriched.label}`,
      body: enriched.note || '',
      link: '#team',
    });
    showToast('Punti assegnati.');
  };
  const handleDeletePointEvent = (uid: string, id: string) => {
    const ev = pointEvents.find((e) => e.id === id);
    askDelete('Eliminare questa assegnazione punti?', ev ? `${ev.points >= 0 ? '+' : ''}${ev.points} · ${ev.label}` : null, () => {
      setPointEvents((prev) => prev.filter((e) => e.id !== id));
      removeNode(`pointEvents/${uid}/${id}`).catch(() => {});
      showToast('Assegnazione eliminata.', 'err');
    });
  };

  // ----------------------------------------------------
  // Preventivi studio (quotes/<id>)
  // ----------------------------------------------------
  const handleSaveQuote = (q: Quote) => {
    const enriched: Quote = { ...q, createdBy: q.createdBy || currentUser?.uid, updatedAt: Date.now() };
    setQuotes((prev) => ({ ...prev, [q.id]: enriched }));
    writeNode(`quotes/${q.id}`, enriched).catch(() => showToast('Errore preventivi (controlla regole).', 'err'));
  };
  const handleDeleteQuote = (id: string) => {
    const q = quotes[id];
    const kindLbl = q?.docKind === 'parcella' ? 'la parcella' : 'il preventivo';
    askDelete(`Eliminare ${kindLbl}?`, q ? `"${q.number}" · ${q.clientName} · ${eur(q.total)}` : null, () => {
      if (q) moveToTrash('preventivi', `${q.docKind === 'parcella' ? 'Parcella' : 'Preventivo'} ${q.number}`, q, undefined, q.clientName);
      setQuotes((prev) => { const n = { ...prev }; delete n[id]; return n; });
      removeNode(`quotes/${id}`).catch(() => showToast('Errore preventivi (controlla regole).', 'err'));
      showToast('Documento spostato nel Cestino.', 'err');
    });
  };
  // Funnel commessa: un PREVENTIVO accettato (senza progetto collegato) genera
  // AUTOMATICAMENTE la "cartella cliente" — un progetto con fasi/task derivati
  // dalle macro-voci — collega il cliente e lo avvisa.
  const MACRO_PHASE: Record<string, string> = {
    progettazione: 'Progettazione', consulenza: 'Consulenza', opere_edili: 'Opere edili',
    impiantistica: 'Impiantistica', materiali: 'Materiali', altro: 'Altro',
  };
  const generateProjectFromQuote = (q: Quote): string => {
    const pid = `p-${Date.now()}`;
    const rec = q.clientRecordId ? clients[q.clientRecordId] : null;
    const clientUid = rec?.accountUid || null;
    // Fasi = macro-voci presenti (ordinate); task = righe di quella macro.
    const order = ['progettazione', 'consulenza', 'opere_edili', 'impiantistica', 'materiali', 'altro'];
    const present = order.filter((m) => (q.lines || []).some((l) => l.macro === m));
    const phases: Record<string, any> = {};
    if (present.length) {
      present.forEach((m, pi) => {
        const phId = `ph-${Date.now()}-${pi}`;
        const tasks: Record<string, any> = {};
        (q.lines || []).filter((l) => l.macro === m).forEach((l, ti) => {
          const tId = `t-${Date.now()}-${pi}-${ti}`;
          tasks[tId] = { id: tId, title: l.desc || MACRO_PHASE[m], order: ti, done: false, role: 'Progettazione' };
        });
        phases[phId] = { id: phId, name: MACRO_PHASE[m] || m, order: pi, tasks };
      });
    } else {
      const phId = `ph-${Date.now()}-0`;
      const tId = `t-${Date.now()}-0`;
      phases[phId] = { id: phId, name: 'Avvio', order: 0, tasks: { [tId]: { id: tId, title: 'Apertura commessa', order: 0, done: false, role: 'Progettazione' } } };
    }
    // Naming "Cliente + Località" quando disponibile (prima parte dell'indirizzo).
    const locality = rec?.address ? rec.address.split(',')[0].trim() : '';
    const proj: Project = {
      id: pid,
      name: locality ? `${q.clientName} — ${locality}` : q.clientName,
      code: `${q.division.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      client: q.clientName,
      clientUid,
      location: rec?.address || null,
      status: 'attivo',
      division: q.division,
      icon: 'folder',
      phases,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects((prev) => {
      const next = autoUpdateProjectsCompletion({ ...prev, [pid]: proj });
      syncState('projects', next);
      return next;
    });
    if (clientUid) {
      setUsers((prev) => {
        const u = prev[clientUid];
        if (!u) return prev;
        const nu = { ...prev, [clientUid]: { ...u, projectIds: { ...(u.projectIds || {}), [pid]: true } } };
        syncState('users', nu);
        return nu;
      });
      pushNotification(clientUid, { type: 'progetto', title: 'Preventivo accettato: progetto attivato', body: `"${proj.name}" è ora un progetto: seguilo dal tuo portale.`, link: `#progetto/${pid}` });
    }
    logAudit('create', 'progetti', proj.name, 'da preventivo accettato');
    return pid;
  };

  // All'accettazione, le righe del preventivo diventano ATTIVITÀ ASSEGNATE al tecnico di riferimento.
  const createTasksFromQuote = (q: Quote, pid: string | null) => {
    const rec = q.clientRecordId ? clients[q.clientRecordId] : null;
    const tecnico = q.tecnicoUid || (rec?.responsabili ? Object.keys(rec.responsabili).filter((u) => rec.responsabili![u])[0] : null) || null;
    const lines = q.lines || [];
    if (!lines.length) return;
    setTasks((prev) => {
      const next: any = { ...prev };
      lines.forEach((l, i) => {
        const tId = `task-q-${q.id}-${i}`;
        next[tId] = { id: tId, title: l.desc || MACRO_PHASE[l.macro] || 'Attività', date: todayISO(), time: null, frequency: 'once', priority: 'media', tipo: MACRO_PHASE[l.macro] || null, assignee: tecnico, assignees: tecnico ? [tecnico] : null, projectId: pid || q.projectId || null, notes: `Da preventivo ${q.number}`, done: false, createdAt: Date.now(), updatedAt: Date.now(), createdBy: currentUser?.uid || '' };
      });
      syncState('tasks', next);
      return next;
    });
    if (tecnico) pushNotification(tecnico, { type: 'task', title: `Nuove attività dal preventivo ${q.number}`, body: `${lines.length} attività · ${q.clientName}`, link: '#calendario' });
  };
  const handleSetQuoteStatus = (id: string, status: Quote['status']) => {
    const q = quotes[id];
    if (!q) return;
    logAudit('update', 'preventivi', `${q.number || 'preventivo'} → ${status}`);
    if (status === 'accettato' && q.docKind !== 'parcella' && !q.projectId) {
      const pid = generateProjectFromQuote(q);
      handleSaveQuote({ ...q, status, projectId: pid });
      createTasksFromQuote(q, pid);
      notifyStudio({ type: 'preventivo', title: `Preventivo accettato: ${q.number}`, body: `${q.clientName} · ${eur(q.total)} · commessa creata`, link: `#progetto/${pid}` });
      showToast('Preventivo accettato: commessa creata + attività assegnate al tecnico.', 'ok');
      return;
    }
    handleSaveQuote({ ...q, status });
    if (status === 'accettato') {
      createTasksFromQuote(q, q.projectId || null);
      notifyStudio({ type: 'preventivo', title: `Preventivo accettato: ${q.number}`, body: `${q.clientName} · ${eur(q.total)}`, link: '#preventivi' });
      showToast('Preventivo accettato: attività assegnate al tecnico.', 'ok');
    }
  };
  const handleArchiveQuote = (id: string, archived: boolean) => {
    const q = quotes[id];
    if (q) handleSaveQuote({ ...q, archived, updatedAt: Date.now() });
  };
  // Genera fattura attiva + scadenza da una rata del piano pagamenti (collegamento a finanza)
  const handleEmitMilestone = (quoteId: string, milestoneId: string) => {
    const q = quotes[quoteId];
    if (!q) return;
    const m = (q.paymentPlan || []).find((x) => x.id === milestoneId);
    if (!m || m.status !== 'da_emettere') return;
    const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    const inv: InvoiceActive = {
      id: invId, clientName: q.clientName, projectId: q.projectId || '', projectName: q.projectId ? (projects[q.projectId]?.name || '') : '',
      amount: m.amount,
      // IVA/cassa ereditate dal preventivo (spuntabili nell'editor)
      taxRate: (q.vatEnabled ?? true) ? (q.vatPct ?? 22) : 0,
      cassaPct: q.cassaEnabled ? (q.cassaPct ?? 4) : null,
      status: 'bozza', sdiCode: '', date: todayISO(), dueDate: m.dueDate || todayISO(), sector: q.division as any
    };
    handleSaveFinanceItem('finInvoicesActive', inv);
    const sca: ScadenzaItem = {
      id: `sca-${Date.now()}-${Math.floor(Math.random() * 900)}`, kind: 'entrata', desc: `${q.number} · ${m.label}`,
      clientOrSupplier: q.clientName, amount: m.amount, dueDate: m.dueDate || todayISO(), status: 'pago_attesa', projectId: q.projectId || undefined, sector: q.division as any
    };
    handleSaveFinanceItem('finScadenze', sca);
    const nextPlan: PaymentMilestone[] = (q.paymentPlan || []).map((x) => (x.id === milestoneId ? { ...x, status: 'fatturato', invoiceId: invId } : x));
    handleSaveQuote({ ...q, paymentPlan: nextPlan });
    showToast('Rata emessa: bozza fattura + scadenza create in Finanze.', 'ok');
  };

  // ----------------------------------------------------
  // ADDITIONAL OVERRIDES & PHASE ACTIONS
  // ----------------------------------------------------
  const handleAddPhase = (projId: string) => {
    const phName = prompt('Inserisci il nome della nuova fase:');
    if (!phName || !phName.trim()) return;

    setProjects(prev => {
      const p = prev[projId];
      if (!p) return prev;
      const next = { ...prev };
      const phId = `ph-${Date.now()}`;
      next[projId].phases[phId] = {
        id: phId,
        name: phName.trim(),
        order: Object.keys(p.phases || {}).length,
        tasks: {}
      };
      syncState('projects', next);
      return next;
    });
    showToast('Fase aggiunta.');
  };

  const handleDeletePhase = (projId: string, phId: string) => {
    const phName = projects[projId]?.phases?.[phId]?.name;
    askDelete('Eliminare la fase?', `"${phName || 'Fase'}" e tutti i suoi task verranno rimossi dal fascicolo.`, () => doDeletePhase(projId, phId), true);
  };
  const doDeletePhase = (projId: string, phId: string) => {
    setProjects(prev => {
      const p = prev[projId];
      if (!p || !p.phases[phId]) return prev;
      const next = { ...prev };
      delete next[projId].phases[phId];
      const updated = autoUpdateProjectsCompletion(next);
      syncState('projects', updated);
      return updated;
    });
    showToast('Fase rimossa.', 'err');
  };

  const handleAddPtask = (projId: string, phId: string) => {
    const taskName = prompt('Inserisci il nome dell’attività:');
    if (!taskName || !taskName.trim()) return;

    setProjects(prev => {
      const p = prev[projId];
      if (!p || !p.phases[phId]) return prev;
      const next = { ...prev };
      const tId = `t-${Date.now()}`;
      next[projId].phases[phId].tasks[tId] = {
        id: tId,
        title: taskName.trim(),
        order: Object.keys(p.phases[phId].tasks || {}).length,
        done: false,
        role: 'Progettazione'
      };
      const updated = autoUpdateProjectsCompletion(next);
      syncState('projects', updated);
      return updated;
    });
    showToast('Attività aggiunta.');
  };

  const handleDeletePtask = (projId: string, phId: string, tId: string) => {
    const tTitle = projects[projId]?.phases?.[phId]?.tasks?.[tId]?.title;
    askDelete('Eliminare l\'attività?', `"${tTitle || 'Attività'}" verrà rimossa dalla fase.`, () => {
      setProjects(prev => {
        const p = prev[projId];
        if (!p || !p.phases[phId] || !p.phases[phId].tasks[tId]) return prev;
        const next = { ...prev };
        delete next[projId].phases[phId].tasks[tId];
        const updated = autoUpdateProjectsCompletion(next);
        syncState('projects', updated);
        return updated;
      });
      showToast('Attività rimossa.', 'err');
    }, true);
  };

  // ----------------------------------------------------
  // GENERAL RENDER DELEGATES
  // ----------------------------------------------------

  // Auth gate: wait for Firebase, then require Google sign-in.
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#161616] animate-spin" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-stone-400">
            Aulico
          </span>
        </div>
      </div>
    );
  }

  if (!gUser) {
    return (
      <LangProvider>
        <AuthFlow gUser={null} onToast={(m, t) => showToast(m, t)} onLogout={handleLogout} />
      </LangProvider>
    );
  }

  // Account creato ma non ancora caricato/approvato
  if (!accountsReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#161616] animate-spin" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-stone-400">
            Verifica accesso…
          </span>
        </div>
      </div>
    );
  }

  // Sessione non ancora attiva (currentUser = profilo approvato CON ruolo).
  // Gli account già attivi/approvati saltano direttamente all'app qui sotto.
  if (!currentUser) {
    const mine = ownProfile;

    // Account rifiutato dall'amministratore
    if (mine?.status === 'rejected') {
      return (
        <div className="min-h-screen bg-[#F5F5F3] p-8 flex flex-col justify-center items-center select-none font-sans">
          <div className="w-full max-w-[440px] mx-auto text-center animate-[popIn_0.35s_ease_both]">
            <h1 className="font-black text-[30px] tracking-tight text-[#161616]">
              Aulico
            </h1>
            <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-7 mt-6 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <b className="text-[16px] text-[#161616]">Accesso non autorizzato</b>
              <p className="text-[13px] text-[#8a8a8a] leading-relaxed">
                Il tuo account non è stato abilitato. Contatta l’amministratore dello studio.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[12px] text-stone-400 font-semibold">
                <User className="w-3.5 h-3.5" /> {gUser.email}
              </div>
              <button onClick={handleLogout} className="btn bg-gray-100 hover:bg-gray-200 border-none text-[#161616] font-bold justify-center mt-3 w-full">
                Esci
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Profilo non ancora completato (primo accesso) → form registrazione/completamento
    if (!mine || !mine.profileComplete) {
      return (
        <LangProvider initialLang={mine?.lang} onPersist={mine ? (l) => updateAccount(gUser.uid, { lang: l }) : undefined}>
          <AuthFlow gUser={gUser} pendingProfile={mine || null} onToast={(m, t) => showToast(m, t)} onLogout={handleLogout} />
        </LangProvider>
      );
    }

    // Profilo completo ma ancora senza ruolo approvato → Team in attesa
    return (
      <div className="min-h-screen bg-[#F5F5F3] p-8 flex flex-col justify-center items-center select-none font-sans">
        <div className="w-full max-w-[440px] mx-auto text-center animate-[popIn_0.35s_ease_both]">
          <h1 className="font-black text-[30px] tracking-tight text-[#161616]">
            Aulico
          </h1>
          <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-7 mt-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <b className="text-[16px] text-[#161616]">Richiesta in attesa di approvazione</b>
            <p className="text-[13px] text-[#8a8a8a] leading-relaxed">
              La tua registrazione come <b>Team</b> è stata inviata. Un responsabile dello studio
              deve approvarti e assegnarti un ruolo. Riprova più tardi.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[12px] text-stone-400 font-semibold">
              <User className="w-3.5 h-3.5" /> {gUser.email}
            </div>
            <button onClick={handleLogout} className="btn bg-gray-100 hover:bg-gray-200 border-none text-[#161616] font-bold justify-center mt-3 w-full">
              Esci
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT/PARTNER PORTAL OVERLAY PATH
  const isPortalRole = currentUser.role === 'cliente' || currentUser.role === 'partner';
  if (isPortalRole) {
    return (
      <LangProvider initialLang={currentUser.lang} onPersist={(l) => updateAccount(currentUser.uid, { lang: l })}>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
            <span className="text-[13px] font-bold text-[#8a8a8a] animate-pulse">Caricamento…</span>
          </div>
        }
      >
      <ClientPortalView
        profile={currentUser}
        projects={Object.values(projects)}
        users={users}
        activePid={clientActivePid || (currentUser.projectIds ? Object.keys(currentUser.projectIds)[0] : null)}
        openPh={clientOpenPh}
        onSetActivePid={setClientActivePid}
        onSetOpenPh={setClientOpenPh}
        onSendClientMessage={handleSendClientMessage}
        onDeleteMessage={handleDeleteProjectMessage}
        onUploadDocument={handleUploadDocument}
        studioMembers={
          Object.keys(directory).length > 0
            ? Object.entries(directory).map(([uid, v]) => ({ uid, name: v.name, role: v.role } as any))
            : Object.values(users).filter((u) => u.role === 'admin' || u.role === 'manager' || u.role === 'staff')
        }
        onRequestAppointment={handleRequestAppointment}
        matericoRequests={Object.values(matericoRequests)}
        onCreateMatericoRequest={handleCreateMatericoRequest}
        onAcceptMatericoOffer={handleAcceptMatericoOffer}
        onSubmitMatericoOffer={handleSubmitMatericoOffer}
        clientRequests={Object.values(clientRequests)}
        onCreateClientRequest={handleCreateClientRequest}
        unicoShowcase={Object.values(unicoShowcase)}
        unicoPositions={Object.values(unicoPositions)}
        mktEvents={Object.values(mktEvents)}
        mktSurveys={Object.values(mktSurveys)}
        mktResponses={mktResponses}
        onRsvpEvent={handleRsvpEvent}
        onSubmitSurvey={handleSubmitSurveyResponse}
        projectMessages={projectMessages}
        documents={documents}
        furnishings={furnishings}
        onSaveFurnishing={handleSaveFurnishing}
        onDeleteFurnishing={handleDeleteFurnishing}
        moodboard3d={moodboard3d}
        onSaveMoodboard3d={handleSaveMoodboard3d}
        myPoints={pointEvents}
        onToast={showToast}
        onLogout={handleLogout}
        estimates={Object.values(estimates)}
        onSaveEstimate={handleSaveEstimate}
        onDeleteEstimate={handleDeleteEstimate}
        cantieri={cantieri}
        cantRapportini={cantRapportini}
        cantPresenze={cantPresenze}
        cantFoto={cantFoto}
        cantMateriali={cantMateriali}
        cantChecklist={cantChecklist}
        cantDocumenti={cantDocumenti}
        cantSal={cantSal}
        cantRecords={cantRecords}
        cantMessages={cantMessages}
        cantLog={cantLog}
        impresaDocs={impresaDocs}
        impresaRecords={impresaRecords}
        onSaveCantEntity={handleSaveCantEntity}
        onDeleteCantEntity={handleDeleteCantEntity}
        onSendCantiereMessage={handleSendCantiereMessage}
        onDeleteCantiereMessage={handleDeleteCantiereMessage}
        onSaveImpresaEntity={handleSaveImpresaEntity}
        onDeleteImpresaEntity={handleDeleteImpresaEntity}
      />
      </React.Suspense>
      {/* Doppia conferma eliminazione anche nel portale cliente/partner */}
      {confirmDel && <ConfirmDeleteModal request={confirmDel} onClose={() => setConfirmDel(null)} />}
      </LangProvider>
    );
  }

  const projectsOfClient = (uid: string) => {
    return Object.values(projects).filter((p: any) => p.clientUid === uid);
  };

  const personalTasksForUser = (uid: string) => {
    const list: any[] = [];
    Object.values(projects).forEach((p: any) => {
      Object.keys(p.phases || {}).forEach(phId => {
        const ph = p.phases[phId];
        Object.keys(ph.tasks || {}).forEach(tId => {
          const t = ph.tasks[tId];
          if (t.assignee === uid) {
            list.push({ ...t, projId: p.id, phaseId: phId });
          }
        });
      });
    });
    return list;
  };

  // Active view content router
  // TeamView riusabile: montata sia dalla route legacy `team` sia dentro Governance → tab "Team & Permessi".
  const renderTeamView = () => (
    <TeamView
      users={users}
      projects={Object.values(projects)}
      peopleTab={peopleTab}
      onSetPeopleTab={setPeopleTab}
      onManageAccess={canManageAccess ? () => setAccessOpen(true) : undefined}
      pendingCount={pendingAccounts.length}
      onNewUser={() => { setNuName(''); setNuEmail(''); setNuPass(''); setNuRole('staff'); setNuTitle(''); setNuFns([]); setNewUserOpen(true); }}
      onNewClient={() => { setNuName(''); setNuEmail(''); setNuPass(''); setNuRole('cliente'); setNuTitle('studio'); setNewClientOpen(true); }}
      onEditUser={(uid) => { const u = users[uid]; if (!u) return; setEditUserId(uid); setNuName(u.name); setNuEmail(u.email); setNuPhone(u.telefono || ''); setNuRole(u.role); setNuTitle(u.title || ''); setNuFns(u.functions || []); setNuActive(u.active !== false); setNuAccess(u.access || {}); setEditUserOpen(true); }}
      onUserMenu={(uid) => { const u = users[uid]; if (!u) return; setEditUserId(uid); setNuName(u.name); setNuEmail(u.email); setNuPhone(u.telefono || ''); setNuRole(u.role); setNuTitle(u.title || ''); setNuFns(u.functions || []); setNuActive(u.active !== false); setNuAccess(u.access || {}); setEditUserOpen(true); }}
      onNav={(r) => { window.location.hash = `#${r}`; }}
      onPreviewClient={(uid) => { const u = users[uid]; if (u) { setCurrentUser(u); setIsPreview(true); } }}
      myUid={currentUser.uid}
      tasks={Object.values(tasks)}
      pointEvents={pointEvents}
      canAssignPoints={canManageAccess}
      onAddPoints={handleAddPointEvent}
      onDeletePoints={handleDeletePointEvent}
      pending={Object.entries(accounts).filter(([, a]: any) => a?.status === 'pending').map(([uid, a]: any) => ({ ...a, uid })) as any}
      canManageAccess={canManageAccess}
      canMakeAdmin={currentUser.role === 'admin'}
      onApproveAccount={(uid, role) => handleApproveAccount(uid, role)}
      onRejectAccount={handleRejectAccount}
      onChangeRole={(uid, role) => handleChangeAccountRole(uid, role)}
      onToggleActive={(uid, active) => updateAccount(uid, { active }).catch(() => showToast('Errore di scrittura.', 'err'))}
      onSaveAccess={(uid, access) => updateAccount(uid, { access: access && Object.keys(access).length ? access : null }).then(() => showToast('Permessi aggiornati.')).catch(() => showToast('Errore: controlla le regole.', 'err'))}
    />
  );

  const renderView = () => {
    switch (route) {
      case 'dashboard':
        return (
          <DashboardView
            profile={currentUser}
            tasks={Object.values(tasks)}
            projects={Object.values(projects)}
            mktProjects={Object.values(mktProjects)}
            users={users}
            appointmentRequests={myApptRequests}
            onConfirmAppointment={handleConfirmAppointment}
            onDeclineAppointment={handleDeclineAppointment}
            messages={liveNotifications}
            onOpenMessage={(id, link) => {
              markNotificationRead(id);
              if (link) window.location.hash = link;
              else if (id.startsWith('apptreq-')) window.location.hash = '#calendario';
            }}
            onNav={(r) => {
              setRoute(r);
              window.location.hash = `#${r}`;
            }}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onNewTask={() => {
              setEditTaskId(null);
              setTTitle('');
              setTDateInput(todayISO());
              setTTimeInput('');
              setTFreq('once');
              setTPrio('media');
              setTTipo('');
              setTActivityId('');
              setTPrivate(false);
              setTAssignees([]);
              setTProjectId('');
              setTNotes('');
              setTaskEditorOpen(true);
            }}
          />
        );

      case 'calendario': {
        const myUidC = currentUser.uid;
        const mineTask = (t: any) => t.assignee === myUidC || (t.assignees || []).includes(myUidC) || t.createdBy === myUidC || t.owner === myUidC;
        const mineAppt = (a: any) => (a.participants ? !!a.participants[myUidC] : a.ownerUid === myUidC);
        return (
          <CalendarView
            /* Agenda personale: società-wide (voci condivise) + le proprie voci private */
            tasks={Object.values(tasks).filter((t) => (t.private ? mineTask(t) : true))}
            projects={Object.values(projects)}
            appointments={Object.values(appointments).filter((a) => (a.private ? mineAppt(a) : true))}
            calView={calView}
            calDate={calDate}
            onSetCalView={setCalView}
            onSetCalDate={setCalDate}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onNewAppointment={handleOpenNewAppointment}
            onConfirmAppointment={handleConfirmAppointment}
            onDeclineAppointment={handleDeclineAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onNewTask={(pDate) => {
              setEditTaskId(null);
              setTTitle('');
              setTDateInput(pDate || todayISO());
              setTTimeInput('');
              setTFreq('once');
              setTPrio('media');
              setTTipo('');
              setTActivityId('');
              setTPrivate(false);
              setTAssignees([]);
              setTProjectId('');
              setTNotes('');
              setTaskEditorOpen(true);
            }}
            myUid={currentUser.uid}
            myName={currentUser.name}
            teamLeave={Object.values(teamLeave)}
            onSaveLeave={handleSaveLeave}
            onDeleteLeave={handleDeleteLeave}
          />
        );
      }

      case 'progetti':
      case 'progetto':
        return (
          <ProjectsView
            projects={Object.values(projects)}
            users={users}
            templates={templates}
            agendaTasks={Object.values(tasks)}
            onToggleAgendaTask={handleToggleTask}
            onEditAgendaTask={handleEditTask}
            route={route}
            param={routeParam}
            divisionFilter={activeDivision}
            setDivisionFilter={setActiveDivision}
            onNav={(r) => {
              const hash = r.startsWith('progetto/') ? r : r;
              window.location.hash = `#${hash}`;
            }}
            onNewProject={handleOpenNewProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onTogglePtask={handleTogglePtask}
            onEditPtask={(pid, ph, tid) => {
              const task = projects[pid].phases[ph].tasks[tid];
              setPtaskPrjId(pid);
              setPtaskPhId(ph);
              setPtaskEditId(tid);
              setPtTitle(task.title);
              setPtRole(task.role || '');
              setPtAssignee(task.assignee || '');
              setPtDue(task.due || '');
              setPtaskOpen(true);
            }}
            onDeletePtask={handleDeletePtask}
            onAddPtask={(pid, ph) => {
              setPtaskPrjId(pid);
              setPtaskPhId(ph);
              setPtaskEditId(null);
              setPtTitle('');
              setPtRole('');
              setPtAssignee('');
              setPtDue('');
              setPtaskOpen(true);
            }}
            onAddPhase={handleAddPhase}
            onDeletePhase={handleDeletePhase}
            onOpenAnagrafica={(pid) => {
              setAnagProjId(pid);
              const p = projects[pid];
              setPCommittente(p?.committente || '');
              setPClient(p?.client || '');
              setPIndirizzo(p?.indirizzoImmobile || '');
              setPLocation(p?.location || '');
              setPVia(p?.via || '');
              setPCivico(p?.civico || '');
              setPCap(p?.cap || '');
              setPComune(p?.comune || p?.location || '');
              setPProvincia(p?.provincia || '');
              setPFoglio(p?.foglio || '');
              setPParticella(p?.particella || '');
              setPSub(p?.sub || '');
              setPCatastali(
                p?.catastali && p.catastali.length
                  ? p.catastali.map((r) => ({ foglio: r.foglio || '', particella: r.particella || '', sub: r.sub || '' }))
                  : [{ foglio: p?.foglio || '', particella: p?.particella || '', sub: p?.sub || '' }]
              );
              setPIntervento(p?.interventoEdilizio || DEFAULT_INTERVENTO);
              setPTitolo(p?.titoloAbilitativo || 'scia');
              setPTipo(p?.tipoIntervento || '');
              setPMarketingBudget(p?.marketingBudget ?? '');
              setPMarketingChannels(p?.marketingChannels ?? '');
              setPMarketingGoal(p?.marketingGoal ?? '');
              setPMatericoEstimatedBudget(p?.matericoEstimatedBudget ?? '');
              setPMatericoFinitureType(p?.matericoFinitureType ?? '');
              setPMatericoSottofondiStatus(p?.matericoSottofondiStatus ?? '');
              setAnagOpen(true);
            }}
            onOpenProjectFinance={(pid) => {
              setFinCtx(pid);
              setFnDesc('');
              setFnAmount('');
              setFnDate(todayISO());
              setFnCat('Studio: Onorari');
              setFnProjLink('');
              setFnNote('');
              setFinOpen(true);
            }}
            onDeleteProjectFinance={(pid, finId) => {
              const m = finances[finId] || (projects[pid]?.finance ? (projects[pid] as any).finance[finId] : null);
              askDelete('Eliminare il movimento?', m ? `"${m.desc}" · ${eur(Number(m.amount) || 0)}` : null, () => {
                if (m) moveToTrash('movimenti', m.desc || 'Movimento', { ...m, id: finId }, undefined, projects[pid]?.name);
                setFinances(prev => {
                  const next = { ...prev };
                  delete next[finId];
                  syncState('finance', next);
                  return next;
                });
                setProjects(prev => {
                  const p = prev[pid];
                  if (!p || !p.finance) return prev;
                  const next = { ...prev };
                  if (next[pid].finance) delete next[pid].finance[finId];
                  syncState('projects', next);
                  return next;
                });
                showToast('Movimento spostato nel Cestino.', 'err');
              });
            }}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onSendClientMessage={handleSendClientMessage}
            onDeleteMessage={handleDeleteProjectMessage}
            projectMessages={projectMessages}
            documents={documents}
            furnishings={furnishings}
            onSaveFurnishing={handleSaveFurnishing}
            onDeleteFurnishing={handleDeleteFurnishing}
            moodboard3d={moodboard3d}
            onSaveMoodboard3d={handleSaveMoodboard3d}
            onToggleStudioManagesMobili={handleToggleStudioManagesMobili}
            isInternalBoss={canAdmin(currentUser, 'strategico')}
            myUid={currentUser.uid}
            finance={Object.values(finances)}
            finComputi={finComputi}
            finInvoicesActive={finInvoicesActive}
            finInvoicesPassive={finInvoicesPassive}
            finScadenze={finScadenze}
            onSaveFinanceItem={handleSaveFinanceItem}
            onDeleteFinanceItem={handleDeleteFinanceItem}
            quotes={quotes}
            priceList={priceList}
            onSaveQuote={handleSaveQuote}
            onDeleteQuote={handleDeleteQuote}
            onSetQuoteStatus={handleSetQuoteStatus}
            onEmitMilestone={handleEmitMilestone}
            onToggleArchiveProject={handleToggleArchiveProject}
            askDelete={askDelete}
            onTrashItem={moveToTrash}
            estimates={Object.values(estimates)}
            onSaveEstimate={handleSaveEstimate}
            onDeleteEstimate={handleDeleteEstimate}
            matericoRequests={Object.values(matericoRequests)}
            matericoSuppliers={crmSuppliers}
            onUpdateMatericoRequest={handleUpdateMatericoRequest}
            onDeleteMatericoRequest={handleDeleteMatericoRequest}
            onApplyMatericoPenalty={handleApplyMatericoPenalty}
            unicoDeals={unicoDeals}
            onSaveUnicoDeals={saveUnicoDeals}
            onNotifyUnicoInvestors={notifyUnicoInvestors}
            internalOrders={internalOrders}
            onConfirmInternalOrder={handleConfirmInternalOrder}
            onDeleteInternalOrder={handleDeleteInternalOrder}
            mktEvents={Object.values(mktEvents)}
            mktCampaigns={Object.values(mktCampaigns)}
            mktSurveys={Object.values(mktSurveys)}
            mktSocial={Object.values(mktSocial)}
            mktResponses={mktResponses}
            onSaveMktEvent={handleSaveMktEvent}
            onDeleteMktEvent={handleDeleteMktEvent}
            onSaveCampaign={handleSaveCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onSaveSurvey={handleSaveSurvey}
            onDeleteSurvey={handleDeleteSurvey}
            onSaveSocialPost={handleSaveSocialPost}
            onDeleteSocialPost={handleDeleteSocialPost}
            mktContracts={Object.values(mktContracts)}
            mktTime={Object.values(mktTime)}
            onSaveMktContract={handleSaveMktContract}
            onDeleteMktContract={handleDeleteMktContract}
            onEmitContractInvoice={handleEmitContractInvoice}
            onSaveMktTimeEntry={handleSaveMktTimeEntry}
            onDeleteMktTimeEntry={handleDeleteMktTimeEntry}
            onBillTimeEntries={handleBillTimeEntries}
            onRegisterCampaignSpend={handleRegisterCampaignSpend}
            onRegisterEventFinance={handleRegisterEventFinance}
            mktAssets={Object.values(mktAssets)}
            mktDeliverables={Object.values(mktDeliverables)}
            mktProofs={Object.values(mktProofs)}
            onSaveMktAsset={handleSaveMktAsset}
            onDeleteMktAsset={handleDeleteMktAsset}
            onSaveMktDeliverable={handleSaveMktDeliverable}
            onDeleteMktDeliverable={handleDeleteMktDeliverable}
            onSaveMktProof={handleSaveMktProof}
            onDeleteMktProof={handleDeleteMktProof}
            mktLeads={Object.values(mktLeads)}
            mktFlows={Object.values(mktFlows)}
            mktSeo={Object.values(mktSeo)}
            mktAds={Object.values(mktAds)}
            mktMetrics={Object.values(mktMetrics)}
            mktInbox={Object.values(mktInbox)}
            mktConsents={Object.values(mktConsents)}
            onSaveMktLead={handleSaveMktLead}
            onDeleteMktLead={handleDeleteMktLead}
            onSaveMktFlow={handleSaveMktFlow}
            onDeleteMktFlow={handleDeleteMktFlow}
            onSaveMktSeo={handleSaveMktSeo}
            onDeleteMktSeo={handleDeleteMktSeo}
            onSaveMktAd={handleSaveMktAd}
            onDeleteMktAd={handleDeleteMktAd}
            onRegisterAdsSpend={handleRegisterAdsSpend}
            onSaveMktMetric={handleSaveMktMetric}
            onDeleteMktMetric={handleDeleteMktMetric}
            onSaveMktInbox={handleSaveMktInbox}
            onDeleteMktInbox={handleDeleteMktInbox}
            onSaveMktConsent={handleSaveMktConsent}
            onDeleteMktConsent={handleDeleteMktConsent}
            mktProjects={Object.values(mktProjects)}
            onSaveMktProject={handleSaveMktProject}
            onDeleteMktProject={handleDeleteMktProject}
            cantieri={cantieri}
            cantRapportini={cantRapportini}
            cantPresenze={cantPresenze}
            cantFoto={cantFoto}
            cantMateriali={cantMateriali}
            cantChecklist={cantChecklist}
            cantDocumenti={cantDocumenti}
            cantSal={cantSal}
            cantLog={cantLog}
            cantRecords={cantRecords}
            cantMessages={cantMessages}
            impresaDocs={impresaDocs}
            impresaRecords={impresaRecords}
            clients={clients}
            onSaveClientRecord={handleSaveClient}
            partnerAccounts={Object.values(accounts).filter((a: any) => a?.role === 'partner' && a?.status === 'approved') as UserProfile[]}
            onSaveCantiere={handleSaveCantiere}
            onDeleteCantiere={handleDeleteCantiere}
            onAssignPartner={handleAssignPartner}
            onSaveCantEntity={handleSaveCantEntity}
            onDeleteCantEntity={handleDeleteCantEntity}
            onSendCantiereMessage={handleSendCantiereMessage}
            onDeleteCantiereMessage={handleDeleteCantiereMessage}
            onSaveImpresaEntity={handleSaveImpresaEntity}
            onDeleteImpresaEntity={handleDeleteImpresaEntity}
            onApproveRapportino={handleApproveRapportino}
            onApproveSal={handleApproveSal}
          />
        );

      case 'finanze':
        return (
          <FinanzeView
            finance={Object.values(finances)}
            projects={Object.values(projects)}
            furnishings={furnishings}
            matericoRequests={Object.values(matericoRequests)}
            unicoDeals={unicoDeals}
            onNewMovement={() => {
              setFinCtx('studio');
              setFnDesc('');
              setFnAmount('');
              setFnDate(todayISO());
              setFnCat('Fattura emessa');
              setFnProjLink('');
              setFnNote('');
              setFinOpen(true);
            }}
            onDeleteMovement={handleDeleteMovement}
            cantieri={cantieri}
            cantSal={cantSal}
            onLinkCantiereSal={handleLinkCantiereSalInvoice}
            quotes={quotes}
            clientRecords={clients}
            myUid={currentUser.uid}
            onSaveQuote={handleSaveQuote}
            onDeleteQuote={handleDeleteQuote}
            onSetQuoteStatus={handleSetQuoteStatus}
            onEmitMilestone={handleEmitMilestone}
            priceList={priceList}
            onSavePriceList={canAnywhere(currentUser, 'operate', 'finance') ? savePriceList : undefined}
            initialTab={finStartTab}
            askDelete={askDelete}
            tasks={Object.values(tasks)}
            members={Object.values(users).filter((u) => u && u.active && u.role !== 'cliente' && u.role !== 'partner')}
            financeSectors={finLock && canView(currentUser, finLock, 'finance') ? [finLock] : (['studio', 'strategico', 'materico', 'unico'] as const).filter((s) => canView(currentUser, s, 'finance'))}
          />
        );

      case 'cestino':
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') return null;
        return (
          <TrashView
            trash={trash}
            onRestore={handleRestoreTrash}
            onDeleteForever={handleTrashDeleteForever}
            projects={projects}
            cantieri={cantieri}
          />
        );

      case 'registro':
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') return null;
        return <AuditView entries={Object.values(auditLog)} onDelete={currentUser.role === 'admin' ? handleDeleteAudit : undefined} />;

      case 'richieste-clienti':
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') return null;
        return (
          <ClientRequestsView
            requests={Object.values(clientRequests)}
            onTakeCharge={handleTakeChargeClientRequest}
            onConvert={handleConvertClientRequest}
            onCloseRequest={handleCloseClientRequest}
            onDelete={handleDeleteClientRequest}
          />
        );

      case 'interactive':
        return <InteractiveView />;

      case 'documenti':
        return (
          <DocumentsView
            documents={documents}
            projects={Object.values(projects)}
            users={users}
            canEdit={currentUser.role !== 'cliente' && currentUser.role !== 'partner'}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onMoveDocument={handleMoveDocument}
          />
        );

      case 'crm':
        return (
          <CrmView
            initialTab={crmStartTab || undefined}
            leads={crmLeads}
            suppliers={crmSuppliers}
            myName={currentUser.name}
            myUid={currentUser.uid}
            onSaveLeads={saveLeads}
            onSaveSuppliers={saveSuppliers}
            onConvertLead={handleConvertLead}
            onRouteLead={handleRouteLead}
            canManageLeads={canOperate(currentUser, 'strategico', 'lead')}
            clients={clients}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onImportClients={canManageAccess ? handleImportClients : undefined}
            onMergeClients={canManageAccess ? handleMergeClients : undefined}
            usersAll={users}
            newsletter={newsletterSubs}
            projects={Object.values(projects)}
            members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff'))}
            quotes={Object.values(quotes)}
            finInvoicesActive={finInvoicesActive}
            finScadenze={finScadenze}
            askDelete={askDelete}
            onTrashItem={moveToTrash}
          />
        );

      case 'team':
        return renderTeamView();

      case 'persona':
        if (routeParam && users[routeParam]) {
          const u = users[routeParam];
          const isClient = u.role === 'cliente';
          const backTo = isClient ? '#team' : '#team';
          const pFns = u.functions || [];

          return (
            <div className="flex flex-col gap-6 text-left">
              <a href={backTo} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8a8a8a] truncate hover:text-[#161616]">
                Indietro a Team
              </a>
              <div className="flex items-center gap-5">
                <span className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-[22px]">
                  {initials(u.name)}
                </span>
                <div>
                  <h2 className="text-[24px] font-black tracking-tight leading-none">{u.name}</h2>
                  <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">{u.email}</p>
                </div>
              </div>

              {isClient ? (
                <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm mt-2">
                  <h3 className="font-bold text-[16px] mb-3">Pratiche collegate</h3>
                  {projectsOfClient(u.uid).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectsOfClient(u.uid).map((p: any) => {
                        const { done, tot } = projTaskCounts(p);
                        const pc = tot ? Math.round((done / tot) * 100) : 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              window.location.hash = `#progetto/${p.id}`;
                            }}
                            className="p-4 rounded-2xl border border-[#f0f0f0] bg-gray-50 hover:bg-[#ececec] transition-colors cursor-pointer flex flex-col gap-2.5"
                          >
                            <b className="text-[14.5px]">{p.name}</b>
                            <div className="w-full h-1 bg-[#ececec] rounded-full overflow-hidden">
                              <div className="h-full bg-[#1b1b1b]" style={{ width: `${pc}%` }} />
                            </div>
                            <span className="text-[11.5px] text-[#8a8a8a]">{pc}% completata</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm italic text-[#8a8a8a]">Nessuna pratica collegata a questo cliente</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap gap-1.5">
                    {pFns.map(f => (
                      <span key={f} className="bg-[#1b1b1b] text-white px-3 py-1 rounded-full text-[11px] uppercase font-bold tracking-wider">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm text-left">
                    <h3 className="text-[16px] font-extrabold text-[#161616] mb-3">Attività in carico</h3>
                    {personalTasksForUser(u.uid).length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {personalTasksForUser(u.uid).map(t => (
                          <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#fafafa] last:border-0">
                            <div>
                              <b className="font-semibold">{t.title}</b>
                              {t.due && <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">Scadenza: {fmtDay(t.due)}</p>}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.done ? 'bg-green-100 text-green-800' : 'bg-orange-105 bg-orange-100 text-orange-800'}`}>
                              {t.done ? 'Chiusa' : 'Aperta'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-[#8a8a8a]">Nessuna attività in carico</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }
        return <p className="text-[13px] text-[#8a8a8a]">Seleziona una persona valida.</p>;

      // --- Aulico V2: dashboard configurabile per società ---
      case 'sdash': {
        const society = getSociety(activeSocieta);
        const sec = society?.sections.find((s) => s.id === activeSection) || society?.sections.find((s) => s.kind === 'dashboard');
        if (society && sec && !canViewSection(currentUser, activeSocieta, sec)) return renderUnauthorized();
        if (!society || !society.dashboard) return <p className="text-[13px] text-[#8a8a8a]">Dashboard non disponibile.</p>;
        const ctx: DashboardCtx = {
          societa: activeSocieta,
          profile: currentUser,
          projects: Object.values(projects),
          tasks: Object.values(tasks),
          appointments: Object.values(appointments),
          clientRequests: Object.values(clientRequests),
          notifications: notifications as any,
          go: (h) => { window.location.hash = h; },
        };
        return <SocietyDashboard spec={society.dashboard} ctx={ctx} societyLabel={society.label} color={society.color} />;
      }

      // --- Aulico V2: sezione standalone (componente dedicato montato dal registry) ---
      case 'sview': {
        const society = getSociety(activeSocieta);
        const sec = society?.sections.find((s) => s.id === activeSection);
        if (!society || !sec) return <p className="text-[13px] text-[#8a8a8a]">Sezione non trovata.</p>;
        if (!canViewSection(currentUser, activeSocieta, sec)) return renderUnauthorized();
        switch (sec.view) {
          // Le sezioni V2 costruite "separate" si registrano qui (un caso per `view`).
          case 'marketing':
            return (
              <MarketingSection
                posts={Object.values(mktSocial)}
                projects={Object.values(mktProjects)}
                color={society.color}
                initialTab={activeSection === 'mkt-strategico' ? 'analisi' : 'calendario'}
                onSavePost={handleSaveSocialPost}
                onDeletePost={handleDeleteSocialPost}
              />
            );
          case 'materico-deals':
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <MatericoDealsView
                  deals={matericoDeals}
                  members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff')).map((u: any) => ({ uid: u.uid, name: u.name }))}
                  clients={Object.values(clients).map((c) => ({ id: c.id, name: c.name }))}
                  listino={Object.values(matericoListino)}
                  color={society.color}
                  canEdit={isStudioRole(currentUser.role)}
                  onSave={handleSaveMatericoDeal}
                  onDelete={handleDeleteMatericoDeal}
                  onGenerateQuote={handleGenerateQuoteFromDeal}
                />
              </React.Suspense>
            );
          case 'materico-listino':
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <MatericoListinoView
                  items={matericoListino}
                  color={society.color}
                  canEdit={isStudioRole(currentUser.role)}
                  onSave={handleSaveMatericoListino}
                  onDelete={handleDeleteMatericoListino}
                />
              </React.Suspense>
            );
          case 'piano-finanziario': {
            const psoc = activeSocieta as string;
            const pid = `${psoc}-${pianoAnno}`;
            const secInv = (arr: any[]) => arr.filter((i: any) => i.sector === psoc);
            const paid = (arr: any[]) => arr.filter((i: any) => i.status === 'pagata' || i.status === 'incassata');
            const secQuotes = Object.values(quotes).filter((q: any) => q.division === psoc);
            const kpi = {
              preventivato: secQuotes.reduce((s: number, q: any) => s + (q.total || 0), 0),
              venduto: secQuotes.filter((q: any) => q.status === 'accettato').reduce((s: number, q: any) => s + (q.total || 0), 0),
              fatturato: secInv(finInvoicesActive).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
              incassato: paid(secInv(finInvoicesActive)).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
              erogato: pointEvents.reduce((s: number, e: any) => s + (e.value || 0), 0),
              liquidita: paid(secInv(finInvoicesActive)).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) - paid(secInv(finInvoicesPassive)).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
            };
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <PianoFinanziarioView piano={pianoFinanziario[pid] || null} soc={psoc} socLabel={society.label} year={pianoAnno} color={society.color} canEdit={isStudioRole(currentUser.role)} onChangeYear={setPianoAnno} onSave={handleSavePiano} kpi={kpi} />
              </React.Suspense>
            );
          }
          case 'commerciale': {
            const psoc = activeSocieta as string;
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <CommercialeView
                  quotes={Object.values(quotes).filter((q: any) => q.division === psoc)}
                  soc={psoc}
                  socLabel={society.label}
                  members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff')).map((u: any) => ({ uid: u.uid, name: u.name }))}
                  color={society.color}
                  canEdit={isStudioRole(currentUser.role)}
                  onSetStatus={handleSetQuoteStatus}
                  onArchive={handleArchiveQuote}
                  onSaveQuote={handleSaveQuote}
                  onOpenEditor={() => { window.location.hash = '#preventivi'; }}
                />
              </React.Suspense>
            );
          }
          case 'prog-fatturazione': {
            const psoc = activeSocieta as string;
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <ProgFatturazioneView
                  items={Object.values(fatturazionePlan).filter((i) => i.soc === psoc)}
                  soc={psoc}
                  socLabel={society.label}
                  clients={Object.values(clients).map((c) => ({ id: c.id, name: c.name }))}
                  color={society.color}
                  canEdit={isStudioRole(currentUser.role)}
                  onSave={handleSaveFatturazione}
                  onDelete={handleDeleteFatturazione}
                  onEmit={handleEmitFatturazione}
                />
              </React.Suspense>
            );
          }
          case 'materico-home':
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <MatericoHomeView
                  deals={Object.values(matericoDeals)}
                  cantieriCount={Object.keys(cantieri).length}
                  contracts={Object.values(matericoContracts)}
                  members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff')).map((u: any) => ({ uid: u.uid, name: u.name }))}
                  color={society.color}
                  onOpen={(h) => { window.location.hash = h; }}
                />
              </React.Suspense>
            );
          case 'materico-mappa': {
            const dealSites = Object.values(matericoDeals).map((dl) => ({ id: `d-${dl.id}`, title: dl.title, subtitle: [dl.clientName, dl.stage].filter(Boolean).join(' · '), address: dl.address || null, lat: dl.lat ?? null, lng: dl.lng ?? null, kind: 'deal' as const, hash: '#materico/potenziale' }));
            const cantSites = Object.values(cantieri).map((ct: any) => { const p: any = projects[ct.projectId]; return { id: `c-${ct.id}`, title: ct.name || 'Cantiere', subtitle: 'Cantiere', address: p?.indirizzoImmobile || null, lat: null, lng: null, kind: 'cantiere' as const, hash: ct.projectId ? `#progetto/${ct.projectId}` : null }; });
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <MatericoMappaView sites={[...cantSites, ...dealSites]} color={society.color} onOpen={(h) => { window.location.hash = h; }} />
              </React.Suspense>
            );
          }
          case 'materico-contracts':
            return (
              <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
                <MatericoContractsView
                  contracts={matericoContracts}
                  deals={Object.values(matericoDeals)}
                  partners={Object.values(clients).filter((c) => c.roles?.impresa || c.roles?.fornitore).map((c) => ({ id: c.id, name: c.name }))}
                  color={society.color}
                  canEdit={isStudioRole(currentUser.role)}
                  onSave={handleSaveMatericoContract}
                  onDelete={handleDeleteMatericoContract}
                />
              </React.Suspense>
            );
          case 'governance':
            return (
              <GovernanceView
                org={governanceOrg}
                sops={governanceSop}
                members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff')).map((u: any) => ({ uid: u.uid, name: u.name }))}
                color={society.color}
                canEdit={currentUser.role === 'admin' || currentUser.role === 'manager'}
                onSaveNode={handleSaveOrgNode}
                onDeleteNode={handleDeleteOrgNode}
                onSeed={handleSeedOrg}
                onSaveSop={handleSaveSop}
                onDeleteSop={handleDeleteSop}
                mansionari={governanceMansionari}
                onSaveMansionario={handleSaveMansionario}
                onDeleteMansionario={handleDeleteMansionario}
                vault={governanceVault}
                vaultConfig={vaultConfig}
                onSaveVaultEntry={handleSaveVaultEntry}
                onDeleteVaultEntry={handleDeleteVaultEntry}
                onSetVaultConfig={handleSetVaultConfig}
                teamSlot={renderTeamView()}
                onNav={(h) => { window.location.hash = h; }}
              />
            );
          default:
            return <SectionPlaceholder section={sec} societyLabel={society.label} color={society.color} />;
        }
      }

      // --- Aulico V2: portale sotto-categoria = DASHBOARD dedicata (tab della pillbar) ---
      case 'sportal': {
        const society = getSociety(activeSocieta);
        const sec = society?.sections.find((s) => s.id === activeSection);
        if (!society || !sec) return <p className="text-[13px] text-[#8a8a8a]">Sezione non trovata.</p>;
        if (!canViewSection(currentUser, activeSocieta, sec)) return renderUnauthorized();
        // Il portale "Risorse Umane" di Strategico ha come dashboard l'agenda HR dedicata.
        if (activeSection === 'hr' && activeSocieta === 'strategico') {
          const hrMembers = Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff')).map((u: any) => ({ uid: u.uid, name: u.name }));
          return (
            <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico l'agenda…</div>}>
              <HrAgendaView events={hrEvents} members={hrMembers} canEdit={currentUser.role === 'admin' || currentUser.role === 'manager'} color={society.color} onSave={handleSaveHrEvent} onDelete={handleDeleteHrEvent} />
            </React.Suspense>
          );
        }
        // La Home di Materico mostra il cruscotto dedicato (§1 del processo Materico).
        if (activeSection === 'home' && activeSocieta === 'materico') {
          return (
            <React.Suspense fallback={<div className="text-[13px] text-[#8a8a8a] p-8 text-center">Carico…</div>}>
              <MatericoHomeView
                deals={Object.values(matericoDeals)}
                cantieriCount={Object.keys(cantieri).length}
                contracts={Object.values(matericoContracts)}
                members={Object.values(users).filter((u: any) => u && (u.role === 'admin' || u.role === 'manager' || u.role === 'staff')).map((u: any) => ({ uid: u.uid, name: u.name }))}
                color={society.color}
                onOpen={(h) => { window.location.hash = h; }}
              />
            </React.Suspense>
          );
        }
        const ctx: DashboardCtx = {
          societa: activeSocieta,
          profile: currentUser,
          projects: Object.values(projects),
          tasks: Object.values(tasks),
          appointments: Object.values(appointments),
          clientRequests: Object.values(clientRequests),
          go: (h) => { window.location.hash = h; },
        };
        return <SocietyDashboard spec={DEFAULT_DASHBOARD} ctx={ctx} societyLabel={sec.label} color={society.color} />;
      }

      // --- Aulico V2: sezione dichiarata ma non ancora costruita ---
      case 'splaceholder': {
        const society = getSociety(activeSocieta);
        const sec = society?.sections.find((s) => s.id === activeSection);
        if (!society || !sec) return <p className="text-[13px] text-[#8a8a8a]">Sezione non trovata.</p>;
        if (!canViewSection(currentUser, activeSocieta, sec)) return renderUnauthorized();
        return <SectionPlaceholder section={sec} societyLabel={society.label} color={society.color} />;
      }

      default:
        return <p className="text-[13px] text-[#8a8a8a]">Sezione in arrivo.</p>;
    }
  };

  /** Redirect soft verso la prima sezione consentita (accesso diretto non autorizzato). */
  const renderUnauthorized = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-[14px] font-bold text-[#161616]">Non hai accesso a questa sezione.</p>
        <button
          onClick={() => { window.location.hash = firstAuthorizedHash(currentUser); }}
          className="mt-3 btn btn-primary rounded-xl py-2 px-4 bg-[#1b1b1b] text-white font-bold cursor-pointer"
        >
          Vai a una sezione consentita
        </button>
      </div>
    </div>
  );

  const formattedMobileTitle = () => {
    if (route === 'interactive') return 'Premium UI';
    if (route === 'progetto' && routeParam && projects[routeParam]) return projects[routeParam].name;
    const item = ['dashboard', 'calendario', 'progetti', 'documenti', 'finanze', 'team'].find(r => r === route);
    return item ? item : 'Aulico';
  };

  // Controllo accessi (admin)
  const isAdmin = currentUser.role === 'admin';
  // Gestione accessi (approvazione Team): admin e manager.
  // RBAC: gestione accessi = "admin" sulla holding (per i legacy = admin|manager).
  const canManageAccess = canAdmin(currentUser, 'holding');
  const pendingAccounts = Object.values(accounts).filter((a: any) => a?.status === 'pending') as UserProfile[];
  const approvedAccounts = Object.values(accounts).filter((a: any) => a?.status === 'approved') as UserProfile[];

  // Richieste appuntamento in attesa dirette a ME (per notifiche + dashboard)
  const myApptRequests = Object.values(appointments).filter((a) =>
    a.participants
      ? a.participants[currentUser.uid] === 'pending'
      : a.ownerUid === currentUser.uid && a.status === 'pending'
  );
  const apptRequestNotifs = myApptRequests.map((a) => ({
    id: `apptreq-${a.id}`,
    title: a.participants ? 'Invito appuntamento' : 'Richiesta appuntamento',
    text: a.participants
      ? `${a.createdByName || 'Un collega'} ti ha invitato: "${a.title}" il ${a.date}${a.time ? ' alle ' + a.time : ''}. Conferma dal calendario o dalla dashboard.`
      : `${a.createdByName || 'Un cliente'} ha richiesto un appuntamento il ${a.date}${a.time ? ' alle ' + a.time : ''}${a.note ? ' — ' + a.note : ''}.`,
    time: 'Da confermare',
    read: false,
    apptDate: a.date
  }));
  const liveNotifications = [
    ...apptRequestNotifs,
    ...notifications.map((n) => ({
      id: n.id,
      title: n.title,
      text: n.body || '',
      time: new Date(n.at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      read: n.read,
      link: n.link
    }))
  ];

  // Contesto "portale": se la sezione attiva è una sotto-categoria (group) o una
  // sua voce, mostriamo la pillbar (Dashboard + voci) sopra il contenuto.
  const groupCtx = (() => {
    const society = getSociety(activeSocieta);
    const sec = society?.sections.find((s) => s.id === activeSection);
    if (!society || !sec) return null;
    let group: SectionConfig | undefined;
    if (sec.kind === 'group') group = sec;
    else if (sec.parent) {
      const par = society.sections.find((s) => s.id === sec.parent);
      if (par?.kind === 'group') group = par;
    }
    if (!group) return null;
    const children = society.sections.filter((c) => c.parent === group!.id && canViewSection(currentUser, activeSocieta, c));
    const tabs = [
      { id: group.id, label: group.dashLabel || 'Dashboard', icon: group.dashLabel ? CalendarDays : LayoutGrid },
      ...children.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
    ];
    return { tabs, activeId: activeSection, slug: societaSlug(activeSocieta) };
  })();

  return (
    <div className="shell flex h-screen select-none bg-[#F5F5F3] relative min-h-0">
      {/* Sidebar Aulico (widescreen) — guidata dalle autorizzazioni */}
      <AulicoSidebar
        profile={currentUser}
        activeSocieta={activeSocieta}
        activeSection={activeSection}
        badges={{
          'holding:agenda': Object.values(tasks).filter((t: any) => sameDay(t.date, todayISO()) && !t.done).length,
          'studio:richieste': Object.values(clientRequests).filter((r) => r.status === 'inviata').length,
        }}
        onNav={(h) => { window.location.hash = h; }}
        onOpenProfile={openProfile}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        {/* Responsive Mobile Nav Bar */}
        <Navbar
          route={route}
          profile={currentUser}
          onNav={(r) => {
            setRoute(r);
            window.location.hash = `#${r}`;
          }}
          onOpenProfile={openProfile}
          title={formattedMobileTitle()}
          notificationsCount={liveNotifications.filter(n => !n.read).length}
          onNotificationsClick={() => setNotificationsOpen(!notificationsOpen)}
          pendingCount={0}
          actionButton={
            route === 'progetti' && !(activeDivision === 'strategico' && (currentUser.role === 'admin' || currentUser.role === 'manager')) ? (
              <button onClick={() => handleOpenNewProject(activeDivision)} className="w-[38px] h-[38px] rounded-full bg-[#1b1b1b] text-white flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform" aria-label="Nuovo progetto">
                <Plus className="w-4.5 h-4.5" />
              </button>
            ) : undefined
          }
        />

        {/* Widescreen topbar details header */}
        <div className="hidden md:flex items-center justify-between gap-4 px-[30px] pt-4 pb-2 text-left relative">
          <div className="min-w-0 flex-1">
            {/* Removed current section title: "togli i testi inerenti alla sezione dove ci troviamo" */}
          </div>

          <div className="flex items-center gap-3">
            {route === 'progetti' && !(activeDivision === 'strategico' && (currentUser.role === 'admin' || currentUser.role === 'manager')) && (
              <button
                onClick={() => handleOpenNewProject(activeDivision)}
                className="btn btn-primary btn-sm rounded-xl py-1.5 px-3 flex items-center gap-1.5 cursor-pointer font-bold bg-[#1b1b1b] hover:bg-black text-white hover:shadow-md"
              >
                <Plus className="w-4 h-4" /> Nuovo progetto
              </button>
            )}

            {/* Gestione accessi spostata in Risorse Umane → Team & Permessi (TeamView) */}

            {/* Notification Bell (Widescreen) */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#e2e2e2] text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer active:scale-95"
                title="Notifiche"
              >
                <Bell className="w-4.5 h-4.5" />
                {liveNotifications.some(n => !n.read) && (
                  <span className="absolute top-[6px] right-[6px] w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Desktop Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[340px] bg-white border border-[#ececec] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                      <span className="font-extrabold text-[13.5px] text-[#161616]">
                        Centro Notifiche ({liveNotifications.filter(n => !n.read).length})
                      </span>
                      {notifications.some(n => !n.read) && (
                        <button
                          onClick={() => {
                            markAllNotificationsRead();
                            showToast('Tutte le notifiche segnate come lette.');
                          }}
                          className="text-[11px] font-extrabold text-indigo-650 hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Segna come lette
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                      {liveNotifications.length > 0 ? (
                        liveNotifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if ((n as any).apptDate) {
                                setCalDate(new Date((n as any).apptDate));
                                setCalView('day');
                                setNotificationsOpen(false);
                                window.location.hash = 'calendario';
                                return;
                              }
                              if ((n as any).link) { window.location.hash = String((n as any).link).replace(/^#/, ''); }
                              setNotificationsOpen(false);
                              markNotificationRead(n.id);
                            }}
                            className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer relative ${
                              n.read
                                ? 'bg-transparent border-gray-100 opacity-60'
                                : 'bg-indigo-50/20 border-indigo-100 hover:bg-indigo-50/40'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-[12px] text-[#161616] leading-tight pr-2">{n.title}</h4>
                              <span className="text-[9px] font-bold text-gray-400 shrink-0 mt-0.5">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-605 mt-1 leading-normal">{n.text}</p>
                            {!n.read && (
                              <span className="absolute top-3.5 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400">
                          Nessuna notifica al momento.
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="border-t border-gray-100 pt-2.5 mt-2.5 flex justify-center">
                        <button
                          onClick={() => {
                            clearNotifications();
                            showToast('Le notifiche sono state cancellate.');
                          }}
                          className="text-[11px] font-extrabold text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
                        >
                          Svuota notifiche
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>


          </div>
        </div>

        {/* Mobile Notification Drawer */}
        {notificationsOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex items-end justify-center">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setNotificationsOpen(false)} />
            <div className="relative bg-white w-full rounded-t-3xl max-h-[80vh] p-5 flex flex-col shadow-2xl z-20 animate-in slide-in-from-bottom duration-250 select-none text-left">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-[16px] text-[#161616]">Notifiche</h3>
                <div className="flex items-center gap-3">
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={() => {
                        markAllNotificationsRead();
                        showToast('Tutte le notifiche segnate come lette.');
                      }}
                      className="text-[12px] font-extrabold text-indigo-650 bg-transparent border-none cursor-pointer"
                    >
                      Leggi tutte
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[11px] font-extrabold cursor-pointer hover:bg-gray-200 border-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2.5 pb-6">
                {liveNotifications.length > 0 ? (
                  liveNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if ((n as any).apptDate) {
                          setCalDate(new Date((n as any).apptDate));
                          setCalView('day');
                          setNotificationsOpen(false);
                          window.location.hash = 'calendario';
                          return;
                        }
                        if ((n as any).link) { window.location.hash = String((n as any).link).replace(/^#/, ''); }
                        setNotificationsOpen(false);
                        markNotificationRead(n.id);
                      }}
                      className={`p-3 rounded-xl border transition-all relative ${
                        n.read 
                          ? 'bg-transparent border-gray-100 opacity-60' 
                          : 'bg-indigo-50/20 border-indigo-100'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-[12.5px] text-[#161616] leading-tight pr-2">{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11.5px] text-gray-605 mt-1 leading-normal">{n.text}</p>
                      {!n.read && (
                        <span className="absolute top-4 right-3 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-sm text-[#8a8a8a]">
                    Nessuna notifica al momento.
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 pt-3 flex justify-center bg-white">
                  <button
                    onClick={() => {
                      clearNotifications();
                      showToast('Le notifiche sono state cancellate.');
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-none py-1"
                  >
                    Svuota notifiche
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable primary content viewer */}
        <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch px-4 py-4 md:px-[30px] md:pb-[140px] pb-[120px]">
          {/* Pillbar sotto-categorie (portale): Dashboard + voci dell'area */}
          {groupCtx && (
            <GroupTabBar
              tabs={groupCtx.tabs}
              activeId={groupCtx.activeId}
              onSelect={(id) => { window.location.hash = `#${groupCtx.slug}/${id}`; }}
            />
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, scale: 0.994, filter: 'blur(3px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.997 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {/* Le viste sono lazy (code-splitting per route): Suspense mostra il loader al primo accesso */}
              <React.Suspense fallback={<ViewLoader />}>
                {renderView()}
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ----------------------------------------------------
          GLOBAL DISPATCH REUSABLE MODALS
          ---------------------------------------------------- */}

      {/* 1. Profile Manager Modal */}
      <Modal title="Il mio profilo" isOpen={profileOpen} onClose={() => setProfileOpen(false)}>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {initials(currentUser.name)}
          </span>
          <div className="min-w-0">
            <b className="block text-[18px] font-black text-[#161616] leading-none truncate">{currentUser.name}</b>
            <small className="block text-[12px] text-[#8a8a8a] font-semibold mt-1 truncate">{currentUser.email}</small>
            <span className="inline-block mt-1.5 text-[9.5px] font-extrabold uppercase tracking-wider bg-[#f0f0f0] border border-[#e2e2e2] text-[#6b6b6b] px-2 py-0.5 rounded-full">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-left">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Nome e cognome</span>
            <input value={profName} onChange={(e) => setProfName(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Telefono</span>
              <input value={profPhone} onChange={(e) => setProfPhone(e.target.value)} placeholder="+39…" className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Residenza</span>
              <input value={profRes} onChange={(e) => setProfRes(e.target.value)} placeholder="Via, civico, città" className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Mansioni associate</span>
            <div className="flex flex-wrap gap-1.5">
              {(currentUser.functions && currentUser.functions.length ? currentUser.functions : []).map(f => (
                <span key={f} className="text-[10px] bg-slate-100 rounded-full py-0.5 px-2.5 font-extrabold text-gray-800">
                  {f}
                </span>
              ))}
              {(!currentUser.functions || currentUser.functions.length === 0) && (
                <span className="text-[11.5px] italic text-[#9a9a9a]">Nessuna mansione assegnata (le gestisce l'amministrazione da Team).</span>
              )}
            </div>
          </div>

          <button onClick={handleSaveOwnProfile} className="py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none w-full mt-1">
            Salva dati personali
          </button>

          {/* Gestione accessi spostata in Risorse Umane → Team & Permessi */}

          <button onClick={handleLogout} className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-bold text-[13px] cursor-pointer w-full mt-2">
            Esci dall'account
          </button>
        </div>
      </Modal>

      {/* 1b. Gestione Accessi (admin e manager) */}
      {canManageAccess && (
        <Modal title="Gestione accessi" isOpen={accessOpen} onClose={() => setAccessOpen(false)} wide>
          <AccessRequests
            pending={pendingAccounts}
            members={approvedAccounts}
            currentUid={currentUser.uid}
            onApprove={handleApproveAccount}
            onReject={handleRejectAccount}
            onChangeRole={handleChangeAccountRole}
            onRevoke={handleRevokeAccount}
            onRemove={handleRemoveAccount}
          />
        </Modal>
      )}

      {/* 1c. Nuovo appuntamento (multi-partecipante: team + clienti + partner) */}
      <Modal title="Nuovo appuntamento" isOpen={apptOpen} onClose={() => setApptOpen(false)}>
        <div className="flex flex-col gap-3 text-left">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Titolo *</span>
            <input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" placeholder="Sopralluogo, riunione…" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Data *</span>
              <input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ora</span>
              <input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Con</span>
            {/* chips dei selezionati */}
            {apptWho.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {apptWho.map((uid) => (
                  <button
                    key={uid}
                    onClick={() => setApptWho((prev) => prev.filter((u) => u !== uid))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#161616] text-white text-[11.5px] font-bold cursor-pointer border-none"
                    title="Rimuovi"
                  >
                    {uid === currentUser.uid ? 'Io' : users[uid]?.name || 'Utente'}
                    <X className="w-3 h-3 opacity-70" />
                  </button>
                ))}
              </div>
            )}
            <input
              value={apptWhoFilter}
              onChange={(e) => setApptWhoFilter(e.target.value)}
              className="input border border-[#e2e2e2] rounded-xl h-9 px-3 text-[13px]"
              placeholder="Cerca persona… (team, clienti, partner)"
            />
            <div className="max-h-44 overflow-y-auto border border-[#e2e2e2] rounded-xl divide-y divide-[#f3f3f3] bg-white">
              {(() => {
                const q = apptWhoFilter.trim().toLowerCase();
                const roleOrder: Record<string, number> = { admin: 0, manager: 0, staff: 0, cliente: 1, partner: 2 };
                const people = Object.values(users)
                  .filter((u) => u.status === 'approved' && u.role && (!q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)))
                  .sort((a, b) => (a.uid === currentUser.uid ? -1 : b.uid === currentUser.uid ? 1 : (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3) || (a.name || '').localeCompare(b.name || '')));
                if (people.length === 0) return <div className="px-3 py-2.5 text-[12px] italic text-[#9a9a9a]">Nessuna persona trovata.</div>;
                return people.map((u) => {
                  const sel = apptWho.includes(u.uid);
                  const tag = u.uid === currentUser.uid ? 'io' : u.role === 'cliente' ? 'cliente' : u.role === 'partner' ? 'partner' : 'team';
                  return (
                    <button
                      key={u.uid}
                      onClick={() => setApptWho((prev) => (sel ? prev.filter((x) => x !== u.uid) : [...prev, u.uid]))}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 cursor-pointer border-none text-left transition-colors ${sel ? 'bg-[#f5f5f3]' : 'bg-white hover:bg-[#fafafa]'}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-[#161616] border-[#161616] text-white' : 'border-[#d4d4d4] bg-white'}`}>
                          {sel && <Check className="w-3 h-3" />}
                        </span>
                        <span className="text-[13px] font-semibold text-[#161616] truncate">{u.uid === currentUser.uid ? `Io (${currentUser.name})` : u.name}</span>
                      </span>
                      <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${tag === 'cliente' ? 'bg-sky-50 text-sky-700' : tag === 'partner' ? 'bg-orange-50 text-orange-700' : 'bg-[#f0f0f0] text-[#6b6b6b]'}`}>
                        {tag}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
            <span className="text-[11px] text-[#9a9a9a]">L'appuntamento comparirà nel calendario di tutti i partecipanti, che dovranno confermare.</span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Note</span>
            <textarea value={apptNote} onChange={(e) => setApptNote(e.target.value)} rows={2} className="input border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" />
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-[13.5px] font-semibold text-[#333]">
            <input type="checkbox" checked={apptPrivate} onChange={(e) => setApptPrivate(e.target.checked)} className="w-4 h-4 accent-[#161616]" />
            Personale (solo io) — impegno privato, non condiviso in agenda
          </label>

          <button onClick={handleSubmitAppointment} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">
            Crea appuntamento
          </button>
        </div>
      </Modal>

      {/* 2. Agenda Task Editor Modal */}
      <Modal
        title={editTaskId ? 'Modifica impegno' : 'Nuovo impegno'}
        isOpen={taskEditorOpen}
        onClose={() => setTaskEditorOpen(false)}
      >
        <div className="flex flex-col gap-3 text-left">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Titolo *</span>
            <input
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]"
              placeholder="Es. Sopralluogo via Roma"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Data *</span>
              <input type="date" value={tDateInput} onChange={(e) => setTDateInput(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ora</span>
              <input type="time" value={tTimeInput} onChange={(e) => setTTimeInput(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Priorità</span>
            <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-xl gap-[2px]">
              {([['urgente', 'Urgente'], ['alta', 'Alta'], ['media', 'Media'], ['bassa', 'Bassa']] as const).map(([k, lbl]) => (
                <button
                  key={k}
                  onClick={() => setTPrio(k)}
                  className={`flex-1 text-[12px] font-bold px-2 py-1.5 rounded-lg cursor-pointer border-none transition-all ${
                    tPrio === k
                      ? k === 'urgente' ? 'bg-rose-600 text-white' : k === 'alta' ? 'bg-orange-500 text-white' : k === 'media' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      : 'bg-transparent text-[#8a8a8a] hover:text-[#161616]'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ricorrenza</span>
              <select value={tFreq} onChange={(e: any) => setTFreq(e.target.value)} className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]">
                <option value="once">Una volta</option>
                <option value="daily">Giornaliero</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Tipologia</span>
              <input
                value={tTipo}
                onChange={(e) => setTTipo(e.target.value)}
                list="task-tipi"
                placeholder="Rilievo, Computo…"
                className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]"
              />
              <datalist id="task-tipi">
                {['Rilievo', 'Progetto 3D', 'Computo', 'Pratica edilizia', 'Sopralluogo', 'Render', 'Consegna', 'Riunione'].map((t) => <option key={t} value={t} />)}
              </datalist>
            </label>
          </div>

          {/* Attività del catalogo punti → punteggio automatico al completamento */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Attività (catalogo punti · auto al completamento)</span>
            <select value={tActivityId} onChange={(e) => setTActivityId(e.target.value)} className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px] bg-white">
              <option value="">Nessuna — punti dalla priorità ({PRIORITY_POINTS[tPrio] ?? 2})</option>
              {catalogFor('team').filter((a) => a.id !== 'manual').map((a) => (
                <option key={a.id} value={a.id}>{a.label} · {a.points >= 0 ? '+' : ''}{a.points} pt · {eur(activityValue(a))}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-[13.5px] font-semibold text-[#333]">
            <input type="checkbox" checked={tPrivate} onChange={(e) => setTPrivate(e.target.checked)} className="w-4 h-4 accent-[#161616]" />
            Personale (solo io) — non compare nell'agenda condivisa della squadra
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Assegna a (anche più persone)</span>
            {tAssignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tAssignees.map((uid) => (
                  <button
                    key={uid}
                    onClick={() => setTAssignees((prev) => prev.filter((u) => u !== uid))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#161616] text-white text-[11.5px] font-bold cursor-pointer border-none"
                    title="Rimuovi"
                  >
                    {uid === currentUser.uid ? 'Io' : users[uid]?.name || 'Utente'}
                    <X className="w-3 h-3 opacity-70" />
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-36 overflow-y-auto border border-[#e2e2e2] rounded-xl divide-y divide-[#f3f3f3] bg-white">
              {Object.values(users)
                .filter((u: any) => u.role && u.role !== 'cliente' && u.role !== 'partner' && u.status === 'approved')
                .sort((a: any, b: any) => (a.uid === currentUser.uid ? -1 : b.uid === currentUser.uid ? 1 : (a.name || '').localeCompare(b.name || '')))
                .map((u: any) => {
                  const sel = tAssignees.includes(u.uid);
                  return (
                    <button
                      key={u.uid}
                      onClick={() => setTAssignees((prev) => (sel ? prev.filter((x) => x !== u.uid) : [...prev, u.uid]))}
                      className={`w-full flex items-center gap-2 px-3 py-2 cursor-pointer border-none text-left transition-colors ${sel ? 'bg-[#f5f5f3]' : 'bg-white hover:bg-[#fafafa]'}`}
                    >
                      <span className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-[#161616] border-[#161616] text-white' : 'border-[#d4d4d4] bg-white'}`}>
                        {sel && <Check className="w-3 h-3" />}
                      </span>
                      <span className="text-[13px] font-semibold text-[#161616] truncate">{u.uid === currentUser.uid ? `Io (${currentUser.name})` : u.name}</span>
                    </button>
                  );
                })}
            </div>
            <span className="text-[11px] text-[#9a9a9a]">Senza selezione il task resta personale. Il task compare nel calendario di tutti gli assegnatari.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Collega a pratica</span>
            {!tProjectId && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span><b>Vuoi collegare una pratica?</b> Il task comparirà anche nel fascicolo del progetto.</span>
              </div>
            )}
            <select
              value={tProjectId}
              onChange={(e) => setTProjectId(e.target.value)}
              className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]"
            >
              <option value="">— Pratica libera —</option>
              {Object.values(projects).filter((p: any) => !p.archived).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code || 'ARC'})</option>
              ))}
            </select>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Note o appunti</span>
            <textarea
              value={tNotes}
              onChange={(e) => setTNotes(e.target.value)}
              rows={2}
              className="input border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none"
              placeholder="Dettagli sull'attività…"
            />
          </label>

          <div className="flex justify-between gap-2 mt-1">
            {editTaskId && (
              <button onClick={handleDeleteTask} className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-bold text-[13px] cursor-pointer">
                Rimuovi
              </button>
            )}
            <button onClick={handleSaveTask} className="flex-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">
              {editTaskId ? 'Salva modifiche' : 'Crea impegno'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. New Project Creator Modal */}
      <Modal title={`Nuova commessa — ${DIVISION_META[pDivision].label}`} isOpen={newProjOpen} onClose={() => setNewProjOpen(false)} wide>
        {/* Settore selezionato: il modale si adatta alla divisione scelta in Progetti */}
        <div
          className="flex items-center gap-3 mb-4 p-3 rounded-2xl border"
          style={{ borderColor: `${DIVISION_META[pDivision].color}33`, background: `${DIVISION_META[pDivision].color}0d` }}
        >
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shrink-0"
            style={{ background: DIVISION_META[pDivision].color }}
          >
            {DIVISION_META[pDivision].label}
          </span>
          <span className="text-[12px] text-[#555] font-medium">{DIVISION_META[pDivision].desc}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          <div className="flex flex-col gap-3">
            {pDivision === 'studio' ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-bold text-[#8a8a8a] uppercase tracking-wider block">Categorie di lavorazione</span>
                  <span className="text-[10px] font-bold text-[#8a8a8a]">{pCategorie.length} sel.</span>
                </div>
                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {STUDIO_CATEGORIE_BY_FASE.map(group => {
                    const allSel = group.categorie.every(c => pCategorie.includes(c));
                    return (
                      <div key={group.fase} className="border border-[#ececec] rounded-2xl p-3 bg-[#fafafa]/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#161616]">{group.fase}</span>
                          <button
                            type="button"
                            onClick={() => setPCategorie(prev => allSel ? prev.filter(c => !group.categorie.includes(c)) : Array.from(new Set([...prev, ...group.categorie])))}
                            className="text-[10px] font-bold text-[#8a8a8a] hover:text-[#161616] bg-transparent border-none cursor-pointer"
                          >
                            {allSel ? 'Deseleziona' : 'Tutte'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {group.categorie.map(cat => (
                            <label key={cat} className="flex items-center gap-2 text-[12.5px] text-[#333] cursor-pointer py-0.5">
                              <input type="checkbox" checked={pCategorie.includes(cat)} onChange={() => toggleCategoria(cat)} />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
            <span className="text-[12px] font-bold text-[#8a8a8a] uppercase tracking-wider block mb-1">Seleziona Template Standard</span>
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {Object.values(templates)
                .filter((t: any) => {
                  if (pDivision === 'strategico') return t.id === 'marketing-strategico';
                  if (pDivision === 'materico') return t.id === 'fornitura-materico';
                  if (pDivision === 'unico') return t.id === 'concept-unico';
                  return !['marketing-strategico', 'fornitura-materico', 'concept-unico'].includes(t.id);
                })
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setPTmplPicked(t.id)}
                    type="button"
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      pTmplPicked === t.id ? 'bg-[#1b1b1b]/10 border-[#1b1b1b]' : 'bg-white border-[#ececec] hover:bg-[#fafafa]'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#161616] text-white flex items-center justify-center flex-shrink-0">
                      <Folder className="w-4 h-4" />
                    </span>
                    <div>
                      <b className="block text-[13.5px]">{t.name}</b>
                      <small className="text-[#8a8a8a] truncate block max-w-[200px] mt-0.5">{t.desc}</small>
                    </div>
                  </button>
                ))
              }
              <button
                onClick={() => setPTmplPicked('__blank__')}
                type="button"
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  pTmplPicked === '__blank__' ? 'bg-[#1b1b1b]/10 border-[#1b1b1b]' : 'bg-white border-[#ececec] hover:bg-[#fafafa]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl border border-[#ececec] text-[#a8a8a8] flex items-center justify-center flex-shrink-0">
                  +
                </div>
                <div>
                  <b className="block text-[13.5px]">Vuoto</b>
                  <small className="text-[#a8a8a8] block mt-0.5">Nessuna fase caricata</small>
                </div>
              </button>
            </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Nome della commessa</label>
              <input value={pName} onChange={(e) => setPName(e.target.value)} className="input mt-1" placeholder="Es. Villa Saracena - Carovigno" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Codice Pratica</label>
              <input value={pCode} onChange={(e) => setPCode(e.target.value)} className="input mt-1 font-mono" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Cliente (rubrica)</label>
                <select
                  value={pClientRecordId}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__new__') { setNewRubricaOpen(true); return; }
                    setPClientRecordId(v);
                    applyClientRecord(clients[v] || null);
                  }}
                  className="select mt-1"
                >
                  <option value="">— Nessuno (digita a fianco) —</option>
                  {Object.values(clients).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.type === 'azienda' && c.companyName ? c.companyName : c.name}{c.partitaIva ? ` · P.IVA ${c.partitaIva}` : c.codiceFiscale ? ` · ${c.codiceFiscale}` : ''}
                    </option>
                  ))}
                  <option value="__new__">➕ Nuovo cliente…</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Nome cliente {pClientRecordId && <span className="text-emerald-600 normal-case font-normal">(da rubrica)</span>}</label>
                <input value={pClient} onChange={(e) => setPClient(e.target.value)} className="input mt-1" placeholder="Es. Mario Rossi" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Collega account portale <span className="text-gray-400 normal-case font-normal">(facoltativo)</span></label>
              <select value={pClientUid} onChange={(e) => setPClientUid(e.target.value)} className="select mt-1">
                <option value="">— Nessuno —</option>
                {Object.values(users).filter((u: any) => u.role === 'cliente').map((u: any) => (
                  <option key={u.uid} value={u.uid}>
                    {u.accountType === 'azienda' && u.companyName ? `${u.companyName} — ` : ''}{u.name}{u.email ? ` · ${u.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Indirizzo immobile strutturato (tutte le divisioni) */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold">Indirizzo immobile</label>
              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <input value={pVia} onChange={(e) => setPVia(e.target.value)} placeholder="Via / Piazza" className="input h-9 text-[13px]" />
                <input value={pCivico} onChange={(e) => setPCivico(e.target.value)} placeholder="N. civico" className="input h-9 text-[13px]" />
              </div>
              <div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
                <input value={pCap} onChange={(e) => setPCap(e.target.value)} placeholder="CAP" className="input h-9 text-[13px] font-mono" />
                <input value={pComune} onChange={(e) => setPComune(e.target.value)} placeholder="Comune" className="input h-9 text-[13px]" />
                <input value={pProvincia} onChange={(e) => setPProvincia(e.target.value)} placeholder="Prov." maxLength={2} className="input h-9 text-[13px] uppercase text-center" />
              </div>
            </div>

            {pDivision === 'studio' && (
              <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 flex flex-col gap-3 border-l-[3px]" style={{ borderLeftColor: DIVISION_META.studio.color }}>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#161616] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: DIVISION_META.studio.color }} /> Pratica edilizia</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Tipo di intervento edilizio</label>
                    <select value={pIntervento} onChange={(e) => handleInterventoChange(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                      {INTERVENTI_EDILIZI.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Titolo abilitativo <span className="text-gray-400 normal-case font-normal">(auto)</span></label>
                    <select value={pTitolo} onChange={(e) => setPTitolo(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                      {TITOLI_ABILITATIVI.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Committente</label>
                  <input value={pCommittente} onChange={(e) => setPCommittente(e.target.value)} placeholder="Es. Mario Rossi" className="input text-xs bg-white h-9" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Identificativi catastali</label>
                  <CatastaliEditor rows={pCatastali} onChange={setPCatastali} />
                </div>
                {(() => { const s = studioSummary(pCategorie, pTitolo); return (
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-[#161616] bg-white border border-[#ececec] rounded-xl px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verranno generate <span className="text-emerald-700">{s.fasi} fasi</span> e <span className="text-emerald-700">{s.tasks} task</span> dalla libreria Onirico.
                  </div>
                ); })()}
              </div>
            )}

            {pDivision === 'strategico' && (
              <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 flex flex-col gap-3 border-l-[3px]" style={{ borderLeftColor: DIVISION_META.strategico.color }}>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#161616] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: DIVISION_META.strategico.color }} /> Parametri Marketing</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Budget Campagna (€)</label>
                    <input type="number" value={pMarketingBudget} onChange={(e) => setPMarketingBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 7500" className="input text-xs bg-white h-9" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Canali Primari</label>
                    <input value={pMarketingChannels} onChange={(e) => setPMarketingChannels(e.target.value)} placeholder="Es. Instagram, Meta Ads" className="input text-xs bg-white h-9" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Obiettivo Principale Brand</label>
                  <input value={pMarketingGoal} onChange={(e) => setPMarketingGoal(e.target.value)} placeholder="Es. Lead Generation Masserie Salentine" className="input text-xs bg-white h-9" />
                </div>
              </div>
            )}

            {pDivision === 'materico' && (
              <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 flex flex-col gap-3 border-l-[3px]" style={{ borderLeftColor: DIVISION_META.materico.color }}>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#161616] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: DIVISION_META.materico.color }} /> Forniture e posa</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Est. Forniture (€)</label>
                    <input type="number" value={pMatericoEstimatedBudget} onChange={(e) => setPMatericoEstimatedBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 45000" className="input text-xs bg-white h-9" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Finiture Selezionate</label>
                    <select value={pMatericoFinitureType} onChange={(e) => setPMatericoFinitureType(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                      <option value="">Seleziona...</option>
                      <option value="infissi_minimali">Infissi Minimali di Pregio</option>
                      <option value="pavimenti_resina">Pavimenti in Resina / Cemento</option>
                      <option value="arredo_sartoriale">Arredamento Su Misura</option>
                      <option value="illuminazione">Illuminazione Architetturale</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Stato Sottofondi</label>
                  <select value={pMatericoSottofondiStatus} onChange={(e) => setPMatericoSottofondiStatus(e.target.value)} className="select text-xs bg-white h-9 font-sans">
                    <option value="">Seleziona...</option>
                    <option value="idoneo">Idoneo per posa immediata</option>
                    <option value="da_asseverare">Da asseverare con termo-camera</option>
                    <option value="da_rifare">Da demolire e rifare</option>
                  </select>
                </div>
              </div>
            )}

            {pDivision === 'unico' && (
              <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 flex flex-col gap-1.5 border-l-[3px]" style={{ borderLeftColor: DIVISION_META.unico.color }}>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#161616] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: DIVISION_META.unico.color }} /> Operazione Unico</span>
                <p className="text-[11px] text-[#8a8a8a]">Nessun parametro aggiuntivo: l'operazione immobiliare si configura nel modulo Unico (operazioni & investitori).</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Inizio</label>
                <input type="date" value={pStart} onChange={(e) => setPStart(e.target.value)} className="input mt-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Scadenza</label>
                <input type="date" value={pDue} onChange={(e) => setPDue(e.target.value)} className="input mt-1" />
              </div>
            </div>
            <p className="text-[11px] text-[#9a9a9a] -mt-1">
              Dalla data di inizio i task vengono pianificati in sequenza (durata e ordine delle fasi) e assegnati
              automaticamente al membro con la mansione richiesta più libero.
            </p>

            <button onClick={handleCreateProject} className="btn bg-[#1b1b1b] hover:bg-black text-white font-bold h-11 justify-center mt-2.5">
              {DIVISION_META[pDivision].cta}
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Project Editing Modal */}
      <Modal title="Modifica pratica" isOpen={editProjOpen} onClose={() => setEditProjOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Nome commessa</label>
            <input value={pName} onChange={(e) => setPName(e.target.value)} className="input mt-1" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Codice</label>
            <input value={pCode} onChange={(e) => setPCode(e.target.value)} className="input mt-1 font-mono" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold">Indirizzo immobile</label>
            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <input value={pVia} onChange={(e) => setPVia(e.target.value)} placeholder="Via / Piazza" className="input h-9 text-[13px]" />
              <input value={pCivico} onChange={(e) => setPCivico(e.target.value)} placeholder="N. civico" className="input h-9 text-[13px]" />
            </div>
            <div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
              <input value={pCap} onChange={(e) => setPCap(e.target.value)} placeholder="CAP" className="input h-9 text-[13px] font-mono" />
              <input value={pComune} onChange={(e) => setPComune(e.target.value)} placeholder="Comune" className="input h-9 text-[13px]" />
              <input value={pProvincia} onChange={(e) => setPProvincia(e.target.value)} placeholder="Prov." maxLength={2} className="input h-9 text-[13px] uppercase text-center" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Cliente (rubrica)</label>
              <select
                value={pClientRecordId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') { setNewRubricaOpen(true); return; }
                  setPClientRecordId(v);
                  applyClientRecord(clients[v] || null);
                }}
                className="select mt-1"
              >
                <option value="">— Nessuno (digita a fianco) —</option>
                {Object.values(clients).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'azienda' && c.companyName ? c.companyName : c.name}{c.partitaIva ? ` · P.IVA ${c.partitaIva}` : c.codiceFiscale ? ` · ${c.codiceFiscale}` : ''}
                  </option>
                ))}
                <option value="__new__">➕ Nuovo cliente…</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Nome cliente {pClientRecordId && <span className="text-emerald-600 normal-case font-normal">(da rubrica)</span>}</label>
              <input value={pClient} onChange={(e) => setPClient(e.target.value)} className="input mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Collega account portale <span className="text-gray-400 normal-case font-normal">(facoltativo)</span></label>
            <select value={pClientUid} onChange={(e) => setPClientUid(e.target.value)} className="select mt-1">
              <option value="">— Scollegati —</option>
              {Object.values(users).filter((u: any) => u.role === 'cliente').map((u: any) => (
                <option key={u.uid} value={u.uid}>
                  {u.accountType === 'azienda' && u.companyName ? `${u.companyName} — ` : ''}{u.name}{u.email ? ` · ${u.email}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">Divisione di Afferenza</label>
            <select value={pDivision} onChange={(e) => setPDivision(e.target.value as any)} className="select mt-1 font-bold">
              <option value="studio">STUDIO</option>
              <option value="strategico">STRATEGICO</option>
              <option value="materico">MATERICO</option>
              <option value="unico">UNICO</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[12.5px] font-bold text-[#161616] mb-1">Dati catastali</div>
            <CatastaliEditor rows={pCatastali} onChange={setPCatastali} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold tracking-widest uppercase text-[#8a8a8a]">Note interne studio</label>
            <textarea value={pNotes} onChange={(e) => setPNotes(e.target.value)} className="textarea mt-1 min-h-[80px]" placeholder="Appunti segreti..." />
          </div>

          <div className="flex justify-between gap-2 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={() => handleDeleteProject(editProjId!)} className="btn bg-red-100 hover:bg-red-200 border-none text-red-800 font-bold">
                Elimina pratica
              </button>
              <button
                onClick={() => { handleToggleArchiveProject(editProjId!); setEditProjOpen(false); }}
                className="btn bg-amber-50 hover:bg-amber-100 border-none text-amber-800 font-bold"
              >
                {projects[editProjId!]?.archived ? 'Ripristina da archivio' : 'Archivia pratica'}
              </button>
            </div>
            <input type="button" value="Salva" onClick={handleSaveEditProject} className="btn bg-[#1b1b1b] text-white hover:bg-black font-semibold ml-auto cursor-pointer px-6" />
          </div>
        </div>
      </Modal>

      {/* 5. Phase Creator Modal */}
      <Modal title={phaseEditId ? 'Rinomina fase' : 'Aggiungi fase'} isOpen={phaseOpen} onClose={() => setPhaseOpen(false)}>
        <div className="flex flex-col gap-3 text-left">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Nome macro-fase *</span>
            <input
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]"
              placeholder="Es. Rilievo e stato di fatto"
            />
          </label>
          <span className="text-[11px] text-[#9a9a9a]">La fase viene aggiunta in coda al fascicolo; le attività si aggiungono dopo, dentro la fase.</span>
          <button
            onClick={() => {
              if (!phaseName.trim() || !phasePrjId) return;
              setProjects(prev => {
                const next = { ...prev };
                const phId = phaseEditId || `ph-${Date.now()}`;
                next[phasePrjId].phases[phId] = {
                  id: phId,
                  name: phaseName.trim(),
                  order: phaseEditId ? prev[phasePrjId].phases[phaseEditId].order : Object.keys(prev[phasePrjId].phases || {}).length,
                  tasks: phaseEditId ? prev[phasePrjId].phases[phaseEditId].tasks : {}
                };
                syncState('projects', next);
                return next;
              });
              setPhaseOpen(false);
              showToast('Fase salvata!');
            }}
            className="py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none w-full mt-1"
          >
            Salva fase
          </button>
        </div>
      </Modal>

      {/* 6. Practice Task Activity Modal */}
      <Modal title={ptaskEditId ? 'Modifica attività' : 'Nuova attività'} isOpen={ptaskOpen} onClose={() => setPtaskOpen(false)}>
        <div className="flex flex-col gap-3 text-left">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Attività *</span>
            <input value={ptTitle} onChange={(e) => setPtTitle(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" placeholder="Es. Rilievo droni esterni" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ruolo / Mansione</span>
              <select value={ptRole} onChange={(e) => setPtRole(e.target.value)} className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[13.5px]">
                <option value="">— Nessuno —</option>
                {MANSIONI.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Operatore di riferimento</span>
              <select value={ptAssignee} onChange={(e) => setPtAssignee(e.target.value)} className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[13.5px]">
                <option value="">— Non assegnato —</option>
                {Object.values(users).filter((u: any) => u.role !== 'cliente' && u.role !== 'partner').map((u: any) => (
                  <option key={u.uid} value={u.uid}>{u.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Scadenza</span>
            <input type="date" value={ptDue} onChange={(e) => setPtDue(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
          </label>

          {(!ptDue || !ptAssignee) && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Ogni attività dovrebbe avere <b>scadenza</b> e <b>operatore di riferimento</b>: così entra nel calendario del membro.</span>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Descrizione attività</span>
            <textarea value={ptNote} onChange={(e) => setPtNote(e.target.value)} rows={2} className="input border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" />
          </label>

          <div className="flex justify-between mt-4">
            {ptaskEditId && (
              <button
                onClick={() => {
                  if (ptaskPrjId && ptaskPhId && ptaskEditId) {
                    handleDeletePtask(ptaskPrjId, ptaskPhId, ptaskEditId);
                    setPtaskOpen(false);
                  }
                }}
                className="btn bg-red-50 text-red-800 hover:bg-red-100 border-none"
              >
                Elimina
              </button>
            )}
            <button
              onClick={() => {
                if (!ptTitle.trim() || !ptaskPrjId || !ptaskPhId) return;

                setProjects(prev => {
                  const next = { ...prev };
                  const tId = ptaskEditId || `t-${Date.now()}`;
                  const targetPh = next[ptaskPrjId].phases[ptaskPhId];
                  targetPh.tasks[tId] = {
                    id: tId,
                    title: ptTitle.trim(),
                    order: ptaskEditId ? targetPh.tasks[ptaskEditId].order : Object.keys(targetPh.tasks || {}).length,
                    done: ptaskEditId ? targetPh.tasks[ptaskEditId].done : false,
                    role: ptRole || null,
                    assignee: ptAssignee || null,
                    due: ptDue || null
                  };
                  const updated = autoUpdateProjectsCompletion(next);
                  syncState('projects', updated);
                  return updated;
                });

                setPtaskOpen(false);
                showToast('Attività salvata!');
              }}
              className="btn bg-[#1b1b1b] text-white hover:bg-black font-semibold ml-auto"
            >
              Salva attività
            </button>
          </div>
        </div>
      </Modal>

      {/* 7. Practice Anagrafica Form Details */}
      <Modal title="Pratica & Dati catastali" isOpen={anagOpen} onClose={() => setAnagOpen(false)} wide>
        <div className="flex flex-col gap-4 text-left max-h-[65vh] overflow-y-auto pr-1 font-sans">
          {(!anagProjId || projects[anagProjId]?.division === 'studio' || !projects[anagProjId]?.division) && (
            <>
              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Committente / Intestatario</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-600">Cognome e nome</span>
                    <input value={pCommittente} onChange={(e) => setPCommittente(e.target.value)} placeholder="Es. Mario Rossi" className="input bg-white h-9 text-[13px]" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-600">Ragione sociale / Cliente</span>
                    <input value={pClient} onChange={(e) => setPClient(e.target.value)} placeholder="Es. Rossi Costruzioni srl" className="input bg-white h-9 text-[13px]" />
                  </label>
                </div>
              </div>

              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-2">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Indirizzo immobile</h4>
                <div className="grid grid-cols-[2fr_1fr] gap-2">
                  <input value={pVia} onChange={(e) => setPVia(e.target.value)} placeholder="Via / Piazza" className="input bg-white h-9 text-[13px]" />
                  <input value={pCivico} onChange={(e) => setPCivico(e.target.value)} placeholder="N. civico" className="input bg-white h-9 text-[13px]" />
                </div>
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
                  <input value={pCap} onChange={(e) => setPCap(e.target.value)} placeholder="CAP" className="input bg-white h-9 text-[13px] font-mono" />
                  <input value={pComune} onChange={(e) => setPComune(e.target.value)} placeholder="Comune" className="input bg-white h-9 text-[13px]" />
                  <input value={pProvincia} onChange={(e) => setPProvincia(e.target.value)} placeholder="Prov." maxLength={2} className="input bg-white h-9 text-[13px] uppercase text-center" />
                </div>
              </div>

              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-2">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Dati catastali fabbricato</h4>
                <CatastaliEditor rows={pCatastali} onChange={setPCatastali} />
              </div>

              <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Pratica edilizia</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-600">Tipo di intervento</span>
                    <select value={pIntervento} onChange={(e) => setPIntervento(e.target.value)} className="select bg-white h-9 text-[12.5px]">
                      {INTERVENTI_EDILIZI.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-600">Titolo abilitativo</span>
                    <select value={pTitolo} onChange={(e) => setPTitolo(e.target.value)} className="select bg-white h-9 text-[12.5px]">
                      {TITOLI_ABILITATIVI.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-600">Lavori di progettazione</span>
                  <input value={pTipo} onChange={(e) => setPTipo(e.target.value)} placeholder="Es. Ampliamento residenza, SCIA commerciale..." className="input bg-white h-9 text-[13px]" />
                </label>
              </div>
            </>
          )}

          {anagProjId && projects[anagProjId]?.division === 'strategico' && (
            <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-4">
              <h4 className="text-[14.5px] font-bold flex items-center gap-1 text-[#161616]">Dati Strategia e Campagna (STRATEGICO)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Budget Campagna Allocato (€)</label>
                  <input type="number" value={pMarketingBudget} onChange={(e) => setPMarketingBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 7500" className="input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Canali Attivi Primari</label>
                  <input value={pMarketingChannels} onChange={(e) => setPMarketingChannels(e.target.value)} placeholder="Es. Instagram Feed, Meta Ads" className="input" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Obiettivo Principale Brand</label>
                <input value={pMarketingGoal} onChange={(e) => setPMarketingGoal(e.target.value)} placeholder="Es. Lead Generation Masserie Salentine" className="input" />
              </div>
            </div>
          )}

          {anagProjId && projects[anagProjId]?.division === 'materico' && (
            <div className="bg-[#fafafa] p-4 rounded-2xl border border-[#ececec] flex flex-col gap-4">
              <h4 className="text-[14.5px] font-bold flex items-center gap-1 text-[#161616]">Dati Computo & Store Partner (MATERICO)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">Estimato Forniture (€)</label>
                  <input type="number" value={pMatericoEstimatedBudget} onChange={(e) => setPMatericoEstimatedBudget(e.target.value ? Number(e.target.value) : '')} placeholder="Es. 45000" className="input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-500">Finiture Selezionate</label>
                  <select value={pMatericoFinitureType} onChange={(e) => setPMatericoFinitureType(e.target.value)} className="select">
                    <option value="">Seleziona...</option>
                    <option value="infissi_minimali">Infissi Minimali di Pregio</option>
                    <option value="pavimenti_resina">Pavimenti in Resina / Cemento</option>
                    <option value="arredo_sartoriale">Arredamento Su Misura</option>
                    <option value="illuminazione">Illuminazione Architetturale</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500">Stato Sottofondi</label>
                <select value={pMatericoSottofondiStatus} onChange={(e) => setPMatericoSottofondiStatus(e.target.value)} className="select">
                  <option value="">Seleziona...</option>
                  <option value="idoneo">Idoneo per posa immediata</option>
                  <option value="da_asseverare">Da asseverare con termo-camera</option>
                  <option value="da_rifare">Da demolire e rifare</option>
                </select>
              </div>
            </div>
          )}

          {anagProjId && projects[anagProjId]?.division === 'unico' && (
            <div className="bg-[#fafafa] p-5 rounded-2xl border border-dashed border-[#ececec] text-center">
              <h4 className="text-[14.5px] font-mono font-bold text-gray-400 uppercase">Atelier Unico (UNICO)</h4>
              <p className="text-[11.5px] text-gray-400 italic mt-1">Nessun dato aggiuntivo richiesto per UNICO.</p>
            </div>
          )}

          <button
            onClick={() => {
              if (!anagProjId) return;
              setProjects(prev => {
                const next = { ...prev };
                const div = next[anagProjId]?.division || 'studio';
                const composed = composeAddress(pVia, pCivico, pCap, pComune, pProvincia);
                const catRows = normalizeCatastali(pCatastali);
                next[anagProjId] = {
                  ...next[anagProjId],
                  committente: div === 'studio' ? (pCommittente.trim() || null) : next[anagProjId].committente,
                  client: div === 'studio' ? (pClient.trim() || null) : next[anagProjId].client,
                  indirizzoImmobile: div === 'studio' ? (composed || pIndirizzo.trim() || null) : next[anagProjId].indirizzoImmobile,
                  via: div === 'studio' ? (pVia.trim() || null) : next[anagProjId].via,
                  civico: div === 'studio' ? (pCivico.trim() || null) : next[anagProjId].civico,
                  cap: div === 'studio' ? (pCap.trim() || null) : next[anagProjId].cap,
                  comune: div === 'studio' ? (pComune.trim() || null) : next[anagProjId].comune,
                  provincia: div === 'studio' ? (pProvincia.trim() ? pProvincia.trim().toUpperCase() : null) : next[anagProjId].provincia,
                  location: div === 'studio' ? (pComune.trim() || pLocation.trim() || null) : next[anagProjId].location,
                  foglio: div === 'studio' ? (catRows[0]?.foglio || null) : next[anagProjId].foglio,
                  particella: div === 'studio' ? (catRows[0]?.particella || null) : next[anagProjId].particella,
                  sub: div === 'studio' ? (catRows[0]?.sub || null) : next[anagProjId].sub,
                  catastali: div === 'studio' ? (catRows.length ? catRows : null) : next[anagProjId].catastali,
                  interventoEdilizio: div === 'studio' ? pIntervento : next[anagProjId].interventoEdilizio,
                  titoloAbilitativo: div === 'studio' ? pTitolo : next[anagProjId].titoloAbilitativo,
                  tipoIntervento: div === 'studio' ? (pTipo.trim() || interventoLabel(pIntervento) || null) : next[anagProjId].tipoIntervento,
                  marketingBudget: div === 'strategico' && pMarketingBudget !== '' ? Number(pMarketingBudget) : next[anagProjId].marketingBudget,
                  marketingChannels: div === 'strategico' ? pMarketingChannels : next[anagProjId].marketingChannels,
                  marketingGoal: div === 'strategico' ? pMarketingGoal : next[anagProjId].marketingGoal,
                  matericoEstimatedBudget: div === 'materico' && pMatericoEstimatedBudget !== '' ? Number(pMatericoEstimatedBudget) : next[anagProjId].matericoEstimatedBudget,
                  matericoFinitureType: div === 'materico' ? pMatericoFinitureType : next[anagProjId].matericoFinitureType,
                  matericoSottofondiStatus: div === 'materico' ? pMatericoSottofondiStatus : next[anagProjId].matericoSottofondiStatus,
                };
                syncState('projects', next);
                return next;
              });
              setAnagOpen(false);
              showToast('Dati pratica salvati correttamente!');
            }}
            className="btn bg-[#1b1b1b] text-white hover:bg-black w-full py-2.5 mt-2 justify-center font-bold"
          >
            Salva Dati Pratica
          </button>
        </div>
      </Modal>

      {/* 8. Studio Finance movement modal */}
      <Modal title="Aggiungi movimento contabile" isOpen={finOpen} onClose={() => setFinOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex justify-center bg-gray-100 rounded-xl p-1 mb-2">
            <button
              onClick={() => setFnKind('entrata')}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors ${
                fnKind === 'entrata' ? 'bg-[#1b1b1b] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#1d1d1d]'
              }`}
            >
              Entrata (+)
            </button>
            <button
              onClick={() => setFnKind('uscita')}
              className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors ${
                fnKind === 'uscita' ? 'bg-[#1b1b1b] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#1d1d1d]'
              }`}
            >
              Uscita (−)
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Causale Movimento</label>
            <input value={fnDesc} onChange={(e) => setFnDesc(e.target.value)} className="input mt-1" placeholder="Es. Acconto commissioni progettista..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Importo (€)</label>
              <input value={fnAmount} onChange={(e) => setFnAmount(e.target.value)} className="input mt-1" placeholder="0.00" inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Data operazione</label>
              <input type="date" value={fnDate} onChange={(e) => setFnDate(e.target.value)} className="input mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Categoria</label>
            <select value={fnCat} onChange={(e) => setFnCat(e.target.value)} className="select mt-1">
              {finCtx === 'studio' ? (
                <>
                  <option value="Fattura emessa">Fattura emessa</option>
                  <option value="Acconto">Acconto</option>
                  <option value="Fornitore">Fornitore</option>
                  <option value="Generico">Generico</option>
                  <option value="Tasse/Inarcassa">Tasse/Inarcassa</option>
                </>
              ) : (
                <>
                  <option value="Studio: Onorari">Studio — Onorari/Competenze</option>
                  <option value="Studio: Spese">Studio — Spese di Commessa</option>
                  <option value="Cantiere: Impresa">Cantiere — Impresa Edile</option>
                  <option value="Cantiere: Fornitore">Cantiere — Fornitore/Materiali</option>
                  <option value="Cantiere: Sicurezza">Cantiere — Professionista/Sicurezza</option>
                  <option value="Cantiere: Tasse">Cantiere — Oneri/Tasse comunali</option>
                  <option value="Cantiere: Generico">Cantiere — Generico</option>
                </>
              )}
            </select>
          </div>

          {finCtx === 'studio' && (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Collega a cantiere progetto</label>
              <select value={fnProjLink} onChange={(e) => setFnProjLink(e.target.value)} className="select mt-1">
                <option value="">— Nessuno (Spesa Generale Studio) —</option>
                {Object.values(projects).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Note o estremi fattura</label>
            <input value={fnNote} onChange={(e) => setFnNote(e.target.value)} className="input mt-1" placeholder="Bonifico bancario num..." />
          </div>

          <button onClick={handleCreateMovement} className="btn bg-[#1b1b1b] hover:bg-black text-white w-full py-2.5 mt-3 justify-center font-bold">
            Registra movimento
          </button>
        </div>
      </Modal>

      {/* 9. Unified New Collaborator / Client Modal */}
      <Modal title="Aggiungi Collaboratore" isOpen={newUserOpen} onClose={() => setNewUserOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Nome e cognome</label>
            <input value={nuName} onChange={(e) => setNuName(e.target.value)} className="input mt-1" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold">Email</label>
            <input type="email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} className="input mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Ruolo</label>
              <select value={nuRole} onChange={(e: any) => setNuRole(e.target.value)} className="select mt-1">
                <option value="staff">Operatore Staff</option>
                <option value="manager">Project Manager</option>
                <option value="admin">Amministratore</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold">Titolo / Specializzazione</label>
              <input value={nuTitle} onChange={(e) => setNuTitle(e.target.value)} className="input mt-1" placeholder="Ingegnere, Architetto..." />
            </div>
          </div>

          <button onClick={handleCreateUser} className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-4 justify-center font-bold leading-normal">
            Registra Account Collaboratore
          </button>
        </div>
      </Modal>

      {/* Modifica iscritto (Team): dati, mansioni e ruolo */}
      <Modal title="Modifica iscritto" isOpen={editUserOpen} onClose={() => { setEditUserOpen(false); setEditUserId(null); }}>
        <div className="flex flex-col gap-3 text-left">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Nome e cognome *</span>
            <input value={nuName} onChange={(e) => setNuName(e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Email (accesso)</span>
              <input value={nuEmail} readOnly disabled className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[13px] bg-[#f5f5f3] text-[#8a8a8a]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Telefono</span>
              <input value={nuPhone} onChange={(e) => setNuPhone(e.target.value)} placeholder="+39…" className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ruolo</span>
              <select value={nuRole} onChange={(e: any) => setNuRole(e.target.value)} className="select border border-[#e2e2e2] rounded-xl h-10 px-3 text-[13.5px]">
                <option value="staff">Operatore Staff</option>
                <option value="manager">Project Manager</option>
                <option value="admin" disabled={currentUser.role !== 'admin'}>Amministratore{currentUser.role !== 'admin' ? ' (solo admin)' : ''}</option>
                <option value="cliente">Cliente (portale)</option>
                <option value="partner">Partner (portale)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Titolo / Specializzazione</span>
              <input value={nuTitle} onChange={(e) => setNuTitle(e.target.value)} placeholder="Ingegnere, Architetto…" className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Mansioni (per l'assegnazione automatica dei task)</span>
            <div className="flex flex-wrap gap-1.5">
              {MANSIONI.map((m) => {
                const on = nuFns.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNuFns((prev) => (on ? prev.filter((x) => x !== m) : [...prev, m]))}
                    className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${on ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2] hover:border-[#b0b0b0]'}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {nuRole !== 'cliente' && nuRole !== 'partner' && (
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e2e2e2] cursor-pointer">
              <span className="text-[13px] font-bold text-[#161616]">Account attivo
                <span className="block text-[11px] font-semibold text-[#8a8a8a]">Se disattivato, il membro non vede più i dati dello studio.</span>
              </span>
              <input type="checkbox" checked={nuActive} onChange={(e) => setNuActive(e.target.checked)} />
            </label>
          )}

          {nuRole !== 'cliente' && nuRole !== 'partner' && (
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-[#e2e2e2] bg-[#fafafa]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Permessi per società</span>
                {Object.keys(nuAccess).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNuAccess({})}
                    className="text-[11px] font-bold text-[#b45309] hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Ripristina dal ruolo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#8a8a8a] -mt-1">
                Lascia "Predefinito" per usare i permessi del ruolo. Imposta un livello per dare accesso mirato a una società.
              </p>
              {SOCIETA.map((s) => {
                const cur = nuAccess[s]?.default;
                return (
                  <div key={s} className="grid grid-cols-2 items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-[#161616]">{SOCIETA_LABEL[s]}</span>
                    <select
                      value={cur || ''}
                      onChange={(e) => {
                        const val = e.target.value as AccessLevel | '';
                        setNuAccess((prev) => {
                          const next: AccessMap = { ...prev };
                          if (!val) delete next[s];
                          else next[s] = { ...(next[s] || {}), default: val };
                          return next;
                        });
                      }}
                      className="select border border-[#e2e2e2] rounded-xl h-9 px-2 text-[12.5px] bg-white"
                    >
                      <option value="">Predefinito (dal ruolo)</option>
                      {LEVELS.map((lv) => (
                        <option key={lv} value={lv}>{LEVEL_LABEL[lv]}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={handleSaveEditUser} className="py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none w-full mt-1">
            Salva modifiche
          </button>
        </div>
      </Modal>

      {/* Nuovo cliente in rubrica (inline dal form progetto) */}
      <Modal title="Nuovo cliente (rubrica)" isOpen={newRubricaOpen} onClose={() => setNewRubricaOpen(false)}>
        <div className="flex flex-col gap-3.5 text-left">
          <div className="flex gap-2">
            {(['privato', 'azienda'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNcDraft((d) => ({ ...d, type: t }))}
                className={`flex-1 py-2 rounded-xl text-[13px] font-bold border transition-all ${
                  (ncDraft.type || 'privato') === t ? 'bg-[#1b1b1b] text-white border-[#1b1b1b]' : 'bg-white text-[#333] border-[#e2e2e2] hover:bg-[#fafafa]'
                }`}
              >
                {t === 'privato' ? 'Privato' : 'Azienda'}
              </button>
            ))}
          </div>

          {ncDraft.type === 'azienda' ? (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Ragione sociale</label>
              <input value={ncDraft.companyName || ''} onChange={(e) => setNcDraft((d) => ({ ...d, companyName: e.target.value }))} className="input mt-1" placeholder="Es. Costruzioni Rossi S.r.l." />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Nome</label>
                <input value={ncDraft.firstName || ''} onChange={(e) => setNcDraft((d) => ({ ...d, firstName: e.target.value }))} className="input mt-1" placeholder="Mario" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Cognome</label>
                <input value={ncDraft.lastName || ''} onChange={(e) => setNcDraft((d) => ({ ...d, lastName: e.target.value }))} className="input mt-1" placeholder="Rossi" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Email</label>
              <input type="email" value={ncDraft.email || ''} onChange={(e) => setNcDraft((d) => ({ ...d, email: e.target.value }))} className="input mt-1" placeholder="nome@email.it" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Telefono</label>
              <input value={ncDraft.phone || ''} onChange={(e) => setNcDraft((d) => ({ ...d, phone: e.target.value }))} className="input mt-1" placeholder="+39 …" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold">{ncDraft.type === 'azienda' ? 'Sede legale' : 'Residenza'}</label>
            <input value={ncDraft.address || ''} onChange={(e) => setNcDraft((d) => ({ ...d, address: e.target.value }))} className="input mt-1" placeholder="Via, civico, città" />
          </div>

          {ncDraft.type === 'azienda' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">P. IVA</label>
                <input value={ncDraft.partitaIva || ''} onChange={(e) => setNcDraft((d) => ({ ...d, partitaIva: e.target.value }))} className="input mt-1 font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Codice Fiscale</label>
                <input value={ncDraft.codiceFiscale || ''} onChange={(e) => setNcDraft((d) => ({ ...d, codiceFiscale: e.target.value }))} className="input mt-1 font-mono" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">PEC</label>
                <input value={ncDraft.pec || ''} onChange={(e) => setNcDraft((d) => ({ ...d, pec: e.target.value }))} className="input mt-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold">Codice SDI</label>
                <input value={ncDraft.sdi || ''} onChange={(e) => setNcDraft((d) => ({ ...d, sdi: e.target.value }))} className="input mt-1 font-mono" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold">Codice Fiscale</label>
              <input value={ncDraft.codiceFiscale || ''} onChange={(e) => setNcDraft((d) => ({ ...d, codiceFiscale: e.target.value }))} className="input mt-1 font-mono" />
            </div>
          )}

          <button onClick={handleSaveInlineClient} className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-2 justify-center font-bold leading-normal">
            Salva in rubrica e seleziona
          </button>
        </div>
      </Modal>

      <Modal title="Aggiungi Cliente / Partner B2B" isOpen={newClientOpen} onClose={() => setNewClientOpen(false)}>
        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-gray-700">Cliente o Ragione Sociale</label>
            <input value={nuName} onChange={(e) => setNuName(e.target.value)} className="input mt-1" placeholder="Es. Cliente Rossi o S.p.a. Costruzioni" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-gray-700">Email d'Accesso</label>
            <input type="email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} className="input mt-1" placeholder="nome@portale.com" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-gray-700">Tipologia Account</label>
            <select 
              value={nuRole} 
              onChange={(e) => {
                const val = e.target.value as any;
                setNuRole(val);
                if (val === 'partner') {
                  setNuTitle('partner');
                } else {
                  setNuTitle('studio');
                }
              }} 
              className="input mt-1 bg-white border border-gray-200 py-2 px-3 rounded-lg text-[13.5px] font-medium"
            >
              <option value="cliente">Cliente Portale (B2C/B2B Commessa)</option>
              <option value="partner">Partner B2B (Impresa Partner / Fornitore)</option>
            </select>
          </div>

          {nuRole === 'cliente' && (
            <div className="flex flex-col gap-1 animate-[fadeIn_0.2s_ease_both]">
              <label className="text-[12px] font-bold text-gray-700">Settore / Portale di Riferimento</label>
              <select 
                value={nuTitle} 
                onChange={(e) => setNuTitle(e.target.value)} 
                className="input mt-1 bg-white border border-gray-200 py-2 px-3 rounded-lg text-[13.5px] font-medium"
              >
                <option value="studio">Studio Architettura (Cantieri & Progetti)</option>
                <option value="strategico">Onirico Strategico (Brand, Marketing & Growth)</option>
                <option value="materico">Onirico Materico (Moodboard & Finiture d'Interni)</option>
              </select>
            </div>
          )}

          <button onClick={handleCreateClient} className="btn bg-[#1b1b1b] text-white hover:bg-black w-full mt-4 h-11 justify-center font-bold font-sans">
            Registra nel Database
          </button>
        </div>
      </Modal>

      {/* Doppia conferma eliminazione (condivisa da tutte le sezioni) */}
      {confirmDel && <ConfirmDeleteModal request={confirmDel} onClose={() => setConfirmDel(null)} />}

      {/* Assistente personale AI — bottone flottante su ogni schermata (studio) */}
      <TeamAssistant
        profile={currentUser}
        tasks={Object.values(tasks)}
        projects={Object.values(projects)}
        clients={Object.values(clients || {})}
        financeContext={
          canAnywhere(currentUser, 'view', 'finance')
            ? `fatture attive ${finInvoicesActive.length}, passive ${finInvoicesPassive.length}, scadenze aperte ${finScadenze.filter((s) => s.status !== 'pagato').length}, preventivi ${Object.keys(quotes || {}).length}`
            : undefined
        }
      />

      {/* Render Toast notification */}
      <div className="toast-wrap fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-none flex flex-col gap-2.5 items-center">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast bg-[#161616] text-[#eeeeee] py-3 px-[18px] rounded-full text-[13.5px] font-semibold shadow-lg flex items-center gap-2.5 pointer-events-auto border ${
              t.type === 'err' ? 'bg-red-950 border-red-500' : 'bg-black border-[#2c2c2c]'
            }`}
          >
            {t.type === 'err' ? (
              <span className="text-red-500 font-extrabold font-mono">!</span>
            ) : (
              <span className="text-green-500 font-extrabold">✓</span>
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
