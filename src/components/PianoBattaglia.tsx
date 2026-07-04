/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PianoBattaglia — la pianificazione operativa della settimana (PDF: "non è un
 * elenco: è la pianificazione di settimana/mese; ci si trascina il ciclo quando
 * va lavorato"). Per società: colonne Lun–Dom + corsia "In settimana"; si
 * aggiungono i CICLI aperti (o attività libere), si spostano tra i giorni
 * (drag&drop o frecce), si spuntano quando fatti. Nodo `battlePlan/<id>`.
 */
import React from 'react';
import { Swords, Plus, X, Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { BattleItem } from '../types';

interface CicloOpt { id: string; name: string; }
interface Props {
  soc: string;
  socLabel?: string;
  items: BattleItem[];
  cicli: CicloOpt[];            // cicli/pratiche aperte della società
  color?: string;
  canEdit?: boolean;
  onSave?: (i: BattleItem) => void;
  onDelete?: (id: string) => void;
  onOpenCiclo?: (projectId: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const mondayOf = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const PRIO: Record<string, string> = { alta: '#e11d48', media: '#b45309', bassa: '#6b7280' };

export const PianoBattaglia: React.FC<Props> = ({ soc, socLabel, items, cicli, color = '#161616', canEdit = false, onSave, onDelete, onOpenCiclo }) => {
  const [week, setWeek] = React.useState(() => mondayOf(new Date()));
  const weekISO = iso(week);
  const [adding, setAdding] = React.useState(false);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const rows = items.filter((i) => i.soc === soc && i.weekISO === weekISO).sort((a, b) => a.order - b.order);
  const weekLabel = `${week.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} – ${new Date(week.getTime() + 6 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const isThisWeek = weekISO === iso(mondayOf(new Date()));

  const addItem = (label: string, projectId?: string | null, priority?: BattleItem['priority']) => {
    onSave?.({ id: `bp-${Date.now().toString(36)}`, soc, weekISO, day: null, label, projectId: projectId || null, priority: priority || null, order: rows.length, createdAt: Date.now() });
  };
  const move = (i: BattleItem, day: number | null) => onSave?.({ ...i, day, updatedAt: Date.now() });
  const shiftWeek = (i: BattleItem, dir: 1 | -1) => {
    const w = new Date(i.weekISO); w.setDate(w.getDate() + dir * 7);
    onSave?.({ ...i, weekISO: iso(w), updatedAt: Date.now() });
  };

  const lane = (day: number | null) => {
    const list = rows.filter((r) => (r.day ?? null) === day);
    return (
      <div
        key={day === null ? 'week' : day}
        onDragOver={(e) => { if (canEdit) e.preventDefault(); }}
        onDrop={() => { if (dragId) { const it = rows.find((r) => r.id === dragId); if (it) move(it, day); setDragId(null); } }}
        className={`rounded-[16px] border p-2 flex flex-col gap-1.5 min-h-[86px] ${day === null ? 'border-[#dcdcda] bg-[#faf9f7]' : 'border-[#ececec] bg-white'}`}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] px-1">
          {day === null ? 'In settimana (da collocare)' : `${GIORNI[day]} ${new Date(week.getTime() + day * 86400000).getDate()}`}
        </p>
        {list.map((i) => (
          <div
            key={i.id}
            draggable={canEdit}
            onDragStart={() => setDragId(i.id)}
            className={`group rounded-xl border px-2.5 py-2 flex items-center gap-2 ${i.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-[#e6e6e6] bg-white'} ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <button
              disabled={!canEdit}
              onClick={() => onSave?.({ ...i, done: !i.done, updatedAt: Date.now() })}
              className={`w-4.5 h-4.5 rounded-full border-2 shrink-0 flex items-center justify-center cursor-pointer ${i.done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-[#c9c9c9]'}`}
              title={i.done ? 'Riapri' : 'Fatta'}
            >{i.done && <CheckCircle2 className="w-3 h-3 text-white" />}</button>
            {i.priority && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIO[i.priority] }} title={`Priorità ${i.priority}`} />}
            <button
              onClick={() => i.projectId && onOpenCiclo?.(i.projectId)}
              className={`flex-1 min-w-0 text-left text-[12px] font-semibold bg-transparent border-none p-0 ${i.done ? 'text-[#9aa89f] line-through' : 'text-[#161616]'} ${i.projectId && onOpenCiclo ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
            >
              <span className="block truncate">{i.label}</span>
            </button>
            {canEdit && (
              <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button onClick={() => shiftWeek(i, -1)} title="Settimana precedente" className="p-0.5 rounded hover:bg-gray-100 text-[#9a9a9a] cursor-pointer bg-transparent border-none"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button onClick={() => shiftWeek(i, 1)} title="Settimana successiva" className="p-0.5 rounded hover:bg-gray-100 text-[#9a9a9a] cursor-pointer bg-transparent border-none"><ChevronRight className="w-3.5 h-3.5" /></button>
                {onDelete && <button onClick={() => onDelete(i.id)} className="p-0.5 rounded hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
              </span>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-[10.5px] text-[#c9c9c9] text-center py-2">—</p>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Swords className="w-5.5 h-5.5" style={{ color }} /> Piano di Battaglia {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">La settimana operativa: porta qui i cicli quando vanno lavorati, collocali nei giorni, spuntali quando fatti.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setWeek(new Date(week.getTime() - 7 * 86400000))} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setWeek(mondayOf(new Date()))} className={`px-3 h-9 rounded-xl border text-[12px] font-bold cursor-pointer ${isThisWeek ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2] hover:bg-[#f5f5f3]'}`}>Questa settimana</button>
          <button onClick={() => setWeek(new Date(week.getTime() + 7 * 86400000))} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          {canEdit && <button onClick={() => setAdding(true)} className="ml-1 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Aggiungi</button>}
        </div>
      </div>
      <p className="text-[13px] font-extrabold text-[#161616] capitalize -mt-2">Settimana {weekLabel}</p>

      {lane(null)}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        {GIORNI.map((_, d) => lane(d))}
      </div>

      {adding && canEdit && (
        <AddModal cicli={cicli} planned={new Set(rows.map((r) => r.projectId).filter(Boolean) as string[])} onClose={() => setAdding(false)} onAdd={(label, pid, prio) => { addItem(label, pid, prio); setAdding(false); }} />
      )}
    </div>
  );
};

const AddModal: React.FC<{
  cicli: CicloOpt[]; planned: Set<string>;
  onClose: () => void; onAdd: (label: string, projectId?: string | null, priority?: BattleItem['priority']) => void;
}> = ({ cicli, planned, onClose, onAdd }) => {
  const [free, setFree] = React.useState('');
  const [prio, setPrio] = React.useState<BattleItem['priority']>(null);
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">Porta nel Piano di Battaglia</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Priorità</span>
          {(['alta', 'media', 'bassa'] as const).map((p) => (
            <button key={p} onClick={() => setPrio(prio === p ? null : p)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${prio === p ? 'text-white border-transparent' : 'bg-white text-[#8a8a8a] border-[#e2e2e2]'}`} style={prio === p ? { background: PRIO[p] } : undefined}>{p}</button>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] mb-1.5">Cicli aperti</p>
        <div className="flex flex-col gap-1.5 mb-3 max-h-[260px] overflow-y-auto">
          {cicli.length === 0 && <p className="text-[12px] text-[#9a9a9a]">Nessun ciclo aperto.</p>}
          {cicli.map((c) => (
            <button key={c.id} disabled={planned.has(c.id)} onClick={() => onAdd(c.name, c.id, prio)} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[#ececec] bg-white hover:border-[#161616] text-left text-[12.5px] font-semibold text-[#161616] cursor-pointer disabled:opacity-40 disabled:cursor-default">
              <span className="truncate">{c.name}</span>
              {planned.has(c.id) ? <span className="text-[9.5px] font-bold text-[#9a9a9a] shrink-0">già in piano</span> : <Plus className="w-3.5 h-3.5 text-[#9a9a9a] shrink-0" />}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] mb-1.5">Oppure attività libera</p>
        <div className="flex items-center gap-2">
          <input value={free} onChange={(e) => setFree(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && free.trim()) onAdd(free.trim(), null, prio); }} placeholder="Es. giro agenzie Cisternino" className="flex-1 px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
          <button onClick={() => free.trim() && onAdd(free.trim(), null, prio)} disabled={!free.trim()} className="px-3.5 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40">Aggiungi</button>
        </div>
      </div>
    </div>
  );
};

export default PianoBattaglia;
