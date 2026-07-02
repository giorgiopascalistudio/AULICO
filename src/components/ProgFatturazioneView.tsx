/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ProgFatturazioneView — Programmazione fatturazione (Contabilità & Amministrazione).
 * Scadenzario di ciò che va fatturato per società: pianifica gli importi e con "Emetti"
 * genera la bozza fattura attiva + la scadenza in Finanza (uso quotidiano). KPI in alto.
 */
import React from 'react';
import { FileText, Plus, Trash2, Send, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { FatturazionePlanItem } from '../types';
import { eur } from '../utils';

interface Opt { id: string; name: string; }
interface Props {
  items: FatturazionePlanItem[];
  soc: string;
  socLabel?: string;
  clients?: Opt[];
  color?: string;
  canEdit?: boolean;
  onSave?: (i: FatturazionePlanItem) => void;
  onDelete?: (id: string) => void;
  onEmit?: (i: FatturazionePlanItem) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDays = (d?: string | null) => (d ? Math.round((new Date(d).getTime() - Date.now()) / 86400000) : null);
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—');

export const ProgFatturazioneView: React.FC<Props> = ({ items, soc, socLabel, clients = [], canEdit = false, onSave, onDelete, onEmit }) => {
  const list = items.slice().sort((a, b) => (a.status === b.status ? (a.dueDate || '').localeCompare(b.dueDate || '') : a.status === 'pianificata' ? -1 : 1));
  const pianificate = items.filter((i) => i.status === 'pianificata');
  const daFatturare = pianificate.reduce((s, i) => s + (i.amount || 0), 0);
  const inScadenza = pianificate.filter((i) => { const d = inDays(i.dueDate); return d != null && d <= 30; });
  const emesso = items.filter((i) => i.status === 'emessa').reduce((s, i) => s + (i.amount || 0), 0);

  const addRow = () => onSave?.({ id: `fp-${Date.now()}`, soc, clientName: '', amount: 0, taxRate: 22, dueDate: todayISO(), status: 'pianificata', createdAt: Date.now() });
  const patch = (i: FatturazionePlanItem, c: Partial<FatturazionePlanItem>) => onSave?.({ ...i, ...c, updatedAt: Date.now() });

  const KPI = [
    { l: 'Da fatturare', v: eur(daFatturare), s: `${pianificate.length} voci`, c: '#161616' },
    { l: 'In scadenza (≤30gg)', v: eur(inScadenza.reduce((s, i) => s + (i.amount || 0), 0)), s: `${inScadenza.length} voci`, c: '#b45309' },
    { l: 'Emesso', v: eur(emesso), s: `${items.filter((i) => i.status === 'emessa').length} fatture`, c: '#059669' },
  ];

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><FileText className="w-5.5 h-5.5" /> Programmazione fatturazione {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Pianifica cosa fatturare; "Emetti" crea la bozza fattura + la scadenza in Finanza.</p>
        </div>
        {canEdit && <button onClick={addRow} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova voce</button>}
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
          <table className="w-full border-collapse text-[12.5px] min-w-[760px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eee] text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">
                <th className="text-left py-2.5 px-3">Cliente</th>
                <th className="text-left py-2.5 px-3">Descrizione</th>
                <th className="text-right py-2.5 px-2 w-28">Importo</th>
                <th className="text-right py-2.5 px-2 w-16">IVA%</th>
                <th className="py-2.5 px-2 w-32">Scadenza</th>
                <th className="py-2.5 px-2 w-24">Stato</th>
                <th className="py-2.5 px-2 w-32" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[13px] text-[#9a9a9a]">Nessuna voce pianificata.{canEdit ? ' Aggiungi la prima.' : ''}</td></tr> : list.map((i) => {
                const emessa = i.status === 'emessa';
                const d = inDays(i.dueDate);
                const overdue = !emessa && d != null && d < 0;
                return (
                  <tr key={i.id} className={`border-b border-[#f6f6f6] ${emessa ? 'bg-emerald-50/40' : 'hover:bg-[#fafafa]'}`}>
                    <td className="py-1.5 px-3">
                      <input disabled={!canEdit || emessa} list="pf-clients" value={i.clientName} onChange={(e) => { const c = clients.find((x) => x.name === e.target.value); patch(i, { clientName: e.target.value, clientRecordId: c?.id || i.clientRecordId }); }} placeholder="Cliente" className="w-full px-2 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12.5px] outline-none bg-transparent disabled:text-[#555]" />
                    </td>
                    <td className="py-1.5 px-3"><input disabled={!canEdit || emessa} value={i.description || ''} onChange={(e) => patch(i, { description: e.target.value || null })} placeholder="Es. SAL 1, saldo…" className="w-full px-2 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12.5px] outline-none bg-transparent" /></td>
                    <td className="py-1.5 px-2"><input disabled={!canEdit || emessa} type="number" value={i.amount || ''} onChange={(e) => patch(i, { amount: Number(e.target.value) || 0 })} className="w-full px-2 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12.5px] text-right font-bold outline-none bg-transparent" /></td>
                    <td className="py-1.5 px-2"><input disabled={!canEdit || emessa} type="number" value={i.taxRate ?? ''} onChange={(e) => patch(i, { taxRate: e.target.value ? Number(e.target.value) : null })} className="w-full px-1 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[12px] text-right outline-none bg-transparent" /></td>
                    <td className="py-1.5 px-2">
                      {emessa ? <span className="text-[12px] text-[#8a8a8a]">{fmt(i.dueDate)}</span> : <input disabled={!canEdit} type="date" value={i.dueDate || ''} onChange={(e) => patch(i, { dueDate: e.target.value || null })} className="w-full px-1 py-1 rounded border border-transparent hover:border-[#eee] focus:border-[#161616] text-[11.5px] outline-none bg-transparent" />}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {emessa ? <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Emessa</span>
                        : overdue ? <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Scaduta</span>
                        : <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Da fare</span>}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && !emessa && <button onClick={() => i.clientName.trim() && i.amount > 0 ? onEmit?.(i) : undefined} disabled={!i.clientName.trim() || !i.amount} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[11.5px] font-bold cursor-pointer border-none disabled:opacity-40"><Send className="w-3.5 h-3.5" /> Emetti</button>}
                        {canEdit && !emessa && <button onClick={() => onDelete?.(i.id)} className="text-rose-300 hover:text-rose-600 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <datalist id="pf-clients">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
      </div>
      <p className="text-[11px] text-[#b0b0b0]">"Emetti" crea una <b>bozza</b> di fattura attiva + una scadenza in Contabilità → Contabilità. Da lì si completa/invia allo SDI.</p>
    </div>
  );
};

export default ProgFatturazioneView;
