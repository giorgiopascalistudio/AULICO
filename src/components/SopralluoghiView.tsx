/**
 * SopralluoghiView — Commerciale → "Sopralluoghi & Rilievi".
 * Strumento per chi va dal cliente (anche col tablet): anagrafica, sopralluogo in agenda,
 * parametri del rilievo con stima live, preventivo con un tasto. Il preventivo vive nel
 * nodo `quotes` (firma OTP, Centro Commerciale); accettato → commessa con le attività.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPinned, Plus, Calendar, User, Ruler, FileText, Check, Settings2, Trash2, ExternalLink, Phone } from 'lucide-react';
import { Modal } from './Modal';
import type { ClientRecord, Quote, Task } from '../types';
import {
  type Sopralluogo, type RilievoTariffe, type Dettaglio, type SopralluogoStato,
  PACCHETTI, TIPOLOGIE, STATI_SOPR, stimaRighe, stimaTotale, statoEffettivo,
} from '../sopralluogo';
import { eur, safeUrl } from '../utils';

interface Props {
  soc: string;
  items: Sopralluogo[];
  quotes: Record<string, Quote>;
  tasks: Record<string, Task>;
  rubrica: ClientRecord[];
  team: { uid: string; name: string }[];
  tariffe: RilievoTariffe;
  myUid: string;
  canEdit: boolean;
  canQuote: boolean;
  canTariffe: boolean;
  onSave: (s: Sopralluogo) => void;
  onDelete: (id: string) => void;
  onCreateQuote: (s: Sopralluogo) => void;
  onSaveTariffe: (t: RilievoTariffe) => void;
}

const IN = 'w-full px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[13px] text-[#161616] outline-none focus:border-[#161616]';
const BTN = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold cursor-pointer border-none';
const STATO_TONE: Record<SopralluogoStato, string> = {
  programmato: 'bg-[#f1f1f1] text-[#555]',
  svolto: 'bg-sky-50 text-sky-700',
  preventivo: 'bg-amber-50 text-amber-700',
  firmato: 'bg-emerald-50 text-emerald-700',
  commessa: 'bg-[#161616] text-white',
  perso: 'bg-rose-50 text-rose-600',
};
const today = () => new Date().toISOString().slice(0, 10);

export const SopralluoghiView: React.FC<Props> = (p) => {
  const [filter, setFilter] = React.useState<'tutti' | SopralluogoStato>('tutti');
  const [editing, setEditing] = React.useState<Sopralluogo | null>(null);
  const [tariffeOpen, setTariffeOpen] = React.useState(false);
  const nameOf = (uid?: string | null) => p.team.find((t) => t.uid === uid)?.name || null;

  const rows = p.items.map((s) => {
    const q = s.quoteId ? p.quotes[s.quoteId] : null;
    const st = statoEffettivo(s, q, s.taskId ? !!p.tasks[s.taskId]?.done : false);
    return { s, q, st, tot: stimaTotale(stimaRighe(s, p.tariffe)) };
  }).sort((a, b) => (b.s.date || '').localeCompare(a.s.date || '') || b.s.createdAt - a.s.createdAt);
  const shown = rows.filter((r) => filter === 'tutti' || r.st === filter);

  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const kpis = [
    { label: 'Prossimi 7 giorni', value: rows.filter((r) => r.st === 'programmato' && (r.s.date || '') >= today() && (r.s.date || '') <= in7).length },
    { label: 'Preventivi in attesa', value: rows.filter((r) => r.st === 'preventivo').length },
    { label: 'Firmati / commesse', value: rows.filter((r) => r.st === 'firmato' || r.st === 'commessa').length },
    { label: 'Valore in trattativa', value: eur(rows.filter((r) => r.st === 'preventivo').reduce((a, r) => a + (r.q?.total || r.tot), 0)) },
  ];

  const blank = (): Sopralluogo => ({
    id: `sop-${Date.now().toString(36)}`, soc: p.soc, stato: 'programmato', clientName: '', date: today(), time: '09:00',
    tecnicoUid: p.myUid, dettaglio: 'base', servizi: {}, extra: [], createdAt: Date.now(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center text-[#161616]"><MapPinned className="w-5 h-5" /></div>
          <div>
            <h2 className="text-[20px] font-black text-[#161616] leading-tight">Sopralluoghi & Rilievi</h2>
            <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Dal cliente al preventivo: sopralluogo in agenda, stima del rilievo, preventivo da firmare. Firmato = commessa con le attività.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {p.canTariffe && <button onClick={() => setTariffeOpen(true)} className={`${BTN} bg-white border! border-[#e2e2e2]! text-[#161616] hover:bg-[#f5f5f3]`}><Settings2 className="w-4 h-4" /> Tariffe</button>}
          {p.canEdit && <motion.button whileTap={{ scale: 0.96 }} onClick={() => setEditing(blank())} className={`${BTN} bg-[#161616] hover:bg-black text-white`}><Plus className="w-4 h-4" /> Nuovo sopralluogo</motion.button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white border border-[#e2e2e2] rounded-[22px] px-4 py-3">
            <div className="text-[20px] font-black text-[#161616]">{k.value}</div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['tutti', ...STATI_SOPR.map((x) => x.id), 'perso'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 rounded-full text-[12px] font-bold border cursor-pointer ${filter === f ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#555] border-[#e2e2e2]'}`}>
            {f === 'tutti' ? 'Tutti' : f === 'perso' ? 'Persi' : STATI_SOPR.find((x) => x.id === f)?.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-10 text-center">
          <p className="text-[14px] font-bold text-[#161616]">Nessun sopralluogo{filter !== 'tutti' ? ' in questo stato' : ''}.</p>
          <p className="text-[12.5px] text-[#9a9a9a] mt-1">Creane uno quando fissi un appuntamento con un cliente: finirà anche nell'agenda del tecnico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AnimatePresence initial={false}>
            {shown.map(({ s, q, st, tot }, i) => (
              <motion.button key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(0.25, i * 0.03) }}
                whileHover={{ y: -2 }} onClick={() => setEditing(s)}
                className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 cursor-pointer hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-black text-[#161616] truncate">{s.clientName || 'Cliente da definire'}</p>
                    <p className="text-[12px] text-[#8a8a8a] font-semibold truncate">{s.address || 'Indirizzo da definire'}{s.tipologia ? ` · ${s.tipologia}` : ''}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${STATO_TONE[st]}`}>{st === 'perso' ? 'Perso' : STATI_SOPR.find((x) => x.id === st)?.label}</span>
                </div>
                <Stepper st={st} />
                <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#555] font-semibold mt-2">
                  {s.date && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(s.date + 'T00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}{s.time ? ` · ${s.time}` : ''}</span>}
                  {nameOf(s.tecnicoUid) && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{nameOf(s.tecnicoUid)}</span>}
                  {s.mq ? <span className="inline-flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{s.mq} mq</span> : null}
                  <span className="ml-auto font-black text-[#161616]">{q ? `${q.number} · ${eur(q.total)}` : tot ? `stima ${eur(tot)}` : ''}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {editing && (
        <Editor
          key={editing.id}
          initial={editing}
          isNew={!p.items.some((x) => x.id === editing.id)}
          {...p}
          onClose={() => setEditing(null)}
        />
      )}
      {tariffeOpen && <TariffeEditor tariffe={p.tariffe} onClose={() => setTariffeOpen(false)} onSave={(t) => { p.onSaveTariffe(t); setTariffeOpen(false); }} />}
    </div>
  );
};

const Stepper: React.FC<{ st: SopralluogoStato }> = ({ st }) => {
  const idx = STATI_SOPR.findIndex((x) => x.id === st);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATI_SOPR.map((x, i) => (
        <div key={x.id} className="flex-1 h-1.5 rounded-full bg-[#f0f0ee] overflow-hidden">
          <motion.div className={`h-full ${st === 'perso' ? 'bg-rose-300' : 'bg-[#161616]'}`} initial={{ width: 0 }} animate={{ width: i <= idx ? '100%' : '0%' }} transition={{ duration: 0.4, delay: i * 0.06 }} />
        </div>
      ))}
    </div>
  );
};

const Sec: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex flex-col gap-2.5">
    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]"><span className="text-[#161616]">{n}</span> · {title}</p>
    {children}
  </div>
);
const F: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <label className={`flex flex-col gap-1 ${className || ''}`}><span className="text-[11px] font-bold text-[#8a8a8a]">{label}</span>{children}</label>
);

const Editor: React.FC<Props & { initial: Sopralluogo; isNew: boolean; onClose: () => void }> = (p) => {
  const [d, setD] = React.useState<Sopralluogo>(p.initial);
  const set = (patch: Partial<Sopralluogo>) => setD((x) => ({ ...x, ...patch }));
  const righe = stimaRighe(d, p.tariffe);
  const tot = stimaTotale(righe);
  const q = d.quoteId ? p.quotes[d.quoteId] : null;
  const st = statoEffettivo(d, q, d.taskId ? !!p.tasks[d.taskId]?.done : false);
  const ro = !p.canEdit;

  const pickClient = (id: string) => {
    const c = p.rubrica.find((r) => r.id === id);
    if (!c) { set({ clientRecordId: null }); return; }
    set({ clientRecordId: c.id, clientName: c.name, phone: c.phone || d.phone || null, email: c.email || d.email || null, address: d.address || c.address || null });
  };
  const save = (extra?: Partial<Sopralluogo>) => {
    if (!d.clientName.trim()) return false;
    p.onSave({ ...d, ...extra, clientName: d.clientName.trim(), updatedAt: Date.now() });
    return true;
  };
  const clients = p.rubrica.filter((r) => (r.category || 'cliente') === 'cliente').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal isOpen wide title={p.isNew ? 'Nuovo sopralluogo' : d.clientName || 'Sopralluogo'} subtitle={STATI_SOPR.find((x) => x.id === st)?.label || (st === 'perso' ? 'Perso' : '')} onClose={p.onClose}
      footer={
        <div className="flex items-center justify-between gap-2 w-full flex-wrap">
          <div className="flex gap-2">
            {!p.isNew && p.canEdit && <button onClick={() => { p.onDelete(d.id); p.onClose(); }} className={`${BTN} bg-transparent text-[#9a9a9a] hover:text-rose-600`}><Trash2 className="w-4 h-4" /> Elimina</button>}
            {!p.isNew && p.canEdit && !d.projectId && (
              <button onClick={() => { save({ stato: d.stato === 'perso' ? 'programmato' : 'perso' }); p.onClose(); }} className={`${BTN} bg-transparent text-[#9a9a9a] hover:text-[#161616]`}>{d.stato === 'perso' ? 'Riapri' : 'Segna come perso'}</button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={p.onClose} className={`${BTN} bg-gray-100 hover:bg-gray-200 text-[#161616]`}>Chiudi</button>
            {p.canEdit && <button disabled={!d.clientName.trim()} onClick={() => { if (save()) p.onClose(); }} className={`${BTN} bg-[#161616] hover:bg-black text-white disabled:opacity-40`}>Salva</button>}
          </div>
        </div>
      }>
      <fieldset disabled={ro} className="flex flex-col gap-6 border-none p-0 m-0 min-w-0">
        <Sec n={1} title="Cliente">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Dalla rubrica">
              <select className={IN} value={d.clientRecordId || ''} onChange={(e) => pickClient(e.target.value)}>
                <option value="">— nuovo cliente —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </F>
            <F label="Nome e cognome / ragione sociale *"><input className={IN} value={d.clientName} onChange={(e) => set({ clientName: e.target.value })} placeholder="Mario Rossi" /></F>
            <F label="Telefono"><input className={IN} value={d.phone || ''} onChange={(e) => set({ phone: e.target.value || null })} inputMode="tel" /></F>
            <F label="Email"><input className={IN} value={d.email || ''} onChange={(e) => set({ email: e.target.value || null })} inputMode="email" /></F>
          </div>
          {!d.clientRecordId && d.clientName.trim() && <p className="text-[11.5px] text-[#9a9a9a] font-semibold">Al salvataggio il cliente viene aggiunto alla rubrica (se hai il permesso sul Commerciale).</p>}
          {d.phone && <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#161616] w-fit"><Phone className="w-3.5 h-3.5" /> Chiama</a>}
        </Sec>

        <Sec n={2} title="Sopralluogo">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <F label="Indirizzo immobile" className="sm:col-span-2"><input className={IN} value={d.address || ''} onChange={(e) => set({ address: e.target.value || null })} placeholder="Via, civico, comune" /></F>
            <F label="Data"><input type="date" className={IN} value={d.date || ''} onChange={(e) => set({ date: e.target.value || null })} /></F>
            <F label="Ora"><input type="time" className={IN} value={d.time || ''} onChange={(e) => set({ time: e.target.value || null })} /></F>
            <F label="Chi va dal cliente" className="sm:col-span-2">
              <select className={IN} value={d.tecnicoUid || ''} onChange={(e) => set({ tecnicoUid: e.target.value || null })}>
                <option value="">— da assegnare —</option>
                {p.team.map((t) => <option key={t.uid} value={t.uid}>{t.name}</option>)}
              </select>
            </F>
            <F label="Foto / cartella (link)" className="sm:col-span-2"><input className={IN} value={d.link || ''} onChange={(e) => set({ link: e.target.value || null })} placeholder="https://drive…" /></F>
          </div>
          <F label="Cosa chiede il cliente"><textarea className={IN} rows={2} value={d.esigenze || ''} onChange={(e) => set({ esigenze: e.target.value || null })} placeholder="Es. rilievo per pratica di ristrutturazione, vuole anche il 3D per vendere…" /></F>
          <div className="flex items-center gap-3 flex-wrap">
            {d.tecnicoUid && d.date && <p className="text-[11.5px] text-[#9a9a9a] font-semibold">Finisce nell'agenda di {p.team.find((t) => t.uid === d.tecnicoUid)?.name || 'tecnico'}.</p>}
            {d.link && safeUrl(d.link) && <a href={safeUrl(d.link) || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#161616]"><ExternalLink className="w-3.5 h-3.5" /> Apri foto</a>}
            {p.canEdit && st === 'programmato' && !p.isNew && (
              <button type="button" onClick={() => set({ stato: 'svolto' })} className={`${BTN} bg-sky-50 text-sky-700 hover:bg-sky-100`}><Check className="w-4 h-4" /> Segna come svolto</button>
            )}
          </div>
        </Sec>

        <Sec n={3} title="Rilievo">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <F label="Tipologia">
              <select className={IN} value={d.tipologia || ''} onChange={(e) => set({ tipologia: e.target.value || null })}>
                <option value="">—</option>{TIPOLOGIE.map((t) => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Superficie (mq)"><input type="number" min={0} className={IN} value={d.mq ?? ''} onChange={(e) => set({ mq: e.target.value === '' ? null : Number(e.target.value) })} /></F>
            <F label="Livello di dettaglio">
              <div className="grid grid-cols-3 gap-1">
                {(['base', 'medio', 'alto'] as Dettaglio[]).map((k) => (
                  <button type="button" key={k} onClick={() => set({ dettaglio: k })} className={`py-2 rounded-xl text-[12px] font-bold border cursor-pointer capitalize ${(d.dettaglio || 'base') === k ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#555] border-[#e2e2e2]'}`}>{k}</button>
                ))}
              </div>
            </F>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PACCHETTI.map((pk) => (
              <button type="button" key={pk.id} onClick={() => set({ servizi: Object.fromEntries(pk.servizi.map((id) => [id, true])) })}
                className="px-3 py-1.5 rounded-full text-[12px] font-bold border border-[#e2e2e2] bg-[#f5f5f3] hover:bg-white cursor-pointer">{pk.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {p.tariffe.servizi.map((sv) => {
              const on = !!d.servizi?.[sv.id];
              return (
                <motion.button type="button" key={sv.id} whileTap={{ scale: 0.98 }} onClick={() => set({ servizi: { ...(d.servizi || {}), [sv.id]: !on } })}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left cursor-pointer ${on ? 'border-[#161616] bg-[#fafaf9]' : 'border-[#e2e2e2] bg-white'}`}>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-[#161616] border-[#161616] text-white' : 'border-[#d0d0d0]'}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                  <span className="text-[12.5px] font-bold text-[#161616] flex-1">{sv.label}</span>
                  <span className="text-[11px] font-semibold text-[#9a9a9a]">{sv.unit === 'mq' ? `${sv.price} €/mq` : eur(sv.price)}</span>
                </motion.button>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            {(d.extra || []).map((e, i) => (
              <div key={e.id} className="flex gap-2">
                <input className={IN} value={e.desc} placeholder="Altra voce (es. sopralluogo aggiuntivo)" onChange={(ev) => set({ extra: (d.extra || []).map((x, j) => j === i ? { ...x, desc: ev.target.value } : x) })} />
                <input type="number" className={`${IN} w-32!`} value={e.amount || ''} placeholder="€" onChange={(ev) => set({ extra: (d.extra || []).map((x, j) => j === i ? { ...x, amount: Number(ev.target.value) } : x) })} />
                <button type="button" onClick={() => set({ extra: (d.extra || []).filter((_, j) => j !== i) })} className="px-2 text-[#9a9a9a] hover:text-rose-600 bg-transparent border-none cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set({ extra: [...(d.extra || []), { id: `x-${Date.now().toString(36)}`, desc: '', amount: 0 }] })} className="text-[12px] font-bold text-[#161616] bg-transparent border-none cursor-pointer w-fit inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Altra voce a corpo</button>
          </div>
        </Sec>

        <Sec n={4} title="Stima e preventivo">
          <div className="bg-[#fafaf9] border border-[#efefef] rounded-[18px] p-4 flex flex-col gap-1.5">
            {righe.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Scegli un pacchetto o spunta i servizi: la stima si calcola da sola.</p> : (
              <AnimatePresence initial={false}>
                {righe.map((r) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-baseline gap-2 text-[12.5px]">
                    <span className="font-bold text-[#161616]">{r.label}</span>
                    <span className="text-[#9a9a9a] text-[11px]">{r.detail}</span>
                    <span className="ml-auto font-bold text-[#161616]">{eur(r.amount)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div className="flex items-baseline justify-between border-t border-[#e9e9e7] pt-2 mt-1">
              <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Totale (IVA e cassa escluse)</span>
              <motion.span key={tot} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="text-[20px] font-black text-[#161616]">{eur(tot)}</motion.span>
            </div>
          </div>
          {q ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#161616]"><FileText className="w-4 h-4" /> {q.number} · {eur(q.total)} · {q.signedAt ? 'firmato' : q.status}</span>
              {d.projectId && <a href={`#progetto/${d.projectId}`} className="text-[12.5px] font-bold text-[#161616] underline">Apri la commessa</a>}
              <p className="text-[11.5px] text-[#9a9a9a] font-semibold w-full">Il preventivo si gestisce (documento, firma OTP, invio al portale) in Strategico → Commerciale → Centro Commerciale. Quando viene accettato nasce la commessa con le attività del rilievo.</p>
            </div>
          ) : p.canEdit && (
            p.canQuote ? (
              <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={!righe.length || !d.clientName.trim()}
                onClick={() => { const nd = { ...d, clientName: d.clientName.trim(), updatedAt: Date.now() }; p.onCreateQuote(nd); p.onClose(); }}
                className={`${BTN} bg-[#161616] hover:bg-black text-white disabled:opacity-40 w-fit`}>
                <FileText className="w-4 h-4" /> Crea il preventivo
              </motion.button>
            ) : <p className="text-[12px] text-amber-700 font-semibold">Per creare il preventivo serve il permesso "Opera" sul Commerciale: chiedilo a un amministratore (Team → permessi).</p>
          )}
        </Sec>

        <F label="Note interne"><textarea className={IN} rows={2} value={d.note || ''} onChange={(e) => set({ note: e.target.value || null })} /></F>
      </fieldset>
    </Modal>
  );
};

const TariffeEditor: React.FC<{ tariffe: RilievoTariffe; onClose: () => void; onSave: (t: RilievoTariffe) => void }> = ({ tariffe, onClose, onSave }) => {
  const [t, setT] = React.useState<RilievoTariffe>(JSON.parse(JSON.stringify(tariffe)));
  const upd = (i: number, patch: any) => setT((x) => ({ ...x, servizi: x.servizi.map((s, j) => j === i ? { ...s, ...patch } : s) }));
  return (
    <Modal isOpen wide title="Tariffe rilievi" subtitle="I criteri di Onirico: prezzi, minimi e attività generate nella commessa" onClose={onClose}
      footer={<div className="flex justify-end gap-2 w-full"><button onClick={onClose} className={`${BTN} bg-gray-100 text-[#161616]`}>Annulla</button><button onClick={() => onSave(t)} className={`${BTN} bg-[#161616] text-white`}>Salva tariffe</button></div>}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 flex-wrap items-end">
          {(['base', 'medio', 'alto'] as Dettaglio[]).map((k) => (
            <F key={k} label={`Dettaglio ${k} (×)`}><input type="number" step="0.05" className={`${IN} w-28!`} value={t.dettaglio[k]} onChange={(e) => setT((x) => ({ ...x, dettaglio: { ...x.dettaglio, [k]: Number(e.target.value) || 1 } }))} /></F>
          ))}
          <p className="text-[11.5px] text-[#9a9a9a] font-semibold">Il moltiplicatore vale per le voci a mq.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] min-w-[720px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-[#9a9a9a]"><th className="py-1">Servizio</th><th>Unità</th><th>Prezzo €</th><th>Minimo €</th><th>Attività generate (separate da ;)</th><th /></tr></thead>
            <tbody>
              {t.servizi.map((s, i) => (
                <tr key={s.id}>
                  <td className="py-1 pr-2"><input className={IN} value={s.label} onChange={(e) => upd(i, { label: e.target.value })} /></td>
                  <td className="pr-2"><select className={IN} value={s.unit} onChange={(e) => upd(i, { unit: e.target.value })}><option value="mq">€/mq</option><option value="corpo">a corpo</option></select></td>
                  <td className="pr-2"><input type="number" className={`${IN} w-24!`} value={s.price} onChange={(e) => upd(i, { price: Number(e.target.value) })} /></td>
                  <td className="pr-2"><input type="number" className={`${IN} w-24!`} value={s.min ?? ''} disabled={s.unit !== 'mq'} onChange={(e) => upd(i, { min: Number(e.target.value) || 0 })} /></td>
                  <td className="pr-2"><input className={IN} value={s.tasks.join('; ')} onChange={(e) => upd(i, { tasks: e.target.value.split(';').map((x) => x.trim()).filter(Boolean) })} /></td>
                  <td><button onClick={() => setT((x) => ({ ...x, servizi: x.servizi.filter((_, j) => j !== i) }))} className="p-1 text-[#9a9a9a] hover:text-rose-600 bg-transparent border-none cursor-pointer"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setT((x) => ({ ...x, servizi: [...x.servizi, { id: `sv-${Date.now().toString(36)}`, label: 'Nuovo servizio', unit: 'corpo', price: 0, tasks: [] }] }))} className="text-[12px] font-bold text-[#161616] bg-transparent border-none cursor-pointer w-fit inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Aggiungi servizio</button>
      </div>
    </Modal>
  );
};
