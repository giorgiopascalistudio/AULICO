/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MatericoPortal } from './MatericoPortal';
import { ServicesShowcase } from './ServicesShowcase';
import type { MatericoRequest } from '../types';
import { 
  Send, 
  FileText, 
  Download, 
  Briefcase, 
  Calendar, 
  Sparkles, 
  LogOut, 
  Loader2, 
  Sparkle, 
  Upload, 
  ClipboardList, 
  MessageSquare,
  BookOpen,
  ArrowRight,
  Clock,
  ArrowLeft,
  Search,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Smartphone,
  Target,
  Sofa,
  HardHat,
  Building2,
  Gem,
  Wallet,
  Percent,
  MapPin,
  Megaphone,
  HandCoins,
  Star,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, UserProfile, MatericoEstimate, Furnishing, Cantiere, Rapportino, Presenza, CantiereFoto, CantiereMateriale, ChecklistItem, CantiereDoc, CantiereSal, CantiereLog, CantiereRecord, CantiereMessage, ImpresaDoc, ImpresaRecord, UnicoShowcaseEntry, UnicoInvestorPosition, MarketingEvent, Survey, SurveyResponse, RsvpStatus, ClientRequest, PointEvent } from '../types';
import { totalPoints, tierFor, nextTier, reliabilityScore } from '../points';
import { FurnishingsBoard } from './FurnishingsBoard';
import { ClientRequestPanel } from './ClientRequestPanel';
import { CantiereBoard } from './CantiereBoard';
import { ChatDeleteButton } from './ChatDeleteButton';
import { ImpresaArea } from './cantiere/ImpresaArea';
import { eur, fmtDay, isoDate, isForwardedTo } from '../utils';
import { useLang, LangToggle } from '../i18n';
import { BLOG_POSTS_IT, BLOG_POSTS_EN } from '../blogPosts';
import { watchNode } from '../firebase';
import { ThreeDProgress } from './ThreeDProgressLazy';
import { StatusCard } from './StatusCard';

interface ClientPortalViewProps {
  profile: UserProfile;
  projects: Project[];
  users: Record<string, UserProfile>;
  activePid: string | null;
  openPh: string | undefined;
  onSetActivePid: (pid: string) => void;
  onSetOpenPh: (phId: string | undefined) => void;
  onSendClientMessage: (projId: string, text: string) => void;
  onDeleteMessage?: (projId: string, msgId: string) => void;   // unsend entro 60s
  onUploadDocument: (projId: string, file: File) => void;
  studioMembers?: UserProfile[];
  onRequestAppointment?: (memberUid: string, memberName: string, date: string, time: string, note: string) => void;
  matericoRequests?: MatericoRequest[];
  onCreateMatericoRequest?: (req: MatericoRequest) => void;
  clientRequests?: ClientRequest[];
  onCreateClientRequest?: (req: ClientRequest) => void;
  onAcceptMatericoOffer?: (reqId: string, accept: boolean) => void;
  onSubmitMatericoOffer?: (reqId: string, amount: number, note: string) => void;
  /** Vetrina Unico pubblicata (snapshot dal nodo `unicoShowcase`; vuoto → demo). */
  unicoShowcase?: UnicoShowcaseEntry[];
  /** Le mie posizioni da investitore Unico (snapshot privato, sola lettura). */
  unicoPositions?: UnicoInvestorPosition[];
  /** Marketing: eventi a cui sono invitato + sondaggi attivi + le mie risposte. */
  mktEvents?: MarketingEvent[];
  mktSurveys?: Survey[];
  mktResponses?: Record<string, Record<string, SurveyResponse>>;
  onRsvpEvent?: (eventId: string, status: RsvpStatus) => void;
  onSubmitSurvey?: (surveyId: string, answers: Record<string, string | number>) => void;
  projectMessages: Record<string, any>;
  documents: Record<string, any>;
  furnishings?: Record<string, Record<string, Furnishing>>;
  onSaveFurnishing?: (pid: string, item: Furnishing) => void;
  onDeleteFurnishing?: (pid: string, itemId: string) => void;
  moodboard3d?: Record<string, any>;
  onSaveMoodboard3d?: (pid: string, elements: any[]) => void;
  /** Eventi punti dell'utente (affidabilità partner). */
  myPoints?: PointEvent[];
  onLogout: () => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
  estimates?: MatericoEstimate[];
  onSaveEstimate?: (est: MatericoEstimate) => void;
  onDeleteEstimate?: (id: string) => void;
  // Modulo Cantiere (lato partner: solo cantieri assegnati)
  cantieri?: Record<string, Cantiere>;
  cantRapportini?: Record<string, Record<string, Rapportino>>;
  cantPresenze?: Record<string, Record<string, Presenza>>;
  cantFoto?: Record<string, Record<string, CantiereFoto>>;
  cantMateriali?: Record<string, Record<string, CantiereMateriale>>;
  cantChecklist?: Record<string, Record<string, ChecklistItem>>;
  cantDocumenti?: Record<string, Record<string, CantiereDoc>>;
  cantSal?: Record<string, Record<string, CantiereSal>>;
  cantRecords?: Record<string, Record<string, CantiereRecord>>;
  cantMessages?: Record<string, Record<string, CantiereMessage>>;
  cantLog?: Record<string, Record<string, CantiereLog>>;
  impresaDocs?: Record<string, Record<string, ImpresaDoc>>;
  impresaRecords?: Record<string, Record<string, ImpresaRecord>>;
  onSaveCantEntity?: (coll: string, cid: string, item: any) => void;
  onDeleteCantEntity?: (coll: string, cid: string, id: string) => void;
  onSendCantiereMessage?: (cid: string, text: string) => void;
  onDeleteCantiereMessage?: (cid: string, id: string) => void;
  onSaveImpresaEntity?: (coll: string, uid: string, item: any) => void;
  onDeleteImpresaEntity?: (coll: string, uid: string, id: string) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  profile,
  projects,
  users,
  activePid,
  openPh,
  onSetActivePid,
  onSetOpenPh,
  onSendClientMessage,
  onDeleteMessage,
  onUploadDocument,
  studioMembers,
  onRequestAppointment,
  matericoRequests,
  onCreateMatericoRequest,
  onAcceptMatericoOffer,
  onSubmitMatericoOffer,
  clientRequests,
  onCreateClientRequest,
  unicoShowcase,
  unicoPositions,
  mktEvents,
  mktSurveys,
  mktResponses,
  onRsvpEvent,
  onSubmitSurvey,
  projectMessages,
  documents,
  furnishings = {},
  onSaveFurnishing,
  onDeleteFurnishing,
  moodboard3d = {},
  onSaveMoodboard3d,
  myPoints = [],
  onLogout,
  isPreview = false,
  onExitPreview,
  estimates = [],
  onSaveEstimate,
  onDeleteEstimate,
  cantieri = {},
  cantRapportini = {},
  cantPresenze = {},
  cantFoto = {},
  cantMateriali = {},
  cantChecklist = {},
  cantDocumenti = {},
  cantSal = {},
  cantRecords = {},
  cantMessages = {},
  cantLog = {},
  impresaDocs = {},
  impresaRecords = {},
  onSaveCantEntity,
  onDeleteCantEntity,
  onSendCantiereMessage,
  onDeleteCantiereMessage,
  onSaveImpresaEntity,
  onDeleteImpresaEntity
}) => {
  const { t, lang } = useLang();
  const BLOG_POSTS = lang === 'en' ? BLOG_POSTS_EN : BLOG_POSTS_IT;
  const [msgInput, setMsgInput] = useState('');
  const [apptReqOpen, setApptReqOpen] = useState(false);
  const [approvedMarketingPosts, setApprovedMarketingPosts] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<string>('lavori');
  const [showcaseOpen, setShowcaseOpen] = useState(false); // vetrina "Scopri i servizi"
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogFilter, setBlogFilter] = useState('all'); // chiave categoria stabile (indip. lingua)
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<{ phase: string; title: string; done: boolean } | null>(null);

  // Quadro economico per progetto (snapshot scritto dallo Studio: nodo projectEconomics/<pid>).
  // Sostituisce il vecchio localStorage (mai popolato): dati reali e condivisi.
  const [economics, setEconomics] = useState<Record<string, any>>({});

  useEffect(() => {
    const ids = projects.map((p) => p.id);
    const subs = ids.map((pid) =>
      watchNode(`projectEconomics/${pid}`, (v) => {
        setEconomics((prev) => ({ ...prev, [pid]: v || null }));
      }, () => {})
    );
    return () => subs.forEach((u) => u && u());
  }, [projects]);

  // Overrides and custom states for the new 3 portals (Strategico, Materico Cliente, Materico Partner B2B)
  const [overridePortal, setOverridePortal] = useState<'studio' | 'strategico' | 'materico_cliente' | 'materico_partner' | null>(null);
  const [b2bCostInputs, setB2bCostInputs] = useState<Record<string, string>>({});
  const [b2bNotesInputs, setB2bNotesInputs] = useState<Record<string, string>>({});
  const [b2bMessages, setB2bMessages] = useState([
    { id: 'm1', sender: "Arch. Giorgio (Studio Onirico)", text: t('b2b.seed.m1.text'), time: t('b2b.seed.m1.time') },
    { id: 'm2', sender: "Vincenzo (ArredoArtigiano)", text: t('b2b.seed.m2.text'), time: t('b2b.seed.m2.time') }
  ]);
  const [b2bChatInput, setB2bChatInput] = useState("");

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Regole keyword→slug (ordine = precedenza, come la vecchia catena di if).
  // I testi tradotti vivono nel dizionario sotto taskdetail.<slug>.*
  const TASK_DETAIL_RULES: { slug: string; kw: string[] }[] = [
    { slug: 'rilievo', kw: ['rilie', 'soprall'] },
    { slug: 'fattibilita', kw: ['fattibili', 'analis', 'congru'] },
    { slug: 'pratica', kw: ['cila', 'scia', 'pila', 'comun', 'permes'] },
    { slug: 'catasto', kw: ['catast', 'docfa', 'fogl', 'partic'] },
    { slug: 'preliminare', kw: ['prelimin', 'layout', 'diseg', 'concept'] },
    { slug: 'esecutivo', kw: ['esecutiv', 'esecuz', 'costrut'] },
    { slug: 'fotovoltaico', kw: ['fotovolt', 'panne', 'solare'] },
    { slug: 'elettrico', kw: ['elettr', 'quadro', 'cabl'] },
    { slug: 'ape', kw: ['ape', 'energet', 'termic', 'legg'] },
    { slug: 'bandi', kw: ['bando', 'finanz', 'detraz', 'agevol'] },
    { slug: 'consegna', kw: ['conseg', 'fin', 'collaud', 'attiv'] }
  ];

  const getTaskDetail = (title: string, phaseName?: string) => {
    const tl = title.toLowerCase();
    const rule = TASK_DETAIL_RULES.find((r) => r.kw.some((k) => tl.includes(k)));
    if (rule) {
      return {
        title,
        desc: t(`taskdetail.${rule.slug}.desc`),
        role: t(`taskdetail.${rule.slug}.role`),
        dueTime: t(`taskdetail.${rule.slug}.due`),
        badge: t(`taskdetail.${rule.slug}.badge`),
        proStep: t(`taskdetail.${rule.slug}.step`)
      };
    }
    return {
      title,
      desc: t('taskdetail.generic.desc', { phase: phaseName || t('taskdetail.generic.phaseFallback') }),
      role: t('taskdetail.generic.role'),
      dueTime: t('taskdetail.generic.due'),
      badge: phaseName || t('taskdetail.generic.badge'),
      proStep: t('taskdetail.generic.step')
    };
  };

  const projectIds = profile.projectIds ? Object.keys(profile.projectIds) : [];

  // Determine active portal type
  const getEffectivePortal = () => {
    if (overridePortal) return overridePortal;
    if (profile.role === 'partner') return 'materico_partner';
    
    // Fallback to active project's division
    const ap = activePid ? projects.find(proj => proj.id === activePid) : null;
    if (ap) {
      if (ap.division === 'strategico') return 'strategico';
      if (ap.division === 'materico') return 'materico_cliente';
    }
    return 'studio';
  };
  const activePortal = getEffectivePortal();

  // Find overridden active project
  const getOverriddenProject = () => {
    const targetDiv = (activePortal === 'materico_cliente' || activePortal === 'materico_partner')
      ? 'materico'
      : activePortal === 'strategico'
        ? 'strategico'
        : 'studio';

    let found = projects.find(pProj => pProj.id === activePid && (pProj.division === targetDiv || (pProj.division === undefined && targetDiv === 'studio')));
    if (!found) {
      found = projects.find(pProj => pProj.division === targetDiv || (pProj.division === undefined && targetDiv === 'studio'));
    }
    return found || projects[0];
  };

  const activeProject = getOverriddenProject();

  const handlePortalSwitch = (type: 'studio' | 'strategico' | 'materico_cliente' | 'materico_partner') => {
    setOverridePortal(type);
    
    // Find project matching that type:
    const targetDiv = (type === 'materico_cliente' || type === 'materico_partner')
      ? 'materico'
      : type === 'strategico'
        ? 'strategico'
        : 'studio';

    let found = projects.find(pProj => pProj.division === targetDiv || (pProj.division === undefined && targetDiv === 'studio'));
    if (found) {
      onSetActivePid(found.id);
    }
    setActiveSubTab('lavori');
  };

  // Project task counting statistics
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

  const pct = (done: number, tot: number) => {
    return tot ? Math.round((done / tot) * 100) : 0;
  };

  const getProjDocs = (pid: string) => {
    const d = documents && documents[pid];
    return d ? Object.entries(d).map(([id, x]: any) => ({ id, ...x })).sort((a: any, b: any) => (b.at || 0) - (a.at || 0)) : [];
  };

  const getProjMessages = (pid: string) => {
    const m = projectMessages && projectMessages[pid];
    return m ? Object.entries(m).map(([id, x]: any) => ({ id, ...x })).sort((a: any, b: any) => (a.at || 0) - (b.at || 0)) : [];
  };

  const handleSend = () => {
    if (!msgInput.trim() || !activePid) return;
    onSendClientMessage(activePid, msgInput);
    setMsgInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length && activePid) {
      setUploading(true);
      Array.from(e.target.files).forEach(f => {
        onUploadDocument(activePid, f);
      });
      setUploading(false);
    }
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

  // Vetrina "Scopri i servizi" — accessibile a qualunque cliente, anche senza progetti
  if (showcaseOpen) {
    return <ServicesShowcase profile={profile} unicoShowcase={unicoShowcase} onBack={() => setShowcaseOpen(false)} onLogout={onLogout} />;
  }

  // If no projects connected
  if (!projectIds.length || !projects.length) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F5F3] text-[#161616] font-sans">
        {/* Top bar Client */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#ececec]">
          <span className="font-extrabold text-[20px] tracking-tight text-[#161616]">
            Onirico<span className="text-[#8a8a8a] font-normal"> · OS</span>
          </span>
          <div className="flex items-center gap-2.5">
            <LangToggle />
            <button onClick={() => setShowcaseOpen(true)} className="bg-[#1b1b1b] hover:bg-black text-white font-extrabold text-xs py-1.5 px-3.5 rounded-xl border-none flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
              <Sparkles className="w-3.5 h-3.5" /> {t('portal.discoverServices')}
            </button>
            <button onClick={onLogout} className="bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#161616] font-extrabold text-xs py-1.5 px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95">
              {t('common.logout')}
            </button>
          </div>
        </div>

        {profile.role === 'cliente' && onCreateClientRequest ? (
          <div className="flex-1 w-full max-w-[660px] mx-auto p-4 sm:p-6 flex flex-col gap-4">
            <div className="text-center mt-2 mb-1">
              <h1 className="text-[22px] font-extrabold text-[#161616] tracking-tight">{profile.name ? t('portal.welcomeNamed', { name: profile.name.split(' ')[0] }) : t('portal.welcome')}</h1>
              <p className="text-[13.5px] text-[#8a8a8a] mt-1.5 leading-relaxed">
                {t('portal.noProject.a')}<b className="text-[#161616]">{t('portal.noProject.bold')}</b>{t('portal.noProject.c')}
              </p>
            </div>
            {(unicoPositions || []).length > 0 && <MyInvestmentsPanel positions={unicoPositions || []} />}
            <MarketingPortalPanel profile={profile} events={mktEvents || []} surveys={mktSurveys || []} responses={mktResponses || {}} onRsvp={onRsvpEvent} onSubmitSurvey={onSubmitSurvey} />
            <ClientRequestPanel
              profile={profile}
              requests={clientRequests || []}
              matericoRequests={(matericoRequests || []).filter((r) => r.clientUid === profile.uid)}
              onCreate={onCreateClientRequest}
              onCreateMatericoRequest={onCreateMatericoRequest}
            />
          </div>
        ) : (
          <div className="flex-1 max-w-[500px] mx-auto flex items-center justify-center p-6">
            <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-8 shadow-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-[#e2e2e2] text-[#161616] flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <b className="block text-[#161616] text-[16px] font-extrabold">{t('portal.projectPrep.title')}</b>
              <p className="text-[13.5px] text-[#8a8a8a] mt-2 mb-4 leading-relaxed">
                {t('portal.projectPrep.text')}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const p = activeProject || projects[0];

  // Fallback: partner assegnato solo a cantieri (nessun progetto collegato) → evita il crash
  // della vista per-progetto e mostra direttamente i cantieri assegnati.
  if (!p) {
    const assignedCantieri = Object.values(cantieri);
    return (
      <div className="min-h-screen bg-[#F5F5F3] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-[20px] font-extrabold text-[#161616]">{t('portal.cantieri')}</h1>
              <p className="text-[12.5px] text-[#8a8a8a]">{t('portal.partnerCompany', { name: profile.name })}</p>
            </div>
            <div className="flex items-center gap-2">
            <LangToggle />
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[12.5px] font-bold">
              <LogOut className="w-4 h-4" /> {t('common.logout')}
            </button>
            </div>
          </div>
          <CantiereBoard
            mode="partner"
            myUid={profile.uid}
            myName={profile.name}
            myRole={profile.role}
            cantieri={assignedCantieri}
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
            onSaveEntity={onSaveCantEntity}
            onDeleteEntity={onDeleteCantEntity}
            onSendMessage={onSendCantiereMessage}
            onDeleteMessage={onDeleteCantiereMessage}
            onSaveImpresaEntity={onSaveImpresaEntity}
            onDeleteImpresaEntity={onDeleteImpresaEntity}
          />
        </div>
      </div>
    );
  }

  const { done, tot } = projTaskCounts(p);
  const pc = pct(done, tot);

  const flatTasks: { phase: string; phId: string; title: string; done: boolean }[] = [];
  const phasesList = Object.entries(p.phases || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));

  phasesList.forEach(([phId, ph]: any) => {
    Object.entries(ph.tasks || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0)).forEach(([tid, t]: any) => {
      flatTasks.push({ phase: ph.name, phId: ph.id || phId, title: t.title, done: !!t.done });
    });
  });

  let curIdx = flatTasks.findIndex(t => !t.done);
  if (curIdx === -1 && flatTasks.length > 0) curIdx = flatTasks.length - 1;
  const curTask = flatTasks[curIdx] || { title: t('portal.worksCompleted'), phase: t('portal.phaseEnd') };
  const nextTask = flatTasks[curIdx + 1] || null;
  const isAllDone = flatTasks.length > 0 && flatTasks.every(t => t.done);

  const toTitle = nextTask ? nextTask.title : (p.dueDate ? fmtDay(p.dueDate) : t('portal.delivery'));

  const docs = getProjDocs(p.id);
  const msgs = getProjMessages(p.id);

  const getTabsForPortal = () => {
    switch (activePortal) {
      case 'strategico':
        return [
          { id: 'lavori', label: t('tab.avanzamento'), icon: ClipboardList },
          { id: 'marketing', label: t('tab.marketing'), icon: Briefcase },
          { id: 'documenti', label: t('tab.strategieBrief'), icon: FileText },
          { id: 'finanze', label: t('tab.contabilita'), icon: DollarSign },
          { id: 'blog', label: t('tab.growthInsights'), icon: BookOpen }
        ];
      case 'materico_cliente':
        return [
          { id: 'lavori', label: t('tab.iterPosa'), icon: ClipboardList },
          { id: 'preventivi', label: t('tab.scelteArredo'), icon: ClipboardList },
          { id: 'documenti', label: t('tab.moodboardCampioni'), icon: FileText },
          { id: 'finanze', label: t('tab.contabilita'), icon: DollarSign },
          { id: 'blog', label: t('tab.matericoTrends'), icon: BookOpen }
        ];
      case 'materico_partner':
        return [
          { id: 'lavori', label: t('tab.posaCantiere'), icon: ClipboardList },
          { id: 'cantiere', label: t('portal.cantieri'), icon: HardHat },
          { id: 'impresa', label: t('tab.impresa'), icon: Building2 },
          { id: 'b2b_preventivi', label: t('tab.offerteB2B'), icon: ClipboardList },
          { id: 'documenti', label: t('tab.tavoleDisegni'), icon: FileText },
          { id: 'b2b_chat', label: t('tab.coordCantiere'), icon: MessageSquare }
        ];
      case 'studio':
      default:
        return [
          { id: 'lavori', label: t('tab.avanzamento'), icon: ClipboardList },
          { id: 'documenti', label: t('tab.documentiChat'), icon: FileText },
          { id: 'arredi', label: t('tab.arredi'), icon: Sofa },
          { id: 'finanze', label: t('tab.contabilita'), icon: DollarSign },
          { id: 'blog', label: t('tab.blogOnirico'), icon: BookOpen }
        ];
    }
  };

  const tabsList = getTabsForPortal();
  const currentTab = tabsList.some(t => t.id === activeSubTab) ? activeSubTab : tabsList[0].id;

  const showSimulator = false;

  let portalStyle = {
    themeName: "Onirico Studio",
    slogan: t('ps.studio.slogan'),
    headerBg: "bg-white",
    headerText: "text-[#161616]",
    headerBorder: "border-[#e5e5e5]",
    bgCanvas: "bg-[#F5F5F3]",
    pillColor: "bg-zinc-950 text-white",
    primaryText: "text-zinc-950",
    accentColor: "#161616",
    badgeBg: "bg-zinc-100/80 text-zinc-900 border-zinc-200",
    portalLabel: t('ps.studio.label'),
    accentDot: "bg-zinc-800"
  };

  if (activePortal === 'strategico') {
    portalStyle = {
      themeName: "Onirico Strategico",
      slogan: t('ps.strategico.slogan'),
      headerBg: "bg-white",
      headerText: "text-[#161616]",
      headerBorder: "border-[#e5e5e5]",
      bgCanvas: "bg-[#F5F5F3]",
      pillColor: "bg-zinc-950 text-white font-extrabold",
      primaryText: "text-[#E2A93E]",
      accentColor: "#E2A93E",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200/80",
      portalLabel: t('ps.strategico.label'),
      accentDot: "bg-amber-500"
    };
  } else if (activePortal === 'materico_cliente') {
    portalStyle = {
      themeName: "Onirico Materico",
      slogan: t('ps.materico.slogan'),
      headerBg: "bg-white",
      headerText: "text-[#161616]",
      headerBorder: "border-[#e5e5e5]",
      bgCanvas: "bg-[#F5F5F3]",
      pillColor: "bg-zinc-950 text-white font-extrabold",
      primaryText: "text-[#C87A53]",
      accentColor: "#C87A53",
      badgeBg: "bg-orange-50 text-orange-850 border-orange-200",
      portalLabel: t('ps.materico.label'),
      accentDot: "bg-orange-500"
    };
  } else if (activePortal === 'materico_partner') {
    portalStyle = {
      themeName: "Onirico Materico B2B",
      slogan: t('ps.partner.slogan'),
      headerBg: "bg-white",
      headerText: "text-[#161616]",
      headerBorder: "border-[#e5e5e5]",
      bgCanvas: "bg-[#F5F5F3]",
      pillColor: "bg-zinc-950 text-white font-extrabold",
      primaryText: "text-slate-800",
      accentColor: "#4B5D68",
      badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
      portalLabel: t('ps.partner.label'),
      accentDot: "bg-slate-600"
    };
  }

  return (
    <div className={`flex flex-col min-h-screen ${portalStyle.bgCanvas} text-[#161616] font-sans select-none pb-24`}>
      {!isPreview && onRequestAppointment && studioMembers && studioMembers.length > 0 && (
        <AppointmentRequestModal
          open={apptReqOpen}
          onClose={() => setApptReqOpen(false)}
          members={studioMembers}
          onRequest={onRequestAppointment}
        />
      )}

      {profile.role === 'partner' && (
        <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pt-6">
          {(() => {
            const pts = totalPoints(myPoints, profile.uid);
            const score = reliabilityScore(myPoints, profile.uid);
            const tier = tierFor(pts);
            const nt = nextTier(pts);
            const recent = [...myPoints].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
            return (
              <div className="bg-white border border-[#e5e5e5] rounded-[22px] p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-[15px] font-extrabold text-[#161616]">La tua affidabilità</h3>
                  <span className="text-[12px] font-bold px-3 py-1 rounded-full border" style={{ color: tier.color, borderColor: tier.color }}>{tier.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center">
                    <div className="text-[26px] font-extrabold leading-none" style={{ color: score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#dc2626' }}>{score}</div>
                    <div className="text-[11px] text-[#8a8a8a] mt-1">Indice 0–100</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[26px] font-extrabold leading-none text-[#161616]">{pts}</div>
                    <div className="text-[11px] text-[#8a8a8a] mt-1">Punti totali</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[26px] font-extrabold leading-none text-[#161616]">{nt ? nt.remaining : '—'}</div>
                    <div className="text-[11px] text-[#8a8a8a] mt-1">{nt ? `pt a ${nt.tier.label}` : 'Livello max'}</div>
                  </div>
                </div>
                {recent.length > 0 && (
                  <div className="mt-4 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ultime valutazioni</span>
                    {recent.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-3 text-[12.5px] py-1 border-b border-[#f0f0f0] last:border-0">
                        <span className="truncate text-[#161616]">{e.label}</span>
                        <span className="font-bold shrink-0" style={{ color: e.points >= 0 ? '#059669' : '#dc2626' }}>{e.points >= 0 ? '+' : ''}{e.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {matericoRequests && (profile.role === 'partner' || (profile.role === 'cliente' && (profile.sector === 'materico' || (matericoRequests || []).some((r) => r.clientUid === profile.uid)))) && (
        <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pt-6">
          <MatericoPortal
            role={profile.role === 'partner' ? 'partner' : 'cliente'}
            uid={profile.uid}
            name={profile.name}
            requests={(matericoRequests || []).filter((r) =>
              profile.role === 'partner'
                ? isForwardedTo(r.forwardedTo, profile.uid)
                : r.clientUid === profile.uid
            )}
            onCreateRequest={onCreateMatericoRequest}
            onAcceptOffer={onAcceptMatericoOffer}
            onSubmitOffer={onSubmitMatericoOffer}
          />
        </div>
      )}
      {isPreview && (
        <div className="bg-[#161616] text-[#eeeeee] text-[13px] font-bold py-2.5 px-6 flex items-center justify-between sticky top-0 z-[60]">
          <span>{t('portal.previewBanner')}</span>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="bg-white hover:bg-white/95 text-[#161616] border-none font-bold py-1 px-3 rounded-lg text-xs cursor-pointer transition-all active:scale-95"
            >
              {t('portal.exitPreview')}
            </button>
          )}
        </div>
      )}

      {/* Main client top navbar */}
      <div className={`flex items-center justify-between px-6 py-3.5 ${portalStyle.headerBg} border-b ${portalStyle.headerBorder} sticky top-0 z-[45] transition-all`}>
        <div className="flex items-center gap-3">
          <span className={`font-extrabold text-[20px] tracking-tight ${portalStyle.headerText}`}>
            Onirico<span className="opacity-60 font-normal"> · {portalStyle.themeName.split(' ')[1] || 'OS'}</span>
          </span>
          <span className={`hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider border ${portalStyle.badgeBg}`}>
            {portalStyle.portalLabel}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Project Switcher if multiple */}
          {projectIds.length > 1 && (
            <select
              value={activePid || ''}
              onChange={(e) => onSetActivePid(e.target.value)}
              className="text-xs font-black bg-[#fafafa] border border-[#e2e2e2] py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-400 text-[#161616] cursor-pointer"
            >
              {projectIds.map(id => {
                const proj = projects.find(pr => pr.id === id);
                return (
                  <option key={id} value={id}>
                    {proj ? proj.name : t('portal.projectFallback')}
                  </option>
                );
              })}
            </select>
          )}

          <LangToggle />

          <button onClick={() => setShowcaseOpen(true)} className="bg-[#1b1b1b] hover:bg-black text-white font-extrabold text-xs py-1.5 px-3.5 rounded-xl border-none flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
            <Sparkles className="w-3.5 h-3.5" /> {t('portal.discoverServices')}
          </button>

          <button onClick={onLogout} className="bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#161616] font-extrabold text-xs py-1.5 px-3.5 rounded-xl border-none flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
            <LogOut className="w-3.5 h-3.5" /> {t('common.logout')}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[1080px] mx-auto w-full p-4 md:p-6 flex flex-col gap-6 text-left">

        {/* Le mie posizioni da investitore Unico (sola lettura) */}
        {(unicoPositions || []).length > 0 && <MyInvestmentsPanel positions={unicoPositions || []} />}

        {/* Inviti eventi + sondaggi (modulo Strategico) */}
        <MarketingPortalPanel profile={profile} events={mktEvents || []} surveys={mktSurveys || []} responses={mktResponses || {}} onRsvp={onRsvpEvent} onSubmitSurvey={onSubmitSurvey} />

        {/* Racconta la tua idea: nuova richiesta per qualsiasi divisione + moodboard 3D */}
        {profile.role === 'cliente' && onCreateClientRequest && (
          <ClientRequestPanel
            profile={profile}
            requests={clientRequests || []}
            matericoRequests={(matericoRequests || []).filter((r) => r.clientUid === profile.uid)}
            onCreate={onCreateClientRequest}
            onCreateMatericoRequest={onCreateMatericoRequest}
          />
        )}

        {/* COMPREHENSIVE PORTAL SIMULATOR SELECTOR BAR - Only shown to Admin, Staff, or in Preview */}
        {showSimulator && (
          <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">Dashboard di Simulazione Account</span>
                <h4 className="text-[14px] font-black text-[#1a1a1a] mt-0.5 flex items-center gap-1.5">
                  🕹️ Esplora i 4 Portali Attivi Onirico
                </h4>
                <p className="text-[#8a8a8a] text-[11px] font-semibold mt-0.5 leading-normal">
                  Fai clic per simulare istantaneamente il layout, i documenti e i flussi di lavoro visibili da quel corrispondente account cliente o partner:
                </p>
              </div>
              
              <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
                <button
                  id="portal-btn-studio"
                  onClick={() => handlePortalSwitch('studio')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'studio'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Studio
                </button>
                
                <button
                  id="portal-btn-strategico"
                  onClick={() => handlePortalSwitch('strategico')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'strategico'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Strategico
                </button>
                
                <button
                  id="portal-btn-materico-cliente"
                  onClick={() => handlePortalSwitch('materico_cliente')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'materico_cliente'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Materico
                </button>
                
                <button
                  id="portal-btn-materico-partner"
                  onClick={() => handlePortalSwitch('materico_partner')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'materico_partner'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Partner B2B
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-1">
          <div>
            <h1 className="text-[30px] md:text-[34px] font-extrabold tracking-tight text-[#161616] leading-tight font-sans">
              {t('home.greeting', { name: profile.name })}
            </h1>
            <div className="text-[13.5px] text-[#8a8a8a] mt-1 font-semibold leading-relaxed">
              {activePortal === 'strategico' ? (
                <span>{t('home.sub.strategico.a')}<span className="text-[#E2A93E] font-black">{p.name}</span>{t('home.sub.strategico.b')}</span>
              ) : activePortal === 'materico_cliente' ? (
                <span>{t('home.sub.materico.a')}<span className="text-[#C87A53] font-black">{p.name}</span>{t('home.sub.materico.b')}</span>
              ) : activePortal === 'materico_partner' ? (
                <span>{t('home.sub.partner.a')}<span className="text-slate-700 font-black">{profile.name}</span>{t('home.sub.partner.b')}<span className="text-zinc-900 font-extrabold">{p.name}</span>{t('home.sub.partner.c')}</span>
              ) : (
                <span>{t('home.sub.studio.a')}<span className="text-[#161616] font-extrabold">{p.name}</span>{t('home.sub.studio.b')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs matching ui.unlumen.com/components/motion-tabs-menu */}
        <div className="flex justify-center my-4">
          <div className="pillbar inline-flex items-center gap-1.5 bg-[#161616] rounded-full p-1.5 shadow-md border border-neutral-800 relative">
            {tabsList.map(tab => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 border-none bg-transparent py-2.5 px-4 rounded-full font-bold text-[12.5px] cursor-pointer transition-colors duration-300 select-none ${
                    isActive ? 'text-black' : 'text-[#a3a3a3] hover:text-white'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {/* Underlay Active Pill animation using layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="unlumen-sub-active-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32
                      }}
                      className="absolute inset-0 bg-white rounded-full z-0"
                    />
                  )}

                  {/* Micro scale press feedback physics */}
                  <motion.div
                    className="relative z-10 flex items-center justify-center"
                    whileTap={{ scaleY: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  </motion.div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{
                          width: { type: 'spring', stiffness: 420, damping: 32 },
                          opacity: { delay: 0.08, duration: 0.12 }
                        }}
                        className="relative z-10 overflow-hidden whitespace-nowrap block"
                      >
                        <span className="pr-1 font-extrabold truncate block">{tab.label}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic sub tab layout wrapper */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10, filter: "blur(2.5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2.5px)" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full"
            >
          {currentTab === 'lavori' && (
            <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both]">
              {/* Flight departure board style header card - Full Visual Consistency */}
              <StatusCard
                fromCode={codeFrom(curTask.title)}
                fromCity={isAllDone ? t('status.completato') : t('status.inCorsoCaps')}
                fromTime={curTask.title}
                toCode={codeFrom(toTitle)}
                toCity={nextTask ? t('status.prossimo') : t('status.consegnaCaps')}
                toTime={toTitle}
                progress={pc}
                eta={p.dueDate ? t('status.etaPrevista', { date: fmtDay(p.dueDate) }) : t('status.senzaScadenza')}
                nextLabel={nextTask ? t('status.nextTask') : t('status.stato')}
                nextVal={nextTask ? nextTask.title : (isAllDone ? t('status.tuttoCompletato') : t('status.inCorso'))}
                rightLabel={t('status.faseCorrente')}
                rightVal={curTask.phase || t('status.avvio')}
              />

              {/* 3D Model and Task checklist divided row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 3D Model Box */}
                {activePortal === 'strategico' ? (
                  <div id="visual-funnel-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 flex items-center gap-1.5 font-sans">
                        <Target className="w-4 h-4 text-[#E2A93E]" /> {t('demo.funnel.title')}
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        {t('demo.funnel.sub')}
                      </p>
                    </div>

                    <div className="bg-[#FAFAF7] border border-amber-200/50 p-4 rounded-2xl flex flex-col gap-3 font-sans mt-2">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[12px] font-bold text-gray-500">{t('demo.funnel.s1')}</span>
                        <b className="text-[13px] text-zinc-950 font-mono">{t('demo.funnel.s1v')}</b>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[12px] font-bold text-amber-600">{t('demo.funnel.s2')}</span>
                        <b className="text-[13px] text-zinc-950 font-mono">{t('demo.funnel.s2v')}</b>
                      </div>
                      <div className="flex justify-between items-center bg-[#111111] p-2.5 rounded-xl text-[#E2A93E]">
                        <span className="text-[12px] font-medium text-amber-100">{t('demo.funnel.s3')}</span>
                        <b className="text-[14px] font-black font-mono">{t('demo.funnel.s3v')}</b>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold border-t border-amber-100/30 pt-2 flex items-center justify-between">
                        <span>{t('demo.funnel.cpc')}</span>
                        <span>{t('demo.funnel.roi')}</span>
                      </div>
                    </div>
                  </div>
                ) : activePortal === 'materico_cliente' ? (
                  <div id="visual-palette-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 flex items-center gap-1.5 font-sans">
                        <Sparkle className="w-4 h-4 text-[#C87A53]" /> {t('demo.palette.title')}
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        {t('demo.palette.sub')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { name: t('demo.palette.mat1.name'), code: '#E6DFD3', desc: t('demo.palette.mat1.desc'), status: 'spedito' },
                        { name: t('demo.palette.mat2.name'), code: '#CBB49B', desc: t('demo.palette.mat2.desc'), status: 'confermato' },
                        { name: t('demo.palette.mat3.name'), code: '#D9D1C5', desc: t('demo.palette.mat3.desc'), status: 'in_scelta' },
                        { name: t('demo.palette.mat4.name'), code: '#A68C6D', desc: t('demo.palette.mat4.desc'), status: 'spedito' }
                      ].map((mat, idx) => (
                        <div key={idx} className="bg-[#FAF8F5] border border-orange-100/80 p-3 rounded-2xl flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full shadow-inner border border-zinc-200" style={{ backgroundColor: mat.code }} />
                            <b className="text-[11px] font-extrabold text-zinc-900 truncate">{mat.name}</b>
                          </div>
                          <span className="text-[9.5px] text-[#C87A53] font-bold block">{mat.desc}</span>
                          <span className="text-[8px] bg-amber-50 text-amber-800 self-start border border-amber-100 font-extrabold tracking-wider px-1 rounded uppercase">
                            {t('demo.matstatus.' + mat.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activePortal === 'materico_partner' ? (
                  <div id="visual-b2b-logistics-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 flex items-center gap-1.5 font-sans">
                        <Briefcase className="w-4 h-4 text-slate-500" /> {t('demo.b2b.title')}
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        {t('demo.b2b.sub')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 font-sans mt-2">
                      {[
                        { name: t('demo.b2b.lot1'), qty: '8 pz', status: t('demo.b2b.lot1s'), pct: 60 },
                        { name: t('demo.b2b.lot2'), qty: '4 pz', status: t('demo.b2b.lot2s'), pct: 100 },
                        { name: t('demo.b2b.lot3'), qty: '1 conf', status: t('demo.b2b.lot3s'), pct: 100 }
                      ].map((lot, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 border border-slate-200/80 rounded-2xl shadow-2xs">
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="font-extrabold text-slate-800">{lot.name}</span>
                            <span className="text-slate-500 text-[10px] font-mono">{lot.status}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1">
                            <div className="bg-slate-600 h-1 rounded-full" style={{ width: `${lot.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div id="visual-interactive-3d-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#161616] mb-1 flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-4 h-4 text-amber-500" /> {t('demo.cantiere3d.title')}
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        {t('demo.cantiere3d.sub')}
                      </p>
                    </div>
                    <div className="bg-[#fcfcfc] border border-[#e2e2e2] rounded-2xl overflow-hidden shadow-inner">
                      <ThreeDProgress
                        progress={pc}
                        height="260px"
                        modelType={p.templateId === 'fotovoltaico' ? 'solar' : p.templateId === 'impianto-elettrico' ? 'electrical' : p.templateId === 'catastale' ? 'cadastral' : p.templateId === 'ape' ? 'energy' : p.templateId === 'bando' ? 'generic' : 'house'}
                      />
                    </div>
                  </div>
                )}

                {/* State of Practices & Interactive Tasks */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-white border border-[#e2e2e2] rounded-[26px] p-4 shadow-sm">
                    <div className="text-left">
                      <h3 className="text-[15px] font-extrabold text-[#161616] flex items-center gap-1.5 font-sans">
                        <ClipboardList className="w-4 h-4 text-[#8a8a8a]" /> {t('work.title')}
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mt-0.5 font-semibold">
                        {t('work.sub')}
                      </p>
                    </div>
                    <span className="text-[11px] bg-[#fafafa] border border-[#e2e2e2] text-[#161616] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap">
                      {t('work.completedOf', { done, tot })}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {phasesList.map(([phId, ph]: any) => {
                      const plistTasks = Object.entries(ph.tasks || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));
                      const completedCount = plistTasks.filter(([, t]: any) => t.done).length;
                      const totalCount = plistTasks.length;
                      const phStatus = getPhaseStatus(ph);
                      const isOpen = openPh === phId || (openPh === undefined && phStatus === 'in_corso');

                      const phBadgeColor = phStatus === 'completato' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : phStatus === 'in_corso' 
                          ? 'bg-amber-50 text-amber-800 border-amber-100' 
                          : 'bg-gray-100 text-gray-700 border-gray-200';

                      const numBgColor = phStatus === 'completato' ? 'bg-emerald-600 text-white' : 'bg-[#f0f0f0] text-gray-700';

                      return (
                        <div key={phId} className="bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm transition-all hover:border-gray-300">
                          <div
                            onClick={() => onSetOpenPh(isOpen ? '__none__' : phId)}
                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 font-sans">
                              <span className={`w-[28px] h-[28px] rounded-lg flex items-center justify-center font-extrabold text-[12px] flex-shrink-0 ${numBgColor}`}>
                                {phStatus === 'completato' ? '✓' : (ph.order || 0) + 1}
                              </span>
                              <div className="min-w-0 text-left">
                                <b className="block text-[14px] font-extrabold text-[#161616] leading-tight truncate">{ph.name}</b>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wide ${phBadgeColor}`}>
                                    {phStatus === 'completato' ? t('work.phaseCompleted') : phStatus === 'in_corso' ? t('status.inCorso') : t('work.phaseTodo')}
                                  </span>
                                  <span className="text-[12.5px] text-[#8a8a8a] font-semibold">{completedCount}/{totalCount} {t('work.tasksWord')}</span>
                                </div>
                              </div>
                            </div>

                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" className={`w-3.5 h-3.5 text-[#8a8a8a] transition-all flex-shrink-0 ${isOpen ? 'transform rotate-180 text-gray-950' : ''}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden border-t border-[#f5f5f5] bg-[#fafafa]/50"
                              >
                                <div className="p-4 flex flex-col gap-2.5">
                                  {plistTasks.length > 0 ? (
                                    plistTasks.map(([tId, t]: any) => (
                                      <div 
                                        key={tId} 
                                        onClick={() => setSelectedTaskForModal({ phase: ph.name, phId, title: t.title, done: !!t.done })}
                                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all hover:border-[#161616] hover:bg-white ${
                                          t.done 
                                            ? 'bg-[#fafafa] border-[#e2e2e2] opacity-65' 
                                            : 'bg-white border-[#e2e2e2] shadow-xs'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                                            t.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                                          }`}>
                                            {t.done && (
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                                                <polyline points="20 6 9 17 4 12" />
                                              </svg>
                                            )}
                                          </span>
                                          <b className={`text-[13.5px] font-semibold text-[#161616] text-left ${t.done ? 'line-through text-[#8a8a8a]' : ''}`}>
                                            {t.title}
                                          </b>
                                        </div>
                                        {/* role badge removed */}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[12px] text-[#8a8a8a] italic py-2 text-center">{t('work.emptyPhase')}</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'documenti' && (
            <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both]">
              {/* General Project Metadata - Real estate data box */}
              <div className="bg-white border border-[#e2e2e2] rounded-[26px] overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider">{t('docs.address')}</div>
                  <b className="block text-[13.5px] mt-1 text-[#161616] truncate" title={p.indirizzoImmobile || p.location || '—'}>{p.indirizzoImmobile || p.location || '—'}</b>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider">{t('docs.interventionType')}</div>
                  <b className="block text-[13.5px] mt-1 text-[#161616] truncate">{p.tipoIntervento || p.templateName || '—'}</b>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider">{t('docs.cadastral')}</div>
                  <b className="block text-[13.5px] mt-1 text-[#161616]">{p.foglio ? `${p.foglio} / ${p.particella} / ${p.sub || '—'}` : '—'}</b>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Messages & Documents */}
                <div className="flex flex-col gap-6">
                  {/* Message from studio */}
                  {p.clientMessage && (
                    <div className="bg-amber-50/40 border border-amber-200 rounded-[26px] p-5 flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-850">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                          <Sparkle className="w-4 h-4" />
                        </div>
                        <b className="font-extrabold text-[12.5px] uppercase tracking-wider">{t('docs.studioMessage')}</b>
                      </div>
                      <p className="text-[13.5px] text-[#333333] leading-relaxed whitespace-pre-wrap font-semibold">
                        {p.clientMessage}
                      </p>
                    </div>
                  )}

                  {/* Documents card */}
                  <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-[16px] font-extrabold text-[#161616]">{t('docs.title')}</h3>
                        <p className="text-[12px] text-[#8a8a8a]">{t('docs.sub')}</p>
                      </div>
                      {!isPreview && (
                        <label className="bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 border-none">
                          <Upload className="w-3.5 h-3.5" /> {t('common.upload')}
                          <input type="file" onChange={handleFileChange} multiple className="hidden" />
                        </label>
                      )}
                    </div>

                    {uploading && (
                      <div className="text-center text-[12px] text-[#8a8a8a] py-2.5 flex items-center gap-1.5 justify-center bg-[#fafafa] border border-[#e2e2e2] rounded-xl mb-2 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-[#161616]" /> {t('docs.uploading')}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 max-h-[290px] overflow-y-auto w-full">
                      {docs.length > 0 ? (
                        docs.map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-[#fafafa] border border-[#ececec] rounded-xl text-[13px] group hover:bg-gray-100/50 transition-all duration-150">
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="block font-bold text-[#161616] truncate" title={d.name}>{d.name}</span>
                              <span className="text-[10px] text-[#8a8a8a] font-bold uppercase">{d.size ? Math.round(d.size / 1024) + ' KB' : '—'}</span>
                            </div>
                            <div className="dw-container flex-shrink-0">
                              <label className="dw-label" title={t('chat.docDownload')}>
                                <input 
                                  type="checkbox" 
                                  className="dw-input" 
                                  onChange={(e: any) => {
                                    if (e.target.checked) {
                                      setTimeout(() => {
                                        triggerDownload(d.url, d.name);
                                      }, 2500);

                                      // Reset the checkbox animation after completed state
                                      setTimeout(() => {
                                        e.target.checked = false;
                                      }, 5500);
                                    }
                                  }}
                                />
                                <div className="dw-circle">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="dw-icon">
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                  </svg>
                                  <div className="dw-square"></div>
                                </div>
                                <p className="dw-title">{t('common.download')}</p>
                                <p className="dw-title">{t('chat.done')}</p>
                              </label>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12.5px] text-[#8a8a8a] text-center italic py-8 bg-[#fafafa] rounded-xl border border-dashed border-[#e2e2e2]">
                          {t('chat.noDocs')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Chat assistance */}
                <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col h-[410px]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[16px] font-extrabold text-[#161616]">{t('chat.title')}</h3>
                      <p className="text-[12px] text-[#8a8a8a] mb-3.5">{t('chat.sub')}</p>
                    </div>
                    {!isPreview && onRequestAppointment && studioMembers && studioMembers.length > 0 && (
                      <button
                        onClick={() => setApptReqOpen(true)}
                        className="shrink-0 bg-[#161616] hover:bg-black text-white text-[11.5px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer border-none active:scale-95 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" /> {t('chat.appointment')}
                      </button>
                    )}
                  </div>
                  
                  {/* Chat window viewport */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
                    {msgs.length > 0 ? (
                      msgs.map((m: any) => {
                        const isMine = m.role === 'cliente';
                        return (
                          <div key={m.id} className={`flex flex-col max-w-[85%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`p-3 rounded-[20px] text-[13px] leading-relaxed font-semibold shadow-xs ${
                              isMine
                                ? 'bg-[#1b1b1b] text-white rounded-tr-none'
                                : 'bg-[#fafafa] text-[#161616] rounded-tl-none border border-[#e2e2e2]'
                            }`}>
                              {m.text}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#8a8a8a] mt-1 px-1">
                              {m.name}
                              {m.from === profile.uid && onDeleteMessage && (
                                <ChatDeleteButton at={m.at || 0} onDelete={() => onDeleteMessage(p.id, m.id)} />
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="my-auto py-10 flex flex-col items-center text-center">
                        <p className="text-[12.5px] text-[#8a8a8a] italic">{t('chat.empty')}</p>
                      </div>
                    )}
                  </div>

                  {/* Input block always pinned at bottom of fixed size card */}
                  {!isPreview ? (
                    <div className="flex gap-2 items-center mt-3 border-t border-[#f5f5f5] pt-3 flex-shrink-0">
                      <input
                        type="text"
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        className="flex-1 min-h-[38px] bg-[#fafafa] border border-[#e2e2e2] rounded-xl px-3 py-1.5 text-[13px] text-[#161616] placeholder-[#8a8a8a] focus:outline-none focus:border-gray-500 transition-colors"
                        placeholder={t('chat.placeholder')}
                      />
                      <button onClick={handleSend} className="bg-[#1b1b1b] hover:bg-black text-white h-[38px] w-[38px] rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 border-none">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11.5px] text-[#8a8a8a] mt-3 italic text-center flex-shrink-0">{t('chat.previewDisabled')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'b2b_preventivi' && (() => {
            const projEstimates = estimates.filter(e => e.projectId === p.id);
            return (
              <div className="flex flex-col gap-6 text-left font-sans text-[#161616]">
                <div className="bg-white text-zinc-900 border border-[#e5e5e5] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs animate-[riseIn_0.22s_ease_both]">
                  <div>
                    <h3 className="text-[17px] font-extrabold flex items-center gap-2">
                       <ClipboardList className="w-4 h-4 text-slate-600" />
                       {t('b2b.commesseTitle')}
                    </h3>
                    <p className="text-[12.5px] text-[#8a8a8a] mt-1 pr-6 leading-relaxed font-semibold">
                      {t('b2b.commesseDesc.a')}<b className="text-zinc-900">{p.name}</b>{t('b2b.commesseDesc.b')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {projEstimates.length === 0 ? (
                    <div className="bg-white border border-[#ececec] rounded-2xl p-10 text-center text-zinc-500">
                      {t('b2b.noCommesse')}
                    </div>
                  ) : (
                    projEstimates.map(est => {
                      const currentCost = b2bCostInputs[est.id] !== undefined ? b2bCostInputs[est.id] : String(est.baseCost || est.basePrice || '');
                      const currentNotes = b2bNotesInputs[est.id] !== undefined ? b2bNotesInputs[est.id] : (est.requestNotes || est.notes || '');
                      
                      const markupPct = est.markupPercent || 15;
                      const calculatedClientPrice = Number(currentCost) ? Number(currentCost) * (1 + markupPct / 100) : 0;

                      return (
                        <div key={est.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase">
                                {t('b2b.lotId')}{est.id.slice(0, 5).toUpperCase()}
                              </span>
                              <h4 className="text-[15.5px] font-extrabold text-[#111] mt-2">{est.itemName}</h4>
                              <p className="text-[12.5px] text-[#555] mt-1">{est.itemDescription}</p>
                            </div>
                            
                            <span className={`text-[10px] font-mono tracking-wider font-extrabold px-3 py-1 rounded-full uppercase border ${
                              est.status === 'accettato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              est.status === 'rifiutato' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              est.status === 'preventivato_partner' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {est.status === 'accettato' && t('b2b.statusAccepted')}
                              {est.status === 'rifiutato' && t('b2b.statusRejected')}
                              {est.status === 'preventivato_partner' && t('b2b.statusPartner')}
                              {est.status === 'proposto_cliente' && t('b2b.statusProposed')}
                              {est.status === 'richiesto' && t('b2b.statusRequested')}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                            <div>
                              <label className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{t('b2b.notesLabel')}</label>
                              <textarea
                                value={currentNotes}
                                onChange={(e) => setB2bNotesInputs(prev => ({ ...prev, [est.id]: e.target.value }))}
                                placeholder={t('b2b.notesPlaceholder')}
                                className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-500 font-sans min-h-[70px] resize-none"
                              />
                            </div>

                            <div className="flex flex-col justify-between">
                              <div>
                                <label className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('b2b.costLabel')}</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">€</span>
                                  <input
                                    type="number"
                                    value={currentCost}
                                    onChange={(e) => setB2bCostInputs(prev => ({ ...prev, [est.id]: e.target.value }))}
                                    placeholder="0,00"
                                    className="w-full text-xs font-mono font-extrabold border border-gray-200 rounded-xl py-2 pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                  />
                                </div>
                              </div>

                              <div className="bg-slate-50/80 border border-slate-150 p-2 text-[11px] rounded-xl font-sans text-gray-500 mt-2 flex justify-between items-center">
                                <span>{t('b2b.clientPrice', { pct: markupPct })}</span>
                                <b className="font-mono text-zinc-950 font-black">{eur(calculatedClientPrice)}</b>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                            <button
                              onClick={() => {
                                onSaveEstimate({
                                  ...est,
                                  baseCost: Number(currentCost),
                                  requestNotes: currentNotes,
                                  status: 'preventivato_partner',
                                  finalPrice: calculatedClientPrice
                                });
                                alert(t('b2b.sentAlert'));
                              }}
                              className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-[11.5px] py-1.5 px-4 rounded-xl border-none cursor-pointer tracking-wide shadow-sm active:scale-95 transition-all"
                            >
                              {t('b2b.sendOffer')}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {currentTab === 'b2b_chat' && (
            <div className="flex flex-col gap-4 text-left font-sans text-[#161616]">
              <div className="bg-white border border-[#ececec] rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[16px] font-extrabold text-[#1a1a1a]">{t('b2b.chatTitle')}</h3>
                </div>
                <p className="text-[12.5px] text-[#8a8a8a] mb-4 leading-relaxed">
                  {t('b2b.chatDesc')}
                </p>

                <div className="bg-slate-50/60 border border-gray-200 rounded-2xl p-4 min-h-[250px] max-h-[400px] overflow-y-auto flex flex-col gap-3.5 shadow-inner">
                  {b2bMessages.map(m => {
                    const isSelf = m.sender.startsWith("Vincenzo") || m.sender.includes("(Partner)");
                    return (
                      <div key={m.id} className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end bg-[#161616] text-white rounded-l-2xl rounded-tr-2xl' : 'self-start bg-white text-zinc-950 rounded-r-2xl rounded-tl-2xl border border-gray-200'} p-3 shadow-xs`}>
                        <span className={`text-[9.5px] ${isSelf ? 'text-slate-300' : 'text-slate-500'} font-bold`}>{m.sender}</span>
                        <p className="text-[12.5px] mt-1 font-semibold leading-relaxed">{m.text}</p>
                        <span className={`text-[8px] ${isSelf ? 'text-slate-400' : 'text-gray-450'} mt-1 self-end font-mono`}>{m.time}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={b2bChatInput}
                    onChange={(e) => setB2bChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && b2bChatInput.trim()) {
                        const newMsg = {
                          id: String(Date.now()),
                          sender: `${profile.name} (Partner)`,
                          text: b2bChatInput,
                          time: t('b2b.now')
                        };
                        setB2bMessages(prev => [...prev, newMsg]);
                        setB2bChatInput("");
                      }
                    }}
                    placeholder={t('b2b.chatPlaceholder')}
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-sans"
                  />
                  <button
                    onClick={() => {
                      if (!b2bChatInput.trim()) return;
                      const newMsg = {
                        id: String(Date.now()),
                        sender: `${profile.name} (Partner)`,
                        text: b2bChatInput,
                        time: t('b2b.now')
                      };
                      setB2bMessages(prev => [...prev, newMsg]);
                      setB2bChatInput("");
                    }}
                    className="bg-[#161616] hover:bg-neutral-800 text-white font-extrabold text-xs px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95"
                  >
                    {t('common.send')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'marketing' && (
            <div className="flex flex-col gap-6">
              {/* Marketing KPI Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">{t('mkt.kpi.budget')}</span>
                    <DollarSign className="w-3.5 h-3.5 text-[#161616]" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">{t('mkt.kpi.budgetVal')}</p>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5 font-sans">{t('mkt.kpi.budgetSub')}</p>
                </div>
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">{t('mkt.kpi.spent')}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">{t('mkt.kpi.spentVal')}</p>
                  <p className="text-[11px] text-green-600 font-semibold mt-0.5 font-sans">{t('mkt.kpi.spentSub')}</p>
                </div>
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">Click-Through Rate</span>
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">3.82%</p>
                  <p className="text-[11px] text-blue-600 font-semibold mt-0.5 font-sans">{t('mkt.kpi.ctrSub')}</p>
                </div>
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">{t('mkt.kpi.cpa')}</span>
                    <Smartphone className="w-3.5 h-3.5 text-[#161616]" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">{t('mkt.kpi.cpaVal')}</p>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5 font-sans">{t('mkt.kpi.cpaSub')}</p>
                </div>
              </div>

              {/* Marketing Main Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Social & Reels Approval Hub */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="bg-white border border-[#ececec] rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-[16px] font-extrabold text-[#1a1a1a]">Social Feed & Campaign Approval Hub</h3>
                    </div>
                    <p className="text-[12.5px] text-[#8a8a8a] mb-5 leading-relaxed font-sans">
                      {t('mkt.hub.sub')}
                    </p>

                    <div className="flex flex-col gap-4">
                      {([
                        {
                          id: 'post-1',
                          title: t('mkt.post1.title'),
                          type: 'Instagram Reel',
                          length: t('mkt.post1.length'),
                          src: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600',
                          caption: t('mkt.post1.caption')
                        },
                        {
                          id: 'post-2',
                          title: t('mkt.post2.title'),
                          type: 'Meta Ad Swipe Carousel',
                          length: t('mkt.post2.length'),
                          src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600',
                          caption: t('mkt.post2.caption')
                        },
                        {
                          id: 'post-3',
                          title: t('mkt.post3.title'),
                          type: 'TikTok / IG Reels Video',
                          length: t('mkt.post3.length'),
                          src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
                          caption: t('mkt.post3.caption')
                        }
                      ]).map(post => {
                        const approved = approvedMarketingPosts[post.id];
                        return (
                          <div key={post.id} className="border border-[#ececec] rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-xs transition-shadow">
                            <div className="w-full md:w-[130px] h-[130px] rounded-xl overflow-hidden bg-[#fafafa] flex-shrink-0 relative border border-[#f0f0f0]">
                              <img src={post.src} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                                {post.type}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col justify-between text-left">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono text-[#8a8a8a]">{post.length}</span>
                                  <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${
                                    approved 
                                      ? 'bg-green-50 text-green-600 border border-green-200' 
                                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  }`}>
                                    {approved ? t('mkt.post.approved') : t('mkt.post.pending')}
                                  </span>
                                </div>
                                <h4 className="text-[14px] font-extrabold text-[#161616] mt-1 leading-snug">{post.title}</h4>
                                <p className="text-[11.5px] text-[#fff] bg-[#161616] rounded-xl p-2.5 mt-2 font-mono leading-relaxed select-all">
                                  {post.caption}
                                </p>
                              </div>

                              <div className="flex items-center justify-end gap-2 mt-3.5 border-t border-[#f5f5f5] pt-3">
                                {approved ? (
                                  <div className="flex items-center gap-1 text-green-600 text-xs font-black">
                                    <CheckCircle2 className="w-4 h-4" /> {t('mkt.post.approvedNote')}
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setApprovedMarketingPosts(prev => ({ ...prev, [post.id]: true }));
                                      }}
                                      className="bg-[#161616] hover:bg-black text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border-none cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                                    >
                                      {t('mkt.post.approveBtn')}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sidebar Campaign details */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white border border-[#ececec] rounded-3xl p-5 text-left">
                    <h3 className="text-[14.5px] font-extrabold text-[#1a1a1a] mb-2 font-sans">{t('mkt.side.title')}</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">{t('mkt.side.campaignName')}</span>
                        <b className="text-[12.5px] text-[#161616] block mt-0.5">ONIRICO-WEB-SUMMER-2026</b>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">Geotargeting</span>
                        <b className="text-[12.5px] text-[#161616] block mt-0.5">{t('mkt.side.geoVal')}</b>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">{t('mkt.side.channels')}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="bg-[#fafafa] border border-[#e2e2e2] text-[#161616] text-[10.5px] font-semibold py-0.5 px-2 rounded-lg">Instagram Feed</span>
                          <span className="bg-[#fafafa] border border-[#e2e2e2] text-[#161616] text-[10.5px] font-semibold py-0.5 px-2 rounded-lg">Facebook Ads</span>
                          <span className="bg-[#fafafa] border border-[#e2e2e2] text-[#161616] text-[10.5px] font-semibold py-0.5 px-2 rounded-lg">Google Location Search</span>
                        </div>
                      </div>
                      <div className="border-t border-[#f5f5f5] pt-3">
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">{t('mkt.side.ref')}</span>
                        <b className="text-[12.5px] text-[#161616] block mt-0.5">Arch. Mario Bianchi (Brand Director & Strategist)</b>
                        <p className="text-[11px] text-gray-400 mt-1 font-sans">{t('mkt.side.refNote')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'preventivi' && (() => {
            const projEstimates = estimates.filter(e => e.projectId === p.id);
            return (
              <div className="flex flex-col gap-6 text-left">
                {/* Header info */}
                <div className="bg-white border border-[#ececec] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2">
                       <ClipboardList className="w-4 h-4 text-emerald-500" />
                       {t('prev.title')}
                    </h3>
                    <p className="text-[12.5px] text-[#8a8a8a] mt-1 pr-6 leading-relaxed font-sans">
                      {t('prev.desc')}
                    </p>
                  </div>
                  <div className="bg-[#fafafa] border border-[#e2e2e2] rounded-2xl p-4 flex flex-col min-w-[200px] text-center">
                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">{t('prev.totalApproved')}</span>
                    <b className="text-[20px] font-mono font-extrabold text-emerald-600 mt-1">
                      {eur(projEstimates.filter(x => x.status === 'accettato').reduce((acc, cr) => acc + cr.finalPrice, 0))}
                    </b>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {t('prev.confirmedCount', { n: projEstimates.filter(x => x.status === 'accettato').length })}
                    </span>
                  </div>
                </div>

                {projEstimates.length === 0 ? (
                  <div className="bg-white border border-[#ececec] rounded-3xl p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-[#e2e2e2] text-gray-400 flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <b className="text-[#161616] text-[15px] font-extrabold block">{t('prev.empty')}</b>
                    <p className="text-[13px] text-[#8a8a8a] mt-1 max-w-[400px] mx-auto leading-relaxed font-sans">
                      {t('prev.emptyDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {projEstimates.map(est => {
                      return (
                        <div key={est.id} className="bg-white border border-[#ececec] rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start justify-between hover:shadow-xs transition-shadow">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-[#f0f0f0] text-gray-700 text-[10px] font-mono py-0.5 px-2 rounded-md font-bold uppercase">
                                {t('prev.supplierPartner', { name: est.partnerName })}
                              </span>
                              
                              <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-md ${
                                est.status === 'accettato' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''
                              } ${
                                est.status === 'rifiutato' ? 'bg-rose-50 text-rose-600 border border-rose-200' : ''
                              } ${
                                est.status === 'proposto_cliente' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''
                              } ${
                                est.status === 'richiesto' ? 'bg-gray-100 text-gray-500 border border-gray-200' : ''
                              }`}>
                                {est.status === 'accettato' && t('prev.statusApproved')}
                                {est.status === 'rifiutato' && t('prev.statusRejected')}
                                {est.status === 'proposto_cliente' && t('prev.statusPending')}
                                {est.status === 'richiesto' && t('prev.statusOffer')}
                              </span>
                            </div>

                            <h4 className="text-[15.5px] font-extrabold text-[#161616] mt-2 leading-snug">{est.itemName}</h4>
                            
                            {est.requestNotes && (
                              <p className="text-[12px] text-gray-500 mt-2 italic bg-[#fafafa] border-l-2 border-[#161616] pl-2 py-0.5">
                                « {est.requestNotes} »
                              </p>
                            )}

                            {est.notes && (
                              <p className="text-[11.5px] text-[#8a8a8a] mt-1.5 leading-relaxed font-sans">
                                <span className="font-bold text-[#161616]">{t('prev.dlNotes')}</span> {est.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-3 min-w-[210px] w-full md:w-auto border-t md:border-t-0 border-[#f5f5f5] pt-3 md:pt-0">
                            <div className="text-right flex flex-col md:items-end w-full">
                              <span className="text-[9px] font-mono text-[#8a8a8a] uppercase block tracking-wider font-semibold">{t('prev.finalPrice')}</span>
                              <b className="text-[20px] font-mono font-extrabold text-[#161616] block mt-0.5">
                                {eur(est.finalPrice)}
                              </b>
                              <span className="text-[10px] text-[#8a8a8a] block mt-0.5 font-mono">
                                {t('prev.base', { base: eur(est.basePrice), pct: est.markupPercent })}
                              </span>
                            </div>

                            {est.status === 'proposto_cliente' && (
                              <div className="flex items-center gap-2 w-full mt-1.5 justify-end">
                                <button
                                  onClick={() => {
                                    if (onSaveEstimate) {
                                      onSaveEstimate({ ...est, status: 'rifiutato', updatedAt: Date.now() });
                                    }
                                  }}
                                  className="flex-1 md:flex-initial bg-white hover:bg-neutral-50 text-rose-600 hover:text-rose-700 border border-[#e2e2e2] text-xs font-black py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> {t('prev.reject')}
                                </button>
                                <button
                                  onClick={() => {
                                    if (onSaveEstimate) {
                                      onSaveEstimate({ ...est, status: 'accettato', updatedAt: Date.now() });
                                    }
                                  }}
                                  className="flex-1 md:flex-initial bg-[#161616] hover:bg-black text-emerald-400 hover:text-emerald-300 border-none text-xs font-black py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {t('prev.accept')}
                                </button>
                              </div>
                            )}

                            {est.status === 'accettato' && (
                              <div className="text-emerald-600 text-xs font-black flex items-center gap-1 mt-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t('prev.approvedByYou')}
                              </div>
                            )}

                            {est.status === 'rifiutato' && (
                              <div className="text-rose-600 text-xs font-black flex items-center gap-1 mt-1 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" /> {t('prev.rejectedByYou')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {currentTab === 'cantiere' && (
            <div className="animate-[riseIn_0.22s_ease_both]">
              <CantiereBoard
                mode="partner"
                myUid={profile.uid}
                myName={profile.name}
                myRole={profile.role}
                cantieri={Object.values(cantieri)}
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
                onSaveEntity={onSaveCantEntity}
                onDeleteEntity={onDeleteCantEntity}
                onSendMessage={onSendCantiereMessage}
                onDeleteMessage={onDeleteCantiereMessage}
                onSaveImpresaEntity={onSaveImpresaEntity}
                onDeleteImpresaEntity={onDeleteImpresaEntity}
              />
            </div>
          )}

          {currentTab === 'impresa' && (
            <div className="animate-[riseIn_0.22s_ease_both]">
              <ImpresaArea
                uid={profile.uid}
                canWrite={true}
                docs={Object.values(impresaDocs[profile.uid] || {})}
                records={Object.values(impresaRecords[profile.uid] || {})}
                folderName={`Onirico Impresa - ${profile.name}`}
                onSaveEntity={(coll, item) => onSaveImpresaEntity?.(coll, profile.uid, item)}
                onDeleteEntity={(coll, id) => onDeleteImpresaEntity?.(coll, profile.uid, id)}
              />
            </div>
          )}

          {currentTab === 'arredi' && (
            <div className="animate-[riseIn_0.22s_ease_both]">
              <FurnishingsBoard
                project={p}
                items={Object.values(furnishings[p.id] || {})}
                myUid={profile.uid}
                myRole={profile.role}
                isStudio={false}
                onSaveItem={onSaveFurnishing || (() => {})}
                onDeleteItem={onDeleteFurnishing || (() => {})}
                moodboard3dElements={moodboard3d[p.id]?.elements || []}
                onSaveMoodboard3d={onSaveMoodboard3d}
              />
            </div>
          )}

          {currentTab === 'finanze' && (() => {
            // Quadro economico reale dallo snapshot Studio (projectEconomics/<pid>).
            const econ = economics[p.id] || null;
            const parc = econ?.parcella || null;
            const projInvoices = (econ?.invoices || []) as any[];
            const projScadenze = (econ?.scadenze || []) as any[];

            // Calculate totals
            const totalInvoiced = projInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const paidInvoices = projInvoices.filter((inv: any) => inv.status === 'pagata' || inv.status === 'Paid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const pendingInvoices = totalInvoiced - paidInvoices;

            return (
              <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both] text-left font-sans text-stone-900 mt-2">
                {/* Header overview */}
                <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                  <h3 className="text-[17px] font-extrabold flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    {t('fin.title')}
                  </h3>
                  <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed">
                    {t('fin.desc.a')}<b className="text-[#161616]">{p.name}</b>{t('fin.desc.b')}
                  </p>
                </div>

                {/* QUADRO ECONOMICO (parcella calcolata dallo Studio) */}
                {parc && (
                  <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                    <b className="text-[14px] font-black text-[#161616] block mb-3">{t('fin.quadro')}</b>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-stone-50/60 border border-stone-200 rounded-xl p-3">
                        <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">{t('fin.computo')}</span>
                        <b className="text-[14px] font-black text-[#1a1a1a]">{eur(econ?.computoTotal || 0)}</b>
                      </div>
                      <div className="bg-stone-50/60 border border-stone-200 rounded-xl p-3">
                        <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">{t('fin.arrediFissi')}</span>
                        <b className="text-[14px] font-black text-[#1a1a1a]">{eur(econ?.arrediFissi || 0)}</b>
                      </div>
                      <div className="bg-stone-50/60 border border-stone-200 rounded-xl p-3">
                        <span className="text-[9.5px] uppercase font-black text-stone-400 tracking-wider block">{t('fin.arrediMobili')}</span>
                        <b className="text-[14px] font-black text-[#1a1a1a]">{eur(econ?.arrediMobili || 0)}</b>
                      </div>
                      <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3">
                        <span className="text-[9.5px] uppercase font-black text-indigo-700 tracking-wider block">{t('fin.onorari', { pct: Math.round((parc.feePct || 0.15) * 100) })}</span>
                        <b className="text-[14px] font-black text-indigo-800">{eur(parc.onorari || 0)}</b>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 bg-[#1b1b1b] text-white rounded-xl px-4 py-3">
                      <span className="text-[11px] uppercase font-black tracking-wider text-stone-300">
                        {t('fin.totaleParcella')}{parc.managesMobili ? t('fin.inclMobili', { pct: Math.round((parc.mobiliFeePct || 0.2) * 100) }) : ''}
                      </span>
                      <b className="text-[18px] font-black text-green-400">{eur(parc.totaleParcella || 0)}</b>
                    </div>
                  </div>
                )}

                {/* KPI Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider block">{t('fin.fatturato')}</span>
                    <b className="text-[20px] font-black mt-1 block text-stone-800">{eur(totalInvoiced)}</b>
                    <span className="text-[11px] text-stone-500 mt-1 block">{t('fin.fattureEmesse', { n: projInvoices.length })}</span>
                  </div>

                  <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">{t('fin.ricevuto')}</span>
                    <b className="text-[20px] font-black mt-1 block text-emerald-700">{eur(paidInvoices)}</b>
                    <span className="text-[11px] text-emerald-600 mt-1 block">{t('fin.giaSaldati')}</span>
                  </div>

                  <div className={`rounded-2xl p-5 border shadow-xs ${pendingInvoices > 0 ? 'bg-amber-50/10 border-amber-200' : 'bg-white border-[#e5e5e5]'}`}>
                    <span className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider block">{t('fin.inAttesaSaldo')}</span>
                    <b className="text-[20px] font-black mt-1 block text-amber-700">{eur(pendingInvoices)}</b>
                    <span className="text-[11px] text-stone-500 mt-1 block">{t('fin.aScadenze')}</span>
                  </div>
                </div>

                {/* Main section: Invoices + Milestone Scadenze */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left component: SDI Invoices list */}
                  <div className="lg:col-span-7 bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                    <div className="flex justify-between items-center border-b border-[#f5f5f5] pb-4 mb-4">
                      <b className="text-[14px] font-black text-[#161616]">{t('fin.fattureAttive')}</b>
                      <span className="text-[10.5px] bg-slate-100 text-[#1a1a1a] font-bold px-2 py-0.5 rounded-lg border border-slate-200">{t('fin.canale')}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {projInvoices.length === 0 ? (
                        <div className="py-12 text-center text-stone-400 italic text-[12.5px] bg-stone-50/30 rounded-2xl border border-dashed border-stone-200">
                          {t('fin.noFatture')}
                        </div>
                      ) : (
                        projInvoices.map((inv: any) => (
                          <div key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl border border-stone-150 bg-stone-50/30">
                            <div>
                              <div className="flex items-center gap-2">
                                <b className="text-[13.5px] font-black text-stone-950">{inv.id || `FAT-${inv.date?.replace(/-/g, '') || '2026-003'}`}</b>
                                {inv.isSal && (
                                  <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">SAL</span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 font-medium block mt-1">{inv.description || inv.desc || t('fin.invDescFallback')}</span>
                              <span className="text-[10px] text-stone-400 font-semibold block mt-1 font-mono">{fmtDay(inv.date || inv.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0 font-mono">
                              <span className="text-[14px] font-black text-stone-800">{eur(Number(inv.amount))}</span>
                              <span className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                                inv.status === 'pagata' || inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {inv.status === 'pagata' || inv.status === 'Paid' ? t('fin.paid') : t('fin.pending')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right component: Expected scadenze milestone */}
                  <div className="lg:col-span-5 bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                    <div className="border-b border-[#f5f5f5] pb-4 mb-4">
                      <b className="text-[14px] font-black block text-[#161616]">{t('fin.scadenziario')}</b>
                      <span className="text-[11px] text-[#8a8a8a] mt-0.5 block">{t('fin.scadSub')}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {projScadenze.length === 0 ? (
                        <div className="py-8 text-center text-stone-400 italic text-[12px] bg-stone-50/30 rounded-2xl border border-dashed border-stone-200">
                          {t('fin.noScadenze')}
                        </div>
                      ) : (
                        projScadenze.map((sc: any) => (
                          <div key={sc.id} className="p-3.5 rounded-xl border border-stone-150 flex justify-between items-center bg-stone-50/25">
                            <div>
                              <b className="text-[12.5px] font-bold text-stone-800 block leading-tight">{sc.desc || sc.description || t('fin.scadDescFallback')}</b>
                              <span className="text-[10.5px] text-stone-400 font-semibold block mt-1 font-mono">{fmtDay(sc.date || sc.dueDate)}</span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-[13px] font-black block text-stone-800">{eur(Number(sc.amount))}</span>
                              <span className={`text-[10px] font-bold ${sc.isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                                {sc.isPaid ? t('fin.saldata') : t('fin.daSaldare')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {currentTab === 'blog' && (() => {
            const filteredBlogPosts = BLOG_POSTS.filter(post => {
              const matchesCategory = blogFilter === 'all' || post.category === t('blog.cat.' + blogFilter);
              const matchesSearch = post.title.toLowerCase().includes(blogSearch.toLowerCase()) || 
                                    post.excerpt.toLowerCase().includes(blogSearch.toLowerCase()) ||
                                    post.category.toLowerCase().includes(blogSearch.toLowerCase());
              return matchesCategory && matchesSearch;
            });

            return (
              <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both]">
                {selectedPostId ? (() => {
                  const post = BLOG_POSTS.find(b => b.id === selectedPostId);
                  if (!post) return null;
                  return (
                    <motion.div
                      key="blog-post-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white border border-[#e2e2e2] rounded-[26px] p-6 shadow-sm max-w-3xl mx-auto w-full text-left"
                    >
                      {/* Back Button */}
                      <button
                        onClick={() => setSelectedPostId(null)}
                        className="inline-flex items-center gap-2 text-[12.5px] font-extrabold text-[#8a8a8a] hover:text-[#161616] mb-6 border-none bg-transparent cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> {t('blog.backAll')}
                      </button>

                      {/* Post Hero Image */}
                      <div className="w-full h-[220px] md:h-[305px] rounded-2xl overflow-hidden mb-6 shadow-sm relative">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-4 left-4 bg-black/75 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                          {post.category}
                        </span>
                      </div>

                      {/* Metadata & Title */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-[#8a8a8a] mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {post.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {post.readTime}{t('blog.readTimeSuffix')}
                        </span>
                      </div>

                      <h2 className="text-[23px] md:text-[27px] font-black text-[#161616] leading-tight tracking-tight mb-4 font-sans text-left">
                        {post.title}
                      </h2>

                      {/* Intro */}
                      <p className="text-[14.5px] font-bold text-[#4a4a4a] leading-relaxed italic border-l-[3px] border-[#161616] pl-4 mb-6">
                        {post.intro}
                      </p>

                      <div className="flex flex-col gap-5 text-[13.5px] font-semibold text-[#555] leading-relaxed text-left font-sans">
                        {post.sections.map((section, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <h3 className="text-[15.5px] font-extrabold text-[#161616] tracking-tight mt-2">
                              {idx + 1}. {section.title}
                            </h3>
                            {section.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="mb-2">
                                {p}
                              </p>
                            ))}
                          </div>
                        ))}

                        {post.quote && (
                          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 my-4 italic text-amber-900 font-bold relative text-[13px]">
                            <span className="absolute -top-3 left-4 bg-white border border-amber-200/50 text-[9px] font-extrabold uppercase py-0.5 px-2.5 rounded-full text-amber-800">
                              {t('blog.quoteLabel')}
                            </span>
                            "{post.quote}"
                          </div>
                        )}

                        {post.pointsTitle && (
                          <div className="mt-4">
                            <h4 className="text-[14px] font-extrabold text-[#161616] mb-2">{post.pointsTitle}</h4>
                            <ul className="list-disc pl-5 flex flex-col gap-1.5">
                              {post.points?.map((pt, pIdx) => (
                                <li key={pIdx} className="text-[#555] font-semibold">{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#f5f5f5] flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2.5 self-start">
                          <span className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-[13px]">
                            ON
                          </span>
                          <div className="text-left">
                            <b className="block text-[13px] font-extrabold text-[#161616]">{t('blog.author')}</b>
                            <small className="block text-[11px] text-[#8a8a8a] font-semibold">{t('blog.authorRole')}</small>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (p && p.id) {
                              onSendClientMessage(p.id, t('blog.discussMsg', { title: post.title }));
                            }
                            setActiveSubTab('documenti');
                          }}
                          className="bg-[#161616] hover:bg-black text-white text-[12.5px] font-extrabold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all border-none font-sans"
                        >
                          <MessageSquare className="w-4 h-4" /> {t('blog.discussBtn')}
                        </button>
                      </div>
                    </motion.div>
                  );
                })() : (
                  <div className="flex flex-col gap-6">
                    {/* Blog Header & Slogan Banner */}
                    <div className="bg-[#161616] text-white rounded-[26px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border border-zinc-800 text-left">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#a8a8a8]">Design your vision</span>
                        </div>
                        <h2 className="text-[21px] md:text-[24px] font-black tracking-tight leading-tight mb-2">Onirico Blog</h2>
                        <p className="text-[12.5px] text-[#cccccc] font-semibold max-w-[500px]">
                          {t('blog.headerSub')}
                        </p>
                      </div>
                      <a
                        href="https://oniricodesign.com/blog/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/10 hover:bg-white text-white hover:text-black font-extrabold text-[12px] py-2 px-4 rounded-xl border border-white/20 hover:border-transparent flex items-center gap-1.5 transition-all cursor-pointer select-none shrink-0"
                      >
                        {t('blog.visitSite')} <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Search and Categories row */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      {/* Categories tag pills */}
                      <div className="pillbar flex items-center bg-[#eaeaea] border border-[#dcdcdc] p-[3px] rounded-2xl gap-[2px]">
                        {['all', 'architettura', 'ingegneria', 'restauro', 'interior'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setBlogFilter(cat)}
                            className={`text-[12px] font-extrabold px-[14px] py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap border-none ${
                              blogFilter === cat
                                ? 'bg-[#161616] text-white shadow-xs'
                                : 'text-[#555] hover:text-[#161616] bg-transparent'
                            }`}
                          >
                            {t('blog.cat.' + cat)}
                          </button>
                        ))}
                      </div>

                      {/* Integrated search inside blog tab */}
                      <div className="relative min-w-[200px] flex-1 sm:flex-none">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={blogSearch}
                          onChange={(e) => setBlogSearch(e.target.value)}
                          placeholder={t('blog.searchPlaceholder')}
                          className="pl-9 pr-4 py-1.5 text-[12px] font-black text-[#161616] rounded-xl border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] w-full sm:w-[220px] placeholder-gray-400 font-sans shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Blog Posts list */}
                    {filteredBlogPosts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                        {filteredBlogPosts.map(post => (
                          <motion.div
                            key={post.id}
                            layoutId={`blog-post-card-${post.id}`}
                            onClick={() => {
                              setSelectedPostId(post.id);
                              // Smooth scroll up so readers start at top of the article
                              const element = document.getElementById('activeSubTabIndicator');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              } else {
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }
                            }}
                            className="bg-white border border-[#e2e2e2] rounded-[24px] overflow-hidden hover:border-[#161616] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              {/* Image with category */}
                              <div className="h-[180px] w-full overflow-hidden relative bg-gray-100">
                                <img
                                  src={post.image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute top-3 left-3 bg-[#161616] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                  {post.category}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="p-5 pb-2">
                                <div className="flex items-center gap-3 text-[10.5px] font-bold text-gray-400 mb-2">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                                </div>
                                <h3 className="text-[15px] font-black text-[#161616] leading-snug mb-2 font-sans tracking-tight">
                                  {post.title}
                                </h3>
                                <p className="text-[12px] text-[#8a8a8a] font-semibold line-clamp-3 leading-relaxed mb-4">
                                  {post.excerpt}
                                </p>
                              </div>
                            </div>

                            <div className="px-5 pb-5 pt-1">
                              <span className="text-[12px] font-black text-[#161616] group-hover:text-black flex items-center gap-1 border-b border-transparent group-hover:border-[#161616] w-fit pb-0.5 transition-all">
                                {t('blog.readArticle')} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-[13px] text-gray-400 italic font-semibold">{t('blog.noMatch')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Task description detailed popup modal */}
      <AnimatePresence>
        {selectedTaskForModal && (() => {
          const info = getTaskDetail(selectedTaskForModal.title, selectedTaskForModal.phase);
          return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="bg-white rounded-t-[28px] sm:rounded-[28px] sm:max-w-[485px] w-full max-h-[92vh] border border-[#e2e2e2] shadow-2xl overflow-hidden text-left flex flex-col"
              >
                {/* Header section - Luxury light theme matching app */}
                <div className="bg-white p-6 pb-4 border-b border-[#f5f5f5] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] tracking-wider font-extrabold uppercase bg-amber-400 text-black px-2.5 py-0.5 rounded font-mono">
                      {info.badge || t('taskdetail.generic.badge')}
                    </span>
                  </div>
                  <h3 className="text-[17.5px] font-black leading-tight tracking-tight mt-1 text-[#161616]">
                    {selectedTaskForModal.title}
                  </h3>
                  <p className="text-[10px] text-[#8a8a8a] tracking-wide uppercase font-bold">
                    {t('taskmodal.phase', { phase: selectedTaskForModal.phase })}
                  </p>
                </div>

                {/* Content body */}
                <div className="p-6 flex flex-col gap-4 font-sans text-sm">
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a8a8a] mb-1">{t('taskmodal.descLabel')}</h4>
                    <p className="text-[#333] text-[13.5px] leading-relaxed font-semibold">
                      {info.desc}
                    </p>
                  </div>

                  <hr className="border-none h-px bg-[#f1f1f1] my-1" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a8a8a] mb-1">{t('taskmodal.roleLabel')}</h4>
                      <p className="text-[#161616] text-[13px] font-extrabold">
                        {info.role}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a8a8a] mb-1">{t('taskmodal.dueLabel')}</h4>
                      <p className="text-[#161616] text-[13px] font-extrabold">
                        {selectedTaskForModal.done ? t('taskmodal.completed') : info.dueTime}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSendClientMessage(p.id, t('taskmodal.askMsg', { title: selectedTaskForModal.title, phase: selectedTaskForModal.phase }));
                        setSelectedTaskForModal(null);
                        setActiveSubTab('documenti');
                      }}
                      className="w-full bg-[#161616] hover:bg-black text-white text-[12.5px] font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border-none shadow-sm font-sans"
                    >
                      <MessageSquare className="w-4 h-4" /> {t('taskmodal.askBtn')}
                    </button>
                  </div>
                </div>

                {/* Footer with actions */}
                <div className="border-t border-[#f5f5f5] bg-[#fafafa] p-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {selectedTaskForModal.done ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <span className="text-[11.5px] font-extrabold text-[#555]">
                      {t('taskmodal.statusLabel', { status: selectedTaskForModal.done ? t('taskmodal.statusDone') : t('taskmodal.statusWip') })}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTaskForModal(null)}
                    className="bg-[#f0f0f0] hover:bg-gray-200 text-[#161616] border border-[#e2e2e2] text-[12.5px] font-extrabold py-2 px-5 rounded-xl cursor-pointer transition-all"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

// --- Richiesta appuntamento dal portale (cliente/partner) ---
const AppointmentRequestModal: React.FC<{
  open: boolean;
  onClose: () => void;
  members: UserProfile[];
  onRequest: (memberUid: string, memberName: string, date: string, time: string, note: string) => void;
}> = ({ open, onClose, members, onRequest }) => {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  const [member, setMember] = useState(members[0]?.uid || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!member || !date) return;
    const m = members.find((x) => x.uid === member);
    onRequest(member, m?.name || '', date, time, note.trim());
    setDone(true);
    setTimeout(() => {
      onClose();
      setDone(false);
      setDate(''); setTime(''); setNote('');
    }, 1600);
  };

  if (!open) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
          <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-[420px] max-h-[92vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <b className="text-[16px] text-[#161616] block">{t('appt.requestSent')}</b>
                <p className="text-[13px] text-[#8a8a8a] mt-1">{t('appt.requestSentSub')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-black text-[#161616]">{t('appt.title')}</h3>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><XCircle className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-3 text-left">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{t('appt.with')}</span>
                    <select value={member} onChange={(e) => setMember(e.target.value)} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]">
                      {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{t('common.date')}</span>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{t('appt.time')}</span>
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{t('appt.reason')}</span>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" placeholder={t('appt.reasonPlaceholder')} />
                  </label>
                  <button onClick={submit} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> {t('appt.sendRequest')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

/* ---------- Portale investitore: "I miei investimenti" (sola lettura) ---------- */
const INV_STATUS_LABEL: Record<string, string> = {
  valutazione: 'In valutazione', acquisizione: 'In raccolta', ristrutturazione: 'Ristrutturazione',
  vendita: 'In vendita', concluso: 'Concluso',
};
const MyInvestmentsPanel: React.FC<{ positions: UnicoInvestorPosition[] }> = ({ positions }) => {
  const sorted = [...positions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const totInvested = sorted.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totDistributed = sorted.reduce((s, p) => s + (Number(p.distributed) || 0), 0);
  const totExpected = sorted.reduce((s, p) => s + (Number(p.expectedReturn) || 0), 0);

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4338ca] flex items-center justify-center"><Gem className="w-5 h-5" /></div>
        <div>
          <b className="text-[16px] tracking-tight block">I miei investimenti</b>
          <span className="text-[12px] text-stone-400">Le tue posizioni nelle operazioni immobiliari Unico</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <MiniInv icon={<Wallet className="w-3.5 h-3.5" />} label="Investito" value={eur(totInvested)} />
        <MiniInv icon={<TrendingUp className="w-3.5 h-3.5" />} label="Rend. atteso" value={eur(totExpected)} accent="#059669" />
        <MiniInv icon={<HandCoins className="w-3.5 h-3.5" />} label="Distribuito" value={eur(totDistributed)} accent="#4338ca" />
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((p) => {
          const funded = p.goal ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0;
          return (
            <div key={p.dealId} className="border border-[#ececec] rounded-[18px] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{p.type}</span>
                  <b className="block text-[15px] tracking-tight truncate">{p.title}</b>
                  <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {p.location}</span>
                </div>
                <span className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">{INV_STATUS_LABEL[p.status] || p.status}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
                <MiniInv label="Conferito" value={eur(p.amount)} compact />
                <MiniInv label="Quota" value={`${p.quotaPct.toFixed(1)}%${p.units ? ` · ${p.units}q` : ''}`} compact />
                <MiniInv label="ROI atteso" value={`${p.targetRoi || 0}%`} compact />
                <MiniInv label="Distribuito" value={eur(p.distributed)} compact accent="#4338ca" />
              </div>

              <div className="mt-3">
                <div className="h-1.5 w-full bg-[#eee] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${funded}%`, background: '#4338ca' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 font-semibold">
                  <span>Raccolto {eur(p.raised)} / {eur(p.goal)}</span>
                  <span>{p.durationMonths ? `${p.durationMonths} mesi` : ''}{p.spvName ? ` · ${p.spvName}` : ''}</span>
                </div>
              </div>

              {(p.updates || []).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#f3f3f3]">
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400 flex items-center gap-1.5 mb-2"><Megaphone className="w-3.5 h-3.5" /> Aggiornamenti</span>
                  <div className="flex flex-col gap-2">
                    {p.updates.slice(0, 4).map((u) => (
                      <div key={u.id} className="bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <b className="text-[12.5px] flex-1 truncate">{u.title}</b>
                          <span className="text-[10.5px] text-stone-400 shrink-0">{new Date(u.at).toLocaleDateString('it-IT')}</span>
                        </div>
                        <p className="text-[11.5px] text-stone-600 mt-0.5 whitespace-pre-wrap">{u.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(p.distributions || []).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#f3f3f3]">
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400 flex items-center gap-1.5 mb-2"><HandCoins className="w-3.5 h-3.5" /> Distribuzioni ricevute</span>
                  <div className="flex flex-col gap-1.5">
                    {p.distributions.map((x) => (
                      <div key={x.id} className="flex items-center justify-between text-[12px]">
                        <span className="capitalize text-stone-600">{x.kind} · {new Date(x.date).toLocaleDateString('it-IT')}</span>
                        <b className="text-emerald-700">{eur(x.amount)}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const MiniInv: React.FC<{ icon?: React.ReactNode; label: string; value: string; accent?: string; compact?: boolean }> = ({ icon, label, value, accent, compact }) => (
  <div className={`bg-[#fafafa] border border-[#ececec] rounded-xl ${compact ? 'py-2 px-2' : 'py-2.5 px-3'}`}>
    <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-stone-400 justify-center">{icon}{label}</span>
    <b className={`block ${compact ? 'text-[12.5px]' : 'text-[15px]'} mt-0.5 text-center`} style={accent ? { color: accent } : undefined}>{value}</b>
  </div>
);

/* ---------- Portale: inviti eventi + sondaggi (modulo Strategico) ---------- */
const MKT_ACCENT = '#b45309';
const MarketingPortalPanel: React.FC<{
  profile: UserProfile;
  events: MarketingEvent[];
  surveys: Survey[];
  responses: Record<string, Record<string, SurveyResponse>>;
  onRsvp?: (eventId: string, status: RsvpStatus) => void;
  onSubmitSurvey?: (surveyId: string, answers: Record<string, string | number>) => void;
}> = ({ profile, events, surveys, responses, onRsvp, onSubmitSurvey }) => {
  const [openSurvey, setOpenSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  // Eventi futuri a cui sono invitato
  const myEvents = (events || [])
    .filter((e) => (e.invitees || {})[profile.uid])
    .filter((e) => (e.date || 0) >= Date.now() - 864e5)
    .sort((a, b) => (a.date || 0) - (b.date || 0));
  // Sondaggi attivi per il mio ruolo, non ancora compilati
  const aud = profile.role === 'partner' ? 'partner' : 'clienti';
  const mySurveys = (surveys || []).filter((s) => s.active && (s.audience === 'tutti' || s.audience === aud) && !(responses[s.id] || {})[profile.uid]);

  if (myEvents.length === 0 && mySurveys.length === 0 && !openSurvey) return null;

  const submit = (s: Survey) => {
    onSubmitSurvey?.(s.id, answers);
    setOpenSurvey(null);
    setAnswers({});
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: MKT_ACCENT }}><Megaphone className="w-5 h-5" /></div>
        <div>
          <b className="text-[16px] tracking-tight block">Inviti & sondaggi</b>
          <span className="text-[12px] text-stone-400">Eventi a cui sei invitato e questionari da Onirico</span>
        </div>
      </div>

      {myEvents.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-3">
          {myEvents.map((e) => {
            const my = (e.invitees || {})[profile.uid];
            return (
              <div key={e.id} className="border border-[#ececec] rounded-[16px] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {e.kind && <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{e.kind}</span>}
                    <b className="block text-[14.5px] truncate">{e.title}</b>
                    <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><Clock className="w-3.5 h-3.5" /> {e.date ? new Date(e.date).toLocaleString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    {e.location && <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>}
                  </div>
                </div>
                {e.description && <p className="text-[12.5px] text-stone-600 mt-2">{e.description}</p>}
                <div className="flex items-center gap-2 mt-3">
                  {([['accettato', 'Partecipo', CheckCircle2, '#059669'], ['forse', 'Forse', HelpCircle, '#b45309'], ['rifiutato', 'Non posso', XCircle, '#dc2626']] as const).map(([st, lbl, Icon, col]) => {
                    const active = my?.status === st;
                    return (
                      <button key={st} onClick={() => onRsvp?.(e.id, st as RsvpStatus)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12.5px] font-bold border cursor-pointer transition-all ${active ? 'text-white border-transparent' : 'bg-white text-stone-600 border-[#e2e2e2] hover:border-stone-400'}`}
                        style={active ? { background: col } : undefined}>
                        <Icon className="w-3.5 h-3.5" /> {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mySurveys.map((s) => (
        <div key={s.id} className="border border-amber-200 bg-amber-50/40 rounded-[16px] p-4 mb-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <b className="block text-[14px] truncate flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-[#b45309]" /> {s.title}</b>
              {s.intro && <span className="text-[12px] text-stone-500">{s.intro}</span>}
            </div>
            <button onClick={() => { setOpenSurvey(s); setAnswers({}); }} className="shrink-0 h-9 px-4 rounded-lg text-white font-bold text-[12.5px] border-none cursor-pointer" style={{ background: MKT_ACCENT }}>Compila</button>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {openSurvey && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpenSurvey(null)}>
            <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(ev) => ev.stopPropagation()} className="bg-white w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
                <b className="text-[16px] tracking-tight">{openSurvey.title}</b>
                <button onClick={() => setOpenSurvey(null)} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {openSurvey.intro && <p className="text-[13px] text-stone-500">{openSurvey.intro}</p>}
                {openSurvey.questions.map((q, idx) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <label className="text-[13.5px] font-bold">{idx + 1}. {q.text}</label>
                    {q.type === 'rating' ? (
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))} className="w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer" style={Number(answers[q.id]) >= n ? { background: MKT_ACCENT, borderColor: MKT_ACCENT } : { borderColor: '#e2e2e2', background: '#fff' }}>
                            <Star className="w-4 h-4" style={{ color: Number(answers[q.id]) >= n ? '#fff' : '#cbcbcb' }} />
                          </button>
                        ))}
                      </div>
                    ) : q.type === 'choice' ? (
                      <div className="flex flex-col gap-1.5">
                        {(q.options || []).map((opt) => (
                          <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))} className={`text-left text-[13px] px-3 py-2 rounded-lg border cursor-pointer ${answers[q.id] === opt ? 'border-amber-300 bg-amber-50 font-bold' : 'border-[#e2e2e2] bg-white'}`}>{opt}</button>
                        ))}
                      </div>
                    ) : (
                      <textarea className="w-full px-3 py-2 text-[14px] border border-[#e2e2e2] rounded-lg bg-white outline-none focus:border-[#b45309] min-h-[64px]" value={String(answers[q.id] ?? '')} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#ececec] sticky bottom-0 bg-white">
                <button onClick={() => setOpenSurvey(null)} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button>
                <button onClick={() => submit(openSurvey)} className="h-10 px-5 rounded-xl text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5" style={{ background: MKT_ACCENT }}><Send className="w-4 h-4" /> Invia</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
