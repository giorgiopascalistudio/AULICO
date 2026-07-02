/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MarketingSocietaView — Marketing per società (scoped). Quattro aree: Calendario editoriale
 * (social, board per stato), Eventi & gadget, Articoli blog, Statistiche. Nodo `socMkt`.
 */
import React from 'react';
import { Megaphone, Plus, X, Trash2, Gift, FileText, BarChart3, ExternalLink, CalendarDays } from 'lucide-react';
import type { SocMktItem, SocMktKind, SocMktStatus } from '../types';
import { eur, safeUrl } from '../utils';

interface Props {
  items: SocMktItem[];
  soc: string;
  socLabel?: string;
  initialTab?: 'calendario' | 'eventi' | 'blog' | 'stat';
  color?: string;
  canEdit?: boolean;
  onSave?: (i: SocMktItem) => void;
  onDelete?: (id: string) => void;
}

const STATUS: { id: SocMktStatus; label: string; color: string }[] = [
  { id: 'idea', label: 'Idea', color: '#6b7280' },
  { id: 'bozza', label: 'Bozza', color: '#b45309' },
  { id: 'programmato', label: 'Programmato', color: '#4338ca' },
  { id: 'pubblicato', label: 'Pubblicato', color: '#059669' },
];
const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Blog'];
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—');

export const MarketingSocietaView: React.FC<Props> = ({ items, soc, socLabel, initialTab = 'calendario', canEdit = false, onSave, onDelete }) => {
  const [tab, setTab] = React.useState<'calendario' | 'eventi' | 'blog' | 'stat'>(initialTab);
  React.useEffect(() => setTab(initialTab), [initialTab]);
  const [editing, setEditing] = React.useState<SocMktItem | null>(null);

  const of = (k: SocMktKind) => items.filter((i) => i.kind === k);
  const blank = (kind: SocMktKind): SocMktItem => ({ id: `mk-${Date.now()}`, soc, kind, title: '', date: null, platform: kind === 'blog' ? 'Blog' : null, status: 'idea', createdAt: Date.now() });
  const moveStatus = (i: SocMktItem, s: SocMktStatus) => onSave?.({ ...i, status: s, updatedAt: Date.now() });

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Megaphone className="w-5.5 h-5.5" /> Marketing {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Calendario editoriale, eventi & gadget, blog e statistiche della società.</p>
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
          {([['calendario', 'Calendario', CalendarDays], ['eventi', 'Eventi & gadget', Gift], ['blog', 'Blog', FileText], ['stat', 'Statistiche', BarChart3]] as const).map(([id, lbl, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}><Icon className="w-3.5 h-3.5" /> {lbl}</button>
          ))}
        </div>
      </div>

      {/* CALENDARIO EDITORIALE (social) — board per stato */}
      {tab === 'calendario' && (
        <>
          {canEdit && <button onClick={() => setEditing(blank('social'))} className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuovo contenuto</button>}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STATUS.map((st) => {
              const col = of('social').filter((i) => (i.status || 'idea') === st.id).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
              return (
                <div key={st.id} className="min-w-[230px] w-[230px] shrink-0 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 px-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: st.color }} /><span className="text-[12px] font-extrabold text-[#161616]">{st.label}</span><span className="text-[#b0b0b0] font-bold text-[11px]">({col.length})</span></div>
                  <div className="flex flex-col gap-2 bg-[#f6f6f4] border border-[#eee] rounded-[16px] p-2 min-h-[120px]">
                    {col.map((i) => (
                      <div key={i.id} onClick={() => setEditing(i)} className="bg-white border border-[#e6e6e6] rounded-[12px] p-2.5 shadow-sm cursor-pointer hover:border-[#cfcfcf]">
                        <b className="text-[12.5px] text-[#161616] leading-tight block">{i.title || 'Senza titolo'}</b>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {i.platform && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{i.platform}</span>}
                          {i.date && <span className="text-[10px] text-[#9a9a9a]">{fmt(i.date)}</span>}
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                            {STATUS.filter((s) => s.id !== (i.status || 'idea')).slice(0, 3).map((s) => <button key={s.id} onClick={() => moveStatus(i, s.id)} title={`→ ${s.label}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer border-none text-white" style={{ background: s.color }}>{s.label[0]}</button>)}
                          </div>
                        )}
                      </div>
                    ))}
                    {col.length === 0 && <p className="text-[11px] text-[#b0b0b0] text-center py-4">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* EVENTI & GADGET */}
      {(tab === 'eventi' || tab === 'blog') && (() => {
        const kind: SocMktKind = tab === 'eventi' ? 'evento' : 'blog';
        const list = (tab === 'eventi' ? [...of('evento'), ...of('gadget')] : of('blog')).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return (
          <div className="flex flex-col gap-3">
            {canEdit && (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(blank(kind))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> {tab === 'eventi' ? 'Nuovo evento' : 'Nuovo articolo'}</button>
                {tab === 'eventi' && <button onClick={() => setEditing(blank('gadget'))} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Gift className="w-3.5 h-3.5" /> Nuovo gadget</button>}
              </div>
            )}
            {list.length === 0 ? <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Nessun elemento.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((i) => (
                  <div key={i.id} onClick={() => setEditing(i)} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm cursor-pointer hover:border-[#cfcfcf] flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <b className="text-[14px] text-[#161616]">{i.title || 'Senza titolo'}</b>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">{i.kind === 'gadget' ? 'Gadget' : i.kind === 'evento' ? 'Evento' : 'Blog'}</span>
                    </div>
                    <p className="text-[11.5px] text-[#8a8a8a]">{[fmt(i.date), i.platform, i.cost != null ? eur(i.cost) : null].filter(Boolean).join(' · ')}</p>
                    {i.notes && <p className="text-[12px] text-[#555] line-clamp-2">{i.notes}</p>}
                    {i.link && safeUrl(i.link) && <a href={safeUrl(i.link)!} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[11.5px] text-indigo-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Apri</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* STATISTICHE */}
      {tab === 'stat' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'Contenuti social', v: of('social').length },
            { l: 'Pubblicati', v: of('social').filter((i) => i.status === 'pubblicato').length },
            { l: 'Eventi', v: of('evento').length },
            { l: 'Gadget', v: of('gadget').length },
            { l: 'Articoli blog', v: of('blog').length },
            { l: 'Spesa gadget/eventi', v: eur([...of('gadget'), ...of('evento')].reduce((s, i) => s + (i.cost || 0), 0)) },
            { l: 'In programmazione', v: of('social').filter((i) => i.status === 'programmato').length },
            { l: 'In bozza', v: of('social').filter((i) => i.status === 'bozza').length },
          ].map((k) => (
            <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[16px] p-4 shadow-sm">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
              <p className="text-[20px] font-black text-[#161616] mt-1 leading-none">{typeof k.v === 'number' ? k.v : k.v}</p>
            </div>
          ))}
        </div>
      )}

      {editing && <MktEditor item={editing} canEdit={canEdit} onClose={() => setEditing(null)} onSave={(i) => { onSave?.(i); setEditing(null); }} onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined} />}
    </div>
  );
};

const MktEditor: React.FC<{ item: SocMktItem; canEdit: boolean; onClose: () => void; onSave: (i: SocMktItem) => void; onDelete?: (id: string) => void }> = ({ item, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<SocMktItem>(item);
  const set = (c: Partial<SocMktItem>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  const isPost = d.kind === 'social' || d.kind === 'blog';
  const isCost = d.kind === 'gadget' || d.kind === 'evento';
  const KIND_LABEL = { social: 'Contenuto social', blog: 'Articolo blog', evento: 'Evento', gadget: 'Gadget' } as const;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{item.title ? 'Modifica' : 'Nuovo'} · {KIND_LABEL[d.kind]}</h3>
          <div className="flex items-center gap-1">
            {canEdit && item.title && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Titolo" className={inp} />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Data</span><input disabled={!canEdit} type="date" value={d.date || ''} onChange={(e) => set({ date: e.target.value || null })} className={inp} /></label>
            {isPost ? (
              <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Piattaforma</span>
                <select disabled={!canEdit} value={d.platform || ''} onChange={(e) => set({ platform: e.target.value || null })} className={inp}><option value="">—</option>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </label>
            ) : (
              <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Costo €</span><input disabled={!canEdit} type="number" value={d.cost ?? ''} onChange={(e) => set({ cost: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            )}
          </div>
          {isPost && (
            <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Stato</span>
              <select disabled={!canEdit} value={d.status || 'idea'} onChange={(e) => set({ status: e.target.value as SocMktStatus })} className={inp}>{STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </label>
          )}
          {isCost && d.kind === 'gadget' && <p className="text-[11px] text-[#9a9a9a]">Annota destinazione (pensiero di Natale / gadget per evento) nelle note.</p>}
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">{isPost ? 'Caption / testo' : 'Note'}</span><textarea disabled={!canEdit} value={(isPost ? d.content : d.notes) || ''} onChange={(e) => set(isPost ? { content: e.target.value || null } : { notes: e.target.value || null })} rows={3} className={`${inp} resize-none`} /></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Link media / URL</span><input disabled={!canEdit} value={d.link || ''} onChange={(e) => set({ link: e.target.value || null })} placeholder="https://…" className={inp} /></label>
          {canEdit && <button onClick={() => onSave({ ...d, title: d.title.trim() || 'Senza titolo', updatedAt: Date.now() })} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva</button>}
        </div>
      </div>
    </div>
  );
};

export default MarketingSocietaView;
