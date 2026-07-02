/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CommercialeView — Preventivi & Contratti unificati (Commerciale). Cataloga i preventivi della
 * società per stato (Elaborati · Accettati · Scaduti/Non accettati) e per Attivi/Archiviati.
 * Firma OTP del preventivo (vale come contratto). All'accettazione le righe diventano attività
 * assegnate al tecnico di riferimento (gestito in App).
 */
import React from 'react';
import {
  Target, Plus, FileText, ShieldCheck, Send, CheckCircle2, XCircle, Archive, ArchiveRestore, X, User,
} from 'lucide-react';
import type { Quote } from '../types';
import { eur } from '../utils';

interface Member { uid: string; name: string; }
interface Props {
  quotes: Quote[];
  soc: string;
  socLabel?: string;
  members?: Member[];
  color?: string;
  canEdit?: boolean;
  onSetStatus?: (id: string, status: Quote['status']) => void;
  onArchive?: (id: string, archived: boolean) => void;
  onSaveQuote?: (q: Quote) => void;
  onOpenEditor?: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const isScaduto = (q: Quote) => q.status === 'rifiutato' || (q.status !== 'accettato' && !!q.validUntil && q.validUntil < todayISO());
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const ST: Record<Quote['status'], { label: string; color: string }> = {
  elaborato: { label: 'Elaborato', color: '#6b7280' }, in_attesa: { label: 'In attesa', color: '#b45309' },
  accettato: { label: 'Accettato', color: '#059669' }, rifiutato: { label: 'Rifiutato', color: '#dc2626' },
};

export const CommercialeView: React.FC<Props> = ({ quotes, socLabel, members = [], canEdit = false, onSetStatus, onArchive, onSaveQuote, onOpenEditor }) => {
  const [tab, setTab] = React.useState<'tutti' | 'elaborati' | 'accettati' | 'scaduti'>('tutti');
  const [view, setView] = React.useState<'attivi' | 'archiviati'>('attivi');
  const [signing, setSigning] = React.useState<Quote | null>(null);

  const base = quotes.filter((q) => (view === 'archiviati' ? q.archived : !q.archived));
  const list = base.filter((q) => {
    if (tab === 'elaborati') return q.status === 'elaborato' || q.status === 'in_attesa';
    if (tab === 'accettati') return q.status === 'accettato';
    if (tab === 'scaduti') return isScaduto(q);
    return true;
  }).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  const count = (fn: (q: Quote) => boolean) => base.filter(fn).length;
  const KPI = [
    { l: 'Elaborati', v: count((q) => q.status === 'elaborato' || q.status === 'in_attesa') },
    { l: 'Accettati', v: count((q) => q.status === 'accettato') },
    { l: 'Scaduti / non accettati', v: count(isScaduto) },
    { l: 'Valore accettato', v: eur(base.filter((q) => q.status === 'accettato').reduce((s, q) => s + (q.total || 0), 0)) },
  ];

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Target className="w-5.5 h-5.5" /> Preventivi & Contratti {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Un'unica pagina: preventivo, firma OTP (vale come contratto), catalogazione e attività al tecnico.</p>
        </div>
        {canEdit && onOpenEditor && <button onClick={onOpenEditor} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuovo preventivo</button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI.map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[16px] p-3.5 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[18px] font-black text-[#161616] mt-1 leading-none">{typeof k.v === 'number' ? k.v : k.v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {([['tutti', 'Tutti'], ['elaborati', 'Elaborati'], ['accettati', 'Accettati'], ['scaduti', 'Scaduti']] as const).map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
          ))}
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {([['attivi', 'Attivi'], ['archiviati', 'Archiviati']] as const).map(([id, lbl]) => (
            <button key={id} onClick={() => setView(id)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${view === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun preventivo per il filtro attivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((q) => {
            const s = ST[q.status]; const scad = isScaduto(q); const signed = !!q.signedAt;
            return (
              <div key={q.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="text-[14px] text-[#161616]">{q.clientName || 'Cliente'}</b>
                    <p className="text-[11px] text-[#8a8a8a] font-mono mt-0.5">{q.number} · {q.docKind === 'parcella' ? 'Parcella' : 'Preventivo'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {signed && <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Firmato</span>}
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: scad && q.status !== 'accettato' ? '#dc2626' : s.color }}>{scad && q.status !== 'accettato' ? 'Scaduto' : s.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[16px] font-black text-[#161616]">{eur(q.total || 0)}</span>
                  <span className="text-[11px] text-[#9a9a9a]">Valido fino: {fmt(q.validUntil)}</span>
                </div>
                {/* Tecnico di riferimento */}
                {members.length > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#b0b0b0] shrink-0" />
                    <select disabled={!canEdit || q.status === 'accettato'} value={q.tecnicoUid || ''} onChange={(e) => onSaveQuote?.({ ...q, tecnicoUid: e.target.value || null, updatedAt: Date.now() })} className="flex-1 px-2 py-1.5 rounded-lg border border-[#e2e2e2] text-[12px] outline-none focus:border-[#161616] bg-white disabled:opacity-70">
                      <option value="">Tecnico di riferimento…</option>
                      {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                    </select>
                  </div>
                )}
                {/* Azioni */}
                {canEdit && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#f2f2f2]">
                    {q.status !== 'accettato' && <button onClick={() => setSigning(q)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[11.5px] font-bold cursor-pointer border-none"><ShieldCheck className="w-3.5 h-3.5" /> Firma OTP</button>}
                    {q.status !== 'accettato' && <button onClick={() => onSetStatus?.(q.id, 'accettato')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-emerald-400 text-emerald-700 text-[11.5px] font-bold cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /> Accetta</button>}
                    {q.status !== 'rifiutato' && q.status !== 'accettato' && <button onClick={() => onSetStatus?.(q.id, 'rifiutato')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-rose-400 text-rose-600 text-[11.5px] font-bold cursor-pointer"><XCircle className="w-3.5 h-3.5" /> Rifiuta</button>}
                    <button onClick={() => onArchive?.(q.id, !q.archived)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[11.5px] font-bold cursor-pointer ml-auto">{q.archived ? <><ArchiveRestore className="w-3.5 h-3.5" /> Ripristina</> : <><Archive className="w-3.5 h-3.5" /> Archivia</>}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {signing && <SignModal quote={signing} onClose={() => setSigning(null)} onSaveQuote={onSaveQuote} onAccept={(id) => { onSetStatus?.(id, 'accettato'); setSigning(null); }} />}
    </div>
  );
};

const SignModal: React.FC<{ quote: Quote; onClose: () => void; onSaveQuote?: (q: Quote) => void; onAccept: (id: string) => void }> = ({ quote, onClose, onSaveQuote, onAccept }) => {
  const [q, setQ] = React.useState<Quote>(quote);
  const [input, setInput] = React.useState('');
  const [err, setErr] = React.useState('');
  const gen = () => { const code = String(Math.floor(100000 + Math.random() * 900000)); const nq = { ...q, otp: code, otpAt: Date.now() }; setQ(nq); onSaveQuote?.(nq); setErr(''); setInput(''); };
  const verify = () => {
    if (!q.otp) { setErr('Genera prima il codice OTP.'); return; }
    if (input.trim() === q.otp) { onSaveQuote?.({ ...q, signedAt: Date.now(), signedByName: q.clientName || null, otp: null, status: 'accettato' }); onAccept(q.id); }
    else setErr('Codice OTP errato.');
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616] inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Firma preventivo {q.number}</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-[#8a8a8a]">La firma con OTP accetta il preventivo (vale come contratto) per <b className="text-[#161616]">{q.clientName}</b> · {eur(q.total || 0)}.</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={gen} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Send className="w-3.5 h-3.5" /> {q.otp ? 'Rigenera OTP' : 'Genera OTP'}</button>
            {q.otp && <span className="text-[15px] font-black tracking-[0.25em] text-[#161616] bg-gray-50 border border-[#e2e2e2] rounded-lg px-3 py-1.5">{q.otp}</span>}
          </div>
          {q.otp && <p className="text-[11px] text-[#9a9a9a]">Comunica il codice al cliente, poi inseriscilo qui sotto.</p>}
          {q.otp && (
            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={6} placeholder="OTP a 6 cifre" className="w-40 px-3 py-2 rounded-lg border border-[#e2e2e2] text-[14px] tracking-widest text-center outline-none focus:border-[#161616] bg-white" />
              <button onClick={verify} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold cursor-pointer border-none"><CheckCircle2 className="w-4 h-4" /> Firma e accetta</button>
            </div>
          )}
          {err && <p className="text-[12px] text-rose-600 font-semibold">{err}</p>}
          <p className="text-[10.5px] text-[#b8b8b8]">All'accettazione: le righe del preventivo diventano attività assegnate al tecnico di riferimento e (se serve) nasce la commessa.</p>
        </div>
      </div>
    </div>
  );
};

export default CommercialeView;
