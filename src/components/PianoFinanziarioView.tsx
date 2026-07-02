/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PianoFinanziarioView — Piano finanziario per società/anno (Contabilità & Amministrazione).
 * Modello del foglio Excel di Francesco: righe per sezione (Ricavi · Costi fissi · Costi variabili)
 * × 12 mesi, budget (preventivo) vs consuntivo, con Utile lordo · Risultato del mese · Progressivo.
 * KPI: Preventivato · Venduto · Fatturato · Incassato · Erogato · Liquidità.
 */
import React from 'react';
import {
  BarChart3, Plus, Trash2, ChevronDown, ChevronRight, Printer,
} from 'lucide-react';
import type { PianoFinanziario, PianoRow, PianoSection } from '../types';
import { eur } from '../utils';

interface Props {
  piano: PianoFinanziario | null;
  soc: string;
  socLabel?: string;
  year: number;
  color?: string;
  canEdit?: boolean;
  onChangeYear?: (y: number) => void;
  onSave?: (p: PianoFinanziario) => void;
  // KPI cross-modulo (dai preventivi/finanza/punti) opzionali
  kpi?: { preventivato?: number; venduto?: number; fatturato?: number; incassato?: number; erogato?: number; liquidita?: number };
}

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const SECTIONS: { id: PianoSection; label: string; color: string }[] = [
  { id: 'ricavi', label: 'Ricavi', color: '#059669' },
  { id: 'costi_fissi', label: 'Costi fissi', color: '#b45309' },
  { id: 'costi_variabili', label: 'Costi variabili', color: '#c2410c' },
];
const z12 = () => Array.from({ length: 12 }, () => 0);

/** Righe di partenza (dalla struttura del foglio Excel). */
function seedRows(): PianoRow[] {
  const mk = (section: PianoSection, label: string): PianoRow => ({ id: `pr-${Math.random().toString(36).slice(2, 8)}`, section, label, values: z12(), budget: z12() });
  return [
    mk('ricavi', 'Fatturato'),
    mk('ricavi', 'Incassato'),
    mk('costi_fissi', 'Costi del team'),
    mk('costi_fissi', 'Cespiti / attrezzature'),
    mk('costi_fissi', 'Software & licenze'),
    mk('costi_fissi', 'Carburante & auto'),
    mk('costi_fissi', 'Trasporti & trasferte'),
    mk('costi_fissi', 'Canone conto corrente'),
    mk('costi_fissi', 'Oneri finanziari'),
    mk('costi_fissi', 'Eventi organizzati'),
    mk('costi_fissi', 'Accantonamento fondo'),
    mk('costi_variabili', 'Spese anticipate ai clienti'),
    mk('costi_variabili', 'Consulenze esterne'),
  ];
}

const sumRow = (r: PianoRow, useBudget: boolean) => (useBudget ? (r.budget || z12()) : r.values).reduce((s, v) => s + (v || 0), 0);
const monthOf = (rows: PianoRow[], section: PianoSection, m: number, useBudget: boolean) =>
  rows.filter((r) => r.section === section).reduce((s, r) => s + ((useBudget ? r.budget || z12() : r.values)[m] || 0), 0);

export const PianoFinanziarioView: React.FC<Props> = ({ piano, soc, socLabel, year, color = '#b45309', canEdit = false, onChangeYear, onSave, kpi }) => {
  const [mode, setMode] = React.useState<'consuntivo' | 'budget'>('consuntivo');
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const useBudget = mode === 'budget';
  const rows = piano?.rows && piano.rows.length ? piano.rows : [];

  const commit = (next: PianoRow[]) => onSave?.({ id: `${soc}-${year}`, soc, year, rows: next, updatedAt: Date.now() });
  const setCell = (id: string, m: number, v: number) => commit(rows.map((r) => (r.id === id ? { ...r, [useBudget ? 'budget' : 'values']: (useBudget ? (r.budget || z12()) : r.values).map((x, i) => (i === m ? v : x)) } : r)));
  const setLabel = (id: string, label: string) => commit(rows.map((r) => (r.id === id ? { ...r, label } : r)));
  const addRow = (section: PianoSection) => commit([...rows, { id: `pr-${Date.now()}`, section, label: 'Nuova voce', values: z12(), budget: z12() }]);
  const rmRow = (id: string) => commit(rows.filter((r) => r.id !== id));
  const loadSeed = () => commit(seedRows());

  // Totali mensili per sezione
  const ricaviM = (m: number) => monthOf(rows, 'ricavi', m, useBudget);
  const fisso = (m: number) => monthOf(rows, 'costi_fissi', m, useBudget);
  const varia = (m: number) => monthOf(rows, 'costi_variabili', m, useBudget);
  // "Ricavi" a fini utile: usa la riga Fatturato se presente, altrimenti totale ricavi
  const fatturatoRow = rows.find((r) => r.section === 'ricavi' && /fatturato/i.test(r.label));
  const ricavoUtile = (m: number) => (fatturatoRow ? (useBudget ? fatturatoRow.budget || z12() : fatturatoRow.values)[m] || 0 : ricaviM(m));
  const utileM = (m: number) => ricavoUtile(m) - fisso(m) - varia(m);
  const totYear = (fn: (m: number) => number) => Array.from({ length: 12 }, (_, m) => fn(m)).reduce((s, v) => s + v, 0);
  let acc = 0; const progressivo = Array.from({ length: 12 }, (_, m) => (acc += utileM(m)));

  const num = (v: number) => (v ? eur(v) : '—');
  const printPiano = () => window.print();

  const K = [
    { l: 'Preventivato', v: kpi?.preventivato },
    { l: 'Venduto', v: kpi?.venduto },
    { l: 'Fatturato', v: fatturatoRow ? totYear((m) => (useBudget ? fatturatoRow!.budget || z12() : fatturatoRow!.values)[m] || 0) : (kpi?.fatturato ?? 0) },
    { l: 'Incassato', v: kpi?.incassato },
    { l: 'Erogato', v: kpi?.erogato },
    { l: 'Liquidità', v: kpi?.liquidita },
  ];

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><BarChart3 className="w-5.5 h-5.5" /> Piano finanziario {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Importi IVA esclusa. Consuntivo vs budget, per mese, con utile e progressivo.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={(e) => onChangeYear?.(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] font-bold bg-white outline-none focus:border-[#161616] cursor-pointer">
            {[year - 2, year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            {(['consuntivo', 'budget'] as const).map((mo) => <button key={mo} onClick={() => setMode(mo)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none capitalize ${mode === mo ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{mo}</button>)}
          </div>
          <button onClick={printPiano} title="Stampa / PDF" className="w-9 h-9 rounded-xl border border-[#e2e2e2] hover:border-black flex items-center justify-center text-[#161616] cursor-pointer bg-white"><Printer className="w-4 h-4" /></button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 print-area">
        {K.map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[16px] p-3.5 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[17px] font-black text-[#161616] mt-1 leading-none">{k.v != null ? eur(k.v) : '—'}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold mb-4">Piano finanziario {year} vuoto.</p>
          {canEdit && <button onClick={loadSeed} className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Carica struttura di partenza</button>}
        </div>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="border-collapse text-[12px] min-w-[980px] w-full">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eee] text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">
                  <th className="text-left py-2.5 px-3 sticky left-0 bg-[#fafafa] min-w-[180px]">Voce</th>
                  {MESI.map((m) => <th key={m} className="py-2.5 px-1.5 text-right min-w-[64px]">{m}</th>)}
                  <th className="py-2.5 px-2 text-right min-w-[80px] bg-[#f2f2f2]">Tot</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((sec) => {
                  const secRows = rows.filter((r) => r.section === sec.id);
                  const isCol = collapsed[sec.id];
                  return (
                    <React.Fragment key={sec.id}>
                      <tr className="border-b border-[#f0f0f0]" style={{ background: `${sec.color}0d` }}>
                        <td className="py-2 px-3 sticky left-0" style={{ background: `${sec.color}14` }}>
                          <button onClick={() => setCollapsed((c) => ({ ...c, [sec.id]: !c[sec.id] }))} className="inline-flex items-center gap-1.5 font-extrabold text-[12px] cursor-pointer bg-transparent border-none" style={{ color: sec.color }}>
                            {isCol ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {sec.label}
                          </button>
                        </td>
                        {MESI.map((_, m) => <td key={m} className="py-2 px-1.5 text-right font-bold" style={{ color: sec.color }}>{num(monthOf(rows, sec.id, m, useBudget))}</td>)}
                        <td className="py-2 px-2 text-right font-black bg-[#f2f2f2]" style={{ color: sec.color }}>{num(totYear((m) => monthOf(rows, sec.id, m, useBudget)))}</td>
                        <td />
                      </tr>
                      {!isCol && secRows.map((r) => (
                        <tr key={r.id} className="border-b border-[#f6f6f6] hover:bg-[#fafafa]">
                          <td className="py-1 px-3 sticky left-0 bg-white">
                            <input disabled={!canEdit} value={r.label} onChange={(e) => setLabel(r.id, e.target.value)} className="w-full px-1.5 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12px] outline-none bg-transparent" />
                          </td>
                          {MESI.map((_, m) => {
                            const v = (useBudget ? r.budget || z12() : r.values)[m] || 0;
                            return <td key={m} className="py-1 px-1"><input disabled={!canEdit} type="number" value={v || ''} onChange={(e) => setCell(r.id, m, Number(e.target.value) || 0)} className="w-full px-1 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[11.5px] text-right outline-none bg-transparent" /></td>;
                          })}
                          <td className="py-1 px-2 text-right font-bold text-[#161616] bg-[#fafafa]">{num(sumRow(r, useBudget))}</td>
                          <td className="text-right pr-1">{canEdit && <button onClick={() => rmRow(r.id)} className="text-rose-300 hover:text-rose-600 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}</td>
                        </tr>
                      ))}
                      {!isCol && canEdit && (
                        <tr><td className="py-1 px-3 sticky left-0 bg-white" colSpan={14}><button onClick={() => addRow(sec.id)} className="text-[11.5px] font-bold text-[#8a8a8a] hover:text-[#161616] inline-flex items-center gap-1 cursor-pointer bg-transparent border-none"><Plus className="w-3.5 h-3.5" /> Aggiungi voce</button></td><td /></tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {/* Utile / risultato / progressivo */}
                <tr className="border-t-2 border-[#161616] bg-[#161616] text-white">
                  <td className="py-2.5 px-3 sticky left-0 bg-[#161616] font-extrabold text-[11px] uppercase tracking-wider">Utile lordo</td>
                  {MESI.map((_, m) => { const u = utileM(m); return <td key={m} className={`py-2.5 px-1.5 text-right font-bold ${u >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{num(u)}</td>; })}
                  <td className="py-2.5 px-2 text-right font-black bg-[#000]">{num(totYear(utileM))}</td>
                  <td className="bg-[#161616]" />
                </tr>
                <tr className="bg-[#2a2a2a] text-white">
                  <td className="py-2 px-3 sticky left-0 bg-[#2a2a2a] font-bold text-[11px] uppercase tracking-wider">Progressivo</td>
                  {MESI.map((_, m) => <td key={m} className={`py-2 px-1.5 text-right font-semibold ${progressivo[m] >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>{num(progressivo[m])}</td>)}
                  <td className="py-2 px-2 text-right font-black bg-[#000]">{num(progressivo[11])}</td>
                  <td className="bg-[#2a2a2a]" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PianoFinanziarioView;
