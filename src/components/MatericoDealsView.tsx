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
  Target, Plus, X, Trash2, ChevronLeft, ChevronRight, MapPin, User, TrendingUp, Percent, Euro, FileText, Calculator,
} from 'lucide-react';
import type { MatericoDeal, MatericoDealStage, MatericoDiscipline, MatericoPriceItem, MatericoComputoRow, MatericoCashRow } from '../types';
import { eur } from '../utils';
import { listinoPrezzo } from './MatericoListinoView';

interface Member { uid: string; name: string; }
interface ClientOpt { id: string; name: string; }
interface Props {
  deals: Record<string, MatericoDeal>;
  members: Member[];
  clients?: ClientOpt[];
  listino?: MatericoPriceItem[];
  color?: string;
  canEdit?: boolean;
  onSave?: (d: MatericoDeal) => void;
  onDelete?: (id: string) => void;
  onGenerateQuote?: (d: MatericoDeal) => void;
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

export const MatericoDealsView: React.FC<Props> = ({ deals, members, clients = [], listino = [], color = '#c2410c', canEdit = false, onSave, onDelete, onGenerateQuote }) => {
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

      {editing && <DealEditor deal={editing} members={members} clients={clients} listino={listino} canEdit={canEdit} onClose={() => setEditing(null)} onSave={(d) => { onSave?.(d); setEditing(null); }} onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined} onGenerateQuote={onGenerateQuote} />}
    </div>
  );
};

const DealEditor: React.FC<{ deal: MatericoDeal; members: Member[]; clients: ClientOpt[]; listino: MatericoPriceItem[]; canEdit: boolean; onClose: () => void; onSave: (d: MatericoDeal) => void; onDelete?: (id: string) => void; onGenerateQuote?: (d: MatericoDeal) => void }> = ({ deal, members, clients, listino, canEdit, onClose, onSave, onDelete, onGenerateQuote }) => {
  const [d, setD] = React.useState<MatericoDeal>({ ...deal, computo: deal.computo || [], cash: deal.cash || [] });
  const [tab, setTab] = React.useState<'dati' | 'computo' | 'economia'>('dati');
  const set = (c: Partial<MatericoDeal>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';

  // Computo & controllo margini (§5, §11)
  const rows = d.computo || [];
  const costoDiretto = rows.reduce((s, r) => s + (r.costoUnit || 0) * (r.qty || 0), 0);
  const indiretti = costoDiretto * ((d.costiIndirettiPct || 0) / 100);
  const costoTotale = costoDiretto + indiretti;
  const ricavo = rows.reduce((s, r) => s + (r.prezzoUnit || 0) * (r.qty || 0), 0);
  const utile = ricavo - costoTotale;
  const mpctComputo = ricavo > 0 ? (utile / ricavo) * 100 : 0;
  const hasComputo = rows.length > 0;

  const setRow = (id: string, c: Partial<MatericoComputoRow>) => setD((p) => ({ ...p, computo: (p.computo || []).map((r) => (r.id === id ? { ...r, ...c } : r)) }));
  const rmRow = (id: string) => setD((p) => ({ ...p, computo: (p.computo || []).filter((r) => r.id !== id) }));
  const addFree = () => setD((p) => ({ ...p, computo: [...(p.computo || []), { id: `cr-${Date.now()}`, description: '', unit: null, qty: 1, costoUnit: 0, prezzoUnit: 0, category: 'opere_edili' }] }));
  const addFromListino = (lid: string) => { const li = listino.find((x) => x.id === lid); if (!li) return; setD((p) => ({ ...p, computo: [...(p.computo || []), { id: `cr-${Date.now()}-${Math.floor(Math.random() * 900)}`, listinoId: li.id, category: li.category, description: li.description, unit: li.unit || null, qty: 1, costoUnit: (li.costoImprese || 0) + (li.costoMateriali || 0), prezzoUnit: listinoPrezzo(li) }] })); };

  // In salvataggio: se c'è un computo, allinea valore/costo della commessa
  const doSave = () => onSave(hasComputo ? { ...d, title: d.title.trim() || 'Commessa', valoreStimato: Math.round(ricavo), costoStimato: Math.round(costoTotale), updatedAt: Date.now() } : { ...d, title: d.title.trim() || 'Commessa', updatedAt: Date.now() });
  const genQuote = () => {
    const synced: MatericoDeal = { ...d, title: d.title.trim() || 'Commessa', valoreStimato: Math.round(ricavo), costoStimato: Math.round(costoTotale), stage: d.stage === 'nuovo' || d.stage === 'valutazione' ? 'preventivo' : d.stage, updatedAt: Date.now() };
    onGenerateQuote?.(synced);
    onClose();
  };

  // Economia commessa (§10)
  const cash = d.cash || [];
  const entrate = cash.filter((r) => r.kind === 'entrata');
  const uscite = cash.filter((r) => r.kind === 'uscita');
  const sum = (arr: MatericoCashRow[], onlyDone = false) => arr.filter((r) => !onlyDone || r.done).reduce((s, r) => s + (r.amount || 0), 0);
  const entTot = sum(entrate), entDone = sum(entrate, true), uscTot = sum(uscite), uscDone = sum(uscite, true);
  const addCash = (kind: 'entrata' | 'uscita') => setD((p) => ({ ...p, cash: [...(p.cash || []), { id: `ch-${Date.now()}-${Math.floor(Math.random() * 900)}`, kind, label: '', category: null, amount: 0, date: null, done: false }] }));
  const setCash = (id: string, c: Partial<MatericoCashRow>) => setD((p) => ({ ...p, cash: (p.cash || []).map((r) => (r.id === id ? { ...r, ...c } : r)) }));
  const rmCash = (id: string) => setD((p) => ({ ...p, cash: (p.cash || []).filter((r) => r.id !== id) }));

  const margine = (d.valoreStimato || 0) - (d.costoStimato || 0);
  const mpct = (d.valoreStimato || 0) > 0 ? (margine / (d.valoreStimato as number)) * 100 : 0;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{deal.title ? 'Commessa potenziale' : 'Nuova commessa potenziale'}</h3>
          <div className="flex items-center gap-1">
            {canEdit && deal.title && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] mb-3">
          {([['dati', 'Dati'], ['computo', 'Computo & margini'], ['economia', 'Economia']] as const).map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
          ))}
        </div>

        {tab === 'dati' ? (
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
          {hasComputo && <p className="text-[11px] text-[#9a9a9a]">Valore e costo sono allineati automaticamente dal computo al salvataggio.</p>}
          {canEdit && <button onClick={doSave} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva commessa</button>}
        </div>
        ) : tab === 'computo' ? (
        <div className="flex flex-col gap-3">
          {/* Aggiungi voci */}
          {canEdit && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <select value="" onChange={(e) => { if (e.target.value) addFromListino(e.target.value); }} className={inp}>
                  <option value="">＋ Aggiungi da listino…</option>
                  {listino.slice().sort((a, b) => a.description.localeCompare(b.description)).map((li) => <option key={li.id} value={li.id}>{li.description} · {eur(listinoPrezzo(li))}{li.unit ? `/${li.unit}` : ''}</option>)}
                </select>
              </div>
              <button onClick={addFree} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Plus className="w-3.5 h-3.5" /> Riga libera</button>
            </div>
          )}
          {rows.length === 0 ? <p className="text-[13px] text-[#9a9a9a] text-center py-6 bg-[#fafafa] rounded-xl border border-[#eee]">Nessuna voce nel computo. Aggiungi dal listino o una riga libera.</p> : (
            <div className="overflow-x-auto border border-[#eee] rounded-xl">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead><tr className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0] border-b border-[#f0f0f0]">
                  <th className="py-2 px-2.5">Lavorazione</th><th className="py-2 px-1.5 w-14">Q.tà</th><th className="py-2 px-1.5 w-20 text-right">Costo u.</th><th className="py-2 px-1.5 w-20 text-right">Prezzo u.</th><th className="py-2 px-1.5 w-20 text-right">Ricavo</th><th className="py-2 px-1"></th>
                </tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[#f6f6f6]">
                      <td className="py-1.5 px-2.5"><input disabled={!canEdit} value={r.description} onChange={(e) => setRow(r.id, { description: e.target.value })} placeholder="Descrizione" className="w-full px-2 py-1 rounded border border-[#eee] text-[12px] outline-none focus:border-[#161616] bg-white" />{r.unit && <span className="text-[10px] text-[#b0b0b0]">{r.unit}</span>}</td>
                      <td className="py-1.5 px-1.5"><input disabled={!canEdit} type="number" value={r.qty} onChange={(e) => setRow(r.id, { qty: Number(e.target.value) || 0 })} className="w-full px-1.5 py-1 rounded border border-[#eee] text-[12px] text-right outline-none focus:border-[#161616] bg-white" /></td>
                      <td className="py-1.5 px-1.5"><input disabled={!canEdit} type="number" value={r.costoUnit} onChange={(e) => setRow(r.id, { costoUnit: Number(e.target.value) || 0 })} className="w-full px-1.5 py-1 rounded border border-[#eee] text-[12px] text-right outline-none focus:border-[#161616] bg-white" /></td>
                      <td className="py-1.5 px-1.5"><input disabled={!canEdit} type="number" value={r.prezzoUnit} onChange={(e) => setRow(r.id, { prezzoUnit: Number(e.target.value) || 0 })} className="w-full px-1.5 py-1 rounded border border-[#eee] text-[12px] text-right outline-none focus:border-[#161616] bg-white" /></td>
                      <td className="py-1.5 px-1.5 text-[12px] text-right font-bold text-[#161616]">{eur((r.prezzoUnit || 0) * (r.qty || 0))}</td>
                      <td className="py-1.5 px-1 text-right">{canEdit && <button onClick={() => rmRow(r.id)} className="text-rose-400 hover:text-rose-600 cursor-pointer bg-transparent border-none"><X className="w-3.5 h-3.5" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <label className="flex items-center justify-between gap-2 bg-[#fafafa] border border-[#eee] rounded-xl px-3 py-2">
            <span className="text-[12px] font-semibold text-[#444]">Costi indiretti (% sul costo diretto)</span>
            <input disabled={!canEdit} type="number" value={d.costiIndirettiPct ?? ''} onChange={(e) => set({ costiIndirettiPct: e.target.value ? Number(e.target.value) : null })} placeholder="0" className="w-20 px-2 py-1.5 rounded-lg border border-[#e2e2e2] text-[12.5px] text-right outline-none focus:border-[#161616] bg-white" />
          </label>

          {/* Controllo margini (§11) */}
          <div className="rounded-[16px] border border-[#e2e2e2] overflow-hidden">
            <div className="bg-[#161616] text-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 w-full"><Calculator className="w-3.5 h-3.5" /> Controllo margini</div>
            <div className="p-3 grid grid-cols-2 gap-y-1.5 gap-x-4 text-[12.5px]">
              <span className="text-[#8a8a8a]">Costo diretto (imprese+materiali)</span><span className="text-right font-semibold text-[#161616]">{eur(costoDiretto)}</span>
              <span className="text-[#8a8a8a]">Costi indiretti</span><span className="text-right font-semibold text-[#161616]">{eur(indiretti)}</span>
              <span className="text-[#8a8a8a]">Costo totale</span><span className="text-right font-bold text-[#161616]">{eur(costoTotale)}</span>
              <span className="text-[#8a8a8a]">Ricavo (preventivo)</span><span className="text-right font-bold text-[#161616]">{eur(ricavo)}</span>
              <span className="text-[#444] font-bold pt-1 border-t border-[#f0f0f0]">Utile previsto</span><span className={`text-right font-black pt-1 border-t border-[#f0f0f0] ${utile >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{eur(utile)}</span>
              <span className="text-[#444] font-bold">Margine %</span><span className={`text-right font-black ${mpctComputo >= 15 ? 'text-emerald-700' : mpctComputo > 0 ? 'text-amber-700' : 'text-rose-700'}`}>{mpctComputo.toFixed(1)}%</span>
            </div>
            {mpctComputo < 10 && ricavo > 0 && <div className="px-3 pb-2 -mt-1 text-[11.5px] font-bold text-rose-600">⚠ Margine basso: verifica prima di contrattualizzare.</div>}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={doSave} className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[13px] font-bold cursor-pointer">Salva computo</button>
              <button onClick={genQuote} disabled={!hasComputo || !onGenerateQuote} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40"><FileText className="w-4 h-4" /> Genera preventivo</button>
            </div>
          )}
          {d.quoteId && <p className="text-[11.5px] text-emerald-600 font-semibold text-center">Preventivo già generato per questa commessa.</p>}
        </div>
        ) : (
        <div className="flex flex-col gap-3">
          {/* ECONOMIA COMMESSA (§10): entrate/uscite programmate */}
          {([['entrata', 'Entrate', entrate, ['Acconto', 'SAL', 'Pagamento', 'Finanziamento']], ['uscita', 'Uscite', uscite, ['Imprese', 'Materiali', 'Fornitori', 'Consulenti', 'Costi tecnici', 'Costi amministrativi']]] as const).map(([kind, label, arr, cats]) => (
            <div key={kind}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">{label}</span>
                {canEdit && <button onClick={() => addCash(kind)} className="text-[11.5px] font-bold text-[#161616] inline-flex items-center gap-1 cursor-pointer bg-transparent border-none"><Plus className="w-3.5 h-3.5" /> Riga</button>}
              </div>
              {arr.length === 0 ? <p className="text-[11.5px] text-[#b0b0b0] italic pb-1">Nessuna voce.</p> : (
                <div className="flex flex-col gap-1.5">
                  {arr.map((r) => (
                    <div key={r.id} className="flex items-center gap-1.5">
                      <input disabled={!canEdit} value={r.label} onChange={(e) => setCash(r.id, { label: e.target.value })} placeholder="Descrizione" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-[#eee] text-[12px] outline-none focus:border-[#161616] bg-white" />
                      <select disabled={!canEdit} value={r.category || ''} onChange={(e) => setCash(r.id, { category: e.target.value || null })} className="w-28 px-1.5 py-1.5 rounded-lg border border-[#eee] text-[11px] outline-none focus:border-[#161616] bg-white">
                        <option value="">—</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input disabled={!canEdit} type="number" value={r.amount || ''} onChange={(e) => setCash(r.id, { amount: Number(e.target.value) || 0 })} placeholder="€" className="w-24 px-2 py-1.5 rounded-lg border border-[#eee] text-[12px] text-right outline-none focus:border-[#161616] bg-white" />
                      <input disabled={!canEdit} type="date" value={r.date || ''} onChange={(e) => setCash(r.id, { date: e.target.value || null })} className="w-32 px-1.5 py-1.5 rounded-lg border border-[#eee] text-[11px] outline-none focus:border-[#161616] bg-white" />
                      <button disabled={!canEdit} onClick={() => setCash(r.id, { done: !r.done })} title={r.done ? (kind === 'entrata' ? 'Incassato' : 'Pagato') : 'Da fare'} className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer border ${r.done ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-[#c0c0c0] border-[#e2e2e2]'}`}><CheckCircle2 className="w-4 h-4" /></button>
                      {canEdit && <button onClick={() => rmCash(r.id)} className="text-rose-400 hover:text-rose-600 cursor-pointer bg-transparent border-none shrink-0"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Riepilogo liquidità */}
          <div className="rounded-[16px] border border-[#e2e2e2] overflow-hidden">
            <div className="bg-[#161616] text-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 w-full"><Euro className="w-3.5 h-3.5" /> Liquidità commessa</div>
            <div className="p-3 grid grid-cols-3 gap-y-1.5 gap-x-3 text-[12.5px]">
              <span className="text-[#8a8a8a]" />
              <span className="text-right font-bold text-[#a0a0a0] text-[10px] uppercase">Previsto</span>
              <span className="text-right font-bold text-[#a0a0a0] text-[10px] uppercase">Realizzato</span>
              <span className="text-[#8a8a8a]">Entrate</span><span className="text-right font-semibold text-emerald-700">{eur(entTot)}</span><span className="text-right font-semibold text-emerald-700">{eur(entDone)}</span>
              <span className="text-[#8a8a8a]">Uscite</span><span className="text-right font-semibold text-rose-700">{eur(uscTot)}</span><span className="text-right font-semibold text-rose-700">{eur(uscDone)}</span>
              <span className="text-[#444] font-bold pt-1 border-t border-[#f0f0f0]">Saldo</span>
              <span className={`text-right font-black pt-1 border-t border-[#f0f0f0] ${entTot - uscTot >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{eur(entTot - uscTot)}</span>
              <span className={`text-right font-black pt-1 border-t border-[#f0f0f0] ${entDone - uscDone >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{eur(entDone - uscDone)}</span>
            </div>
          </div>
          {canEdit && <button onClick={doSave} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva economia</button>}
        </div>
        )}
      </div>
    </div>
  );
};

export default MatericoDealsView;
