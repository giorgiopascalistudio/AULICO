/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatericoListinoView — Listino interno Materico (§4). Per ogni lavorazione: costo imprese,
 * costo materiali, prezzo di mercato, margine minimo e margine applicato → prezzo al cliente.
 * Base per elaborare computi e preventivi senza attendere le offerte dei subappaltatori.
 */
import React from 'react';
import { ListChecks, Plus, X, Trash2, Pencil, Search } from 'lucide-react';
import type { MatericoPriceItem, QuoteMacro } from '../types';
import { eur } from '../utils';

interface Props {
  items: Record<string, MatericoPriceItem>;
  color?: string;
  canEdit?: boolean;
  onSave?: (i: MatericoPriceItem) => void;
  onDelete?: (id: string) => void;
}

export const MACRO_LABEL: Record<QuoteMacro, string> = {
  progettazione: 'Progettazione', consulenza: 'Consulenza', opere_edili: 'Opere edili',
  impiantistica: 'Impiantistica', materiali: 'Materiali', altro: 'Altro',
};
const MACROS = Object.keys(MACRO_LABEL) as QuoteMacro[];

/** Prezzo unitario applicato al cliente. */
export const listinoPrezzo = (i: { costoImprese?: number | null; costoMateriali?: number | null; margineApplicatoPct?: number | null }) => {
  const costo = (i.costoImprese || 0) + (i.costoMateriali || 0);
  return costo * (1 + (i.margineApplicatoPct || 0) / 100);
};

export const MatericoListinoView: React.FC<Props> = ({ items, canEdit = false, onSave, onDelete }) => {
  const [editing, setEditing] = React.useState<MatericoPriceItem | null>(null);
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState<'all' | QuoteMacro>('all');
  const list = Object.values(items)
    .filter((i) => cat === 'all' || i.category === cat)
    .filter((i) => { const s = q.trim().toLowerCase(); return !s || `${i.description} ${i.code || ''}`.toLowerCase().includes(s); })
    .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.description.localeCompare(b.description));
  const blank = (): MatericoPriceItem => ({ id: `lst-${Date.now()}`, code: null, category: 'opere_edili', description: '', unit: null, costoImprese: null, costoMateriali: null, prezzoMercato: null, margineMinPct: 10, margineApplicatoPct: 20, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><ListChecks className="w-5.5 h-5.5" /> Listino interno Materico</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Costi imprese/materiali, prezzo di mercato e margini per elaborare computi e preventivi.</p>
        </div>
        {canEdit && <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova voce</button>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca voce…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
          <button onClick={() => setCat('all')} className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer border-none ${cat === 'all' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>Tutte</button>
          {MACROS.map((m) => <button key={m} onClick={() => setCat(m)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer border-none ${cat === m ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{MACRO_LABEL[m]}</button>)}
        </div>
      </div>

      <div className="bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#f0f0f0] text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">
                <th className="py-3 px-4">Voce</th><th className="py-3 px-3">U.M.</th>
                <th className="py-3 px-3 text-right">Imprese</th><th className="py-3 px-3 text-right">Materiali</th>
                <th className="py-3 px-3 text-right">Mercato</th><th className="py-3 px-3 text-right">Marg.</th>
                <th className="py-3 px-3 text-right">Prezzo</th><th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-[13px] text-[#9a9a9a]">Nessuna voce in listino.</td></tr> : list.map((i) => {
                const costo = (i.costoImprese || 0) + (i.costoMateriali || 0);
                const prezzo = listinoPrezzo(i);
                const belowMin = i.margineMinPct != null && (i.margineApplicatoPct || 0) < i.margineMinPct;
                return (
                  <tr key={i.id} className="border-b border-[#f6f6f6] hover:bg-[#fafafa] cursor-pointer" onClick={() => canEdit && setEditing(i)}>
                    <td className="py-2.5 px-4"><div className="text-[13px] font-bold text-[#161616]">{i.description || '—'}</div><div className="text-[10px] font-bold uppercase tracking-wider text-[#b0b0b0]">{MACRO_LABEL[i.category]}{i.code ? ` · ${i.code}` : ''}</div></td>
                    <td className="py-2.5 px-3 text-[12px] text-[#8a8a8a]">{i.unit || '—'}</td>
                    <td className="py-2.5 px-3 text-[12.5px] text-right text-[#444]">{eur(i.costoImprese || 0)}</td>
                    <td className="py-2.5 px-3 text-[12.5px] text-right text-[#444]">{eur(i.costoMateriali || 0)}</td>
                    <td className="py-2.5 px-3 text-[12px] text-right text-[#9a9a9a]">{i.prezzoMercato != null ? eur(i.prezzoMercato) : '—'}</td>
                    <td className="py-2.5 px-3 text-right"><span className={`text-[11.5px] font-bold ${belowMin ? 'text-rose-600' : 'text-emerald-600'}`}>{i.margineApplicatoPct || 0}%</span></td>
                    <td className="py-2.5 px-3 text-[13px] text-right font-black text-[#161616]">{eur(prezzo)}</td>
                    <td className="py-2.5 px-3 text-right">{canEdit && <button onClick={(e) => { e.stopPropagation(); onDelete?.(i.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && onSave && <ListinoEditor item={editing} onClose={() => setEditing(null)} onSave={(i) => { onSave(i); setEditing(null); }} />}
    </div>
  );
};

const ListinoEditor: React.FC<{ item: MatericoPriceItem; onClose: () => void; onSave: (i: MatericoPriceItem) => void }> = ({ item, onClose, onSave }) => {
  const [d, setD] = React.useState<MatericoPriceItem>(item);
  const set = (c: Partial<MatericoPriceItem>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  const prezzo = listinoPrezzo(d);
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616]">{item.description ? 'Voce di listino' : 'Nuova voce'}</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <input value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Descrizione lavorazione" className={inp} />
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 col-span-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Categoria</span>
              <select value={d.category} onChange={(e) => set({ category: e.target.value as QuoteMacro })} className={inp}>{MACROS.map((m) => <option key={m} value={m}>{MACRO_LABEL[m]}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Codice</span><input value={d.code || ''} onChange={(e) => set({ code: e.target.value || null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">U.M.</span><input value={d.unit || ''} onChange={(e) => set({ unit: e.target.value || null })} placeholder="mq, ml, cad…" className={inp} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Costo imprese €</span><input type="number" value={d.costoImprese ?? ''} onChange={(e) => set({ costoImprese: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Costo materiali €</span><input type="number" value={d.costoMateriali ?? ''} onChange={(e) => set({ costoMateriali: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Prezzo mercato €</span><input type="number" value={d.prezzoMercato ?? ''} onChange={(e) => set({ prezzoMercato: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Margine min %</span><input type="number" value={d.margineMinPct ?? ''} onChange={(e) => set({ margineMinPct: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Margine applicato %</span><input type="number" value={d.margineApplicatoPct ?? ''} onChange={(e) => set({ margineApplicatoPct: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
          </div>
          <div className="rounded-xl px-3 py-2.5 border border-[#e2e2e2] bg-[#fafafa] flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#444]">Prezzo al cliente</span>
            <span className="text-[16px] font-black text-[#161616]">{eur(prezzo)}{d.unit ? <span className="text-[11px] font-semibold text-[#9a9a9a]">/{d.unit}</span> : null}</span>
          </div>
          <button onClick={() => onSave({ ...d, description: d.description.trim(), updatedAt: Date.now() })} disabled={!d.description.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva voce</button>
        </div>
      </div>
    </div>
  );
};

export default MatericoListinoView;
