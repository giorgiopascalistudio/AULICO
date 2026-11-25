/**
 * PianoCantiere — Area Tecnici → "Piano di cantiere" (libreria in src/pianoCantiere.ts).
 * Genera dal tipo di intervento: punti di fermo "prima di entrare", visite della DL, riunione
 * di avvio, ordini anticipati, attese tecniche, scadenze; ogni voce datata va in agenda.
 * Sotto-scheda "Registro getti": prelievi minimi NTC e conti alla rovescia di legge
 * (cubetti al laboratorio entro 45 gg, relazione a strutture ultimate entro 65, collaudo entro 60).
 */
import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Check, CalendarClock, RefreshCw, FlaskConical, Plus, Lock } from 'lucide-react';
import type { Cantiere, CantiereRecord } from '../../types';
import { FASE_LABEL, KIND_LABEL, generaPiano, optsDaPratica, prelieviMinimi, type PianoFase, type PianoOpts } from '../../pianoCantiere';

export interface PlanTask { id: string; title: string; date: string; notes?: string | null; done?: boolean; weekly?: boolean }

interface Props {
  cantiere: Cantiere;
  projectTipo?: string | null;
  records: CantiereRecord[];
  isStudio: boolean;
  myUid: string;
  myName: string;
  saveEntity: (coll: string, item: any) => void;
  onPlanTasks?: (tasks: PlanTask[]) => void;
}

const COLL = 'cantiereRecords';
const DAY = 864e5;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (isoDate: string, n: number) => new Date(new Date(isoDate + 'T12:00:00').getTime() + n * DAY).toISOString().slice(0, 10);
const fmt = (d?: string | null) => (d ? new Date(d + 'T00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }) : '—');
const FASI: PianoFase[] = ['prima', 'avvio', 'strutture', 'esecuzione', 'chiusura'];
const OPT_LABEL: [keyof PianoOpts, string][] = [
  ['strutture', 'Strutture (c.a. / muratura armata)'], ['scavi', 'Scavi'], ['demolizioni', 'Demolizioni'], ['piscina', 'Piscina'],
  ['confinati', 'Cisterne / fosse / vasche'], ['amianto', 'Presenza di amianto'], ['piuImprese', 'Più imprese'],
];

export const PianoCantiere: React.FC<Props> = (p) => {
  const c = p.cantiere;
  const [tab, setTab] = React.useState<'piano' | 'getti'>('piano');
  const piano = p.records.filter((r) => r.section === 'piano').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const config = p.records.find((r) => r.section === 'piano-config');
  const savedOpts: PianoOpts | null = React.useMemo(() => { try { return config?.fields?.opts ? JSON.parse(config.fields.opts) : null; } catch { return null; } }, [config]);
  const [opts, setOpts] = React.useState<PianoOpts>(savedOpts || optsDaPratica(p.projectTipo));
  const start = c.startDate || today();
  const end = c.dueDate || addDays(start, 180);
  const by = { by: p.myUid, byName: p.myName, role: 'studio' };

  const genera = (o: PianoOpts, keepDone = true) => {
    const voci = generaPiano(o, start, end);
    const tasks: PlanTask[] = [];
    voci.forEach((v) => {
      const old = piano.find((r) => r.fields?.key === v.key);
      const done = keepDone && old?.status === 'Fatto';
      const rec: CantiereRecord = {
        id: `pc-${v.key}`, section: 'piano', title: v.title, date: done ? old!.date : v.date, status: done ? 'Fatto' : 'Da fare', note: v.note || null,
        fields: { fase: v.fase, kind: v.kind, who: v.who, hold: v.hold ? '1' : '', key: v.key }, at: Date.now(), ...by,
      };
      p.saveEntity(COLL, rec);
      if (!done) tasks.push({ id: `pc-${c.id}-${v.key}`, title: `${v.title} — ${c.name}`, date: rec.date!, notes: [v.who, v.note].filter(Boolean).join(' · '), weekly: v.kind === 'ricorrente' });
    });
    p.saveEntity(COLL, { id: 'pc-config', section: 'piano-config', title: 'Configurazione piano', fields: { opts: JSON.stringify(o) }, at: Date.now(), ...by });
    p.onPlanTasks?.(tasks);
  };

  const toggle = (r: CantiereRecord) => {
    const done = r.status !== 'Fatto';
    p.saveEntity(COLL, { ...r, status: done ? 'Fatto' : 'Da fare', at: Date.now() });
    p.onPlanTasks?.([{ id: `pc-${c.id}-${r.fields?.key}`, title: `${r.title} — ${c.name}`, date: r.date || today(), done }]);
  };

  const holdsAperti = piano.filter((r) => r.fields?.fase === 'prima' && r.fields?.hold && r.status !== 'Fatto');
  const fatte = piano.filter((r) => r.status === 'Fatto').length;

  // ---------------------------------------------------------------- registro getti
  const getti = p.records.filter((r) => r.section === 'getti').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const [gDate, setGDate] = React.useState(today());
  const [gEl, setGEl] = React.useState('');
  const [gM3, setGM3] = React.useState('');
  const minPrel = prelieviMinimi(getti.map((g) => ({ date: g.date, m3: Number(g.fields?.m3 || 0) })));
  const prelFatti = getti.reduce((a, g) => a + (Number(g.fields?.prelievi || 0) || 0), 0);
  const ultimate = piano.find((r) => r.id === 'pc-strutture-ultimate');

  const addGetto = () => {
    const m3 = Number(gM3);
    if (!gEl.trim() || !m3) return;
    const id = `getto-${Date.now().toString(36)}`;
    const prel = Math.max(1, Math.ceil(m3 / 100)); // almeno 1 prelievo (2 cubetti) per getto
    p.saveEntity(COLL, { id, section: 'getti', title: gEl.trim(), date: gDate, status: 'Prelevato', fields: { m3: String(m3), prelievi: String(prel) }, at: Date.now(), ...by });
    p.onPlanTasks?.([{ id: `pc-${c.id}-lab-${id}`, title: `Cubetti al laboratorio: ${gEl.trim()} — ${c.name}`, date: addDays(gDate, 40), notes: `Scadenza di legge: entro il ${fmt(addDays(gDate, 45))} (45 giorni dal prelievo). ${prel} prelievi = ${prel * 2} cubetti.` }]);
    setGEl(''); setGM3('');
  };
  const toggleLab = (g: CantiereRecord) => {
    const inviato = g.status !== 'Inviato al laboratorio';
    p.saveEntity(COLL, { ...g, status: inviato ? 'Inviato al laboratorio' : 'Prelevato', at: Date.now() });
    p.onPlanTasks?.([{ id: `pc-${c.id}-lab-${g.id}`, title: `Cubetti al laboratorio: ${g.title} — ${c.name}`, date: addDays(g.date || today(), 40), done: inviato }]);
  };
  const struttureUltimate = () => {
    const d = today();
    p.saveEntity(COLL, { id: 'pc-strutture-ultimate', section: 'piano', title: 'Strutture ultimate', date: d, status: 'Fatto', fields: { fase: 'strutture', kind: 'scadenza', who: 'DL', hold: '', key: 'strutture-ultimate' }, at: Date.now(), ...by });
    p.onPlanTasks?.([
      { id: `pc-${c.id}-relazione-su`, title: `Relazione a strutture ultimate al Genio Civile — ${c.name}`, date: addDays(d, 58), notes: `Entro il ${fmt(addDays(d, 65))} (65 giorni). Con registro dei getti e certificati di laboratorio.` },
      { id: `pc-${c.id}-collaudo`, title: `Deposito del collaudo statico — ${c.name}`, date: addDays(d, 118), notes: `Entro 60 giorni dalla relazione (indicativamente il ${fmt(addDays(d, 125))}). Collaudatore terzo con oltre 10 anni di albo.` },
    ]);
  };

  const pill = (on: boolean) => `px-3 py-1.5 rounded-full text-[12.5px] font-bold border cursor-pointer ${on ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#555] border-[#e2e2e2]'}`;
  const IN = 'px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[13px] outline-none focus:border-[#161616]';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <button className={pill(tab === 'piano')} onClick={() => setTab('piano')}>Piano di cantiere</button>
        <button className={pill(tab === 'getti')} onClick={() => setTab('getti')}>Registro getti</button>
      </div>

      {tab === 'piano' && (piano.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 flex flex-col gap-4">
          <div>
            <p className="text-[16px] font-black text-[#161616]">Genera il piano di cantiere</p>
            <p className="text-[12.5px] text-[#6b6b6b] mt-1">Dal tipo di intervento Aulico crea i punti di fermo prima di entrare, le visite obbligatorie della DL, la riunione di avvio, gli ordini da anticipare e le scadenze, con le date del cantiere ({fmt(start)} → {fmt(end)}). Ogni voce finisce anche in agenda.</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['nuova', 'ristrutturazione', 'ampliamento'] as const).map((t) => (
              <button key={t} disabled={!p.isStudio} onClick={() => setOpts({ ...opts, tipo: t })} className={pill(opts.tipo === t)}>{t === 'nuova' ? 'Nuova costruzione' : t === 'ristrutturazione' ? 'Ristrutturazione' : 'Ampliamento'}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {OPT_LABEL.map(([k, l]) => (
              <label key={k} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#333] cursor-pointer">
                <input type="checkbox" disabled={!p.isStudio} checked={!!opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} className="w-4 h-4 accent-[#161616]" /> {l}
              </label>
            ))}
          </div>
          {p.isStudio && <button onClick={() => genera(opts)} className="self-start px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold border-none cursor-pointer">Genera il piano</button>}
        </div>
      ) : (
        <>
          {holdsAperti.length > 0 && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-[18px] bg-amber-50 border border-amber-200 text-amber-800">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-[13px] font-semibold">Cantiere in preparazione: mancano {holdsAperti.length} punti di fermo prima di far entrare le imprese ({holdsAperti.map((h) => h.title).join(', ')}).</p>
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px] h-2 rounded-full bg-[#f0f0ee] overflow-hidden"><motion.div className="h-full bg-[#161616]" initial={{ width: 0 }} animate={{ width: `${piano.length ? (fatte / piano.length) * 100 : 0}%` }} /></div>
            <span className="text-[12.5px] font-bold text-[#555]">{fatte}/{piano.length} fatte</span>
            {p.isStudio && savedOpts && (
              <button onClick={() => genera(savedOpts)} title="Ricalcola le date delle voci non fatte con le date attuali del cantiere" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e2e2e2] text-[12px] font-bold text-[#161616] cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Ricalcola le date</button>
            )}
          </div>
          {FASI.map((f) => {
            const voci = piano.filter((r) => r.fields?.fase === f);
            if (!voci.length) return null;
            return (
              <div key={f} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4">
                <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#6b6b6b] mb-2">{FASE_LABEL[f]}</p>
                <div className="flex flex-col gap-1.5">
                  {voci.map((r) => {
                    const done = r.status === 'Fatto';
                    const late = !done && r.date && r.date < today();
                    return (
                      <div key={r.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${done ? 'border-emerald-100 bg-emerald-50/40' : 'border-[#f0f0f0]'}`}>
                        <button disabled={!p.isStudio} onClick={() => toggle(r)} aria-label={done ? 'Riapri' : 'Fatto'}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 ${done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#8a8a8a] bg-white'} ${p.isStudio ? 'cursor-pointer' : 'cursor-default'}`}>
                          {done && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13.5px] font-bold ${done ? 'text-[#6b6b6b] line-through' : 'text-[#161616]'}`}>
                            {r.title}
                            {r.fields?.hold && <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-700"><Lock className="w-3 h-3" /> punto di fermo</span>}
                          </p>
                          {r.note && <p className="text-[12px] text-[#6b6b6b] mt-0.5 leading-snug">{r.note}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[12px] font-bold ${late ? 'text-rose-600' : 'text-[#555]'}`}><CalendarClock className="w-3.5 h-3.5" />{fmt(r.date)}</span>
                          <p className="text-[11px] text-[#8a8a8a] font-semibold">{KIND_LABEL[(r.fields?.kind || 'check') as keyof typeof KIND_LABEL]} · {r.fields?.who}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      ))}

      {tab === 'getti' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Getti', String(getti.length)],
              ['m³ totali', String(getti.reduce((a, g) => a + Number(g.fields?.m3 || 0), 0))],
              ['Prelievi fatti', String(prelFatti)],
              ['Prelievi minimi (NTC)', String(minPrel)],
            ].map(([l, v]) => (
              <div key={l} className="bg-white border border-[#e2e2e2] rounded-[20px] px-4 py-3">
                <div className={`text-[20px] font-black ${l.startsWith('Prelievi minimi') && prelFatti < minPrel ? 'text-rose-600' : 'text-[#161616]'}`}>{v}</div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#767676]">{l}</div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#6b6b6b]">Controllo di tipo A: almeno 1 prelievo (2 cubetti) per ogni giorno di getto e almeno 3 prelievi ogni 300 m³. Cubetti solo dalla betoniera o dalla pompa, con la DL presente; al laboratorio entro 45 giorni.</p>
          {p.isStudio && (
            <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-3 flex gap-2 flex-wrap items-end">
              <input type="date" value={gDate} onChange={(e) => setGDate(e.target.value)} className={IN} />
              <input value={gEl} onChange={(e) => setGEl(e.target.value)} placeholder="Elemento (es. fondazioni, solaio piano terra)" className={`${IN} flex-1 min-w-[200px]`} />
              <input type="number" min={0} value={gM3} onChange={(e) => setGM3(e.target.value)} placeholder="m³" className={`${IN} w-24`} />
              <button onClick={addGetto} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161616] text-white text-[13px] font-bold border-none cursor-pointer"><Plus className="w-4 h-4" /> Registra getto</button>
            </div>
          )}
          {getti.map((g) => {
            const sent = g.status === 'Inviato al laboratorio';
            const scad = addDays(g.date || today(), 45);
            const late = !sent && scad < today();
            return (
              <div key={g.id} className="bg-white border border-[#e2e2e2] rounded-[18px] p-3 flex items-center gap-3 flex-wrap">
                <FlaskConical className="w-5 h-5 text-[#555]" />
                <div className="flex-1 min-w-[160px]">
                  <p className="text-[13.5px] font-bold text-[#161616]">{g.title} · {g.fields?.m3} m³</p>
                  <p className="text-[12px] text-[#6b6b6b]">{fmt(g.date)} · {g.fields?.prelievi} prelievi ({Number(g.fields?.prelievi || 0) * 2} cubetti)</p>
                </div>
                <span className={`text-[12px] font-bold ${sent ? 'text-emerald-700' : late ? 'text-rose-600' : 'text-amber-700'}`}>{sent ? 'Inviati al laboratorio' : `Laboratorio entro il ${fmt(scad)}`}</span>
                {p.isStudio && <button onClick={() => toggleLab(g)} className="px-3 py-1.5 rounded-xl bg-white border border-[#e2e2e2] text-[12px] font-bold cursor-pointer">{sent ? 'Annulla' : 'Segna inviati'}</button>}
              </div>
            );
          })}
          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
            {ultimate ? (
              <p className="text-[13px] font-semibold text-[#161616]">Strutture ultimate il {fmt(ultimate.date)}: relazione al Genio Civile entro il {fmt(addDays(ultimate.date!, 65))}, poi collaudo statico entro 60 giorni. Le scadenze sono in agenda.</p>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[13px] text-[#555] flex-1 min-w-[200px]">Quando l'ossatura è finita, segna le strutture ultimate: partono i conti alla rovescia per la relazione (65 giorni) e il collaudo statico (60 giorni).</p>
                {p.isStudio && <button onClick={struttureUltimate} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[13px] font-bold border-none cursor-pointer">Strutture ultimate</button>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
