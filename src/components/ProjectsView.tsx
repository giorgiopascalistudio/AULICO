/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Grid,
  List,
  Plus,
  Folder,
  FolderOpen,
  Calendar,
  ArrowLeft,
  Briefcase,
  FileText,
  User,
  Users,
  Building,
  Sparkles,
  MapPin,
  Building2,
  Trash2,
  CheckCircle,
  FileDown,
  Edit,
  Send,
  Upload,
  Eye,
  Layers,
  Wallet,
  SlidersHorizontal,
  Clock,
  Sofa,
  HardHat,
  Archive,
  ArchiveRestore,
  FileSignature,
  Receipt
} from 'lucide-react';
import { Project, UserProfile, FinanceMovement, Template, MatericoEstimate, MatericoRequest, UnicoDeal, Furnishing, Cantiere, Rapportino, Presenza, CantiereFoto, CantiereMateriale, ChecklistItem, CantiereDoc, CantiereSal, CantiereLog, CantiereRecord, CantiereMessage, ImpresaDoc, ImpresaRecord, ClientRecord, Quote, PriceItem, Task, MarketingEvent, Campaign, Survey, SurveyResponse, SocialPost, MktContract, MktTimeEntry, MktAsset, MktDeliverable, MktProof, MktLead, MktFlow, MktSeoItem, MktAdCampaign, MktMetric, MktInboxItem, MktConsent, MktProject, InternalOrder } from '../types';
import { computoTotal, arrediTotals, studioParcella, quoteTotals, Computo, InvoiceActive, InvoicePassive, ScadenzaItem } from '../finance';
import { QuoteEditor, emptyQuoteDraft } from './QuoteEditor';
import { FurnishingsBoard } from './FurnishingsBoard';
import { CantiereBoard } from './CantiereBoard';
import { ChatDeleteButton } from './ChatDeleteButton';
import { eur, fmtDay, isoDate, todayISO, numIt, safeUrl } from '../utils';
import { StatusCard } from './StatusCard';
import { MatericoView } from './MatericoView';
import { UnicoStudioView } from './UnicoStudioView';
import { AiComposeButton } from './AiComposeButton';
import { StrategicoView } from './StrategicoView';
import type { Supplier } from './CrmView';
import { interventoLabel, titoloLabel } from '../studioConfig';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectsViewProps {
  projects: Project[];
  users: Record<string, UserProfile>;
  templates: Record<string, Template>;
  route: string;
  param: string | null;
  onNav: (route: string) => void;
  onNewProject: () => void;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onTogglePtask: (projId: string, phId: string, tId: string) => void;
  onEditPtask: (projId: string, phId: string, tId: string) => void;
  onDeletePtask: (projId: string, phId: string, tId: string) => void;
  onAddPtask: (projId: string, phId: string) => void;
  onAddPhase: (projId: string) => void;
  onDeletePhase: (projId: string, phId: string) => void;
  onOpenAnagrafica: (projId: string) => void;
  onOpenProjectFinance: (projId: string) => void;
  onDeleteProjectFinance: (projId: string, finId: string) => void;
  onUploadDocument: (projId: string, file: File) => void;
  onDeleteDocument: (projId: string, docId: string, path?: string) => void;
  onSendClientMessage: (projId: string, text: string) => void;
  onDeleteMessage?: (projId: string, msgId: string) => void;   // unsend entro 60s
  projectMessages: Record<string, any>;
  documents: Record<string, any>;
  furnishings?: Record<string, Record<string, Furnishing>>;
  onSaveFurnishing?: (pid: string, item: Furnishing) => void;
  onDeleteFurnishing?: (pid: string, itemId: string) => void;
  onToggleStudioManagesMobili?: (pid: string, value: boolean) => void;
  moodboard3d?: Record<string, any>;
  onSaveMoodboard3d?: (pid: string, elements: any[]) => void;
  isInternalBoss: boolean;
  myUid: string;
  finance?: FinanceMovement[];
  // Contabilità di commessa (nodi finanza strutturati condivisi con FinanzeView)
  finComputi?: Computo[];
  finInvoicesActive?: InvoiceActive[];
  finInvoicesPassive?: InvoicePassive[];
  finScadenze?: ScadenzaItem[];
  onSaveFinanceItem?: (node: 'finInvoicesActive' | 'finInvoicesPassive' | 'finScadenze', item: any) => void;
  onDeleteFinanceItem?: (node: 'finInvoicesActive' | 'finInvoicesPassive' | 'finScadenze', id: string) => void;
  // Preventivi & Parcelle della commessa (nodo quotes, condiviso con Finanze → Preventivi)
  quotes?: Record<string, Quote>;
  priceList?: PriceItem[];
  onSaveQuote?: (q: Quote) => void;
  onDeleteQuote?: (id: string) => void;
  onSetQuoteStatus?: (id: string, status: Quote['status']) => void;
  onEmitMilestone?: (quoteId: string, milestoneId: string) => void;
  // Archiviazione progetti
  onToggleArchiveProject?: (pid: string) => void;
  // Task agenda collegati alle pratiche (compaiono nel fascicolo tecnico)
  agendaTasks?: Task[];
  onToggleAgendaTask?: (taskId: string, date: string) => void;
  onEditAgendaTask?: (taskId: string) => void;
  // Doppia conferma + Cestino (modale/nodo condivisi in App; usati dalle sotto-viste)
  askDelete?: (title: string, message: string | null, onConfirm: () => void) => void;
  onTrashItem?: (section: string, label: string, payload: any, meta?: Record<string, string>, detail?: string) => void;
  estimates?: MatericoEstimate[];
  onSaveEstimate?: (est: MatericoEstimate) => void;
  onDeleteEstimate?: (id: string) => void;
  divisionFilter?: 'studio' | 'strategico' | 'materico' | 'unico';
  setDivisionFilter?: (val: 'studio' | 'strategico' | 'materico' | 'unico') => void;
  // Materico — hub operatore (richieste clienti, inoltro partner, offerte) ora dentro Progetti
  matericoRequests?: MatericoRequest[];
  matericoSuppliers?: Supplier[];
  onUpdateMatericoRequest?: (req: MatericoRequest) => void;
  onDeleteMatericoRequest?: (id: string) => void;
  onApplyMatericoPenalty?: (reqId: string) => void;
  unicoDeals?: UnicoDeal[];
  onSaveUnicoDeals?: (deals: UnicoDeal[]) => void;
  onNotifyUnicoInvestors?: (uids: string[], title: string, body: string) => void;
  // Commesse interne (intercompany) generate dalla cascata ROE
  internalOrders?: InternalOrder[];
  onConfirmInternalOrder?: (id: string) => void;
  onDeleteInternalOrder?: (id: string) => void;
  // Modulo Strategico / Marketing (divisione Strategico)
  mktEvents?: MarketingEvent[];
  mktCampaigns?: Campaign[];
  mktSurveys?: Survey[];
  mktSocial?: SocialPost[];
  mktResponses?: Record<string, Record<string, SurveyResponse>>;
  onSaveMktEvent?: (e: MarketingEvent) => void;
  onDeleteMktEvent?: (id: string) => void;
  onSaveCampaign?: (c: Campaign) => void;
  onDeleteCampaign?: (id: string) => void;
  onSaveSurvey?: (s: Survey) => void;
  onDeleteSurvey?: (id: string) => void;
  onSaveSocialPost?: (p: SocialPost) => void;
  onDeleteSocialPost?: (id: string) => void;
  // Strategico — Economia (Blocco A)
  mktContracts?: MktContract[];
  mktTime?: MktTimeEntry[];
  onSaveMktContract?: (k: MktContract) => void;
  onDeleteMktContract?: (id: string) => void;
  onEmitContractInvoice?: (id: string, periodLabel?: string) => void;
  onSaveMktTimeEntry?: (t: MktTimeEntry) => void;
  onDeleteMktTimeEntry?: (id: string) => void;
  onBillTimeEntries?: (ids: string[]) => void;
  onRegisterCampaignSpend?: (id: string) => void;
  onRegisterEventFinance?: (id: string) => void;
  // Strategico — Produzione (Blocco B)
  mktAssets?: MktAsset[];
  mktDeliverables?: MktDeliverable[];
  mktProofs?: MktProof[];
  onSaveMktAsset?: (a: MktAsset) => void;
  onDeleteMktAsset?: (id: string) => void;
  onSaveMktDeliverable?: (d: MktDeliverable) => void;
  onDeleteMktDeliverable?: (id: string) => void;
  onSaveMktProof?: (p: MktProof) => void;
  onDeleteMktProof?: (id: string) => void;
  // Strategico — Acquisizione/Dati/Compliance (Blocchi D–K)
  mktLeads?: MktLead[];
  mktFlows?: MktFlow[];
  mktSeo?: MktSeoItem[];
  mktAds?: MktAdCampaign[];
  mktMetrics?: MktMetric[];
  mktInbox?: MktInboxItem[];
  mktConsents?: MktConsent[];
  onSaveMktLead?: (l: MktLead) => void;
  onDeleteMktLead?: (id: string) => void;
  onSaveMktFlow?: (f: MktFlow) => void;
  onDeleteMktFlow?: (id: string) => void;
  onSaveMktSeo?: (s: MktSeoItem) => void;
  onDeleteMktSeo?: (id: string) => void;
  onSaveMktAd?: (a: MktAdCampaign) => void;
  onDeleteMktAd?: (id: string) => void;
  onRegisterAdsSpend?: (id: string) => void;
  onSaveMktMetric?: (m: MktMetric) => void;
  onDeleteMktMetric?: (id: string) => void;
  onSaveMktInbox?: (i: MktInboxItem) => void;
  onDeleteMktInbox?: (id: string) => void;
  onSaveMktConsent?: (c: MktConsent) => void;
  onDeleteMktConsent?: (id: string) => void;
  // Strategico — Progetti marketing (§22-sex)
  mktProjects?: MktProject[];
  onSaveMktProject?: (p: MktProject) => void;
  onDeleteMktProject?: (id: string) => void;
  // Modulo Cantiere (lato studio)
  cantieri?: Record<string, Cantiere>;
  cantRapportini?: Record<string, Record<string, Rapportino>>;
  cantPresenze?: Record<string, Record<string, Presenza>>;
  cantFoto?: Record<string, Record<string, CantiereFoto>>;
  cantMateriali?: Record<string, Record<string, CantiereMateriale>>;
  cantChecklist?: Record<string, Record<string, ChecklistItem>>;
  cantDocumenti?: Record<string, Record<string, CantiereDoc>>;
  cantSal?: Record<string, Record<string, CantiereSal>>;
  cantLog?: Record<string, Record<string, CantiereLog>>;
  cantRecords?: Record<string, Record<string, CantiereRecord>>;
  cantMessages?: Record<string, Record<string, CantiereMessage>>;
  impresaDocs?: Record<string, Record<string, ImpresaDoc>>;
  impresaRecords?: Record<string, Record<string, ImpresaRecord>>;
  clients?: Record<string, ClientRecord>;
  onSaveClientRecord?: (rec: ClientRecord) => void;   // rubrica: crea/aggiorna impresa o cliente (usato dal Cantiere)
  partnerAccounts?: UserProfile[];
  onSaveCantiere?: (c: Cantiere) => void;
  onDeleteCantiere?: (cid: string) => void;
  onAssignPartner?: (cid: string, uid: string, name: string, on: boolean) => void;
  onSaveCantEntity?: (coll: string, cid: string, item: any) => void;
  onDeleteCantEntity?: (coll: string, cid: string, id: string) => void;
  onSendCantiereMessage?: (cid: string, text: string) => void;
  onDeleteCantiereMessage?: (cid: string, id: string) => void;
  onSaveImpresaEntity?: (coll: string, uid: string, item: any) => void;
  onDeleteImpresaEntity?: (coll: string, uid: string, id: string) => void;
  onApproveRapportino?: (cid: string, id: string, approve: boolean) => void;
  onApproveSal?: (cid: string, id: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  users,
  templates,
  route,
  param,
  onNav,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onTogglePtask,
  onEditPtask,
  onDeletePtask,
  onAddPtask,
  onAddPhase,
  onDeletePhase,
  onOpenAnagrafica,
  onOpenProjectFinance,
  onDeleteProjectFinance,
  onUploadDocument,
  onDeleteDocument,
  onSendClientMessage,
  onDeleteMessage,
  projectMessages,
  documents,
  furnishings = {},
  onSaveFurnishing,
  onDeleteFurnishing,
  onToggleStudioManagesMobili,
  moodboard3d = {},
  onSaveMoodboard3d,
  isInternalBoss,
  myUid,
  finance = [],
  finComputi = [],
  finInvoicesActive = [],
  finInvoicesPassive = [],
  finScadenze = [],
  onSaveFinanceItem,
  onDeleteFinanceItem,
  quotes = {},
  priceList = [],
  onSaveQuote,
  onDeleteQuote,
  onSetQuoteStatus,
  onEmitMilestone,
  onToggleArchiveProject,
  agendaTasks = [],
  onToggleAgendaTask,
  onEditAgendaTask,
  askDelete,
  onTrashItem,
  estimates = [],
  onSaveEstimate,
  onDeleteEstimate,
  divisionFilter: propDivisionFilter,
  setDivisionFilter: propSetDivisionFilter,
  matericoRequests = [],
  matericoSuppliers = [],
  onUpdateMatericoRequest,
  onDeleteMatericoRequest,
  onApplyMatericoPenalty,
  unicoDeals = [],
  onSaveUnicoDeals,
  onNotifyUnicoInvestors,
  internalOrders = [],
  onConfirmInternalOrder,
  onDeleteInternalOrder,
  mktEvents = [],
  mktCampaigns = [],
  mktSurveys = [],
  mktSocial = [],
  mktResponses = {},
  onSaveMktEvent,
  onDeleteMktEvent,
  onSaveCampaign,
  onDeleteCampaign,
  onSaveSurvey,
  onDeleteSurvey,
  onSaveSocialPost,
  onDeleteSocialPost,
  mktContracts = [],
  mktTime = [],
  onSaveMktContract,
  onDeleteMktContract,
  onEmitContractInvoice,
  onSaveMktTimeEntry,
  onDeleteMktTimeEntry,
  onBillTimeEntries,
  onRegisterCampaignSpend,
  onRegisterEventFinance,
  mktAssets = [],
  mktDeliverables = [],
  mktProofs = [],
  onSaveMktAsset,
  onDeleteMktAsset,
  onSaveMktDeliverable,
  onDeleteMktDeliverable,
  onSaveMktProof,
  onDeleteMktProof,
  mktLeads = [],
  mktFlows = [],
  mktSeo = [],
  mktAds = [],
  mktMetrics = [],
  mktInbox = [],
  mktConsents = [],
  onSaveMktLead,
  onDeleteMktLead,
  onSaveMktFlow,
  onDeleteMktFlow,
  onSaveMktSeo,
  onDeleteMktSeo,
  onSaveMktAd,
  onDeleteMktAd,
  onRegisterAdsSpend,
  onSaveMktMetric,
  onDeleteMktMetric,
  onSaveMktInbox,
  onDeleteMktInbox,
  onSaveMktConsent,
  onDeleteMktConsent,
  mktProjects = [],
  onSaveMktProject,
  onDeleteMktProject,
  cantieri = {},
  cantRapportini = {},
  cantPresenze = {},
  cantFoto = {},
  cantMateriali = {},
  cantChecklist = {},
  cantDocumenti = {},
  cantSal = {},
  cantLog = {},
  cantRecords = {},
  cantMessages = {},
  impresaDocs = {},
  impresaRecords = {},
  clients = {},
  onSaveClientRecord,
  partnerAccounts = [],
  onSaveCantiere,
  onDeleteCantiere,
  onAssignPartner,
  onSaveCantEntity,
  onDeleteCantEntity,
  onSendCantiereMessage,
  onDeleteCantiereMessage,
  onSaveImpresaEntity,
  onDeleteImpresaEntity,
  onApproveRapportino,
  onApproveSal
}) => {
  const [search, setSearch] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [filter, setFilter] = useState<'attivi' | 'completati' | 'archivio' | 'tutti'>('attivi');
  const [localDivisionFilter, setLocalDivisionFilter] = useState<'studio' | 'strategico' | 'materico' | 'unico'>('studio');
  const divisionFilter = propDivisionFilter !== undefined ? propDivisionFilter : localDivisionFilter;
  const setDivisionFilter = propSetDivisionFilter !== undefined ? propSetDivisionFilter : setLocalDivisionFilter;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [clientMessageInput, setClientMessageInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [projTab, setProjTab] = useState<string>('vista');
  // Editor preventivo/parcella della commessa (tab Contabilità)
  const [quoteDraft, setQuoteDraft] = useState<Quote | null>(null);
  const [matericoTab, setMatericoTab] = useState<'progetti' | 'richieste'>('progetti');
  const [unicoTab, setUnicoTab] = useState<'progetti' | 'studio'>('progetti');
  
  // For Materico & Strategico tools
  const [newEstOpen, setNewEstOpen] = useState(false);
  const [estPartnerName, setEstPartnerName] = useState('');
  const [estItemDesc, setEstItemDesc] = useState('');
  const [estBaseCost, setEstBaseCost] = useState<string>('');
  const [estMarkupPct, setEstMarkupPct] = useState<number>(15);
  const [finType, setFinType] = useState<'tutti' | 'entrata' | 'uscita'>('tutti');
  const [finCategory, setFinCategory] = useState<string>('tutte');
  const [finSort, setFinSort] = useState<'data_desc' | 'data_asc' | 'importo_desc' | 'importo_asc'>('data_desc');
  const [finQuery, setFinQuery] = useState<string>('');
  const [showFinFilters, setShowFinFilters] = useState<boolean>(false);

  // Contabilità di commessa — mini-form "Registra" (costo / ricavo / scadenza)
  const [qaKind, setQaKind] = useState<null | 'costo' | 'ricavo' | 'scadenza'>(null);
  const [qaDesc, setQaDesc] = useState('');
  const [qaAmount, setQaAmount] = useState('');
  const [qaDate, setQaDate] = useState('');
  const [qaDue, setQaDue] = useState('');
  const [qaParty, setQaParty] = useState('');
  const [qaScadKind, setQaScadKind] = useState<'entrata' | 'uscita'>('entrata');

  const isDetail = route === 'progetto' && !!param;
  const projectDetail = isDetail ? projects.find(p => p.id === param) : null;

  // Project Task Counts Helper
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

  const getPhaseStatus = (ph: any) => {
    const ts = Object.values(ph.tasks || {});
    if (!ts.length) return 'da_fare';
    const doneCount = ts.filter((t: any) => t.done).length;
    if (doneCount === 0) return 'da_fare';
    if (doneCount === ts.length) return 'completato';
    return 'in_corso';
  };

  const codeFrom = (str: string) => {
    if (!str) return '----';
    const cleaned = String(str).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const words = cleaned.split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.slice(0, 4).map(w => w[0]).join('');
    } else {
      code = cleaned.replace(/\s/g, '').slice(0, 4);
    }
    return (code || '----').slice(0, 4).padEnd(4, ' ');
  };

  const getProjDocs = (pid: string) => {
    const d = documents && documents[pid];
    return d ? Object.entries(d).map(([id, x]: any) => ({ id, ...x })).sort((a: any, b: any) => (b.at || 0) - (a.at || 0)) : [];
  };

  const getProjMessages = (pid: string) => {
    const m = projectMessages && projectMessages[pid];
    return m ? Object.entries(m).map(([id, x]: any) => ({ id, ...x })).sort((a: any, b: any) => (a.at || 0) - (b.at || 0)) : [];
  };

  // RENDER PROJECT DETAIL VIEW
  if (isDetail && projectDetail) {
    const p = projectDetail;
    const { done, tot } = projTaskCounts(p);
    const pc = tot ? Math.round((done / tot) * 100) : 0;
    const clientAcc = p.clientUid && users[p.clientUid] ? users[p.clientUid] : null;
    const pm = p.manager && users[p.manager] ? users[p.manager].name : null;

    const plist = Object.entries(p.phases || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));
    const docs = getProjDocs(p.id);
    const msgs = getProjMessages(p.id);

    // ====== CONTABILITÀ DI COMMESSA (collegata ai nodi finanza reali) ======
    // Movimenti liberi (cassa) del progetto: legacy p.finance + nodo studioFinance.
    const legacyFinList = p.finance ? Object.entries(p.finance).map(([id, x]: any) => ({ id, ...x })) : [];
    const dbFinList = (finance || []).filter((f: any) => f.projectId === p.id);
    const mergedMap = new Map();
    legacyFinList.forEach(m => mergedMap.set(m.id, m));
    dbFinList.forEach(m => mergedMap.set(m.id, m));
    const finList = Array.from(mergedMap.values()).sort((a: any, b: any) => String(b.date || '').localeCompare(String(a.date || '')));

    const movEntrate = finList.filter((m: any) => m.kind === 'entrata').reduce((s, m: any) => s + numIt(m.amount), 0);
    const movUscite = finList.filter((m: any) => m.kind === 'uscita').reduce((s, m: any) => s + numIt(m.amount), 0);
    const movSaldo = movEntrate - movUscite;
    const movCategories = Array.from(new Set(finList.map((f: any) => f.category).filter(Boolean))) as string[];

    const filteredFinList = finList
      .filter((f: any) => {
        if (finType !== 'tutti' && f.kind !== finType) return false;
        if (finCategory !== 'tutte' && f.category !== finCategory) return false;
        if (finQuery.trim()) {
          const q = finQuery.toLowerCase();
          return (f.desc || '').toLowerCase().includes(q) || (f.note || '').toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (finSort === 'data_desc') return String(b.date || '').localeCompare(String(a.date || ''));
        if (finSort === 'data_asc') return String(a.date || '').localeCompare(String(b.date || ''));
        if (finSort === 'importo_desc') return numIt(b.amount) - numIt(a.amount);
        if (finSort === 'importo_asc') return numIt(a.amount) - numIt(b.amount);
        return 0;
      });

    // --- Quadro economico automatico (motore finance.ts) ---
    const projComputi = (finComputi || []).filter((c: any) => c.projectId === p.id);
    const projComputoTot = projComputi.reduce((s: number, c: any) => s + computoTotal(c), 0);
    const projFurnishings = Object.values(furnishings[p.id] || {}) as Furnishing[];
    const projArredi = arrediTotals(projFurnishings);
    const projParcella = studioParcella(p, projComputoTot, projArredi.fissiConfermati, projArredi.mobiliConfermati);
    const valoreOpera = projComputoTot + projArredi.fissiConfermati;

    // --- Fatture & scadenze del progetto (nodi strutturati) ---
    const projInvActive = (finInvoicesActive || []).filter((i: any) => i.projectId === p.id);
    const projInvPassive = (finInvoicesPassive || []).filter((i: any) => i.projectId === p.id);
    const projScadenze = (finScadenze || []).filter((s: any) => s.projectId === p.id);

    // --- Preventivi & Parcelle della commessa (nodo quotes, condiviso con Finanze) ---
    const projQuotes = Object.values(quotes)
      .filter((q) => q.projectId === p.id)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const ricaviFatturati = projInvActive.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const incassato = projInvActive.filter((i: any) => i.status === 'pagata').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const daIncassare = Math.max(0, ricaviFatturati - incassato);
    const costiFatture = projInvPassive.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const parcellaTeorica = projParcella.totaleParcella;
    const margineAtteso = parcellaTeorica - costiFatture;
    const margineRealizzato = incassato - costiFatture;
    const avanzamentoEco = parcellaTeorica > 0 ? Math.min(100, Math.round((incassato / parcellaTeorica) * 100)) : 0;

    // Piano SAL (quote uguali sulle fasi) — riuso della logica di FinanzeView.
    const projPhases = p.phases ? Object.values(p.phases) : [];
    const salPer = projPhases.length ? Math.round(parcellaTeorica / projPhases.length) : 0;

    // Salvataggio mini-form "Registra costo / ricavo / scadenza".
    const saveQuickAdd = () => {
      const amt = parseFloat(String(qaAmount).replace(',', '.')) || 0;
      if (!amt || !qaKind) return;
      const sector = (p.division as any) || 'studio';
      if (qaKind === 'costo') {
        onSaveFinanceItem?.('finInvoicesPassive', {
          id: `fpa-${Date.now()}`, supplierName: qaParty || 'Fornitore', projectId: p.id, projectName: p.name,
          amount: amt, category: 'Fornitori', status: 'ricevuta', date: qaDate || todayISO(),
          dueDate: qaDue || qaDate || todayISO(), sector, description: qaDesc || ''
        });
      } else if (qaKind === 'ricavo') {
        onSaveFinanceItem?.('finInvoicesActive', {
          id: `fea-${Date.now()}`, clientName: p.client || qaParty || 'Cliente', projectId: p.id, projectName: p.name,
          amount: amt, taxRate: 22, status: 'inviata_sdi', sdiCode: '', date: qaDate || todayISO(),
          dueDate: qaDue || qaDate || todayISO(), sector
        });
      } else if (qaKind === 'scadenza') {
        onSaveFinanceItem?.('finScadenze', {
          id: `sca-${Date.now()}`, kind: qaScadKind, desc: qaDesc || 'Scadenza', clientOrSupplier: qaParty || p.client || '',
          amount: amt, dueDate: qaDue || qaDate || todayISO(), status: 'pago_attesa', projectId: p.id, sector
        });
      }
      setQaKind(null); setQaDesc(''); setQaAmount(''); setQaDate(''); setQaDue(''); setQaParty(''); setQaScadKind('entrata');
    };

    const handleSendMsg = () => {
      if (!clientMessageInput.trim()) return;
      onSendClientMessage(p.id, clientMessageInput);
      setClientMessageInput('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length) {
        setUploading(true);
        Array.from(e.target.files).forEach(f => {
          onUploadDocument(p.id, f);
        });
        setUploading(false);
      }
    };

    // Build Status Card Props
    const allPhases = Object.entries(p.phases || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0)).map(([id, ph]) => ({ id, ...(ph as any) }));
    const flatTasks: { phase: string; phId: string; title: string; done: boolean }[] = [];
    allPhases.forEach((ph: any) => {
      Object.entries(ph.tasks || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0)).forEach(([tid, t]: any) => {
        flatTasks.push({ phase: ph.name, phId: ph.id || '', title: t.title, done: !!t.done });
      });
    });

    let curIdx = flatTasks.findIndex(t => !t.done);
    if (curIdx === -1 && flatTasks.length > 0) curIdx = flatTasks.length - 1;
    const curTask = flatTasks[curIdx] || { title: 'Lavori completati', phase: 'Fine' };
    const nextTask = flatTasks[curIdx + 1] || null;
    const isAllDone = flatTasks.length > 0 && flatTasks.every(t => t.done);

    const toTitle = nextTask ? nextTask.title : (p.dueDate ? fmtDay(p.dueDate) : 'Consegna');

    return (
      <div className="flex flex-col gap-6 text-left animate-[riseIn_0.35s_ease_both]">
        {/* Top left prominent back button */}
        <div className="flex justify-start">
          <button
            onClick={() => onNav('progetti')}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-[#161616] hover:text-white bg-white hover:bg-[#161616] border border-[#e2e2e2] hover:border-[#161616] py-2 px-4 rounded-full shadow-xs hover:shadow transition-all duration-300 cursor-pointer select-none"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Torna ai Progetti</span>
          </button>
        </div>

        {/* Head Bar */}
        <div className="flex justify-between items-center gap-4 flex-wrap pb-4">
          <div className="flex items-center gap-4">
            <div className="w-[54px] h-[54px] rounded-2xl bg-[#161616] text-white flex items-center justify-center shadow-sm">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[25px] font-extrabold tracking-tight text-[#161616] leading-none mb-1 font-sans">
                {p.name}
              </h1>
              <div className="text-[12px] text-[#8a8a8a] font-mono font-semibold tracking-wide">
                {p.code || 'ARC-K-00'} · <span className="text-[#555]">{p.templateName || 'Generica pratica'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {p.archived && (
              <span className="py-1 px-3.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" /> Archiviato
              </span>
            )}
            <span
              className={`py-1 px-3.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border ${
                p.status === 'attivo'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : p.status === 'completato'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-650 border-gray-200'
              }`}
            >
              {p.status}
            </span>
            {isInternalBoss && (
              <button
                onClick={() => onToggleArchiveProject?.(p.id)}
                className="w-9 h-9 border border-[#e2e2e2] hover:border-black rounded-full flex items-center justify-center text-[#8a8a8a] hover:text-[#161616] bg-transparent cursor-pointer transition-colors"
                title={p.archived ? 'Ripristina dall\'archivio' : 'Archivia progetto'}
              >
                {p.archived ? <ArchiveRestore className="w-4.5 h-4.5" /> : <Archive className="w-4.5 h-4.5" />}
              </button>
            )}
            {isInternalBoss && (
              <button
                onClick={() => onEditProject(p.id)}
                className="inline-flex items-center gap-1.5 py-2 px-4 border border-[#e2e2e2] hover:border-black rounded-full text-[12px] font-bold text-[#161616] bg-white hover:bg-[#161616] hover:text-white cursor-pointer transition-colors"
                title="Modifica pratica"
              >
                <Edit className="w-3.5 h-3.5" /> Modifica
              </button>
            )}
          </div>
        </div>

        {/* Premium Pills Navigation Bar */}
        <div className="w-full mt-1">
          <div className="flex w-full items-center bg-[#161616] rounded-full p-1.5 shadow-[0_12px_34px_-10px_rgba(0,0,0,0.5)] overflow-x-auto gap-1">
            {([
              { id: 'vista', label: "Vista d'insieme", icon: Eye },
              ...(p.division === 'strategico' ? [{ id: 'marketing', label: 'Strumenti Marketing', icon: Briefcase }] : []),
              ...(p.division === 'materico' ? [{ id: 'materico_prev', label: 'Preventivi & Fornitori', icon: SlidersHorizontal }] : []),
              { id: 'tecnico', label: 'Fascicolo Tecnico', icon: Layers },
              { id: 'arredi', label: 'Arredi & Moodboard', icon: Sofa },
              ...((!p.division || p.division === 'studio' || p.division === 'materico' || p.division === 'unico')
                ? [{ id: 'cantiere', label: 'Cantiere', icon: HardHat }] : []),
              { id: 'finanziario', label: 'Contabilità & Bilancio', icon: Wallet }
            ] as { id: string; label: string; icon: any }[]).map(tab => {
              const Icon = tab.icon;
              const active = projTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProjTab(tab.id)}
                  className={`relative flex-1 inline-flex items-center justify-center gap-1.5 border-none bg-transparent p-2.5 rounded-full font-bold text-[13px] cursor-pointer transition-colors duration-300 select-none whitespace-nowrap ${
                    active 
                      ? 'text-[#161616]' 
                      : 'text-[#9a9a9a] hover:text-white'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {active && (
                    <motion.div
                      layoutId="projDetailActivePill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32
                      }}
                      className="absolute inset-0 bg-white rounded-full z-0"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${
                        active ? 'max-w-[180px] opacity-100 font-extrabold' : 'max-w-0 opacity-0'
                      }`}
                    >
                      <span className="pl-1 pr-1">{tab.label}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: VISTA D'INSIEME (No 3D canvas, flight progress, catastato info, clients, messaging) */}
        {projTab === 'vista' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-2 animate-[riseIn_0.3s_ease_both]">
            <div className="flex flex-col gap-6">
              {/* Flight-style progress status card */}
              <StatusCard
                fromCode={codeFrom(curTask.title)}
                fromCity={isAllDone ? 'Completato' : 'Task attuale'}
                fromTime={curTask.title}
                toCode={codeFrom(toTitle)}
                toCity={nextTask ? 'Prossimo' : 'Consegna'}
                toTime={toTitle}
                progress={pc}
                eta={p.dueDate ? `Consegna entro il ${fmtDay(p.dueDate)}` : 'Senza scadenza'}
                nextLabel={nextTask ? 'Prossimo' : 'Processo'}
                nextVal={nextTask ? nextTask.title : (isAllDone ? 'Tutto completato' : 'In corso')}
                rightLabel="Fase corrente"
                rightVal={curTask.phase || 'Avvio'}
              />              {/* Practice Certificate / Division-specific Details */}
              {(!p.division || p.division === 'studio') ? (
                (p.committente || p.indirizzoImmobile || p.foglio || p.particella || p.interventoEdilizio) ? (
                  <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm flex flex-col gap-4">
                    <div className="pb-3 border-b border-[#f5f5f5] flex justify-between items-center">
                      <h3 className="text-[14px] font-extrabold text-[#161616] font-sans tracking-tight">Pratica & Dati Catastali</h3>
                      <button
                        onClick={() => onOpenAnagrafica(p.id)}
                        className="text-[12px] font-bold text-[#161616] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Modifica
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {p.interventoEdilizio && (
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                          <Layers className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block font-sans">Intervento</span>
                            <b className="block text-[13px] mt-0.5 truncate text-[#161616]">{interventoLabel(p.interventoEdilizio)}</b>
                          </div>
                        </div>
                      )}

                      {p.titoloAbilitativo && (
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block font-sans">Titolo abilitativo</span>
                            <b className="block text-[13px] mt-0.5 truncate text-[#161616]">{titoloLabel(p.titoloAbilitativo)}</b>
                          </div>
                        </div>
                      )}

                      {p.committente && (
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block font-sans">Committente</span>
                            <b className="block text-[13px] mt-0.5 truncate text-[#161616]">{p.committente}</b>
                          </div>
                        </div>
                      )}
                      
                      {p.indirizzoImmobile && (
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block font-sans">Indirizzo</span>
                            <b className="block text-[13px] mt-0.5 truncate text-[#161616]">{p.indirizzoImmobile}</b>
                          </div>
                        </div>
                      )}
                      
                      {(p.foglio || p.particella || (p.catastali || []).length > 0) && (
                        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                          <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block font-sans">Foglio / Part. / Sub</span>
                            {(p.catastali && p.catastali.length ? p.catastali : [{ foglio: p.foglio, particella: p.particella, sub: p.sub }]).map((r: any, i: number) => (
                              <b key={i} className="block text-[13px] mt-0.5 truncate text-[#161616]">{r.foglio || '—'} / {r.particella || '—'} / {r.sub || '—'}</b>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  isInternalBoss && (
                    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm flex items-center justify-between">
                      <div>
                        <h4 className="text-[13.5px] font-bold text-[#161616] font-sans">Scheda Catastale Pratica</h4>
                        <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">Nessun dato catastale inserito per il progetto.</p>
                      </div>
                      <button 
                        onClick={() => onOpenAnagrafica(p.id)} 
                        className="bg-[#161616] hover:bg-black text-white font-extrabold py-2 px-4 rounded-full border-none cursor-pointer text-[12px] transition-colors shadow-xs"
                      >
                        Compila dati
                      </button>
                    </div>
                  )
                )
              ) : p.division === 'strategico' ? (
                <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm flex flex-col gap-4 font-sans">
                  <div className="pb-3 border-b border-[#f5f5f5] flex justify-between items-center">
                    <h3 className="text-[14px] font-extrabold text-[#161616] tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#161616]" /> Parametri Strategia & Campagna
                    </h3>
                    <button 
                      onClick={() => onOpenAnagrafica(p.id)} 
                      className="text-[12px] font-bold text-[#161616] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Modifica
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                      <Wallet className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block">Budget Allineato</span>
                        <b className="block text-[13.5px] mt-0.5 font-mono text-[#161616]">
                          {p.marketingBudget !== undefined && p.marketingBudget !== null
                            ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.marketingBudget)
                            : 'Nessun budget inserito'}
                        </b>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                      <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block">Canali Prioritari</span>
                        <b className="block text-[13px] mt-0.5 text-[#161616] truncate">{p.marketingChannels || 'Da definire'}</b>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block">Obiettivo Strategico</span>
                        <b className="block text-[13px] mt-0.5 text-[#161616] truncate">{p.marketingGoal || 'Branding / Generico'}</b>
                      </div>
                    </div>
                  </div>
                </div>
              ) : p.division === 'materico' ? (
                <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm flex flex-col gap-4 font-sans">
                  <div className="pb-3 border-b border-[#f5f5f5] flex justify-between items-center">
                    <h3 className="text-[14px] font-extrabold text-[#161616] tracking-tight flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#161616]" /> Dati Computo & Store Forniture
                    </h3>
                    <button 
                      onClick={() => onOpenAnagrafica(p.id)} 
                      className="text-[12px] font-bold text-[#161616] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Modifica
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                      <Wallet className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block">Est. Forniture</span>
                        <b className="block text-[13.5px] mt-0.5 font-mono text-[#161616]">
                          {p.matericoEstimatedBudget !== undefined && p.matericoEstimatedBudget !== null
                            ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.matericoEstimatedBudget)
                            : 'Forniture da computare'}
                        </b>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                      <Building className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block">Finiture Selezionate</span>
                        <b className="block text-[13px] mt-0.5 text-[#161616] truncate capitalize">
                          {p.matericoFinitureType ? p.matericoFinitureType.replace(/_/g, ' ') : 'Nessuna finitura indicata'}
                        </b>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fafafa]/50 border border-[#f3f3f3] hover:border-[#e5e5e5] transition-colors">
                      <SlidersHorizontal className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8a8a8a] uppercase font-bold tracking-wider block">Stato Sottofondi</span>
                        <b className="block text-[13px] mt-0.5 text-[#161616] truncate capitalize">
                          {p.matericoSottofondiStatus ? p.matericoSottofondiStatus.replace(/_/g, ' ') : 'Da valutare'}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#fafafa]/50 border border-dashed border-[#e2e2e2] rounded-[24px] p-6 text-center font-sans">
                  <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <h4 className="text-[13.5px] font-bold text-[#161616] uppercase tracking-wider font-mono">Atelier Unico (UNICO)</h4>
                  <p className="text-[11.5px] text-[#8a8a8a] mt-1">L'iter esclusivo e di elevato pregio viene custodito con massima riservatezza.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              {/* Meta attributes card */}
              <div className="bg-white border border-[#e2e2e2] rounded-[24px] overflow-hidden shadow-sm grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-[#f1f1f1]">
                <div className="p-4 border-[#f1f1f1] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-extrabold text-[#8a8a8a] tracking-wider">Cliente</div>
                  <div className="text-[13.5px] font-bold text-[#161616] mt-2 truncate">{p.client || '—'}</div>
                </div>
                <div className="p-4 border-[#f1f1f1] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-extrabold text-[#8a8a8a] tracking-wider">Portale Cliente</div>
                  <div className="text-[13.5px] font-bold text-[#161616] mt-2 truncate">
                    {clientAcc ? (
                      <span className="flex items-center gap-1.5 text-green-750">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {clientAcc.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-semibold text-[13px]">Non associato</span>
                    )}
                  </div>
                </div>
                <div className="p-4 border-[#f1f1f1] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-extrabold text-[#8a8a8a] tracking-wider">Luogo</div>
                  <div className="text-[13.5px] font-bold text-[#161616] mt-2 truncate">{p.location || '—'}</div>
                </div>
                <div className="p-4 border-[#f1f1f1] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-extrabold text-[#8a8a8a] tracking-wider">Responsabile</div>
                  <div className="text-[13.5px] font-bold text-[#161616] mt-2 truncate">{pm || '—'}</div>
                </div>
                <div className="p-4 border-[#f1f1f1] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-extrabold text-[#8a8a8a] tracking-wider font-sans">Inizio Cantiere</div>
                  <div className="text-[13.5px] font-bold text-[#161616] mt-2">{p.startDate ? fmtDay(p.startDate) : '—'}</div>
                </div>
                <div className="p-4 border-[#f1f1f1] flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-extrabold text-[#8a8a8a] tracking-wider font-sans">Termine Consegna</div>
                  <div className="text-[13.5px] font-bold text-red-755 mt-2">{p.dueDate ? fmtDay(p.dueDate) : '—'}</div>
                </div>
              </div>

              {/* Team di lavoro: tutti i membri assegnati ad attività della pratica */}
              {(() => {
                const uids = new Set<string>();
                Object.values(p.phases || {}).forEach((ph: any) =>
                  Object.values(ph.tasks || {}).forEach((t: any) => { if (t.assignee) uids.add(t.assignee); })
                );
                agendaTasks.forEach((t) => {
                  if (t.projectId !== p.id) return;
                  (t.assignees && t.assignees.length ? t.assignees : t.assignee ? [t.assignee] : []).forEach((u) => uids.add(u));
                });
                const members = Array.from(uids)
                  .map((uid) => users[uid])
                  .filter(Boolean)
                  .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
                const openFor = (uid: string) => {
                  let n = 0;
                  Object.values(p.phases || {}).forEach((ph: any) =>
                    Object.values(ph.tasks || {}).forEach((t: any) => { if (!t.done && t.assignee === uid) n++; })
                  );
                  return n;
                };
                return (
                  <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm text-left">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#f5f5f5]">
                      <h2 className="text-[15px] font-extrabold text-[#161616] font-sans tracking-tight flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Team di lavoro
                      </h2>
                      <span className="text-[11px] font-bold text-[#8a8a8a]">{members.length} membri</span>
                    </div>
                    {members.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {members.map((u: any) => (
                          <div key={u.uid} className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-[#fafafa] transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-[#161616] text-white flex items-center justify-center text-[11px] font-extrabold shrink-0 uppercase">
                                {(u.name || '?').split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                              </span>
                              <div className="min-w-0">
                                <b className="block text-[13px] font-bold text-[#161616] truncate">{u.name}</b>
                                <span className="block text-[10.5px] text-[#8a8a8a] truncate">
                                  {(u.functions || []).slice(0, 2).join(' · ') || u.title || u.role}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10.5px] font-bold text-[#8a8a8a] bg-[#f5f5f3] border border-[#ececec] rounded-full px-2 py-0.5 shrink-0">
                              {openFor(u.uid)} task aperti
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] italic text-[#9a9a9a] py-2">Nessun membro assegnato alle attività della pratica.</p>
                    )}
                  </div>
                );
              })()}

              {/* Messaging with Client */}
              <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm text-left flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-1 border-b border-[#f5f5f5]">
                  <h2 className="text-[15px] font-extrabold text-[#161616] font-sans tracking-tight">Comunicazioni Cliente</h2>
                  {clientAcc && <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Attivo</span>}
                </div>
                
                <div className="flex flex-col gap-3 min-h-[160px] max-h-[220px] overflow-y-auto pr-1">
                  {msgs.length > 0 ? (
                    msgs.map((m: any) => {
                      const isMine = m.role !== 'cliente';
                      return (
                        <div key={m.id} className={`flex flex-col max-w-[85%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`p-3 rounded-[18px] text-[13px] leading-relaxed shadow-xs ${isMine ? 'bg-[#161616] text-white rounded-tr-none' : 'bg-gray-100/80 text-[#161616] rounded-tl-none'}`}>
                            {m.text}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[9.5px] text-[#8a8a8a] mt-1 px-1 font-bold font-mono">
                            {m.name} · {m.at ? fmtDay(isoDate(m.at)) : ''}
                            {m.from === myUid && onDeleteMessage && (
                              <ChatDeleteButton at={m.at || 0} onDelete={() => onDeleteMessage(p.id, m.id)} />
                            )}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-[#8a8a8a]">
                      <Users className="w-8 h-8 opacity-25 mb-1.5" />
                      <p className="italic text-[12.5px] font-medium max-w-[240px]">Nessuna comunicazione registrata in questa chat.</p>
                    </div>
                  )}
                </div>

                {p.clientUid ? (
                  <div className="flex gap-2 items-end mt-4 border-t border-[#f5f5f5] pt-4">
                    <textarea
                      value={clientMessageInput}
                      onChange={(e) => setClientMessageInput(e.target.value)}
                      className="input flex-1 min-h-[44px] max-h-[100px] py-2.5 px-3 text-[13px] leading-normal rounded-xl border-[#e2e2e2] focus:border-[#161616]"
                      placeholder="Invia aggiornamento al portale del cliente..."
                    />
                    <AiComposeButton text={clientMessageInput} onResult={setClientMessageInput} title="Migliora il messaggio con AI" />
                    <button
                      onClick={handleSendMsg}
                      className="bg-[#161616] hover:bg-black text-white h-[44px] w-[50px] p-0 flex items-center justify-center rounded-xl border-none cursor-pointer transition-colors shadow-xs"
                      title="Invia"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-[#f5f5f5] text-center">
                    <p className="text-[12px] text-[#8a8a8a] font-medium leading-relaxed italic">
                      Associa un portale cliente dalle impostazioni per attivare l'invio delle notifiche e lo scambio di comunicazioni.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB STRATEGICO: STRUMENTI MARKETING */}
        {projTab === 'marketing' && (
          <div className="flex flex-col gap-6 mt-4 animate-[riseIn_0.3s_ease_both]">
            <div className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-xs text-left">
              <div className="flex justify-between items-center gap-4 flex-wrap pb-4 border-b border-[#f5f5f5] mb-5">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 font-extrabold block">STRATEGICO</span>
                  <h2 className="text-xl font-sans tracking-tight font-extrabold text-[#111]">Pannello Strumenti & Campagne Marketing</h2>
                </div>
                <div className="flex gap-2">
                  <span className="bg-green-50 text-green-700 text-[11px] font-extrabold px-3 py-1 rounded-full border border-green-200 uppercase">
                    ● Agenzia Partner Attiva
                  </span>
                </div>
              </div>

              {/* KPIs indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#fcfcfc] border border-[#f0f0f0] rounded-2xl p-4">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Leads Generati</div>
                  <div className="text-2xl font-black text-black mt-1 font-mono">118</div>
                  <div className="text-[10.5px] text-green-600 mt-1 font-bold">+12% vs scorsa sett.</div>
                </div>
                <div className="bg-[#fcfcfc] border border-[#f0f0f0] rounded-2xl p-4">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Budget Totale</div>
                  <div className="text-2xl font-black text-black mt-1 font-mono">{eur(2150)}</div>
                  <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-medium">Assegna budget campagne</div>
                </div>
                <div className="bg-[#fcfcfc] border border-[#f0f0f0] rounded-2xl p-4">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Budget Speso</div>
                  <div className="text-2xl font-black text-black mt-1 font-mono">{eur(1250)}</div>
                  <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-medium">58% del budget allocato</div>
                </div>
                <div className="bg-[#fcfcfc] border border-[#f0f0f0] rounded-2xl p-4">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">CACL Medio</div>
                  <div className="text-2xl font-black text-black mt-1 font-mono">{eur(10.59)}</div>
                  <div className="text-[10.5px] text-green-600 mt-1 font-bold font-semibold">Ottimo livello ROI</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaigns Creator & Tracker */}
                <div className="flex flex-col gap-4">
                  <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-2xl p-5 text-left">
                    <h3 className="font-extrabold text-[15.5px] text-[#111] mb-2.5">Crea / Monitora Campagna Ads</h3>
                    <div className="flex flex-col gap-3 font-sans">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-gray-500">Nome Campagna</label>
                        <input
                          type="text"
                          placeholder="es. Campagna Instagram Brand Identity"
                          className="input bg-white"
                          id="mkt_title"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-gray-500">Budget (€)</label>
                          <input
                            type="number"
                            placeholder="500"
                            className="input bg-white font-mono"
                            id="mkt_budget"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-gray-500">Canale / Media</label>
                          <select className="select bg-white font-bold" id="mkt_channel">
                            <option value="instagram">Instagram Ads</option>
                            <option value="google">Google Search</option>
                            <option value="seo">SEO & Local</option>
                            <option value="email">Email Dem</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const titleEl = document.getElementById('mkt_title') as HTMLInputElement;
                          const bgEl = document.getElementById('mkt_budget') as HTMLInputElement;
                          const chEl = document.getElementById('mkt_channel') as HTMLSelectElement;
                          if (!titleEl?.value || !bgEl?.value) {
                            alert("Inserisci tutti i dati della campagna!");
                            return;
                          }
                          alert(`Campagna "${titleEl.value}" creata sul canale ${chEl.value} con budget di €${bgEl.value}!`);
                          titleEl.value = '';
                          bgEl.value = '';
                        }}
                        className="btn bg-[#1b1b1b] hover:bg-black text-white font-bold h-10 rounded-xl justify-center text-[12.5px] mt-2.5 cursor-pointer"
                      >
                        Avvia Nuova Campagna
                      </button>
                    </div>
                  </div>

                  {/* Builtin campaigns */}
                  <div className="border border-[#ececec] rounded-2xl p-4">
                    <h4 className="font-extrabold text-[13.5px] text-[#111] mb-3">Stato Canali / Campagne Attive</h4>
                    <div className="flex flex-col gap-2">
                      {[
                        { title: 'Generazione Contatti Instagram 2026', ch: 'Instagram', bd: 1200, sp: 450, st: 'In Corso', l: 42 },
                        { title: 'Local Search Google Ostuni & Cisternino', ch: 'Google Search', bd: 800, sp: 800, st: 'Completata', l: 61 },
                        { title: 'Newsletter fidelizzazione Portfolio 2025', ch: 'Email Marketing', bd: 150, sp: 0, st: 'Bozza', l: 15 }
                      ].map((cp, idx) => (
                        <div key={idx} className="bg-white border border-[#f2f2f2] p-3 rounded-xl flex items-center justify-between gap-3 text-left">
                          <div>
                            <div className="font-bold text-[13px] text-gray-900 leading-tight">{cp.title}</div>
                            <div className="text-[10px] text-gray-400 font-mono font-bold mt-1 uppercase">
                              {cp.ch} • budget {eur(cp.bd)} • speso {eur(cp.sp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide inline-block ${
                              cp.st === 'In Corso' ? 'bg-blue-50 text-blue-700' : cp.st === 'Completata' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {cp.st}
                            </span>
                            <div className="text-[11px] font-extrabold text-black font-mono mt-1">{cp.l} Lead</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Social Editorial Post Content Planner */}
                <div className="border border-[#ececec] rounded-2xl p-5 text-left flex flex-col gap-4">
                  <div>
                    <h3 className="font-extrabold text-[15px] text-black">Social Content & Editorial Planner</h3>
                    <p className="text-[11.5px] text-gray-400 mt-1">Pianifica le prossime pubblicazioni promozionali social concordate con il cliente</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-[11.5px] text-amber-900 leading-relaxed font-semibold">
                      <b>Auto-Suggerimento canali del brand:</b> In base alle realizzazioni dello studio, Strategico consiglia di focalizzarsi su <b>Instagram Reels</b> per la resa fotografica della pietra e <b>TikTok</b> per la fase di cantiere.
                    </div>
                  </div>

                  {/* Scheduled Content Feed and Previews */}
                  <div className="flex flex-col gap-3 mt-1.5">
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-extrabold">Post In Attesa Di Approvazione</h4>
                    {[
                      { id: 'p1', channel: 'Instagram Feed', desc: 'Anteprima rendering tridimensionale cortile interno con illuminazione soffusa calda da incasso pietra.', date: 'Pianificato per il 12 Giugno 2026', likes: 'In attesa approvazione' },
                      { id: 'p2', channel: 'TikTok Reels', desc: 'Video backstage: la sbozzatura dei blocchi di pietra realizzati dai maestri artigiani locali.', date: 'Pianificato per il 18 Giugno 2026', likes: 'In attesa approvazione' }
                    ].map(post => (
                      <div key={post.id} className="bg-white border border-[#f0f0f0] p-3.5 rounded-xl shadow-xs text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#e2e2e2] px-2.5 py-1 text-[9px] font-mono tracking-wider font-extrabold uppercase rounded-bl text-gray-600">
                          {post.channel}
                        </div>
                        <div className="pr-20 font-sans">
                          <p className="text-[12.5px] text-[#333] font-medium leading-normal">{post.desc}</p>
                          <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-[#8a8a8a] font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {post.date}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#f5f5f5]/80 flex gap-1.5">
                          <button
                            onClick={() => alert("Post approvato per la programmazione!")}
                            className="bg-green-50 hover:bg-green-100 text-green-700 font-extrabold text-[11px] rounded px-3 py-1 cursor-pointer transition-all border border-green-200"
                          >
                            Approva e Pubblica
                          </button>
                          <button
                            onClick={() => alert("Richiesta modifica inviata al reparto marketing.")}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[11px] rounded px-3 py-1 cursor-pointer transition-all border border-amber-200"
                          >
                            Modifica
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB MATERICO: PREVENTIVI & FORNITORI */}
        {projTab === 'materico_prev' && (
          <div className="flex flex-col gap-6 mt-4 animate-[riseIn_0.3s_ease_both]">
            <div className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-xs text-left">
              
              {/* Header and statistics */}
              <div className="flex justify-between items-center gap-4 flex-wrap pb-4 border-b border-[#f5f5f5] mb-5">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 font-extrabold block">Materico Store</span>
                  <h2 className="text-xl font-sans tracking-tight font-extrabold text-[#111]">Forniture per la Casa — Consolle Gestionale Preventivi</h2>
                </div>
                <button
                  onClick={() => setNewEstOpen(true)}
                  className="btn bg-[#1b1b1b] hover:bg-black text-white font-bold h-9.5 px-3.5 rounded-xl shadow-xs text-[12.5px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Crea Preventivo
                </button>
              </div>

              {/* Estimate Creation Modal overlay / layout */}
              {newEstOpen && (
                <div className="bg-[#fcfcfc] border border-dashed border-[#dcdcdc] rounded-2xl p-5 mb-6 text-left animate-[riseIn_0.2s_ease_both]">
                  <h3 className="font-extrabold text-[15px] mb-3 text-black">Aggiungi Preventivo Fornitore & Maggiorazione</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 font-sans">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500">Descrizione Fornitura / Materiale</label>
                      <input
                        type="text"
                        placeholder="Es. Porte interne in Rovere Massello (x5)"
                        className="input bg-white"
                        value={estItemDesc}
                        onChange={(e) => setEstItemDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500">Azienda Partner / Impresa Salentina</label>
                      <input
                        type="text"
                        placeholder="Es. Mondolegno Serramenti Ostuni"
                        className="input bg-white"
                        value={estPartnerName}
                        onChange={(e) => setEstPartnerName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500">Costo Base Fornitore (€)</label>
                      <input
                        type="number"
                        placeholder="2400"
                        className="input bg-white font-mono"
                        value={estBaseCost}
                        onChange={(e) => setEstBaseCost(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500">Maggiorazione Onirico (%)</label>
                      <select
                        className="select bg-white font-bold"
                        value={estMarkupPct}
                        onChange={(e) => setEstMarkupPct(Number(e.target.value))}
                      >
                        <option value="5">5% (Amici e promo)</option>
                        <option value="10">10% (Medio)</option>
                        <option value="15">15% (Standard Studio)</option>
                        <option value="20">20% (Alta Marginalità)</option>
                        <option value="25">25% (Progettazione inclusa)</option>
                      </select>
                    </div>
                  </div>

                  {estBaseCost && !isNaN(Number(estBaseCost)) && (
                    <div className="mb-4 text-[#8a8a8a] text-[12.5px] font-semibold bg-white border border-[#f0f0f0] p-3 rounded-xl flex items-center justify-between">
                      <span>Costo Fornitore: {eur(Number(estBaseCost))}</span>
                      <span className="font-extrabold text-amber-600">Margine Onirico (+{estMarkupPct}%): {eur(Number(estBaseCost) * estMarkupPct / 100)}</span>
                      <span className="font-black text-black text-[14px]">Prezzo Cliente: {eur(Number(estBaseCost) * (1 + estMarkupPct / 100))}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setNewEstOpen(false)}
                      className="btn border border-[#ccc] hover:bg-gray-100 text-[#444] h-9.5 text-[12px]"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => {
                        const baseVal = Number(estBaseCost);
                        if (!estItemDesc || !estPartnerName || isNaN(baseVal) || baseVal <= 0) {
                          alert("Si prega di immettere tutti i dati del preventivo!");
                          return;
                        }
                        const calculatedFinal = Math.round(baseVal * (1 + estMarkupPct / 100) * 100) / 100;
                        const newEst: MatericoEstimate = {
                          id: `est-${Date.now()}`,
                          projectId: p.id,
                          partnerName: estPartnerName,
                          itemDescription: estItemDesc,
                          baseCost: baseVal,
                          markupPercentage: estMarkupPct,
                          finalClientPrice: calculatedFinal,
                          status: 'pending_client',
                          createdAt: Date.now()
                        };
                        if (onSaveEstimate) {
                          onSaveEstimate(newEst);
                        }
                        setNewEstOpen(false);
                        setEstPartnerName('');
                        setEstItemDesc('');
                        setEstBaseCost('');
                        setEstMarkupPct(15);
                      }}
                      className="btn bg-[#1b1b1b] hover:bg-black text-white font-bold h-9.5 text-[12px] cursor-pointer"
                    >
                      Invia Preventivo al Cliente
                    </button>
                  </div>
                </div>
              )}

              {/* Bids directory views */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: Supplier & Contractor Details */}
                <div className="border border-[#ececec] rounded-2xl p-5 text-left">
                  <div className="flex items-center justify-between gap-3 mb-4.5 border-b border-[#f5f5f5] pb-3">
                    <h3 className="font-extrabold text-[14.5px] text-[#111]">1. Sezione Imprese & Aziende Partner</h3>
                    <span className="bg-blue-50 text-blue-800 text-[10px] uppercase font-black px-2.5 py-0.5 rounded">Pre-maggiorazioni</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {estimates.filter(e => e.projectId === p.id).length === 0 ? (
                      <p className="text-[12px] text-gray-400 italic font-semibold py-3 text-center">Nessun preventivo registrato per questa commessa.</p>
                    ) : (
                      estimates.filter(e => e.projectId === p.id).map(e => {
                        const markupAmount = e.baseCost * (e.markupPercentage / 100);
                        return (
                          <div key={e.id} className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 shadow-2xs font-sans">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <h4 className="font-bold text-[14px] text-black leading-tight">{e.itemDescription}</h4>
                                <p className="text-[11px] text-gray-400 mt-1 uppercase font-semibold tracking-tight">Partner: {e.partnerName}</p>
                              </div>
                              <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                e.status === 'approvato'
                                  ? 'bg-green-50 text-green-700'
                                  : e.status === 'rifiutato'
                                  ? 'bg-red-50 text-red-650'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {e.status === 'approvato' && 'APPROVATO'}
                                {e.status === 'rifiutato' && 'RIFIUTATO'}
                                {e.status === 'pending_client' && 'IN ATTESA CLIENTE'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-[#f8f8f8] text-center text-[10.5px] font-mono">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-gray-400 font-sans">Preventivo Partner</span>
                                <span className="font-black text-black">{eur(e.baseCost)}</span>
                              </div>
                              <div className="flex flex-col gap-0.5 border-l border-[#f5f5f5] text-amber-600">
                                <span className="text-gray-400 font-sans">Maggiorazione ({e.markupPercentage}%)</span>
                                <span className="font-black">+{eur(markupAmount)}</span>
                              </div>
                              <div className="flex flex-col gap-0.5 border-l border-[#f5f5f5] text-emerald-600">
                                <span className="text-gray-400 font-sans font-bold">Prezzo Finale</span>
                                <span className="font-black">{eur(e.finalClientPrice)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Client view simulator */}
                <div className="border border-[#ececec] bg-slate-50/50 rounded-2xl p-5 text-left">
                  <div className="flex items-center justify-between gap-3 mb-4.5 border-b border-[#ececec] pb-3">
                    <h3 className="font-extrabold text-[14.5px] text-[#111]">2. Sezione Anteprima Cliente / Simulatori</h3>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] uppercase font-black px-2.5 py-0.5 rounded">Prezzo di Listino</span>
                  </div>

                  <p className="text-[11.5px] text-[#8a8a8a] leading-relaxed mb-4 font-sans">
                    Questa sezione riproduce fedelmente ciò che il cliente visualizzerà all'interno del proprio portale.
                  </p>

                  <div className="flex flex-col gap-3 font-sans">
                    {estimates.filter(e => e.projectId === p.id).length === 0 ? (
                      <p className="text-[12px] text-gray-400 italic py-3 text-center">In attesa di preventivi per sbloccare la simulazione.</p>
                    ) : (
                      estimates.filter(e => e.projectId === p.id).map(e => {
                        return (
                          <div key={e.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3.5 shadow-xs">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <h4 className="font-bold text-[13.5px] text-gray-900 leading-tight">{e.itemDescription}</h4>
                                <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Divisione: Forniture Materico</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[14px] font-black text-emerald-600 font-mono">{eur(e.finalClientPrice)}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-[#f0f0f0]">
                              <span className={`text-[10.5px] font-bold uppercase ${
                                e.status === 'approvato'
                                  ? 'text-green-700 font-extrabold'
                                  : e.status === 'rifiutato'
                                  ? 'text-red-700 font-extrabold'
                                  : 'text-amber-600 font-semibold'
                              }`}>
                                Stato: {e.status === 'approvato' ? 'Approvato dal cliente ✓' : e.status === 'rifiutato' ? 'Rifiutato ✕' : 'In attesa di approvazione'}
                              </span>

                              {e.status === 'pending_client' && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      const nextEst = { ...e, status: 'approvato' as const };
                                      if (onSaveEstimate) onSaveEstimate(nextEst);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white text-[10.5px] font-extrabold px-2.5 py-1 rounded transition-all cursor-pointer shadow-xs border-none"
                                  >
                                    Accetta
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nextEst = { ...e, status: 'rifiutato' as const };
                                      if (onSaveEstimate) onSaveEstimate(nextEst);
                                    }}
                                    className="bg-red-50 text-red-700 hover:bg-red-100 text-[10.5px] font-extrabold px-2.5 py-1 rounded transition-all cursor-pointer border border-red-200"
                                  >
                                    Rifiuta
                                  </button>
                                </div>
                              )}

                              {e.status !== 'pending_client' && (
                                <button
                                  onClick={() => {
                                    const nextEst = { ...e, status: 'pending_client' as const };
                                    if (onSaveEstimate) onSaveEstimate(nextEst);
                                  }}
                                  className="text-[9.5px] text-gray-400 hover:text-black hover:underline cursor-pointer bg-transparent border-none"
                                >
                                  Reimposta Stato
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FASCICOLO TECNICO (Phases & Tasks side-by-side with Documents storage) */}
        {projTab === 'tecnico' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-2 animate-[riseIn_0.3s_ease_both]">
            {/* Left 2 cols: Phases and Tasks */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-[17px] font-extrabold text-[#161616] font-sans tracking-tight">Fasi & Attività Operative</h2>
                {isInternalBoss && (
                  <button
                    onClick={() => onAddPhase(p.id)}
                    className="bg-[#161616] hover:bg-black text-white text-[12px] font-bold py-2 px-4 rounded-full flex items-center gap-1.5 cursor-pointer border-none shadow-sm font-sans transition-all active:scale-95"
                  >
                    + Aggiungi Fase
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {plist.map(([phId, ph]: any) => {
                  const tasksList = Object.entries(ph.tasks || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));
                  const totTasks = tasksList.length;
                  const doneTasks = tasksList.filter(([, t]: any) => t.done).length;
                  const isOpen = openPhases.has(phId);
                  const pStatus = getPhaseStatus(ph);

                  const phBadgeColor = pStatus === 'completato' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : pStatus === 'in_corso' 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : 'bg-gray-50 text-gray-600 border-gray-200';

                  const numBgColor = pStatus === 'completato' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700';

                  return (
                    <div
                      key={phId}
                      className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm transition-all hover:border-gray-300"
                    >
                      <div
                        onClick={() => {
                          const nextOpen = new Set(openPhases);
                          if (isOpen) nextOpen.delete(phId);
                          else nextOpen.add(phId);
                          setOpenPhases(nextOpen);
                        }}
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 font-sans">
                          <span className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${numBgColor}`}>
                            {pStatus === 'completato' ? '✓' : (ph.order || 0) + 1}
                          </span>
                          <div className="min-w-0 text-left">
                            <b className="block text-[14px] font-bold text-[#161616] leading-tight truncate">{ph.name}</b>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wide ${phBadgeColor}`}>
                                {pStatus === 'completato' ? 'Completata' : pStatus === 'in_corso' ? 'In corso' : 'Da fare'}
                              </span>
                              <span className="text-[12px] text-[#8a8a8a] font-medium">{doneTasks}/{totTasks} tasks completati</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {isInternalBoss && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePhase(p.id, phId);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-700 bg-transparent border-none cursor-pointer transition-all"
                              title="Elimina fase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" className={`w-3.5 h-3.5 text-[#8a8a8a] transition-all flex-shrink-0 ${isOpen ? 'transform rotate-180 text-gray-950' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t border-[#f5f5f5] p-4 bg-[#fafafa]/40 flex flex-col gap-2.5">
                          {tasksList.length > 0 ? (
                            tasksList.map(([tId, t]: any) => {
                              const assignee = t.assignee && users[t.assignee] ? users[t.assignee].name : null;

                              return (
                                <div
                                  key={tId}
                                  className={`flex items-center justify-between p-3 rounded-xl border select-none transition-all hover:border-[#161616] hover:bg-white group/task ${
                                    t.done 
                                      ? 'bg-gray-50/50 border-[#e5e5e5] opacity-60' 
                                      : 'bg-white border-[#e5e5e5] shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <button
                                      onClick={() => onTogglePtask(p.id, phId, tId)}
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                                        t.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white hover:border-black'
                                      }`}
                                    >
                                      {t.done && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      )}
                                    </button>

                                    <div className="min-w-0 text-left">
                                      <b className={`block text-[13px] font-bold text-[#161616] ${t.done ? 'line-through text-gray-400 font-medium' : ''}`}>
                                        {t.title}
                                      </b>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-gray-400 text-[10.5px] font-bold font-mono">
                                        {t.role && (
                                          <span className="bg-[#161616] text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                                            {t.role}
                                          </span>
                                        )}
                                        {assignee && (
                                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[9.5px]">
                                            👤 {assignee}
                                          </span>
                                        )}
                                        {t.due && (
                                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] ${t.due < todayISO() && !t.done ? 'bg-red-50 text-red-700 font-bold' : 'bg-gray-50 text-gray-500'}`}>
                                            📅 Scadenza: {fmtDay(t.due)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isInternalBoss && (
                                      <div className="flex gap-1 md:opacity-0 md:group-hover/task:opacity-100 transition-all">
                                        <button
                                          onClick={() => onEditPtask(p.id, phId, tId)}
                                          className="w-[28px] h-[28px] rounded-full bg-gray-50 hover:bg-[#ececec] text-[#a8a8a8] hover:text-[#161616] flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-[#e2e2e2]"
                                          title="Modifica"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onDeletePtask(p.id, phId, tId)}
                                          className="w-[28px] h-[28px] rounded-full bg-gray-50 hover:bg-red-50 text-[#a8a8a8] hover:text-red-700 flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-[#e2e2e2]"
                                          title="Elimina"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-5 bg-white rounded-xl border border-dashed border-[#e2e2e2]">
                              <p className="text-[12.5px] text-[#a8a8a8] italic font-medium">Nessun task in questa fase</p>
                            </div>
                          )}

                          {isInternalBoss && (
                            <button
                              onClick={() => onAddPtask(p.id, phId)}
                              className="self-start mt-1.5 bg-[#161616] hover:bg-black text-white text-[11px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1 cursor-pointer border-none shadow-xs transition-all active:scale-95"
                            >
                              + Aggiungi attività
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Task agenda collegati a questa pratica */}
              {(() => {
                const linked = agendaTasks.filter((t) => t.projectId === p.id);
                if (linked.length === 0) return null;
                return (
                  <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-left">
                        <h3 className="text-[14px] font-extrabold text-[#161616] font-sans tracking-tight">Impegni agenda collegati</h3>
                        <p className="text-[10.5px] text-[#8a8a8a] mt-0.5 font-medium">Task dell'agenda personale/di studio collegati a questa pratica</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#8a8a8a]">{linked.length}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {linked
                        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                        .map((t) => {
                          const names = (t.assignees && t.assignees.length ? t.assignees : t.assignee ? [t.assignee] : [])
                            .map((uid) => users[uid]?.name)
                            .filter(Boolean);
                          return (
                            <div key={t.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e5e5e5] bg-white transition-all hover:border-[#161616] ${t.done ? 'opacity-60' : ''}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => onToggleAgendaTask?.(t.id, t.date || todayISO())}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                                    t.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white hover:border-black'
                                  }`}
                                >
                                  {t.done && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>
                                <div className="min-w-0 text-left">
                                  <b className={`block text-[13px] font-bold text-[#161616] ${t.done ? 'line-through text-gray-400 font-medium' : ''}`}>{t.title}</b>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap text-gray-400 text-[10.5px] font-bold font-mono">
                                    {t.date && (
                                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] ${t.date < todayISO() && !t.done ? 'bg-red-50 text-red-700 font-bold' : 'bg-gray-50 text-gray-500'}`}>
                                        📅 {fmtDay(t.date)}{t.time ? ` · ${t.time}` : ''}
                                      </span>
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold tracking-wider ${
                                      t.priority === 'urgente' ? 'bg-rose-50 text-rose-700' : t.priority === 'alta' ? 'bg-orange-50 text-orange-700' : t.priority === 'media' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>{t.priority}</span>
                                    {names.length > 0 && (
                                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[9.5px]">👤 {names.join(', ')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isInternalBoss && onEditAgendaTask && (
                                <button
                                  onClick={() => onEditAgendaTask(t.id)}
                                  className="w-[28px] h-[28px] rounded-full bg-gray-50 hover:bg-[#ececec] text-[#a8a8a8] hover:text-[#161616] flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-[#e2e2e2] shrink-0"
                                  title="Modifica"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right column: Document storage */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm text-left">
                <div className="flex justify-between items-center mb-4 border-b border-[#f5f5f5] pb-3">
                  <div>
                    <h3 className="text-[14px] font-extrabold text-[#161616] font-sans tracking-tight">Documenti di Commessa</h3>
                    <p className="text-[10.5px] text-[#8a8a8a] mt-0.5 font-medium">Archivio PDF, DWG e schede tecniche</p>
                  </div>
                  <label className="bg-[#1b1b1b] hover:bg-black text-white text-[11.5px] font-bold py-1.5 px-3.5 rounded-full flex items-center gap-1 cursor-pointer select-none transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Carica
                    <input type="file" onChange={handleFileUpload} className="hidden" multiple />
                  </label>
                </div>

                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {docs.length > 0 ? (
                    docs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-[#ececec] hover:border-gray-300 bg-[#fafafa]/50 hover:bg-white transition-all duration-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <b className="block text-[13px] text-[#161616] truncate font-bold leading-tight">{doc.name}</b>
                            <span className="text-[10px] text-[#8a8a8a] block font-semibold font-mono mt-0.5">
                              {doc.byName || 'Inviato'} · {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <a
                            href={safeUrl(doc.url) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#8a8a8a] hover:text-[#161616] transition-colors"
                            title="Apri documento"
                          >
                            <FileDown className="w-4 h-4" />
                          </a>
                          {isInternalBoss && (
                            <button
                              onClick={() => onDeleteDocument(p.id, doc.id)}
                              className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-[#8a8a8a] hover:text-red-700 bg-transparent border-none cursor-pointer transition-colors"
                              title="Rimuovi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <FolderOpen className="w-10 h-10 opacity-20 mx-auto mb-2" />
                      <p className="italic text-[12.5px] font-medium">Nessun documento nel fascicolo.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ARREDI & MOODBOARD */}
        {projTab === 'arredi' && (
          <div className="mt-2 animate-[riseIn_0.3s_ease_both]">
            <FurnishingsBoard
              project={p}
              items={Object.values(furnishings[p.id] || {})}
              myUid={myUid}
              myRole={users[myUid]?.role || 'staff'}
              isStudio={true}
              onSaveItem={onSaveFurnishing || (() => {})}
              onDeleteItem={onDeleteFurnishing || (() => {})}
              onToggleStudioManagesMobili={onToggleStudioManagesMobili}
              moodboard3dElements={moodboard3d[p.id]?.elements || []}
              onSaveMoodboard3d={onSaveMoodboard3d}
            />
          </div>
        )}

        {/* TAB: CANTIERE (studio/materico/unico) */}
        {projTab === 'cantiere' && (
          <div className="mt-2 animate-[riseIn_0.3s_ease_both]">
            <CantiereBoard
              mode="studio"
              myUid={myUid}
              myName={users[myUid]?.name || 'Studio'}
              myRole={users[myUid]?.role || 'staff'}
              project={{ id: p.id, name: p.name, division: p.division, client: (p.clientRecordId && clients[p.clientRecordId]?.name) || p.client, committente: p.committente, location: p.location }}
              cantieri={Object.values(cantieri).filter((c) => c.projectId === p.id)}
              rapportini={cantRapportini}
              presenze={cantPresenze}
              foto={cantFoto}
              materiali={cantMateriali}
              checklist={cantChecklist}
              documenti={cantDocumenti}
              sal={cantSal}
              log={cantLog}
              records={cantRecords}
              messages={cantMessages}
              impresaDocs={impresaDocs}
              impresaRecords={impresaRecords}
              partnerAccounts={partnerAccounts}
              partnerRecords={Object.values(clients).filter((cr) => cr.category === 'partner')}
              onCreatePartnerRecord={onSaveClientRecord}
              onSaveCantiere={onSaveCantiere}
              onDeleteCantiere={onDeleteCantiere}
              onAssignPartner={onAssignPartner}
              onSaveEntity={onSaveCantEntity}
              onDeleteEntity={onDeleteCantEntity}
              onSendMessage={onSendCantiereMessage}
              onDeleteMessage={onDeleteCantiereMessage}
              onSaveImpresaEntity={onSaveImpresaEntity}
              onDeleteImpresaEntity={onDeleteImpresaEntity}
              onApproveRapportino={onApproveRapportino}
              onApproveSal={onApproveSal}
            />
          </div>
        )}

        {/* TAB 3: CONTABILITÀ & BILANCIO (Partitioned Studio and Progetto) */}
        {projTab === 'finanziario' && (
          !isInternalBoss ? (
            <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-8 shadow-sm mt-2 text-center">
              <Wallet className="w-7 h-7 text-stone-300 mx-auto mb-2" />
              <p className="text-[13px] text-stone-500 font-semibold">Contabilità riservata ad Amministratori e Manager.</p>
            </div>
          ) : (
          <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 shadow-sm mt-2 animate-[riseIn_0.3s_ease_both] text-left">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-[#f5f5f5] pb-4">
              <div>
                <h2 className="text-[16px] font-extrabold tracking-tight text-[#161616] leading-none mb-1.5 font-sans">Contabilità di commessa</h2>
                <p className="text-[12px] text-[#8a8a8a] font-medium">Quadro economico, ricavi/costi e scadenze di questo progetto — collegati in tempo reale alla sezione <b>Finanze</b>.</p>
              </div>
              <span className="text-[10.5px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-black uppercase tracking-wide text-slate-700 capitalize">{p.division || 'studio'}</span>
            </div>

            {/* A. QUADRO ECONOMICO AUTOMATICO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-[#fafafa]/60 border border-[#f0f0f0] rounded-2xl p-3.5">
                <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Valore opera</span>
                <b className="text-[15px] font-black text-[#161616]">{eur(valoreOpera)}</b>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">computo + arredi fissi confermati</span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5">
                <span className="text-[9.5px] uppercase font-black text-indigo-500 tracking-wider block">Parcella Studio</span>
                <b className="text-[15px] font-black text-indigo-800">{eur(parcellaTeorica)}</b>
                <span className="text-[9.5px] text-indigo-400 block mt-0.5">onorari {Math.round(projParcella.feePct * 100)}%{projParcella.feeMobili > 0 ? ' + arredi' : ''}</span>
              </div>
              <div className="bg-[#fafafa]/60 border border-[#f0f0f0] rounded-2xl p-3.5">
                <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Ricavi fatturati</span>
                <b className="text-[15px] font-black text-[#161616]">{eur(ricaviFatturati)}</b>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">{projInvActive.length} fatture attive</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5">
                <span className="text-[9.5px] uppercase font-black text-emerald-600 tracking-wider block">Incassato</span>
                <b className="text-[15px] font-black text-emerald-700">{eur(incassato)}</b>
                <span className="text-[9.5px] text-emerald-500 block mt-0.5">da incassare {eur(daIncassare)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-3.5">
                <span className="text-[9.5px] uppercase font-black text-rose-500 tracking-wider block">Costi</span>
                <b className="text-[15px] font-black text-rose-700">{eur(costiFatture)}</b>
                <span className="text-[9.5px] text-rose-400 block mt-0.5">{projInvPassive.length} fatture passive</span>
              </div>
              <div className="bg-[#fafafa]/60 border border-[#f0f0f0] rounded-2xl p-3.5">
                <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Margine atteso</span>
                <b className={`text-[15px] font-black ${margineAtteso >= 0 ? 'text-[#161616]' : 'text-rose-700'}`}>{eur(margineAtteso)}</b>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">parcella − costi</span>
              </div>
              <div className={`rounded-2xl p-3.5 border ${margineRealizzato >= 0 ? 'bg-[#1b1b1b] border-[#1b1b1b]' : 'bg-rose-700 border-rose-700'}`}>
                <span className="text-[9.5px] uppercase font-black text-stone-300 tracking-wider block">Margine realizzato</span>
                <b className="text-[16px] font-black text-green-400">{eur(margineRealizzato)}</b>
                <span className="text-[9.5px] text-stone-400 block mt-0.5">incassato − costi</span>
              </div>
              <div className="bg-[#fafafa]/60 border border-[#f0f0f0] rounded-2xl p-3.5 flex flex-col justify-center">
                <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">Avanzamento economico</span>
                <b className="text-[15px] font-black text-[#161616]">{avanzamentoEco}%</b>
                <div className="h-1.5 mt-1.5 rounded-full bg-stone-200 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${avanzamentoEco}%` }} />
                </div>
              </div>
            </div>

            {/* Piano SAL */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/40 border border-amber-100 rounded-2xl px-4 py-3 mb-6">
              <span className="text-[11.5px] font-bold text-amber-800 inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Piano SAL: {projPhases.length} fasi × {eur(salPer)}
              </span>
              <span className="text-[11.5px] font-black text-amber-900">Totale parcella a SAL: {eur(parcellaTeorica)}</span>
            </div>

            {/* B. PREVENTIVI & PARCELLE della commessa (collegati a Finanze → Preventivi) */}
            <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-4 mb-6">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-150 pb-2 mb-3">
                <span className="text-[12px] font-black text-stone-800 uppercase tracking-wide inline-flex items-center gap-1.5">
                  <FileSignature className="w-3.5 h-3.5" /> Preventivi &amp; Parcelle
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQuoteDraft(emptyQuoteDraft('studio', p, 'parcella'))}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-[#e2e2e2] text-[#161616] bg-white rounded-full px-3 py-1.5 hover:border-black transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Parcella
                  </button>
                  <button
                    onClick={() => setQuoteDraft(emptyQuoteDraft('studio', p, 'preventivo'))}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold bg-[#1b1b1b] hover:bg-black text-white border-none rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Preventivo
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {projQuotes.length === 0 ? (
                  <p className="text-[11.5px] text-stone-400 italic py-3 text-center">Nessun preventivo o parcella per questa commessa. Aggiungine uno: comparirà anche in Finanze → Preventivi.</p>
                ) : projQuotes.map((q) => {
                  const totals = quoteTotals(q);
                  const plan = q.paymentPlan || [];
                  const daEmettere = plan.filter((m) => m.status === 'da_emettere');
                  return (
                    <div key={q.id} className="bg-white p-3 rounded-xl border border-stone-150 text-[12px] flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <b className="text-stone-900">{q.number || '(senza numero)'}</b>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${q.docKind === 'parcella' ? 'bg-indigo-50 text-indigo-700' : 'bg-stone-100 text-stone-600'}`}>
                            {q.docKind === 'parcella' ? 'Parcella' : 'Preventivo'}
                          </span>
                          <span className="text-[10.5px] text-stone-500">
                            imponibile {eur(totals.imponibile)}{totals.totale !== totals.imponibile ? <> · tot. doc. <b className="text-stone-800">{eur(totals.totale)}</b></> : null}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={q.status}
                            onChange={(e) => onSetQuoteStatus?.(q.id, e.target.value as Quote['status'])}
                            className="px-2 py-1 rounded-lg border border-stone-200 text-[11px] font-bold outline-none bg-white cursor-pointer"
                          >
                            <option value="elaborato">Elaborato</option>
                            <option value="in_attesa">In attesa</option>
                            <option value="accettato">Accettato</option>
                            <option value="rifiutato">Rifiutato</option>
                          </select>
                          <button onClick={() => setQuoteDraft(q)} className="px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-black text-white text-[11px] font-bold border-none cursor-pointer">Modifica</button>
                          <button onClick={() => onDeleteQuote?.(q.id)} className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 cursor-pointer" title="Elimina (nel Cestino)"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      {plan.length > 0 && (
                        <div className="flex flex-col gap-1 pt-1.5 border-t border-stone-100">
                          {plan.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-2 text-[11.5px]">
                              <span className="truncate text-stone-600">{m.label}{m.dueDate ? ` · ${m.dueDate}` : ''}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-stone-800">{eur(m.amount)}</span>
                                {m.status === 'da_emettere' ? (
                                  <button onClick={() => onEmitMilestone?.(q.id, m.id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold border-none cursor-pointer"><Receipt className="w-3 h-3" /> Emetti</button>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">{m.status === 'incassato' ? 'Incassato' : 'Fatturato'}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {daEmettere.length > 0 && <span className="text-[10px] text-stone-400">"Emetti" genera bozza fattura + scadenza in Finanze.</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. AZIONI RAPIDE — Registra */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-[11px] font-bold text-[#8a8a8a] mr-1">Registra:</span>
              <button onClick={() => { setQaKind('ricavo'); setQaDate(todayISO()); }} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-emerald-200 text-emerald-700 bg-emerald-50/50 rounded-full px-3 py-1.5 hover:bg-emerald-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Ricavo / incasso
              </button>
              <button onClick={() => { setQaKind('costo'); setQaDate(todayISO()); }} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-rose-200 text-rose-700 bg-rose-50/50 rounded-full px-3 py-1.5 hover:bg-rose-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Costo (fornitore)
              </button>
              <button onClick={() => { setQaKind('scadenza'); setQaDate(todayISO()); }} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-sky-200 text-sky-700 bg-sky-50/50 rounded-full px-3 py-1.5 hover:bg-sky-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Scadenza
              </button>
              <button onClick={() => onOpenProjectFinance(p.id)} className="inline-flex items-center gap-1 text-[11.5px] font-bold border border-[#e2e2e2] text-[#6b6b6b] bg-white rounded-full px-3 py-1.5 hover:border-black hover:text-[#161616] transition-colors ml-auto">
                <Plus className="w-3.5 h-3.5" /> Movimento libero
              </button>
            </div>

            {/* Ricavi & Costi (fatture del progetto) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Ricavi */}
              <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-4">
                <div className="flex justify-between items-center border-b border-stone-150 pb-2 mb-3">
                  <span className="text-[12px] font-black text-stone-800 uppercase tracking-wide">Ricavi (fatture attive)</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">{eur(ricaviFatturati)}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {projInvActive.length === 0 ? (
                    <p className="text-[11.5px] text-stone-400 italic py-4 text-center">Nessun ricavo registrato.</p>
                  ) : projInvActive.map((inv: any) => (
                    <div key={inv.id} className="bg-white p-2.5 rounded-xl border border-stone-150 text-[12px] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <b className="block text-stone-900 truncate">{inv.clientName || 'Cliente'}{inv.isSal ? ` · SAL ${inv.salNumber || ''}` : ''}</b>
                        <span className="text-[10.5px] text-stone-500 font-mono">{fmtDay(inv.date)} · {inv.status === 'pagata' ? 'Incassata ✓' : 'Da incassare'}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-black text-emerald-700 font-mono">{eur(Number(inv.amount))}</span>
                        <button onClick={() => onDeleteFinanceItem?.('finInvoicesActive', inv.id)} className="text-stone-300 hover:text-red-500 transition-colors" title="Rimuovi"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Costi */}
              <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-4">
                <div className="flex justify-between items-center border-b border-stone-150 pb-2 mb-3">
                  <span className="text-[12px] font-black text-stone-800 uppercase tracking-wide">Costi (fatture passive)</span>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold font-mono">{eur(costiFatture)}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {projInvPassive.length === 0 ? (
                    <p className="text-[11.5px] text-stone-400 italic py-4 text-center">Nessun costo registrato.</p>
                  ) : projInvPassive.map((inv: any) => (
                    <div key={inv.id} className="bg-white p-2.5 rounded-xl border border-stone-150 text-[12px] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <b className="block text-stone-900 truncate">{inv.supplierName || 'Fornitore'}</b>
                        <span className="text-[10.5px] text-stone-500 font-mono">{fmtDay(inv.date)} · {inv.category || 'Fornitori'}{inv.status === 'pagata' ? ' · Pagata ✓' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-black text-rose-700 font-mono">{eur(Number(inv.amount))}</span>
                        <button onClick={() => onDeleteFinanceItem?.('finInvoicesPassive', inv.id)} className="text-stone-300 hover:text-red-500 transition-colors" title="Rimuovi"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* C. SCADENZIARIO */}
            <div className="bg-stone-50/50 border border-stone-200 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center border-b border-stone-150 pb-2 mb-3">
                <span className="text-[12px] font-black text-stone-800 uppercase tracking-wide">Scadenziario della commessa</span>
                <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-bold font-mono">{projScadenze.length} scadenze</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {projScadenze.length === 0 ? (
                  <p className="text-[11.5px] text-stone-400 italic py-4 text-center">Nessuna scadenza pianificata.</p>
                ) : projScadenze.map((sc: any) => (
                  <div key={sc.id} className="bg-white p-2.5 rounded-xl border border-stone-150 text-[12px] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <b className="block text-stone-900 truncate">{sc.desc || 'Scadenza'} {sc.clientOrSupplier ? `· ${sc.clientOrSupplier}` : ''}</b>
                      <span className="text-[10.5px] text-stone-500 font-mono">Scad: {fmtDay(sc.dueDate)} · {sc.kind === 'entrata' ? 'Entrata' : 'Uscita'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-black font-mono ${sc.kind === 'entrata' ? 'text-emerald-700' : 'text-rose-700'}`}>{eur(Number(sc.amount))}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.status === 'pagato' ? 'bg-emerald-50 text-emerald-700' : sc.status === 'scaduta' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {sc.status === 'pagato' ? 'Saldata' : sc.status === 'scaduta' ? 'Scaduta' : 'In attesa'}
                      </span>
                      <button onClick={() => onDeleteFinanceItem?.('finScadenze', sc.id)} className="text-stone-300 hover:text-red-500 transition-colors" title="Rimuovi"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. MOVIMENTI LIBERI (cassa) */}
            <div className="border-t border-stone-200 pt-5">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <div>
                  <h3 className="text-[13px] font-black text-stone-900 uppercase tracking-wide font-sans">Movimenti liberi (cassa)</h3>
                  <p className="text-[11px] text-stone-500">Saldo {eur(movSaldo)} · entrate {eur(movEntrate)} · uscite {eur(movUscite)} — non conteggiati nel margine.</p>
                </div>
                <button
                  onClick={() => setShowFinFilters(!showFinFilters)}
                  className={`text-[12px] font-bold py-1.5 px-3.5 rounded-full flex items-center gap-1.5 cursor-pointer border transition-all active:scale-95 font-sans ${
                    showFinFilters ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-gray-700 border-[#e2e2e2] hover:border-black hover:text-[#161616]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filtri
                  {(finType !== 'tutti' || finCategory !== 'tutte' || finQuery !== '') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                </button>
              </div>

              {showFinFilters && (
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center mb-4 p-4 rounded-2xl bg-[#fafafa]/80 border border-gray-150 animate-[riseIn_0.2s_ease_both]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={finQuery} onChange={(e) => setFinQuery(e.target.value)} placeholder="Cerca movimento, causale..." className="pl-9 pr-4 py-2 text-[12.5px] font-medium rounded-full border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] w-full" />
                  </div>
                  <div className="flex bg-white border border-[#e5e5e5] p-[2.5px] rounded-full self-start lg:self-auto shadow-xs">
                    {(['tutti', 'entrata', 'uscita'] as const).map(t => (
                      <button key={t} onClick={() => setFinType(t)} className={`text-[11.5px] font-bold px-3 py-1 rounded-full border-none cursor-pointer transition-all ${finType === t ? 'bg-[#161616] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
                        {t === 'tutti' ? 'Tutti' : t === 'entrata' ? 'Entrate' : 'Uscite'}
                      </button>
                    ))}
                  </div>
                  <select value={finCategory} onChange={(e) => setFinCategory(e.target.value)} className="px-4 py-1.5 text-[11.5px] font-semibold text-[#161616] rounded-full border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] cursor-pointer">
                    <option value="tutte">Tutte le categorie</option>
                    {movCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <select value={finSort} onChange={(e) => setFinSort(e.target.value as any)} className="px-4 py-1.5 text-[11.5px] font-semibold text-[#161616] rounded-full border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] cursor-pointer">
                    <option value="data_desc">Più recenti</option>
                    <option value="data_asc">Meno recenti</option>
                    <option value="importo_desc">Importo: Decrescente</option>
                    <option value="importo_asc">Importo: Crescente</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredFinList.length > 0 ? filteredFinList.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-[#ececec] bg-[#f9f9f9]/40 hover:border-gray-300 transition-colors">
                    <div className="min-w-0">
                      <b className="block text-[13px] font-bold text-[#161616] tracking-tight truncate">{f.desc}</b>
                      <small className="text-[#8a8a8a] font-medium block mt-0.5 font-mono">
                        {fmtDay(f.date)} {f.category ? <>· <span className="bg-[#f0f0f0] text-[#161616] px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase font-sans tracking-wide">{f.category}</span></> : null} {f.note ? `· ${f.note}` : ''}
                      </small>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 font-mono">
                      <span className={`font-black text-[14px] ${f.kind === 'entrata' ? 'text-green-700' : 'text-red-700'}`}>{f.kind === 'entrata' ? '+' : '-'} {eur(f.amount)}</span>
                      <button onClick={() => onDeleteProjectFinance(p.id, f.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#a8a8a8] hover:text-red-750 flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors" title="Rimuovi"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 bg-gray-50/40 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[12.5px] text-gray-400 italic font-medium">Nessun movimento libero.</p>
                  </div>
                )}
              </div>
            </div>

            {/* EDITOR preventivo/parcella della commessa */}
            {quoteDraft && (
              <QuoteEditor
                initial={quoteDraft}
                isNew={!quotes[quoteDraft.id]}
                clients={clients}
                projects={[p]}
                priceList={priceList}
                lockProject={p}
                onSave={(q) => onSaveQuote?.(q)}
                onClose={() => setQuoteDraft(null)}
              />
            )}

            {/* MODALE Registra costo/ricavo/scadenza */}
            {qaKind && (
              <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setQaKind(null)}>
                <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-sm p-6 shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h4 className="text-[15px] font-extrabold text-[#161616] mb-4">
                    {qaKind === 'costo' ? 'Registra costo (fornitore)' : qaKind === 'ricavo' ? 'Registra ricavo / incasso' : 'Aggiungi scadenza'}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {qaKind === 'scadenza' && (
                      <div className="flex bg-[#f1f1f1] rounded-full p-1">
                        {(['entrata', 'uscita'] as const).map(k => (
                          <button key={k} onClick={() => setQaScadKind(k)} className={`flex-1 text-[11.5px] font-bold py-1.5 rounded-full transition-colors ${qaScadKind === k ? 'bg-[#1b1b1b] text-white' : 'text-[#6b6b6b]'}`}>
                            {k === 'entrata' ? 'Entrata' : 'Uscita'}
                          </button>
                        ))}
                      </div>
                    )}
                    <input value={qaDesc} onChange={(e) => setQaDesc(e.target.value)} placeholder={qaKind === 'costo' ? 'Descrizione costo' : qaKind === 'ricavo' ? 'Descrizione / causale' : 'Descrizione scadenza'} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                    <input value={qaParty} onChange={(e) => setQaParty(e.target.value)} placeholder={qaKind === 'costo' ? 'Fornitore' : 'Cliente / controparte'} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                    <input type="number" inputMode="decimal" value={qaAmount} onChange={(e) => setQaAmount(e.target.value)} placeholder="Importo €" className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                    <div className="flex gap-2">
                      <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1 flex-1">
                        {qaKind === 'scadenza' ? 'Data' : 'Data documento'}
                        <input type="date" value={qaDate} onChange={(e) => setQaDate(e.target.value)} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                      </label>
                      <label className="text-[11px] font-semibold text-[#6b6b6b] flex flex-col gap-1 flex-1">
                        Scadenza
                        <input type="date" value={qaDue} onChange={(e) => setQaDue(e.target.value)} className="w-full border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 text-[13px] outline-none focus:border-[#1b1b1b]" />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => setQaKind(null)} className="flex-1 border border-[#e2e2e2] rounded-full py-2.5 text-[12.5px] font-bold text-[#6b6b6b] hover:bg-[#f5f5f5]">Annulla</button>
                    <button onClick={saveQuickAdd} disabled={!qaAmount.trim()} className="flex-1 bg-[#1b1b1b] hover:bg-black disabled:opacity-40 text-white rounded-full py-2.5 text-[12.5px] font-bold inline-flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Registra
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          )
        )}
      </div>
    );
  }

  // RENDER PROJECTS DIRECTORY LIST
  const allList = projects.filter(p => {
    // Check brand business division
    const projDiv = p.division || 'studio';
    if (projDiv !== divisionFilter) return false;

    // I progetti archiviati compaiono SOLO nel filtro "Archivio".
    if (filter === 'archivio') {
      if (!p.archived && p.status !== 'sospeso' && p.status !== 'annullato') return false;
    } else if (p.archived) {
      return false;
    }
    if (filter === 'attivi' && p.status !== 'attivo') return false;
    if (filter === 'completati' && p.status !== 'completato') return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || (p.client && p.client.toLowerCase().includes(q)) || (p.location && p.location.toLowerCase().includes(q));
    }
    return true;
  });

  // Materico: dentro la divisione Materico l'operatore può passare da "Progetti" all'inbox "Richieste & Offerte".
  const showMatericoInbox = divisionFilter === 'materico' && isInternalBoss && matericoTab === 'richieste';
  const matericoActionable = matericoRequests.filter(r => r.status === 'nuova' || r.status === 'offerte').length;

  // Unico: dentro la divisione Unico l'operatore passa da "Progetti" al modulo "Operazioni & Investitori".
  const showUnicoStudio = divisionFilter === 'unico' && isInternalBoss && unicoTab === 'studio';
  // Strategico: dentro la divisione Strategico l'operatore passa da "Progetti" al modulo Marketing.
  // Strategico = società di marketing: per admin/manager mostra SEMPRE il modulo marketing
  // (project-centric), senza più l'interruttore "Progetti | Marketing & Eventi".
  const showStrategicoStudio = divisionFilter === 'strategico' && isInternalBoss;
  // Nasconde lista/filtri progetti quando è attiva una sotto-vista dedicata.
  const hideProjectsUI = showMatericoInbox || showUnicoStudio || showStrategicoStudio;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Filtering and search */}
      <div className="flex items-center justify-between gap-4 flex-wrap w-full">
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          {/* Brand Division Workspace Selector */}
          <div className="flex items-center bg-[#161616] border border-neutral-800 p-[3px] rounded-full gap-[2px] w-full sm:w-auto relative z-10">
            {([
              { id: 'studio', label: 'ONIRICO' },
              { id: 'strategico', label: 'STRATEGICO' },
              { id: 'materico', label: 'MATERICO' },
              { id: 'unico', label: 'UNICO' }
            ] as const).map(div => {
              const active = divisionFilter === div.id;
              return (
                <button
                  key={div.id}
                  onClick={() => setDivisionFilter(div.id)}
                  className={`relative flex-1 sm:flex-initial text-center text-[11px] sm:text-[12px] font-extrabold px-3 sm:px-4 py-1.5 rounded-full uppercase cursor-pointer select-none transition-colors duration-300 border-none bg-transparent ${
                    active ? 'text-black' : 'text-[#a3a3a3] hover:text-white'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {/* Underlay Active Pill animation using layoutId */}
                  {active && (
                    <motion.div
                      layoutId="indexDivisionActivePill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32
                      }}
                      className="absolute inset-0 bg-white rounded-full z-0"
                    />
                  )}
                  <span className="relative z-10 font-extrabold">{div.label}</span>
                </button>
              );
            })}
          </div>

          {/* Materico sub-section: Progetti vs Richieste & Offerte (hub operatore) */}
          {divisionFilter === 'materico' && isInternalBoss && (
            <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] w-full sm:w-auto relative z-10">
              {([
                { id: 'progetti', label: 'Progetti' },
                { id: 'richieste', label: 'Richieste & Offerte' }
              ] as const).map(t => {
                const active = matericoTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setMatericoTab(t.id)}
                    className={`relative flex-1 sm:flex-initial text-center text-[11px] sm:text-[12px] font-extrabold px-3.5 sm:px-4 py-1.5 rounded-full cursor-pointer select-none transition-colors duration-300 border-none bg-transparent inline-flex items-center justify-center gap-1.5 ${
                      active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="matericoSubTabActivePill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-full z-0 shadow-xs"
                      />
                    )}
                    <span className="relative z-10 font-extrabold">{t.label}</span>
                    {t.id === 'richieste' && matericoActionable > 0 && (
                      <span className="relative z-10 text-[9px] font-extrabold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center bg-[#c2410c] text-white">
                        {matericoActionable}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Unico sub-section: Progetti vs Operazioni & Investitori (modulo studio) */}
          {divisionFilter === 'unico' && isInternalBoss && (
            <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] w-full sm:w-auto relative z-10">
              {([
                { id: 'progetti', label: 'Progetti' },
                { id: 'studio', label: 'Operazioni & Investitori' }
              ] as const).map(t => {
                const active = unicoTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setUnicoTab(t.id)}
                    className={`relative flex-1 sm:flex-initial text-center text-[11px] sm:text-[12px] font-extrabold px-3.5 sm:px-4 py-1.5 rounded-full cursor-pointer select-none transition-colors duration-300 border-none bg-transparent inline-flex items-center justify-center gap-1.5 ${
                      active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="unicoSubTabActivePill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-full z-0 shadow-xs"
                      />
                    )}
                    <span className="relative z-10 font-extrabold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Strategico = società di marketing: niente pratiche, solo il modulo marketing
              (Dashboard → Progetti marketing → workspace). Nessun interruttore. */}

          {/* Main Status Navbar */}
          {!hideProjectsUI && (<>
          <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] w-full sm:w-auto relative z-10">
            {([
              { id: 'attivi', label: 'Attivi' },
              { id: 'completati', label: 'Completati' },
              { id: 'archivio', label: 'Archivio' },
              { id: 'tutti', label: 'Tutti' }
            ] as const).map(option => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={`relative flex-1 sm:flex-initial text-center text-[11px] sm:text-[12px] font-extrabold px-3.5 sm:px-4 py-1.5 rounded-full capitalize cursor-pointer select-none transition-colors duration-300 border-none bg-transparent ${
                    active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {/* Underlay Active Pill animation using layoutId */}
                  {active && (
                    <motion.div
                      layoutId="indexStatusActivePill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32
                      }}
                      className="absolute inset-0 bg-white rounded-full z-0 shadow-xs"
                    />
                  )}
                  <span className="relative z-10 font-extrabold">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inline Magnifying Glass Search Toggle */}
          <div className="relative flex items-center">
            {showSearchInput ? (
              <div className="flex items-center gap-2 bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full shadow-xs animate-[riseIn_0.2s_ease_both]">
                <Search className="w-3.5 h-3.5 text-gray-400 ml-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca progetto o cliente..."
                  className="bg-transparent border-none outline-none py-1 text-[12px] font-semibold text-[#161616] w-[180px] focus:ring-0 placeholder-gray-400 font-sans"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setShowSearchInput(false);
                    setSearch('');
                  }}
                  className="w-5 h-5 rounded-full bg-white flex items-center justify-center border-none cursor-pointer text-[#8a8a8a] hover:text-[#161616] hover:bg-gray-100 shadow-xs active:scale-95 text-[9px] font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-[#e2e2e2] cursor-pointer transition-all active:scale-95 ${
                  search.trim() 
                    ? 'bg-[#161616] text-white hover:bg-black border-[#161616]' 
                    : 'bg-white hover:bg-[#fafafa] text-[#8a8a8a] hover:text-[#161616] hover:border-black'
                }`}
                title="Cerca progetti"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </>)}
        </div>

        {!hideProjectsUI && (
        <div className="flex items-center gap-1.5 bg-white border border-[#e2e2e2] p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              viewMode === 'grid' ? 'bg-[#1b1b1b] text-white' : 'text-[#8a8a8a] hover:bg-[#f5f5f5]'
            }`}
          >
            <Grid className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              viewMode === 'list' ? 'bg-[#1b1b1b] text-white' : 'text-[#8a8a8a] hover:bg-[#f5f5f5]'
            }`}
          >
            <List className="w-4.5 h-4.5" />
          </button>
        </div>
        )}
      </div>

      {showUnicoStudio ? (
        <UnicoStudioView
          deals={unicoDeals}
          onSave={onSaveUnicoDeals || (() => {})}
          projects={projects}
          users={users}
          canEdit={isInternalBoss}
          onNotifyInvestors={onNotifyUnicoInvestors}
          askDelete={askDelete}
          onTrashItem={onTrashItem}
          internalOrders={internalOrders}
          onConfirmInternalOrder={onConfirmInternalOrder}
          onDeleteInternalOrder={onDeleteInternalOrder}
        />
      ) : showStrategicoStudio ? (
        <StrategicoView
          events={mktEvents}
          campaigns={mktCampaigns}
          surveys={mktSurveys}
          social={mktSocial}
          responses={mktResponses}
          clients={clients || {}}
          onSaveEvent={onSaveMktEvent || (() => {})}
          onDeleteEvent={onDeleteMktEvent || (() => {})}
          onSaveCampaign={onSaveCampaign || (() => {})}
          onDeleteCampaign={onDeleteCampaign || (() => {})}
          onSaveSurvey={onSaveSurvey || (() => {})}
          onDeleteSurvey={onDeleteSurvey || (() => {})}
          onSaveSocialPost={onSaveSocialPost || (() => {})}
          onDeleteSocialPost={onDeleteSocialPost || (() => {})}
          contracts={mktContracts}
          timeEntries={mktTime}
          projects={projects}
          invoicesActive={finInvoicesActive}
          invoicesPassive={finInvoicesPassive}
          scadenze={finScadenze}
          onSaveContract={onSaveMktContract || (() => {})}
          onDeleteContract={onDeleteMktContract || (() => {})}
          onEmitContractInvoice={onEmitContractInvoice || (() => {})}
          onSaveTimeEntry={onSaveMktTimeEntry || (() => {})}
          onDeleteTimeEntry={onDeleteMktTimeEntry || (() => {})}
          onBillTimeEntries={onBillTimeEntries || (() => {})}
          onRegisterCampaignSpend={onRegisterCampaignSpend || (() => {})}
          onRegisterEventFinance={onRegisterEventFinance || (() => {})}
          assets={mktAssets}
          deliverables={mktDeliverables}
          proofs={mktProofs}
          team={users}
          onSaveAsset={onSaveMktAsset || (() => {})}
          onDeleteAsset={onDeleteMktAsset || (() => {})}
          onSaveDeliverable={onSaveMktDeliverable || (() => {})}
          onDeleteDeliverable={onDeleteMktDeliverable || (() => {})}
          onSaveProof={onSaveMktProof || (() => {})}
          onDeleteProof={onDeleteMktProof || (() => {})}
          leads={mktLeads}
          flows={mktFlows}
          seo={mktSeo}
          ads={mktAds}
          metrics={mktMetrics}
          inbox={mktInbox}
          consents={mktConsents}
          onSaveLead={onSaveMktLead || (() => {})}
          onDeleteLead={onDeleteMktLead || (() => {})}
          onSaveFlow={onSaveMktFlow || (() => {})}
          onDeleteFlow={onDeleteMktFlow || (() => {})}
          onSaveSeo={onSaveMktSeo || (() => {})}
          onDeleteSeo={onDeleteMktSeo || (() => {})}
          onSaveAd={onSaveMktAd || (() => {})}
          onDeleteAd={onDeleteMktAd || (() => {})}
          onRegisterAdsSpend={onRegisterAdsSpend || (() => {})}
          onSaveMetric={onSaveMktMetric || (() => {})}
          onDeleteMetric={onDeleteMktMetric || (() => {})}
          onSaveInbox={onSaveMktInbox || (() => {})}
          onDeleteInbox={onDeleteMktInbox || (() => {})}
          onSaveConsent={onSaveMktConsent || (() => {})}
          onDeleteConsent={onDeleteMktConsent || (() => {})}
          mktProjects={mktProjects}
          onSaveMktProject={onSaveMktProject || (() => {})}
          onDeleteMktProject={onDeleteMktProject || (() => {})}
        />
      ) : showMatericoInbox ? (
        <MatericoView
          requests={matericoRequests}
          suppliers={matericoSuppliers}
          onUpdateRequest={onUpdateMatericoRequest || (() => {})}
          onDeleteRequest={onDeleteMatericoRequest || (() => {})}
          onApplyPenalty={onApplyMatericoPenalty}
        />
      ) : allList.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-3.5'}>
          {allList.map(p => {
            const { done, tot } = projTaskCounts(p);
            const pcpValue = tot ? Math.round((done / tot) * 100) : 0;
            const phSize = Object.keys(p.phases || {}).length;
            const dv = (({
              strategico: { bg: '#b45309', label: 'Strategico' },
              materico: { bg: '#c2410c', label: 'Materico' },
              unico: { bg: '#4338ca', label: 'Unico' }
            } as any)[p.division as any]) || { bg: '#161616', label: 'Onirico' };

            if (viewMode === 'grid') {
              return (
                <div
                  key={p.id}
                  onClick={() => onNav(`progetto/${p.id}`)}
                  className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col gap-4 text-left border-l-[5px]"
                  style={{ borderLeftColor: dv.bg }}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-11 h-11 text-white rounded-xl flex items-center justify-center shadow-xs" style={{ background: dv.bg }}>
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold tracking-wider text-white"
                        style={{ background: dv.bg }}
                      >
                        {dv.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10.5px] uppercase font-bold tracking-wide ${
                          p.status === 'attivo'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : p.status === 'completato'
                            ? 'bg-green-50 text-green-850 border border-green-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.archived && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          Archiviato
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[16px] text-[#161616] truncate leading-snug">{p.name}</h3>
                    <p className="text-[11px] text-[#8a8a8a] font-mono mt-1 font-bold">{p.code || 'ARC-COMMESSA'}</p>
                    <p className="text-[12.5px] text-[#333] mt-2 font-medium truncate">{p.client || 'Nessun cliente'}</p>
                  </div>

                  <div className="mt-auto pt-2.5 border-t border-[#f5f5f5]/80 flex flex-col gap-3">
                    <div className="w-full h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1b1b1b] rounded-full" style={{ width: `${pcpValue}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[11.5px] text-[#8a8a8a] font-bold uppercase tracking-wider">
                      <span>{pcpValue}%</span>
                      <span className="bg-[#f0f0f0] px-2 py-0.5 rounded text-[9.5px]">{phSize} Fasi</span>
                    </div>
                  </div>
                </div>
              );
            }

            // List Mode Row
            return (
              <div
                key={p.id}
                onClick={() => onNav(`progetto/${p.id}`)}
                className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-4 text-left border-l-[5px]"
                style={{ borderLeftColor: dv.bg }}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 text-white rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: dv.bg }}>
                    <Folder className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[14.5px] text-[#161616] truncate pr-2">{p.name}</h3>
                    <p className="text-[12px] text-[#8a8a8a] truncate mt-0.5">
                      <span className="font-extrabold" style={{ color: dv.bg }}>{dv.label}</span> · {p.client || 'Nessun cliente'} · {p.location || 'Ostuni'}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col gap-1 text-right flex-shrink-0">
                  <span className="text-[11px] text-[#8a8a8a] font-mono font-bold leading-none">{p.code || 'ARC-K'}</span>
                  <span className="text-[12px] text-[#161616] font-bold leading-none mt-1">{phSize} Fasi · {tot} Task</span>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-[14px] font-extrabold text-[#161616] tracking-tight">{pcpValue}%</div>
                  <div className="w-14 h-1 bg-[#ececec] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#1b1b1b] rounded-full" style={{ width: `${pcpValue}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-[70px] px-5 text-[#8a8a8a]">
          <Folder className="w-12 h-12 opacity-30 mx-auto mb-3.5" />
          <b className="block text-[#161616] text-[16px] font-bold">Nessun progetto trovato</b>
          <p className="text-[13.5px] max-w-[340px] mx-auto">Non sono presenti progetti attivi o corrispondenti alla ricerca fornita.</p>
        </div>
      )}
    </div>
  );
};
