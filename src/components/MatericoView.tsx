/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MATERICO — hub operatore.
 * Riceve le richieste dei clienti, suggerisce i partner per tipo di lavorazione,
 * inoltra la richiesta, raccoglie e ordina le offerte, seleziona la migliore,
 * applica il margine e invia l'offerta finale al cliente con contratto.
 */

import React, { useMemo, useState } from 'react';
import {
  Inbox, X, ChevronLeft, Send, Check, Building2, FileText, Euro,
  ArrowRight, Link as LinkIcon, Layers, Trophy, AlertTriangle
} from 'lucide-react';
import type { MatericoRequest, MatericoOffer } from '../types';
import type { Supplier } from './CrmView';
import { eur, safeUrl, forwardedUids } from '../utils';
import { matericoMargin, matericoPenalty, delayDays } from '../finance';

interface MatericoViewProps {
  requests: MatericoRequest[];
  suppliers: Supplier[];
  onUpdateRequest: (req: MatericoRequest) => void;
  onDeleteRequest: (id: string) => void;
  onApplyPenalty?: (reqId: string) => void;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  nuova: { label: 'Nuova', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  inoltrata: { label: 'Inoltrata ai partner', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  offerte: { label: 'Offerte ricevute', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  inviata_cliente: { label: 'Inviata al cliente', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  accettata: { label: 'Accettata', cls: 'bg-green-50 text-green-850 border-green-200' },
  rifiutata: { label: 'Rifiutata', cls: 'bg-gray-100 text-gray-600 border-gray-200' }
};

const buildContract = (req: MatericoRequest, partnerName: string, partnerAmount: number, clientPrice: number) => {
  const d = new Date().toLocaleDateString('it-IT');
  return `CONTRATTO DI FORNITURA E POSA — MATERICO (società controllata Onirico)
Data: ${d}
Rif. richiesta: ${req.id}

Committente: ${req.clientName}
Oggetto: ${req.title}${req.category ? ' (' + req.category + ')' : ''}
${req.description ? 'Descrizione: ' + req.description + '\n' : ''}
Impresa esecutrice (partner): ${partnerName}
Importo lavori impresa: ${eur(partnerAmount)}
Corrispettivo al committente (gestione e coordinamento Materico inclusi): ${eur(clientPrice)}

Materico coordina e controlla l'esecuzione delle lavorazioni. Pagamenti secondo
SAL. Il presente documento è una bozza generata automaticamente da Aulico.`;
};

export const MatericoView: React.FC<MatericoViewProps> = ({
  requests,
  suppliers,
  onUpdateRequest,
  onDeleteRequest,
  onApplyPenalty
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [selPartner, setSelPartner] = useState('');
  const [margin, setMargin] = useState('15');

  const active = openId ? requests.find((r) => r.id === openId) : null;

  // suggerimento partner per tipo di lavorazione
  const suggested = useMemo(() => {
    if (!active) return [];
    const cat = (active.category || active.title || '').toLowerCase();
    const matches = suppliers.filter((s) => {
      const c = `${s.category || ''} ${s.name || ''}`.toLowerCase();
      return cat && c && cat.split(/[\s/,-]+/).some((w) => w.length > 2 && c.includes(w));
    });
    return matches.length > 0 ? matches : suppliers;
  }, [active, suppliers]);

  const openRequest = (r: MatericoRequest) => {
    setOpenId(r.id);
    setPicked(Object.fromEntries(forwardedUids(r.forwardedTo).map((u) => [u, true])));
    setSelPartner(r.selectedPartnerUid || '');
    setMargin(String(r.marginPct ?? 15));
  };

  const forward = () => {
    if (!active) return;
    const to = Object.keys(picked).filter((k) => picked[k]);
    if (to.length === 0) return;
    onUpdateRequest({ ...active, forwardedTo: Object.fromEntries(to.map((u) => [u, true])), status: 'inoltrata', updatedAt: Date.now() });
  };

  const offersRanked = (r: MatericoRequest): MatericoOffer[] =>
    Object.values(r.offers || {}).sort((a, b) => a.amount - b.amount);

  const sendToClient = () => {
    if (!active || !selPartner) return;
    const offer = (active.offers || {})[selPartner];
    if (!offer) return;
    const m = Number(margin.replace(/,/g, '.')) || 0;
    const clientPrice = Math.round(offer.amount * (1 + m / 100));
    onUpdateRequest({
      ...active,
      selectedPartnerUid: selPartner,
      marginPct: m,
      clientPrice,
      contractText: buildContract(active, offer.partnerName, offer.amount, clientPrice),
      status: 'inviata_cliente',
      updatedAt: Date.now()
    });
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
          <Inbox className="w-5 h-5" /> Materico — Richieste
        </h2>
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">
          Richieste clienti, inoltro ai partner, confronto offerte e invio al cliente.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessuna richiesta. Arriveranno qui quelle inviate dai clienti dal portale.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.sort((a, b) => b.createdAt - a.createdAt).map((r) => {
            const st = STATUS[r.status] || STATUS.nuova;
            const nOffers = Object.keys(r.offers || {}).length;
            return (
              <div key={r.id} onClick={() => openRequest(r)} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 hover:border-black hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 border-l-[5px]" style={{ borderLeftColor: '#c2410c' }}>
                <div className="flex items-start justify-between gap-2">
                  <b className="text-[14.5px] text-[#161616] truncate">{r.title}</b>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
                <span className="text-[12px] text-[#8a8a8a]">{r.clientName}{r.category ? ` · ${r.category}` : ''}</span>
                <div className="pt-2 border-t border-dashed border-[#ececec] flex items-center justify-between text-[11px] text-[#8a8a8a] font-bold">
                  <span>{(r.items || []).length} voci</span>
                  {nOffers > 0 && <span className="text-violet-700">{nOffers} offerte</span>}
                  {r.clientPrice ? <span className="text-[#161616]">{eur(r.clientPrice)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETTAGLIO RICHIESTA */}
      {active && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpenId(null)}>
          <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-[620px] max-h-[92vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-[18px] font-black text-[#161616]">{active.title}</h3>
                <p className="text-[12.5px] text-[#8a8a8a]">{active.clientName}{active.category ? ` · ${active.category}` : ''}</p>
                <span className={`inline-block mt-2 text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${(STATUS[active.status] || STATUS.nuova).cls}`}>{(STATUS[active.status] || STATUS.nuova).label}</span>
              </div>
              <button onClick={() => setOpenId(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {active.description && <p className="text-[13px] text-[#333] mb-3">{active.description}</p>}

            {/* Voci richieste */}
            {(active.items || []).length > 0 && (
              <div className="mb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] flex items-center gap-1.5 mb-2"><Layers className="w-3.5 h-3.5" /> Quantità richieste</span>
                <div className="flex flex-col gap-1.5">
                  {active.items!.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-[13px] bg-gray-50 border border-[#f0f0f0] rounded-lg px-3 py-2">
                      <span className="text-[#161616]">{it.desc}</span>
                      <b className="text-[#161616]">{it.qty} {it.unit}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(active.links || []).length > 0 && (
              <div className="mb-4 flex flex-col gap-1">
                {active.links!.map((l, i) => (
                  <a key={i} href={safeUrl(l) || '#'} target="_blank" rel="noreferrer" className="text-[12px] text-sky-700 hover:underline flex items-center gap-1.5 truncate"><LinkIcon className="w-3.5 h-3.5 shrink-0" />{l}</a>
                ))}
              </div>
            )}
            {active.note && <p className="text-[12px] italic text-[#8a8a8a] mb-4">Note: {active.note}</p>}

            {/* STEP 1: inoltro ai partner */}
            {(active.status === 'nuova' || active.status === 'inoltrata') && (
              <div className="border border-[#ececec] rounded-2xl p-4 mb-4">
                <b className="text-[13px] text-[#161616] flex items-center gap-1.5 mb-2"><Building2 className="w-4 h-4" /> Partner consigliati</b>
                {suggested.length === 0 ? (
                  <p className="text-[12px] italic text-[#8a8a8a]">Nessun partner in rubrica. Aggiungili dal CRM → Fornitori.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {suggested.map((s) => (
                      <label key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={!!picked[s.id]} onChange={(e) => setPicked((p) => ({ ...p, [s.id]: e.target.checked }))} />
                        <span className="text-[13px] text-[#161616] font-semibold">{s.name}</span>
                        {s.category && <span className="text-[11px] text-[#8a8a8a]">· {s.category}</span>}
                      </label>
                    ))}
                  </div>
                )}
                <button onClick={forward} className="w-full py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Inoltra ai partner selezionati
                </button>
              </div>
            )}

            {/* STEP 2: offerte ricevute, ordinate */}
            {Object.keys(active.offers || {}).length > 0 && (
              <div className="border border-[#ececec] rounded-2xl p-4 mb-4">
                <b className="text-[13px] text-[#161616] flex items-center gap-1.5 mb-2"><Trophy className="w-4 h-4" /> Offerte (dalla più conveniente)</b>
                <div className="flex flex-col gap-2 mb-3">
                  {offersRanked(active).map((o, i) => (
                    <label key={o.partnerUid} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer ${selPartner === o.partnerUid ? 'border-black bg-gray-50' : 'border-[#f0f0f0]'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input type="radio" name="sel" checked={selPartner === o.partnerUid} onChange={() => setSelPartner(o.partnerUid)} />
                        <div className="min-w-0">
                          <b className="text-[13px] text-[#161616] block truncate">{i === 0 ? '🏆 ' : ''}{o.partnerName}</b>
                          {o.note && <span className="text-[11px] text-[#8a8a8a] truncate block">{o.note}</span>}
                        </div>
                      </div>
                      <b className="text-[14px] text-[#161616] shrink-0">{eur(o.amount)}</b>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold text-[#8a8a8a]">Margine Materico</span>
                  <input value={margin} onChange={(e) => setMargin(e.target.value)} inputMode="decimal" className="w-16 h-9 border border-[#e2e2e2] rounded-lg px-2 text-[13px] text-center" />
                  <span className="text-[12px] font-bold text-[#8a8a8a]">%</span>
                  {selPartner && (active.offers || {})[selPartner] && (
                    <span className="ml-auto text-[13px] font-extrabold text-[#161616]">
                      Al cliente: {eur(Math.round((active.offers![selPartner].amount) * (1 + (Number(margin.replace(/,/g, '.')) || 0) / 100)))}
                    </span>
                  )}
                </div>
                <button onClick={sendToClient} disabled={!selPartner} className="w-full py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50">
                  <ArrowRight className="w-4 h-4" /> Invia offerta migliore al cliente
                </button>
              </div>
            )}

            {/* Contratto generato */}
            {active.contractText && (
              <div className="border border-[#ececec] rounded-2xl p-4 mb-4">
                <b className="text-[13px] text-[#161616] flex items-center gap-1.5 mb-2"><FileText className="w-4 h-4" /> Bozza contratto</b>
                <pre className="text-[11px] text-[#333] whitespace-pre-wrap font-sans bg-gray-50 border border-[#f0f0f0] rounded-lg p-3 max-h-[180px] overflow-y-auto">{active.contractText}</pre>
              </div>
            )}

            {/* PENALI per ritardo (partner selezionato) */}
            {active.selectedPartnerUid && (active.status === 'inviata_cliente' || active.status === 'accettata') && (() => {
              const base = matericoMargin(active).baseCost;
              const days = delayDays(active.agreedDeliveryDate, active.completedDate);
              const calc = matericoPenalty(base, days);
              const applied = active.penalty?.status === 'applicata';
              return (
                <div className="border border-[#ececec] rounded-2xl p-4 mb-4">
                  <b className="text-[13px] text-[#161616] flex items-center gap-1.5 mb-3"><AlertTriangle className="w-4 h-4 text-amber-600" /> Penali per ritardo</b>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#8a8a8a]">Scadenza concordata</span>
                      <input type="date" value={active.agreedDeliveryDate || ''} disabled={applied}
                        onChange={(e) => onUpdateRequest({ ...active, agreedDeliveryDate: e.target.value || null })}
                        className="h-9 border border-[#e2e2e2] rounded-lg px-2 text-[13px]" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#8a8a8a]">Consegna effettiva</span>
                      <input type="date" value={active.completedDate || ''} disabled={applied}
                        onChange={(e) => onUpdateRequest({ ...active, completedDate: e.target.value || null })}
                        className="h-9 border border-[#e2e2e2] rounded-lg px-2 text-[13px]" />
                    </label>
                  </div>
                  {applied ? (
                    <div className="text-[12.5px] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900">
                      Penale applicata: <b>{eur(active.penalty!.amount)}</b> ({active.penalty!.days} gg · {active.penalty!.pctPerDay}%/gg{active.penalty!.capped ? ', a tetto' : ''}). Registrata in finanza come nota di credito.
                    </div>
                  ) : days > 0 ? (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[12.5px] text-[#333]">
                        Ritardo <b>{days} gg</b> → penale proposta <b>{eur(calc.amount)}</b>
                        <span className="text-[#8a8a8a]"> ({calc.pctPerDay}%/gg su {eur(base)}{calc.capped ? `, tetto ${calc.capPct}%` : ''})</span>
                      </span>
                      {onApplyPenalty && (
                        <button onClick={() => onApplyPenalty(active.id)} className="text-[12.5px] font-bold px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-none">
                          Applica penale
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#8a8a8a]">Nessun ritardo: imposta le date per calcolare l'eventuale penale.</p>
                  )}
                </div>
              );
            })()}

            <button onClick={() => { onDeleteRequest(active.id); setOpenId(null); }} className="text-[12px] font-bold text-red-600 hover:underline bg-transparent border-none cursor-pointer">
              Elimina richiesta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
