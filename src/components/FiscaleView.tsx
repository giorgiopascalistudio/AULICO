/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FiscaleView — Pianificazione fiscale (Contabilità & Amministrazione). Scadenzario degli
 * adempimenti fiscali per società (IVA, F24, Ritenute, IRES, INARCASSA…) con importi, scadenze,
 * ricorrenza e stato pagato. Nodo `fiscalePlan`.
 */
import React from 'react';
import { Scale, Plus, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { FiscaleItem } from '../types';
import { eur } from '../utils';

interface Props {
  items: FiscaleItem[];
  soc: string;
  socLabel?: string;
  color?: string;
  canEdit?: boolean;
  onSave?: (i: FiscaleItem) => void;
  onDelete?: (id: string) => void;
}

const CATS = ['IVA', 'F24', 'Ritenute', 'IRES/IRAP', 'INARCASSA', 'Diritti CCIAA', 'Imposte varie', 'Altro'];
const todayISO = () => new Date().toISOString().slice(0, 10);
const inDays = (d?: string | null) => (d ? Math.round((new Date(d).getTime() - Date.now()) / 86400000) : null);
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—');

export const FiscaleView: React.FC<Props> = ({ items, soc, socLabel, canEdit = false, onSave, onDelete }) => {
  const list = items.slice().sort((a, b) => (a.status === b.status ? (a.dueDate || '').localeCompare(b.dueDate || '') : a.status === 'pianificata' ? -1 : 1));
  const pian = items.filter((i) => i.status === 'pianificata');
  const inScad = pian.filter((i) => { const d = inDays(i.dueDate); return d != null && d <= 30; });
  const pagato = items.filter((i) => i.status === 'pagata').reduce((s, i) => s + (i.amount || 0), 0);

  const addRow = () => onSave?.({ id: `fis-${Date.now()}`, soc, category: 'IVA', label: '', amount: null, dueDate: todayISO(), status: 'pianificata', recurrence: null, createdAt: Date.now() });
  const patch = (i: FiscaleItem, c: Partial<FiscaleItem>) => onSave?.({ ...i, ...c, updatedAt: Date.now() });

  const KPI = [
    { l: 'Da pagare', v: eur(pian.reduce((s, i) => s + (i.amount || 0), 0)), s: `${pian.length} adempimenti`, c: '#161616' },
    { l: 'In scadenza (≤30gg)', v: eur(inScad.reduce((s, i) => s + (i.amount || 0), 0)), s: `${inScad.length} voci`, c: '#b45309' },
    { l: 'Pagato', v: eur(pagato), s: `${items.filter((i) => i.status === 'pagata').length} voci`, c: '#059669' },
  ];

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Scale className="w-5.5 h-5.5" /> Pianificazione fiscale {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Scadenze e adempimenti fiscali della società: IVA, F24, ritenute, imposte.</p>
        </div>
        {canEdit && <button onClick={addRow} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova scadenza</button>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KPI.map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[16px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[19px] font-black mt-1 leading-none" style={{ color: k.c }}>{k.v}</p>
            <p className="text-[11px] text-[#9a9a9a] mt-1">{k.s}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] min-w-[720px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eee] text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">
                <th className="text-left py-2.5 px-3 w-32">Categoria</th>
                <th className="text-left py-2.5 px-3">Adempimento</th>
                <th className="text-right py-2.5 px-2 w-28">Importo</th>
                <th className="py-2.5 px-2 w-28">Ricorrenza</th>
                <th className="py-2.5 px-2 w-28">Scadenza</th>
                <th className="py-2.5 px-2 w-24">Stato</th>
                <th className="py-2.5 px-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[13px] text-[#9a9a9a]">Nessuna scadenza fiscale.</td></tr> : list.map((i) => {
                const pagata = i.status === 'pagata';
                const d = inDays(i.dueDate);
                const overdue = !pagata && d != null && d < 0;
                return (
                  <tr key={i.id} className={`border-b border-[#f6f6f6] ${pagata ? 'bg-emerald-50/40' : 'hover:bg-[#fafafa]'}`}>
                    <td className="py-1.5 px-3"><select disabled={!canEdit} value={i.category} onChange={(e) => patch(i, { category: e.target.value })} className="w-full px-1.5 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12px] outline-none bg-transparent">{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></td>
                    <td className="py-1.5 px-3"><input disabled={!canEdit} value={i.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Es. Liquidazione IVA Q2" className="w-full px-2 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12.5px] outline-none bg-transparent" /></td>
                    <td className="py-1.5 px-2"><input disabled={!canEdit} type="number" value={i.amount ?? ''} onChange={(e) => patch(i, { amount: e.target.value ? Number(e.target.value) : null })} className="w-full px-2 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12.5px] text-right font-bold outline-none bg-transparent" /></td>
                    <td className="py-1.5 px-2"><select disabled={!canEdit} value={i.recurrence || ''} onChange={(e) => patch(i, { recurrence: (e.target.value || null) as any })} className="w-full px-1 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[11.5px] outline-none bg-transparent"><option value="">—</option><option value="mensile">Mensile</option><option value="trimestrale">Trimestrale</option><option value="annuale">Annuale</option></select></td>
                    <td className="py-1.5 px-2">{pagata ? <span className="text-[12px] text-[#8a8a8a]">{fmt(i.dueDate)}</span> : <input disabled={!canEdit} type="date" value={i.dueDate || ''} onChange={(e) => patch(i, { dueDate: e.target.value || null })} className="w-full px-1 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[11.5px] outline-none bg-transparent" />}</td>
                    <td className="py-1.5 px-2 text-center">
                      <button disabled={!canEdit} onClick={() => patch(i, { status: pagata ? 'pianificata' : 'pagata' })} className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full cursor-pointer border-none inline-flex items-center gap-1 ${pagata ? 'bg-emerald-100 text-emerald-700' : overdue ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                        {pagata ? <><CheckCircle2 className="w-3 h-3" /> Pagata</> : overdue ? <><AlertTriangle className="w-3 h-3" /> Scaduta</> : <><Clock className="w-3 h-3" /> Da pagare</>}
                      </button>
                    </td>
                    <td className="py-1.5 px-2 text-right">{canEdit && <button onClick={() => onDelete?.(i.id)} className="text-rose-300 hover:text-rose-600 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FiscaleView;
