/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StrategicoView — modulo "Strategico" (società di marketing del gruppo).
 * Gestisce: Eventi & inviti (RSVP), Campagne & follow-up, Sondaggi/customer
 * satisfaction, calendario editoriale Social e un cruscotto Analisi.
 * Nodi Firebase: mktEvents, mktCampaigns, mktSurveys, mktSurveyResponses,
 * mktSocial, mktInvitesIndex (vedi §22 di CLAUDE.md). admin/manager.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Calendar, MapPin, Users, Megaphone, ClipboardList, Share2, BarChart3,
  Trash2, Pencil, Mail, MessageCircle, CheckCircle2, XCircle, HelpCircle, Send,
  Star, Instagram, Facebook, Linkedin, Youtube, Clock, TrendingUp, ListChecks,
  LayoutDashboard, FileText, Timer, Wallet, ArrowRight, Link2, Copy, Receipt,
  Banknote, RefreshCw, AlertTriangle, Image as ImageIcon, Film, Search, Tag,
  Columns, Eye, Check, FolderOpen, Sparkles, Printer, FileBarChart,
  Target, Workflow, Inbox, ShieldCheck, Activity, MousePointerClick, Globe,
} from 'lucide-react';
import type {
  MarketingEvent, Campaign, Survey, SurveyResponse, SocialPost, ClientRecord,
  EventInvitee, RsvpStatus, CampaignStep, SurveyQuestion, CampaignChannel,
  SocialPlatform, SocialStatus, MktContract, MktTimeEntry, MktContractCadence,
  Project, UserProfile, MktAsset, MktDeliverable, MktProof, MktAssetKind,
  MktDeliverableStage, MktPriority, ProofAnnotation, ProofStatus,
  MktLead, MktLeadStage, MktFlow, MktFlowStep, MktFlowChannel, MktSeoItem,
  MktAdCampaign, MktAdPlatform, MktMetric, MktMetricSource, MktInboxItem,
  MktInboxChannel, MktConsent, MktConsentScope, MktProject, MktProjectStatus,
} from '../types';
import type { InvoiceActive, InvoicePassive, ScadenzaItem } from '../finance';
import { eur, safeUrl } from '../utils';
import { callAi } from '../firebase';

const ACCENT = '#b45309';
const IN = 'w-full h-10 px-3 text-[14px] border border-[#e2e2e2] rounded-lg bg-white outline-none focus:border-[#b45309]';
const uid = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
const dtLocal = (ts?: number | null) => (ts ? new Date(ts - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const parseDt = (s: string) => (s ? new Date(s).getTime() : 0);

const RSVP_META: Record<RsvpStatus, { label: string; cls: string }> = {
  invitato: { label: 'Invitato', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  accettato: { label: 'Accettato', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rifiutato: { label: 'Rifiutato', cls: 'bg-red-50 text-red-600 border-red-200' },
  forse: { label: 'Forse', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

interface Props {
  events: MarketingEvent[];
  campaigns: Campaign[];
  surveys: Survey[];
  social: SocialPost[];
  responses: Record<string, Record<string, SurveyResponse>>;
  clients: Record<string, ClientRecord>;
  onSaveEvent: (e: MarketingEvent) => void;
  onDeleteEvent: (id: string) => void;
  onSaveCampaign: (c: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onSaveSurvey: (s: Survey) => void;
  onDeleteSurvey: (id: string) => void;
  onSaveSocialPost: (p: SocialPost) => void;
  onDeleteSocialPost: (id: string) => void;
  // Economia (Blocco A)
  contracts: MktContract[];
  timeEntries: MktTimeEntry[];
  projects: Project[];
  invoicesActive: InvoiceActive[];
  invoicesPassive: InvoicePassive[];
  scadenze: ScadenzaItem[];
  onSaveContract: (k: MktContract) => void;
  onDeleteContract: (id: string) => void;
  onEmitContractInvoice: (id: string, periodLabel?: string) => void;
  onSaveTimeEntry: (t: MktTimeEntry) => void;
  onDeleteTimeEntry: (id: string) => void;
  onBillTimeEntries: (ids: string[]) => void;
  onRegisterCampaignSpend: (id: string) => void;
  onRegisterEventFinance: (id: string) => void;
  // Produzione (Blocco B)
  assets: MktAsset[];
  deliverables: MktDeliverable[];
  proofs: MktProof[];
  team: Record<string, UserProfile>;
  onSaveAsset: (a: MktAsset) => void;
  onDeleteAsset: (id: string) => void;
  onSaveDeliverable: (d: MktDeliverable) => void;
  onDeleteDeliverable: (id: string) => void;
  onSaveProof: (p: MktProof) => void;
  onDeleteProof: (id: string) => void;
  // Acquisizione / Dati / Compliance (Blocchi D–K)
  leads: MktLead[];
  flows: MktFlow[];
  seo: MktSeoItem[];
  ads: MktAdCampaign[];
  metrics: MktMetric[];
  inbox: MktInboxItem[];
  consents: MktConsent[];
  onSaveLead: (l: MktLead) => void;
  onDeleteLead: (id: string) => void;
  onSaveFlow: (f: MktFlow) => void;
  onDeleteFlow: (id: string) => void;
  onSaveSeo: (s: MktSeoItem) => void;
  onDeleteSeo: (id: string) => void;
  onSaveAd: (a: MktAdCampaign) => void;
  onDeleteAd: (id: string) => void;
  onRegisterAdsSpend: (id: string) => void;
  onSaveMetric: (m: MktMetric) => void;
  onDeleteMetric: (id: string) => void;
  onSaveInbox: (i: MktInboxItem) => void;
  onDeleteInbox: (id: string) => void;
  onSaveConsent: (c: MktConsent) => void;
  onDeleteConsent: (id: string) => void;
  // Progetti marketing (contenitore, §22-sex)
  mktProjects: MktProject[];
  onSaveMktProject: (p: MktProject) => void;
  onDeleteMktProject: (id: string) => void;
}

// Livello 1 — aree HOME (globali / overview). Le aree operative stanno DENTRO un progetto (Livello 2).
type HomeTab = 'dashboard' | 'progetti' | 'lead' | 'contratti' | 'consensi' | 'asset' | 'automation';
type ProjTab = 'panoramica' | 'deliverable' | 'revisioni' | 'campagne' | 'social' | 'eventi' | 'ads' | 'seo' | 'sondaggi' | 'analytics' | 'time' | 'inbox' | 'report';
const HOME_TABS: { id: HomeTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'progetti', label: 'Progetti', icon: FolderOpen },
  { id: 'lead', label: 'Lead', icon: Target },
  { id: 'contratti', label: 'Contratti', icon: FileText },
  { id: 'consensi', label: 'Consensi GDPR', icon: ShieldCheck },
  { id: 'asset', label: 'Libreria', icon: ImageIcon },
  { id: 'automation', label: 'Automation', icon: Workflow },
];
const PROJ_TABS: { id: ProjTab; label: string; icon: React.ElementType }[] = [
  { id: 'panoramica', label: 'Panoramica', icon: LayoutDashboard },
  { id: 'deliverable', label: 'Deliverable', icon: Columns },
  { id: 'revisioni', label: 'Revisioni', icon: Eye },
  { id: 'campagne', label: 'Campagne', icon: Megaphone },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'eventi', label: 'Eventi', icon: Calendar },
  { id: 'ads', label: 'Ads', icon: MousePointerClick },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'sondaggi', label: 'Sondaggi', icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'time', label: 'Time', icon: Timer },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'report', label: 'Report', icon: FileBarChart },
];
const PROJ_STATUS_META: Record<MktProjectStatus, { label: string; cls: string }> = {
  attivo: { label: 'Attivo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_pausa: { label: 'In pausa', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  concluso: { label: 'Concluso', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
};
const UNASSIGNED = '__unassigned__';

export const StrategicoView: React.FC<Props> = (props) => {
  const { clients } = props;
  const [activeId, setActiveId] = useState<string | null>(null);   // progetto aperto (o UNASSIGNED, o null=home)
  const [homeTab, setHomeTab] = useState<HomeTab>('dashboard');
  const [projTab, setProjTab] = useState<ProjTab>('panoramica');
  const openProject = (id: string) => { setActiveId(id); setProjTab('panoramica'); };

  const Pillbar = ({ items, current, onPick }: { items: { id: string; label: string; icon: React.ElementType }[]; current: string; onPick: (id: any) => void }) => (
    <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start max-w-full overflow-x-auto">
      {items.map((t) => {
        const active = current === t.id; const Icon = t.icon;
        return (
          <button key={t.id} onClick={() => onPick(t.id)}
            className={`relative text-[12px] font-extrabold px-4 py-1.5 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'}`}>
            {active && <motion.div layoutId="strPill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="absolute inset-0 bg-white rounded-full z-0 shadow-xs" />}
            <span className="relative z-10 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {t.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ---- Livello 2: dentro un progetto ----
  if (activeId) {
    const proj = activeId === UNASSIGNED ? null : props.mktProjects.find((p) => p.id === activeId) || null;
    const title = proj ? proj.name : 'Non assegnati';
    return (
      <div className="flex flex-col gap-5 text-left">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveId(null)} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 cursor-pointer shrink-0" title="Torna ai progetti"><ArrowRight className="w-4.5 h-4.5 rotate-180" /></button>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: proj?.color || ACCENT }}><Megaphone className="w-5 h-5" /></div>
          <div className="min-w-0">
            <button onClick={() => setActiveId(null)} className="text-[11px] text-stone-400 hover:text-[#b45309] bg-transparent border-none cursor-pointer p-0">Strategico · Progetti</button>
            <h1 className="text-[19px] font-extrabold tracking-tight truncate">{title}</h1>
            {proj?.clientName && <p className="text-[12px] text-stone-400">{proj.clientName}</p>}
          </div>
        </div>
        <Pillbar items={PROJ_TABS} current={projTab} onPick={setProjTab} />
        <ProjectWorkspace {...props} projectId={activeId} tab={projTab} goTab={setProjTab} />
      </div>
    );
  }

  // ---- Livello 0/1: home ----
  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: ACCENT }}><Megaphone className="w-5 h-5" /></div>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Strategico</h1>
          <p className="text-[12.5px] text-stone-400">Marketing del gruppo Onirico — scegli un progetto per lavorare</p>
        </div>
      </div>
      <Pillbar items={HOME_TABS} current={homeTab} onPick={setHomeTab} />

      {homeTab === 'dashboard' && <DashboardTab {...props} onOpenProject={openProject} goHome={setHomeTab} />}
      {homeTab === 'progetti' && <MktProjectsTab {...props} onOpenProject={openProject} />}
      {homeTab === 'lead' && <LeadsTab leads={props.leads} clients={clients} team={props.team} onSave={props.onSaveLead} onDelete={props.onDeleteLead} />}
      {homeTab === 'contratti' && <ContractsTab contracts={props.contracts} clients={clients} projects={props.projects} onSave={props.onSaveContract} onDelete={props.onDeleteContract} onEmit={props.onEmitContractInvoice} />}
      {homeTab === 'consensi' && <ConsentsTab consents={props.consents} clients={clients} onSave={props.onSaveConsent} onDelete={props.onDeleteConsent} />}
      {homeTab === 'asset' && <AssetsTab assets={props.assets} clients={clients} campaigns={props.campaigns} onSave={props.onSaveAsset} onDelete={props.onDeleteAsset} />}
      {homeTab === 'automation' && <AutomationTab flows={props.flows} clients={clients} onSave={props.onSaveFlow} onDelete={props.onDeleteFlow} />}
    </div>
  );
};

// Workspace di un singolo progetto: filtra le entità per mktProjectId e timbra le nuove.
const ProjectWorkspace: React.FC<Props & { projectId: string; tab: ProjTab; goTab: (t: ProjTab) => void }> = (props) => {
  const { projectId, tab, clients } = props;
  const isReal = projectId !== UNASSIGNED;
  const proj = isReal ? props.mktProjects.find((p) => p.id === projectId) || null : null;
  function inProj<T extends { mktProjectId?: string | null }>(arr: T[]): T[] {
    return arr.filter((x) => (isReal ? x.mktProjectId === projectId : !x.mktProjectId));
  }
  function stamp<T extends { mktProjectId?: string | null; clientId?: string | null; clientName?: string | null }>(fn: (x: T) => void): (x: T) => void {
    return (x: T) => fn(isReal ? { ...x, mktProjectId: projectId, clientId: x.clientId ?? proj?.clientId ?? null, clientName: x.clientName ?? proj?.clientName ?? null } : x);
  }
  return (
    <>
      {tab === 'panoramica' && <ProjectPanoramica {...props} inProj={inProj} goTab={props.goTab} />}
      {tab === 'deliverable' && <DeliverablesTab deliverables={inProj(props.deliverables)} clients={clients} campaigns={inProj(props.campaigns)} team={props.team} onSave={stamp(props.onSaveDeliverable)} onDelete={props.onDeleteDeliverable} />}
      {tab === 'revisioni' && <ProofsTab proofs={inProj(props.proofs)} clients={clients} onSave={stamp(props.onSaveProof)} onDelete={props.onDeleteProof} />}
      {tab === 'campagne' && <CampaignsTab campaigns={inProj(props.campaigns)} clients={clients} onSave={stamp(props.onSaveCampaign)} onDelete={props.onDeleteCampaign} onRegisterSpend={props.onRegisterCampaignSpend} />}
      {tab === 'social' && <SocialTab social={inProj(props.social)} campaigns={inProj(props.campaigns)} onSave={stamp(props.onSaveSocialPost)} onDelete={props.onDeleteSocialPost} />}
      {tab === 'eventi' && <EventsTab events={inProj(props.events)} clients={clients} onSave={stamp(props.onSaveEvent)} onDelete={props.onDeleteEvent} onRegisterFinance={props.onRegisterEventFinance} />}
      {tab === 'ads' && <AdsTab ads={inProj(props.ads)} clients={clients} onSave={stamp(props.onSaveAd)} onDelete={props.onDeleteAd} onRegisterSpend={props.onRegisterAdsSpend} />}
      {tab === 'seo' && <SeoTab items={inProj(props.seo)} clients={clients} onSave={stamp(props.onSaveSeo)} onDelete={props.onDeleteSeo} />}
      {tab === 'sondaggi' && <SurveysTab surveys={inProj(props.surveys)} responses={props.responses} onSave={stamp(props.onSaveSurvey)} onDelete={props.onDeleteSurvey} />}
      {tab === 'analytics' && <MetricsTab metrics={inProj(props.metrics)} clients={clients} onSave={stamp(props.onSaveMetric)} onDelete={props.onDeleteMetric} />}
      {tab === 'time' && <TimeTab entries={inProj(props.timeEntries)} clients={clients} projects={props.projects} campaigns={inProj(props.campaigns)} onSave={stamp(props.onSaveTimeEntry)} onDelete={props.onDeleteTimeEntry} onBill={props.onBillTimeEntries} />}
      {tab === 'inbox' && <InboxTab inbox={inProj(props.inbox)} clients={clients} onSave={stamp(props.onSaveInbox)} onDelete={props.onDeleteInbox} />}
      {tab === 'report' && <ReportTab {...props} events={inProj(props.events)} campaigns={inProj(props.campaigns)} surveys={inProj(props.surveys)} social={inProj(props.social)} timeEntries={inProj(props.timeEntries)} reportTitle={proj?.name} />}
    </>
  );
};

// Panoramica di progetto: conteggi + economia + accesso rapido alle sezioni.
const ProjectPanoramica: React.FC<Props & { inProj: <T extends { mktProjectId?: string | null }>(a: T[]) => T[]; goTab: (t: ProjTab) => void }> = (props) => {
  const { inProj, goTab } = props;
  const dl = inProj(props.deliverables); const pr = inProj(props.proofs); const cm = inProj(props.campaigns);
  const so = inProj(props.social); const ev = inProj(props.events); const ad = inProj(props.ads);
  const tm = inProj(props.timeEntries);
  const adSpend = ad.reduce((s, a) => s + (Number(a.spend) || 0), 0);
  const ore = tm.reduce((s, t) => s + t.minutes, 0) / 60;
  const proofOpen = pr.filter((p) => p.status !== 'approvato').length;
  const dlOpen = dl.filter((d) => d.stage !== 'pubblicato').length;
  const tiles: { tab: ProjTab; label: string; value: string; icon: React.ElementType; accent?: string }[] = [
    { tab: 'deliverable', label: 'Deliverable aperti', value: `${dlOpen}/${dl.length}`, icon: Columns, accent: ACCENT },
    { tab: 'revisioni', label: 'Revisioni da approvare', value: String(proofOpen), icon: Eye, accent: proofOpen ? '#b45309' : undefined },
    { tab: 'campagne', label: 'Campagne', value: String(cm.length), icon: Megaphone },
    { tab: 'social', label: 'Post social', value: String(so.length), icon: Share2 },
    { tab: 'eventi', label: 'Eventi', value: String(ev.length), icon: Calendar },
    { tab: 'ads', label: 'Spesa ads', value: eur(adSpend), icon: MousePointerClick, accent: '#dc2626' },
    { tab: 'time', label: 'Ore tracciate', value: `${ore.toFixed(1)}h`, icon: Timer },
    { tab: 'report', label: 'Report', value: 'Apri', icon: FileBarChart },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.tab} onClick={() => goTab(t.tab)} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm cursor-pointer hover:border-[#b45309] hover:shadow-md transition-all duration-300">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400"><Icon className="w-4 h-4" />{t.label}</span>
              <b className="block text-[22px] mt-1.5 leading-none tracking-tight" style={t.accent ? { color: t.accent } : undefined}>{t.value}</b>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Lista progetti marketing (Livello 1) — card cliccabili + "Non assegnati" + editor.
const MktProjectsTab: React.FC<Props & { onOpenProject: (id: string) => void }> = (props) => {
  const { clients, onOpenProject } = props;
  const [editing, setEditing] = useState<MktProject | null>(null);
  const projects = [...props.mktProjects].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const countFor = (pid: string) => props.deliverables.filter((d) => d.mktProjectId === pid).length
    + props.campaigns.filter((c) => c.mktProjectId === pid).length + props.social.filter((s) => s.mktProjectId === pid).length
    + props.events.filter((e) => e.mktProjectId === pid).length + props.ads.filter((a) => a.mktProjectId === pid).length;
  const unassignedCount = [props.deliverables, props.campaigns, props.social, props.events, props.ads, props.proofs, props.seo, props.metrics, props.timeEntries, props.inbox, props.surveys]
    .reduce((s, arr: any[]) => s + arr.filter((x) => !x.mktProjectId).length, 0);
  const blank = (): MktProject => ({ id: uid('mp'), name: '', status: 'attivo', color: ACCENT, startAt: Date.now(), createdAt: Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] text-stone-400">Ogni progetto raccoglie deliverable, contenuti, campagne, ads e dati di un cliente. Aprine uno per lavorarci.</span>
        <AddBtn onClick={() => setEditing(blank())} label="Nuovo progetto" />
      </div>
      {projects.length === 0 && unassignedCount === 0 ? (
        <EmptyBox icon={<FolderOpen className="w-6 h-6" />} title="Nessun progetto marketing" text="Crea il primo progetto (es. 'Rebranding Rossi', 'Lancio negozio') e collegalo a un cliente: al suo interno troverai tutte le sezioni operative." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const meta = PROJ_STATUS_META[p.status];
            return (
              <div key={p.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm border-l-[5px] flex flex-col" style={{ borderLeftColor: p.color || ACCENT }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block text-[16px] tracking-tight truncate">{p.name}</b>
                    {p.clientName && <span className="text-[12px] text-stone-500">{p.clientName}</span>}
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.cls}`}>{meta.label}</span>
                </div>
                {p.goal && <p className="text-[12.5px] text-stone-500 mt-2 line-clamp-2">{p.goal}</p>}
                <span className="text-[11.5px] text-stone-400 mt-2">{countFor(p.id)} elementi collegati</span>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => onOpenProject(p.id)} className="flex-1 h-9 rounded-lg text-white text-[12.5px] font-bold border-none cursor-pointer flex items-center justify-center gap-1.5" style={{ background: ACCENT }}>Apri <ArrowRight className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditing(p)} className="w-9 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => props.onDeleteMktProject(p.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
          {unassignedCount > 0 && (
            <button onClick={() => onOpenProject(UNASSIGNED)} className="text-left bg-[#fafafa] border border-dashed border-[#d8d8d8] rounded-[22px] p-5 shadow-sm cursor-pointer hover:border-[#b45309] flex flex-col justify-center">
              <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">Migrazione</span>
              <b className="block text-[15px] tracking-tight mt-1">Non assegnati</b>
              <span className="text-[12px] text-stone-500 mt-1">{unassignedCount} voci senza progetto — aprile e riassegnale.</span>
            </button>
          )}
        </div>
      )}
      <AnimatePresence>{editing && <MktProjectModal project={editing} clients={clients} onClose={() => setEditing(null)} onSave={(p) => { props.onSaveMktProject(p); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const MktProjectModal: React.FC<{ project: MktProject; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (p: MktProject) => void }> = ({ project, clients, onClose, onSave }) => {
  const [p, setP] = useState<MktProject>({ ...project });
  const set = (x: Partial<MktProject>) => setP((s) => ({ ...s, ...x }));
  const clientList = Object.values(clients).filter((c) => c.category !== 'partner');
  return (
    <ModalShell title={project.name ? 'Modifica progetto' : 'Nuovo progetto marketing'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(p)} disabled={!p.name.trim()} label="Salva progetto" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome progetto" full><input className={IN} value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Es. Rebranding Rossi, Lancio negozio…" /></Field>
        <Field label="Cliente (rubrica)" full>
          <select className={IN} value={p.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null, clientName: c ? c.name : null }); }}>
            <option value="">— nessuno —</option>
            {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Stato"><select className={IN} value={p.status} onChange={(e) => set({ status: e.target.value as MktProjectStatus })}><option value="attivo">Attivo</option><option value="in_pausa">In pausa</option><option value="concluso">Concluso</option></select></Field>
        <Field label="Colore"><input type="color" className="w-full h-10 rounded-lg border border-[#e2e2e2] bg-white cursor-pointer" value={p.color || '#b45309'} onChange={(e) => set({ color: e.target.value })} /></Field>
        <Field label="Obiettivo" full><input className={IN} value={p.goal || ''} onChange={(e) => set({ goal: e.target.value })} placeholder="Es. +30% lead in 6 mesi" /></Field>
        <Field label="Inizio"><input type="date" className={IN} value={dOnly(p.startAt)} onChange={(e) => set({ startAt: e.target.value ? parseD(e.target.value) : null })} /></Field>
        <Field label="Fine"><input type="date" className={IN} value={dOnly(p.endAt)} onChange={(e) => set({ endAt: e.target.value ? parseD(e.target.value) : null })} /></Field>
        <Field label="Note" full><textarea className={`${IN} h-auto py-2 min-h-[50px]`} value={p.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== ECONOMIA — helper ============================== */
const CADENCE_LABEL: Record<MktContractCadence, string> = { mensile: 'Mensile', trimestrale: 'Trimestrale', annuale: 'Annuale', una_tantum: 'Una tantum' };
// Ricavo mensile ricorrente (MRR) normalizzato di un contratto attivo.
const monthlyOf = (k: MktContract): number => {
  if (k.status !== 'attivo') return 0;
  const a = Number(k.amount) || 0;
  return k.cadence === 'mensile' ? a : k.cadence === 'trimestrale' ? a / 3 : k.cadence === 'annuale' ? a / 12 : 0;
};
const timeValue = (t: MktTimeEntry) => (t.minutes / 60) * (Number(t.rate) || 0);

/* ============================== KPI / UI shared ============================== */
const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }> = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm">
    <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{icon}{label}</span>
    <b className="block text-[22px] mt-1.5 leading-none tracking-tight" style={accent ? { color: accent } : undefined}>{value}</b>
    {sub && <span className="text-[11px] text-stone-400 mt-1 inline-block">{sub}</span>}
  </div>
);
const Field: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
  <div className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
    <label className="text-[11px] font-bold text-[#555]">{label}</label>
    {children}
  </div>
);
const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, footer, wide }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
    <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(e) => e.stopPropagation()}
      className={`bg-white w-full ${wide ? 'sm:max-w-[760px]' : 'sm:max-w-[620px]'} max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
        <b className="text-[16px] tracking-tight">{title}</b>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
      </div>
      <div className="p-6 flex flex-col gap-4">{children}</div>
      {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#ececec] sticky bottom-0 bg-white">{footer}</div>}
    </motion.div>
  </motion.div>
);
const AddBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-white font-bold text-[13px] h-10 px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95" style={{ background: ACCENT }}>
    <Plus className="w-4 h-4" /> {label}
  </button>
);
const SaveBtn: React.FC<{ onClick: () => void; disabled?: boolean; label?: string }> = ({ onClick, disabled, label }) => (
  <button onClick={onClick} disabled={disabled} className="h-10 px-5 rounded-xl text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50" style={{ background: ACCENT }}>
    <Send className="w-4 h-4" /> {label || 'Salva'}
  </button>
);
const EmptyBox: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-10 shadow-sm text-center">
    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#b45309] flex items-center justify-center mx-auto mb-3">{icon}</div>
    <b className="block text-[16px]">{title}</b>
    <p className="text-[13px] text-stone-500 mt-1.5 max-w-[420px] mx-auto">{text}</p>
  </div>
);

/* ============================== EVENTI ============================== */
const EventsTab: React.FC<{ events: MarketingEvent[]; clients: Record<string, ClientRecord>; onSave: (e: MarketingEvent) => void; onDelete: (id: string) => void; onRegisterFinance: (id: string) => void }> = ({ events, clients, onSave, onDelete, onRegisterFinance }) => {
  const [editing, setEditing] = useState<MarketingEvent | null>(null);
  const sorted = [...events].sort((a, b) => (b.date || 0) - (a.date || 0));
  const upcoming = sorted.filter((e) => (e.date || 0) >= Date.now()).length;
  const totInv = sorted.reduce((s, e) => s + Object.keys(e.invitees || {}).length, 0);
  const totAcc = sorted.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status === 'accettato').length, 0);

  const blank = (): MarketingEvent => ({ id: uid('ev'), title: '', date: Date.now() + 7 * 864e5, location: '', kind: '', description: '', capacity: null, invitees: {}, status: 'bozza', createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Calendar className="w-4 h-4" />} label="Eventi" value={String(events.length)} sub={`${upcoming} in arrivo`} />
        <Kpi icon={<Users className="w-4 h-4" />} label="Invitati" value={String(totInv)} accent={ACCENT} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Conferme" value={String(totAcc)} accent="#059669" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Tasso adesione" value={`${totInv ? Math.round((totAcc / totInv) * 100) : 0}%`} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo evento" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<Calendar className="w-6 h-6" />} title="Nessun evento" text="Crea il primo evento e invita clienti e partner dalla rubrica: traccerai le risposte in tempo reale." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((e) => {
            const inv = Object.values(e.invitees || {});
            const acc = inv.filter((i) => i.status === 'accettato').length;
            const past = (e.date || 0) < Date.now();
            return (
              <div key={e.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm border-l-[5px]" style={{ borderLeftColor: ACCENT }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {e.kind && <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{e.kind}</span>}
                    <b className="block text-[16px] tracking-tight truncate">{e.title || 'Senza titolo'}</b>
                    <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><Clock className="w-3.5 h-3.5" /> {e.date ? new Date(e.date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    {e.location && <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>}
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${past ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{past ? 'Concluso' : (e.status === 'pubblicato' ? 'Pubblicato' : 'Bozza')}</span>
                </div>
                <div className="flex items-center gap-3 mt-3 text-[12px] text-stone-500">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {inv.length} invitati</span>
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> {acc}</span>
                  {e.capacity ? <span className="text-stone-400">/ {e.capacity} posti</span> : null}
                </div>
                {(Number(e.revenue) > 0 || Number(e.budget) > 0) && (
                  <div className="flex items-center gap-3 mt-2 text-[12px]">
                    {Number(e.revenue) > 0 && <span className="text-emerald-600 font-bold">+{eur(Number(e.revenue))}</span>}
                    {Number(e.budget) > 0 && <span className="text-red-500 font-bold">−{eur(Number(e.budget))}</span>}
                    {(e.financeRefs || []).length > 0 && <span className="text-[10.5px] text-stone-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> in Finanza</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => setEditing(e)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Gestisci</button>
                  {(Number(e.revenue) > 0 || Number(e.budget) > 0) && (
                    <button onClick={() => onRegisterFinance(e.id)} title="Registra ricavi/costi in Finanza" className="w-9 h-9 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-700 cursor-pointer"><Banknote className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => onDelete(e.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && <EventModal event={editing} clients={clients} onClose={() => setEditing(null)} onSave={(e) => { onSave(e); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const EventModal: React.FC<{ event: MarketingEvent; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (e: MarketingEvent) => void }> = ({ event, clients, onClose, onSave }) => {
  const [e, setE] = useState<MarketingEvent>({ ...event, invitees: event.invitees || {} });
  const [pick, setPick] = useState('');
  const set = (p: Partial<MarketingEvent>) => setE((x) => ({ ...x, ...p }));

  const addFromClient = (cid: string) => {
    const c = clients[cid];
    if (!c) return;
    const key = c.accountUid || cid;
    if (e.invitees[key]) return;
    set({ invitees: { ...e.invitees, [key]: { name: c.name, email: c.email || null, clientId: cid, uid: c.accountUid || null, status: 'invitato' } } });
  };
  const removeInvitee = (k: string) => { const n = { ...e.invitees }; delete n[k]; set({ invitees: n }); };

  const clientList = Object.values(clients).filter((c) => c.category !== 'partner');
  const inv = Object.entries(e.invitees);

  return (
    <ModalShell title={event.title ? 'Gestisci evento' : 'Nuovo evento'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(e)} disabled={!e.title.trim()} label="Salva evento" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={e.title} onChange={(ev) => set({ title: ev.target.value })} placeholder="Es. Open day showroom Materico" /></Field>
        <Field label="Data e ora"><input type="datetime-local" className={IN} value={dtLocal(e.date)} onChange={(ev) => set({ date: parseDt(ev.target.value) })} /></Field>
        <Field label="Tipo"><input className={IN} value={e.kind || ''} onChange={(ev) => set({ kind: ev.target.value })} placeholder="Open day, webinar…" /></Field>
        <Field label="Luogo"><input className={IN} value={e.location || ''} onChange={(ev) => set({ location: ev.target.value })} /></Field>
        <Field label="Capienza"><input type="number" className={IN} value={e.capacity || ''} onChange={(ev) => set({ capacity: ev.target.value ? Number(ev.target.value) : null })} /></Field>
        <Field label="Costo evento (€)"><input type="number" className={IN} value={e.budget ?? ''} onChange={(ev) => set({ budget: ev.target.value ? Number(ev.target.value) : null })} placeholder="0" /></Field>
        <Field label="Ricavi (biglietti/sponsor) (€)"><input type="number" className={IN} value={e.revenue ?? ''} onChange={(ev) => set({ revenue: ev.target.value ? Number(ev.target.value) : null })} placeholder="0" /></Field>
        <Field label="Descrizione" full><textarea className={`${IN} h-auto py-2 min-h-[60px]`} value={e.description || ''} onChange={(ev) => set({ description: ev.target.value })} /></Field>
        <Field label="Stato" full>
          <div className="flex gap-1.5">
            {(['bozza', 'pubblicato', 'concluso'] as const).map((s) => (
              <button key={s} onClick={() => set({ status: s })} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border cursor-pointer capitalize ${e.status === s ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500 border-stone-200'}`}>{s}</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Invitati ({inv.length})</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <select className={`${IN} flex-1`} value={pick} onChange={(ev) => { setPick(''); if (ev.target.value) addFromClient(ev.target.value); }}>
            <option value="">Aggiungi dalla rubrica clienti…</option>
            {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}{c.tier ? ` · fascia ${c.tier}` : ''}{c.accountUid ? ' · portale' : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {inv.map(([k, i]) => (
            <div key={k} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
              <b className="text-[13px] flex-1 truncate">{i.name}{i.uid && <span className="text-[10px] text-[#b45309] ml-1.5">portale</span>}</b>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${RSVP_META[i.status].cls}`}>{RSVP_META[i.status].label}</span>
              <button onClick={() => removeInvitee(k)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {inv.length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun invitato. Aggiungi dalla rubrica: gli invitati con account portale riceveranno l'invito e potranno rispondere.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

/* ============================== CAMPAGNE ============================== */
const CHANNELS: { id: CampaignChannel; label: string }[] = [
  { id: 'email', label: 'Email' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'social', label: 'Social' }, { id: 'misto', label: 'Misto' },
];
const CampaignsTab: React.FC<{ campaigns: Campaign[]; clients: Record<string, ClientRecord>; onSave: (c: Campaign) => void; onDelete: (id: string) => void; onRegisterSpend: (id: string) => void }> = ({ campaigns, clients, onSave, onDelete, onRegisterSpend }) => {
  const [editing, setEditing] = useState<Campaign | null>(null);
  const sorted = [...campaigns].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const active = sorted.filter((c) => c.status === 'attiva').length;
  const blank = (): Campaign => ({ id: uid('cmp'), name: '', channel: 'email', season: '', goal: '', audienceTiers: [], message: '', steps: [], status: 'bozza', sentCount: 0, responses: 0, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<Megaphone className="w-4 h-4" />} label="Campagne" value={String(campaigns.length)} sub={`${active} attive`} accent={ACCENT} />
        <Kpi icon={<Send className="w-4 h-4" />} label="Invii (manuali)" value={String(sorted.reduce((s, c) => s + (c.sentCount || 0), 0))} />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Risposte" value={String(sorted.reduce((s, c) => s + (c.responses || 0), 0))} accent="#059669" />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuova campagna" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<Megaphone className="w-6 h-6" />} title="Nessuna campagna" text="Pianifica campagne stagionali e follow-up. I contatti si generano dalla rubrica come link email/WhatsApp pronti all'invio." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((c) => (
            <div key={c.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{c.channel}{c.season ? ` · ${c.season}` : ''}</span>
                  <b className="block text-[16px] tracking-tight truncate">{c.name || 'Senza nome'}</b>
                  {c.goal && <span className="text-[12px] text-stone-500">{c.goal}</span>}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${c.status === 'attiva' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.status === 'conclusa' ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.status}</span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[12px] text-stone-500 flex-wrap">
                <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> {(c.steps || []).length} follow-up</span>
                <span className="flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {c.sentCount || 0} invii</span>
                <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="w-3.5 h-3.5" /> {c.responses || 0}</span>
                {Number(c.spend || c.budget) > 0 && <span className="flex items-center gap-1 text-red-500 font-bold"><Wallet className="w-3.5 h-3.5" /> {eur(Number(c.spend || c.budget))}{(c.financeRefs || []).length > 0 && ' ✓'}</span>}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                <button onClick={() => setEditing(c)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Gestisci</button>
                {Number(c.spend || c.budget) > 0 && <button onClick={() => onRegisterSpend(c.id)} title="Registra spesa in Finanza" className="w-9 h-9 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-700 cursor-pointer"><Banknote className="w-3.5 h-3.5" /></button>}
                <button onClick={() => onDelete(c.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && <CampaignModal campaign={editing} clients={clients} onClose={() => setEditing(null)} onSave={(c) => { onSave(c); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const CampaignModal: React.FC<{ campaign: Campaign; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (c: Campaign) => void }> = ({ campaign, clients, onClose, onSave }) => {
  const [c, setC] = useState<Campaign>({ ...campaign, steps: campaign.steps || [], audienceTiers: campaign.audienceTiers || [] });
  const set = (p: Partial<Campaign>) => setC((x) => ({ ...x, ...p }));
  const toggleTier = (t: number) => set({ audienceTiers: (c.audienceTiers || []).includes(t) ? (c.audienceTiers || []).filter((x) => x !== t) : [...(c.audienceTiers || []), t] });
  const addStep = () => set({ steps: [...(c.steps || []), { id: uid('st'), offsetDays: 3, channel: c.channel, message: '' }] });
  const setStep = (id: string, p: Partial<CampaignStep>) => set({ steps: (c.steps || []).map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const delStep = (id: string) => set({ steps: (c.steps || []).filter((s) => s.id !== id) });

  // Destinatari dalla rubrica secondo le fasce selezionate → link pronti
  const audience = Object.values(clients).filter((cl) => cl.category !== 'partner' && ((c.audienceTiers || []).length === 0 || (cl.tier != null && (c.audienceTiers || []).includes(cl.tier))));
  const enc = encodeURIComponent(c.message || '');
  const setUtm = (p: Partial<NonNullable<Campaign['utm']>>) => set({ utm: { ...(c.utm || {}), ...p } });
  const utm = c.utm || {};
  const utmUrl = (() => {
    const base = (utm.baseUrl || '').trim();
    if (!base) return '';
    const params = [
      ['utm_source', utm.source], ['utm_medium', utm.medium], ['utm_campaign', utm.campaign || c.name],
      ['utm_term', utm.term], ['utm_content', utm.content],
    ].filter(([, v]) => v && String(v).trim()).map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`);
    if (!params.length) return base;
    return base + (base.includes('?') ? '&' : '?') + params.join('&');
  })();

  return (
    <ModalShell title={campaign.name ? 'Gestisci campagna' : 'Nuova campagna'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(c)} disabled={!c.name.trim()} label="Salva campagna" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" full><input className={IN} value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder="Es. Promo primavera ristrutturazioni" /></Field>
        <Field label="Canale"><select className={IN} value={c.channel} onChange={(e) => set({ channel: e.target.value as CampaignChannel })}>{CHANNELS.map((ch) => <option key={ch.id} value={ch.id}>{ch.label}</option>)}</select></Field>
        <Field label="Stagionalità"><input className={IN} value={c.season || ''} onChange={(e) => set({ season: e.target.value })} placeholder="Es. Natale 2026" /></Field>
        <Field label="Obiettivo" full><input className={IN} value={c.goal || ''} onChange={(e) => set({ goal: e.target.value })} placeholder="Es. Riattivare clienti fascia 2" /></Field>
        <Field label="Messaggio" full>
          <textarea className={`${IN} h-auto py-2 min-h-[70px]`} value={c.message || ''} onChange={(e) => set({ message: e.target.value })} placeholder="Testo del messaggio (usato nei link email/WhatsApp)…" />
          <AiAssist label="Genera messaggio con AI"
            build={() => `Scrivi un breve messaggio di marketing (canale: ${c.channel}) per la campagna "${c.name}". Obiettivo: ${c.goal || 'coinvolgere i clienti'}. Stagione/contesto: ${c.season || 'n/d'}. Tono coerente con uno studio di architettura/ingegneria. Max 4 frasi, pronto da inviare, senza segnaposto.`}
            onResult={(t) => set({ message: t })} />
        </Field>
        <Field label="Stato"><select className={IN} value={c.status} onChange={(e) => set({ status: e.target.value as Campaign['status'] })}><option value="bozza">Bozza</option><option value="attiva">Attiva</option><option value="conclusa">Conclusa</option></select></Field>
        <Field label="Fasce destinatarie">
          <div className="flex gap-1.5 items-center h-10">
            {[1, 2, 3].map((t) => <button key={t} onClick={() => toggleTier(t)} className={`text-[12px] font-bold w-9 h-9 rounded-lg border cursor-pointer ${(c.audienceTiers || []).includes(t) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500 border-stone-200'}`}>{t}</button>)}
            <span className="text-[11px] text-stone-400 ml-1">{(c.audienceTiers || []).length === 0 ? 'tutte' : ''}</span>
          </div>
        </Field>
        <Field label="Budget (€)"><input type="number" className={IN} value={c.budget ?? ''} onChange={(e) => set({ budget: e.target.value ? Number(e.target.value) : null })} placeholder="0" /></Field>
        <Field label="Spesa effettiva (€)"><input type="number" className={IN} value={c.spend ?? ''} onChange={(e) => set({ spend: e.target.value ? Number(e.target.value) : null })} placeholder="0" /></Field>
      </div>

      {/* UTM builder */}
      <div className="border-t border-[#ececec] pt-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> UTM builder</span>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="URL di destinazione" full><input className={IN} value={utm.baseUrl || ''} onChange={(e) => setUtm({ baseUrl: e.target.value })} placeholder="https://giorgiopascalistudio.github.io/…" /></Field>
          <Field label="Source"><input className={IN} value={utm.source || ''} onChange={(e) => setUtm({ source: e.target.value })} placeholder="instagram" /></Field>
          <Field label="Medium"><input className={IN} value={utm.medium || ''} onChange={(e) => setUtm({ medium: e.target.value })} placeholder="social" /></Field>
          <Field label="Campaign"><input className={IN} value={utm.campaign || ''} onChange={(e) => setUtm({ campaign: e.target.value })} placeholder={c.name || 'utm_campaign'} /></Field>
          <Field label="Content"><input className={IN} value={utm.content || ''} onChange={(e) => setUtm({ content: e.target.value })} placeholder="post_01" /></Field>
        </div>
        {utmUrl && (
          <div className="flex items-center gap-2 mt-3 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
            <span className="text-[12px] text-stone-600 truncate flex-1">{utmUrl}</span>
            <button onClick={() => { navigator.clipboard?.writeText(utmUrl); }} className="shrink-0 flex items-center gap-1 text-[11.5px] font-bold text-[#b45309] bg-white border border-[#e2e2e2] rounded-lg px-2 py-1 cursor-pointer"><Copy className="w-3.5 h-3.5" /> Copia</button>
          </div>
        )}
      </div>

      {/* Follow-up */}
      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Follow-up pianificati</span>
          <button onClick={addStep} className="text-[12px] font-bold text-[#b45309] flex items-center gap-1 bg-transparent border-none cursor-pointer"><Plus className="w-3.5 h-3.5" /> Aggiungi</button>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {(c.steps || []).map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
              <span className="text-[11px] text-stone-500 shrink-0">+</span>
              <input type="number" className="w-14 h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md" value={s.offsetDays} onChange={(e) => setStep(s.id, { offsetDays: Number(e.target.value) })} />
              <span className="text-[11px] text-stone-500 shrink-0">gg</span>
              <input className="flex-1 h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md" value={s.message} onChange={(e) => setStep(s.id, { message: e.target.value })} placeholder="Messaggio di follow-up" />
              <button onClick={() => delStep(s.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {(c.steps || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun follow-up.</span>}
        </div>
      </div>

      {/* Destinatari + link pronti */}
      <div className="border-t border-[#ececec] pt-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Destinatari ({audience.length})</span>
        <div className="flex flex-col gap-1.5 mt-3 max-h-[180px] overflow-y-auto">
          {audience.map((cl) => (
            <div key={cl.id} className="flex items-center gap-2 text-[13px] bg-[#fafafa] border border-[#ececec] rounded-lg px-3 py-1.5">
              <b className="flex-1 truncate">{cl.name}</b>
              {cl.email && <a href={safeUrl(`mailto:${cl.email}?subject=${encodeURIComponent(c.name)}&body=${enc}`) || '#'} className="w-7 h-7 rounded-lg bg-white border border-[#e2e2e2] flex items-center justify-center text-stone-600 hover:text-[#b45309]" title="Email"><Mail className="w-3.5 h-3.5" /></a>}
              {(cl.whatsapp || cl.phone) && <a href={safeUrl(`https://wa.me/${(cl.whatsapp || cl.phone || '').replace(/[^0-9]/g, '')}?text=${enc}`) || '#'} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-white border border-[#e2e2e2] flex items-center justify-center text-stone-600 hover:text-emerald-600" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>}
            </div>
          ))}
          {audience.length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun contatto in rubrica per queste fasce.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

/* ============================== SONDAGGI ============================== */
const SurveysTab: React.FC<{ surveys: Survey[]; responses: Record<string, Record<string, SurveyResponse>>; onSave: (s: Survey) => void; onDelete: (id: string) => void }> = ({ surveys, responses, onSave, onDelete }) => {
  const [editing, setEditing] = useState<Survey | null>(null);
  const [resultsFor, setResultsFor] = useState<Survey | null>(null);
  const sorted = [...surveys].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const totResp = Object.values(responses).reduce((s, r) => s + Object.keys(r || {}).length, 0);
  const blank = (): Survey => ({ id: uid('sv'), title: '', intro: '', questions: [], audience: 'clienti', active: true, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<ClipboardList className="w-4 h-4" />} label="Sondaggi" value={String(surveys.length)} sub={`${sorted.filter((s) => s.active).length} attivi`} accent={ACCENT} />
        <Kpi icon={<Users className="w-4 h-4" />} label="Risposte totali" value={String(totResp)} accent="#059669" />
        <Kpi icon={<Star className="w-4 h-4" />} label="Domande" value={String(sorted.reduce((s, x) => s + (x.questions || []).length, 0))} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo sondaggio" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<ClipboardList className="w-6 h-6" />} title="Nessun sondaggio" text="Crea sondaggi di customer satisfaction: i clienti li compilano dal portale e vedi i risultati aggregati qui." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((s) => {
            const n = Object.keys(responses[s.id] || {}).length;
            return (
              <div key={s.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block text-[16px] tracking-tight truncate">{s.title || 'Senza titolo'}</b>
                    <span className="text-[12px] text-stone-500">{(s.questions || []).length} domande · destinatari: {s.audience}</span>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${s.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{s.active ? 'Attivo' : 'Chiuso'}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-[12px] text-stone-500"><Users className="w-3.5 h-3.5" /> {n} risposte</div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => setResultsFor(s)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white border border-[#e2e2e2] hover:border-stone-400 text-[12.5px] font-bold cursor-pointer"><BarChart3 className="w-3.5 h-3.5" /> Risultati</button>
                  <button onClick={() => setEditing(s)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Modifica</button>
                  <button onClick={() => onDelete(s.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && <SurveyModal survey={editing} onClose={() => setEditing(null)} onSave={(s) => { onSave(s); setEditing(null); }} />}
        {resultsFor && <SurveyResults survey={resultsFor} responses={responses[resultsFor.id] || {}} onClose={() => setResultsFor(null)} />}
      </AnimatePresence>
    </div>
  );
};

const SurveyModal: React.FC<{ survey: Survey; onClose: () => void; onSave: (s: Survey) => void }> = ({ survey, onClose, onSave }) => {
  const [s, setS] = useState<Survey>({ ...survey, questions: survey.questions || [] });
  const set = (p: Partial<Survey>) => setS((x) => ({ ...x, ...p }));
  const addQ = (type: SurveyQuestion['type']) => set({ questions: [...s.questions, { id: uid('q'), text: '', type, options: type === 'choice' ? ['', ''] : undefined }] });
  const setQ = (id: string, p: Partial<SurveyQuestion>) => set({ questions: s.questions.map((q) => (q.id === id ? { ...q, ...p } : q)) });
  const delQ = (id: string) => set({ questions: s.questions.filter((q) => q.id !== id) });

  return (
    <ModalShell title={survey.title ? 'Modifica sondaggio' : 'Nuovo sondaggio'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(s)} disabled={!s.title.trim() || s.questions.length === 0} label="Salva sondaggio" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Soddisfazione fine lavori" /></Field>
        <Field label="Introduzione" full><textarea className={`${IN} h-auto py-2 min-h-[50px]`} value={s.intro || ''} onChange={(e) => set({ intro: e.target.value })} /></Field>
        <Field label="Destinatari"><select className={IN} value={s.audience} onChange={(e) => set({ audience: e.target.value as Survey['audience'] })}><option value="clienti">Clienti</option><option value="partner">Partner</option><option value="tutti">Tutti</option></select></Field>
        <Field label="Stato"><label className="flex items-center gap-2 h-10 cursor-pointer"><input type="checkbox" checked={s.active} onChange={(e) => set({ active: e.target.checked })} className="w-4 h-4 accent-[#b45309]" /><span className="text-[13px] text-stone-600">Attivo (visibile nel portale)</span></label></Field>
      </div>

      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Domande ({s.questions.length})</span>
          <div className="flex gap-1.5">
            <button onClick={() => addQ('rating')} className="text-[11.5px] font-bold text-[#b45309] border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 cursor-pointer">+ Voto</button>
            <button onClick={() => addQ('choice')} className="text-[11.5px] font-bold text-[#b45309] border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 cursor-pointer">+ Scelta</button>
            <button onClick={() => addQ('text')} className="text-[11.5px] font-bold text-[#b45309] border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 cursor-pointer">+ Testo</button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {s.questions.map((q, idx) => (
            <div key={q.id} className="bg-[#fafafa] border border-[#ececec] rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-stone-400 shrink-0">{idx + 1}.</span>
                <input className="flex-1 h-9 px-2.5 text-[13px] border border-[#e2e2e2] rounded-md bg-white" value={q.text} onChange={(e) => setQ(q.id, { text: e.target.value })} placeholder="Testo della domanda" />
                <span className="text-[10.5px] font-bold uppercase text-stone-400 shrink-0">{q.type === 'rating' ? 'voto 1-5' : q.type}</span>
                <button onClick={() => delQ(q.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
              </div>
              {q.type === 'choice' && (
                <div className="flex flex-col gap-1.5 mt-2 pl-6">
                  {(q.options || []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input className="flex-1 h-8 px-2 text-[12.5px] border border-[#e2e2e2] rounded-md bg-white" value={opt} onChange={(e) => setQ(q.id, { options: (q.options || []).map((o, j) => (j === oi ? e.target.value : o)) })} placeholder={`Opzione ${oi + 1}`} />
                      <button onClick={() => setQ(q.id, { options: (q.options || []).filter((_, j) => j !== oi) })} className="w-6 h-6 rounded hover:bg-red-50 text-red-400 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setQ(q.id, { options: [...(q.options || []), ''] })} className="self-start text-[11.5px] font-bold text-[#b45309] bg-transparent border-none cursor-pointer flex items-center gap-1"><Plus className="w-3 h-3" /> opzione</button>
                </div>
              )}
            </div>
          ))}
          {s.questions.length === 0 && <span className="text-[12.5px] italic text-stone-400">Aggiungi almeno una domanda.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

const SurveyResults: React.FC<{ survey: Survey; responses: Record<string, SurveyResponse>; onClose: () => void }> = ({ survey, responses, onClose }) => {
  const rows = Object.values(responses);
  return (
    <ModalShell title={`Risultati · ${survey.title}`} onClose={onClose} wide footer={<button onClick={onClose} className="h-10 px-5 rounded-xl bg-[#1b1b1b] text-white font-bold text-[13px] border-none cursor-pointer">Chiudi</button>}>
      <span className="text-[13px] text-stone-500">{rows.length} risposte</span>
      {survey.questions.map((q) => {
        const vals = rows.map((r) => r.answers[q.id]).filter((v) => v != null && v !== '');
        return (
          <div key={q.id} className="border border-[#ececec] rounded-xl p-3">
            <b className="text-[13.5px] block mb-2">{q.text}</b>
            {q.type === 'rating' ? (
              <span className="text-[20px] font-extrabold" style={{ color: ACCENT }}>{vals.length ? (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1) : '—'}<span className="text-[12px] text-stone-400 font-normal"> / 5 media</span></span>
            ) : q.type === 'choice' ? (
              <div className="flex flex-col gap-1.5">
                {(q.options || []).map((opt) => {
                  const cnt = vals.filter((v) => v === opt).length;
                  const pct = vals.length ? Math.round((cnt / vals.length) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="flex justify-between text-[12px]"><span>{opt || '—'}</span><span className="text-stone-400">{cnt} · {pct}%</span></div>
                      <div className="h-1.5 bg-[#eee] rounded-full overflow-hidden mt-0.5"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                {vals.length === 0 ? <span className="text-[12.5px] italic text-stone-400">Nessuna risposta.</span> : vals.map((v, i) => <span key={i} className="text-[12.5px] bg-[#fafafa] border border-[#ececec] rounded-lg px-2.5 py-1.5">{String(v)}</span>)}
              </div>
            )}
          </div>
        );
      })}
    </ModalShell>
  );
};

/* ============================== SOCIAL ============================== */
const PLATFORMS: { id: SocialPlatform; label: string; icon: React.ElementType }[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram }, { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin }, { id: 'tiktok', label: 'TikTok', icon: Share2 }, { id: 'youtube', label: 'YouTube', icon: Youtube },
];
const SOCIAL_COLS: { id: SocialStatus; label: string }[] = [
  { id: 'idea', label: 'Idee' }, { id: 'bozza', label: 'Bozze' }, { id: 'programmato', label: 'Programmati' }, { id: 'pubblicato', label: 'Pubblicati' },
];
const SocialTab: React.FC<{ social: SocialPost[]; campaigns: Campaign[]; onSave: (p: SocialPost) => void; onDelete: (id: string) => void }> = ({ social, campaigns, onSave, onDelete }) => {
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const blank = (): SocialPost => ({ id: uid('sp'), platform: 'instagram', caption: '', status: 'idea', scheduledAt: null, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo post" /></div>
      {social.length === 0 ? (
        <EmptyBox icon={<Share2 className="w-6 h-6" />} title="Calendario editoriale vuoto" text="Pianifica i contenuti social per le società del gruppo: idee, bozze, post programmati e pubblicati, con metriche." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {SOCIAL_COLS.map((col) => {
            const items = social.filter((p) => p.status === col.id).sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));
            return (
              <div key={col.id} className="bg-[#f6f6f4] border border-[#e8e8e6] rounded-[20px] p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <b className="text-[12.5px]">{col.label}</b>
                  <span className="text-[11px] text-stone-400 font-bold">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((p) => {
                    const Plat = (PLATFORMS.find((x) => x.id === p.platform) || PLATFORMS[0]).icon;
                    return (
                      <button key={p.id} onClick={() => setEditing(p)} className="text-left bg-white border border-[#ececec] rounded-xl p-3 cursor-pointer hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1"><Plat className="w-3.5 h-3.5" /> {p.platform}{p.scheduledAt ? ` · ${new Date(p.scheduledAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}` : ''}</div>
                        <p className="text-[12.5px] line-clamp-3">{p.caption || '—'}</p>
                        {(p.reach != null || p.likes != null) && <div className="flex gap-2 mt-1.5 text-[10.5px] text-stone-400">{p.reach != null && <span>{p.reach} reach</span>}{p.likes != null && <span>{p.likes} like</span>}</div>}
                      </button>
                    );
                  })}
                  {items.length === 0 && <span className="text-[11.5px] italic text-stone-400 px-1">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {editing && <SocialModal post={editing} campaigns={campaigns} onClose={() => setEditing(null)} onSave={(p) => { onSave(p); setEditing(null); }} onDelete={(id) => { onDelete(id); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const SocialModal: React.FC<{ post: SocialPost; campaigns: Campaign[]; onClose: () => void; onSave: (p: SocialPost) => void; onDelete: (id: string) => void }> = ({ post, campaigns, onClose, onSave, onDelete }) => {
  const [p, setP] = useState<SocialPost>({ ...post });
  const set = (x: Partial<SocialPost>) => setP((v) => ({ ...v, ...x }));
  const exists = !!post.caption || !!post.mediaUrl;
  return (
    <ModalShell title={exists ? 'Modifica post' : 'Nuovo post'} onClose={onClose}
      footer={<><button onClick={() => onDelete(p.id)} className="h-10 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-[13px] cursor-pointer mr-auto">Elimina</button><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(p)} disabled={!p.caption.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Piattaforma"><select className={IN} value={p.platform} onChange={(e) => set({ platform: e.target.value as SocialPlatform })}>{PLATFORMS.map((pl) => <option key={pl.id} value={pl.id}>{pl.label}</option>)}</select></Field>
        <Field label="Stato"><select className={IN} value={p.status} onChange={(e) => set({ status: e.target.value as SocialStatus })}>{SOCIAL_COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
        <Field label="Caption" full><textarea className={`${IN} h-auto py-2 min-h-[80px]`} value={p.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Testo del post + hashtag…" /></Field>
        <Field label="Pilastro/tema"><input className={IN} value={p.pillar || ''} onChange={(e) => set({ pillar: e.target.value })} placeholder="Es. Dietro le quinte" /></Field>
        <Field label="Data programmata"><input type="datetime-local" className={IN} value={dtLocal(p.scheduledAt)} onChange={(e) => set({ scheduledAt: parseDt(e.target.value) || null })} /></Field>
        <Field label="Link media/asset" full><input className={IN} value={p.mediaUrl || ''} onChange={(e) => set({ mediaUrl: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Campagna collegata" full><select className={IN} value={p.campaignId || ''} onChange={(e) => set({ campaignId: e.target.value || null })}><option value="">— Nessuna —</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Reach (metrica)"><input type="number" className={IN} value={p.reach ?? ''} onChange={(e) => set({ reach: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Like (metrica)"><input type="number" className={IN} value={p.likes ?? ''} onChange={(e) => set({ likes: e.target.value ? Number(e.target.value) : null })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== ANALISI ============================== */
const AnalisiTab: React.FC<{ events: MarketingEvent[]; campaigns: Campaign[]; surveys: Survey[]; social: SocialPost[]; responses: Record<string, Record<string, SurveyResponse>> }> = ({ events, campaigns, surveys, social, responses }) => {
  const stats = useMemo(() => {
    const inv = events.reduce((s, e) => s + Object.keys(e.invitees || {}).length, 0);
    const acc = events.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status === 'accettato').length, 0);
    const resp = events.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status !== 'invitato').length, 0);
    const sent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
    const cresp = campaigns.reduce((s, c) => s + (c.responses || 0), 0);
    const totResp = Object.values(responses).reduce((s, r) => s + Object.keys(r || {}).length, 0);
    // Media voti (NPS-like) su tutte le domande rating
    let ratingSum = 0, ratingN = 0;
    surveys.forEach((sv) => {
      const ratingQ = (sv.questions || []).filter((q) => q.type === 'rating').map((q) => q.id);
      Object.values(responses[sv.id] || {}).forEach((r) => ratingQ.forEach((qid) => { const v = Number(r.answers[qid]); if (v) { ratingSum += v; ratingN++; } }));
    });
    const pub = social.filter((p) => p.status === 'pubblicato');
    const reach = pub.reduce((s, p) => s + (p.reach || 0), 0);
    return {
      invRate: inv ? Math.round((acc / inv) * 100) : 0,
      respRate: inv ? Math.round((resp / inv) * 100) : 0,
      inv, acc, sent, cresp,
      convRate: sent ? Math.round((cresp / sent) * 100) : 0,
      totResp, avgRating: ratingN ? (ratingSum / ratingN) : 0,
      pub: pub.length, reach,
    };
  }, [events, campaigns, surveys, social, responses]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Users className="w-4 h-4" />} label="Adesione eventi" value={`${stats.invRate}%`} sub={`${stats.acc}/${stats.inv} conferme`} accent="#059669" />
        <Kpi icon={<Send className="w-4 h-4" />} label="Tasso risposta inviti" value={`${stats.respRate}%`} accent={ACCENT} />
        <Kpi icon={<Megaphone className="w-4 h-4" />} label="Conversione campagne" value={`${stats.convRate}%`} sub={`${stats.cresp}/${stats.sent}`} />
        <Kpi icon={<Star className="w-4 h-4" />} label="Soddisfazione media" value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/5` : '—'} sub={`${stats.totResp} risposte`} accent="#059669" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<Share2 className="w-4 h-4" />} label="Post pubblicati" value={String(stats.pub)} />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Reach totale (social)" value={stats.reach.toLocaleString('it-IT')} accent={ACCENT} />
        <Kpi icon={<ClipboardList className="w-4 h-4" />} label="Sondaggi attivi" value={String(surveys.filter((s) => s.active).length)} />
      </div>

      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-5 shadow-sm">
        <b className="text-[14px] flex items-center gap-1.5 mb-3"><BarChart3 className="w-4 h-4" style={{ color: ACCENT }} /> Performance per campagna</b>
        {campaigns.length === 0 ? <span className="text-[13px] italic text-stone-400">Nessuna campagna da analizzare.</span> : (
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => {
              const conv = c.sentCount ? Math.round(((c.responses || 0) / c.sentCount) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-[12.5px] w-40 truncate shrink-0">{c.name}</span>
                  <div className="flex-1 h-2 bg-[#eee] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, conv)}%`, background: ACCENT }} /></div>
                  <span className="text-[12px] text-stone-500 w-24 text-right shrink-0">{c.responses || 0}/{c.sentCount || 0} · {conv}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================== date helpers (Economia) ============================== */
const dOnly = (ts?: number | null) => (ts ? new Date(ts - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '');
const parseD = (s: string) => (s ? new Date(`${s}T00:00:00`).getTime() : 0);
const monthKey = (ts: number) => new Date(ts).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

/* ============================== DASHBOARD (overview globale) ============================== */
const DashboardTab: React.FC<Props & { onOpenProject: (id: string) => void; goHome: (t: HomeTab) => void }> = (props) => {
  const { contracts, invoicesActive, leads, proofs, deliverables, mktProjects, onOpenProject, goHome } = props;
  const str = (arr: { sector?: string }[]) => arr.filter((x) => x.sector === 'strategico');
  const mrr = contracts.reduce((s, k) => s + monthlyOf(k), 0);
  const ricavi = str(invoicesActive).reduce((s, i) => s + (Number((i as InvoiceActive).amount) || 0), 0);
  const activeProjects = mktProjects.filter((p) => p.status === 'attivo');
  const openLeads = leads.filter((l) => l.stage !== 'vinto' && l.stage !== 'perso').length;
  const proofOpen = proofs.filter((p) => p.status !== 'approvato').length;
  const dlOpen = deliverables.filter((d) => d.stage !== 'pubblicato' && d.stage !== 'approvato').length;
  const recent = [...mktProjects].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).slice(0, 6);
  const elementsOf = (pid: string) => deliverables.filter((d) => d.mktProjectId === pid).length + props.campaigns.filter((c) => c.mktProjectId === pid).length + props.social.filter((s) => s.mktProjectId === pid).length + props.ads.filter((a) => a.mktProjectId === pid).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<FolderOpen className="w-4 h-4" />} label="Progetti attivi" value={String(activeProjects.length)} sub={`${mktProjects.length} totali`} accent={ACCENT} />
        <Kpi icon={<RefreshCw className="w-4 h-4" />} label="Ricavo ricorrente / mese" value={eur(mrr)} sub="contratti & retainer" />
        <Kpi icon={<Receipt className="w-4 h-4" />} label="Fatturato Strategico" value={eur(ricavi)} accent="#059669" />
        <Kpi icon={<Target className="w-4 h-4" />} label="Lead aperti" value={String(openLeads)} />
      </div>

      {(proofOpen > 0 || dlOpen > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] px-4 py-3 text-[13px] text-amber-800 flex items-center gap-4 flex-wrap">
          <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Richiede attenzione:</span>
          {proofOpen > 0 && <span>{proofOpen} revisioni da approvare</span>}
          {dlOpen > 0 && <span>{dlOpen} deliverable in lavorazione</span>}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">I tuoi progetti</span>
          <button onClick={() => goHome('progetti')} className="text-[11.5px] font-bold text-[#b45309] bg-transparent border-none cursor-pointer flex items-center gap-1">Tutti i progetti <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        {recent.length === 0 ? (
          <EmptyBox icon={<FolderOpen className="w-6 h-6" />} title="Nessun progetto" text="Crea il primo progetto marketing dalla scheda 'Progetti' per iniziare a organizzare contenuti, campagne e ads per cliente." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {recent.map((p) => {
              const meta = PROJ_STATUS_META[p.status];
              return (
                <button key={p.id} onClick={() => onOpenProject(p.id)} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm cursor-pointer hover:border-[#b45309] hover:shadow-md transition-all duration-300 border-l-[5px]" style={{ borderLeftColor: p.color || ACCENT }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><b className="block text-[14px] tracking-tight truncate">{p.name}</b>{p.clientName && <span className="text-[12px] text-stone-500">{p.clientName}</span>}</div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>{meta.label}</span>
                  </div>
                  <span className="text-[11.5px] text-stone-400 mt-2 inline-block">{elementsOf(p.id)} elementi</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Andamento</span>
        <div className="mt-2"><AnalisiTab events={props.events} campaigns={props.campaigns} surveys={props.surveys} social={props.social} responses={props.responses} /></div>
      </div>
    </div>
  );
};

/* ============================== CONTRATTI & RETAINER ============================== */
const ContractsTab: React.FC<{ contracts: MktContract[]; clients: Record<string, ClientRecord>; projects: Project[]; onSave: (k: MktContract) => void; onDelete: (id: string) => void; onEmit: (id: string, periodLabel?: string) => void }> = ({ contracts, clients, projects, onSave, onDelete, onEmit }) => {
  const [editing, setEditing] = useState<MktContract | null>(null);
  const sorted = [...contracts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const attivi = sorted.filter((k) => k.status === 'attivo');
  const mrr = sorted.reduce((s, k) => s + monthlyOf(k), 0);
  const soon = sorted.filter((k) => k.endAt && k.endAt - Date.now() < 30 * 864e5 && k.endAt >= Date.now());
  const blank = (): MktContract => ({ id: uid('ctr'), title: '', clientName: '', amount: 0, cadence: 'mensile', vatPct: 22, cassaPct: null, startAt: Date.now(), endAt: null, autoRenew: true, status: 'attivo', scope: '', createdAt: Date.now(), emissions: [] });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<FileText className="w-4 h-4" />} label="Contratti" value={String(contracts.length)} sub={`${attivi.length} attivi`} accent={ACCENT} />
        <Kpi icon={<RefreshCw className="w-4 h-4" />} label="Ricorrente / mese" value={eur(mrr)} accent="#059669" />
        <Kpi icon={<Banknote className="w-4 h-4" />} label="Ricorrente / anno" value={eur(mrr * 12)} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Rinnovi ≤30gg" value={String(soon.length)} accent={soon.length ? '#b45309' : undefined} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo contratto" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<FileText className="w-6 h-6" />} title="Nessun contratto" text="Crea contratti/retainer ricorrenti: ad ogni periodo emetti una bozza fattura attiva e una scadenza che confluiscono in Finanza (società Strategico)." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((k) => {
            const period = monthKey(Date.now());
            const emittedThis = (k.emissions || []).some((e) => e.periodLabel === period);
            const renewSoon = k.endAt && k.endAt - Date.now() < 30 * 864e5;
            return (
              <div key={k.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm border-l-[5px]" style={{ borderLeftColor: ACCENT }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{CADENCE_LABEL[k.cadence]}</span>
                    <b className="block text-[16px] tracking-tight truncate">{k.title || 'Senza titolo'}</b>
                    <span className="text-[12px] text-stone-500">{k.clientName}</span>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${k.status === 'attivo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : k.status === 'sospeso' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{k.status}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <b className="text-[20px] tracking-tight" style={{ color: ACCENT }}>{eur(k.amount)}</b>
                  <span className="text-[12px] text-stone-400">/ {CADENCE_LABEL[k.cadence].toLowerCase()}{k.vatPct ? ` + IVA ${k.vatPct}%` : ''}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-stone-500 flex-wrap">
                  <span>{(k.emissions || []).length} emissioni</span>
                  {k.endAt && <span className={renewSoon ? 'text-[#b45309] font-bold flex items-center gap-1' : 'flex items-center gap-1'}>{renewSoon && <AlertTriangle className="w-3.5 h-3.5" />}rinnovo {new Date(k.endAt).toLocaleDateString('it-IT')}</span>}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button disabled={k.status !== 'attivo' || emittedThis} onClick={() => onEmit(k.id)} title="Emetti il periodo corrente in Finanza" className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-white text-[12.5px] font-bold border-none cursor-pointer disabled:opacity-40 disabled:cursor-default" style={{ background: emittedThis ? '#9ca3af' : ACCENT }}><Receipt className="w-3.5 h-3.5" /> {emittedThis ? `${period} emesso` : `Emetti ${period}`}</button>
                  <button onClick={() => setEditing(k)} className="w-9 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDelete(k.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && <ContractModal contract={editing} clients={clients} projects={projects} onClose={() => setEditing(null)} onSave={(k) => { onSave(k); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const ContractModal: React.FC<{ contract: MktContract; clients: Record<string, ClientRecord>; projects: Project[]; onClose: () => void; onSave: (k: MktContract) => void }> = ({ contract, clients, projects, onClose, onSave }) => {
  const [k, setK] = useState<MktContract>({ ...contract });
  const set = (p: Partial<MktContract>) => setK((x) => ({ ...x, ...p }));
  const clientList = Object.values(clients).filter((c) => c.category !== 'partner');

  return (
    <ModalShell title={contract.title ? 'Modifica contratto' : 'Nuovo contratto / retainer'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(k)} disabled={!k.title.trim() || !k.clientName.trim()} label="Salva contratto" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={k.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Retainer social mensile" /></Field>
        <Field label="Cliente (rubrica)" full>
          <select className={IN} value={k.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null, clientName: c ? c.name : k.clientName }); }}>
            <option value="">— seleziona / scrivi sotto —</option>
            {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Nome cliente" full><input className={IN} value={k.clientName} onChange={(e) => set({ clientName: e.target.value })} placeholder="Cliente" /></Field>
        <Field label="Importo per periodo (€)"><input type="number" className={IN} value={k.amount || ''} onChange={(e) => set({ amount: Number(e.target.value) || 0 })} /></Field>
        <Field label="Cadenza"><select className={IN} value={k.cadence} onChange={(e) => set({ cadence: e.target.value as MktContractCadence })}>{(Object.keys(CADENCE_LABEL) as MktContractCadence[]).map((c) => <option key={c} value={c}>{CADENCE_LABEL[c]}</option>)}</select></Field>
        <Field label="IVA %"><input type="number" className={IN} value={k.vatPct ?? ''} onChange={(e) => set({ vatPct: e.target.value === '' ? null : Number(e.target.value) })} placeholder="22" /></Field>
        <Field label="Cassa %"><input type="number" className={IN} value={k.cassaPct ?? ''} onChange={(e) => set({ cassaPct: e.target.value === '' ? null : Number(e.target.value) })} placeholder="0" /></Field>
        <Field label="Inizio"><input type="date" className={IN} value={dOnly(k.startAt)} onChange={(e) => set({ startAt: parseD(e.target.value) })} /></Field>
        <Field label="Scadenza / rinnovo"><input type="date" className={IN} value={dOnly(k.endAt)} onChange={(e) => set({ endAt: e.target.value ? parseD(e.target.value) : null })} /></Field>
        <Field label="Progetto collegato" full>
          <select className={IN} value={k.projectId || ''} onChange={(e) => set({ projectId: e.target.value || null })}>
            <option value="">— nessuno —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Stato"><select className={IN} value={k.status} onChange={(e) => set({ status: e.target.value as MktContract['status'] })}><option value="attivo">Attivo</option><option value="sospeso">Sospeso</option><option value="concluso">Concluso</option></select></Field>
        <Field label="Rinnovo automatico">
          <button onClick={() => set({ autoRenew: !k.autoRenew })} className={`h-10 px-3 rounded-lg border text-[12.5px] font-bold cursor-pointer ${k.autoRenew ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-stone-500 border-stone-200'}`}>{k.autoRenew ? 'Sì' : 'No'}</button>
        </Field>
        <Field label="Servizi inclusi" full><textarea className={`${IN} h-auto py-2 min-h-[60px]`} value={k.scope || ''} onChange={(e) => set({ scope: e.target.value })} placeholder="Es. 12 post/mese, 2 reel, report mensile…" /></Field>
      </div>
      {(k.emissions || []).length > 0 && (
        <div className="border-t border-[#ececec] pt-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Emissioni in Finanza</span>
          <div className="flex flex-col gap-1.5 mt-2 max-h-[140px] overflow-y-auto">
            {[...(k.emissions || [])].reverse().map((em) => (
              <div key={em.id} className="flex items-center gap-2 text-[12.5px] bg-[#fafafa] border border-[#ececec] rounded-lg px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <b className="flex-1 truncate">{em.periodLabel}</b>
                <span className="text-stone-500">{eur(em.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
};

/* ============================== TIME TRACKING ============================== */
const TimeTab: React.FC<{ entries: MktTimeEntry[]; clients: Record<string, ClientRecord>; projects: Project[]; campaigns: Campaign[]; onSave: (t: MktTimeEntry) => void; onDelete: (id: string) => void; onBill: (ids: string[]) => void }> = ({ entries, clients, projects, campaigns, onSave, onDelete, onBill }) => {
  const [editing, setEditing] = useState<MktTimeEntry | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const sorted = [...entries].sort((a, b) => (b.date || 0) - (a.date || 0));
  const thisMonth = new Date().getMonth();
  const minutesMonth = entries.filter((t) => new Date(t.date).getMonth() === thisMonth).reduce((s, t) => s + t.minutes, 0);
  const billable = sorted.filter((t) => t.billable && !t.billedInvoiceId);
  const toBillValue = billable.reduce((s, t) => s + timeValue(t), 0);
  const selIds = Object.keys(sel).filter((id) => sel[id]);
  const blank = (): MktTimeEntry => ({ id: uid('tm'), date: Date.now(), minutes: 60, activity: '', clientName: '', rate: null, billable: true, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Timer className="w-4 h-4" />} label="Ore questo mese" value={`${(minutesMonth / 60).toFixed(1)}h`} accent={ACCENT} />
        <Kpi icon={<Clock className="w-4 h-4" />} label="Voci registrate" value={String(entries.length)} />
        <Kpi icon={<Banknote className="w-4 h-4" />} label="Da fatturare" value={eur(toBillValue)} sub={`${billable.length} voci`} accent="#059669" />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Ore totali" value={`${(entries.reduce((s, t) => s + t.minutes, 0) / 60).toFixed(1)}h`} />
      </div>
      <div className="flex justify-between items-center gap-2 flex-wrap">
        {selIds.length > 0
          ? <button onClick={() => { onBill(selIds); setSel({}); }} className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-white font-bold text-[13px] border-none cursor-pointer" style={{ background: '#059669' }}><Receipt className="w-4 h-4" /> Fattura {selIds.length} voci in Finanza</button>
          : <span className="text-[12px] text-stone-400">Spunta le voci fatturabili (con tariffa €/h) per generare una bozza fattura.</span>}
        <AddBtn onClick={() => setEditing(blank())} label="Registra ore" />
      </div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<Timer className="w-6 h-6" />} title="Nessuna ora registrata" text="Traccia il tempo per cliente, progetto o campagna. Le ore fatturabili (con tariffa €/h) si trasformano in una bozza fattura attiva nella società Strategico." />
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[28px_90px_1fr_1fr_70px_90px_90px_64px] gap-2 px-4 py-2.5 bg-[#fafafa] text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400 border-b border-[#ececec]">
            <span></span><span>Data</span><span>Cliente</span><span>Attività</span><span>Ore</span><span>Tariffa</span><span>Valore</span><span></span>
          </div>
          {sorted.map((t) => {
            const canBill = t.billable && !t.billedInvoiceId && timeValue(t) > 0;
            return (
              <div key={t.id} className="grid grid-cols-[28px_90px_1fr_1fr_70px_90px_90px_64px] gap-2 items-center px-4 py-2.5 border-b border-[#f3f3f3] text-[13px] last:border-0">
                <span>{canBill && <input type="checkbox" checked={!!sel[t.id]} onChange={(e) => setSel((s) => ({ ...s, [t.id]: e.target.checked }))} />}</span>
                <span className="text-stone-500 text-[12px]">{new Date(t.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>
                <span className="truncate">{t.clientName || '—'}</span>
                <span className="truncate text-stone-600">{t.activity || '—'}{t.billedInvoiceId && <span className="text-[10px] text-emerald-600 ml-1">fatturata</span>}</span>
                <span>{(t.minutes / 60).toFixed(1)}h</span>
                <span className="text-stone-500">{t.rate ? `${eur(t.rate)}/h` : '—'}</span>
                <span className="font-bold" style={{ color: ACCENT }}>{eur(timeValue(t))}</span>
                <span className="flex items-center gap-1 justify-end">
                  <button onClick={() => setEditing(t)} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDelete(t.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && <TimeModal entry={editing} clients={clients} projects={projects} campaigns={campaigns} onClose={() => setEditing(null)} onSave={(t) => { onSave(t); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const TimeModal: React.FC<{ entry: MktTimeEntry; clients: Record<string, ClientRecord>; projects: Project[]; campaigns: Campaign[]; onClose: () => void; onSave: (t: MktTimeEntry) => void }> = ({ entry, clients, projects, campaigns, onClose, onSave }) => {
  const [t, setT] = useState<MktTimeEntry>({ ...entry });
  const set = (p: Partial<MktTimeEntry>) => setT((x) => ({ ...x, ...p }));
  const hours = (t.minutes / 60).toString();
  const clientList = Object.values(clients).filter((c) => c.category !== 'partner');

  return (
    <ModalShell title={entry.activity ? 'Modifica ore' : 'Registra ore'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(t)} disabled={t.minutes <= 0} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" className={IN} value={dOnly(t.date)} onChange={(e) => set({ date: parseD(e.target.value) || Date.now() })} /></Field>
        <Field label="Ore"><input type="number" step="0.25" className={IN} value={hours} onChange={(e) => set({ minutes: Math.round((Number(e.target.value) || 0) * 60) })} /></Field>
        <Field label="Attività" full><input className={IN} value={t.activity || ''} onChange={(e) => set({ activity: e.target.value })} placeholder="Es. Grafica post, copywriting, meeting…" /></Field>
        <Field label="Cliente (rubrica)" full>
          <select className={IN} value={t.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null, clientName: c ? c.name : t.clientName }); }}>
            <option value="">— seleziona —</option>
            {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Progetto"><select className={IN} value={t.projectId || ''} onChange={(e) => set({ projectId: e.target.value || null })}><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Campagna"><select className={IN} value={t.campaignId || ''} onChange={(e) => set({ campaignId: e.target.value || null })}><option value="">—</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Tariffa €/h"><input type="number" className={IN} value={t.rate ?? ''} onChange={(e) => set({ rate: e.target.value === '' ? null : Number(e.target.value) })} placeholder="0" /></Field>
        <Field label="Fatturabile">
          <button onClick={() => set({ billable: !t.billable })} className={`h-10 px-3 rounded-lg border text-[12.5px] font-bold cursor-pointer ${t.billable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-stone-500 border-stone-200'}`}>{t.billable ? 'Sì' : 'No'}</button>
        </Field>
        <Field label="Note" full><textarea className={`${IN} h-auto py-2 min-h-[50px]`} value={t.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== ECONOMIA ============================== */
const EconomiaTab: React.FC<Props & { go: (t: string) => void }> = (props) => {
  const { contracts, timeEntries, invoicesActive, invoicesPassive, scadenze, go } = props;
  const strA = invoicesActive.filter((i) => i.sector === 'strategico');
  const strP = invoicesPassive.filter((i) => i.sector === 'strategico');
  const strS = scadenze.filter((s) => s.sector === 'strategico');
  const ricavi = strA.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const costi = strP.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const incassato = strS.filter((s) => s.kind === 'entrata' && s.status === 'pagato').reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const daIncassare = strS.filter((s) => s.kind === 'entrata' && s.status !== 'pagato').reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const mrr = contracts.reduce((s, k) => s + monthlyOf(k), 0);
  const oreNonFatt = timeEntries.filter((t) => t.billable && !t.billedInvoiceId).reduce((s, t) => s + timeValue(t), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-amber-50 border border-amber-200 rounded-[20px] px-4 py-3 text-[12.5px] text-amber-800 flex items-start gap-2">
        <Wallet className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Tutti i dati economici di Strategico (contratti, ore fatturate, spese campagne/eventi) confluiscono nei nodi finanza con società <b>Strategico</b> e compaiono nel <b>Consolidato</b> di Finanze e in Statistiche & BEP.</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Receipt className="w-4 h-4" />} label="Ricavi (fatture)" value={eur(ricavi)} accent="#059669" />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Costi" value={eur(costi)} accent="#dc2626" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Margine" value={eur(ricavi - costi)} accent={ACCENT} />
        <Kpi icon={<RefreshCw className="w-4 h-4" />} label="Ricorrente / mese" value={eur(mrr)} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Incassato" value={eur(incassato)} accent="#059669" />
        <Kpi icon={<Banknote className="w-4 h-4" />} label="Da incassare" value={eur(daIncassare)} accent="#b45309" />
        <Kpi icon={<Timer className="w-4 h-4" />} label="Ore non fatturate" value={eur(oreNonFatt)} sub="valore potenziale" />
        <Kpi icon={<FileText className="w-4 h-4" />} label="Contratti attivi" value={String(contracts.filter((k) => k.status === 'attivo').length)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <b className="text-[14px] flex items-center gap-1.5"><Receipt className="w-4 h-4" style={{ color: ACCENT }} /> Ultime fatture attive</b>
            <button onClick={() => go('contratti')} className="text-[11.5px] font-bold text-[#b45309] bg-transparent border-none cursor-pointer flex items-center gap-1">Contratti <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
          {strA.length === 0 ? <span className="text-[13px] italic text-stone-400">Nessuna fattura Strategico.</span> : (
            <div className="flex flex-col gap-1.5">
              {[...strA].slice(-6).reverse().map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-[13px] bg-[#fafafa] border border-[#ececec] rounded-lg px-3 py-1.5">
                  <b className="flex-1 truncate">{i.clientName}</b>
                  <span className="text-[10.5px] text-stone-400">{i.date}</span>
                  <span className="font-bold" style={{ color: '#059669' }}>{eur(Number(i.amount) || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <b className="text-[14px] flex items-center gap-1.5"><Wallet className="w-4 h-4 text-red-500" /> Ultimi costi</b>
            <button onClick={() => go('campagne')} className="text-[11.5px] font-bold text-[#b45309] bg-transparent border-none cursor-pointer flex items-center gap-1">Campagne <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
          {strP.length === 0 ? <span className="text-[13px] italic text-stone-400">Nessun costo Strategico.</span> : (
            <div className="flex flex-col gap-1.5">
              {[...strP].slice(-6).reverse().map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-[13px] bg-[#fafafa] border border-[#ececec] rounded-lg px-3 py-1.5">
                  <b className="flex-1 truncate">{i.supplierName}</b>
                  <span className="text-[10.5px] text-stone-400 truncate max-w-[120px]">{i.description}</span>
                  <span className="font-bold text-red-500">{eur(Number(i.amount) || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================== ASSET LIBRARY ============================== */
const ASSET_KIND_META: Record<MktAssetKind, { label: string; icon: React.ElementType }> = {
  immagine: { label: 'Immagine', icon: ImageIcon }, video: { label: 'Video', icon: Film },
  documento: { label: 'Documento', icon: FileText }, link: { label: 'Link', icon: Link2 },
};
const AssetsTab: React.FC<{ assets: MktAsset[]; clients: Record<string, ClientRecord>; campaigns: Campaign[]; onSave: (a: MktAsset) => void; onDelete: (id: string) => void }> = ({ assets, clients, campaigns, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktAsset | null>(null);
  const [q, setQ] = useState('');
  const [tagF, setTagF] = useState('');
  const allTags = Array.from(new Set(assets.flatMap((a) => a.tags || []))).sort();
  const filtered = assets.filter((a) => (!q || a.name.toLowerCase().includes(q.toLowerCase()) || (a.tags || []).some((t) => t.toLowerCase().includes(q.toLowerCase()))) && (!tagF || (a.tags || []).includes(tagF)))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const blank = (): MktAsset => ({ id: uid('as'), name: '', kind: 'immagine', url: '', tags: [], createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<FolderOpen className="w-4 h-4" />} label="Asset" value={String(assets.length)} accent={ACCENT} />
        <Kpi icon={<ImageIcon className="w-4 h-4" />} label="Immagini" value={String(assets.filter((a) => a.kind === 'immagine').length)} />
        <Kpi icon={<Film className="w-4 h-4" />} label="Video" value={String(assets.filter((a) => a.kind === 'video').length)} />
        <Kpi icon={<Tag className="w-4 h-4" />} label="Tag" value={String(allTags.length)} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className={`${IN} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o tag…" />
        </div>
        <select className={`${IN} w-auto`} value={tagF} onChange={(e) => setTagF(e.target.value)}><option value="">Tutti i tag</option>{allTags.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <AddBtn onClick={() => setEditing(blank())} label="Nuovo asset" />
      </div>

      {filtered.length === 0 ? (
        <EmptyBox icon={<FolderOpen className="w-6 h-6" />} title="Nessun asset" text="Centralizza immagini, video, documenti e link riutilizzabili. Aggiungi tag per ritrovarli velocemente nelle campagne." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => {
            const M = ASSET_KIND_META[a.kind]; const Icon = M.icon; const href = safeUrl(a.url || '') || '#';
            return (
              <div key={a.id} className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <a href={href} target="_blank" rel="noreferrer" className="block aspect-video bg-[#f3f3f3] flex items-center justify-center overflow-hidden">
                  {a.kind === 'immagine' && a.url ? <img src={href} alt={a.name} className="w-full h-full object-cover" /> : <Icon className="w-8 h-8 text-stone-300" />}
                </a>
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <b className="text-[13px] truncate">{a.name || 'Senza nome'}</b>
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{M.label}</span>
                  {(a.tags || []).length > 0 && <div className="flex flex-wrap gap-1">{(a.tags || []).slice(0, 3).map((t) => <span key={t} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">{t}</span>)}</div>}
                  <div className="flex items-center gap-1 mt-auto pt-1.5">
                    <button onClick={() => setEditing(a)} className="flex-1 h-8 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold border-none cursor-pointer">Modifica</button>
                    <button onClick={() => onDelete(a.id)} className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>{editing && <AssetModal asset={editing} clients={clients} campaigns={campaigns} onClose={() => setEditing(null)} onSave={(a) => { onSave(a); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const AssetModal: React.FC<{ asset: MktAsset; clients: Record<string, ClientRecord>; campaigns: Campaign[]; onClose: () => void; onSave: (a: MktAsset) => void }> = ({ asset, clients, campaigns, onClose, onSave }) => {
  const [a, setA] = useState<MktAsset>({ ...a0(asset) });
  function a0(x: MktAsset): MktAsset { return { ...x, tags: x.tags || [] }; }
  const set = (p: Partial<MktAsset>) => setA((x) => ({ ...x, ...p }));
  const [tagIn, setTagIn] = useState('');
  const addTag = () => { const t = tagIn.trim(); if (t && !(a.tags || []).includes(t)) set({ tags: [...(a.tags || []), t] }); setTagIn(''); };

  return (
    <ModalShell title={asset.name ? 'Modifica asset' : 'Nuovo asset'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(a)} disabled={!a.name.trim()} label="Salva asset" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" full><input className={IN} value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder="Es. Logo bianco PNG" /></Field>
        <Field label="Tipo"><select className={IN} value={a.kind} onChange={(e) => set({ kind: e.target.value as MktAssetKind })}>{(Object.keys(ASSET_KIND_META) as MktAssetKind[]).map((k) => <option key={k} value={k}>{ASSET_KIND_META[k].label}</option>)}</select></Field>
        <Field label="Cliente"><select className={IN} value={a.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null }); void c; }}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="URL / link (Drive, Unsplash, sito…)" full><input className={IN} value={a.url || ''} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Campagna"><select className={IN} value={a.campaignId || ''} onChange={(e) => set({ campaignId: e.target.value || null })}><option value="">—</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Tag" full>
          <div className="flex items-center gap-2">
            <input className={IN} value={tagIn} onChange={(e) => setTagIn(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Aggiungi tag e Invio" />
            <button onClick={addTag} className="h-10 px-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[12.5px] cursor-pointer">+ Tag</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">{(a.tags || []).map((t) => <span key={t} className="text-[11.5px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1">{t}<button onClick={() => set({ tags: (a.tags || []).filter((x) => x !== t) })} className="text-amber-700"><X className="w-3 h-3" /></button></span>)}</div>
        </Field>
        <Field label="Note" full><textarea className={`${IN} h-auto py-2 min-h-[50px]`} value={a.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== DELIVERABLE KANBAN ============================== */
const STAGES: { id: MktDeliverableStage; label: string; cls: string }[] = [
  { id: 'da_fare', label: 'Da fare', cls: 'bg-stone-100 text-stone-600' },
  { id: 'in_lavorazione', label: 'In lavorazione', cls: 'bg-blue-50 text-blue-700' },
  { id: 'in_revisione', label: 'In revisione', cls: 'bg-amber-50 text-amber-700' },
  { id: 'approvato', label: 'Approvato', cls: 'bg-emerald-50 text-emerald-700' },
  { id: 'pubblicato', label: 'Pubblicato', cls: 'bg-violet-50 text-violet-700' },
];
const PRIO_META: Record<MktPriority, string> = { bassa: 'text-stone-400', media: 'text-amber-600', alta: 'text-red-500' };
const DeliverablesTab: React.FC<{ deliverables: MktDeliverable[]; clients: Record<string, ClientRecord>; campaigns: Campaign[]; team: Record<string, UserProfile>; onSave: (d: MktDeliverable) => void; onDelete: (id: string) => void }> = ({ deliverables, clients, campaigns, team, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktDeliverable | null>(null);
  const blank = (): MktDeliverable => ({ id: uid('dl'), title: '', stage: 'da_fare', priority: 'media', createdAt: Date.now() });
  const move = (d: MktDeliverable, dir: -1 | 1) => {
    const idx = STAGES.findIndex((s) => s.id === d.stage);
    const next = STAGES[idx + dir]; if (next) onSave({ ...d, stage: next.id });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-stone-400">Pipeline di produzione contenuti. Sposta le card tra le colonne con le frecce.</span>
        <AddBtn onClick={() => setEditing(blank())} label="Nuovo deliverable" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {STAGES.map((st) => {
          const items = deliverables.filter((d) => d.stage === st.id).sort((a, b) => (a.dueAt || Infinity) - (b.dueAt || Infinity));
          return (
            <div key={st.id} className="bg-[#f7f7f5] border border-[#e8e8e8] rounded-[20px] p-2.5 flex flex-col gap-2 min-h-[120px]">
              <div className="flex items-center justify-between px-1">
                <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                <span className="text-[11px] text-stone-400 font-bold">{items.length}</span>
              </div>
              {items.map((d) => {
                const idx = STAGES.findIndex((s) => s.id === d.stage);
                const overdue = d.dueAt && d.dueAt < Date.now() && d.stage !== 'pubblicato';
                return (
                  <div key={d.id} className="bg-white border border-[#e2e2e2] rounded-[16px] p-3 shadow-sm flex flex-col gap-1.5">
                    <div className="flex items-start gap-1.5">
                      <b className="text-[13px] leading-snug flex-1">{d.title}</b>
                      {d.priority && <span className={`text-[10px] font-bold ${PRIO_META[d.priority]}`}>●</span>}
                    </div>
                    {d.clientName && <span className="text-[11.5px] text-stone-500 truncate">{d.clientName}</span>}
                    <div className="flex items-center gap-2 text-[11px] text-stone-400">
                      {d.dueAt && <span className={overdue ? 'text-red-500 font-bold' : ''}>{new Date(d.dueAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
                      {d.assigneeName && <span className="truncate">· {d.assigneeName}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <button disabled={idx === 0} onClick={() => move(d, -1)} className="w-7 h-7 rounded-lg border border-[#e2e2e2] bg-white disabled:opacity-30 cursor-pointer flex items-center justify-center text-stone-500">‹</button>
                      <button disabled={idx === STAGES.length - 1} onClick={() => move(d, 1)} className="w-7 h-7 rounded-lg border border-[#e2e2e2] bg-white disabled:opacity-30 cursor-pointer flex items-center justify-center text-stone-500">›</button>
                      <button onClick={() => setEditing(d)} className="flex-1 h-7 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[11.5px] font-bold border-none cursor-pointer">Apri</button>
                      <button onClick={() => onDelete(d.id)} className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <AnimatePresence>{editing && <DeliverableModal deliverable={editing} clients={clients} campaigns={campaigns} team={team} onClose={() => setEditing(null)} onSave={(d) => { onSave(d); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const DeliverableModal: React.FC<{ deliverable: MktDeliverable; clients: Record<string, ClientRecord>; campaigns: Campaign[]; team: Record<string, UserProfile>; onClose: () => void; onSave: (d: MktDeliverable) => void }> = ({ deliverable, clients, campaigns, team, onClose, onSave }) => {
  const [d, setD] = useState<MktDeliverable>({ ...deliverable });
  const set = (p: Partial<MktDeliverable>) => setD((x) => ({ ...x, ...p }));
  const members = Object.values(team).filter((u) => u.active && u.role !== 'cliente' && u.role !== 'partner');

  return (
    <ModalShell title={deliverable.title ? 'Modifica deliverable' : 'Nuovo deliverable'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(d)} disabled={!d.title.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Reel lancio collezione" /></Field>
        <Field label="Cliente"><select className={IN} value={d.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null, clientName: c ? c.name : null }); }}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Campagna"><select className={IN} value={d.campaignId || ''} onChange={(e) => set({ campaignId: e.target.value || null })}><option value="">—</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Assegnatario"><select className={IN} value={d.assigneeUid || ''} onChange={(e) => { const u = team[e.target.value]; set({ assigneeUid: e.target.value || null, assigneeName: u ? u.name : null }); }}><option value="">—</option>{members.map((u) => <option key={u.uid} value={u.uid}>{u.name}</option>)}</select></Field>
        <Field label="Scadenza"><input type="date" className={IN} value={dOnly(d.dueAt)} onChange={(e) => set({ dueAt: e.target.value ? parseD(e.target.value) : null })} /></Field>
        <Field label="Stato"><select className={IN} value={d.stage} onChange={(e) => set({ stage: e.target.value as MktDeliverableStage })}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
        <Field label="Priorità"><select className={IN} value={d.priority || 'media'} onChange={(e) => set({ priority: e.target.value as MktPriority })}><option value="bassa">Bassa</option><option value="media">Media</option><option value="alta">Alta</option></select></Field>
        <Field label="Note" full><textarea className={`${IN} h-auto py-2 min-h-[60px]`} value={d.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== PROOFING / REVISIONI ============================== */
const PROOF_META: Record<ProofStatus, { label: string; cls: string }> = {
  in_revisione: { label: 'In revisione', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approvato: { label: 'Approvato', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  modifiche_richieste: { label: 'Modifiche richieste', cls: 'bg-red-50 text-red-600 border-red-200' },
};
const ProofsTab: React.FC<{ proofs: MktProof[]; clients: Record<string, ClientRecord>; onSave: (p: MktProof) => void; onDelete: (id: string) => void }> = ({ proofs, clients, onSave, onDelete }) => {
  const [viewing, setViewing] = useState<MktProof | null>(null);
  const [editing, setEditing] = useState<MktProof | null>(null);
  const sorted = [...proofs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const blank = (): MktProof => ({ id: uid('pf'), title: '', imageUrl: '', version: 1, status: 'in_revisione', annotations: [], createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Eye className="w-4 h-4" />} label="Revisioni" value={String(proofs.length)} accent={ACCENT} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="In revisione" value={String(proofs.filter((p) => p.status === 'in_revisione').length)} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Approvate" value={String(proofs.filter((p) => p.status === 'approvato').length)} accent="#059669" />
        <Kpi icon={<MessageCircle className="w-4 h-4" />} label="Annotazioni" value={String(proofs.reduce((s, p) => s + (p.annotations || []).length, 0))} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuova revisione" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<Eye className="w-6 h-6" />} title="Nessuna revisione" text="Carica un creativo (immagine via link/Drive) e raccogli feedback puntuali: clicca sull'immagine per aggiungere annotazioni contestuali e approva o richiedi modifiche." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((p) => {
            const open = (p.annotations || []).filter((a) => !a.resolved).length; const href = safeUrl(p.imageUrl || '') || '';
            return (
              <div key={p.id} className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm flex flex-col">
                <button onClick={() => setViewing(p)} className="block aspect-video bg-[#f3f3f3] flex items-center justify-center overflow-hidden border-none cursor-pointer p-0">
                  {href ? <img src={href} alt={p.title} className="w-full h-full object-cover" /> : <Eye className="w-8 h-8 text-stone-300" />}
                </button>
                <div className="p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[13.5px] truncate">{p.title || 'Senza titolo'}</b>
                    <span className="text-[10px] text-stone-400 shrink-0">v{p.version}</span>
                  </div>
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border self-start ${PROOF_META[p.status].cls}`}>{PROOF_META[p.status].label}</span>
                  <div className="flex items-center gap-2 text-[11.5px] text-stone-500">
                    <MessageCircle className="w-3.5 h-3.5" /> {(p.annotations || []).length} note{open > 0 && <span className="text-amber-600 font-bold">· {open} aperte</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => setViewing(p)} className="flex-1 h-8 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold border-none cursor-pointer flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /> Rivedi</button>
                    <button onClick={() => onDelete(p.id)} className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {editing && <ProofModal proof={editing} clients={clients} onClose={() => setEditing(null)} onSave={(p) => { onSave(p); setEditing(null); }} />}
        {viewing && <ProofViewer proof={proofs.find((x) => x.id === viewing.id) || viewing} onClose={() => setViewing(null)} onSave={onSave} />}
      </AnimatePresence>
    </div>
  );
};

const ProofModal: React.FC<{ proof: MktProof; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (p: MktProof) => void }> = ({ proof, clients, onClose, onSave }) => {
  const [p, setP] = useState<MktProof>({ ...proof });
  const set = (x: Partial<MktProof>) => setP((s) => ({ ...s, ...x }));
  return (
    <ModalShell title={proof.title ? 'Modifica revisione' : 'Nuova revisione'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(p)} disabled={!p.title.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={p.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Post lancio — v1" /></Field>
        <Field label="URL immagine (Drive/link)" full><input className={IN} value={p.imageUrl || ''} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://… (immagine)" /></Field>
        <Field label="Cliente"><select className={IN} value={p.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null, clientName: c ? c.name : null }); }}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Stato"><select className={IN} value={p.status} onChange={(e) => set({ status: e.target.value as ProofStatus })}>{(Object.keys(PROOF_META) as ProofStatus[]).map((s) => <option key={s} value={s}>{PROOF_META[s].label}</option>)}</select></Field>
      </div>
    </ModalShell>
  );
};

const ProofViewer: React.FC<{ proof: MktProof; onClose: () => void; onSave: (p: MktProof) => void }> = ({ proof, onClose, onSave }) => {
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState('');
  const href = safeUrl(proof.imageUrl || '') || '';
  const anns = proof.annotations || [];

  const onImgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPending({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    setText('');
  };
  const addAnn = () => {
    if (!pending || !text.trim()) return;
    const a: ProofAnnotation = { id: uid('an'), x: pending.x, y: pending.y, text: text.trim(), at: Date.now(), resolved: false };
    onSave({ ...proof, annotations: [...anns, a] });
    setPending(null); setText('');
  };
  const toggle = (id: string) => onSave({ ...proof, annotations: anns.map((a) => (a.id === id ? { ...a, resolved: !a.resolved } : a)) });
  const delAnn = (id: string) => onSave({ ...proof, annotations: anns.filter((a) => a.id !== id) });
  const setStatus = (s: ProofStatus) => onSave({ ...proof, status: s });
  const newVersion = () => onSave({ ...proof, version: (proof.version || 1) + 1, status: 'in_revisione', annotations: anns.filter((a) => !a.resolved) });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full h-full sm:h-[90vh] sm:max-w-[1100px] sm:rounded-[22px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#ececec]">
          <div className="flex items-center gap-2 min-w-0">
            <b className="text-[15px] truncate">{proof.title}</b>
            <span className="text-[11px] text-stone-400">v{proof.version}</span>
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${PROOF_META[proof.status].cls}`}>{PROOF_META[proof.status].label}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
        </div>
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="flex-1 bg-[#1b1b1b] flex items-center justify-center relative overflow-auto p-4">
            {href ? (
              <div className="relative inline-block max-w-full max-h-full cursor-crosshair" onClick={onImgClick}>
                <img src={href} alt={proof.title} className="max-w-full max-h-[70vh] object-contain block" />
                {anns.map((a, i) => (
                  <span key={a.id} title={a.text} className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white text-[11px] font-bold text-white flex items-center justify-center ${a.resolved ? 'bg-emerald-500' : 'bg-[#b45309]'}`} style={{ left: `${a.x}%`, top: `${a.y}%` }}>{i + 1}</span>
                ))}
                {pending && <span className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white bg-blue-500 animate-pulse" style={{ left: `${pending.x}%`, top: `${pending.y}%` }} />}
              </div>
            ) : <span className="text-stone-400 text-[13px]">Nessuna immagine. Aggiungi un URL immagine nella revisione.</span>}
          </div>
          <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-[#ececec] flex flex-col">
            <div className="px-4 py-3 border-b border-[#ececec]">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Annotazioni ({anns.length})</span>
              {pending ? (
                <div className="mt-2 flex flex-col gap-2">
                  <textarea autoFocus className={`${IN} h-auto py-2 min-h-[60px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrivi il commento per questo punto…" />
                  <div className="flex gap-2"><button onClick={() => setPending(null)} className="flex-1 h-9 rounded-lg bg-stone-100 font-bold text-[12.5px] border-none cursor-pointer">Annulla</button><button onClick={addAnn} disabled={!text.trim()} className="flex-1 h-9 rounded-lg text-white font-bold text-[12.5px] border-none cursor-pointer disabled:opacity-50" style={{ background: ACCENT }}>Aggiungi</button></div>
                </div>
              ) : href && <span className="block text-[11.5px] text-stone-400 mt-1.5">Clicca sull'immagine per aggiungere un'annotazione.</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {anns.map((a, i) => (
                <div key={a.id} className={`border rounded-xl p-2.5 ${a.resolved ? 'bg-emerald-50/50 border-emerald-100' : 'bg-[#fafafa] border-[#ececec]'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0 ${a.resolved ? 'bg-emerald-500' : 'bg-[#b45309]'}`}>{i + 1}</span>
                    <span className="text-[12.5px] flex-1">{a.text}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 justify-end">
                    <button onClick={() => toggle(a.id)} className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${a.resolved ? 'bg-white border-stone-200 text-stone-500' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{a.resolved ? 'Riapri' : 'Risolvi'}</button>
                    <button onClick={() => delAnn(a.id)} className="w-6 h-6 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {anns.length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessuna annotazione.</span>}
            </div>
            <div className="p-3 border-t border-[#ececec] flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => setStatus('approvato')} className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12.5px] border-none cursor-pointer flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Approva</button>
                <button onClick={() => setStatus('modifiche_richieste')} className="flex-1 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[12.5px] cursor-pointer">Richiedi modifiche</button>
              </div>
              <button onClick={newVersion} className="h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white font-bold text-[12.5px] border-none cursor-pointer flex items-center justify-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Nuova versione</button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ============================== AI ASSIST (Blocco C) ============================== */
// Pulsante riusabile: chiama la Cloud Function `aiGenerate` (Anthropic). Predisposto:
// se l'AI non è ancora configurata (no deploy / no ANTHROPIC_KEY) mostra un avviso.
const AiAssist: React.FC<{ build: () => string; system?: string; onResult: (text: string) => void; label?: string; maxTokens?: number }> = ({ build, system, onResult, label, maxTokens }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    setErr(''); setLoading(true);
    try {
      const text = await callAi({ prompt: build(), system, maxTokens });
      if (text) onResult(text); else setErr('Nessun testo generato.');
    } catch (e: any) {
      const code = e?.code || '';
      setErr(code.includes('failed-precondition') ? 'AI non ancora configurata (manca ANTHROPIC_KEY nelle Cloud Functions).'
        : code.includes('unauthenticated') || code.includes('permission') ? 'Permesso negato.'
        : 'AI non raggiungibile: deploya le Cloud Functions e imposta ANTHROPIC_KEY (vedi functions/README).');
    } finally { setLoading(false); }
  };
  return (
    <div className="flex flex-col gap-1 mt-1.5">
      <button type="button" onClick={run} disabled={loading}
        className="self-start flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer disabled:opacity-50"
        style={{ background: '#fff7ed', color: ACCENT, borderColor: '#fed7aa' }}>
        <Sparkles className="w-3.5 h-3.5" /> {loading ? 'Genero…' : (label || 'Genera con AI')}
      </button>
      {err && <span className="text-[11px] text-red-500">{err}</span>}
    </div>
  );
};

/* ============================== REPORT (white-label + AI) ============================== */
const ReportTab: React.FC<Props & { reportTitle?: string }> = (props) => {
  const { events, campaigns, surveys, social, responses, contracts, timeEntries, invoicesActive, invoicesPassive, scadenze, reportTitle } = props;
  const [summary, setSummary] = useState('');
  const period = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  // KPI aggregati
  const invitati = events.reduce((s, e) => s + Object.keys(e.invitees || {}).length, 0);
  const accettati = events.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status === 'accettato').length, 0);
  const adesione = invitati ? Math.round((accettati / invitati) * 100) : 0;
  const totResp = Object.values(responses).reduce((s, r) => s + Object.keys(r || {}).length, 0);
  const reach = social.reduce((s, p) => s + (Number(p.reach) || 0), 0);
  const strA = invoicesActive.filter((i) => i.sector === 'strategico');
  const strP = invoicesPassive.filter((i) => i.sector === 'strategico');
  const ricavi = strA.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const costi = strP.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const mrr = contracts.reduce((s, k) => s + monthlyOf(k), 0);
  const ore = timeEntries.reduce((s, t) => s + t.minutes, 0) / 60;
  // soddisfazione media (domande rating)
  let ratingSum = 0, ratingN = 0;
  surveys.forEach((sv) => Object.values(responses[sv.id] || {}).forEach((r) => sv.questions.filter((q) => q.type === 'rating').forEach((q) => { const v = Number(r.answers?.[q.id]); if (!isNaN(v)) { ratingSum += v; ratingN++; } })));
  const satisf = ratingN ? (ratingSum / ratingN).toFixed(1) : '—';

  const ROWS: { label: string; value: string }[] = [
    { label: 'Eventi', value: `${events.length} (${adesione}% adesione)` },
    { label: 'Campagne', value: `${campaigns.length}` },
    { label: 'Post social', value: `${social.length} (reach ${reach.toLocaleString('it-IT')})` },
    { label: 'Risposte sondaggi', value: `${totResp} (soddisfazione ${satisf}/5)` },
    { label: 'Ricavo ricorrente / mese', value: eur(mrr) },
    { label: 'Ricavi Strategico', value: eur(ricavi) },
    { label: 'Costi Strategico', value: eur(costi) },
    { label: 'Margine', value: eur(ricavi - costi) },
    { label: 'Ore tracciate', value: `${ore.toFixed(1)}h` },
  ];

  const buildPrompt = () => `Scrivi una sintesi direzionale (executive summary) per un report marketing mensile (${period}) del gruppo Onirico. Dati: ${ROWS.map((r) => `${r.label}: ${r.value}`).join('; ')}. 3-4 frasi, evidenzia risultati e una raccomandazione operativa.`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <span className="text-[12.5px] text-stone-400">Report sintetico condivisibile. Usa "Stampa / PDF" per esportarlo brandizzato.</span>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] border-none cursor-pointer"><Printer className="w-4 h-4" /> Stampa / PDF</button>
      </div>

      <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-6 shadow-sm print-area">
        <div className="flex items-center justify-between border-b border-[#ececec] pb-4 mb-4">
          <div>
            <b className="text-[20px] tracking-tight">Report marketing{reportTitle ? ` — ${reportTitle}` : ''}</b>
            <p className="text-[12.5px] text-stone-400 capitalize">{period} · Onirico Strategico</p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: ACCENT }}><Megaphone className="w-5 h-5" /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ROWS.map((r) => (
            <div key={r.label} className="border border-[#eee] rounded-[16px] p-3 shadow-sm">
              <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{r.label}</span>
              <b className="block text-[18px] tracking-tight mt-1" style={{ color: ACCENT }}>{r.value}</b>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#ececec] pt-4">
          <div className="flex items-center justify-between no-print">
            <b className="text-[14px] flex items-center gap-1.5"><Sparkles className="w-4 h-4" style={{ color: ACCENT }} /> Sintesi direzionale</b>
          </div>
          {summary
            ? <p className="text-[13.5px] leading-relaxed text-stone-700 mt-2 whitespace-pre-wrap">{summary}</p>
            : <p className="text-[12.5px] italic text-stone-400 mt-2 no-print">Genera una sintesi automatica dei dati con l'AI.</p>}
          <div className="no-print"><AiAssist label="Genera sintesi con AI" maxTokens={400} build={buildPrompt} onResult={setSummary} /></div>
        </div>
      </div>
    </div>
  );
};

/* ============================== ATTIVITÀ (registro derivato) ============================== */
const ActivityTab: React.FC<Props> = (props) => {
  type Row = { id: string; at: number; label: string; cat: string };
  const rows: Row[] = [];
  const push = (cat: string, arr: { id: string; updatedAt?: number; createdAt: number }[], lbl: (x: any) => string) =>
    arr.forEach((x) => rows.push({ id: `${cat}-${x.id}`, at: x.updatedAt || x.createdAt || 0, label: lbl(x), cat }));
  push('Evento', props.events, (e) => e.title || 'Evento');
  push('Campagna', props.campaigns, (c) => c.name || 'Campagna');
  push('Sondaggio', props.surveys, (s) => s.title || 'Sondaggio');
  push('Social', props.social, (p) => (p.caption || 'Post').slice(0, 40));
  push('Contratto', props.contracts, (k) => `${k.title} · ${k.clientName}`);
  push('Ore', props.timeEntries, (t) => `${(t.minutes / 60).toFixed(1)}h · ${t.clientName || t.activity || ''}`);
  push('Asset', props.assets, (a) => a.name || 'Asset');
  push('Deliverable', props.deliverables, (d) => d.title || 'Deliverable');
  push('Revisione', props.proofs, (p) => `${p.title} · v${p.version}`);
  push('Lead', props.leads, (l) => l.name || 'Lead');
  push('Automation', props.flows, (f) => f.name || 'Flusso');
  push('SEO', props.seo, (s) => s.keyword || s.title || 'SEO');
  push('Ads', props.ads, (a) => `${a.name} (${a.platform})`);
  push('Metrica', props.metrics, (m) => `${m.metric} · ${m.source}`);
  push('Inbox', props.inbox, (i) => `${i.from} · ${i.channel}`);
  push('Consenso', props.consents, (c) => c.subject || 'Consenso');
  const sorted = rows.filter((r) => r.at > 0).sort((a, b) => b.at - a.at).slice(0, 60);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Activity className="w-4 h-4" />} label="Voci totali" value={String(rows.length)} accent={ACCENT} />
        <Kpi icon={<Clock className="w-4 h-4" />} label="Aggiornate oggi" value={String(rows.filter((r) => r.at > Date.now() - 864e5).length)} />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Ultimi 7 giorni" value={String(rows.filter((r) => r.at > Date.now() - 7 * 864e5).length)} />
        <Kpi icon={<FileBarChart className="w-4 h-4" />} label="Aree" value={String(new Set(rows.map((r) => r.cat)).size)} />
      </div>
      {sorted.length === 0 ? (
        <EmptyBox icon={<Activity className="w-6 h-6" />} title="Nessuna attività" text="Il registro mostra le modifiche più recenti su tutte le aree di Strategico." />
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          {sorted.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f3f3f3] last:border-0 text-[13px]">
              <span className="text-[10.5px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0 w-[92px] text-center">{r.cat}</span>
              <span className="flex-1 truncate">{r.label}</span>
              <span className="text-[11.5px] text-stone-400 shrink-0">{new Date(r.at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================== LEAD & SCORING ============================== */
const LEAD_STAGES: { id: MktLeadStage; label: string; cls: string }[] = [
  { id: 'nuovo', label: 'Nuovo', cls: 'bg-stone-100 text-stone-600' },
  { id: 'contattato', label: 'Contattato', cls: 'bg-blue-50 text-blue-700' },
  { id: 'qualificato', label: 'Qualificato', cls: 'bg-amber-50 text-amber-700' },
  { id: 'proposta', label: 'Proposta', cls: 'bg-violet-50 text-violet-700' },
  { id: 'vinto', label: 'Vinto', cls: 'bg-emerald-50 text-emerald-700' },
  { id: 'perso', label: 'Perso', cls: 'bg-red-50 text-red-600' },
];
const STAGE_PTS: Record<MktLeadStage, number> = { nuovo: 5, contattato: 15, qualificato: 25, proposta: 35, vinto: 40, perso: 0 };
const suggestScore = (l: MktLead) => Math.min(100, (l.email ? 20 : 0) + (l.phone ? 15 : 0) + (l.company ? 10 : 0) + ((Number(l.value) || 0) > 0 ? 20 : 0) + (STAGE_PTS[l.stage] || 0));
const LeadsTab: React.FC<{ leads: MktLead[]; clients: Record<string, ClientRecord>; team: Record<string, UserProfile>; onSave: (l: MktLead) => void; onDelete: (id: string) => void }> = ({ leads, clients, team, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktLead | null>(null);
  const [stageF, setStageF] = useState<MktLeadStage | ''>('');
  const list = leads.filter((l) => !stageF || l.stage === stageF).sort((a, b) => (b.score || 0) - (a.score || 0));
  const open = leads.filter((l) => l.stage !== 'vinto' && l.stage !== 'perso');
  const pipeline = open.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const won = leads.filter((l) => l.stage === 'vinto').length;
  const blank = (): MktLead => ({ id: uid('ld'), name: '', stage: 'nuovo', score: null, tags: [], createdAt: Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Target className="w-4 h-4" />} label="Lead" value={String(leads.length)} sub={`${open.length} aperti`} accent={ACCENT} />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Valore pipeline" value={eur(pipeline)} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Vinti" value={String(won)} accent="#059669" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Conversione" value={`${leads.length ? Math.round((won / leads.length) * 100) : 0}%`} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select className={`${IN} w-auto`} value={stageF} onChange={(e) => setStageF(e.target.value as any)}><option value="">Tutte le fasi</option>{LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <div className="flex-1" />
        <AddBtn onClick={() => setEditing(blank())} label="Nuovo lead" />
      </div>
      {list.length === 0 ? (
        <EmptyBox icon={<Target className="w-6 h-6" />} title="Nessun lead" text="Traccia i potenziali clienti, assegna un punteggio (calcolato dai dati o manuale) e fai avanzare la pipeline fino alla conversione." />
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          {list.map((l) => {
            const sc = l.score ?? suggestScore(l); const meta = LEAD_STAGES.find((s) => s.id === l.stage)!;
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#f3f3f3] last:border-0">
                <div className="min-w-0 flex-1">
                  <b className="text-[13.5px] truncate block">{l.name}{l.company && <span className="text-stone-400 font-normal"> · {l.company}</span>}</b>
                  <span className="text-[11.5px] text-stone-400">{l.source || '—'}{l.value ? ` · ${eur(l.value)}` : ''}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 w-28">
                  <div className="flex-1 h-1.5 bg-[#eee] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${sc}%`, background: sc >= 60 ? '#059669' : sc >= 30 ? ACCENT : '#dc2626' }} /></div>
                  <span className="text-[11px] font-bold w-7 text-right">{sc}</span>
                </div>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${meta.cls} shrink-0`}>{meta.label}</span>
                <button onClick={() => setEditing(l)} className="w-8 h-8 rounded-lg bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(l.id)} className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>{editing && <LeadModal lead={editing} clients={clients} team={team} onClose={() => setEditing(null)} onSave={(l) => { onSave(l); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const LeadModal: React.FC<{ lead: MktLead; clients: Record<string, ClientRecord>; team: Record<string, UserProfile>; onClose: () => void; onSave: (l: MktLead) => void }> = ({ lead, clients, team, onClose, onSave }) => {
  const [l, setL] = useState<MktLead>({ ...lead });
  const set = (p: Partial<MktLead>) => setL((x) => ({ ...x, ...p }));
  const members = Object.values(team).filter((u) => u.active && u.role !== 'cliente' && u.role !== 'partner');
  void clients;
  return (
    <ModalShell title={lead.name ? 'Modifica lead' : 'Nuovo lead'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(l)} disabled={!l.name.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" full><input className={IN} value={l.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Azienda"><input className={IN} value={l.company || ''} onChange={(e) => set({ company: e.target.value })} /></Field>
        <Field label="Origine"><input className={IN} value={l.source || ''} onChange={(e) => set({ source: e.target.value })} placeholder="Sito, referral, evento, ads…" /></Field>
        <Field label="Email"><input className={IN} value={l.email || ''} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Telefono"><input className={IN} value={l.phone || ''} onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="Fase"><select className={IN} value={l.stage} onChange={(e) => set({ stage: e.target.value as MktLeadStage })}>{LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
        <Field label="Valore potenziale (€)"><input type="number" className={IN} value={l.value ?? ''} onChange={(e) => set({ value: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label={`Punteggio (suggerito ${suggestScore(l)})`}><input type="number" className={IN} value={l.score ?? ''} onChange={(e) => set({ score: e.target.value === '' ? null : Number(e.target.value) })} placeholder={String(suggestScore(l))} /></Field>
        <Field label="Referente"><select className={IN} value={l.ownerUid || ''} onChange={(e) => { const u = team[e.target.value]; set({ ownerUid: e.target.value || null, ownerName: u ? u.name : null }); }}><option value="">—</option>{members.map((u) => <option key={u.uid} value={u.uid}>{u.name}</option>)}</select></Field>
        <Field label="Note" full><textarea className={`${IN} h-auto py-2 min-h-[50px]`} value={l.note || ''} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== AUTOMATION (nurturing) ============================== */
const FLOW_CH: { id: MktFlowChannel; label: string }[] = [{ id: 'email', label: 'Email' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'sms', label: 'SMS' }];
const AutomationTab: React.FC<{ flows: MktFlow[]; clients: Record<string, ClientRecord>; onSave: (f: MktFlow) => void; onDelete: (id: string) => void }> = ({ flows, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktFlow | null>(null);
  const sorted = [...flows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const blank = (): MktFlow => ({ id: uid('fl'), name: '', trigger: '', steps: [], active: true, createdAt: Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<Workflow className="w-4 h-4" />} label="Flussi" value={String(flows.length)} sub={`${flows.filter((f) => f.active).length} attivi`} accent={ACCENT} />
        <Kpi icon={<ListChecks className="w-4 h-4" />} label="Step totali" value={String(flows.reduce((s, f) => s + (f.steps || []).length, 0))} />
        <Kpi icon={<Send className="w-4 h-4" />} label="Canali" value={String(new Set(flows.flatMap((f) => (f.steps || []).map((s) => s.channel))).size)} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo flusso" /></div>
      {sorted.length === 0 ? (
        <EmptyBox icon={<Workflow className="w-6 h-6" />} title="Nessun flusso" text="Costruisci sequenze di nurturing multi-step (email/WhatsApp/SMS) da un trigger. I messaggi pronti diventano testo per gli invii (link), senza invio automatico." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((f) => (
            <div key={f.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm border-l-[5px]" style={{ borderLeftColor: ACCENT }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><b className="block text-[16px] tracking-tight truncate">{f.name || 'Senza nome'}</b>{f.trigger && <span className="text-[12px] text-stone-500">trigger: {f.trigger}</span>}</div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${f.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{f.active ? 'Attivo' : 'Off'}</span>
              </div>
              <div className="flex flex-col gap-1.5 mt-3">
                {(f.steps || []).map((s) => (<div key={s.id} className="flex items-center gap-2 text-[12px] text-stone-600"><span className="w-10 shrink-0 text-stone-400">+{s.offsetDays}gg</span><span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">{s.channel}</span><span className="truncate">{s.message || s.subject || '—'}</span></div>))}
                {(f.steps || []).length === 0 && <span className="text-[12px] italic text-stone-400">Nessuno step.</span>}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                <button onClick={() => setEditing(f)} className="flex-1 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer">Gestisci</button>
                <button onClick={() => onDelete(f.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>{editing && <FlowModal flow={editing} onClose={() => setEditing(null)} onSave={(f) => { onSave(f); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const FlowModal: React.FC<{ flow: MktFlow; onClose: () => void; onSave: (f: MktFlow) => void }> = ({ flow, onClose, onSave }) => {
  const [f, setF] = useState<MktFlow>({ ...flow, steps: flow.steps || [] });
  const set = (p: Partial<MktFlow>) => setF((x) => ({ ...x, ...p }));
  const addStep = () => set({ steps: [...(f.steps || []), { id: uid('fs'), offsetDays: 1, channel: 'email', message: '' }] });
  const setStep = (id: string, p: Partial<MktFlowStep>) => set({ steps: (f.steps || []).map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const delStep = (id: string) => set({ steps: (f.steps || []).filter((s) => s.id !== id) });
  return (
    <ModalShell title={flow.name ? 'Modifica flusso' : 'Nuovo flusso'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(f)} disabled={!f.name.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" full><input className={IN} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Es. Benvenuto nuovo cliente" /></Field>
        <Field label="Trigger" full><input className={IN} value={f.trigger || ''} onChange={(e) => set({ trigger: e.target.value })} placeholder="Es. Iscrizione newsletter, fine evento…" /></Field>
        <Field label="Attivo"><button onClick={() => set({ active: !f.active })} className={`h-10 px-3 rounded-lg border text-[12.5px] font-bold cursor-pointer ${f.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-stone-500 border-stone-200'}`}>{f.active ? 'Sì' : 'No'}</button></Field>
      </div>
      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Step</span><button onClick={addStep} className="text-[12px] font-bold text-[#b45309] flex items-center gap-1 bg-transparent border-none cursor-pointer"><Plus className="w-3.5 h-3.5" /> Aggiungi</button></div>
        <div className="flex flex-col gap-2 mt-3">
          {(f.steps || []).map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
              <span className="text-[11px] text-stone-500">+</span>
              <input type="number" className="w-14 h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md" value={s.offsetDays} onChange={(e) => setStep(s.id, { offsetDays: Number(e.target.value) })} />
              <span className="text-[11px] text-stone-500">gg</span>
              <select className="h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md bg-white" value={s.channel} onChange={(e) => setStep(s.id, { channel: e.target.value as MktFlowChannel })}>{FLOW_CH.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              <input className="flex-1 h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md" value={s.message} onChange={(e) => setStep(s.id, { message: e.target.value })} placeholder="Messaggio" />
              <button onClick={() => delStep(s.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {(f.steps || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessuno step.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

/* ============================== SEO & CONTENT ============================== */
const SeoTab: React.FC<{ items: MktSeoItem[]; clients: Record<string, ClientRecord>; onSave: (s: MktSeoItem) => void; onDelete: (id: string) => void }> = ({ items, clients, onSave, onDelete }) => {
  const [view, setView] = useState<'keyword' | 'brief'>('keyword');
  const [editing, setEditing] = useState<MktSeoItem | null>(null);
  const kws = items.filter((i) => i.kind === 'keyword');
  const briefs = items.filter((i) => i.kind === 'brief');
  const list = (view === 'keyword' ? kws : briefs).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const posCount = kws.filter((k) => k.position).length;
  const avgPos = posCount ? (kws.reduce((s, k) => s + (Number(k.position) || 0), 0) / posCount) : 0;
  const blank = (): MktSeoItem => view === 'keyword'
    ? { id: uid('seo'), kind: 'keyword', keyword: '', createdAt: Date.now() }
    : { id: uid('seo'), kind: 'brief', title: '', status: 'idea', createdAt: Date.now() };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Search className="w-4 h-4" />} label="Keyword" value={String(kws.length)} accent={ACCENT} />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Posizione media" value={avgPos ? avgPos.toFixed(1) : '—'} />
        <Kpi icon={<FileText className="w-4 h-4" />} label="Content brief" value={String(briefs.length)} />
        <Kpi icon={<Globe className="w-4 h-4" />} label="Pubblicati" value={String(briefs.filter((b) => b.status === 'pubblicato').length)} accent="#059669" />
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {(['keyword', 'brief'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`text-[12px] font-extrabold px-4 py-1.5 rounded-full border-none cursor-pointer ${view === v ? 'bg-white text-[#161616] shadow-xs' : 'bg-transparent text-[#8a8a8a]'}`}>{v === 'keyword' ? 'Keyword' : 'Content brief'}</button>
          ))}
        </div>
        <AddBtn onClick={() => setEditing(blank())} label={view === 'keyword' ? 'Nuova keyword' : 'Nuovo brief'} />
      </div>
      {list.length === 0 ? (
        <EmptyBox icon={<Search className="w-6 h-6" />} title="Nessuna voce" text="Inserisci keyword (volume, difficoltà, posizione) e content brief. Dati manuali pronti per le API SEO; usa l'AI per generare gli outline." />
      ) : view === 'keyword' ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_64px] gap-2 px-4 py-2.5 bg-[#fafafa] text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400 border-b border-[#ececec]"><span>Keyword</span><span>Volume</span><span>Diff.</span><span>Pos.</span><span></span></div>
          {list.map((k) => (
            <div key={k.id} className="grid grid-cols-[1fr_80px_80px_80px_64px] gap-2 items-center px-4 py-2.5 border-b border-[#f3f3f3] last:border-0 text-[13px]">
              <span className="truncate"><b>{k.keyword}</b>{k.url && <a href={safeUrl(k.url) || '#'} target="_blank" rel="noreferrer" className="text-[11px] text-[#b45309] ml-1.5">↗</a>}</span>
              <span className="text-stone-500">{k.volume ?? '—'}</span>
              <span className="text-stone-500">{k.difficulty ?? '—'}</span>
              <span className="font-bold" style={{ color: ACCENT }}>{k.position ?? '—'}</span>
              <span className="flex items-center gap-1 justify-end"><button onClick={() => setEditing(k)} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete(k.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((b) => (
            <div key={b.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2"><b className="text-[15px] truncate">{b.title}</b><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${b.status === 'pubblicato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : b.status === 'in_lavorazione' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{b.status}</span></div>
              {b.outline && <p className="text-[12.5px] text-stone-600 mt-2 whitespace-pre-wrap line-clamp-4">{b.outline}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0f0f0]"><button onClick={() => setEditing(b)} className="flex-1 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer">Apri</button><button onClick={() => onDelete(b.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>{editing && <SeoModal item={editing} clients={clients} onClose={() => setEditing(null)} onSave={(s) => { onSave(s); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const SeoModal: React.FC<{ item: MktSeoItem; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (s: MktSeoItem) => void }> = ({ item, clients, onClose, onSave }) => {
  const [s, setS] = useState<MktSeoItem>({ ...item });
  const set = (p: Partial<MktSeoItem>) => setS((x) => ({ ...x, ...p }));
  return (
    <ModalShell title={item.kind === 'keyword' ? 'Keyword' : 'Content brief'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(s)} disabled={item.kind === 'keyword' ? !(s.keyword || '').trim() : !(s.title || '').trim()} label="Salva" /></>}>
      {item.kind === 'keyword' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Keyword" full><input className={IN} value={s.keyword || ''} onChange={(e) => set({ keyword: e.target.value })} /></Field>
          <Field label="Volume"><input type="number" className={IN} value={s.volume ?? ''} onChange={(e) => set({ volume: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Difficoltà (0-100)"><input type="number" className={IN} value={s.difficulty ?? ''} onChange={(e) => set({ difficulty: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Posizione attuale"><input type="number" className={IN} value={s.position ?? ''} onChange={(e) => set({ position: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Intento"><input className={IN} value={s.intent || ''} onChange={(e) => set({ intent: e.target.value })} placeholder="informazionale, transazionale…" /></Field>
          <Field label="URL target" full><input className={IN} value={s.url || ''} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" /></Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Titolo" full><input className={IN} value={s.title || ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Stato"><select className={IN} value={s.status || 'idea'} onChange={(e) => set({ status: e.target.value as any })}><option value="idea">Idea</option><option value="in_lavorazione">In lavorazione</option><option value="pubblicato">Pubblicato</option></select></Field>
          <Field label="Cliente"><select className={IN} value={s.clientId || ''} onChange={(e) => set({ clientId: e.target.value || null })}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Outline" full><textarea className={`${IN} h-auto py-2 min-h-[90px]`} value={s.outline || ''} onChange={(e) => set({ outline: e.target.value })} placeholder="Struttura dell'articolo…" /></Field>
          <div className="col-span-2"><AiAssist label="Genera outline con AI" maxTokens={500} build={() => `Genera l'outline (titoli H2/H3 + una riga per sezione) di un articolo blog SEO dal titolo "${s.title}". Tema: studio di architettura/ingegneria. Restituisci solo l'outline.`} onResult={(t) => set({ outline: t })} /></div>
        </div>
      )}
    </ModalShell>
  );
};

/* ============================== ADVERTISING / PPC ============================== */
const AD_PLAT: Record<MktAdPlatform, string> = { google: 'Google Ads', meta: 'Meta Ads', tiktok: 'TikTok Ads', linkedin: 'LinkedIn Ads' };
const AdsTab: React.FC<{ ads: MktAdCampaign[]; clients: Record<string, ClientRecord>; onSave: (a: MktAdCampaign) => void; onDelete: (id: string) => void; onRegisterSpend: (id: string) => void }> = ({ ads, clients, onSave, onDelete, onRegisterSpend }) => {
  const [editing, setEditing] = useState<MktAdCampaign | null>(null);
  const sorted = [...ads].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const spend = sorted.reduce((s, a) => s + (Number(a.spend) || 0), 0);
  const conv = sorted.reduce((s, a) => s + (Number(a.conversions) || 0), 0);
  const blank = (): MktAdCampaign => ({ id: uid('ad'), name: '', platform: 'google', status: 'attiva', budget: null, spend: null, createdAt: Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<MousePointerClick className="w-4 h-4" />} label="Campagne ads" value={String(ads.length)} accent={ACCENT} />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Spesa totale" value={eur(spend)} accent="#dc2626" />
        <Kpi icon={<Target className="w-4 h-4" />} label="Conversioni" value={String(conv)} accent="#059669" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Costo/conv." value={conv ? eur(spend / conv) : '—'} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuova campagna ads" /></div>
      {sorted.length === 0 ? (
        <EmptyBox icon={<MousePointerClick className="w-6 h-6" />} title="Nessuna campagna ads" text="Gestisci le campagne paid (Google/Meta/TikTok/LinkedIn) con budget e metriche manuali (predisposte per le API). La spesa si registra in Finanza come costo Strategico." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((a) => {
            const ctr = a.impressions ? ((Number(a.clicks) || 0) / a.impressions) * 100 : 0;
            return (
              <div key={a.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{AD_PLAT[a.platform]}</span><b className="block text-[16px] tracking-tight truncate">{a.name || 'Senza nome'}</b>{a.clientName && <span className="text-[12px] text-stone-500">{a.clientName}</span>}</div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${a.status === 'attiva' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : a.status === 'in_pausa' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{a.status.replace('_', ' ')}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div><span className="block text-[10px] uppercase text-stone-400 font-bold">Spesa</span><b className="text-[13px]">{eur(Number(a.spend) || 0)}</b></div>
                  <div><span className="block text-[10px] uppercase text-stone-400 font-bold">Impr.</span><b className="text-[13px]">{a.impressions ?? '—'}</b></div>
                  <div><span className="block text-[10px] uppercase text-stone-400 font-bold">CTR</span><b className="text-[13px]">{ctr ? ctr.toFixed(1) + '%' : '—'}</b></div>
                  <div><span className="block text-[10px] uppercase text-stone-400 font-bold">Conv.</span><b className="text-[13px]">{a.conversions ?? '—'}</b></div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => setEditing(a)} className="flex-1 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer">Gestisci</button>
                  {Number(a.spend || a.budget) > 0 && <button onClick={() => onRegisterSpend(a.id)} title="Registra spesa in Finanza" className="w-9 h-9 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-700 cursor-pointer"><Banknote className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => onDelete(a.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {(a.financeRefs || []).length > 0 && <span className="text-[10.5px] text-emerald-600 mt-1.5 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> spesa registrata in Finanza</span>}
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>{editing && <AdModal ad={editing} clients={clients} onClose={() => setEditing(null)} onSave={(a) => { onSave(a); setEditing(null); }} />}</AnimatePresence>
    </div>
  );
};

const AdModal: React.FC<{ ad: MktAdCampaign; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (a: MktAdCampaign) => void }> = ({ ad, clients, onClose, onSave }) => {
  const [a, setA] = useState<MktAdCampaign>({ ...ad });
  const set = (p: Partial<MktAdCampaign>) => setA((x) => ({ ...x, ...p }));
  return (
    <ModalShell title={ad.name ? 'Modifica campagna ads' : 'Nuova campagna ads'} onClose={onClose}
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(a)} disabled={!a.name.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" full><input className={IN} value={a.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Piattaforma"><select className={IN} value={a.platform} onChange={(e) => set({ platform: e.target.value as MktAdPlatform })}>{(Object.keys(AD_PLAT) as MktAdPlatform[]).map((p) => <option key={p} value={p}>{AD_PLAT[p]}</option>)}</select></Field>
        <Field label="Cliente"><select className={IN} value={a.clientId || ''} onChange={(e) => { const c = clients[e.target.value]; set({ clientId: e.target.value || null, clientName: c ? c.name : null }); }}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Budget (€)"><input type="number" className={IN} value={a.budget ?? ''} onChange={(e) => set({ budget: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Spesa (€)"><input type="number" className={IN} value={a.spend ?? ''} onChange={(e) => set({ spend: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Impression"><input type="number" className={IN} value={a.impressions ?? ''} onChange={(e) => set({ impressions: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Click"><input type="number" className={IN} value={a.clicks ?? ''} onChange={(e) => set({ clicks: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Conversioni"><input type="number" className={IN} value={a.conversions ?? ''} onChange={(e) => set({ conversions: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Stato"><select className={IN} value={a.status} onChange={(e) => set({ status: e.target.value as any })}><option value="attiva">Attiva</option><option value="in_pausa">In pausa</option><option value="conclusa">Conclusa</option></select></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== ANALYTICS (metriche manuali) ============================== */
const METRIC_SRC: Record<MktMetricSource, string> = { ga4: 'GA4', google_ads: 'Google Ads', meta: 'Meta', linkedin: 'LinkedIn', tiktok: 'TikTok', altro: 'Altro' };
const MetricsTab: React.FC<{ metrics: MktMetric[]; clients: Record<string, ClientRecord>; onSave: (m: MktMetric) => void; onDelete: (id: string) => void }> = ({ metrics, clients, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktMetric | null>(null);
  const sorted = [...metrics].sort((a, b) => (b.date || 0) - (a.date || 0));
  const blank = (): MktMetric => ({ id: uid('mt'), source: 'ga4', metric: '', value: 0, date: Date.now(), createdAt: Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-4 py-2.5 text-[12px] text-amber-800 flex items-center gap-2"><Globe className="w-4 h-4 shrink-0" /> Metriche inserite a mano (GA4/Ads/social). Predisposto per l'aggregazione automatica via API in un secondo momento.</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Metriche" value={String(metrics.length)} accent={ACCENT} />
        <Kpi icon={<Globe className="w-4 h-4" />} label="Fonti" value={String(new Set(metrics.map((m) => m.source)).size)} />
        <Kpi icon={<BarChart3 className="w-4 h-4" />} label="Tipi" value={String(new Set(metrics.map((m) => m.metric)).size)} />
        <Kpi icon={<Clock className="w-4 h-4" />} label="Ultimo aggiorn." value={sorted[0] ? new Date(sorted[0].date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—'} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuova metrica" /></div>
      {sorted.length === 0 ? (
        <EmptyBox icon={<TrendingUp className="w-6 h-6" />} title="Nessuna metrica" text="Inserisci i KPI di canale per periodo (sessioni, conversioni, CTR, reach…) per costruire report e confronti." />
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[90px_1fr_110px_100px_64px] gap-2 px-4 py-2.5 bg-[#fafafa] text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400 border-b border-[#ececec]"><span>Fonte</span><span>Metrica</span><span>Valore</span><span>Periodo</span><span></span></div>
          {sorted.map((m) => (
            <div key={m.id} className="grid grid-cols-[90px_1fr_110px_100px_64px] gap-2 items-center px-4 py-2.5 border-b border-[#f3f3f3] last:border-0 text-[13px]">
              <span className="text-[11px] font-bold text-amber-700">{METRIC_SRC[m.source]}</span>
              <span className="truncate">{m.metric}</span>
              <b style={{ color: ACCENT }}>{m.value.toLocaleString('it-IT')}</b>
              <span className="text-stone-500 text-[12px]">{new Date(m.date).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })}</span>
              <span className="flex items-center gap-1 justify-end"><button onClick={() => setEditing(m)} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete(m.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></span>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>{editing && (
        <ModalShell title={editing.metric ? 'Modifica metrica' : 'Nuova metrica'} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => { onSave(editing); setEditing(null); }} disabled={!editing.metric.trim()} label="Salva" /></>}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fonte"><select className={IN} value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value as MktMetricSource })}>{(Object.keys(METRIC_SRC) as MktMetricSource[]).map((s) => <option key={s} value={s}>{METRIC_SRC[s]}</option>)}</select></Field>
            <Field label="Periodo"><input type="date" className={IN} value={dOnly(editing.date)} onChange={(e) => setEditing({ ...editing, date: parseD(e.target.value) || Date.now() })} /></Field>
            <Field label="Metrica" full><input className={IN} value={editing.metric} onChange={(e) => setEditing({ ...editing, metric: e.target.value })} placeholder="Es. Sessioni, Conversioni, CTR…" /></Field>
            <Field label="Valore"><input type="number" className={IN} value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) || 0 })} /></Field>
            <Field label="Cliente"><select className={IN} value={editing.clientId || ''} onChange={(e) => setEditing({ ...editing, clientId: e.target.value || null })}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          </div>
        </ModalShell>
      )}</AnimatePresence>
    </div>
  );
};

/* ============================== INBOX UNIFICATA ============================== */
const INBOX_CH: Record<MktInboxChannel, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok', email: 'Email', whatsapp: 'WhatsApp', altro: 'Altro' };
const InboxTab: React.FC<{ inbox: MktInboxItem[]; clients: Record<string, ClientRecord>; onSave: (i: MktInboxItem) => void; onDelete: (id: string) => void }> = ({ inbox, clients, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktInboxItem | null>(null);
  const [showHandled, setShowHandled] = useState(true);
  const sorted = [...inbox].filter((i) => showHandled || !i.handled).sort((a, b) => (b.at || 0) - (a.at || 0));
  const open = inbox.filter((i) => !i.handled).length;
  const blank = (): MktInboxItem => ({ id: uid('in'), channel: 'instagram', from: '', text: '', at: Date.now(), handled: false, sentiment: 'neutro', createdAt: Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-4 py-2.5 text-[12px] text-amber-800 flex items-center gap-2"><Inbox className="w-4 h-4 shrink-0" /> Inbox unificata a inserimento manuale, pronta per la connessione alle API social (Meta/IG/LinkedIn) in un secondo momento.</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Inbox className="w-4 h-4" />} label="Messaggi" value={String(inbox.length)} accent={ACCENT} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Da gestire" value={String(open)} accent={open ? '#b45309' : undefined} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Positivi" value={String(inbox.filter((i) => i.sentiment === 'positivo').length)} accent="#059669" />
        <Kpi icon={<XCircle className="w-4 h-4" />} label="Negativi" value={String(inbox.filter((i) => i.sentiment === 'negativo').length)} accent="#dc2626" />
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={() => setShowHandled((v) => !v)} className="text-[12px] font-bold px-3 h-9 rounded-lg border border-[#e2e2e2] bg-white cursor-pointer">{showHandled ? 'Nascondi gestiti' : 'Mostra tutti'}</button>
        <AddBtn onClick={() => setEditing(blank())} label="Nuovo messaggio" />
      </div>
      {sorted.length === 0 ? (
        <EmptyBox icon={<Inbox className="w-6 h-6" />} title="Inbox vuota" text="Raccogli commenti e messaggi dai social in un unico posto: assegna sentiment, cliente e segna come gestiti." />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((i) => (
            <div key={i.id} className={`bg-white border rounded-[16px] p-4 flex items-start gap-3 ${i.handled ? 'border-[#eee] opacity-70' : 'border-[#e2e2e2]'}`}>
              <span className="text-[10.5px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">{INBOX_CH[i.channel]}</span>
              <div className="min-w-0 flex-1">
                <b className="text-[13px]">{i.from}</b>
                {i.sentiment && <span className={`text-[10.5px] font-bold ml-2 ${i.sentiment === 'positivo' ? 'text-emerald-600' : i.sentiment === 'negativo' ? 'text-red-500' : 'text-stone-400'}`}>● {i.sentiment}</span>}
                <p className="text-[13px] text-stone-600 mt-0.5">{i.text}</p>
                <span className="text-[11px] text-stone-400">{new Date(i.at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onSave({ ...i, handled: !i.handled })} title={i.handled ? 'Riapri' : 'Segna gestito'} className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer ${i.handled ? 'border-stone-200 text-stone-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditing(i)} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(i.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>{editing && (
        <ModalShell title={editing.from ? 'Modifica messaggio' : 'Nuovo messaggio'} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => { onSave(editing); setEditing(null); }} disabled={!editing.from.trim() || !editing.text.trim()} label="Salva" /></>}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Canale"><select className={IN} value={editing.channel} onChange={(e) => setEditing({ ...editing, channel: e.target.value as MktInboxChannel })}>{(Object.keys(INBOX_CH) as MktInboxChannel[]).map((c) => <option key={c} value={c}>{INBOX_CH[c]}</option>)}</select></Field>
            <Field label="Mittente"><input className={IN} value={editing.from} onChange={(e) => setEditing({ ...editing, from: e.target.value })} placeholder="@handle / nome" /></Field>
            <Field label="Messaggio" full><textarea className={`${IN} h-auto py-2 min-h-[70px]`} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} /></Field>
            <Field label="Sentiment"><select className={IN} value={editing.sentiment || 'neutro'} onChange={(e) => setEditing({ ...editing, sentiment: e.target.value as any })}><option value="positivo">Positivo</option><option value="neutro">Neutro</option><option value="negativo">Negativo</option></select></Field>
            <Field label="Cliente"><select className={IN} value={editing.clientId || ''} onChange={(e) => setEditing({ ...editing, clientId: e.target.value || null })}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          </div>
        </ModalShell>
      )}</AnimatePresence>
    </div>
  );
};

/* ============================== CONSENSI GDPR ============================== */
const CONSENT_SCOPES: { id: MktConsentScope; label: string }[] = [
  { id: 'marketing', label: 'Marketing' }, { id: 'newsletter', label: 'Newsletter' }, { id: 'profilazione', label: 'Profilazione' }, { id: 'terzi', label: 'Terzi' },
];
const ConsentsTab: React.FC<{ consents: MktConsent[]; clients: Record<string, ClientRecord>; onSave: (c: MktConsent) => void; onDelete: (id: string) => void }> = ({ consents, clients, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MktConsent | null>(null);
  const sorted = [...consents].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const active = consents.filter((c) => c.granted).length;
  const blank = (): MktConsent => ({ id: uid('cs'), subject: '', scopes: ['marketing'], granted: true, grantedAt: Date.now(), createdAt: Date.now() });
  const toggleGrant = (c: MktConsent) => onSave({ ...c, granted: !c.granted, grantedAt: !c.granted ? Date.now() : c.grantedAt, revokedAt: !c.granted ? null : Date.now() });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<ShieldCheck className="w-4 h-4" />} label="Consensi" value={String(consents.length)} accent={ACCENT} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Attivi" value={String(active)} accent="#059669" />
        <Kpi icon={<XCircle className="w-4 h-4" />} label="Revocati" value={String(consents.length - active)} accent="#dc2626" />
        <Kpi icon={<Mail className="w-4 h-4" />} label="Newsletter" value={String(consents.filter((c) => c.granted && c.scopes.includes('newsletter')).length)} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo consenso" /></div>
      {sorted.length === 0 ? (
        <EmptyBox icon={<ShieldCheck className="w-6 h-6" />} title="Nessun consenso" text="Registro consensi GDPR: tieni traccia di base giuridica, finalità, data di rilascio e revoca per ogni contatto." />
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          {sorted.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#f3f3f3] last:border-0">
              <div className="min-w-0 flex-1">
                <b className="text-[13.5px] truncate block">{c.subject}{c.email && <span className="text-stone-400 font-normal"> · {c.email}</span>}</b>
                <div className="flex flex-wrap gap-1 mt-0.5">{c.scopes.map((s) => <span key={s} className="text-[10px] bg-stone-100 text-stone-600 rounded-full px-1.5 py-0.5">{CONSENT_SCOPES.find((x) => x.id === s)?.label || s}</span>)}</div>
              </div>
              <button onClick={() => toggleGrant(c)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer shrink-0 ${c.granted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{c.granted ? 'Concesso' : 'Revocato'}</button>
              <button onClick={() => setEditing(c)} className="w-8 h-8 rounded-lg bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(c.id)} className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>{editing && (
        <ModalShell title={editing.subject ? 'Modifica consenso' : 'Nuovo consenso'} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => { onSave(editing); setEditing(null); }} disabled={!editing.subject.trim()} label="Salva" /></>}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Soggetto" full><input className={IN} value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Nominativo / contatto" /></Field>
            <Field label="Email"><input className={IN} value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Cliente"><select className={IN} value={editing.clientId || ''} onChange={(e) => setEditing({ ...editing, clientId: e.target.value || null })}><option value="">—</option>{Object.values(clients).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Finalità" full>
              <div className="flex flex-wrap gap-1.5">{CONSENT_SCOPES.map((s) => { const on = editing.scopes.includes(s.id); return <button key={s.id} onClick={() => setEditing({ ...editing, scopes: on ? editing.scopes.filter((x) => x !== s.id) : [...editing.scopes, s.id] })} className={`text-[12px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ${on ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500 border-stone-200'}`}>{s.label}</button>; })}</div>
            </Field>
            <Field label="Base giuridica" full><input className={IN} value={editing.basis || ''} onChange={(e) => setEditing({ ...editing, basis: e.target.value })} placeholder="Es. consenso esplicito art. 6.1.a" /></Field>
            <Field label="Stato"><button onClick={() => setEditing({ ...editing, granted: !editing.granted, grantedAt: !editing.granted ? Date.now() : editing.grantedAt, revokedAt: !editing.granted ? null : Date.now() })} className={`h-10 px-3 rounded-lg border text-[12.5px] font-bold cursor-pointer ${editing.granted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{editing.granted ? 'Concesso' : 'Revocato'}</button></Field>
          </div>
        </ModalShell>
      )}</AnimatePresence>
    </div>
  );
};
