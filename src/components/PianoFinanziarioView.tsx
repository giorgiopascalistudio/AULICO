/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PianoFinanziarioView — Piano finanziario per società/anno (Contabilità & Amministrazione).
 * Modello del foglio Excel di Francesco: sezioni (macro-voci) rinominabili/riordinabili/aggiungibili
 * × 12 mesi, budget (preventivo) vs consuntivo, con Utile lordo · Risultato del mese · Progressivo.
 * Ogni sezione ha una NATURA (ricavo / costo fisso / costo variabile) che guida il calcolo utile.
 * Le righe (sotto-voci) si riordinano (↑↓) e si spostano tra sezioni. KPI in testa.
 */
import React from 'react';
import {
  BarChart3, Plus, Trash2, ChevronDown, ChevronRight, Printer, ArrowUp, ArrowDown,
} from 'lucide-react';
import type { PianoFinanziario, PianoRow, PianoNature, PianoSectionDef } from '../types';
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
const z12 = () => Array.from({ length: 12 }, () => 0);

const NATURE_META: Record<PianoNature, { label: string; color: string }> = {
  ricavi: { label: 'Ricavo', color: '#059669' },
  costi_fissi: { label: 'Costo fisso', color: '#b45309' },
  costi_variabili: { label: 'Costo variabile', color: '#c2410c' },
};
const NATURES: PianoNature[] = ['ricavi', 'costi_fissi', 'costi_variabili'];
const BASE_IDS = new Set<string>(['ricavi', 'costi_fissi', 'costi_variabili']);

/** Sezioni di default (le 3 nature) quando il piano non ne ha di esplicite. */
function defaultSections(): PianoSectionDef[] {
  return [
    { id: 'ricavi', label: 'Ricavi', nature: 'ricavi', order: 0 },
    { id: 'costi_fissi', label: 'Costi fissi', nature: 'costi_fissi', order: 1 },
    { id: 'costi_variabili', label: 'Costi variabili', nature: 'costi_variabili', order: 2 },
  ];
}

/** Righe di partenza (dalla struttura del foglio Excel). */
function seedRows(): PianoRow[] {
  const mk = (section: string, label: string, order: number): PianoRow => ({ id: `pr-${Math.random().toString(36).slice(2, 8)}`, section, label, values: z12(), budget: z12(), order });
  return [
    mk('ricavi', 'Fatturato', 0),
    mk('ricavi', 'Incassato', 1),
    mk('costi_fissi', 'Costi del team', 0),
    mk('costi_fissi', 'Cespiti / attrezzature', 1),
    mk('costi_fissi', 'Software & licenze', 2),
    mk('costi_fissi', 'Carburante & auto', 3),
    mk('costi_fissi', 'Trasporti & trasferte', 4),
    mk('costi_fissi', 'Canone conto corrente', 5),
    mk('costi_fissi', 'Oneri finanziari', 6),
    mk('costi_fissi', 'Eventi organizzati', 7),
    mk('costi_fissi', 'Accantonamento fondo', 8),
    mk('costi_variabili', 'Spese anticipate ai clienti', 0),
    mk('costi_variabili', 'Consulenze esterne', 1),
  ];
}

const sumRow = (r: PianoRow, useBudget: boolean) => (useBudget ? (r.budget || z12()) : r.values).reduce((s, v) => s + (v || 0), 0);

export const PianoFinanziarioView: React.FC<Props> = ({ piano, soc, socLabel, year, color = '#b45309', canEdit = false, onChangeYear, onSave, kpi }) => {
  const [mode, setMode] = React.useState<'consuntivo' | 'budget'>('consuntivo');
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const useBudget = mode === 'budget';
  const rows = piano?.rows && piano.rows.length ? piano.rows : [];
  const sections = React.useMemo<PianoSectionDef[]>(
    () => (piano?.sections && piano.sections.length ? [...piano.sections] : defaultSections()).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [piano?.sections]
  );

  const commit = (nextRows: PianoRow[], nextSections?: PianoSectionDef[]) =>
    onSave?.({ id: `${soc}-${year}`, soc, year, rows: nextRows, sections: nextSections || sections, updatedAt: Date.now() });

  // --- righe ---
  const setCell = (id: string, m: number, v: number) => commit(rows.map((r) => (r.id === id ? { ...r, [useBudget ? 'budget' : 'values']: (useBudget ? (r.budget || z12()) : r.values).map((x, i) => (i === m ? v : x)) } : r)));
  const setLabel = (id: string, label: string) => commit(rows.map((r) => (r.id === id ? { ...r, label } : r)));
  const rowsOf = (secId: string) => rows.filter((r) => r.section === secId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const addRow = (secId: string) => commit([...rows, { id: `pr-${Date.now()}`, section: secId, label: 'Nuova voce', values: z12(), budget: z12(), order: rowsOf(secId).length }]);
  const rmRow = (id: string) => commit(rows.filter((r) => r.id !== id));
  const moveRow = (id: string, dir: -1 | 1) => {
    const r = rows.find((x) => x.id === id); if (!r) return;
    const sib = rowsOf(r.section);
    const i = sib.findIndex((x) => x.id === id);
    const j = i + dir; if (j < 0 || j >= sib.length) return;
    const a = sib[i], b = sib[j];
    commit(rows.map((x) => (x.id === a.id ? { ...x, order: j } : x.id === b.id ? { ...x, order: i } : x)));
  };
  const moveRowToSection = (id: string, secId: string) => commit(rows.map((r) => (r.id === id ? { ...r, section: secId, order: rowsOf(secId).length } : r)));
  const loadSeed = () => commit(seedRows(), defaultSections());

  // --- sezioni ---
  const setSecLabel = (id: string, label: string) => commit(rows, sections.map((s) => (s.id === id ? { ...s, label } : s)));
  const setSecNature = (id: string, nature: PianoNature) => commit(rows, sections.map((s) => (s.id === id ? { ...s, nature } : s)));
  const addSection = () => {
    const id = `sec-${Date.now()}`;
    commit(rows, [...sections, { id, label: 'Nuova sezione', nature: 'costi_fissi', order: sections.length }]);
  };
  const moveSection = (id: string, dir: -1 | 1) => {
    const i = sections.findIndex((s) => s.id === id);
    const j = i + dir; if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    commit(rows, next.map((s, k) => ({ ...s, order: k })));
  };
  const rmSection = (id: string) => {
    if (rowsOf(id).length) return; // solo sezioni vuote
    commit(rows, sections.filter((s) => s.id !== id).map((s, k) => ({ ...s, order: k })));
  };

  // --- calcolo per NATURA (guida l'utile), indipendente dai nomi/numero delle sezioni ---
  const natureOf = (secId: string): PianoNature => sections.find((s) => s.id === secId)?.nature || (BASE_IDS.has(secId) ? (secId as PianoNature) : 'costi_fissi');
  const monthOfNature = (nature: PianoNature, m: number) => rows.filter((r) => natureOf(r.section) === nature).reduce((s, r) => s + ((useBudget ? r.budget || z12() : r.values)[m] || 0), 0);
  const monthOfSection = (secId: string, m: number) => rowsOf(secId).reduce((s, r) => s + ((useBudget ? r.budget || z12() : r.values)[m] || 0), 0);

  const fisso = (m: number) => monthOfNature('costi_fissi', m);
  const varia = (m: number) => monthOfNature('costi_variabili', m);
  // "Ricavi" a fini utile: usa la riga Fatturato se presente, altrimenti totale ricavi
  const fatturatoRow = rows.find((r) => natureOf(r.section) === 'ricavi' && /fatturato/i.test(r.label));
  const ricavoUtile = (m: number) => (fatturatoRow ? (useBudget ? fatturatoRow.budget || z12() : fatturatoRow.values)[m] || 0 : monthOfNature('ricavi', m));
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
                  <th className="text-left py-2.5 px-3 sticky left-0 bg-[#fafafa] min-w-[220px]">Voce</th>
                  {MESI.map((m) => <th key={m} className="py-2.5 px-1.5 text-right min-w-[64px]">{m}</th>)}
                  <th className="py-2.5 px-2 text-right min-w-[80px] bg-[#f2f2f2]">Tot</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, si) => {
                  const meta = NATURE_META[sec.nature];
                  const secRows = rowsOf(sec.id);
                  const isCol = collapsed[sec.id];
                  return (
                    <React.Fragment key={sec.id}>
                      <tr className="border-b border-[#f0f0f0]" style={{ background: `${meta.color}0d` }}>
                        <td className="py-2 px-2 sticky left-0" style={{ background: `${meta.color}14` }}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setCollapsed((c) => ({ ...c, [sec.id]: !c[sec.id] }))} className="shrink-0 cursor-pointer bg-transparent border-none p-0" style={{ color: meta.color }} title={isCol ? 'Espandi' : 'Comprimi'}>
                              {isCol ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {canEdit
                              ? <input value={sec.label} onChange={(e) => setSecLabel(sec.id, e.target.value)} className="flex-1 min-w-0 px-1.5 py-1 rounded border border-transparent hover:border-[#0001] focus:border-current text-[12px] font-extrabold outline-none bg-transparent" style={{ color: meta.color }} />
                              : <span className="flex-1 font-extrabold text-[12px]" style={{ color: meta.color }}>{sec.label}</span>}
                            {canEdit && (
                              <select value={sec.nature} onChange={(e) => setSecNature(sec.id, e.target.value as PianoNature)} title="Natura (guida il calcolo utile)" className="shrink-0 text-[9.5px] font-bold uppercase rounded-full border px-1.5 py-0.5 bg-white outline-none cursor-pointer" style={{ color: meta.color, borderColor: `${meta.color}55` }}>
                                {NATURES.map((n) => <option key={n} value={n}>{NATURE_META[n].label}</option>)}
                              </select>
                            )}
                            {canEdit && (
                              <span className="shrink-0 inline-flex items-center">
                                <button onClick={() => moveSection(sec.id, -1)} disabled={si === 0} className="p-0.5 text-[#00000055] hover:text-[#161616] disabled:opacity-25 cursor-pointer bg-transparent border-none" title="Su"><ArrowUp className="w-3.5 h-3.5" /></button>
                                <button onClick={() => moveSection(sec.id, 1)} disabled={si === sections.length - 1} className="p-0.5 text-[#00000055] hover:text-[#161616] disabled:opacity-25 cursor-pointer bg-transparent border-none" title="Giù"><ArrowDown className="w-3.5 h-3.5" /></button>
                              </span>
                            )}
                          </div>
                        </td>
                        {MESI.map((_, m) => <td key={m} className="py-2 px-1.5 text-right font-bold" style={{ color: meta.color }}>{num(monthOfSection(sec.id, m))}</td>)}
                        <td className="py-2 px-2 text-right font-black bg-[#f2f2f2]" style={{ color: meta.color }}>{num(totYear((m) => monthOfSection(sec.id, m)))}</td>
                        <td className="text-center">
                          {canEdit && !BASE_IDS.has(sec.id) && secRows.length === 0 && (
                            <button onClick={() => rmSection(sec.id)} className="text-rose-300 hover:text-rose-600 cursor-pointer bg-transparent border-none" title="Elimina sezione (vuota)"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </td>
                      </tr>
                      {!isCol && secRows.map((r, ri) => (
                        <tr key={r.id} className="border-b border-[#f6f6f6] hover:bg-[#fafafa] group">
                          <td className="py-1 px-2 sticky left-0 bg-white">
                            <div className="flex items-center gap-1">
                              {canEdit && (
                                <span className="shrink-0 inline-flex flex-col opacity-40 group-hover:opacity-100">
                                  <button onClick={() => moveRow(r.id, -1)} disabled={ri === 0} className="leading-none text-[#999] hover:text-[#161616] disabled:opacity-25 cursor-pointer bg-transparent border-none p-0" title="Su"><ArrowUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveRow(r.id, 1)} disabled={ri === secRows.length - 1} className="leading-none text-[#999] hover:text-[#161616] disabled:opacity-25 cursor-pointer bg-transparent border-none p-0" title="Giù"><ArrowDown className="w-3 h-3" /></button>
                                </span>
                              )}
                              <input disabled={!canEdit} value={r.label} onChange={(e) => setLabel(r.id, e.target.value)} className="flex-1 min-w-0 px-1.5 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12px] outline-none bg-transparent" />
                              {canEdit && sections.length > 1 && (
                                <select value={r.section} onChange={(e) => moveRowToSection(r.id, e.target.value)} title="Sposta in un'altra sezione" className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] rounded border border-[#e2e2e2] bg-white outline-none cursor-pointer max-w-[90px]">
                                  {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                              )}
                            </div>
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
                {canEdit && (
                  <tr><td className="py-2 px-3 sticky left-0 bg-white" colSpan={14}><button onClick={addSection} className="text-[11.5px] font-extrabold text-[#8a8a8a] hover:text-[#161616] inline-flex items-center gap-1 cursor-pointer bg-transparent border-none"><Plus className="w-3.5 h-3.5" /> Aggiungi sezione (macro-voce)</button></td><td /></tr>
                )}
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
