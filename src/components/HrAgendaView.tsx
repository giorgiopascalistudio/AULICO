/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HrAgendaView — Agenda Risorse Umane (nodo `hrEvents`). Gestione di riunioni (1:1,
 * tecniche, amministrative, marketing), team building, formazione, viaggi, assenze e
 * vacanze. Vista calendario mensile + lista prossimi eventi + editor CRUD (admin/manager).
 */
import React from 'react';
import {
  CalendarDays, Plus, X, ChevronLeft, ChevronRight, Trash2, MapPin, Users2, ChevronDown,
} from 'lucide-react';
import type { HrEvent, HrEventCategory } from '../types';

interface Member { uid: string; name: string; }
interface Props {
  events: Record<string, HrEvent>;
  members: Member[];
  canEdit?: boolean;
  color?: string;
  onSave?: (e: HrEvent) => void;
  onDelete?: (id: string) => void;
}

export const CAT_META: Record<HrEventCategory, { label: string; short: string; color: string }> = {
  riunione_1_1: { label: 'Riunione 1:1', short: '1:1', color: '#4338ca' },
  riunione_tecnica: { label: 'Riunione tecnica', short: 'Tecnica', color: '#0d9488' },
  riunione_amministrativa: { label: 'Riunione amministrativa', short: 'Amm.', color: '#b45309' },
  riunione_marketing: { label: 'Riunione marketing', short: 'Mkt', color: '#db2777' },
  team_building: { label: 'Team building', short: 'Team', color: '#059669' },
  formazione_gruppo: { label: 'Formazione di gruppo', short: 'Formazione', color: '#7c3aed' },
  viaggio_formazione: { label: 'Viaggio di formazione', short: 'Viaggio', color: '#0891b2' },
  assenza: { label: 'Assenza', short: 'Assenza', color: '#6b7280' },
  vacanza: { label: 'Vacanza', short: 'Vacanza', color: '#ea580c' },
};
const CATS = Object.keys(CAT_META) as HrEventCategory[];
// Raggruppamento per il menu a tendina (niente distesa di bottoni)
const CAT_GROUPS: { label: string; cats: HrEventCategory[] }[] = [
  { label: 'Riunioni', cats: ['riunione_1_1', 'riunione_tecnica', 'riunione_amministrativa', 'riunione_marketing'] },
  { label: 'Formazione', cats: ['formazione_gruppo', 'viaggio_formazione'] },
  { label: 'Team', cats: ['team_building'] },
  { label: 'Assenze', cats: ['assenza', 'vacanza'] },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const WD = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const fmtLong = (s: string) => parseIso(s).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

export const HrAgendaView: React.FC<Props> = ({ events, members, canEdit = false, color = '#b45309', onSave, onDelete }) => {
  const [cursor, setCursor] = React.useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [filter, setFilter] = React.useState<'all' | HrEventCategory>('all');
  const [editing, setEditing] = React.useState<HrEvent | null>(null);

  const list = React.useMemo(() => Object.values(events).filter((e) => filter === 'all' || e.category === filter), [events, filter]);
  const onDay = (dayIso: string) => list.filter((e) => { const s = e.date; const en = e.endDate || e.date; return dayIso >= s && dayIso <= en; })
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // griglia mensile (lun→dom), 6 righe
  const first = new Date(cursor.y, cursor.m, 1);
  const startOffset = (first.getDay() + 6) % 7; // lun=0
  const gridStart = new Date(cursor.y, cursor.m, 1 - startOffset);
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
  const todayIso = iso(new Date());

  const upcoming = React.useMemo(() => list.filter((e) => (e.endDate || e.date) >= todayIso).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).slice(0, 8), [list, todayIso]);

  const blank = (): HrEvent => ({ id: `hr-${Date.now()}`, title: '', category: 'riunione_1_1', date: todayIso, endDate: null, time: null, allDay: false, participants: {}, location: null, notes: null, createdAt: Date.now() });
  const move = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><CalendarDays className="w-5.5 h-5.5" /> Agenda Risorse Umane</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Riunioni, team building, formazione, viaggi, assenze e vacanze del team.</p>
        </div>
        {canEdit && <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuovo evento</button>}
      </div>

      {/* Filtro categoria — un solo menu a tendina raggruppato + legenda compatta */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold text-[#161616] bg-white outline-none focus:border-[#161616] cursor-pointer">
              <option value="all">Tutte le categorie</option>
              {CAT_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.cats.map((c) => <option key={c} value={c}>{CAT_META[c].label}</option>)}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {filter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-white px-2.5 py-1.5 rounded-full" style={{ background: CAT_META[filter].color }}>
              <span className="w-2 h-2 rounded-full bg-white" /> {CAT_META[filter].label}
              <button onClick={() => setFilter('all')} className="ml-0.5 text-white/80 hover:text-white cursor-pointer bg-transparent border-none inline-flex"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
        {/* Legenda colori (informativa, non cliccabile) */}
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
          {CAT_GROUPS.map((g) => (
            <span key={g.label} className="inline-flex items-center gap-1.5">
              {g.cats.map((c) => <span key={c} title={CAT_META[c].label} className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_META[c].color }} />)}
              <span className="text-[10.5px] font-semibold text-[#9a9a9a]">{g.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Calendario mensile */}
        <div className="lg:flex-1 w-full bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => move(-1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#6b6b6b] cursor-pointer bg-transparent border-none"><ChevronLeft className="w-4 h-4" /></button>
            <b className="text-[15px] text-[#161616]">{MONTHS[cursor.m]} {cursor.y}</b>
            <button onClick={() => move(1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#6b6b6b] cursor-pointer bg-transparent border-none"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WD.map((w) => <div key={w} className="text-center text-[10px] font-bold uppercase tracking-wider text-[#b0b0b0] py-1">{w}</div>)}
            {days.map((d, i) => {
              const di = iso(d); const inMonth = d.getMonth() === cursor.m; const evs = onDay(di); const isToday = di === todayIso;
              return (
                <div key={i} onClick={() => canEdit && setEditing({ ...blank(), date: di })} className={`min-h-[74px] rounded-lg border p-1 flex flex-col gap-0.5 ${canEdit ? 'cursor-pointer' : ''} ${inMonth ? 'bg-white border-[#eee]' : 'bg-gray-50/60 border-transparent'} ${isToday ? 'ring-2 ring-[#161616]/70' : ''} hover:border-[#d5d5d5]`}>
                  <span className={`text-[11px] font-bold ${inMonth ? 'text-[#444]' : 'text-[#c0c0c0]'} ${isToday ? 'text-[#161616]' : ''}`}>{d.getDate()}</span>
                  {evs.slice(0, 3).map((e) => { const m = CAT_META[e.category]; return (
                    <button key={e.id} onClick={(ev) => { ev.stopPropagation(); setEditing(e); }} title={`${m.label} — ${e.title}`} className="text-left text-[9.5px] font-bold text-white truncate rounded px-1 py-0.5 cursor-pointer border-none" style={{ background: m.color }}>{e.time ? `${e.time} ` : ''}{e.title || m.short}</button>
                  ); })}
                  {evs.length > 3 && <span className="text-[9px] font-bold text-[#9a9a9a]">+{evs.length - 3}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prossimi eventi */}
        <div className="lg:w-[320px] w-full bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">Prossimi eventi</p>
          {upcoming.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a] py-6 text-center">Nessun evento in programma.</p> : (
            <div className="flex flex-col gap-2">
              {upcoming.map((e) => { const m = CAT_META[e.category]; return (
                <button key={e.id} onClick={() => setEditing(e)} className="text-left flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer bg-transparent border border-[#f0f0f0]">
                  <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: m.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-[#161616] truncate">{e.title || m.label}</p>
                    <p className="text-[11px] text-[#8a8a8a] truncate">{m.label} · {fmtLong(e.date)}{e.endDate && e.endDate !== e.date ? ` → ${fmtLong(e.endDate)}` : ''}{e.time ? ` · ${e.time}` : ''}</p>
                  </div>
                </button>
              ); })}
            </div>
          )}
        </div>
      </div>

      {editing && <HrEventEditor ev={editing} members={members} canEdit={canEdit} color={color} onClose={() => setEditing(null)} onSave={(e) => { onSave?.(e); setEditing(null); }} onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined} />}
    </div>
  );
};

const HrEventEditor: React.FC<{ ev: HrEvent; members: Member[]; canEdit: boolean; color: string; onClose: () => void; onSave: (e: HrEvent) => void; onDelete?: (id: string) => void }> = ({ ev, members, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<HrEvent>({ ...ev, participants: ev.participants || {} });
  const set = (c: Partial<HrEvent>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  const isPeriod = d.category === 'assenza' || d.category === 'vacanza' || d.category === 'viaggio_formazione';
  const toggleP = (uid: string) => setD((p) => { const m = { ...(p.participants || {}) }; if (m[uid]) delete m[uid]; else m[uid] = true; return { ...p, participants: m }; });
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{ev.title ? 'Modifica evento' : 'Nuovo evento HR'}</h3>
          <div className="flex items-center gap-1">
            {canEdit && ev.title && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Titolo (es. 1:1 con Rosa)" className={inp} />
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Categoria</span>
            <div className="relative">
              <span className="w-2.5 h-2.5 rounded-full absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ background: CAT_META[d.category].color }} />
              <select disabled={!canEdit} value={d.category} onChange={(e) => set({ category: e.target.value as HrEventCategory })} className={`${inp} appearance-none pl-7 pr-8`}>
                {CAT_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.cats.map((c) => <option key={c} value={c}>{CAT_META[c].label}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">{isPeriod ? 'Dal' : 'Data'}</span><input disabled={!canEdit} type="date" value={d.date} onChange={(e) => set({ date: e.target.value })} className={inp} /></label>
            {isPeriod ? (
              <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Al</span><input disabled={!canEdit} type="date" value={d.endDate || ''} onChange={(e) => set({ endDate: e.target.value || null })} className={inp} /></label>
            ) : (
              <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Ora</span><input disabled={!canEdit} type="time" value={d.time || ''} onChange={(e) => set({ time: e.target.value || null })} className={inp} /></label>
            )}
          </div>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Luogo</span><input disabled={!canEdit} value={d.location || ''} onChange={(e) => set({ location: e.target.value || null })} placeholder="Sede, online, azienda…" className={inp} /></label>
          {members.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] mb-1.5 inline-flex items-center gap-1"><Users2 className="w-3 h-3" /> Partecipanti</p>
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => { const on = !!d.participants?.[m.uid]; return (
                  <button key={m.uid} type="button" disabled={!canEdit} onClick={() => toggleP(m.uid)} className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full border ${on ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2]'}`}>{m.name}</button>
                ); })}
              </div>
            </div>
          )}
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Note</span><textarea disabled={!canEdit} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
          {canEdit && <button onClick={() => onSave({ ...d, title: d.title.trim() || CAT_META[d.category].label, updatedAt: Date.now() })} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva evento</button>}
        </div>
      </div>
    </div>
  );
};

export default HrAgendaView;
