/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ClientQuotesPanel — PREVENTIVO INTERATTIVO nel portale cliente.
 * Il cliente vede i preventivi condivisi dallo studio (snapshot
 * `clientQuotes/<uid>/<qid>`), spunta/toglie le voci NON obbligatorie e vede
 * il totale aggiornarsi in tempo reale; togliendo una voce compare un banner
 * che spiega quali vantaggi perde (catalogo serviceBenefits o testo della riga).
 * "Invia selezione" / "Accetta" scrivono la scelta su choice (regola: solo il
 * proprio uid) e avvisano lo studio.
 */
import React from 'react';
import { FileText, Lock, AlertTriangle, CheckCircle2, ChevronLeft, Send } from 'lucide-react';
import type { QuoteClientChoice, QuoteLine } from '../types';
import { quoteTotals } from '../finance';
import { eur } from '../utils';
import { benefitFor } from '../serviceBenefits';
import { companyDoc } from '../companyInfo';

/** Snapshot condiviso (scritto dallo studio, campi divulgabili del Quote). */
export interface SharedQuote {
  id: string;
  number: string;
  docKind?: 'preventivo' | 'parcella';
  division: string;
  clientName?: string;
  lines?: QuoteLine[];
  vatEnabled?: boolean; vatPct?: number;
  cassaEnabled?: boolean; cassaPct?: number;
  discountPct?: number | null; surchargePct?: number | null;
  validUntil?: string | null;
  notes?: string | null;
  status?: string;
  sharedAt?: number;
  choice?: QuoteClientChoice | null;
}

interface Props {
  quotes: SharedQuote[];
  onChoice?: (qid: string, choice: QuoteClientChoice) => void;
}

const SOC_COLOR: Record<string, string> = { studio: '#161616', strategico: '#b45309', materico: '#c2410c', unico: '#4338ca', fantastico: '#0d9488' };
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : null);

export const ClientQuotesPanel: React.FC<Props> = ({ quotes, onChoice }) => {
  const [openId, setOpenId] = React.useState<string | null>(quotes.length === 1 ? quotes[0].id : null);
  const open = quotes.find((q) => q.id === openId) || null;
  if (open) return <QuoteDetail quote={open} onBack={() => setOpenId(null)} onChoice={onChoice} />;
  return (
    <div className="flex flex-col gap-2.5">
      {quotes.length === 0 && <p className="text-[13px] text-[#8a8a8a] text-center py-6">Nessun preventivo condiviso al momento.</p>}
      {quotes.map((q) => {
        const co = companyDoc(q.division);
        const t = quoteTotals({ ...q, lines: (q.lines || []).filter((l) => !q.choice?.excluded?.[l.id]) });
        return (
          <button key={q.id} onClick={() => setOpenId(q.id)} className="text-left rounded-[18px] border border-[#ececec] bg-white p-4 hover:border-[#161616] cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 shrink-0" style={{ color: SOC_COLOR[q.division] || '#161616' }} />
                <b className="text-[13.5px] text-[#161616] truncate">{q.docKind === 'parcella' ? 'Parcella' : 'Preventivo'} {q.number}</b>
              </span>
              {q.choice?.accepted
                ? <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Accettato</span>
                : q.choice
                  ? <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Selezione inviata</span>
                  : <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Da rivedere</span>}
            </div>
            <p className="text-[11.5px] text-[#8a8a8a] mt-1">{co.brand} · totale <b className="text-[#161616]">{eur(t.totale)}</b>{q.validUntil ? ` · valido fino al ${fmtD(q.validUntil)}` : ''}</p>
          </button>
        );
      })}
    </div>
  );
};

const QuoteDetail: React.FC<{ quote: SharedQuote; onBack: () => void; onChoice?: (qid: string, choice: QuoteClientChoice) => void }> = ({ quote: q, onBack, onChoice }) => {
  const co = companyDoc(q.division);
  const color = SOC_COLOR[q.division] || '#161616';
  const lines = q.lines || [];
  const [excluded, setExcluded] = React.useState<Record<string, boolean>>({ ...(q.choice?.excluded || {}) });
  const [comment, setComment] = React.useState(q.choice?.comment || '');
  const [lastRemoved, setLastRemoved] = React.useState<string | null>(null);
  const accepted = !!q.choice?.accepted;

  const included = lines.filter((l) => !excluded[l.id]);
  const t = quoteTotals({ ...q, lines: included });
  const tFull = quoteTotals(q);
  const removedTotal = tFull.totale - t.totale;
  const dirty = JSON.stringify(excluded) !== JSON.stringify(q.choice?.excluded || {}) || comment !== (q.choice?.comment || '');

  const toggle = (l: QuoteLine) => {
    if (accepted || l.locked) return;
    setExcluded((p) => {
      const n = { ...p };
      if (n[l.id]) { delete n[l.id]; setLastRemoved(null); }
      else { n[l.id] = true; setLastRemoved(l.id); }
      return n;
    });
  };
  const send = (accept: boolean) => {
    onChoice?.(q.id, { excluded, comment: comment.trim() || null, accepted: accept, at: Date.now() });
  };

  return (
    <div className="flex flex-col gap-3">
      <button onClick={onBack} className="self-start inline-flex items-center gap-1 text-[12px] font-bold text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none p-0"><ChevronLeft className="w-4 h-4" /> Tutti i preventivi</button>

      <div className="rounded-[18px] border border-[#ececec] overflow-hidden">
        <div className="px-4 py-3" style={{ background: color }}>
          <p className="text-white font-black text-[15px] leading-tight">{q.docKind === 'parcella' ? 'Parcella' : 'Preventivo'} {q.number}</p>
          <p className="text-white/80 text-[11px] font-semibold">{co.legalName}{q.validUntil ? ` · valido fino al ${fmtD(q.validUntil)}` : ''}</p>
        </div>

        {/* Voci spuntabili */}
        <div className="p-3 flex flex-col gap-1.5">
          <p className="text-[11px] text-[#8a8a8a] font-semibold px-1">
            {accepted ? 'Hai accettato questo preventivo: la selezione è bloccata.' : 'Scegli le voci: il totale si aggiorna in tempo reale. Le voci col lucchetto sono necessarie.'}
          </p>
          {lines.map((l) => {
            const off = !!excluded[l.id];
            return (
              <div key={l.id}>
                <div
                  onClick={() => toggle(l)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${off ? 'border-[#eee] bg-[#fafafa] opacity-70' : 'border-[#e6e6e6] bg-white'} ${accepted || l.locked ? '' : 'cursor-pointer hover:border-[#161616]'}`}
                >
                  {l.locked ? (
                    <Lock className="w-4 h-4 text-[#b0b0b0] shrink-0" />
                  ) : (
                    <span className={`w-4.5 h-4.5 rounded-md border-2 shrink-0 flex items-center justify-center ${off ? 'border-[#d0d0d0] bg-white' : 'border-emerald-500 bg-emerald-500'}`}>
                      {!off && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </span>
                  )}
                  <span className={`flex-1 text-[12.5px] font-semibold ${off ? 'text-[#9a9a9a] line-through' : 'text-[#161616]'}`}>{l.desc || 'Voce'}</span>
                  <b className={`text-[13px] shrink-0 ${off ? 'text-[#b0b0b0] line-through' : 'text-[#161616]'}`}>{eur(l.amount || 0)}</b>
                </div>
                {/* Banner vantaggi persi */}
                {off && lastRemoved === l.id && !accepted && (
                  <div className="mt-1.5 mx-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11.5px] text-amber-900 leading-snug">{benefitFor(l.desc, l.benefits)}</p>
                      <button onClick={() => toggle(l)} className="mt-1 text-[11px] font-extrabold text-amber-800 underline cursor-pointer bg-transparent border-none p-0">Reincludi questa voce</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totali live */}
        <div className="border-t border-[#ececec] bg-[#fafaf8] px-4 py-3">
          {(t.sconto > 0 || t.maggiorazione > 0) && (
            <div className="flex justify-between text-[11.5px] text-[#8a8a8a] font-semibold"><span>Voci selezionate</span><span>{eur(t.righe)}</span></div>
          )}
          {t.sconto > 0 && <div className="flex justify-between text-[11.5px] text-rose-600 font-semibold"><span>Sconto {q.discountPct}%</span><span>−{eur(t.sconto)}</span></div>}
          {t.maggiorazione > 0 && <div className="flex justify-between text-[11.5px] text-[#8a8a8a] font-semibold"><span>Maggiorazione {q.surchargePct}%</span><span>+{eur(t.maggiorazione)}</span></div>}
          <div className="flex justify-between text-[12px] text-[#555] font-semibold"><span>Imponibile</span><span>{eur(t.imponibile)}</span></div>
          {t.cassa > 0 && <div className="flex justify-between text-[11.5px] text-[#8a8a8a] font-semibold"><span>Cassa {q.cassaPct ?? 4}%</span><span>{eur(t.cassa)}</span></div>}
          {t.iva > 0 && <div className="flex justify-between text-[11.5px] text-[#8a8a8a] font-semibold"><span>IVA {q.vatPct ?? 22}%</span><span>{eur(t.iva)}</span></div>}
          <div className="flex justify-between items-baseline mt-1 pt-1.5 border-t border-[#e2e2e2]">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#161616]">Totale</span>
            <span className="text-[20px] font-black" style={{ color }}>{eur(t.totale)}</span>
          </div>
          {removedTotal > 0.005 && <p className="text-right text-[10.5px] text-[#9a9a9a] font-semibold mt-0.5">−{eur(removedTotal)} rispetto alla proposta completa</p>}
        </div>
      </div>

      {q.notes && <p className="text-[11.5px] text-[#8a8a8a] px-1">{q.notes}</p>}

      {!accepted && (
        <>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Un commento per lo studio (facoltativo)…" className="w-full px-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white resize-none" />
          <div className="flex items-center gap-2">
            <button onClick={() => send(false)} disabled={!dirty && !!q.choice} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer disabled:opacity-40"><Send className="w-4 h-4" /> Invia selezione</button>
            <button onClick={() => send(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[12.5px] font-bold cursor-pointer border-none" style={{ background: color }}><CheckCircle2 className="w-4 h-4" /> Accetta ({eur(t.totale)})</button>
          </div>
          <p className="text-[10.5px] text-[#a8a8a8] text-center">Accettando confermi la selezione: lo studio ti ricontatterà per la firma.</p>
        </>
      )}
      {accepted && (
        <p className="text-[12.5px] font-bold text-emerald-700 inline-flex items-center gap-1.5 justify-center"><CheckCircle2 className="w-4 h-4" /> Preventivo accettato — lo studio ti ricontatterà per la firma.</p>
      )}
    </div>
  );
};

export default ClientQuotesPanel;
