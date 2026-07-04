/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UnicoOpportunitaView — PRODUZIONE di Unico · "Ricerca Opportunità" (PDF
 * "UNICO il processo"): ogni opportunità è un workflow a STEP OBBLIGATORI che
 * accompagna fino all'acquisto: Contatto → Sopralluogo → Raccolta → Analisi →
 * Due Diligence (checklist + PDF) → Manifestazione d'interesse (da modello) →
 * Negoziazione → Preliminare → Atto. A checklist DD completa si sblocca la
 * manifestazione; all'atto concluso l'opportunità DIVENTA UN INVESTIMENTO
 * (UnicoDeal). Nodo `unicoOpportunita/<id>`.
 */
import React from 'react';
import {
  Search, Plus, X, Trash2, ArrowLeft, CheckCircle2, Lock, Globe, Image as ImageIcon,
  FileText, ExternalLink, Building2, TrendingUp,
} from 'lucide-react';
import type { UnicoOpportunity, UnicoOppStepId, ClientRecord } from '../types';
import { eur, safeUrl } from '../utils';
import ContractPrintDoc from './ContractPrintDoc';

export const OPP_STEPS: { id: UnicoOppStepId; label: string; hint: string }[] = [
  { id: 'contatto', label: 'Contatto', hint: 'Agenzia o proprietario contattati.' },
  { id: 'sopralluogo', label: 'Sopralluogo', hint: 'Visita all\'immobile fatta.' },
  { id: 'raccolta', label: 'Raccolta documentazione', hint: 'Scheda, planimetrie, documenti raccolti.' },
  { id: 'analisi', label: 'Analisi tecnica', hint: 'Valutazione tecnica dell\'opportunità.' },
  { id: 'duediligence', label: 'Due Diligence', hint: 'Checklist obbligatoria completa (sotto).' },
  { id: 'manifestazione', label: 'Manifestazione d\'interesse', hint: 'Generata dal modello e inviata.' },
  { id: 'negoziazione', label: 'Negoziazione', hint: 'Trattativa sul prezzo/condizioni.' },
  { id: 'preliminare', label: 'Contratto preliminare', hint: 'Preliminare firmato, scadenze fissate.' },
  { id: 'atto', label: 'Atto notarile', hint: 'Acquisto concluso → nasce l\'investimento.' },
];
export const DD_ITEMS = [
  'Verifica urbanistica', 'Verifica catastale', 'Verifica ipotecaria', 'Verifica paesaggistica',
  'Eventuale frazionamento', 'Accessi', 'Servitù', 'Documentazione fotografica', 'Analisi economica',
];

interface Props {
  opps: UnicoOpportunity[];
  rubrica: ClientRecord[];
  color?: string;
  canEdit?: boolean;
  onSave?: (o: UnicoOpportunity) => void;
  onDelete?: (id: string) => void;
  /** Atto concluso → crea l'investimento (UnicoDeal) e collega dealId. */
  onCreateDeal?: (o: UnicoOpportunity) => void;
  onOpenInvestimenti?: () => void;
}

const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';
const doneCount = (o: UnicoOpportunity) => OPP_STEPS.filter((s) => o.steps?.[s.id]?.done).length;

export const UnicoOpportunitaView: React.FC<Props> = ({ opps, rubrica, color = '#4338ca', canEdit = false, onSave, onDelete, onCreateDeal, onOpenInvestimenti }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'attive' | 'acquisite' | 'scartate'>('attive');
  const open = opps.find((o) => o.id === openId) || null;

  if (open) return <OppDetail opp={open} rubrica={rubrica} color={color} canEdit={canEdit} onSave={onSave} onDelete={onDelete} onCreateDeal={onCreateDeal} onOpenInvestimenti={onOpenInvestimenti} onBack={() => setOpenId(null)} />;

  const list = opps.filter((o) => (filter === 'attive' ? o.status === 'attiva' : filter === 'acquisite' ? o.status === 'acquisita' : o.status === 'scartata'))
    .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  const nuova = () => {
    const o: UnicoOpportunity = { id: `opp-${Date.now().toString(36)}`, title: 'Nuova opportunità', status: 'attiva', steps: {}, dueDiligence: {}, createdAt: Date.now() };
    onSave?.(o); setOpenId(o.id);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Search className="w-5.5 h-5.5" style={{ color }} /> Ricerca Opportunità</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Workflow a step obbligatori: dal contatto all'atto. A checklist di due diligence completa si sblocca la manifestazione d'interesse; all'atto nasce l'investimento.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            {(['attive', 'acquisite', 'scartate'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none capitalize ${filter === f ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>{f}</button>
            ))}
          </div>
          {canEdit && <button onClick={nuova} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova opportunità</button>}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna opportunità {filter === 'attive' ? 'attiva' : filter}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((o) => {
            const n = doneCount(o);
            const next = OPP_STEPS.find((s) => !o.steps?.[s.id]?.done);
            return (
              <button key={o.id} onClick={() => setOpenId(o.id)} className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-[14px] text-[#161616] truncate">{o.title}</b>
                  {o.status === 'acquisita' && <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">Acquisita</span>}
                </div>
                <p className="text-[11.5px] text-[#8a8a8a] mt-0.5 truncate">{[o.comune, o.contactName].filter(Boolean).join(' · ') || '—'}</p>
                <div className="mt-2.5 h-2 rounded-full bg-[#f0f0f0] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(n / OPP_STEPS.length) * 100}%`, background: color }} /></div>
                <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-1">{n}/{OPP_STEPS.length} step{next ? ` · prossimo: ${next.label}` : ' · completata'}</p>
                {o.prezzoRichiesto != null && <p className="text-[12px] font-extrabold text-[#161616] mt-1">{eur(o.prezzoRichiesto)}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- dettaglio
const OppDetail: React.FC<{
  opp: UnicoOpportunity; rubrica: ClientRecord[]; color: string; canEdit: boolean;
  onSave?: (o: UnicoOpportunity) => void; onDelete?: (id: string) => void;
  onCreateDeal?: (o: UnicoOpportunity) => void; onOpenInvestimenti?: () => void; onBack: () => void;
}> = ({ opp: o, rubrica, color, canEdit, onSave, onDelete, onCreateDeal, onOpenInvestimenti, onBack }) => {
  const [showManif, setShowManif] = React.useState(false);
  const set = (c: Partial<UnicoOpportunity>) => onSave?.({ ...o, ...c, updatedAt: Date.now() });
  const ddDone = DD_ITEMS.every((k) => o.dueDiligence?.[k]);
  const stepState = (idx: number) => {
    const s = OPP_STEPS[idx];
    const done = !!o.steps?.[s.id]?.done;
    const prevDone = idx === 0 || !!o.steps?.[OPP_STEPS[idx - 1].id]?.done;
    const locked = !done && !prevDone;
    return { s, done, locked };
  };
  const toggleStep = (id: UnicoOppStepId, idx: number) => {
    if (!canEdit) return;
    const { done, locked } = stepState(idx);
    if (locked && !done) return;
    if (id === 'duediligence' && !done && !ddDone) return; // gate: checklist completa
    set({ steps: { ...(o.steps || {}), [id]: { done: !done, at: !done ? Date.now() : null } } });
  };
  const allDone = doneCount(o) === OPP_STEPS.length;

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0"><ArrowLeft className="w-4 h-4" /></button>
          <div className="min-w-0">
            <input
              disabled={!canEdit}
              value={o.title}
              onChange={(e) => set({ title: e.target.value })}
              className="text-[20px] font-black tracking-tight text-[#161616] bg-transparent border-none outline-none w-full min-w-0 p-0"
            />
            <p className="text-[11.5px] text-[#8a8a8a] font-semibold">{doneCount(o)}/{OPP_STEPS.length} step · {o.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && o.status === 'attiva' && (
            <button onClick={() => set({ status: 'scartata' })} className="px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-rose-300 text-rose-600 text-[12px] font-bold cursor-pointer">Scarta</button>
          )}
          {canEdit && onDelete && <button onClick={() => onDelete(o.id)} className="p-2 rounded-xl bg-white border border-[#e2e2e2] hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Workflow step obbligatori */}
        <div className="lg:col-span-3 bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex flex-col gap-1.5">
          <p className={`${lbl} mb-1`}>Workflow (step obbligatori, in ordine)</p>
          {OPP_STEPS.map((s, idx) => {
            const { done, locked } = stepState(idx);
            const gated = s.id === 'duediligence' && !done && !ddDone;
            return (
              <div key={s.id}>
                <div
                  onClick={() => toggleStep(s.id, idx)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${done ? 'border-emerald-200 bg-emerald-50/60' : locked ? 'border-[#f0f0f0] bg-[#fafafa] opacity-60' : 'border-[#e6e6e6] bg-white'} ${canEdit && !locked && !(gated) ? 'cursor-pointer hover:border-[#161616]' : ''}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${done ? 'bg-emerald-500 text-white' : locked ? 'bg-[#ececec] text-[#b0b0b0]' : 'text-white'}`} style={!done && !locked ? { background: color } : undefined}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : locked ? <Lock className="w-3 h-3" /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className={`block text-[13px] ${done ? 'text-emerald-900' : 'text-[#161616]'}`}>{s.label}</b>
                    <span className="block text-[10.5px] text-[#9a9a9a]">{gated ? 'Completa prima la checklist di due diligence.' : s.hint}</span>
                  </div>
                  {s.id === 'manifestazione' && !locked && (
                    <button onClick={(e) => { e.stopPropagation(); setShowManif(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[11px] font-bold cursor-pointer shrink-0"><FileText className="w-3 h-3" /> Genera</button>
                  )}
                </div>
                {/* Checklist Due Diligence inline */}
                {s.id === 'duediligence' && !locked && !done && (
                  <div className="mt-1.5 ml-8 rounded-xl border border-[#ececec] bg-[#fafaf8] p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {DD_ITEMS.map((k) => (
                      <label key={k} className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" disabled={!canEdit} checked={!!o.dueDiligence?.[k]} onChange={(e) => set({ dueDiligence: { ...(o.dueDiligence || {}), [k]: e.target.checked } })} className="w-3.5 h-3.5 accent-[#161616]" />
                        <span className="text-[12px] font-semibold text-[#333]">{k}</span>
                      </label>
                    ))}
                    <label className="flex flex-col gap-1 sm:col-span-2 mt-1"><span className={lbl}>PDF due diligence (link)</span>
                      <input disabled={!canEdit} value={o.ddPdfUrl || ''} onChange={(e) => set({ ddPdfUrl: e.target.value || null })} placeholder="https://…" className={inp} /></label>
                  </div>
                )}
              </div>
            );
          })}

          {/* Atto concluso → investimento */}
          {allDone && o.status !== 'acquisita' && canEdit && onCreateDeal && (
            <button onClick={() => onCreateDeal(o)} className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-[13px] font-bold cursor-pointer border-none" style={{ background: color }}>
              <TrendingUp className="w-4 h-4" /> Acquisto concluso: crea l'INVESTIMENTO
            </button>
          )}
          {o.status === 'acquisita' && (
            <p className="mt-2 text-[12.5px] font-bold text-emerald-700 inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Investimento creato.
              {onOpenInvestimenti && <button onClick={onOpenInvestimenti} className="underline cursor-pointer bg-transparent border-none p-0 text-emerald-700 font-bold">Vai a Investimenti Immobiliari</button>}
            </p>
          )}
        </div>

        {/* Scheda info tecniche/economiche */}
        <div className="lg:col-span-2 bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex flex-col gap-2.5">
          <p className={lbl}>Scheda opportunità</p>
          <label className="flex flex-col gap-1"><span className={lbl}>Contatto (agenzia/proprietario)</span>
            <select disabled={!canEdit} value={o.clientRecordId || ''} onChange={(e) => { const c = rubrica.find((x) => x.id === e.target.value); set({ clientRecordId: e.target.value || null, contactName: c?.name || o.contactName || null }); }} className={inp}>
              <option value="">— dal Registro Utenti —</option>
              {rubrica.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Comune</span><input disabled={!canEdit} value={o.comune || ''} onChange={(e) => set({ comune: e.target.value || null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Indirizzo</span><input disabled={!canEdit} value={o.address || ''} onChange={(e) => set({ address: e.target.value || null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Prezzo richiesto €</span><input disabled={!canEdit} type="number" value={o.prezzoRichiesto ?? ''} onChange={(e) => set({ prezzoRichiesto: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
            <label className="flex flex-col gap-1"><span className={lbl}>Nostra valutazione €</span><input disabled={!canEdit} type="number" value={o.valutazione ?? ''} onChange={(e) => set({ valutazione: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>
          </div>
          {([['earthUrl', 'Google Earth', Globe], ['photosUrl', 'Fotografie (link)', ImageIcon], ['docsUrl', 'Documentazione (link)', FileText]] as const).map(([key, label, Icon]) => (
            <label key={key} className="flex flex-col gap-1"><span className={`${lbl} inline-flex items-center gap-1`}><Icon className="w-3 h-3" /> {label}</span>
              <div className="flex items-center gap-1.5">
                <input disabled={!canEdit} value={(o as any)[key] || ''} onChange={(e) => set({ [key]: e.target.value || null } as any)} placeholder="https://…" className={inp} />
                {(o as any)[key] && safeUrl((o as any)[key]) && <a href={safeUrl((o as any)[key])!} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-[#e2e2e2] hover:border-[#161616] text-[#555] shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </div></label>
          ))}
          <label className="flex flex-col gap-1"><span className={lbl}>Note</span>
            <textarea disabled={!canEdit} value={o.note || ''} onChange={(e) => set({ note: e.target.value || null })} rows={3} className={`${inp} resize-none`} /></label>
        </div>
      </div>

      {showManif && (
        <ContractPrintDoc
          template="manifestazione"
          soc="unico"
          rubrica={rubrica}
          initialFields={{
            proponente: '', immobile: [o.title, o.address, o.comune].filter(Boolean).join(' — '),
            prezzo: o.valutazione != null ? String(o.valutazione) : (o.prezzoRichiesto != null ? String(o.prezzoRichiesto) : ''),
          }}
          onClose={() => setShowManif(false)}
        />
      )}
    </div>
  );
};

export default UnicoOpportunitaView;
