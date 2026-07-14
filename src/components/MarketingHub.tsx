/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MarketingHub — Centro Marketing di Strategico (PDF: Aulico MKT 01, MKT Richieste
 * Gestionale, Report_Gestionale_Marketing). Strategico cura il marketing di TUTTI
 * gli account: le 5 società del gruppo + i clienti terzi. Struttura a 2 livelli:
 *   1. CENTRO MARKETING — salute di tutti gli account (Regolare/Attenzione/Critico,
 *      ultimo post, prossima pubblicazione), oggi in pubblicazione, alert, report riunione.
 *   2. WORKSPACE ACCOUNT — ogni account ha il SUO spazio: Panoramica/scheda (con
 *      liberatoria → "NON PUBBLICARE NULLA"), Calendario editoriale, Workflow 9 fasi,
 *      Statistiche KPI mensili (manuali, predisposte per API), Spese & budget (ponte
 *      Contabilità), Report mensile stampabile, Eventi & gadget, Blog.
 */
import React from 'react';
import {
  Megaphone, ArrowLeft, Plus, X, Trash2, Calendar as CalendarIcon, ListChecks,
  BarChart3, Wallet, FileText, Gift, Newspaper, LayoutGrid, AlertTriangle,
  Printer, CheckCircle2, Ban, ExternalLink, UserPlus, Sparkles,
  Mail, MessageCircle, Star, Image as ImageIcon, Send, Copy, Loader2, Camera,
} from 'lucide-react';
import type {
  MktAccount, MktKpiEntry, MktKpiPlatform, MktExpense, MktMonthlyReport,
  EditorialPost, EditorialPhase, SocMktItem, Quote, TrashItem,
  MktContact, MktCantierePhoto, MktOutreach, MktOutreachKind, MktOutreachRecipient,
} from '../types';
import HubCestino from './HubCestino';
import { PeriodSelect } from './PeriodSelect';
import { eur, safeUrl } from '../utils';
import { monthPeriod, pad, periodTitle, prevYm, todayISO, ymLabel, ymNow, ymShort, type Period } from '../period';
import { callAi } from '../firebase';
import EditorialCalendar, { ED_PHASES, ED_STATUS, deriveStatus } from './EditorialCalendar';
import type { EditorialImportProject } from './EditorialCalendar';

// ---------------------------------------------------------------- helpers
const dISO = (s?: string | null) => (s ? new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—');
const daysAgo = (dateISO: string) => Math.floor((Date.now() - new Date(dateISO).getTime()) / 86400000);
const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';

/**
 * Pallino dell'account: le società del gruppo tengono il colore d'identità (§10),
 * i clienti terzi sono TUTTI grigi — non sono società del gruppo e un colore
 * proprio li farebbe leggere come tali.
 */
const dotOf = (acc: MktAccount) => (acc.kind === 'cliente' ? '#8a8a8a' : acc.color || '#8a8a8a');

/** Post dell'account: match per id (nuovo) o per nome (legacy label). */
const postsOf = (acc: MktAccount, posts: EditorialPost[]) =>
  posts.filter((p) => p.channel === acc.id || p.channel === acc.name);

/** Salute account (PDF "Centro Marketing": Regolare/Attenzione/Critico). */
function healthOf(acc: MktAccount, posts: EditorialPost[]) {
  const mine = postsOf(acc, posts);
  const t = todayISO();
  const past = mine.filter((p) => p.dateISO <= t && (p.status === 'pubblicato' || p.dateISO < t)).map((p) => p.dateISO).sort();
  const future = mine.filter((p) => p.dateISO >= t && p.status !== 'pubblicato').map((p) => p.dateISO).sort();
  const lastPub = past[past.length - 1] || null;
  const nextPub = future[0] || null;
  const sinceLast = lastPub ? daysAgo(lastPub) : Infinity;
  let state: 'regolare' | 'attenzione' | 'critico' = 'regolare';
  if (sinceLast > 14 && !nextPub) state = 'critico';
  else if (sinceLast > 7 || !nextPub) state = 'attenzione';
  const inLavorazione = mine.filter((p) => p.status === 'idea' || p.status === 'bozza').length;
  return { lastPub, nextPub, state, inLavorazione, total: mine.length };
}
const HEALTH: Record<'regolare' | 'attenzione' | 'critico', { label: string; color: string; bg: string }> = {
  regolare: { label: 'Regolare', color: '#059669', bg: '#ecfdf5' },
  attenzione: { label: 'Attenzione', color: '#b45309', bg: '#fffbeb' },
  critico: { label: 'Critico', color: '#e11d48', bg: '#fff1f2' },
};

/** Metriche per piattaforma (dal modello Excel dei PDF). */
export const KPI_METRICS: Record<MktKpiPlatform, { key: string; label: string }[]> = {
  instagram: [
    { key: 'followers', label: 'Follower' }, { key: 'interazioni', label: 'Interazioni' },
    { key: 'visualizzazioni', label: 'Visualizzazioni' }, { key: 'post', label: 'Post' },
    { key: 'storie', label: 'Storie' }, { key: 'sponsorizzata', label: 'Sponsorizzata €' }, { key: 'lead', label: 'Lead' },
  ],
  facebook: [
    { key: 'followers', label: 'Follower' }, { key: 'interazioni', label: 'Interazioni' },
    { key: 'visualizzazioni', label: 'Visualizzazioni' }, { key: 'post', label: 'Post' },
    { key: 'storie', label: 'Storie' }, { key: 'sponsorizzata', label: 'Sponsorizzata €' }, { key: 'lead', label: 'Lead' },
  ],
  google: [
    { key: 'visualizzazioni', label: 'Visualizzazioni' }, { key: 'clickSito', label: 'Click sito' },
    { key: 'indicazioni', label: 'Indicazioni' }, { key: 'chiamate', label: 'Chiamate' },
  ],
  sito: [
    { key: 'utentiAttivi', label: 'Utenti attivi' }, { key: 'nuoviUtenti', label: 'Nuovi utenti' },
    { key: 'sessioni', label: 'Sessioni' }, { key: 'interazioni', label: 'Interazioni' },
    { key: 'lead', label: 'Lead' }, { key: 'stranieriPct', label: '% stranieri' },
  ],
};
const KPI_PLATFORMS: { id: MktKpiPlatform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' }, { id: 'facebook', label: 'Facebook' },
  { id: 'google', label: 'Google' }, { id: 'sito', label: 'Sito web' },
];
/** Palette per il grafico multi-metrica (una serie per metrica in un unico grafico — eccezione §10: grafici). */
const KPI_COLORS = ['#161616', '#4338ca', '#059669', '#b45309', '#e11d48', '#0891b2', '#7c3aed', '#c2410c'];
const EXP_CATEGORIES: { id: MktExpense['category']; label: string }[] = [
  { id: 'sponsorizzata', label: 'Sponsorizzata' }, { id: 'gadget', label: 'Gadget' },
  { id: 'evento', label: 'Evento' }, { id: 'stampa', label: 'Stampa' },
  { id: 'software', label: 'Software' }, { id: 'altro', label: 'Altro' },
];
const kpiId = (acc: string, pf: MktKpiPlatform, ym: string) => `${acc}__${pf}__${ym}`;
const mkExpId = () => `exp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------------------------------------------------------------- props
interface Props {
  accounts: MktAccount[];              // 5 società (sempre presenti) + clienti terzi
  posts: EditorialPost[];
  kpi: MktKpiEntry[];
  expenses: MktExpense[];
  reports: MktMonthlyReport[];
  extras: SocMktItem[];                // eventi/gadget/blog (nodo socMkt, soc = accountId)
  quotes: Quote[];                     // preventivi Strategico (report riunione)
  rubrica: { id: string; name: string }[];
  importProjects?: EditorialImportProject[];
  // Altro → comunicazioni in uscita + foto cantieri
  contacts?: MktContact[];             // rubrica con consensi risolti (destinatari)
  cantierePhotos?: MktCantierePhoto[]; // foto cantieri per account-società
  outreach?: MktOutreach[];            // storico newsletter/ricorrenze/recensioni
  onSaveOutreach?: (o: MktOutreach) => void;
  onDeleteOutreach?: (id: string) => void;
  color?: string;
  canEdit?: boolean;
  onSaveAccount?: (a: MktAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onSavePost?: (p: EditorialPost) => void;
  onDeletePost?: (id: string) => void;
  onSaveKpi?: (k: MktKpiEntry) => void;
  onSaveExpense?: (e: MktExpense) => void;
  onDeleteExpense?: (id: string) => void;
  onRegisterExpense?: (e: MktExpense) => void;  // → fattura passiva in Contabilità
  onSaveReport?: (r: MktMonthlyReport) => void;
  onSaveExtra?: (i: SocMktItem) => void;
  onDeleteExtra?: (id: string) => void;
  // Cestino & Archivio dell'area
  trash?: TrashItem[];
  onRestoreTrash?: (t: TrashItem) => void;
  onTrashDeleteForever?: (t: TrashItem) => void;
}

type WsTab = 'panoramica' | 'calendario' | 'workflow' | 'kpi' | 'spese' | 'report' | 'eventi' | 'blog' | 'altro';
const WS_TABS: { id: WsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'panoramica', label: 'Panoramica', icon: LayoutGrid },
  { id: 'calendario', label: 'Calendario', icon: CalendarIcon },
  { id: 'workflow', label: 'Workflow', icon: ListChecks },
  { id: 'kpi', label: 'KPI', icon: BarChart3 },
  { id: 'spese', label: 'Spese', icon: Wallet },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'eventi', label: 'Eventi & gadget', icon: Gift },
  { id: 'blog', label: 'Blog', icon: Newspaper },
  { id: 'altro', label: 'Altro', icon: Sparkles },
];

// ============================================================================
export const MarketingHub: React.FC<Props> = (props) => {
  const { accounts, posts, color = '#b45309', canEdit = false } = props;
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<WsTab>('panoramica');
  const [showCestino, setShowCestino] = React.useState(false);
  const active = accounts.find((a) => a.id === activeId) || null;

  const open = (id: string, t: WsTab = 'panoramica') => { setActiveId(id); setTab(t); };

  if (showCestino) {
    const accName = (ch: string) => accounts.find((a) => a.id === ch || a.name === ch)?.name || ch;
    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCestino(false)} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer" title="Centro Marketing"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-[20px] font-black tracking-tight text-[#161616]">Cestino & Archivio · Marketing</h2>
        </div>
        <HubCestino
          sections={['editorial', 'mkt-account', 'mkt-spesa']}
          trash={props.trash || []}
          archived={posts
            .filter((p) => p.status === 'pubblicato')
            .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
            .map((p) => ({
              id: p.id,
              label: p.topic || p.caption || 'Contenuto',
              meta: `${accName(p.channel)} · ${new Date(p.dateISO).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}${p.platform ? ` · ${p.platform}` : ''}`,
            }))}
          archiveHint="Contenuti già pubblicati (lo storico del piano editoriale)."
          canEdit={canEdit}
          onRestore={props.onRestoreTrash}
          onDeleteForever={props.onTrashDeleteForever}
        />
      </div>
    );
  }
  if (active) {
    return (
      <Workspace
        {...props}
        account={active}
        tab={tab}
        onTab={setTab}
        onBack={() => setActiveId(null)}
      />
    );
  }
  return <Centro {...props} onOpen={open} color={color} canEdit={canEdit} onOpenCestino={() => setShowCestino(true)} />;
};

// ============================================================================
// LIVELLO 1 — CENTRO MARKETING
// ============================================================================
const Centro: React.FC<Props & { onOpen: (id: string, tab?: WsTab) => void; onOpenCestino?: () => void }> = ({
  accounts, posts, expenses, quotes, reports, rubrica, color = '#b45309', canEdit = false,
  onSaveAccount, onSaveReport, onOpen, onOpenCestino,
}) => {
  const [adding, setAdding] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const t = todayISO();
  const ym = ymNow();

  const health = React.useMemo(() => {
    const m: Record<string, ReturnType<typeof healthOf>> = {};
    accounts.forEach((a) => { m[a.id] = healthOf(a, posts); });
    return m;
  }, [accounts, posts]);

  const todayPosts = posts.filter((p) => p.dateISO === t);
  const pendingApproval = posts.filter((p) => p.dateISO >= t && p.workflow?.revisione && !p.workflow?.approvazione);
  const noPlan = accounts.filter((a) => (a.active !== false) && !health[a.id]?.nextPub);
  const monthSpend = expenses.filter((e) => (e.date || '').slice(0, 7) === ym).reduce((s, e) => s + (e.amount || 0), 0);

  const alerts: { text: string; accId: string }[] = [];
  accounts.forEach((a) => {
    if (a.active === false) return;
    const h = health[a.id];
    if (!h) return;
    if (h.state === 'critico') alerts.push({ text: `${a.name}: nessun contenuto recente e nessuna pubblicazione programmata.`, accId: a.id });
    else if (!h.nextPub) alerts.push({ text: `${a.name}: nessuna pubblicazione programmata.`, accId: a.id });
    if (a.kind === 'cliente' && !a.liberatoria) alerts.push({ text: `${a.name}: manca la LIBERATORIA — non pubblicare nulla.`, accId: a.id });
  });
  pendingApproval.slice(0, 3).forEach((p) => {
    const acc = accounts.find((a) => a.id === p.channel || a.name === p.channel);
    alerts.push({ text: `"${p.topic || 'Contenuto'}" del ${dISO(p.dateISO)} in attesa di approvazione${acc ? ` (${acc.name})` : ''}.`, accId: acc?.id || '' });
  });

  const societa = accounts.filter((a) => a.kind === 'societa');
  const clienti = accounts.filter((a) => a.kind === 'cliente');

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
            <Megaphone className="w-5.5 h-5.5 text-[#161616]" /> Centro Marketing
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">
            Tutti gli account gestiti da Strategico: società del gruppo + clienti terzi. Ogni account ha il suo workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCestino && (
            <button onClick={onOpenCestino} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12px] font-bold cursor-pointer">
              <Trash2 className="w-4 h-4" /> Cestino & Archivio
            </button>
          )}
          <button onClick={() => setShowReport(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer">
            <Printer className="w-4 h-4" /> Report riunione
          </button>
          {canEdit && (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
              <UserPlus className="w-4 h-4" /> Nuovo cliente
            </button>
          )}
        </div>
      </div>

      {/* Dashboard giornaliera */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Oggi in pubblicazione', v: String(todayPosts.length), c: todayPosts.length ? '#4338ca' : undefined },
          { l: 'In attesa di approvazione', v: String(pendingApproval.length), c: pendingApproval.length ? '#b45309' : undefined },
          { l: 'Account senza programmazione', v: String(noPlan.length), c: noPlan.length ? '#e11d48' : undefined },
          { l: 'Spese del mese', v: eur(monthSpend) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Alert automatici */}
      {alerts.length > 0 && (
        <div className="bg-white border border-[#f3d9b1] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#b45309] inline-flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Richiede attenzione</p>
          <div className="flex flex-col gap-1.5">
            {alerts.slice(0, 6).map((a, i) => (
              <button key={i} onClick={() => a.accId && onOpen(a.accId)} className="text-left text-[12.5px] text-[#555] hover:text-[#161616] cursor-pointer bg-transparent border-none p-0 font-semibold">
                · {a.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account: società del gruppo */}
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Società del gruppo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {societa.map((a) => <AccountCard key={a.id} acc={a} h={health[a.id]} onOpen={onOpen} />)}
        </div>
      </div>

      {/* Account: clienti terzi */}
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Clienti terzi</p>
        {clienti.length === 0 ? (
          <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-6 text-center">
            Nessun cliente terzo. {canEdit ? 'Aggiungilo con "Nuovo cliente".' : ''}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clienti.map((a) => <AccountCard key={a.id} acc={a} h={health[a.id]} onOpen={onOpen} />)}
          </div>
        )}
      </div>

      {/* CALENDARIO EDITORIALE AGGREGATO — tutti i canali insieme, SOLA consultazione:
          la gestione operativa resta nel workspace di ogni account. */}
      <div className="border-t border-[#e6e6e6] pt-4">
        <EditorialCalendar
          posts={posts}
          channels={accounts.map((a) => ({ key: a.id, label: a.name, color: dotOf(a) }))}
          color={color}
          canEdit={false}
          initialChannel="Tutti"
        />
      </div>

      {adding && canEdit && (
        <NewClientModal
          rubrica={rubrica}
          existing={accounts}
          onClose={() => setAdding(false)}
          onCreate={(a) => { onSaveAccount?.(a); setAdding(false); onOpen(a.id); }}
        />
      )}
      {showReport && (
        <MeetingReport
          accounts={accounts}
          posts={posts}
          expenses={expenses}
          quotes={quotes}
          reports={reports}
          canEdit={canEdit}
          onSaveReport={onSaveReport}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

const AccountCard: React.FC<{ acc: MktAccount; h?: ReturnType<typeof healthOf>; onOpen: (id: string) => void }> = ({ acc, h, onOpen }) => {
  const st = HEALTH[h?.state || 'regolare'];
  const inactive = acc.active === false;
  return (
    <button
      onClick={() => onOpen(acc.id)}
      className={`text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${inactive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: dotOf(acc) }} />
          <b className="text-[14.5px] text-[#161616] truncate">{acc.name}</b>
        </span>
        <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0" style={{ color: st.color, background: st.bg }}>{st.label}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-1 text-[11.5px] text-[#8a8a8a] font-semibold">
        <span>Ultimo post: <b className="text-[#555]">{h?.lastPub ? dISO(h.lastPub) : '—'}</b></span>
        <span>Prossima: <b className="text-[#555]">{h?.nextPub ? dISO(h.nextPub) : '—'}</b></span>
        <span>In lavorazione: <b className="text-[#555]">{h?.inLavorazione ?? 0}</b></span>
        <span>{acc.kind === 'societa' ? 'Società' : 'Cliente terzo'}{inactive ? ' · sospeso' : ''}</span>
      </div>
      {acc.kind === 'cliente' && !acc.liberatoria && (
        <p className="mt-2 text-[10.5px] font-extrabold text-rose-600 inline-flex items-center gap-1"><Ban className="w-3 h-3" /> NON PUBBLICARE NULLA — manca la liberatoria</p>
      )}
    </button>
  );
};

const NewClientModal: React.FC<{
  rubrica: { id: string; name: string }[];
  existing: MktAccount[];
  onClose: () => void;
  onCreate: (a: MktAccount) => void;
}> = ({ rubrica, existing, onClose, onCreate }) => {
  const [name, setName] = React.useState('');
  const [recId, setRecId] = React.useState('');
  const usedRec = new Set(existing.map((a) => a.clientRecordId).filter(Boolean));
  const create = () => {
    const rec = rubrica.find((r) => r.id === recId);
    const nm = (rec?.name || name).trim();
    if (!nm) return;
    onCreate({
      id: `acc-${Date.now().toString(36)}`, kind: 'cliente', name: nm,
      clientRecordId: rec?.id || null, color: null, active: true,   // pallino grigio: vedi dotOf
      liberatoria: false, createdAt: Date.now(),
    });
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">Nuovo cliente marketing</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Dalla rubrica clienti</span>
            <select value={recId} onChange={(e) => { setRecId(e.target.value); }} className={inp}>
              <option value="">— scegli dalla rubrica —</option>
              {rubrica.map((r) => <option key={r.id} value={r.id} disabled={usedRec.has(r.id)}>{r.name}{usedRec.has(r.id) ? ' (già gestito)' : ''}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className={lbl}>Oppure nome libero</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Masseria Le Fabriche" className={inp} disabled={!!recId} />
          </label>
          <p className="text-[11px] text-[#9a9a9a]">La liberatoria parte come <b>non concessa</b>: finché non la attivi dalla scheda, sull'account compare "NON PUBBLICARE NULLA".</p>
          <button onClick={create} disabled={!recId && !name.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Crea account</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LIVELLO 2 — WORKSPACE ACCOUNT
// ============================================================================
const Workspace: React.FC<Props & { account: MktAccount; tab: WsTab; onTab: (t: WsTab) => void; onBack: () => void }> = (p) => {
  const { account: acc, tab, onTab, onBack, posts, color = '#b45309', canEdit = false } = p;
  const h = healthOf(acc, posts);
  const st = HEALTH[h.state];
  const noLib = acc.kind === 'cliente' && !acc.liberatoria;
  const accChannel = [{ key: acc.id, label: acc.name, color: dotOf(acc) }];
  const accPosts = postsOf(acc, posts);

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header workspace */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0" title="Centro Marketing">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[20px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2 truncate">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: dotOf(acc) }} />
              {acc.name}
            </h2>
            <p className="text-[11.5px] text-[#8a8a8a] font-semibold">
              {acc.kind === 'societa' ? 'Società del gruppo' : 'Cliente terzo'} ·{' '}
              <span style={{ color: st.color }} className="font-extrabold">{st.label}</span>
              {h.nextPub ? ` · prossima pubblicazione ${dISO(h.nextPub)}` : ' · nessuna pubblicazione programmata'}
            </p>
          </div>
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
          {WS_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onTab(id)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* LIBERATORIA mancante → avviso permanente (PDF) */}
      {noLib && (
        <div className="rounded-[16px] border-2 border-rose-300 bg-rose-50 px-4 py-3 flex items-center gap-2.5">
          <Ban className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-[13px] font-extrabold text-rose-700">NON PUBBLICARE NULLA — il cliente non ha firmato la liberatoria. Attivala dalla Panoramica quando arriva.</p>
        </div>
      )}

      {tab === 'panoramica' && <PanoramicaTab {...p} />}
      {tab === 'calendario' && (
        <EditorialCalendar
          posts={posts}
          channels={accChannel}
          color={acc.color || color}
          canEdit={canEdit}
          initialChannel={acc.id}
          lockChannel
          importProjects={p.importProjects || []}
          onSave={p.onSavePost}
          onDelete={p.onDeletePost}
        />
      )}
      {tab === 'workflow' && <WorkflowTab posts={accPosts} canEdit={canEdit} onSave={p.onSavePost} />}
      {tab === 'kpi' && <KpiTab acc={acc} kpi={p.kpi} canEdit={canEdit} onSave={p.onSaveKpi} />}
      {tab === 'spese' && <SpeseTab acc={acc} expenses={p.expenses} canEdit={canEdit} onSave={p.onSaveExpense} onDelete={p.onDeleteExpense} onRegister={p.onRegisterExpense} />}
      {tab === 'report' && <ReportTab acc={acc} posts={accPosts} kpi={p.kpi} expenses={p.expenses} reports={p.reports} canEdit={canEdit} onSaveReport={p.onSaveReport} />}
      {(tab === 'eventi' || tab === 'blog') && <ExtrasTab acc={acc} kindTab={tab} extras={p.extras} canEdit={canEdit} onSave={p.onSaveExtra} onDelete={p.onDeleteExtra} />}
      {tab === 'altro' && (
        <AltroTab
          acc={acc}
          canEdit={canEdit}
          contacts={p.contacts || []}
          cantierePhotos={p.cantierePhotos || []}
          outreach={p.outreach || []}
          onSaveOutreach={p.onSaveOutreach}
          onDeleteOutreach={p.onDeleteOutreach}
          onSaveAccount={p.onSaveAccount}
          onSavePost={p.onSavePost}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------- Panoramica
const PanoramicaTab: React.FC<Props & { account: MktAccount }> = ({ account: acc, posts, expenses, canEdit, onSaveAccount, onDeleteAccount }) => {
  const [d, setD] = React.useState<MktAccount>({ ...acc, channels: acc.channels || [] });
  React.useEffect(() => setD({ ...acc, channels: acc.channels || [] }), [acc.id]); // eslint-disable-line
  const set = (c: Partial<MktAccount>) => setD((p) => ({ ...p, ...c }));
  const chs = d.channels || [];
  const ym = ymNow();
  const mine = postsOf(acc, posts);
  const monthPosts = mine.filter((p) => p.dateISO.slice(0, 7) === ym);
  const monthSpend = expenses.filter((e) => e.accountId === acc.id && (e.date || '').slice(0, 7) === ym).reduce((s, e) => s + (e.amount || 0), 0);
  const dirty = JSON.stringify(d) !== JSON.stringify({ ...acc, channels: acc.channels || [] });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Scheda account (PDF §2.2) */}
      <div className="lg:col-span-2 bg-white border border-[#e2e2e2] rounded-[22px] p-5 flex flex-col gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Scheda account</p>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1 col-span-2"><span className={lbl}>Nome</span>
            <input disabled={!canEdit || acc.kind === 'societa'} value={d.name} onChange={(e) => set({ name: e.target.value })} className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Obiettivi</span>
            <input disabled={!canEdit} value={d.goals || ''} onChange={(e) => set({ goals: e.target.value || null })} placeholder="Es. +500 follower, 3 lead/mese" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Target di riferimento</span>
            <input disabled={!canEdit} value={d.target || ''} onChange={(e) => set({ target: e.target.value || null })} placeholder="Es. 30-55, proprietari immobili Valle d'Itria" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Tono di voce</span>
            <input disabled={!canEdit} value={d.tone || ''} onChange={(e) => set({ tone: e.target.value || null })} placeholder="Es. caldo, evocativo, italiano+inglese" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Budget marketing mensile €</span>
            <input disabled={!canEdit} type="number" value={d.budgetMonthly ?? ''} onChange={(e) => set({ budgetMonthly: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
          <label className="flex flex-col gap-1 col-span-2"><span className={lbl}>Google Analytics · ID proprietà GA4 (sito)</span>
            <input disabled={!canEdit} value={d.ga4PropertyId || ''} onChange={(e) => set({ ga4PropertyId: e.target.value || null })} placeholder="Es. 123456789 — solo numeri" className={inp} />
            <span className="text-[10px] text-[#9a9a9a] font-semibold">Collegalo per aggiornare in automatico i KPI del canale "Sito web" (utenti, sessioni, % stranieri). ID numerico da GA4 → Amministrazione → Impostazioni proprietà (non il codice "G-…").</span></label>
          <label className="flex flex-col gap-1 col-span-2"><span className={lbl}>Note</span>
            <textarea disabled={!canEdit} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
        </div>

        {/* Canali social */}
        <div>
          <span className={lbl}>Canali social</span>
          <div className="flex flex-col gap-1.5 mt-1.5">
            {chs.map((c, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr_1fr_auto] gap-1.5 items-center">
                <input disabled={!canEdit} value={c.platform} onChange={(e) => set({ channels: chs.map((x, j) => j === i ? { ...x, platform: e.target.value } : x) })} placeholder="Instagram" className={inp} />
                <input disabled={!canEdit} value={c.handle || ''} onChange={(e) => set({ channels: chs.map((x, j) => j === i ? { ...x, handle: e.target.value || null } : x) })} placeholder="@handle" className={inp} />
                <input disabled={!canEdit} value={c.url || ''} onChange={(e) => set({ channels: chs.map((x, j) => j === i ? { ...x, url: e.target.value || null } : x) })} placeholder="https://…" className={inp} />
                <div className="flex items-center gap-1">
                  {c.url && safeUrl(c.url) && <a href={safeUrl(c.url)!} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 text-[#8a8a8a]"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  {canEdit && <button onClick={() => set({ channels: chs.filter((_, j) => j !== i) })} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              </div>
            ))}
            {canEdit && <button onClick={() => set({ channels: [...chs, { platform: '', handle: null, url: null }] })} className="self-start inline-flex items-center gap-1 text-[11.5px] font-bold text-[#161616] cursor-pointer bg-transparent border-none p-0"><Plus className="w-3.5 h-3.5" /> Aggiungi canale</button>}
          </div>
        </div>

        {/* Liberatoria + stato */}
        <div className="flex items-center gap-4 flex-wrap pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" disabled={!canEdit} checked={!!d.liberatoria} onChange={(e) => set({ liberatoria: e.target.checked })} className="w-4 h-4 accent-[#161616]" />
            <span className="text-[12.5px] font-bold text-[#161616]">Liberatoria pubblicazione firmata</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" disabled={!canEdit} checked={d.active !== false} onChange={(e) => set({ active: e.target.checked })} className="w-4 h-4 accent-[#161616]" />
            <span className="text-[12.5px] font-bold text-[#161616]">Account gestito attivamente</span>
          </label>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => onSaveAccount?.({ ...d, updatedAt: Date.now() })} disabled={!dirty} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva scheda</button>
            {acc.kind === 'cliente' && onDeleteAccount && (
              <button onClick={() => onDeleteAccount(acc.id)} className="px-3 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[12.5px] font-bold cursor-pointer">Elimina account</button>
            )}
          </div>
        )}
      </div>

      {/* Riepilogo mese */}
      <div className="flex flex-col gap-3">
        {[
          { l: 'Contenuti questo mese', v: String(monthPosts.length) },
          { l: 'Pubblicati', v: String(monthPosts.filter((p) => p.status === 'pubblicato').length) },
          { l: 'Spese del mese', v: eur(monthSpend) },
          { l: 'Budget mensile', v: d.budgetMonthly ? eur(d.budgetMonthly) : '—' },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black text-[#161616] mt-1 leading-none">{k.v}</p>
          </div>
        ))}
        {acc.budgetMonthly ? (
          <div className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">Budget utilizzato</p>
            <div className="h-2.5 rounded-full bg-[#f0f0f0] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (monthSpend / acc.budgetMonthly) * 100)}%`, background: monthSpend > acc.budgetMonthly ? '#e11d48' : '#059669' }} />
            </div>
            <p className="text-[11px] text-[#8a8a8a] font-semibold mt-1.5">{eur(monthSpend)} su {eur(acc.budgetMonthly)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Workflow
const WorkflowTab: React.FC<{ posts: EditorialPost[]; canEdit: boolean; onSave?: (p: EditorialPost) => void }> = ({ posts, canEdit, onSave }) => {
  const [ym, setYm] = React.useState(ymNow());
  const list = posts.filter((p) => p.dateISO.slice(0, 7) === ym).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const toggle = (p: EditorialPost, ph: EditorialPhase) => {
    if (!canEdit) return;
    const wf = { ...(p.workflow || {}), [ph]: !(p.workflow || {})[ph] };
    onSave?.({ ...p, workflow: wf, status: deriveStatus(wf), updatedAt: Date.now() });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Ogni contenuto passa 9 fasi (PDF): clicca i pallini per segnare le fasi fatte — lo stato si aggiorna da solo.</p>
        <input type="month" value={ym} onChange={(e) => setYm(e.target.value || ymNow())} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white" />
      </div>
      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun contenuto in {ymLabel(ym)}. Aggiungilo dal Calendario.</p>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#eee] bg-[#f7f6f4]">
                <th className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Contenuto</th>
                {ED_PHASES.map((ph) => <th key={ph.id} className="px-1 py-2.5 text-[9px] font-extrabold uppercase tracking-wider text-[#9a9a9a] text-center" title={ph.label}>{ph.short}</th>)}
                <th className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] text-right">Stato</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const st = ED_STATUS.find((s) => s.id === p.status) || ED_STATUS[0];
                return (
                  <tr key={p.id} className="border-b border-[#f3f3f3] last:border-none">
                    <td className="px-3 py-2.5">
                      <b className="text-[12.5px] text-[#161616] block leading-tight">{p.topic || p.caption || 'Senza titolo'}</b>
                      <span className="text-[10.5px] text-[#9a9a9a] font-semibold">{dISO(p.dateISO)}{p.platform ? ` · ${p.platform}` : ''}</span>
                    </td>
                    {ED_PHASES.map((ph) => {
                      const done = !!(p.workflow || {})[ph.id];
                      return (
                        <td key={ph.id} className="px-1 py-2.5 text-center">
                          <button onClick={() => toggle(p, ph.id)} disabled={!canEdit} title={ph.label} className="w-4 h-4 rounded-full cursor-pointer border-none inline-block align-middle transition-colors disabled:cursor-default" style={{ background: done ? '#10b981' : '#fda4af' }} />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: st.color }}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- KPI
const KpiTab: React.FC<{ acc: MktAccount; kpi: MktKpiEntry[]; canEdit: boolean; onSave?: (k: MktKpiEntry) => void }> = ({ acc, kpi, canEdit, onSave }) => {
  const [pf, setPf] = React.useState<MktKpiPlatform>('instagram');
  const [year, setYear] = React.useState(new Date().getFullYear());
  return <KpiGrid key={`${acc.id}-${pf}-${year}`} acc={acc} kpi={kpi} pf={pf} year={year} canEdit={canEdit} onSave={onSave} onPf={setPf} onYear={setYear} />;
};

const KpiGrid: React.FC<{
  acc: MktAccount; kpi: MktKpiEntry[]; pf: MktKpiPlatform; year: number; canEdit: boolean;
  onSave?: (k: MktKpiEntry) => void; onPf: (p: MktKpiPlatform) => void; onYear: (y: number) => void;
}> = ({ acc, kpi, pf, year, canEdit, onSave, onPf, onYear }) => {
  const metrics = KPI_METRICS[pf];
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`);
  const saved = React.useMemo(() => {
    const m: Record<string, MktKpiEntry> = {};
    kpi.filter((k) => k.accountId === acc.id && k.platform === pf).forEach((k) => { m[k.ym] = k; });
    return m;
  }, [kpi, acc.id, pf]);
  const ga4Auto = pf === 'sito' && Object.values(saved).some((k) => k?.source === 'ga4' || !!k?.syncedAt);
  const [draft, setDraft] = React.useState<Record<string, Record<string, string>>>(() => {
    const d: Record<string, Record<string, string>> = {};
    months.forEach((ym) => {
      d[ym] = {};
      metrics.forEach((mt) => { const v = saved[ym]?.metrics?.[mt.key]; d[ym][mt.key] = v == null ? '' : String(v); });
    });
    return d;
  });
  const [chartMetric, setChartMetric] = React.useState(metrics[0].key);
  const [chartMode, setChartMode] = React.useState<'tutte' | 'singola'>('tutte');
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = React.useRef<number | undefined>(undefined);
  const flushRef = React.useRef<() => void>(() => {});
  const dirty = months.some((ym) => metrics.some((mt) => {
    const v = saved[ym]?.metrics?.[mt.key];
    return (draft[ym]?.[mt.key] ?? '') !== (v == null ? '' : String(v));
  }));

  const save = () => {
    months.forEach((ym) => {
      const changed = metrics.some((mt) => {
        const v = saved[ym]?.metrics?.[mt.key];
        return (draft[ym]?.[mt.key] ?? '') !== (v == null ? '' : String(v));
      });
      if (!changed) return;
      const mm: Record<string, number | null> = { ...(saved[ym]?.metrics || {}) };
      metrics.forEach((mt) => { const s = (draft[ym]?.[mt.key] ?? '').trim(); mm[mt.key] = s === '' ? null : Number(s); });
      onSave?.({ id: kpiId(acc.id, pf, ym), accountId: acc.id, platform: pf, ym, metrics: mm, updatedAt: Date.now() });
    });
  };

  // Salvataggio automatico "mentre digiti" (debounce) + flush allo smontaggio (cambio piattaforma/anno).
  React.useEffect(() => {
    if (!canEdit || !onSave || !dirty) return;
    setSaveState('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { save(); setSaveState('saved'); }, 700);
    return () => window.clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  flushRef.current = () => { if (canEdit && onSave && dirty) save(); };
  React.useEffect(() => () => flushRef.current(), []);

  const valOf = (ym: string, key: string): number | null => {
    const s = (draft[ym]?.[key] ?? '').trim();
    return s === '' ? null : Number(s);
  };
  const chartVals = months.map((ym) => valOf(ym, chartMetric));
  const maxV = Math.max(1, ...chartVals.map((v) => v || 0));
  const monthShort = (ym: string) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 1, 1).toLocaleDateString('it-IT', { month: 'short' });

  // Serie per il grafico "Tutte le metriche": ogni metrica indicizzata al proprio massimo dell'anno.
  const kfmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString('it-IT') : v.toLocaleString('it-IT', { maximumFractionDigits: 2 }));
  const seriesData = metrics.map((mt, i) => {
    const vals = months.map((ym) => valOf(ym, mt.key));
    const mx = Math.max(0, ...vals.map((v) => v ?? 0));
    const last = [...vals].reverse().find((v) => v != null) ?? null;
    return { key: mt.key, label: mt.label, color: KPI_COLORS[i % KPI_COLORS.length], vals, max: mx, last };
  });
  const pathOf = (vals: (number | null)[], mx: number) => {
    if (mx <= 0) return '';
    let d = ''; let pen = false;
    vals.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      const x = (i / (vals.length - 1)) * 1000;
      const y = (1 - v / mx) * 1000;
      d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };
  const onChartMove = (e: React.MouseEvent) => {
    const el = chartRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const idx = Math.round(((e.clientX - r.left) / r.width) * (months.length - 1));
    setHoverIdx(Math.max(0, Math.min(months.length - 1, idx)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {KPI_PLATFORMS.map((x) => (
            <button key={x.id} onClick={() => onPf(x.id)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${pf === x.id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{x.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={(e) => onYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white cursor-pointer">
            {[year - 2, year - 1, year, year + 1].filter((y, i, a) => a.indexOf(y) === i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {canEdit && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold min-w-[92px] justify-end" title="I KPI si salvano da soli mentre digiti">
              {saveState === 'saving' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin text-[#8a8a8a]" /><span className="text-[#8a8a8a]">Salvataggio…</span></>
              ) : saveState === 'saved' ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-600">Salvato</span></>
              ) : (
                <span className="text-[#b0b0b0]">Salvataggio automatico</span>
              )}
            </span>
          )}
        </div>
      </div>
      <p className="text-[11.5px] text-[#9a9a9a] font-semibold">
        {ga4Auto ? (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Sito web aggiornato da Google Analytics.</span>
        ) : null}{' '}
        {ga4Auto
          ? 'Traffico (utenti, sessioni, % stranieri) sincronizzato in automatico; le altre voci restano manuali (una modifica manuale su quelle sincronizzate viene sovrascritta al prossimo aggiornamento). '
          : 'Dati mensili inseriti a mano (come nel modello Excel) — predisposti per l’aggiornamento automatico via API. '}
        Si salvano da soli mentre digiti; il delta è rispetto al mese precedente.
      </p>

      {/* Grafico andamento: "Tutte" (una linea per metrica, indicizzate) o "Singola" (una metrica). */}
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Andamento {year}</p>
          <div className="flex items-center gap-2">
            {chartMode === 'singola' && (
              <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-[#e2e2e2] text-[11.5px] font-bold outline-none bg-white cursor-pointer">
                {metrics.map((mt) => <option key={mt.key} value={mt.key}>{mt.label}</option>)}
              </select>
            )}
            <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
              {([['tutte', 'Tutte'], ['singola', 'Singola']] as const).map(([m, l]) => (
                <button key={m} onClick={() => setChartMode(m)} className={`text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer border-none ${chartMode === m ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {chartMode === 'singola' ? (
          <div className="flex items-end gap-1.5 h-[110px]">
            {chartVals.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="w-full rounded-t-md transition-all" style={{ height: `${v == null ? 0 : Math.max(3, (v / maxV) * 90)}px`, background: v == null ? '#f0f0f0' : '#161616', opacity: v == null ? 1 : 0.85 }} title={v == null ? '—' : String(v)} />
                <span className="text-[9px] font-bold text-[#b0b0b0]">{monthShort(months[i])}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div ref={chartRef} onMouseMove={onChartMove} onMouseLeave={() => setHoverIdx(null)} className="relative w-full h-[180px]">
              <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                {seriesData.map((s) => s.max > 0 && (
                  <path key={s.key} d={pathOf(s.vals, s.max)} fill="none" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                ))}
              </svg>
              {hoverIdx != null && (
                <div className="absolute top-0 bottom-0 w-px bg-[#d0d0d0] pointer-events-none" style={{ left: `${(hoverIdx / (months.length - 1)) * 100}%` }} />
              )}
              {hoverIdx != null && seriesData.map((s) => {
                const v = s.vals[hoverIdx];
                if (v == null || s.max <= 0) return null;
                return (
                  <div
                    key={s.key}
                    className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-white pointer-events-none"
                    style={{ left: `${(hoverIdx / (months.length - 1)) * 100}%`, top: `${(1 - v / s.max) * 100}%`, background: s.color }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {months.map((ym, i) => (
                <span key={ym} className={`text-[9px] font-bold ${hoverIdx === i ? 'text-[#161616]' : 'text-[#b0b0b0]'}`}>{monthShort(ym)}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {seriesData.map((s) => {
                const v = hoverIdx != null ? s.vals[hoverIdx] : s.last;
                return (
                  <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#666]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.label}: <b className="text-[#161616]">{v == null ? '—' : kfmt(v)}</b>
                  </span>
                );
              })}
            </div>
            <p className="text-[10.5px] text-[#9a9a9a] mt-2">
              Ogni metrica è rapportata al proprio massimo dell'anno, così le tendenze sono confrontabili.{' '}
              {hoverIdx != null ? `Valori di ${ymLabel(months[hoverIdx])}.` : 'Passa col mouse per i valori mese per mese.'}
            </p>
          </>
        )}
      </div>

      {/* Tabella mensile editabile con delta */}
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-[#eee] bg-[#f7f6f4]">
              <th className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Mese</th>
              {metrics.map((mt) => <th key={mt.key} className="px-2 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] text-center">{mt.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {months.map((ym, mi) => (
              <tr key={ym} className={`border-b border-[#f3f3f3] last:border-none ${ym === ymNow() ? 'bg-[#fdfbf7]' : ''}`}>
                <td className="px-3 py-2 text-[12px] font-bold text-[#161616] capitalize">{monthShort(ym)}</td>
                {metrics.map((mt) => {
                  const cur = valOf(ym, mt.key);
                  const prev = mi > 0 ? valOf(months[mi - 1], mt.key) : null;
                  const delta = cur != null && prev != null ? cur - prev : null;
                  return (
                    <td key={mt.key} className="px-2 py-1.5 text-center">
                      <input
                        disabled={!canEdit}
                        inputMode="decimal"
                        value={draft[ym]?.[mt.key] ?? ''}
                        onChange={(e) => { const v = e.target.value; if (/^-?\d*[.,]?\d*$/.test(v)) setDraft((d) => ({ ...d, [ym]: { ...d[ym], [mt.key]: v.replace(',', '.') } })); }}
                        className="w-[76px] px-1.5 py-1 rounded-md border border-[#ececec] text-[12px] text-center outline-none focus:border-[#161616] bg-white disabled:bg-transparent disabled:border-transparent"
                        placeholder="—"
                      />
                      {delta != null && delta !== 0 && (
                        <span className={`block text-[9px] font-extrabold ${delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{delta > 0 ? '+' : ''}{Math.round(delta * 100) / 100}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Spese
const SpeseTab: React.FC<{
  acc: MktAccount; expenses: MktExpense[]; canEdit: boolean;
  onSave?: (e: MktExpense) => void; onDelete?: (id: string) => void; onRegister?: (e: MktExpense) => void;
}> = ({ acc, expenses, canEdit, onSave, onDelete, onRegister }) => {
  const [ym, setYm] = React.useState(ymNow());
  const [form, setForm] = React.useState<{ category: MktExpense['category']; description: string; amount: string }>({ category: 'sponsorizzata', description: '', amount: '' });
  const mine = expenses.filter((e) => e.accountId === acc.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const monthRows = mine.filter((e) => (e.date || '').slice(0, 7) === ym);
  const monthTot = monthRows.reduce((s, e) => s + (e.amount || 0), 0);
  const yearTot = mine.filter((e) => (e.date || '').slice(0, 4) === ym.slice(0, 4)).reduce((s, e) => s + (e.amount || 0), 0);
  // La spesa vive a livello di MESE: si salva sul primo del mese selezionato in alto,
  // così i filtri per `slice(0,7)` e la fattura passiva in Contabilità restano validi.
  const add = () => {
    const amount = Number(form.amount);
    if (!amount) return;
    onSave?.({ id: mkExpId(), accountId: acc.id, date: `${ym}-01`, category: form.category, description: form.description.trim() || null, amount, createdAt: Date.now() });
    setForm({ category: form.category, description: '', amount: '' });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Piano finanziario marketing: registra sponsorizzate, gadget, eventi… senza perdere di vista il budget. Le spese si contano per mese: quello selezionato qui a fianco. "Registra in Contabilità" crea la fattura passiva in Finanza (Strategico).</p>
        <input type="month" value={ym} onChange={(e) => setYm(e.target.value || ymNow())} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: `Spese ${ymLabel(ym)}`, v: eur(monthTot) },
          { l: 'Budget mensile', v: acc.budgetMonthly ? eur(acc.budgetMonthly) : '—' },
          { l: 'Residuo mese', v: acc.budgetMonthly ? eur(acc.budgetMonthly - monthTot) : '—', c: acc.budgetMonthly && monthTot > acc.budgetMonthly ? '#e11d48' : undefined },
          { l: `Totale ${ym.slice(0, 4)}`, v: eur(yearTot) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 grid grid-cols-2 md:grid-cols-[150px_1fr_110px_auto] gap-2 items-end">
          <label className="flex flex-col gap-1"><span className={lbl}>Categoria</span>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MktExpense['category'] }))} className={inp}>{EXP_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label className="flex flex-col gap-1 col-span-2 md:col-span-1"><span className={lbl}>Descrizione</span><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Es. campagna IG giugno" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Importo €</span><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inp} /></label>
          <button onClick={add} disabled={!Number(form.amount)} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40 inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Aggiungi</button>
        </div>
      )}

      {monthRows.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna spesa in {ymLabel(ym)}.</p>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-[#eee] bg-[#f7f6f4]">
                {['Mese', 'Categoria', 'Descrizione', 'Importo', ''].map((h, i) => <th key={i} className={`px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i >= 3 ? 'text-right' : ''}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {monthRows.map((e) => (
                <tr key={e.id} className="border-b border-[#f3f3f3] last:border-none">
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-[#555] capitalize">{ymShort((e.date || '').slice(0, 7))}</td>
                  <td className="px-3 py-2.5"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{EXP_CATEGORIES.find((c) => c.id === e.category)?.label || e.category}</span></td>
                  <td className="px-3 py-2.5 text-[12.5px] text-[#161616]">{e.description || '—'}</td>
                  <td className="px-3 py-2.5 text-right text-[13px] font-extrabold text-[#161616]">{eur(e.amount)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {e.invoiceId ? (
                      <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> in Contabilità</span>
                    ) : canEdit && onRegister ? (
                      <button onClick={() => onRegister(e)} className="text-[11px] font-bold text-[#161616] underline decoration-dotted cursor-pointer bg-transparent border-none p-0">Registra in Contabilità</button>
                    ) : null}
                    {canEdit && onDelete && <button onClick={() => onDelete(e.id)} className="ml-2 p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none align-middle"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- Report mensile (per account)
const ReportTab: React.FC<{
  acc: MktAccount; posts: EditorialPost[]; kpi: MktKpiEntry[]; expenses: MktExpense[]; reports: MktMonthlyReport[];
  canEdit: boolean; onSaveReport?: (r: MktMonthlyReport) => void;
}> = ({ acc, posts, kpi, expenses, reports, canEdit, onSaveReport }) => {
  const [period, setPeriod] = React.useState<Period>(() => monthPeriod(ymNow()));
  const ym = period.ym;                                   // mese di riferimento (KPI e spese)
  const repId = `${acc.id}__${period.key}`;
  const savedRep = reports.find((r) => r.id === repId);
  const [conclusions, setConclusions] = React.useState(savedRep?.conclusions || '');
  React.useEffect(() => setConclusions(savedRep?.conclusions || ''), [repId]); // eslint-disable-line
  const periodPosts = posts.filter((p) => p.dateISO >= period.from && p.dateISO <= period.to).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const monthExp = expenses.filter((e) => e.accountId === acc.id && (e.date || '').slice(0, 7) === ym);
  const expTot = monthExp.reduce((s, e) => s + (e.amount || 0), 0);
  const pYm = prevYm(ym);

  const perfRows = KPI_PLATFORMS.map((pfd) => {
    const cur = kpi.find((k) => k.accountId === acc.id && k.platform === pfd.id && k.ym === ym);
    const prev = kpi.find((k) => k.accountId === acc.id && k.platform === pfd.id && k.ym === pYm);
    if (!cur) return null;
    const cells = KPI_METRICS[pfd.id]
      .map((mt) => {
        const v = cur.metrics?.[mt.key];
        if (v == null) return null;
        const pv = prev?.metrics?.[mt.key];
        const delta = pv != null ? v - pv : null;
        return { label: mt.label, v, delta };
      })
      .filter(Boolean) as { label: string; v: number; delta: number | null }[];
    return cells.length ? { platform: pfd.label, cells } : null;
  }).filter(Boolean) as { platform: string; cells: { label: string; v: number; delta: number | null }[] }[];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Report in stile riunione, settimanale o mensile: performance, programmazione, spese, conclusioni. "Stampa" genera il PDF.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelect value={period} onChange={setPeriod} />
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Printer className="w-4 h-4" /> Stampa / PDF</button>
        </div>
      </div>

      <div className="print-area bg-white border border-[#e2e2e2] rounded-[22px] p-6 flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#b45309' }}>Strategico · Report marketing {period.mode === 'settimana' ? 'settimanale' : 'mensile'}</p>
          <h3 className="text-[22px] font-black text-[#161616] capitalize">{acc.name} — {periodTitle(period)}</h3>
        </div>

        {/* 1. Performance — i KPI sono mensili: anche nel settimanale si guarda il mese di riferimento. */}
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">1 · Analisi performance digital <span className="normal-case tracking-normal font-bold text-[#c0c0c0]">— dati del mese di {ymLabel(ym)}</span></p>
          {perfRows.length === 0 ? (
            <p className="text-[12.5px] text-[#9a9a9a]">Nessun dato KPI inserito per {ymLabel(ym)} (tab KPI).</p>
          ) : perfRows.map((r) => (
            <div key={r.platform} className="mb-2.5">
              <b className="text-[13px] text-[#161616]">{r.platform}</b>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1">
                {r.cells.map((c) => (
                  <span key={c.label} className="text-[12.5px] text-[#555]">
                    {c.label}: <b className="text-[#161616]">{c.v.toLocaleString('it-IT')}</b>
                    {c.delta != null && c.delta !== 0 && <span className={`ml-1 font-extrabold ${c.delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>({c.delta > 0 ? '+' : ''}{Math.round(c.delta * 100) / 100})</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 2. Programmazione */}
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">2 · Programmazione {periodTitle(period)}</p>
          {periodPosts.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Nessun contenuto in calendario.</p> : (
            <div className="flex flex-col gap-1">
              {periodPosts.map((p) => {
                const st = ED_STATUS.find((s) => s.id === p.status) || ED_STATUS[0];
                return (
                  <div key={p.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.color }} />
                    <span className="font-bold text-[#161616] w-[52px] shrink-0">{dISO(p.dateISO)}</span>
                    <span className="text-[#555] truncate">{p.topic || p.caption || 'Contenuto'}</span>
                    {p.platform && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{p.platform}</span>}
                    {(p.media?.length || 0) > 1 && <span className="text-[10px] text-[#9a9a9a] shrink-0">carosello ×{p.media!.length}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Spese */}
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">3 · Spese marketing di {ymLabel(ym)}</p>
          {monthExp.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Nessuna spesa registrata.</p> : (
            <div className="flex flex-col gap-0.5">
              {monthExp.map((e) => (
                <p key={e.id} className="text-[12.5px] text-[#555]">· {EXP_CATEGORIES.find((c) => c.id === e.category)?.label}{e.description ? ` — ${e.description}` : ''}: <b className="text-[#161616]">{eur(e.amount)}</b></p>
              ))}
              <p className="text-[13px] font-extrabold text-[#161616] mt-1">Totale: {eur(expTot)}{acc.budgetMonthly ? ` su budget ${eur(acc.budgetMonthly)}` : ''}</p>
            </div>
          )}
        </div>

        {/* 4. Conclusioni */}
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">4 · Conclusioni</p>
          <textarea
            disabled={!canEdit}
            value={conclusions}
            onChange={(e) => setConclusions(e.target.value)}
            onBlur={() => { if (canEdit && conclusions !== (savedRep?.conclusions || '')) onSaveReport?.({ id: repId, accountId: acc.id, ym: period.key, conclusions: conclusions || null, updatedAt: Date.now() }); }}
            rows={4}
            placeholder={period.mode === 'settimana' ? 'Sintesi della settimana, decisioni, cosa fare la prossima…' : 'Sintesi del mese, decisioni, strategia per il mese prossimo…'}
            className={`${inp} resize-none`}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Report riunione (globale)
const MeetingReport: React.FC<{
  accounts: MktAccount[]; posts: EditorialPost[]; expenses: MktExpense[]; quotes: Quote[]; reports: MktMonthlyReport[];
  canEdit: boolean; onSaveReport?: (r: MktMonthlyReport) => void; onClose: () => void;
}> = ({ accounts, posts, expenses, quotes, reports, canEdit, onSaveReport, onClose }) => {
  const [period, setPeriod] = React.useState<Period>(() => monthPeriod(ymNow()));
  const ym = period.ym;                                   // mese di riferimento (spese)
  const repId = `__global__${period.key}`;
  const savedRep = reports.find((r) => r.id === repId);
  const [conclusions, setConclusions] = React.useState(savedRep?.conclusions || '');
  React.useEffect(() => setConclusions(savedRep?.conclusions || ''), [repId]); // eslint-disable-line
  const monthExpTot = expenses.filter((e) => (e.date || '').slice(0, 7) === ym).reduce((s, e) => s + (e.amount || 0), 0);
  const sent = quotes.filter((q: any) => q.status === 'in_attesa');
  const toSend = quotes.filter((q: any) => q.status === 'elaborato');

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-3xl my-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 no-print">
          <h3 className="text-[17px] font-extrabold text-[#161616]">Report riunione marketing</h3>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <PeriodSelect value={period} onChange={setPeriod} />
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Printer className="w-4 h-4" /> Stampa</button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="print-area flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#b45309' }}>Strategico · Riunione marketing {period.mode === 'settimana' ? 'settimanale' : 'mensile'}</p>
            <h3 className="text-[22px] font-black text-[#161616] capitalize">{periodTitle(period)}</h3>
          </div>

          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">1 · Stato account</p>
            <div className="flex flex-col gap-1">
              {accounts.filter((a) => a.active !== false).map((a) => {
                const h = healthOf(a, posts);
                const st = HEALTH[h.state];
                const count = postsOf(a, posts).filter((p) => p.dateISO >= period.from && p.dateISO <= period.to).length;
                return (
                  <p key={a.id} className="text-[12.5px] text-[#555]">
                    <b className="text-[#161616]">{a.name}</b> — <span style={{ color: st.color }} className="font-extrabold">{st.label}</span> · {count} contenuti {period.mode === 'settimana' ? 'nella settimana' : 'nel mese'} · ultimo post {h.lastPub ? dISO(h.lastPub) : '—'} · prossima {h.nextPub ? dISO(h.nextPub) : '—'}
                    {a.kind === 'cliente' && !a.liberatoria ? <span className="text-rose-600 font-extrabold"> · MANCA LIBERATORIA</span> : null}
                  </p>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">2 · Spese marketing di {ymLabel(ym)}</p>
            <p className="text-[13px] font-extrabold text-[#161616]">{eur(monthExpTot)}</p>
          </div>

          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">3 · Preventivi Strategico</p>
            <p className="text-[12.5px] text-[#555] mb-1"><b className="text-[#161616]">Inviati / in attesa:</b> {sent.length === 0 ? 'nessuno' : sent.map((q: any) => `${q.clientName || 'Cliente'} (${eur(q.total || 0)})`).join(' · ')}</p>
            <p className="text-[12.5px] text-[#555]"><b className="text-[#161616]">Da inviare:</b> {toSend.length === 0 ? 'nessuno' : toSend.map((q: any) => `${q.clientName || 'Cliente'} (${eur(q.total || 0)})`).join(' · ')}</p>
          </div>

          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">4 · Conclusioni</p>
            <textarea
              disabled={!canEdit}
              value={conclusions}
              onChange={(e) => setConclusions(e.target.value)}
              onBlur={() => { if (canEdit && conclusions !== (savedRep?.conclusions || '')) onSaveReport?.({ id: repId, accountId: '__global__', ym: period.key, conclusions: conclusions || null, updatedAt: Date.now() }); }}
              rows={4}
              placeholder={period.mode === 'settimana' ? 'Decisioni della riunione, priorità della prossima settimana…' : 'Decisioni della riunione, strategia del mese prossimo…'}
              className={`${inp} resize-none`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Eventi & gadget / Blog (riuso socMkt)
const ExtrasTab: React.FC<{
  acc: MktAccount; kindTab: 'eventi' | 'blog'; extras: SocMktItem[]; canEdit: boolean;
  onSave?: (i: SocMktItem) => void; onDelete?: (id: string) => void;
}> = ({ acc, kindTab, extras, canEdit, onSave, onDelete }) => {
  const [editing, setEditing] = React.useState<SocMktItem | null>(null);
  const isEvents = kindTab === 'eventi';
  const list = extras
    .filter((i) => i.soc === acc.id && (isEvents ? (i.kind === 'evento' || i.kind === 'gadget') : i.kind === 'blog'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const blank = (kind: SocMktItem['kind']): SocMktItem => ({ id: `mk-${Date.now().toString(36)}`, soc: acc.id, kind, title: '', date: null, platform: kind === 'blog' ? 'Blog' : null, status: 'idea', createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(blank(isEvents ? 'evento' : 'blog'))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> {isEvents ? 'Nuovo evento' : 'Nuovo articolo'}</button>
          {isEvents && <button onClick={() => setEditing(blank('gadget'))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Gift className="w-3.5 h-3.5" /> Nuovo gadget</button>}
        </div>
      )}
      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun elemento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((i) => (
            <div key={i.id} onClick={() => setEditing(i)} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm cursor-pointer hover:border-[#cfcfcf] flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <b className="text-[14px] text-[#161616]">{i.title || 'Senza titolo'}</b>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">{i.kind === 'gadget' ? 'Gadget' : i.kind === 'evento' ? 'Evento' : 'Blog'}</span>
              </div>
              <p className="text-[11.5px] text-[#8a8a8a]">{[dISO(i.date), i.cost != null ? eur(i.cost) : null].filter(Boolean).join(' · ') || '—'}</p>
              {(i.notes || i.content) && <p className="text-[12px] text-[#555] line-clamp-2">{i.notes || i.content}</p>}
              {i.link && safeUrl(i.link) && <a href={safeUrl(i.link)!} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[11.5px] text-indigo-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Apri</a>}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-extrabold text-[#161616]">{editing.title ? 'Modifica' : 'Nuovo'} · {editing.kind === 'gadget' ? 'Gadget' : editing.kind === 'evento' ? 'Evento' : 'Articolo blog'}</h3>
              <div className="flex items-center gap-1">
                {canEdit && editing.title && onDelete && <button onClick={() => { onDelete(editing.id); setEditing(null); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
                <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <ExtraForm item={editing} canEdit={canEdit} onSave={(i) => { onSave?.(i); setEditing(null); }} />
          </div>
        </div>
      )}
    </div>
  );
};

const ExtraForm: React.FC<{ item: SocMktItem; canEdit: boolean; onSave: (i: SocMktItem) => void }> = ({ item, canEdit, onSave }) => {
  const [d, setD] = React.useState(item);
  const set = (c: Partial<SocMktItem>) => setD((p) => ({ ...p, ...c }));
  const isBlog = d.kind === 'blog';
  return (
    <div className="flex flex-col gap-3">
      <input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Titolo" className={inp} />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><span className={lbl}>Data</span><input disabled={!canEdit} type="date" value={d.date || ''} onChange={(e) => set({ date: e.target.value || null })} className={inp} /></label>
        {isBlog ? (
          <label className="flex flex-col gap-1"><span className={lbl}>Stato</span>
            <select disabled={!canEdit} value={d.status || 'idea'} onChange={(e) => set({ status: e.target.value as SocMktItem['status'] })} className={inp}>{ED_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        ) : (
          <label className="flex flex-col gap-1"><span className={lbl}>Costo €</span><input disabled={!canEdit} type="number" value={d.cost ?? ''} onChange={(e) => set({ cost: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
        )}
      </div>
      <label className="flex flex-col gap-1"><span className={lbl}>{isBlog ? 'Testo / bozza' : 'Note'}</span>
        <textarea disabled={!canEdit} value={(isBlog ? d.content : d.notes) || ''} onChange={(e) => set(isBlog ? { content: e.target.value || null } : { notes: e.target.value || null })} rows={3} className={`${inp} resize-none`} /></label>
      <label className="flex flex-col gap-1"><span className={lbl}>Link / URL</span><input disabled={!canEdit} value={d.link || ''} onChange={(e) => set({ link: e.target.value || null })} placeholder="https://…" className={inp} /></label>
      {canEdit && <button onClick={() => onSave({ ...d, title: d.title.trim() || 'Senza titolo', updatedAt: Date.now() })} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva</button>}
    </div>
  );
};

// ============================================================================
// Altro — comunicazioni in uscita (Newsletter · Ricorrenze · Recensioni) + Foto cantieri.
// Approccio "ibrido": genera testo + link mailto/wa.me pronti (niente invio
// automatico), salva i destinatari con stato su `mktOutreach` (predisposto per API).
// Destinatari SOLO con consenso (marketing/newsletter).
// ============================================================================
const enc = encodeURIComponent;
const waNum = (s?: string | null) => (s ? s.replace(/[^\d]/g, '').replace(/^00/, '') : '');
const mailtoBcc = (emails: string[], subject: string, body: string) =>
  `mailto:?bcc=${enc(emails.join(','))}&subject=${enc(subject)}&body=${enc(body)}`;
const waLink = (phone: string, text: string) => `https://wa.me/${waNum(phone)}?text=${enc(text)}`;

/** Pasqua (algoritmo gregoriano anonimo) → ISO yyyy-mm-dd. */
function easterISO(y: number): string {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${pad(mo)}-${pad(da)}`;
}
const festivitaOf = (y: number) => [
  { id: 'epifania', label: 'Epifania', date: `${y}-01-06` },
  { id: 'festa-donna', label: 'Festa della donna', date: `${y}-03-08` },
  { id: 'festa-papa', label: 'Festa del papà', date: `${y}-03-19` },
  { id: 'pasqua', label: 'Auguri di Pasqua', date: easterISO(y) },
  { id: 'festa-mamma', label: 'Festa della mamma', date: `${y}-05-11` },
  { id: 'ferragosto', label: 'Ferragosto', date: `${y}-08-15` },
  { id: 'natale', label: 'Buon Natale', date: `${y}-12-25` },
  { id: 'capodanno', label: 'Buon Anno', date: `${y}-12-31` },
];

const aiBtnCls = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e2e2e2] bg-white hover:bg-[#fafafa] text-[#b45309] text-[11.5px] font-bold cursor-pointer disabled:opacity-50';
const linkBtnCls = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none';
const softBtnCls = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer';

/** Bottone "✨ Bozza AI": riempie un testo via callAi (degrada se l'AI non è deployata). */
const AiDraft: React.FC<{ prompt: string; onResult: (t: string) => void; label?: string }> = ({ prompt, onResult, label }) => {
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const out = await callAi({ prompt, system: 'Sei il copywriter del gruppo Aulico (architettura/immobiliare, Puglia). Scrivi in italiano, tono caldo e professionale. Rispondi SOLO col testo del messaggio, senza preamboli né virgolette.', maxTokens: 320 });
      if (out && out.trim()) onResult(out.trim());
      else alert('AI non disponibile ora: scrivi il testo a mano (o riprova più tardi).');
    } catch { alert('AI non disponibile ora: scrivi il testo a mano.'); }
    finally { setLoading(false); }
  };
  return (
    <button type="button" onClick={run} disabled={loading} className={aiBtnCls} title="Genera una bozza con l'AI">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {label || 'Bozza AI'}
    </button>
  );
};

interface AltroProps {
  acc: MktAccount;
  canEdit: boolean;
  contacts: MktContact[];
  cantierePhotos: MktCantierePhoto[];
  outreach: MktOutreach[];
  onSaveOutreach?: (o: MktOutreach) => void;
  onDeleteOutreach?: (id: string) => void;
  onSaveAccount?: (a: MktAccount) => void;
  onSavePost?: (p: EditorialPost) => void;
}
type AltroTool = 'newsletter' | 'ricorrenza' | 'recensione' | 'foto';
const ALTRO_TOOLS: { id: AltroTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'ricorrenza', label: 'Messaggi ricorrenze', icon: Gift },
  { id: 'recensione', label: 'Recensioni', icon: Star },
  { id: 'foto', label: 'Foto cantieri', icon: Camera },
];

const AltroTab: React.FC<AltroProps> = (props) => {
  const { acc, canEdit, contacts, outreach } = props;
  const [tool, setTool] = React.useState<AltroTool>('newsletter');
  const isSoc = acc.kind === 'societa';
  // Destinatari con consenso, appartenenti alla società (per gli account-società).
  const audience = React.useMemo(
    () => contacts.filter((c) => c.category !== 'partner' && (c.consentNewsletter || c.consentMarketing) && (!isSoc || c.societies?.[acc.id])),
    [contacts, isSoc, acc.id],
  );
  const mine = React.useMemo(() => outreach.filter((o) => o.accountId === acc.id), [outreach, acc.id]);
  const mkId = (k: string) => `out-${acc.id}-${k}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const save = (o: MktOutreach) => props.onSaveOutreach?.(o);
  const recipientsFrom = (list: MktContact[]): Record<string, MktOutreachRecipient> =>
    Object.fromEntries(list.map((c) => [c.id, { contactId: c.id, name: c.name, email: c.email || null, phone: c.whatsapp || c.phone || null, status: 'inviato' as const, sentAt: Date.now() }]));

  return (
    <div className="flex flex-col gap-4">
      <div className="pillbar inline-flex flex-wrap items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start">
        {ALTRO_TOOLS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTool(id)} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tool === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tool === 'newsletter' && <NewsletterTool acc={acc} canEdit={canEdit} audience={audience} history={mine} mkId={mkId} onSave={save} recipientsFrom={recipientsFrom} onDelete={props.onDeleteOutreach} />}
      {tool === 'ricorrenza' && <RicorrenzeTool acc={acc} canEdit={canEdit} audience={audience} history={mine} mkId={mkId} onSave={save} recipientsFrom={recipientsFrom} onDelete={props.onDeleteOutreach} />}
      {tool === 'recensione' && <RecensioniTool acc={acc} canEdit={canEdit} audience={audience} history={mine} mkId={mkId} onSave={save} onSaveAccount={props.onSaveAccount} onDelete={props.onDeleteOutreach} />}
      {tool === 'foto' && <FotoCantieriTool acc={acc} canEdit={canEdit} photos={props.cantierePhotos} onSavePost={props.onSavePost} />}

      {/* Ancora in preparazione */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {[
          { t: 'Archivio idee', d: 'Spunti creativi, reel, headline e trend salvati con tag, riutilizzabili nelle campagne.' },
          { t: 'Minute riunioni', d: 'Sintesi AI delle riunioni, archiviate per account.' },
        ].map((x) => (
          <div key={x.t} className="bg-white border border-dashed border-[#d8d8d4] rounded-[20px] p-4">
            <b className="text-[13.5px] text-[#8a8a8a]">{x.t}</b>
            <p className="text-[11.5px] text-[#a8a8a8] mt-1">{x.d}</p>
            <span className="inline-block mt-2 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f0f0ee] text-[#9a9a9a]">In preparazione</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Riquadro comune con avviso destinatari + storico invii. */
const AudienceNote: React.FC<{ acc: MktAccount; count: number; withEmail?: number }> = ({ acc, count, withEmail }) => (
  <div className="text-[11.5px] text-[#8a8a8a] bg-[#f7f7f5] border border-[#eee] rounded-xl px-3 py-2">
    {acc.kind === 'societa' ? (
      <><b className="text-[#161616]">{count}</b> contatti con consenso {typeof withEmail === 'number' ? <>· <b className="text-[#161616]">{withEmail}</b> con email</> : null} appartenenti a <b>{acc.name}</b>.</>
    ) : (
      <>Per i clienti terzi i destinatari vanno gestiti dal cliente stesso: qui prepari solo il testo e i materiali.</>
    )}{' '}Solo chi ha dato il consenso (marketing/newsletter) compare qui.
  </div>
);
const OutreachHistory: React.FC<{ items: MktOutreach[]; onDelete?: (id: string) => void }> = ({ items, onDelete }) => (
  items.length === 0 ? null : (
    <div className="flex flex-col gap-1.5">
      <span className={lbl}>Storico</span>
      {items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 12).map((o) => (
        <div key={o.id} className="flex items-center justify-between gap-2 text-[12px] px-3 py-1.5 rounded-lg bg-white border border-[#eee]">
          <span className="truncate"><CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600 mr-1.5" />{o.title}</span>
          <span className="flex items-center gap-2 shrink-0 text-[#9a9a9a]">
            {o.recipients ? `${Object.keys(o.recipients).length} dest.` : ''} · {new Date(o.createdAt).toLocaleDateString('it-IT')}
            {onDelete && <button onClick={() => onDelete(o.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"><Trash2 className="w-3.5 h-3.5" /></button>}
          </span>
        </div>
      ))}
    </div>
  )
);

// ---- Newsletter -------------------------------------------------------------
interface ToolProps {
  acc: MktAccount; canEdit: boolean; audience: MktContact[]; history: MktOutreach[];
  mkId: (k: string) => string; onSave: (o: MktOutreach) => void;
  recipientsFrom: (l: MktContact[]) => Record<string, MktOutreachRecipient>;
  onDelete?: (id: string) => void;
}
const NewsletterTool: React.FC<ToolProps> = ({ acc, canEdit, audience, history, mkId, onSave, recipientsFrom, onDelete }) => {
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const withEmail = audience.filter((c) => c.email);
  const emails = withEmail.map((c) => c.email!) as string[];
  const canSend = canEdit && subject.trim() && body.trim() && emails.length > 0;
  const logSent = () => onSave({ id: mkId('nl'), accountId: acc.id, kind: 'newsletter', title: subject.trim(), body, channel: 'email', recipients: recipientsFrom(withEmail), status: 'inviata', createdAt: Date.now() });
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-[14px] font-extrabold text-[#161616] inline-flex items-center gap-2"><Mail className="w-4 h-4" /> Newsletter</h4>
        <AiDraft label="Bozza AI" prompt={`Scrivi una breve newsletter (max 120 parole) per "${acc.name}"${acc.tone ? `, tono ${acc.tone}` : ''}${acc.goals ? `. Obiettivo: ${acc.goals}` : ''}. Oggetto: "${subject || 'aggiornamento'}". Includi un saluto e una call to action gentile.`} onResult={(t) => setBody(t)} />
      </div>
      <AudienceNote acc={acc} count={audience.length} withEmail={withEmail.length} />
      <input disabled={!canEdit} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Oggetto della newsletter" className={inp} />
      <textarea disabled={!canEdit} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Testo della newsletter…" rows={7} className={inp + ' resize-y min-h-[120px]'} />
      <div className="flex items-center gap-2 flex-wrap">
        <a href={canSend ? mailtoBcc(emails, subject, body) : undefined} onClick={() => canSend && logSent()} className={`${linkBtnCls} ${canSend ? '' : 'opacity-40 pointer-events-none'}`}><Send className="w-4 h-4" /> Apri email ({emails.length} in ccn)</a>
        <button onClick={() => { navigator.clipboard?.writeText(body); }} disabled={!body.trim()} className={softBtnCls + ' disabled:opacity-40'}><Copy className="w-4 h-4" /> Copia testo</button>
      </div>
      <p className="text-[10.5px] text-[#a8a8a8]">I destinatari vanno in <b>copia nascosta (ccn)</b>. Quando l'invio email automatico sarà attivo, questa lista verrà usata dal backend.</p>
      <OutreachHistory items={history.filter((o) => o.kind === 'newsletter')} onDelete={onDelete} />
    </div>
  );
};

// ---- Ricorrenze -------------------------------------------------------------
const RicorrenzeTool: React.FC<ToolProps> = ({ acc, canEdit, audience, history, mkId, onSave, recipientsFrom, onDelete }) => {
  const year = new Date().getFullYear();
  const upcoming = React.useMemo(() => {
    const t = todayISO();
    const all = [...festivitaOf(year), ...festivitaOf(year + 1)];
    return all.filter((f) => f.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [year]);
  const [occId, setOccId] = React.useState(upcoming[0]?.id || 'custom');
  const occ = upcoming.find((u) => u.id === occId);
  const [title, setTitle] = React.useState(occ?.label || '');
  const [body, setBody] = React.useState('');
  React.useEffect(() => { setTitle(occ?.label || title); }, [occId]); // eslint-disable-line
  const withContact = audience.filter((c) => c.email || c.whatsapp || c.phone);
  const canLog = canEdit && title.trim() && body.trim() && withContact.length > 0;
  const logSent = () => onSave({ id: mkId('ric'), accountId: acc.id, kind: 'ricorrenza', title: title.trim(), body, occasion: occId, channel: 'misto', recipients: recipientsFrom(withContact), status: 'inviata', createdAt: Date.now() });
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-[14px] font-extrabold text-[#161616] inline-flex items-center gap-2"><Gift className="w-4 h-4" /> Messaggi per ricorrenze</h4>
        <AiDraft label="Bozza AI" prompt={`Scrivi un messaggio breve (max 45 parole) di auguri per l'occasione "${title || 'ricorrenza'}" da parte di "${acc.name}"${acc.tone ? `, tono ${acc.tone}` : ''}. Personale e caloroso, adatto a WhatsApp/email.`} onResult={(t) => setBody(t)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><span className={lbl}>Occasione</span>
          <select disabled={!canEdit} value={occId} onChange={(e) => setOccId(e.target.value)} className={inp}>
            {upcoming.map((f) => <option key={f.id} value={f.id}>{f.label} · {dISO(f.date)}</option>)}
            <option value="custom">Occasione personalizzata…</option>
          </select>
        </label>
        <label className="flex flex-col gap-1"><span className={lbl}>Titolo</span>
          <input disabled={!canEdit} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Anniversario ingresso in casa" className={inp} />
        </label>
      </div>
      <textarea disabled={!canEdit} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Testo degli auguri…" rows={4} className={inp + ' resize-y'} />
      <AudienceNote acc={acc} count={audience.length} />
      {canEdit && withContact.length > 0 && body.trim() && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {withContact.slice(0, 40).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-[12px] px-3 py-1.5 rounded-lg bg-[#fafafa] border border-[#eee]">
              <span className="truncate">{c.name}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                {(c.whatsapp || c.phone) && <a href={waLink(c.whatsapp || c.phone!, body)} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a>}
                {c.email && <a href={`mailto:${c.email}?subject=${enc(title)}&body=${enc(body)}`} className="text-[#161616] hover:text-black" title="Email"><Mail className="w-4 h-4" /></a>}
              </span>
            </div>
          ))}
        </div>
      )}
      <div><button onClick={logSent} disabled={!canLog} className={linkBtnCls + ' disabled:opacity-40'}><CheckCircle2 className="w-4 h-4" /> Segna come inviati ({withContact.length})</button></div>
      <OutreachHistory items={history.filter((o) => o.kind === 'ricorrenza')} onDelete={onDelete} />
    </div>
  );
};

// ---- Recensioni -------------------------------------------------------------
const RecensioniTool: React.FC<Omit<ToolProps, 'recipientsFrom'> & { onSaveAccount?: (a: MktAccount) => void }> = ({ acc, canEdit, audience, history, mkId, onSave, onSaveAccount, onDelete }) => {
  const [reviewUrl, setReviewUrl] = React.useState(acc.reviewUrl || '');
  const [body, setBody] = React.useState('');
  const saved = (acc.reviewUrl || '') === reviewUrl.trim();
  const targets = audience.filter((c) => c.whatsapp || c.phone || c.email);
  const msg = (name: string) => `${body}${reviewUrl.trim() ? `\n\n${reviewUrl.trim()}` : ''}`.replace('{nome}', name);
  const logOne = (c: MktContact) => onSave({ id: mkId('rev'), accountId: acc.id, kind: 'recensione', title: `Recensione — ${c.name}`, body, reviewUrl: reviewUrl.trim() || null, channel: c.whatsapp || c.phone ? 'whatsapp' : 'email', recipients: { [c.id]: { contactId: c.id, name: c.name, email: c.email || null, phone: c.whatsapp || c.phone || null, status: 'inviato', sentAt: Date.now() } }, status: 'inviata', createdAt: Date.now() });
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-[14px] font-extrabold text-[#161616] inline-flex items-center gap-2"><Star className="w-4 h-4" /> Richieste di recensione</h4>
        <AiDraft label="Bozza AI" prompt={`Scrivi un messaggio breve (max 40 parole) che chiede gentilmente una recensione a un cliente soddisfatto di "${acc.name}". Usa il segnaposto {nome} per il nome. Non includere il link (verrà aggiunto dopo).`} onResult={(t) => setBody(t)} />
      </div>
      <label className="flex flex-col gap-1"><span className={lbl}>Link recensione (Google, Trustpilot…)</span>
        <div className="flex items-center gap-2">
          <input disabled={!canEdit} value={reviewUrl} onChange={(e) => setReviewUrl(e.target.value)} placeholder="https://g.page/…/review" className={inp} />
          {canEdit && onSaveAccount && !saved && <button onClick={() => onSaveAccount({ ...acc, reviewUrl: reviewUrl.trim() || null })} className={softBtnCls}>Salva</button>}
        </div>
      </label>
      <textarea disabled={!canEdit} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Messaggio (usa {nome} per personalizzare)…" rows={3} className={inp + ' resize-y'} />
      <AudienceNote acc={acc} count={audience.length} />
      {canEdit && targets.length > 0 && body.trim() && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          {targets.slice(0, 40).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-[12px] px-3 py-1.5 rounded-lg bg-[#fafafa] border border-[#eee]">
              <span className="truncate">{c.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                {(c.whatsapp || c.phone) && <a href={waLink(c.whatsapp || c.phone!, msg(c.name))} onClick={() => logOne(c)} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a>}
                {c.email && <a href={`mailto:${c.email}?subject=${enc('La tua opinione conta')}&body=${enc(msg(c.name))}`} onClick={() => logOne(c)} className="text-[#161616]" title="Email"><Mail className="w-4 h-4" /></a>}
              </span>
            </div>
          ))}
        </div>
      )}
      {targets.length === 0 && <p className="text-[11.5px] text-[#a8a8a8]">Nessun destinatario con consenso e recapito.</p>}
      <OutreachHistory items={history.filter((o) => o.kind === 'recensione')} onDelete={onDelete} />
    </div>
  );
};

// ---- Foto cantieri ----------------------------------------------------------
const FotoCantieriTool: React.FC<{ acc: MktAccount; canEdit: boolean; photos: MktCantierePhoto[]; onSavePost?: (p: EditorialPost) => void }> = ({ acc, canEdit, photos, onSavePost }) => {
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const mine = photos.filter((ph) => ph.division === acc.id);
  const useInCalendar = (ph: MktCantierePhoto) => {
    if (!onSavePost) return;
    const id = `ed-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    onSavePost({
      id, channel: acc.id, dateISO: todayISO(), status: 'idea',
      topic: `Cantiere ${ph.cantiereName || ''}`.trim(), caption: ph.caption || '',
      media: [{ id: `m-${id}`, type: 'image', url: ph.url, name: ph.cantiereName || 'Foto cantiere', source: 'link' }],
      createdAt: Date.now(),
    });
    setDone((d) => ({ ...d, [ph.id]: true }));
  };
  if (acc.kind !== 'societa') return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-6 text-center text-[12.5px] text-[#8a8a8a]">Le foto cantiere sono disponibili solo per gli account delle società del gruppo (Onirico/Materico/Unico).</div>
  );
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex flex-col gap-3">
      <h4 className="text-[14px] font-extrabold text-[#161616] inline-flex items-center gap-2"><Camera className="w-4 h-4" /> Foto cantieri · {acc.name}</h4>
      {mine.length === 0 ? (
        <p className="text-[12.5px] text-[#8a8a8a] py-6 text-center">Nessuna foto dai cantieri di {acc.name}. Le foto caricate nel modulo Cantiere compaiono qui.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {mine.sort((a, b) => (b.takenAt || 0) - (a.takenAt || 0)).slice(0, 60).map((ph) => (
            <div key={ph.id} className="rounded-2xl overflow-hidden border border-[#eee] bg-[#fafafa] flex flex-col">
              <div className="aspect-square bg-[#f0f0ee] overflow-hidden">
                <img src={safeUrl(ph.url) || ''} alt={ph.cantiereName || 'Foto cantiere'} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2 flex flex-col gap-1.5">
                <span className="text-[10.5px] font-bold text-[#161616] truncate">{ph.cantiereName}</span>
                <span className="text-[9.5px] text-[#9a9a9a]">{ph.takenAt ? new Date(ph.takenAt).toLocaleDateString('it-IT') : ''}</span>
                {canEdit && onSavePost && (
                  <button onClick={() => useInCalendar(ph)} disabled={done[ph.id]} className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-[#161616] text-white cursor-pointer border-none disabled:opacity-40 inline-flex items-center justify-center gap-1">
                    {done[ph.id] ? <><CheckCircle2 className="w-3 h-3" /> Aggiunta</> : <><Plus className="w-3 h-3" /> Nel calendario</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketingHub;
