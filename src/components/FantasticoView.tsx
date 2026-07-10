/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FantasticoView — PRODUZIONE di Fantastico (gestione immobiliare, definizione
 * utente): IMMOBILI GESTITI + RICHIESTE/TICKET di servizio e manutenzione
 * smistate ai PARTNER ("dal tagliare il prato a trovare un van per gli ospiti").
 * Ogni ticket ha categoria, priorità, partner esecutore (Registro Utenti),
 * costo partner e prezzo cliente → margine. Nodi `fantImmobili` + `fantTickets`.
 */
import React from 'react';
import { Home, Plus, X, Trash2, Wrench, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { FantImmobile, FantTicket, FantTicketStatus, ClientRecord } from '../types';
import { eur, safeUrl } from '../utils';

const STATUS: { id: FantTicketStatus; label: string; color: string }[] = [
  { id: 'richiesta', label: 'Richiesta', color: '#6b7280' },
  { id: 'assegnato', label: 'Assegnato', color: '#b45309' },
  { id: 'in_corso', label: 'In corso', color: '#4338ca' },
  { id: 'completato', label: 'Completato', color: '#059669' },
  { id: 'annullato', label: 'Annullato', color: '#dc2626' },
];
const CATS = ['manutenzione', 'giardinaggio', 'pulizie', 'trasporti', 'ospiti', 'altro'] as const;
const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : null);

interface Props {
  immobili: FantImmobile[];
  tickets: FantTicket[];
  rubrica: ClientRecord[];
  color?: string;
  canEdit?: boolean;
  onSaveImmobile?: (i: FantImmobile) => void;
  onDeleteImmobile?: (id: string) => void;
  onSaveTicket?: (t: FantTicket) => void;
  onDeleteTicket?: (id: string) => void;
}

export const FantasticoView: React.FC<Props> = ({ immobili, tickets, rubrica, color = '#0d9488', canEdit = false, onSaveImmobile, onDeleteImmobile, onSaveTicket, onDeleteTicket }) => {
  const [tab, setTab] = React.useState<'immobili' | 'ticket'>('immobili');
  const [openImm, setOpenImm] = React.useState<string | null>(null);
  const [editImm, setEditImm] = React.useState<FantImmobile | null>(null);
  const [editTk, setEditTk] = React.useState<FantTicket | null>(null);
  const ym = new Date().toISOString().slice(0, 7);
  const openTickets = tickets.filter((t) => t.status !== 'completato' && t.status !== 'annullato');
  const doneMonth = tickets.filter((t) => t.status === 'completato' && (t.updatedAt ? new Date(t.updatedAt).toISOString().slice(0, 7) === ym : false));
  const margineMese = doneMonth.reduce((s, t) => s + ((t.prezzoCliente || 0) - (t.costoPartner || 0)), 0);
  const partners = rubrica.filter((c: any) => c.category === 'partner' || c.roles?.impresa || c.roles?.fornitore);
  const imm = immobili.find((i) => i.id === openImm) || null;

  const blankImm = (): FantImmobile => ({ id: `fi-${Date.now().toString(36)}`, name: '', active: true, createdAt: Date.now() });
  const blankTk = (immobileId: string): FantTicket => ({ id: `ft-${Date.now().toString(36)}`, immobileId, title: '', category: 'manutenzione', status: 'richiesta', priority: 'media', createdAt: Date.now() });

  if (imm) {
    const list = tickets.filter((t) => t.immobileId === imm.id).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setOpenImm(null)} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0"><ArrowLeft className="w-4 h-4" /></button>
            <div className="min-w-0">
              <h2 className="text-[20px] font-black tracking-tight text-[#161616] truncate">{imm.name}</h2>
              <p className="text-[11.5px] text-[#8a8a8a] font-semibold truncate">{[imm.address, imm.comune, imm.ownerName ? `proprietario ${imm.ownerName}` : null].filter(Boolean).join(' · ') || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {imm.photosUrl && safeUrl(imm.photosUrl) && <a href={safeUrl(imm.photosUrl)!} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#555]"><ExternalLink className="w-4 h-4" /></a>}
            {canEdit && <button onClick={() => setEditImm(imm)} className="px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[12px] font-bold cursor-pointer">Modifica scheda</button>}
            {canEdit && <button onClick={() => setEditTk(blankTk(imm.id))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova richiesta</button>}
          </div>
        </div>
        {list.length === 0 ? <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna richiesta per questo immobile.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((t) => <TicketCard key={t.id} t={t} onOpen={() => setEditTk(t)} />)}
          </div>
        )}
        {editTk && <TicketEditor ticket={editTk} immobili={immobili} partners={partners} canEdit={canEdit} onClose={() => setEditTk(null)} onSave={(t) => { onSaveTicket?.(t); setEditTk(null); }} onDelete={onDeleteTicket ? (id) => { onDeleteTicket(id); setEditTk(null); } : undefined} />}
        {editImm && <ImmobileEditor imm={editImm} rubrica={rubrica} canEdit={canEdit} onClose={() => setEditImm(null)} onSave={(i) => { onSaveImmobile?.(i); setEditImm(null); }} onDelete={onDeleteImmobile ? (id) => { onDeleteImmobile(id); setEditImm(null); setOpenImm(null); } : undefined} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Home className="w-5.5 h-5.5 text-[#161616]" /> Immobili & Servizi</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Gli immobili in gestione e le richieste di servizio smistate ai partner — dal taglio del prato al van per gli ospiti.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            <button onClick={() => setTab('immobili')} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === 'immobili' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}><Home className="w-3.5 h-3.5" /> Immobili ({immobili.length})</button>
            <button onClick={() => setTab('ticket')} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === 'ticket' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}><Wrench className="w-3.5 h-3.5" /> Richieste ({openTickets.length})</button>
          </div>
          {canEdit && (tab === 'immobili'
            ? <button onClick={() => setEditImm(blankImm())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuovo immobile</button>
            : <button onClick={() => { if (immobili.length) setEditTk(blankTk(immobili[0].id)); }} disabled={!immobili.length} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40"><Plus className="w-4 h-4" /> Nuova richiesta</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Immobili gestiti', v: String(immobili.filter((i) => i.active !== false).length) },
          { l: 'Richieste aperte', v: String(openTickets.length), c: openTickets.some((t) => t.priority === 'urgente') ? '#e11d48' : undefined },
          { l: 'Completate nel mese', v: String(doneMonth.length) },
          { l: 'Margine del mese', v: eur(margineMese) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {tab === 'immobili' && (
        immobili.length === 0 ? <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun immobile in gestione. Aggiungi il primo.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {immobili.map((i) => {
              const open = tickets.filter((t) => t.immobileId === i.id && t.status !== 'completato' && t.status !== 'annullato').length;
              return (
                <button key={i.id} onClick={() => setOpenImm(i.id)} className={`text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${i.active === false ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[14px] text-[#161616] truncate">{i.name}</b>
                    {open > 0 && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#161616] text-white shrink-0">{open} apert{open === 1 ? 'a' : 'e'}</span>}
                  </div>
                  <p className="text-[11.5px] text-[#8a8a8a] mt-0.5 truncate">{[i.address, i.comune].filter(Boolean).join(', ') || '—'}</p>
                  <p className="text-[11px] text-[#9a9a9a] mt-1 truncate">{i.ownerName ? `Proprietario: ${i.ownerName}` : '—'}{i.canoneMensile ? ` · canone ${eur(i.canoneMensile)}/mese` : ''}</p>
                </button>
              );
            })}
          </div>
        )
      )}

      {tab === 'ticket' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUS.filter((s) => s.id !== 'annullato').map((st) => {
            const col = tickets.filter((t) => t.status === st.id).sort((a, b) => (a.dueDate || '9').localeCompare(b.dueDate || '9'));
            return (
              <div key={st.id} className="min-w-[240px] w-[240px] shrink-0 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 px-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: st.color }} /><span className="text-[12px] font-extrabold text-[#161616]">{st.label}</span><span className="text-[#b0b0b0] font-bold text-[11px]">({col.length})</span></div>
                <div className="flex flex-col gap-2 bg-[#f6f6f4] border border-[#eee] rounded-[16px] p-2 min-h-[120px]">
                  {col.map((t) => <TicketCard key={t.id} t={t} compact immobile={immobili.find((i) => i.id === t.immobileId)} onOpen={() => setEditTk(t)} />)}
                  {col.length === 0 && <p className="text-[11px] text-[#b0b0b0] text-center py-4">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editImm && <ImmobileEditor imm={editImm} rubrica={rubrica} canEdit={canEdit} onClose={() => setEditImm(null)} onSave={(i) => { onSaveImmobile?.(i); setEditImm(null); }} onDelete={onDeleteImmobile ? (id) => { onDeleteImmobile(id); setEditImm(null); } : undefined} />}
      {editTk && <TicketEditor ticket={editTk} immobili={immobili} partners={partners} canEdit={canEdit} onClose={() => setEditTk(null)} onSave={(t) => { onSaveTicket?.(t); setEditTk(null); }} onDelete={onDeleteTicket ? (id) => { onDeleteTicket(id); setEditTk(null); } : undefined} />}
    </div>
  );
};

const TicketCard: React.FC<{ t: FantTicket; compact?: boolean; immobile?: FantImmobile; onOpen: () => void }> = ({ t, compact, immobile, onOpen }) => {
  const st = STATUS.find((s) => s.id === t.status) || STATUS[0];
  const margine = (t.prezzoCliente || 0) - (t.costoPartner || 0);
  return (
    <div onClick={onOpen} className={`bg-white border border-[#e6e6e6] rounded-[14px] shadow-sm cursor-pointer hover:border-[#cfcfcf] ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <div className="flex items-start justify-between gap-2">
        <b className={`${compact ? 'text-[12.5px]' : 'text-[13.5px]'} text-[#161616] leading-tight`}>{t.title || 'Richiesta'}</b>
        {t.priority === 'urgente' && <span className="text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 shrink-0">urgente</span>}
      </div>
      <p className="text-[10.5px] text-[#9a9a9a] mt-0.5 capitalize">{[t.category, immobile?.name, t.partnerName, fmtD(t.dueDate)].filter(Boolean).join(' · ')}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: st.color }}>{st.label}</span>
        {(t.prezzoCliente || t.costoPartner) ? <span className={`text-[10.5px] font-extrabold ${margine >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{eur(margine)} marg.</span> : null}
      </div>
    </div>
  );
};

const ImmobileEditor: React.FC<{ imm: FantImmobile; rubrica: ClientRecord[]; canEdit: boolean; onClose: () => void; onSave: (i: FantImmobile) => void; onDelete?: (id: string) => void }> = ({ imm, rubrica, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState(imm);
  const set = (c: Partial<FantImmobile>) => setD((p) => ({ ...p, ...c }));
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{imm.name ? 'Modifica immobile' : 'Nuovo immobile'}</h3>
          <div className="flex items-center gap-1">
            {canEdit && imm.name && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="flex flex-col gap-1"><span className={lbl}>Nome immobile</span><input disabled={!canEdit} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Es. Trullo Iris" className={inp} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Indirizzo</span><input disabled={!canEdit} value={d.address || ''} onChange={(e) => set({ address: e.target.value || null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Comune</span><input disabled={!canEdit} value={d.comune || ''} onChange={(e) => set({ comune: e.target.value || null })} className={inp} /></label>
          </div>
          <label className="flex flex-col gap-1"><span className={lbl}>Proprietario (Registro Utenti)</span>
            <select disabled={!canEdit} value={d.ownerRecordId || ''} onChange={(e) => { const c = rubrica.find((x) => x.id === e.target.value); set({ ownerRecordId: e.target.value || null, ownerName: c?.name || null }); }} className={inp}>
              <option value="">—</option>{rubrica.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Canone gestione €/mese</span><input disabled={!canEdit} type="number" value={d.canoneMensile ?? ''} onChange={(e) => set({ canoneMensile: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex items-center gap-2 self-end pb-2 cursor-pointer"><input type="checkbox" disabled={!canEdit} checked={d.active !== false} onChange={(e) => set({ active: e.target.checked })} className="w-4 h-4 accent-[#161616]" /><span className="text-[12.5px] font-bold text-[#161616]">In gestione attiva</span></label>
          </div>
          <label className="flex flex-col gap-1"><span className={lbl}>Foto (link)</span><input disabled={!canEdit} value={d.photosUrl || ''} onChange={(e) => set({ photosUrl: e.target.value || null })} placeholder="https://…" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Note</span><textarea disabled={!canEdit} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
          {canEdit && <button onClick={() => onSave({ ...d, name: d.name.trim() || 'Immobile', updatedAt: Date.now() })} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva</button>}
        </div>
      </div>
    </div>
  );
};

const TicketEditor: React.FC<{ ticket: FantTicket; immobili: FantImmobile[]; partners: ClientRecord[]; canEdit: boolean; onClose: () => void; onSave: (t: FantTicket) => void; onDelete?: (id: string) => void }> = ({ ticket, immobili, partners, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState(ticket);
  const set = (c: Partial<FantTicket>) => setD((p) => ({ ...p, ...c }));
  const margine = (d.prezzoCliente || 0) - (d.costoPartner || 0);
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{ticket.title ? 'Modifica richiesta' : 'Nuova richiesta di servizio'}</h3>
          <div className="flex items-center gap-1">
            {canEdit && ticket.title && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="flex flex-col gap-1"><span className={lbl}>Titolo</span><input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Taglio prato / Van per gli ospiti" className={inp} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Immobile</span>
              <select disabled={!canEdit} value={d.immobileId} onChange={(e) => set({ immobileId: e.target.value })} className={inp}>{immobili.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Categoria</span>
              <select disabled={!canEdit} value={d.category} onChange={(e) => set({ category: e.target.value as FantTicket['category'] })} className={inp}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Stato</span>
              <select disabled={!canEdit} value={d.status} onChange={(e) => set({ status: e.target.value as FantTicketStatus })} className={inp}>{STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Priorità</span>
              <select disabled={!canEdit} value={d.priority || 'media'} onChange={(e) => set({ priority: e.target.value as any })} className={inp}>{['urgente', 'alta', 'media', 'bassa'].map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
          </div>
          <label className="flex flex-col gap-1"><span className={lbl}>Partner esecutore (Registro Utenti)</span>
            <select disabled={!canEdit} value={d.partnerRecordId || ''} onChange={(e) => { const c = partners.find((x) => x.id === e.target.value); set({ partnerRecordId: e.target.value || null, partnerName: c?.name || null, status: e.target.value && d.status === 'richiesta' ? 'assegnato' : d.status }); }} className={inp}>
              <option value="">— da assegnare —</option>{partners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Costo partner €</span><input disabled={!canEdit} type="number" value={d.costoPartner ?? ''} onChange={(e) => set({ costoPartner: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Prezzo cliente €</span><input disabled={!canEdit} type="number" value={d.prezzoCliente ?? ''} onChange={(e) => set({ prezzoCliente: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <div className="flex flex-col gap-1"><span className={lbl}>Margine</span><div className={`h-9 flex items-center font-black text-[13.5px] ${margine >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{eur(margine)}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Entro il</span><input disabled={!canEdit} type="date" value={d.dueDate || ''} onChange={(e) => set({ dueDate: e.target.value || null })} className={inp} /></label>
          </div>
          <label className="flex flex-col gap-1"><span className={lbl}>Descrizione / note</span><textarea disabled={!canEdit} value={d.description || ''} onChange={(e) => set({ description: e.target.value || null })} rows={3} className={`${inp} resize-none`} /></label>
          {d.status === 'completato' && <p className="text-[11.5px] font-bold text-emerald-700 inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Completata: il margine entra nel conteggio del mese.</p>}
          {canEdit && <button onClick={() => onSave({ ...d, title: d.title.trim() || 'Richiesta', updatedAt: Date.now() })} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva</button>}
        </div>
      </div>
    </div>
  );
};

export default FantasticoView;
