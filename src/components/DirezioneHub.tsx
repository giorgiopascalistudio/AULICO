/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DirezioneHub — Centro Direzione di Strategico (Amministrazione & Contabilità).
 * Modellato sulla "RIUNIONE STRATEGICA CONTABILITÀ" (PDF 01/04-2026): Strategico
 * amministra la contabilità di TUTTE le società del gruppo. Due livelli:
 *   1. CENTRO — salute economica di ogni società (fatturato/incassato/costi/
 *      liquidità del mese, BEP sopra/sotto, avanzamento obiettivi) + alert.
 *   2. WORKSPACE SOCIETÀ — le 8 sezioni della riunione: Statistiche KPI
 *      (preventivato·venduto·fatturato·incassato·erogato·liquidità·punti,
 *      calcolate dai dati dell'app; liquidità manuale) · Piano finanziario ·
 *      IVA & Fiscale · Programmazione (fatturazione + costi) · Break Even Point ·
 *      Budget per aree · Cicli aperti · Obiettivi · Report riunione stampabile.
 */
import React from 'react';
import {
  Briefcase, ArrowLeft, Plus, X, Trash2, BarChart3, DollarSign, Scale,
  CalendarClock, Target, FolderOpen, Printer, FileText, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Landmark, ExternalLink,
} from 'lucide-react';
import type {
  Quote, PointEvent, PianoFinanziario, FatturazionePlanItem, FiscaleItem,
  FinTargets, FinLiquidity, FinCostPlanItem, FinBudgetArea, FinCiclo, FinReport,
} from '../types';
import type { InvoiceActive, InvoicePassive, ScadenzaItem } from '../finance';
import { eur } from '../utils';
import { SOCIETA_LABEL } from '../access';
import { SOCIETY_COLOR } from '../societyConfig';
import PianoFinanziarioView from './PianoFinanziarioView';
import ProgFatturazioneView from './ProgFatturazioneView';
import FiscaleView from './FiscaleView';

// ---------------------------------------------------------------- helpers
const pad = (n: number) => String(n).padStart(2, '0');
const ymNow = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const ymLabel = (ym: string) => { const [y, m] = ym.split('-').map(Number); return new Date(y, (m || 1) - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); };
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';
const nfmt = (v: number) => v.toLocaleString('it-IT', { maximumFractionDigits: 0 });

export const DIREZIONE_SOCS = ['studio', 'strategico', 'materico', 'unico', 'fantastico'] as const;
const socLabel = (s: string) => (SOCIETA_LABEL as any)[s] || s;
const socColor = (s: string) => (SOCIETY_COLOR as any)[s] || '#8a8a8a';

/** Mese (0-11) di una data ISO/di un timestamp, se cade nell'anno dato; altrimenti -1. */
const monthIn = (year: number, d?: string | number | null): number => {
  if (d == null || d === '') return -1;
  const dt = typeof d === 'number' ? new Date(d) : new Date(d);
  if (Number.isNaN(dt.getTime()) || dt.getFullYear() !== year) return -1;
  return dt.getMonth();
};
const z12 = () => Array.from({ length: 12 }, () => 0);
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

// ---------------------------------------------------------------- motore KPI
export interface DirezioneData {
  quotes: Quote[];
  invA: InvoiceActive[];
  invP: InvoicePassive[];
  scadenze: ScadenzaItem[];
  pointEvents: PointEvent[];
  liquidity: FinLiquidity[];
}
export interface KpiSeries {
  preventivato: number[]; venduto: number[]; fatturato: number[]; incassato: number[];
  erogato: number[]; punti: number[]; liquidita: (number | null)[]; costi: number[];
}
/** Serie mensili per società/anno, calcolate dai dati dell'app (liquidità manuale). */
export function kpiSeries(soc: string, year: number, d: DirezioneData): KpiSeries {
  const s: KpiSeries = { preventivato: z12(), venduto: z12(), fatturato: z12(), incassato: z12(), erogato: z12(), punti: z12(), liquidita: Array.from({ length: 12 }, () => null), costi: z12() };
  d.quotes.filter((q) => q.division === soc).forEach((q) => {
    const m = monthIn(year, q.createdAt); if (m >= 0) s.preventivato[m] += q.total || 0;
    if (q.status === 'accettato') { const mv = monthIn(year, q.signedAt || q.updatedAt || q.createdAt); if (mv >= 0) s.venduto[mv] += q.total || 0; }
  });
  d.invA.filter((i) => i.sector === soc && i.status !== 'bozza').forEach((i) => {
    const m = monthIn(year, i.date); if (m >= 0) s.fatturato[m] += Number(i.amount) || 0;
    if (i.status === 'pagata') { const mi = monthIn(year, i.date); if (mi >= 0) s.incassato[mi] += Number(i.amount) || 0; }
  });
  d.invP.filter((i) => i.sector === soc).forEach((i) => {
    const m = monthIn(year, i.date); if (m >= 0) s.costi[m] += Number(i.amount) || 0;
  });
  if (soc === 'studio') {
    // Erogato e punti (sistema punti) sono dello studio operativo
    d.pointEvents.forEach((e) => {
      const m = monthIn(year, e.date); if (m < 0) return;
      s.erogato[m] += Number(e.value) || 0; s.punti[m] += Number(e.points) || 0;
    });
  }
  d.liquidity.filter((l) => l.soc === soc && l.ym.startsWith(String(year))).forEach((l) => {
    const m = Number(l.ym.slice(5)) - 1; if (m >= 0 && m < 12) s.liquidita[m] = l.amount;
  });
  return s;
}

/** BEP mensile: CF/CV dal Piano finanziario (consuntivo), fatturato dalle fatture. */
export function bepRows(soc: string, year: number, piani: Record<string, PianoFinanziario>, fatturato: number[], costi: number[]) {
  const piano = piani[`${soc}-${year}`];
  const cf = z12(); const cv = z12();
  let fromPiano = false;
  if (piano?.rows?.length) {
    piano.rows.forEach((r) => {
      const dst = r.section === 'costi_fissi' ? cf : r.section === 'costi_variabili' ? cv : null;
      if (dst) (r.values || []).forEach((v, i) => { if (i < 12) dst[i] += Number(v) || 0; });
    });
    fromPiano = sum(cf) + sum(cv) > 0;
  }
  return Array.from({ length: 12 }, (_, m) => {
    const CF = fromPiano ? cf[m] : costi[m];   // fallback: tutti i costi registrati come fissi
    const CV = fromPiano ? cv[m] : 0;
    const F = fatturato[m];
    const MC = F - CV;
    const mcPct = F > 0 ? MC / F : 0;
    const bep = mcPct > 0 ? CF / mcPct : (CF > 0 ? Infinity : 0);
    return { m, CF, CV, F, MC, mcPct, bep, sopra: F >= bep && (F > 0 || CF === 0), fromPiano };
  });
}

// ---------------------------------------------------------------- props
interface Props {
  quotes: Quote[];
  invA: InvoiceActive[];
  invP: InvoicePassive[];
  scadenze: ScadenzaItem[];
  pointEvents: PointEvent[];
  piani: Record<string, PianoFinanziario>;
  fattPlan: FatturazionePlanItem[];
  fiscale: FiscaleItem[];
  targets: FinTargets[];
  liquidity: FinLiquidity[];
  costPlan: FinCostPlanItem[];
  budget: FinBudgetArea[];
  cicli: FinCiclo[];
  reports: FinReport[];
  team: { uid: string; name: string }[];
  clientTiers: Record<string, number>;          // clientRecordId → fascia 1/2/3
  rubricaOpts: { id: string; name: string }[];
  color?: string;
  canEdit?: boolean;
  onSaveTargets?: (t: FinTargets) => void;
  onSaveLiquidity?: (l: FinLiquidity) => void;
  onSaveCostPlan?: (i: FinCostPlanItem) => void;
  onDeleteCostPlan?: (id: string) => void;
  onSaveBudget?: (b: FinBudgetArea) => void;
  onDeleteBudget?: (id: string) => void;
  onSaveCiclo?: (c: FinCiclo) => void;
  onDeleteCiclo?: (id: string) => void;
  onSaveReport?: (r: FinReport) => void;
  onSavePiano?: (p: PianoFinanziario) => void;
  onSaveFatturazione?: (i: FatturazionePlanItem) => void;
  onDeleteFatturazione?: (id: string) => void;
  onEmitFatturazione?: (i: FatturazionePlanItem) => void;
  onSaveFiscale?: (i: FiscaleItem) => void;
  onDeleteFiscale?: (id: string) => void;
  onOpenContabilita?: (soc: string) => void;    // salta alla contabilità operativa (Finanze)
}

type WsTab = 'kpi' | 'piano' | 'iva' | 'prog' | 'bep' | 'budget' | 'cicli' | 'obiettivi' | 'report';
const WS_TABS: { id: WsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'kpi', label: 'KPI', icon: BarChart3 },
  { id: 'piano', label: 'Piano finanziario', icon: DollarSign },
  { id: 'iva', label: 'IVA & Fiscale', icon: Scale },
  { id: 'prog', label: 'Programmazione', icon: CalendarClock },
  { id: 'bep', label: 'BEP', icon: TrendingUp },
  { id: 'budget', label: 'Budget', icon: Landmark },
  { id: 'cicli', label: 'Cicli aperti', icon: FolderOpen },
  { id: 'obiettivi', label: 'Obiettivi', icon: Target },
  { id: 'report', label: 'Report', icon: FileText },
];

// Aree budget standard (PDF "Budget aziendale 2026")
const BUDGET_AREAS = [
  'AREA DIREZIONE', 'AREA AMMINISTRATIVA', 'AREA MARKETING', 'AREA HR', 'AREA PRODUZIONE',
  'AREA PRODUZIONE ESTERNA', 'AREA FORMAZIONE', 'AREA SOFTW E STRUM LAVORO',
  'IMPOSTE E CONTRIBUTI', 'COSTI VARIABILI', 'INARCASSA', 'NUOVE SOCIETA\'',
];
// Categorie programmazione costi (Excel "Programmazione costi")
const COST_CATEGORIES = [
  'IMPOSTE E CONTRIBUTI', 'CONSULENTI', 'COLLABORATORI', 'MARKETING', 'LEASING',
  'SOFTWARE', 'SPESE MENSILI', 'FORMAZIONE', 'SPESE ANTICIPATE', 'ACQUISTI', 'EXTRA',
];
// Gruppi dei cicli aperti (PDF "Cicli aperti")
const CICLI_GROUPS = ['Struttura societaria', 'Immobili di proprietà', 'Immobili di investimento', 'Ottimizzazione liquidità', 'Organizzazione interna', 'Acquisti da fare', 'Altro'];

const TARGET_FIELDS: { key: keyof FinTargets; label: string }[] = [
  { key: 'fatturato', label: 'Fatturato' }, { key: 'costi', label: 'Costi' },
  { key: 'utile', label: 'Utile' }, { key: 'preventivato', label: 'Preventivato' },
  { key: 'venduto', label: 'Venduto' }, { key: 'erogato', label: 'Erogato' },
  { key: 'punti', label: 'Punti' }, { key: 'liquidita', label: 'Liquidità' },
];

// ============================================================================
export const DirezioneHub: React.FC<Props> = (props) => {
  const [activeSoc, setActiveSoc] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<WsTab>('kpi');
  const open = (s: string, t: WsTab = 'kpi') => { setActiveSoc(s); setTab(t); };
  if (activeSoc) return <Workspace {...props} soc={activeSoc} tab={tab} onTab={setTab} onBack={() => setActiveSoc(null)} />;
  return <Centro {...props} onOpen={open} />;
};

// ============================================================================
// LIVELLO 1 — CENTRO DIREZIONE
// ============================================================================
const Centro: React.FC<Props & { onOpen: (s: string, t?: WsTab) => void }> = (p) => {
  const { color = '#b45309', onOpen } = p;
  const year = new Date().getFullYear();
  const ym = ymNow();
  const mIdx = Number(ym.slice(5)) - 1;
  const data: DirezioneData = { quotes: p.quotes, invA: p.invA, invP: p.invP, scadenze: p.scadenze, pointEvents: p.pointEvents, liquidity: p.liquidity };

  const per = React.useMemo(() => {
    const m: Record<string, { s: KpiSeries; bep: ReturnType<typeof bepRows> }> = {};
    DIREZIONE_SOCS.forEach((soc) => {
      const s = kpiSeries(soc, year, data);
      m[soc] = { s, bep: bepRows(soc, year, p.piani, s.fatturato, s.costi) };
    });
    return m;
  }, [p.quotes, p.invA, p.invP, p.pointEvents, p.liquidity, p.piani, year]); // eslint-disable-line

  const grpF = DIREZIONE_SOCS.reduce((s, x) => s + per[x].s.fatturato[mIdx], 0);
  const grpI = DIREZIONE_SOCS.reduce((s, x) => s + per[x].s.incassato[mIdx], 0);
  const grpC = DIREZIONE_SOCS.reduce((s, x) => s + per[x].s.costi[mIdx], 0);
  const today = new Date().toISOString().slice(0, 10);
  const openScad = p.scadenze.filter((s) => s.status !== 'pagato');
  const lateScad = openScad.filter((s) => (s.dueDate || '') < today);

  const alerts: { text: string; soc: string }[] = [];
  DIREZIONE_SOCS.forEach((soc) => {
    const { s, bep } = per[soc];
    const b = bep[mIdx];
    if (b.F > 0 && !b.sopra) alerts.push({ text: `${socLabel(soc)}: fatturato del mese sotto il punto di pareggio (${eur(b.F)} su BEP ${b.bep === Infinity ? '—' : eur(b.bep)}).`, soc });
    if (s.liquidita[mIdx] == null && (s.fatturato[mIdx] > 0 || soc === 'studio' || soc === 'strategico')) alerts.push({ text: `${socLabel(soc)}: liquidità di ${MESI[mIdx].toLowerCase()} non ancora inserita.`, soc });
    const late = lateScad.filter((x) => x.sector === soc);
    if (late.length) alerts.push({ text: `${socLabel(soc)}: ${late.length} scadenz${late.length === 1 ? 'a' : 'e'} oltre la data (${eur(late.reduce((t, x) => t + (x.amount || 0), 0))}).`, soc });
  });

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
            <Briefcase className="w-5.5 h-5.5" style={{ color }} /> Centro Direzione
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">
            Amministrazione & contabilità di tutte le società del gruppo — le sezioni della riunione strategica, per società.
          </p>
        </div>
        {p.onOpenContabilita && (
          <button onClick={() => p.onOpenContabilita!('studio')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer">
            <ExternalLink className="w-4 h-4" /> Contabilità operativa
          </button>
        )}
      </div>

      {/* KPI di gruppo del mese */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: `Fatturato ${MESI[mIdx].toLowerCase()} (gruppo)`, v: eur(grpF) },
          { l: 'Incassato (gruppo)', v: eur(grpI) },
          { l: 'Costi (gruppo)', v: eur(grpC) },
          { l: 'Scadenze aperte', v: String(openScad.length), c: lateScad.length ? '#e11d48' : undefined },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Alert */}
      {alerts.length > 0 && (
        <div className="bg-white border border-[#f3d9b1] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#b45309] inline-flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Richiede attenzione</p>
          <div className="flex flex-col gap-1.5">
            {alerts.slice(0, 7).map((a, i) => (
              <button key={i} onClick={() => onOpen(a.soc)} className="text-left text-[12.5px] text-[#555] hover:text-[#161616] cursor-pointer bg-transparent border-none p-0 font-semibold">· {a.text}</button>
            ))}
          </div>
        </div>
      )}

      {/* Card per società */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DIREZIONE_SOCS.map((soc) => {
          const { s, bep } = per[soc];
          const b = bep[mIdx];
          const t = p.targets.find((x) => x.id === `${soc}-${year}`);
          const ytdF = sum(s.fatturato.slice(0, mIdx + 1));
          const liq = [...s.liquidita].reverse().find((v) => v != null);
          const pct = t?.fatturato ? Math.min(100, (ytdF / t.fatturato) * 100) : null;
          return (
            <button key={soc} onClick={() => onOpen(soc)} className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: socColor(soc) }} /><b className="text-[14.5px] text-[#161616]">{socLabel(soc)}</b></span>
                {b.F > 0 ? (
                  b.sopra
                    ? <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> sopra BEP</span>
                    : <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-rose-600 bg-rose-50 inline-flex items-center gap-1"><TrendingDown className="w-3 h-3" /> sotto BEP</span>
                ) : <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-[#9a9a9a] bg-[#f3f3f1]">nessun dato mese</span>}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1 text-[11.5px] text-[#8a8a8a] font-semibold">
                <span>Fatturato mese: <b className="text-[#555]">{eur(s.fatturato[mIdx])}</b></span>
                <span>Incassato: <b className="text-[#555]">{eur(s.incassato[mIdx])}</b></span>
                <span>Costi mese: <b className="text-[#555]">{eur(s.costi[mIdx])}</b></span>
                <span>Liquidità: <b className="text-[#555]">{liq != null ? eur(liq) : '—'}</b></span>
              </div>
              {pct != null && (
                <div className="mt-2.5">
                  <div className="h-2 rounded-full bg-[#f0f0f0] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: socColor(soc) }} /></div>
                  <p className="text-[10px] text-[#9a9a9a] font-semibold mt-1">Obiettivo fatturato {year}: {eur(ytdF)} su {eur(t!.fatturato!)} ({Math.round(pct)}%)</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#a8a8a8] font-semibold">Il report della riunione strategica è dentro ogni società (tab "Report").</p>
    </div>
  );
};

// ============================================================================
// LIVELLO 2 — WORKSPACE SOCIETÀ
// ============================================================================
const Workspace: React.FC<Props & { soc: string; tab: WsTab; onTab: (t: WsTab) => void; onBack: () => void }> = (p) => {
  const { soc, tab, onTab, onBack, canEdit = false } = p;
  const [year, setYear] = React.useState(new Date().getFullYear());
  const data: DirezioneData = { quotes: p.quotes, invA: p.invA, invP: p.invP, scadenze: p.scadenze, pointEvents: p.pointEvents, liquidity: p.liquidity };
  const s = React.useMemo(() => kpiSeries(soc, year, data), [soc, year, p.quotes, p.invA, p.invP, p.pointEvents, p.liquidity]); // eslint-disable-line
  const bep = React.useMemo(() => bepRows(soc, year, p.piani, s.fatturato, s.costi), [soc, year, p.piani, s]);
  const targets = p.targets.find((x) => x.id === `${soc}-${year}`) || null;

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0" title="Centro Direzione"><ArrowLeft className="w-4 h-4" /></button>
          <div className="min-w-0">
            <h2 className="text-[20px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: socColor(soc) }} />{socLabel(soc)} · Direzione</h2>
            <p className="text-[11.5px] text-[#8a8a8a] font-semibold">Le sezioni della riunione strategica contabilità.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white cursor-pointer">
            {[year - 2, year - 1, year, year + 1].filter((y, i, a) => a.indexOf(y) === i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {p.onOpenContabilita && (
            <button onClick={() => p.onOpenContabilita!(soc)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[11.5px] font-bold cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /> Contabilità</button>
          )}
        </div>
      </div>
      <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap self-start">
        {WS_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onTab(id)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}><Icon className="w-3.5 h-3.5" /> {label}</button>
        ))}
      </div>

      {tab === 'kpi' && <KpiTab soc={soc} year={year} s={s} targets={targets} team={p.team} pointEvents={p.pointEvents} quotes={p.quotes} clientTiers={p.clientTiers} canEdit={canEdit} onSaveLiquidity={p.onSaveLiquidity} />}
      {tab === 'piano' && (
        <PianoFinanziarioView
          piano={p.piani[`${soc}-${year}`] || null}
          soc={soc} socLabel={socLabel(soc)} year={year} color={socColor(soc)} canEdit={canEdit}
          onChangeYear={setYear} onSave={p.onSavePiano}
          kpi={{ preventivato: sum(s.preventivato), venduto: sum(s.venduto), fatturato: sum(s.fatturato), incassato: sum(s.incassato), erogato: sum(s.erogato), liquidita: [...s.liquidita].reverse().find((v) => v != null) ?? undefined }}
        />
      )}
      {tab === 'iva' && <IvaTab soc={soc} year={year} invA={p.invA} fiscale={p.fiscale} canEdit={canEdit} onSaveFiscale={p.onSaveFiscale} onDeleteFiscale={p.onDeleteFiscale} />}
      {tab === 'prog' && <ProgTab {...p} soc={soc} />}
      {tab === 'bep' && <BepTab year={year} rows={bep} />}
      {tab === 'budget' && <BudgetTab soc={soc} year={year} budget={p.budget} costiAnno={sum(s.costi)} canEdit={canEdit} onSave={p.onSaveBudget} onDelete={p.onDeleteBudget} />}
      {tab === 'cicli' && <CicliTab soc={soc} cicli={p.cicli} canEdit={canEdit} onSave={p.onSaveCiclo} onDelete={p.onDeleteCiclo} />}
      {tab === 'obiettivi' && <ObiettiviTab soc={soc} year={year} s={s} targets={targets} canEdit={canEdit} onSave={p.onSaveTargets} />}
      {tab === 'report' && <ReportTab {...p} soc={soc} year={year} s={s} bep={bep} targets={targets} />}
    </div>
  );
};

// ---------------------------------------------------------------- KPI
const METRICS: { id: keyof KpiSeries; label: string; isEur: boolean }[] = [
  { id: 'preventivato', label: 'Preventivato', isEur: true },
  { id: 'venduto', label: 'Venduto', isEur: true },
  { id: 'fatturato', label: 'Fatturato', isEur: true },
  { id: 'incassato', label: 'Incassato', isEur: true },
  { id: 'erogato', label: 'Erogato', isEur: true },
  { id: 'liquidita', label: 'Liquidità', isEur: true },
  { id: 'punti', label: 'Punti', isEur: false },
];
const KpiTab: React.FC<{
  soc: string; year: number; s: KpiSeries; targets: FinTargets | null;
  team: { uid: string; name: string }[]; pointEvents: PointEvent[]; quotes: Quote[];
  clientTiers: Record<string, number>; canEdit: boolean; onSaveLiquidity?: (l: FinLiquidity) => void;
}> = ({ soc, year, s, targets, team, pointEvents, quotes, clientTiers, canEdit, onSaveLiquidity }) => {
  const [metric, setMetric] = React.useState<keyof KpiSeries>('preventivato');
  const vals = (s[metric] as (number | null)[]).map((v) => v ?? 0);
  const maxV = Math.max(1, ...vals);
  const targetVal = targets ? (targets as any)[metric === 'liquidita' ? 'liquidita' : metric] : null;
  const totale = metric === 'liquidita' ? ([...(s.liquidita)].reverse().find((v) => v != null) ?? 0) : sum(vals);
  const isEur = METRICS.find((m) => m.id === metric)?.isEur ?? true;
  const fmtV = (v: number) => (isEur ? eur(v) : nfmt(v));

  // Fasce preventivato (tier cliente dalla rubrica)
  const socQuotes = quotes.filter((q) => q.division === soc && monthIn(year, q.createdAt) >= 0);
  const fasce = [1, 2, 3].map((f) => {
    const qs = socQuotes.filter((q) => (q.clientRecordId ? clientTiers[q.clientRecordId] : null) === f);
    const by = (st: string) => qs.filter((q) => q.status === st).reduce((t, q) => t + (q.total || 0), 0);
    return { f, n: qs.length, acc: by('accettato'), non: by('rifiutato'), att: by('in_attesa') + by('elaborato') };
  });
  const noTier = socQuotes.filter((q) => !q.clientRecordId || !clientTiers[q.clientRecordId]);
  const gen = {
    tot: socQuotes.length,
    acc: socQuotes.filter((q) => q.status === 'accettato'),
    non: socQuotes.filter((q) => q.status === 'rifiutato'),
    att: socQuotes.filter((q) => q.status === 'in_attesa' || q.status === 'elaborato'),
  };

  // Per-collaboratore (erogato/punti)
  const perColl = team.map((t) => {
    const evs = pointEvents.filter((e) => e.uid === t.uid && monthIn(year, e.date) >= 0);
    return { name: t.name, erogato: evs.reduce((x, e) => x + (Number(e.value) || 0), 0), punti: evs.reduce((x, e) => x + (Number(e.points) || 0), 0) };
  }).filter((x) => x.erogato > 0 || x.punti > 0).sort((a, b) => b.punti - a.punti);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
          {METRICS.map((m) => (
            <button key={m.id} onClick={() => setMetric(m.id)} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer border-none ${metric === m.id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{m.label}</button>
          ))}
        </div>
        <p className="text-[11.5px] text-[#9a9a9a] font-semibold">Calcolato dai dati dell'app · la liquidità si inserisce a mano</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{metric === 'liquidita' ? 'Ultima liquidità' : `Totale ${year}`}</p>
          <p className="text-[22px] font-black text-[#161616] mt-1 leading-none">{fmtV(totale)}</p>
        </div>
        <div className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">Obiettivo {year}</p>
          <p className="text-[22px] font-black text-[#161616] mt-1 leading-none">{targetVal ? fmtV(targetVal) : '—'}</p>
        </div>
        <div className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm col-span-2 md:col-span-1">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">Avanzamento</p>
          {targetVal ? (
            <>
              <div className="h-2.5 rounded-full bg-[#f0f0f0] overflow-hidden mt-2"><div className="h-full rounded-full bg-[#161616]" style={{ width: `${Math.min(100, (totale / targetVal) * 100)}%` }} /></div>
              <p className="text-[11px] text-[#8a8a8a] font-semibold mt-1.5">{Math.round((totale / targetVal) * 100)}% dell'obiettivo</p>
            </>
          ) : <p className="text-[12px] text-[#9a9a9a] mt-2">Imposta l'obiettivo nella tab "Obiettivi".</p>}
        </div>
      </div>

      {/* Grafico + tabella mensile */}
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
        {(metric === 'fatturato' || metric === 'incassato') ? (() => {
          // Fatturato vs incassato affiancati (come nel PDF della riunione)
          const f = s.fatturato; const inc = s.incassato;
          const mx = Math.max(1, ...f, ...inc);
          return (
            <>
              <div className="flex items-end gap-1.5 h-[110px] mb-2">
                {MESI.map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex items-end justify-center gap-[2px] h-[90px]">
                      <div className="w-1/2 rounded-t-sm" style={{ height: `${Math.max(2, (f[i] / mx) * 90)}px`, background: '#161616' }} title={`Fatturato ${eur(f[i])}`} />
                      <div className="w-1/2 rounded-t-sm" style={{ height: `${Math.max(2, (inc[i] / mx) * 90)}px`, background: '#b45309' }} title={`Incassato ${eur(inc[i])}`} />
                    </div>
                    <span className="text-[9px] font-bold text-[#b0b0b0]">{MESI[i].slice(0, 3)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-sm bg-[#161616]" /> Fatturato</span>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-sm bg-[#b45309]" /> Incassato</span>
              </div>
            </>
          );
        })() : (
          <div className="flex items-end gap-1.5 h-[110px] mb-3">
            {vals.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="w-full rounded-t-md" style={{ height: `${Math.max(3, (v / maxV) * 90)}px`, background: v ? '#161616' : '#f0f0f0', opacity: 0.85 }} title={fmtV(v)} />
                <span className="text-[9px] font-bold text-[#b0b0b0]">{MESI[i].slice(0, 3)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead><tr className="border-b border-[#eee] bg-[#f7f6f4]">
              <th className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Mese</th>
              <th className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] text-right">Valore</th>
              <th className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] text-right">Δ mese prec.</th>
            </tr></thead>
            <tbody>
              {MESI.map((m, i) => {
                const cur = metric === 'liquidita' ? s.liquidita[i] : vals[i];
                const prev = i > 0 ? (metric === 'liquidita' ? s.liquidita[i - 1] : vals[i - 1]) : null;
                const delta = cur != null && prev != null ? cur - prev : null;
                return (
                  <tr key={m} className="border-b border-[#f3f3f3] last:border-none">
                    <td className="px-3 py-1.5 text-[12px] font-bold text-[#161616]">{m}</td>
                    <td className="px-3 py-1.5 text-right text-[12.5px] font-extrabold text-[#161616]">
                      {metric === 'liquidita' && canEdit ? (
                        <LiquidityCell soc={soc} ym={`${year}-${pad(i + 1)}`} value={s.liquidita[i]} onSave={onSaveLiquidity} />
                      ) : cur == null ? '—' : fmtV(cur)}
                    </td>
                    <td className={`px-3 py-1.5 text-right text-[11.5px] font-extrabold ${delta == null || delta === 0 ? 'text-[#c0c0c0]' : delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {delta == null || delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${isEur ? eur(delta) : nfmt(delta)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approfondimenti per metrica */}
      {metric === 'preventivato' && (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Analisi per fascia cliente · {year}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-[12.5px] text-[#555]">
            <span>Elaborati: <b className="text-[#161616]">{gen.tot}</b></span>
            <span>Accettati: <b className="text-emerald-700">{gen.acc.length}</b> ({eur(gen.acc.reduce((t, q) => t + (q.total || 0), 0))})</span>
            <span>Non accettati: <b className="text-rose-600">{gen.non.length}</b> ({eur(gen.non.reduce((t, q) => t + (q.total || 0), 0))})</span>
            <span>In attesa: <b className="text-[#b45309]">{gen.att.length}</b> ({eur(gen.att.reduce((t, q) => t + (q.total || 0), 0))})</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-[#eee]">
              {['Fascia', 'N.', 'Accettati', 'Non accettati', 'In attesa'].map((h, i) => <th key={h} className={`px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 1 ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {fasce.map((f) => (
                <tr key={f.f} className="border-b border-[#f3f3f3] last:border-none">
                  <td className="px-2 py-1.5 text-[12px] font-bold text-[#161616]">Fascia {f.f}</td>
                  <td className="px-2 py-1.5 text-[12px] text-[#555]">{f.n}</td>
                  <td className="px-2 py-1.5 text-right text-[12px] font-bold text-emerald-700">{eur(f.acc)}</td>
                  <td className="px-2 py-1.5 text-right text-[12px] font-bold text-rose-600">{eur(f.non)}</td>
                  <td className="px-2 py-1.5 text-right text-[12px] font-bold text-[#b45309]">{eur(f.att)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {noTier.length > 0 && <p className="text-[10.5px] text-[#a8a8a8] font-semibold mt-2">{noTier.length} preventivi senza fascia (assegna la fascia al cliente in rubrica).</p>}
        </div>
      )}
      {(metric === 'erogato' || metric === 'punti') && perColl.length > 0 && (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Per collaboratore · {year}</p>
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-[#eee]">
              {['Collaboratore', 'Erogato', 'Punti'].map((h, i) => <th key={h} className={`px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {perColl.map((c) => (
                <tr key={c.name} className="border-b border-[#f3f3f3] last:border-none">
                  <td className="px-2 py-1.5 text-[12.5px] font-bold text-[#161616]">{c.name}</td>
                  <td className="px-2 py-1.5 text-right text-[12.5px] text-[#555]">{eur(c.erogato)}</td>
                  <td className="px-2 py-1.5 text-right text-[12.5px] font-extrabold text-[#161616]">{nfmt(c.punti)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Cella liquidità editabile (salva su blur/invio). */
const LiquidityCell: React.FC<{ soc: string; ym: string; value: number | null; onSave?: (l: FinLiquidity) => void }> = ({ soc, ym, value, onSave }) => {
  const [v, setV] = React.useState(value == null ? '' : String(value));
  React.useEffect(() => setV(value == null ? '' : String(value)), [value]);
  const commit = () => {
    const n = v.trim() === '' ? null : Number(v.replace(',', '.'));
    if (n == null || Number.isNaN(n) || n === value) return;
    onSave?.({ id: `${soc}__${ym}`, soc, ym, amount: n, updatedAt: Date.now() });
  };
  return (
    <input
      value={v} inputMode="decimal" placeholder="—"
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-[110px] px-2 py-1 rounded-md border border-[#ececec] text-[12px] text-right font-bold outline-none focus:border-[#161616] bg-white"
    />
  );
};

// ---------------------------------------------------------------- IVA & Fiscale
const IvaTab: React.FC<{
  soc: string; year: number; invA: InvoiceActive[]; fiscale: FiscaleItem[];
  canEdit: boolean; onSaveFiscale?: (i: FiscaleItem) => void; onDeleteFiscale?: (id: string) => void;
}> = ({ soc, year, invA, fiscale, canEdit, onSaveFiscale, onDeleteFiscale }) => {
  const rows = [0, 1, 2, 3].map((q) => {
    const months = [q * 3, q * 3 + 1, q * 3 + 2];
    const inv = invA.filter((i) => i.sector === soc && i.status !== 'bozza' && months.includes(monthIn(year, i.date)));
    const imponibile = inv.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const iva = inv.reduce((s, i) => s + (Number(i.amount) || 0) * ((Number(i.taxRate) || 0) / 100), 0);
    const incassato = inv.filter((i) => i.status === 'pagata').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return { q, imponibile, iva, incassato };
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Situazione IVA {year} (dalle fatture attive)</p>
        <table className="w-full text-left border-collapse">
          <thead><tr className="border-b border-[#eee]">
            {['Trimestre', 'Imponibile fatturato', 'IVA a debito', 'Incassato'].map((h, i) => <th key={h} className={`px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.q} className="border-b border-[#f3f3f3] last:border-none">
                <td className="px-2 py-1.5 text-[12px] font-bold text-[#161616]">{r.q + 1}° trimestre</td>
                <td className="px-2 py-1.5 text-right text-[12.5px] text-[#555]">{eur(r.imponibile)}</td>
                <td className="px-2 py-1.5 text-right text-[12.5px] font-extrabold text-[#161616]">{eur(r.iva)}</td>
                <td className="px-2 py-1.5 text-right text-[12.5px] text-[#555]">{eur(r.incassato)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10.5px] text-[#a8a8a8] font-semibold mt-2">L'IVA sugli acquisti non è tracciata (le fatture passive sono registrate a imponibile): il saldo IVA effettivo va verificato col fiscalista. Le scadenze di versamento si pianificano qui sotto.</p>
      </div>
      <FiscaleView items={fiscale.filter((i) => i.soc === soc)} soc={soc} socLabel={socLabel(soc)} color={socColor(soc)} canEdit={canEdit} onSave={onSaveFiscale} onDelete={onDeleteFiscale} />
    </div>
  );
};

// ---------------------------------------------------------------- Programmazione
const ProgTab: React.FC<Props & { soc: string }> = (p) => {
  const [sub, setSub] = React.useState<'fatt' | 'costi'>('fatt');
  return (
    <div className="flex flex-col gap-3">
      <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start">
        <button onClick={() => setSub('fatt')} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${sub === 'fatt' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>Programmazione fatturazione</button>
        <button onClick={() => setSub('costi')} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${sub === 'costi' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>Programmazione costi</button>
      </div>
      {sub === 'fatt' ? (
        <ProgFatturazioneView
          items={p.fattPlan.filter((i) => i.soc === p.soc)}
          soc={p.soc} socLabel={socLabel(p.soc)} clients={p.rubricaOpts} color={socColor(p.soc)} canEdit={p.canEdit}
          onSave={p.onSaveFatturazione} onDelete={p.onDeleteFatturazione} onEmit={p.onEmitFatturazione}
        />
      ) : (
        <CostPlanPanel soc={p.soc} items={p.costPlan} invP={p.invP} canEdit={!!p.canEdit} onSave={p.onSaveCostPlan} onDelete={p.onDeleteCostPlan} />
      )}
    </div>
  );
};

const CostPlanPanel: React.FC<{
  soc: string; items: FinCostPlanItem[]; invP: InvoicePassive[]; canEdit: boolean;
  onSave?: (i: FinCostPlanItem) => void; onDelete?: (id: string) => void;
}> = ({ soc, items, invP, canEdit, onSave, onDelete }) => {
  const [ym, setYm] = React.useState(ymNow());
  const [form, setForm] = React.useState({ category: 'COLLABORATORI', label: '', amount: '' });
  const rows = items.filter((i) => i.soc === soc && i.ym === ym);
  const tot = rows.reduce((s, i) => s + (i.amount || 0), 0);
  const year = Number(ym.slice(0, 4)); const mIdx = Number(ym.slice(5)) - 1;
  const registrati = invP.filter((i) => i.sector === soc && monthIn(year, i.date) === mIdx).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const byCat = COST_CATEGORIES.map((c) => ({ c, list: rows.filter((r) => r.category === c) })).filter((x) => x.list.length);
  const other = rows.filter((r) => !COST_CATEGORIES.includes(r.category));
  const add = () => {
    const amount = Number(form.amount);
    if (!amount || !form.label.trim()) return;
    onSave?.({ id: `cp-${Date.now().toString(36)}`, soc, ym, category: form.category, label: form.label.trim(), amount, createdAt: Date.now() });
    setForm((f) => ({ ...f, label: '', amount: '' }));
  };
  const copyPrev = () => {
    const [y, m] = ym.split('-').map(Number);
    const prev = `${m === 1 ? y - 1 : y}-${pad(m === 1 ? 12 : m - 1)}`;
    items.filter((i) => i.soc === soc && i.ym === prev).forEach((i, k) => {
      onSave?.({ ...i, id: `cp-${Date.now().toString(36)}-${k}`, ym, paid: false, createdAt: Date.now(), updatedAt: undefined });
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Uscite previste del mese (modello Excel): spunta le voci quando vengono sostenute.</p>
        <div className="flex items-center gap-2">
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value || ymNow())} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white" />
          {canEdit && rows.length === 0 && <button onClick={copyPrev} className="px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[11.5px] font-bold cursor-pointer">Copia dal mese precedente</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { l: `Costi previsti · ${ymLabel(ym)}`, v: eur(tot) },
          { l: 'Sostenuti (spuntati)', v: eur(rows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0)) },
          { l: 'Registrati in contabilità', v: eur(registrati) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[18px] font-black text-[#161616] mt-1 leading-none">{k.v}</p>
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 grid grid-cols-2 md:grid-cols-[190px_1fr_120px_auto] gap-2 items-end">
          <label className="flex flex-col gap-1"><span className={lbl}>Categoria</span>
            <input list="dircp-cats" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value.toUpperCase() }))} className={inp} />
            <datalist id="dircp-cats">{COST_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Voce</span><input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Es. F24 ritenute, nome collaboratore…" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Importo €</span><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inp} /></label>
          <button onClick={add} disabled={!Number(form.amount) || !form.label.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40 inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Aggiungi</button>
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna voce programmata per {ymLabel(ym)}.</p>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 flex flex-col gap-3">
          {[...byCat, ...(other.length ? [{ c: 'ALTRO', list: other }] : [])].map(({ c, list }) => (
            <div key={c}>
              <div className="flex items-center justify-between border-b border-[#eee] pb-1 mb-1">
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">{c}</p>
                <p className="text-[11.5px] font-extrabold text-[#161616]">{eur(list.reduce((s, i) => s + i.amount, 0))}</p>
              </div>
              {list.map((i) => (
                <div key={i.id} className="flex items-center gap-2 py-0.5">
                  <input type="checkbox" disabled={!canEdit} checked={!!i.paid} onChange={(e) => onSave?.({ ...i, paid: e.target.checked, updatedAt: Date.now() })} className="w-3.5 h-3.5 accent-[#161616]" title="Sostenuta" />
                  <span className={`flex-1 text-[12.5px] ${i.paid ? 'text-[#a0a0a0] line-through' : 'text-[#161616]'}`}>{i.label}</span>
                  <span className="text-[12.5px] font-bold text-[#555]">{eur(i.amount)}</span>
                  {canEdit && onDelete && <button onClick={() => onDelete(i.id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[#eee] pt-2">
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#161616]">Totale costi previsti</p>
            <p className="text-[15px] font-black text-[#161616]">{eur(tot)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- BEP
const BepTab: React.FC<{ year: number; rows: ReturnType<typeof bepRows> }> = ({ year, rows }) => {
  const fromPiano = rows[0]?.fromPiano;
  const maxV = Math.max(1, ...rows.flatMap((r) => [r.F, r.bep === Infinity ? 0 : r.bep]));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-[#8a8a8a] font-semibold">
        Break Even Point {year}: sotto la soglia sei in perdita, sopra sei in utile. {fromPiano ? 'Costi fissi/variabili dal Piano finanziario (consuntivo).' : 'Piano finanziario non compilato: tutti i costi registrati sono trattati come fissi.'}
      </p>

      {/* Grafico FATTURATO vs BEP (come nel PDF della riunione) */}
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
        <div className="flex items-end gap-1.5 h-[130px]">
          {rows.map((r) => {
            const bepPct = r.bep === Infinity || r.bep <= 0 ? null : Math.min(100, (r.bep / maxV) * 100);
            return (
              <div key={r.m} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="relative w-full h-[105px] flex items-end">
                  <div className="w-full rounded-t-md" style={{ height: `${Math.max(2, (r.F / maxV) * 100)}%`, background: r.F === 0 ? '#f0f0f0' : r.sopra ? '#161616' : '#e11d48', opacity: 0.85 }} title={`Fatturato ${eur(r.F)}`} />
                  {bepPct != null && <div className="absolute left-[-2px] right-[-2px] border-t-2 border-dashed border-[#b45309]" style={{ bottom: `${bepPct}%` }} title={`BEP ${eur(r.bep)}`} />}
                </div>
                <span className="text-[9px] font-bold text-[#b0b0b0]">{MESI[r.m].slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-sm bg-[#161616]" /> Fatturato (sopra BEP)</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-sm bg-[#e11d48]" /> Fatturato (sotto BEP)</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-4 border-t-2 border-dashed border-[#b45309]" /> Soglia BEP</span>
        </div>
      </div>
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead><tr className="border-b border-[#eee] bg-[#f7f6f4]">
            {['Mese', 'Costi fissi', 'Costi variabili', 'Fatturato', 'MC', 'MC %', 'BEP', 'Esito'].map((h, i) => <th key={h} className={`px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.m} className="border-b border-[#f3f3f3] last:border-none">
                <td className="px-3 py-2 text-[12px] font-bold text-[#161616]">{MESI[r.m]}</td>
                <td className="px-3 py-2 text-right text-[12px] text-[#555]">{eur(r.CF)}</td>
                <td className="px-3 py-2 text-right text-[12px] text-[#555]">{eur(r.CV)}</td>
                <td className="px-3 py-2 text-right text-[12.5px] font-extrabold text-[#161616]">{eur(r.F)}</td>
                <td className="px-3 py-2 text-right text-[12px] text-[#555]">{eur(r.MC)}</td>
                <td className="px-3 py-2 text-right text-[12px] text-[#555]">{r.F > 0 ? `${Math.round(r.mcPct * 1000) / 10}%` : '—'}</td>
                <td className="px-3 py-2 text-right text-[12.5px] font-bold text-[#161616]">{r.bep === Infinity ? '—' : eur(r.bep)}</td>
                <td className="px-3 py-2 text-right">
                  {r.F === 0 && r.CF === 0 ? <span className="text-[10px] font-bold text-[#c0c0c0]">—</span>
                    : r.sopra ? <span className="text-[10px] font-extrabold text-emerald-700 inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> UTILE</span>
                      : <span className="text-[10px] font-extrabold text-rose-600 inline-flex items-center gap-1"><TrendingDown className="w-3 h-3" /> PERDITA</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Budget per aree
const BudgetTab: React.FC<{
  soc: string; year: number; budget: FinBudgetArea[]; costiAnno: number; canEdit: boolean;
  onSave?: (b: FinBudgetArea) => void; onDelete?: (id: string) => void;
}> = ({ soc, year, budget, costiAnno, canEdit, onSave, onDelete }) => {
  const rows = budget.filter((b) => b.soc === soc && b.year === year).sort((a, b) => (a.order || 0) - (b.order || 0));
  const [newArea, setNewArea] = React.useState('');
  const totB = rows.reduce((s, b) => s + (b.budget || 0), 0);
  const totC = rows.reduce((s, b) => s + (b.consuntivo || 0), 0);
  const mkId = (n: number) => `${soc}__${year}__${Date.now().toString(36)}${n}`;
  const seed = () => BUDGET_AREAS.forEach((a, i) => onSave?.({ id: mkId(i), soc, year, area: a, budget: 0, order: i, updatedAt: Date.now() }));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Budget {year} per area aziendale vs consuntivo (modello riunione). Accanto, i costi registrati in contabilità per il confronto.</p>
        {canEdit && rows.length === 0 && <button onClick={seed} className="px-3 py-2 rounded-xl bg-[#161616] text-white text-[11.5px] font-bold cursor-pointer border-none">Carica aree standard</button>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ l: `Budget ${year}`, v: eur(totB) }, { l: 'Consuntivo', v: eur(totC), c: totB && totC > totB ? '#e11d48' : undefined }, { l: 'Costi registrati in app', v: eur(costiAnno) }].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[18px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna area budget per il {year}.</p>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead><tr className="border-b border-[#eee] bg-[#f7f6f4]">
              {['Area', `Budget ${year}`, 'Consuntivo', 'Scostamento', ''].map((h, i) => <th key={h} className={`px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((b) => {
                const diff = (b.consuntivo || 0) - (b.budget || 0);
                return (
                  <tr key={b.id} className="border-b border-[#f3f3f3] last:border-none">
                    <td className="px-3 py-1.5 text-[12.5px] font-bold text-[#161616]">{b.area}</td>
                    <td className="px-3 py-1.5 text-right"><NumCell value={b.budget} disabled={!canEdit} onCommit={(n) => onSave?.({ ...b, budget: n, updatedAt: Date.now() })} /></td>
                    <td className="px-3 py-1.5 text-right"><NumCell value={b.consuntivo ?? null} disabled={!canEdit} onCommit={(n) => onSave?.({ ...b, consuntivo: n, updatedAt: Date.now() })} /></td>
                    <td className={`px-3 py-1.5 text-right text-[12px] font-extrabold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-700' : 'text-[#c0c0c0]'}`}>{b.consuntivo == null ? '—' : `${diff > 0 ? '+' : ''}${eur(diff)}`}</td>
                    <td className="px-2 py-1.5 text-right">{canEdit && onDelete && <button onClick={() => onDelete(b.id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {canEdit && (
        <div className="flex items-center gap-2">
          <input value={newArea} onChange={(e) => setNewArea(e.target.value.toUpperCase())} placeholder="Nuova area…" className={`${inp} max-w-[260px]`} />
          <button onClick={() => { if (newArea.trim()) { onSave?.({ id: mkId(99), soc, year, area: newArea.trim(), budget: 0, order: rows.length, updatedAt: Date.now() }); setNewArea(''); } }} disabled={!newArea.trim()} className="px-3.5 py-2 rounded-xl bg-[#161616] text-white text-[12px] font-bold cursor-pointer border-none disabled:opacity-40 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Area</button>
        </div>
      )}
    </div>
  );
};

const NumCell: React.FC<{ value: number | null; disabled?: boolean; onCommit: (n: number) => void }> = ({ value, disabled, onCommit }) => {
  const [v, setV] = React.useState(value == null ? '' : String(value));
  React.useEffect(() => setV(value == null ? '' : String(value)), [value]);
  return (
    <input
      value={v} disabled={disabled} inputMode="decimal" placeholder="—"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { const n = Number(v.replace(',', '.')); if (!Number.isNaN(n) && n !== value) onCommit(n); }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-[110px] px-2 py-1 rounded-md border border-[#ececec] text-[12px] text-right font-bold outline-none focus:border-[#161616] bg-white disabled:border-transparent disabled:bg-transparent"
    />
  );
};

// ---------------------------------------------------------------- Cicli aperti
const CicliTab: React.FC<{ soc: string; cicli: FinCiclo[]; canEdit: boolean; onSave?: (c: FinCiclo) => void; onDelete?: (id: string) => void }> = ({ soc, cicli, canEdit, onSave, onDelete }) => {
  const [form, setForm] = React.useState({ group: CICLI_GROUPS[0], title: '' });
  const [showClosed, setShowClosed] = React.useState(false);
  const rows = cicli.filter((c) => c.soc === soc && (showClosed || c.status === 'aperto'));
  const groups = [...CICLI_GROUPS.filter((g) => rows.some((c) => (c.group || 'Altro') === g)), ...(rows.some((c) => c.group && !CICLI_GROUPS.includes(c.group)) ? ['(altri gruppi)'] : [])];
  const add = () => {
    if (!form.title.trim()) return;
    onSave?.({ id: `fc-${Date.now().toString(36)}`, soc, group: form.group, title: form.title.trim(), status: 'aperto', createdAt: Date.now() });
    setForm((f) => ({ ...f, title: '' }));
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Dossier amministrativi aperti (struttura societaria, immobili, ottimizzazioni, acquisti…): la lista che si rivede a ogni riunione.</p>
        <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#8a8a8a] cursor-pointer"><input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="w-3.5 h-3.5 accent-[#161616]" /> mostra chiusi</label>
      </div>
      {canEdit && (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 grid grid-cols-2 md:grid-cols-[220px_1fr_auto] gap-2 items-end">
          <label className="flex flex-col gap-1"><span className={lbl}>Gruppo</span>
            <input list="dirci-groups" value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))} className={inp} />
            <datalist id="dirci-groups">{CICLI_GROUPS.map((g) => <option key={g} value={g} />)}</datalist></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Dossier</span><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Es. Ricontrattazione % BCC" className={inp} /></label>
          <button onClick={add} disabled={!form.title.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40 inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Aggiungi</button>
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun ciclo aperto.</p>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 flex flex-col gap-3">
          {groups.map((g) => {
            const list = g === '(altri gruppi)' ? rows.filter((c) => c.group && !CICLI_GROUPS.includes(c.group)) : rows.filter((c) => (c.group || 'Altro') === g);
            if (!list.length) return null;
            return (
              <div key={g}>
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#9a9a9a] border-b border-[#eee] pb-1 mb-1">{g}</p>
                {list.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 py-1">
                    <button
                      disabled={!canEdit}
                      onClick={() => onSave?.({ ...c, status: c.status === 'aperto' ? 'chiuso' : 'aperto', updatedAt: Date.now() })}
                      title={c.status === 'aperto' ? 'Segna chiuso' : 'Riapri'}
                      className={`w-4.5 h-4.5 rounded-full border-2 cursor-pointer shrink-0 flex items-center justify-center ${c.status === 'chiuso' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-[#c9c9c9]'}`}
                    >{c.status === 'chiuso' && <CheckCircle2 className="w-3 h-3 text-white" />}</button>
                    <span className={`flex-1 text-[13px] ${c.status === 'chiuso' ? 'text-[#a0a0a0] line-through' : 'text-[#161616] font-semibold'}`}>{c.title}</span>
                    {c.notes && <span className="text-[11px] text-[#9a9a9a] truncate max-w-[220px]">{c.notes}</span>}
                    {canEdit && onDelete && <button onClick={() => onDelete(c.id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- Obiettivi
const ObiettiviTab: React.FC<{ soc: string; year: number; s: KpiSeries; targets: FinTargets | null; canEdit: boolean; onSave?: (t: FinTargets) => void }> = ({ soc, year, s, targets, canEdit, onSave }) => {
  const [d, setD] = React.useState<FinTargets>(targets || { id: `${soc}-${year}`, soc, year });
  React.useEffect(() => setD(targets || { id: `${soc}-${year}`, soc, year }), [soc, year, targets]);
  const actual: Record<string, number> = {
    fatturato: sum(s.fatturato), costi: sum(s.costi), utile: sum(s.fatturato) - sum(s.costi),
    preventivato: sum(s.preventivato), venduto: sum(s.venduto), erogato: sum(s.erogato),
    punti: sum(s.punti), liquidita: [...s.liquidita].reverse().find((v) => v != null) ?? 0,
  };
  const dirty = JSON.stringify(d) !== JSON.stringify(targets || { id: `${soc}-${year}`, soc, year });
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Obiettivi {year} (ultima slide della riunione): imposta i target — le tabelle KPI e le card del Centro mostrano l'avanzamento.</p>
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TARGET_FIELDS.map((f) => {
          const v = (d as any)[f.key];
          const act = actual[f.key as string] || 0;
          const pct = v ? Math.min(100, (act / v) * 100) : null;
          const isPts = f.key === 'punti';
          return (
            <div key={String(f.key)} className="border border-[#efefef] rounded-[14px] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">{f.label}</span>
                <input
                  disabled={!canEdit} type="number" value={v ?? ''} placeholder="—"
                  onChange={(e) => setD((p) => ({ ...p, [f.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                  className="w-[130px] px-2 py-1 rounded-md border border-[#ececec] text-[12.5px] text-right font-bold outline-none focus:border-[#161616] bg-white"
                />
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#f0f0f0] overflow-hidden"><div className="h-full rounded-full bg-[#161616]" style={{ width: `${pct ?? 0}%` }} /></div>
              <p className="text-[10.5px] text-[#8a8a8a] font-semibold mt-1">{isPts ? nfmt(act) : eur(act)} {v ? `su ${isPts ? nfmt(v) : eur(v)} (${Math.round(pct!)}%)` : '· nessun target'}</p>
            </div>
          );
        })}
      </div>
      {canEdit && <button onClick={() => onSave?.({ ...d, updatedAt: Date.now() })} disabled={!dirty} className="self-start px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva obiettivi</button>}
    </div>
  );
};

// ---------------------------------------------------------------- Report riunione
const ReportTab: React.FC<Props & { soc: string; year: number; s: KpiSeries; bep: ReturnType<typeof bepRows>; targets: FinTargets | null }> = (p) => {
  const { soc, year, s, bep, targets, canEdit = false } = p;
  const [ym, setYm] = React.useState(ymNow());
  const mIdx = Math.min(11, Math.max(0, Number(ym.slice(5)) - 1));
  const repId = `${soc}__${ym}`;
  const saved = p.reports.find((r) => r.id === repId);
  const [conclusions, setConclusions] = React.useState(saved?.conclusions || '');
  React.useEffect(() => setConclusions(saved?.conclusions || ''), [repId]); // eslint-disable-line
  const b = bep[mIdx];
  const fatMese = p.fattPlan.filter((i) => i.soc === soc && (i.dueDate || '').slice(0, 7) === ym);
  const cpMese = p.costPlan.filter((i) => i.soc === soc && i.ym === ym);
  const budRows = p.budget.filter((x) => x.soc === soc && x.year === year).sort((a, x) => (a.order || 0) - (x.order || 0));
  const cicliAperti = p.cicli.filter((c) => c.soc === soc && c.status === 'aperto');
  const kRow = (label: string, arr: (number | null)[], isEurV = true, target?: number | null) => {
    const cur = arr[mIdx] ?? 0; const prev = mIdx > 0 ? (arr[mIdx - 1] ?? 0) : null;
    const ytd = sum(arr.map((v) => v ?? 0).slice(0, mIdx + 1));
    const f = (v: number) => (isEurV ? eur(v) : nfmt(v));
    return { label, cur: f(cur), delta: prev == null ? null : cur - prev, ytd: f(ytd), target: target ? f(target) : '—', isEurV };
  };
  const kpiRows = [
    kRow('Preventivato', s.preventivato, true, targets?.preventivato),
    kRow('Venduto', s.venduto, true, targets?.venduto),
    kRow('Fatturato', s.fatturato, true, targets?.fatturato),
    kRow('Incassato', s.incassato, true, null),
    kRow('Erogato', s.erogato, true, targets?.erogato),
    kRow('Liquidità', s.liquidita, true, targets?.liquidita),
    kRow('Punti', s.punti, false, targets?.punti),
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Report della riunione strategica contabilità — le 8 sezioni del modello, precompilate dai dati.</p>
        <div className="flex items-center gap-2">
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value || ymNow())} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white" />
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Printer className="w-4 h-4" /> Stampa / PDF</button>
        </div>
      </div>
      <div className="print-area bg-white border border-[#e2e2e2] rounded-[22px] p-6 flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#b45309' }}>Strategico · Riunione strategica contabilità</p>
          <h3 className="text-[22px] font-black text-[#161616] capitalize">{socLabel(soc)} — {ymLabel(ym)}</h3>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">1 · Statistiche KPI</p>
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-[#eee]">
              {['Voce', 'Mese', 'Δ prec.', 'Anno', 'Obiettivo'].map((h, i) => <th key={h} className={`px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {kpiRows.map((r) => (
                <tr key={r.label} className="border-b border-[#f3f3f3] last:border-none">
                  <td className="px-2 py-1 text-[12px] font-bold text-[#161616]">{r.label}</td>
                  <td className="px-2 py-1 text-right text-[12px] font-extrabold text-[#161616]">{r.cur}</td>
                  <td className={`px-2 py-1 text-right text-[11.5px] font-extrabold ${!r.delta ? 'text-[#c0c0c0]' : r.delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{!r.delta ? '—' : `${r.delta > 0 ? '+' : ''}${r.isEurV ? eur(r.delta) : nfmt(r.delta)}`}</td>
                  <td className="px-2 py-1 text-right text-[12px] text-[#555]">{r.ytd}</td>
                  <td className="px-2 py-1 text-right text-[12px] text-[#555]">{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">2 · Piano finanziario (mese)</p>
          <p className="text-[12.5px] text-[#555]">Fatturato <b className="text-[#161616]">{eur(s.fatturato[mIdx])}</b> · Costi <b className="text-[#161616]">{eur(s.costi[mIdx])}</b> · Risultato del mese <b className={s.fatturato[mIdx] - s.costi[mIdx] >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{eur(s.fatturato[mIdx] - s.costi[mIdx])}</b></p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">3 · IVA</p>
          <p className="text-[12.5px] text-[#555]">IVA a debito del trimestre in corso: <b className="text-[#161616]">{eur(p.invA.filter((i) => i.sector === soc && i.status !== 'bozza' && Math.floor(monthIn(year, i.date) / 3) === Math.floor(mIdx / 3) && monthIn(year, i.date) >= 0).reduce((t, i) => t + (Number(i.amount) || 0) * ((Number(i.taxRate) || 0) / 100), 0))}</b> (dettaglio nella tab IVA & Fiscale).</p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">4 · Programmazione finanziaria</p>
          <p className="text-[12.5px] text-[#555]">Fatturazione programmata: <b className="text-[#161616]">{eur(fatMese.reduce((t, i) => t + (i.amount || 0), 0))}</b> ({fatMese.length} voci, {fatMese.filter((i) => i.status === 'emessa').length} emesse) · Costi programmati: <b className="text-[#161616]">{eur(cpMese.reduce((t, i) => t + (i.amount || 0), 0))}</b> ({cpMese.length} voci)</p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">5 · Break Even Point</p>
          <p className="text-[12.5px] text-[#555]">BEP {MESI[mIdx].toLowerCase()}: <b className="text-[#161616]">{b.bep === Infinity ? '—' : eur(b.bep)}</b> · fatturato <b className="text-[#161616]">{eur(b.F)}</b> → {b.F === 0 && b.CF === 0 ? 'nessun dato' : b.sopra ? <b className="text-emerald-700">sopra la soglia (utile)</b> : <b className="text-rose-600">sotto la soglia (perdita)</b>}</p>
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">6 · Budget aziendale {year}</p>
          {budRows.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Budget non compilato.</p> : (
            <div className="flex flex-col gap-0.5">
              {budRows.map((x) => (
                <p key={x.id} className="text-[12.5px] text-[#555]">· {x.area}: budget <b className="text-[#161616]">{eur(x.budget)}</b>{x.consuntivo != null ? <> · consuntivo <b className={x.consuntivo > x.budget ? 'text-rose-600' : 'text-[#161616]'}>{eur(x.consuntivo)}</b></> : null}</p>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">7 · Cicli aperti</p>
          {cicliAperti.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Nessun ciclo aperto.</p> : (
            <div className="flex flex-col gap-0.5">{cicliAperti.map((c) => <p key={c.id} className="text-[12.5px] text-[#555]">· {c.group ? `${c.group} — ` : ''}{c.title}</p>)}</div>
          )}
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">8 · Obiettivi {year}</p>
          {targets ? (
            <p className="text-[12.5px] text-[#555]">{TARGET_FIELDS.filter((f) => (targets as any)[f.key]).map((f) => `${f.label} ${f.key === 'punti' ? nfmt((targets as any)[f.key]) : eur((targets as any)[f.key])}`).join(' · ') || 'Nessun target impostato.'}</p>
          ) : <p className="text-[12.5px] text-[#9a9a9a]">Obiettivi non impostati.</p>}
        </div>
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1">Conclusioni</p>
          <textarea
            disabled={!canEdit} value={conclusions} rows={4}
            onChange={(e) => setConclusions(e.target.value)}
            onBlur={() => { if (canEdit && conclusions !== (saved?.conclusions || '')) p.onSaveReport?.({ id: repId, soc, ym, conclusions: conclusions || null, updatedAt: Date.now() }); }}
            placeholder="Decisioni della riunione, azioni di miglioramento, note…"
            className={`${inp} resize-none`}
          />
        </div>
      </div>
    </div>
  );
};

export default DirezioneHub;
