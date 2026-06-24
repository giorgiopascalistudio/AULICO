/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MATERICO — pannello portale (cliente e partner).
 * Cliente: crea richieste di preventivo (quantità, link, note), riceve l'offerta
 *          migliore e la accetta. Due sezioni: Richieste/Preventivi · Lavori in corso.
 * Partner: vede le richieste inoltrate e invia la propria offerta.
 */

import React, { useState } from 'react';
import { Plus, X, Send, Check, Layers, Link as LinkIcon, FileText, Hammer, ClipboardList } from 'lucide-react';
import type { MatericoRequest, MatericoItem } from '../types';
import { eur } from '../utils';
import { useLang } from '../i18n';

interface MatericoPortalProps {
  role: 'cliente' | 'partner';
  uid: string;
  name: string;
  requests: MatericoRequest[];
  onCreateRequest?: (req: MatericoRequest) => void;
  onAcceptOffer?: (reqId: string, accept: boolean) => void;
  onSubmitOffer?: (reqId: string, amount: number, note: string) => void;
}

export const MatericoPortal: React.FC<MatericoPortalProps> = ({
  role,
  uid,
  name,
  requests,
  onCreateRequest,
  onAcceptOffer,
  onSubmitOffer
}) => {
  const { t } = useLang();
  const [tab, setTab] = useState<'richieste' | 'lavori'>('richieste');
  const [newOpen, setNewOpen] = useState(false);
  const [offerFor, setOfferFor] = useState<string | null>(null);

  // form richiesta (cliente)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [items, setItems] = useState<MatericoItem[]>([]);
  const [links, setLinks] = useState('');
  const [note, setNote] = useState('');
  // form offerta (partner)
  const [amount, setAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');

  const inCorso = requests.filter((r) => r.status === 'accettata');
  const inRichiesta = requests.filter((r) => r.status !== 'accettata' && r.status !== 'rifiutata');

  const addItem = () => setItems((p) => [...p, { id: `it-${Date.now()}`, desc: '', qty: 1, unit: 'mq' }]);
  const setItem = (id: string, patch: Partial<MatericoItem>) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const delItem = (id: string) => setItems((p) => p.filter((it) => it.id !== id));

  const submitRequest = () => {
    if (!title.trim() || !onCreateRequest) return;
    const req: MatericoRequest = {
      id: `mreq-${Date.now()}`,
      clientUid: uid,
      clientName: name,
      title: title.trim(),
      category: category.trim() || undefined,
      description: desc.trim() || undefined,
      items: items.filter((i) => i.desc.trim()),
      links: links.split(/\n|,/).map((l) => l.trim()).filter(Boolean),
      note: note.trim() || undefined,
      status: 'nuova',
      createdAt: Date.now()
    };
    onCreateRequest(req);
    setTitle(''); setCategory(''); setDesc(''); setItems([]); setLinks(''); setNote('');
    setNewOpen(false);
  };

  const submitOffer = (reqId: string) => {
    if (!amount || !onSubmitOffer) return;
    onSubmitOffer(reqId, Number(amount.replace(/,/g, '.')), offerNote.trim());
    setAmount(''); setOfferNote(''); setOfferFor(null);
  };

  // ---------- PARTNER ----------
  if (role === 'partner') {
    return (
      <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm mb-6">
        <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2 mb-1"><ClipboardList className="w-4 h-4" /> {t('mat.partner.title')}</h3>
        <p className="text-[12px] text-[#8a8a8a] mb-4">{t('mat.partner.sub')}</p>
        {requests.length === 0 ? (
          <p className="text-[12.5px] italic text-[#8a8a8a]">{t('mat.partner.empty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => {
              const myOffer = (r.offers || {})[uid];
              return (
                <div key={r.id} className="border border-[#ececec] rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[14px] text-[#161616]">{r.title}</b>
                    {r.category && <span className="text-[11px] text-[#8a8a8a]">{r.category}</span>}
                  </div>
                  {r.description && <p className="text-[12.5px] text-[#555] mt-1">{r.description}</p>}
                  {(r.items || []).length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {r.items!.map((it) => (
                        <div key={it.id} className="flex justify-between text-[12.5px] bg-gray-50 rounded px-2 py-1">
                          <span>{it.desc}</span><b>{it.qty} {it.unit}</b>
                        </div>
                      ))}
                    </div>
                  )}
                  {myOffer ? (
                    <div className="mt-3 text-[12.5px] font-bold text-emerald-700 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('mat.partner.offerSent', { amount: eur(myOffer.amount) })}</div>
                  ) : offerFor === r.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={t('mat.partner.amountPlaceholder')} className="flex-1 h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
                        <button onClick={() => submitOffer(r.id)} className="px-4 h-10 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none flex items-center gap-1.5"><Send className="w-4 h-4" /> {t('common.send')}</button>
                      </div>
                      <input value={offerNote} onChange={(e) => setOfferNote(e.target.value)} placeholder={t('mat.partner.notePlaceholder')} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[13px]" />
                    </div>
                  ) : (
                    <button onClick={() => { setOfferFor(r.id); setAmount(''); setOfferNote(''); }} className="mt-3 px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">{t('mat.partner.sendOffer')}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------- CLIENTE ----------
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2"><Hammer className="w-4 h-4" /> {t('mat.client.title')}</h3>
        <button onClick={() => setNewOpen(true)} className="bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer border-none"><Plus className="w-4 h-4" /> {t('req.new')}</button>
      </div>

      <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] w-fit mb-4">
        {([{ id: 'richieste', label: t('mat.tab.requests') }, { id: 'lavori', label: t('mat.tab.works') }] as const).map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${tab === tb.id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>{tb.label}</button>
        ))}
      </div>

      {(tab === 'richieste' ? inRichiesta : inCorso).length === 0 ? (
        <p className="text-[12.5px] italic text-[#8a8a8a]">{tab === 'richieste' ? t('mat.client.emptyRequests') : t('mat.client.emptyWorks')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(tab === 'richieste' ? inRichiesta : inCorso).map((r) => (
            <div key={r.id} className="border border-[#ececec] rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <b className="text-[14px] text-[#161616]">{r.title}</b>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a8a] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">{t('mat.status.' + r.status)}</span>
              </div>
              {r.category && <span className="text-[11.5px] text-[#8a8a8a]">{r.category}</span>}

              {r.status === 'inviata_cliente' && r.clientPrice != null && (
                <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-sky-900">{t('mat.client.offerProposed')}</span>
                    <b className="text-[18px] text-[#161616]">{eur(r.clientPrice)}</b>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => onAcceptOffer?.(r.id, true)} className="flex-1 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> {t('prev.accept')}</button>
                    <button onClick={() => onAcceptOffer?.(r.id, false)} className="py-2 px-3 rounded-xl bg-white border border-[#e2e2e2] hover:bg-gray-50 text-gray-600 text-[12.5px] font-bold cursor-pointer">{t('prev.reject')}</button>
                  </div>
                  {r.contractText && (
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(r.contractText)}`}
                      download={`contratto-${r.id}.txt`}
                      className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-sky-700 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" /> {t('mat.client.downloadContract')}
                    </a>
                  )}
                </div>
              )}

              {r.status === 'accettata' && (
                <div className="mt-2 text-[12.5px] font-bold text-emerald-700 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('mat.client.workConfirmed')} {r.clientPrice != null ? `· ${eur(r.clientPrice)}` : ''}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FORM NUOVA RICHIESTA */}
      {newOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setNewOpen(false)}>
          <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-[520px] max-h-[92vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-black text-[#161616]">{t('mat.form.title')}</h3>
              <button onClick={() => setNewOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('mat.form.titlePlaceholder')} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('mat.form.categoryPlaceholder')} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder={t('mat.form.descPlaceholder')} className="border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {t('mat.form.quantity')}</span>
                  <button onClick={addItem} className="text-[12px] font-bold text-[#161616] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('mat.form.addItem')}</button>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-2">
                      <input value={it.desc} onChange={(e) => setItem(it.id, { desc: e.target.value })} placeholder={t('mat.form.itemDescPlaceholder')} className="flex-1 h-9 border border-[#e2e2e2] rounded-lg px-2 text-[13px]" />
                      <input value={it.qty} onChange={(e) => setItem(it.id, { qty: Number(e.target.value) || 0 })} type="number" className="w-16 h-9 border border-[#e2e2e2] rounded-lg px-2 text-[13px]" />
                      <input value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })} className="w-16 h-9 border border-[#e2e2e2] rounded-lg px-2 text-[13px]" />
                      <button onClick={() => delItem(it.id)} className="w-8 h-9 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder={t('mat.form.linksPlaceholder')} className="border border-[#e2e2e2] rounded-xl p-3 text-[13px] resize-none" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('mat.form.notePlaceholder')} className="border border-[#e2e2e2] rounded-xl p-3 text-[13px] resize-none" />

              <button onClick={submitRequest} className="py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none flex items-center justify-center gap-2"><Send className="w-4 h-4" /> {t('mat.form.send')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
