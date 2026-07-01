/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatericoDealsView — "Potenziale Cantiere" (Materico §3): pipeline delle commesse
 * potenziali con valutazione tecnico-economica (valore/costo/margine), responsabile
 * per disciplina (edile/impianti) e stato. Board a colonne + KPI + editor CRUD.
 */
import React from 'react';
import {
  Target, Plus, X, Trash2, ChevronLeft, ChevronRight, MapPin, User, TrendingUp, Percent, Euro,
} from 'lucide-react';
import type { MatericoDeal, MatericoDealStage, MatericoDiscipline } from '../types';
import { eur } from '../utils';

interface Member { uid: string; name: string; }
interface ClientOpt { id: string; name: string; }
interface Props {
  deals: Record<string, MatericoDeal>;
  members: Member[];
  clients?: ClientOpt[];
  color?: string;
  canEdit?: boolean;
  onSave?: (d: MatericoDeal) => void;
  onDelete?: (id: string) => void;
}

const STAGES: { id: MatericoDealStage; label: string; color: string }[] = [
  { id: 'nuovo', label: 'Nuovo', color: '#6b7280' },
  { id: 'valutazione', label: 'Valutazione', color: '#b45309' },
  { id: 'preventivo', label: 'Preventivo', color: '#c2410c' },
  { id: 'contrattualizzazione', label: 'Contratto', color: '#4338ca' },
  { id: 'vinta', label: 'Vinta', color: '#059669' },
  { id: 'persa', label: 'Persa', color: '#dc2626' },
];
const OPEN_STAGES: MatericoDealStage[] = ['nuovo', 'valutazione', 'preventivo', 'contrattualizzazione'];
const DISC: { id: MatericoDiscipline; label: string }[] = [
  { id: 'edile', label: 'Edile' }, { id: 'impianti', label: 'Impianti' }, { id: 'misto', label: 'Misto' },
];
// probabilità implicita per stato (per il valore ponderato)
const STAGE_PROB: Record<MatericoDealStage, number> = { nuovo: 15, valutazione: 35, preventivo: 55, contrattualizzazione: 80, vinta: 100, persa: 0 };

const margineOf = (d: MatericoDeal) => (d.valoreStimato || 0) - (d.costoStimato || 0);
const marginePct = (d: MatericoDeal) => ((d.valoreStimato || 0) > 0 ? (margineOf(d) / (d.valoreStimato as number)) * 100 : 0);
const probOf = (d: MatericoDeal) => (d.probability != null ? d.probability : STAGE_PROB[d.stage]);

export const MatericoDealsView: React.FC<Props> = ({ deals, members, clients = [], color = '#c2410c', canEdit = false, onSave, onDelete }) => {
  const [editing, setEditing] = React.useState<MatericoDeal | null>(null);
  const [discF, setDiscF] = React.useState<'all' | MatericoDiscipline>('all');
  const list = Object.values(deals).filter((d) => discF === 'all' || (d.discipline || 'misto') === discF);
  const byStage = (s: MatericoDealStage) => list.filter((d) => d.stage === s).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  // KPI (sulle commesse aperte)
  const open = list.filter((d) => OPEN_STAGES.includes(d.stage));
  const pipeline = open.reduce((s, d) => s + (d.valoreStimato || 0), 0);
  const weighted = open.reduce((s, d) => s + (d.valoreStimato || 0) * (probOf(d) / 100), 0);
  const marginTot = open.reduce((s, d) => s + margineOf(d), 0);
  const won = list.filter((d) => d.stage === 'vinta');
  const wonVal = won.reduce((s, d) => s + (d.valoreStimato || 0), 0);

  const memberName = (uid?: string | null) => members.find((m) => m.uid === uid)?.name || '';
  const blank = (): MatericoDeal => ({ id: `mdeal-${Date.now()}`, title: '', clientName: null, discipline: 'edile', stage: 'nuovo', valoreStimato: null, costoStimato: null, probability: null, createdAt: Date.now() });
  const move = (d: MatericoDeal, dir: number) => {
    const order: MatericoDealStage[] = ['nuovo', 'valutazione', 'preventivo', 'contrattualizzazione', 'vinta'];
    const i = order.indexOf(d.stage);
    if (i < 0) return; const ni = Math.max(0, Math.min(order.length - 1, i + dir));
    if (order[ni] !== d.stage) onSave?.({ ...d, stage: order[ni], updatedAt: Date.now() });
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Target className="w-5.5 h-5.5" /> Potenziale Cantiere</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Pipeline delle commesse potenziali: valutazione tecnico-economica prima del preventivo.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            <button onClick={() => setDiscF('all')} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${discF === 'all' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>Tutte</button>
            {DISC.map((d) => <button key={d.id} onClick={() => setDiscF(d.id)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${discF === d.id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{d.label}</button>)}
          </div>
          {canEdit && <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova commessa</button>}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Valore pipeline', v: eur(pipeline), s: `${open.length} aperte`, i: Euro },
          { l: 'Valore ponderato', v: eur(weighted), s: 'per probabilità', i: TrendingUp },
          { l: 'Margine atteso', v: eur(marginTot), s: 'commesse aperte', i: Percent },
          { l: 'Acquisite', v: eur(wonVal), s: `${won.length} vinte`, i: Target },
        ].map((k) => { const Icon = k.i; return (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p><Icon className="w-4 h-4 text-[#c9c9c9]" /></div>
            <p className="text-[20px] font-black text-[#161616] mt-1 leading-none">{k.v}</p>
            <p className="text-[11px] text-[#9a9a9a] mt-1">{k.s}</p>
          </div>
        ); })}
      </div>

      {/* Board pipeline */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((st) => {
          const col = byStage(st.id);
          const colVal = col.reduce((s, d) => s + (d.valoreStimato || 0), 0);
          return (
            <div key={st.id} className="min-w-[240px] w-[240px] shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#161616]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: st.color }} /> {st.label} <span className="text-[#b0b0b0]">({col.length})</span></span>
                <span className="text-[10.5px] font-bold text-[#9a9a9a]">{eur(colVal)}</span>
              </div>
              <div className="flex flex-col gap-2 bg-[#f6f6f4] border border-[#eee] rounded-[16px] p-2 min-h-[120px]">
                {col.length === 0 ? <p className="text-[11px] text-[#b0b0b0] text-center py-6">—</p> : col.map((d) => {
                  const mp = marginePct(d);
                  return (
                    <div key={d.id} onClick={() => setEditing(d)} className="bg-white border border-[#e6e6e6] rounded-[13px] p-2.5 shadow-sm cursor-pointer hover:border-[#cfcfcf]">
                      <div className="flex items-start justify-between gap-1.5">
                        <b className="text-[12.5px] text-[#161616] leading-tight">{d.title || 'Senza nome'}</b>
                        {d.discipline && <span className="text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">{d.discipline}</span>}
                      </div>
                      {d.clientName && <p className="text-[11px] text-[#8a8a8a] truncate mt-0.5">{d.clientName}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[12px] font-bold text-[#161616]">{eur(d.valoreStimato || 0)}</span>
                        {(d.valoreStimato || 0) > 0 && <span className={`text-[10.5px] font-extrabold ${mp >= 15 ? 'text-emerald-600' : mp > 0 ? 'text-amber-600' : 'text-rose-600'}`}>{mp.toFixed(0)}%</span>}
                      </div>
                      {d.responsabileUid && <p className="text-[10px] text-[#a0a0a0] mt-1 inline-flex items-center gap-1"><User className="w-3 h-3" /> {memberName(d.responsabileUid)}</p>}
                      {canEdit && st.id !== 'persa' && (
                        <div className="flex items-center justify-end gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => move(d, -1)} disabled={d.stage === 'nuovo'} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#666] cursor-pointer border-none disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
                          <button onClick={() => move(d, 1)} disabled={d.stage === 'vinta'} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#666] cursor-pointer border-none disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editing && <DealEditor deal={editing} members={members} clients={clients} canEdit={canEdit} onClose={() => setEditing(null)} onSave={(d) => { onSave?.(d); setEditing(null); }} onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined} />}
    </div>
  );
};

const DealEditor: React.FC<{ deal: MatericoDeal; members: Member[]; clients: ClientOpt[]; canEdit: boolean; onClose: () => void; onSave: (d: MatericoDeal) => void; onDelete?: (id: string) => void }> = ({ deal, members, clients, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<MatericoDeal>(deal);
  const set = (c: Partial<MatericoDeal>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  const margine = (d.valoreStimato || 0) - (d.costoStimato || 0);
  const mpct = (d.valoreStimato || 0) > 0 ? (margine / (d.valoreStimato as number)) * 100 : 0;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{deal.title ? 'Commessa potenziale' : 'Nuova commessa potenziale'}</h3>
          <div className="flex items-center gap-1">
            {canEdit && deal.title && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Nome commessa (es. Ristrutturazione Villa X)" className={inp} />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Cliente</span>
              <input disabled={!canEdit} list="mdeal-clients" value={d.clientName || ''} onChange={(e) => { const c = clients.find((x) => x.name === e.target.value); set({ clientName: e.target.value || null, clientRecordId: c?.id || d.clientRecordId }); }} className={inp} />
              <datalist id="mdeal-clients">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
            </label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Stato</span>
              <select disabled={!canEdit} value={d.stage} onChange={(e) => set({ stage: e.target.value as MatericoDealStage })} className={inp}>
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Indirizzo</span><input disabled={!canEdit} value={d.address || ''} onChange={(e) => set({ address: e.target.value || null })} className={inp} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Disciplina</span>
              <select disabled={!canEdit} value={d.discipline || 'edile'} onChange={(e) => set({ discipline: e.target.value as MatericoDiscipline })} className={inp}>{DISC.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Responsabile</span>
              <select disabled={!canEdit} value={d.responsabileUid || ''} onChange={(e) => set({ responsabileUid: e.target.value || null })} className={inp}>
                <option value="">—</option>{members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
              </select>
            </label>
          </div>
          {/* Valutazione economica + margine */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Valore stimato €</span><input disabled={!canEdit} type="number" value={d.valoreStimato ?? ''} onChange={(e) => set({ valoreStimato: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Costo stimato €</span><input disabled={!canEdit} type="number" value={d.costoStimato ?? ''} onChange={(e) => set({ costoStimato: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
          </div>
          <div className={`rounded-xl px-3 py-2.5 border flex items-center justify-between ${mpct >= 15 ? 'bg-emerald-50 border-emerald-200' : mpct > 0 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
            <span className="text-[12px] font-bold text-[#444]">Margine atteso</span>
            <span className="text-[14px] font-black text-[#161616]">{eur(margine)} · <span className={mpct >= 15 ? 'text-emerald-700' : mpct > 0 ? 'text-amber-700' : 'text-rose-700'}>{mpct.toFixed(1)}%</span></span>
          </div>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Probabilità % (opz., sovrascrive quella dello stato)</span><input disabled={!canEdit} type="number" min={0} max={100} value={d.probability ?? ''} onChange={(e) => set({ probability: e.target.value ? Number(e.target.value) : null })} className={inp} placeholder={`Default per stato: ${STAGE_PROB[d.stage]}%`} /></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Note</span><textarea disabled={!canEdit} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
          {canEdit && <button onClick={() => onSave({ ...d, title: d.title.trim() || 'Commessa', updatedAt: Date.now() })} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva commessa</button>}
        </div>
      </div>
    </div>
  );
};

export default MatericoDealsView;
