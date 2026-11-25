/**
 * ProposteView — Commerciale → "Proposte" di ogni società (nota utente bb-1).
 * Una proposta dice cosa si potrebbe fare e come, senza prezzi. Va al portale del cliente;
 * se il cliente la accetta diventa una RICHIESTA DI PREVENTIVO della società, poi preventivo
 * (Centro Commerciale) e contratto.
 */
import React from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Plus, Send, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Modal } from './Modal';
import type { ClientRecord, Proposta, PropostaStatus } from '../types';

interface Props {
  soc: string;
  socLabel: string;
  items: Proposta[];
  rubrica: ClientRecord[];
  canEdit: boolean;
  onSave: (p: Proposta) => void;
  onSend: (p: Proposta) => void;
  onCreateQuote: (p: Proposta) => void;
  onDelete: (id: string) => void;
}

const TABS: { id: string; label: string; match: (s: PropostaStatus) => boolean }[] = [
  { id: 'preparare', label: 'Da preparare', match: (s) => s === 'da_preparare' || s === 'bozza' },
  { id: 'inviate', label: 'Inviate', match: (s) => s === 'inviata' },
  { id: 'richieste', label: 'Richieste di preventivo', match: (s) => s === 'accettata' },
  { id: 'chiuse', label: 'Chiuse', match: (s) => s === 'preventivo' || s === 'rifiutata' },
];
const STATO: Record<PropostaStatus, { label: string; cls: string }> = {
  da_preparare: { label: 'Da preparare', cls: 'bg-amber-50 text-amber-700' },
  bozza: { label: 'Bozza', cls: 'bg-[#f1f1f1] text-[#555]' },
  inviata: { label: 'Inviata al cliente', cls: 'bg-sky-50 text-sky-700' },
  accettata: { label: 'Accettata: fare preventivo', cls: 'bg-emerald-50 text-emerald-700' },
  rifiutata: { label: 'Non ora', cls: 'bg-rose-50 text-rose-600' },
  preventivo: { label: 'Preventivo creato', cls: 'bg-[#161616] text-white' },
};
const IN = 'w-full px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[13px] text-[#161616] outline-none focus:border-[#161616]';

export const ProposteView: React.FC<Props> = (p) => {
  const [tab, setTab] = React.useState('preparare');
  const [edit, setEdit] = React.useState<Proposta | null>(null);
  const list = p.items.filter((x) => TABS.find((t) => t.id === tab)!.match(x.status)).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  const blank = (): Proposta => ({ id: `prop-${Date.now().toString(36)}`, soc: p.soc, title: '', testo: '', punti: [], clientName: '', status: 'bozza', createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center text-[#161616]"><Lightbulb className="w-5 h-5" /></div>
          <div>
            <h2 className="text-[20px] font-black text-[#161616] leading-tight">Proposte {p.socLabel}</h2>
            <p className="text-[12.5px] text-[#6b6b6b] font-semibold">Cosa possiamo fare per il cliente e come, senza prezzi. Se la accetta dal portale diventa una richiesta di preventivo.</p>
          </div>
        </div>
        {p.canEdit && <button onClick={() => setEdit(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Plus className="w-4 h-4" /> Nuova proposta</button>}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => {
          const n = p.items.filter((x) => t.match(x.status)).length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-full text-[12.5px] font-bold border cursor-pointer ${tab === t.id ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#555] border-[#e2e2e2]'}`}>
              {t.label} <span className={tab === t.id ? 'text-white/70' : 'text-[#8f8f8f]'}>{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-10 text-center">
          <p className="text-[14px] font-bold text-[#161616]">Niente qui.</p>
          <p className="text-[12.5px] text-[#767676] mt-1">Le proposte nascono da sole quando una richiesta tocca anche {p.socLabel}, oppure con "Nuova proposta".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {list.map((x, i) => (
            <motion.button key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(0.2, i * 0.03) }}
              onClick={() => setEdit(x)} className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 cursor-pointer hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-[#161616] truncate">{x.title || 'Proposta senza titolo'}</p>
                  <p className="text-[12px] text-[#6b6b6b] font-semibold truncate">{x.clientName || 'Cliente da scegliere'}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${STATO[x.status].cls}`}>{STATO[x.status].label}</span>
              </div>
              {x.testo && <p className="text-[12.5px] text-[#555] mt-2 line-clamp-2">{x.testo}</p>}
              {x.risposta?.comment && <p className="text-[12px] text-[#161616] mt-2 font-semibold">Il cliente: "{x.risposta.comment}"</p>}
            </motion.button>
          ))}
        </div>
      )}

      {edit && (
        <Editor
          key={edit.id}
          initial={edit}
          isNew={!p.items.some((x) => x.id === edit.id)}
          {...p}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
};

const Editor: React.FC<Props & { initial: Proposta; isNew: boolean; onClose: () => void }> = (p) => {
  const [d, setD] = React.useState<Proposta>(p.initial);
  const set = (patch: Partial<Proposta>) => setD((x) => ({ ...x, ...patch }));
  const ro = !p.canEdit || d.status === 'preventivo';
  const clients = p.rubrica.slice().sort((a, b) => a.name.localeCompare(b.name));
  const pick = (id: string) => {
    const c = p.rubrica.find((r) => r.id === id);
    set({ clientRecordId: c?.id || null, clientName: c?.name || d.clientName, clientUid: c?.accountUid || d.clientUid || null });
  };
  const ok = d.title.trim() && d.clientName.trim();
  const save = (patch?: Partial<Proposta>) => { const next = { ...d, ...patch, title: d.title.trim(), updatedAt: Date.now() }; p.onSave(next); return next; };
  const BTN = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold cursor-pointer border-none';

  return (
    <Modal isOpen wide title={p.isNew ? 'Nuova proposta' : d.title || 'Proposta'} subtitle={STATO[d.status].label} onClose={p.onClose}
      footer={
        <div className="flex items-center justify-between gap-2 w-full flex-wrap">
          <div>{!p.isNew && p.canEdit && d.status !== 'preventivo' && <button onClick={() => { p.onDelete(d.id); p.onClose(); }} className={`${BTN} bg-transparent text-[#8a8a8a] hover:text-rose-600`}>Elimina</button>}</div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={p.onClose} className={`${BTN} bg-gray-100 text-[#161616]`}>Chiudi</button>
            {!ro && <button disabled={!ok} onClick={() => { save({ status: d.status === 'da_preparare' ? 'bozza' : d.status }); p.onClose(); }} className={`${BTN} bg-white border! border-[#e2e2e2]! text-[#161616] disabled:opacity-40`}>Salva</button>}
            {!ro && (d.status === 'bozza' || d.status === 'da_preparare') && (
              <button disabled={!ok || !d.clientUid} title={d.clientUid ? '' : 'Il cliente non ha un account nel portale: collegalo in rubrica'} onClick={() => { p.onSend(save()); p.onClose(); }} className={`${BTN} bg-[#161616] text-white disabled:opacity-40`}><Send className="w-4 h-4" /> Invia al portale</button>
            )}
            {p.canEdit && d.status === 'accettata' && (
              <button onClick={() => { p.onCreateQuote(save()); p.onClose(); }} className={`${BTN} bg-[#161616] text-white`}><FileText className="w-4 h-4" /> Crea il preventivo</button>
            )}
          </div>
        </div>
      }>
      <fieldset disabled={ro} className="flex flex-col gap-4 border-none p-0 m-0 min-w-0">
        {d.risposta && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl ${d.risposta.accepted ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
            {d.risposta.accepted ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
            <p className="text-[13px] font-semibold">{d.risposta.accepted ? 'Il cliente vuole un preventivo.' : 'Il cliente ha risposto "non ora".'}{d.risposta.comment ? ` "${d.risposta.comment}"` : ''}</p>
          </div>
        )}
        {d.status === 'inviata' && !d.risposta && <p className="text-[12.5px] text-sky-700 font-semibold inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> In attesa della risposta del cliente.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className="text-[12px] font-bold text-[#6b6b6b]">Cliente dalla rubrica</span>
            <select className={IN} value={d.clientRecordId || ''} onChange={(e) => pick(e.target.value)}>
              <option value="">— scegli —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className="text-[12px] font-bold text-[#6b6b6b]">Nome cliente *</span><input className={IN} value={d.clientName} onChange={(e) => set({ clientName: e.target.value })} /></label>
        </div>
        <label className="flex flex-col gap-1"><span className="text-[12px] font-bold text-[#6b6b6b]">Titolo *</span><input className={IN} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Sito e lancio del vostro B&B" /></label>
        <label className="flex flex-col gap-1"><span className="text-[12px] font-bold text-[#6b6b6b]">Cosa possiamo fare e come</span><textarea className={IN} rows={4} value={d.testo || ''} onChange={(e) => set({ testo: e.target.value })} placeholder="Racconta l'idea in parole semplici: obiettivo, come lavoriamo, tempi indicativi. Niente prezzi." /></label>
        <label className="flex flex-col gap-1"><span className="text-[12px] font-bold text-[#6b6b6b]">Servizi proposti (uno per riga)</span>
          <textarea className={IN} rows={4} value={(d.punti || []).join('\n')} onChange={(e) => set({ punti: e.target.value.split('\n') })} placeholder={'Nome e logo\nSito con prenotazioni\nProfili social e calendario dei contenuti'} />
        </label>
        {!d.clientUid && <p className="text-[12px] text-amber-700 font-semibold">Per inviarla al portale il cliente deve avere un account collegato in rubrica.</p>}
      </fieldset>
    </Modal>
  );
};
