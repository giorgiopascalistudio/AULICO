/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Report di profilo — "cosa ha fatto questa persona nella settimana / nel mese".
 * Modello: il report settimanale di Rosa (docs `28. Report_Rosa Custodero.pdf`):
 * intestazione (persona + settimana/mese), sezioni NUMERATE con le attività svolte,
 * CONCLUSIONE discorsiva.
 *
 * Le voci sono testo libero — molte attività (riunioni, shooting, archivio cartaceo)
 * l'app non le conosce — ma "Precompila dai dati" scrive da solo quello che sa del
 * periodo: contenuti pubblicati, articoli, eventi, attività completate, riunioni.
 * Una riga = una voce; una riga che inizia con uno spazio = sotto-voce (le "o" del
 * modello). Le sezioni sono un template: rinominabili, aggiungibili, riordinabili.
 *
 * Nodo `profileReports/<uid>/<periodo>`: lo scrive il diretto interessato (o admin/
 * manager), lo legge lo studio.
 */
import React from 'react';
import {
  Printer, Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Loader2, Wand2, Eye, PencilLine,
} from 'lucide-react';
import type {
  Appointment, EditorialPost, ProfileReport as TProfileReport, ProfileReportSection,
  SocMktItem, Task, TimeEntry, UserProfile,
} from '../types';
import { PeriodSelect } from './PeriodSelect';
import { isoOf, monthPeriod, ymNow, type Period } from '../period';
import { fmtDuration } from '../timetracking';
import { callAi } from '../firebase';

interface Props {
  me: { uid: string; name?: string | null };
  isBoss: boolean;                                   // admin/manager: può scrivere il report di chiunque
  members: UserProfile[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  appointments: Appointment[];
  posts: EditorialPost[];                            // calendario editoriale
  extras: SocMktItem[];                              // blog / eventi / gadget
  accounts: { id: string; name: string }[];          // account marketing (per i nomi)
  reports: Record<string, Record<string, TProfileReport>>;  // uid → periodo → report
  onSave?: (r: TProfileReport) => void;
  color?: string;
}

/** Template di partenza (dal modello): rinominabile e modificabile per ogni report. */
const DEFAULT_SECTIONS = ['ARCHIVIO MARKETING', 'AGGIORNAMENTO SITO', 'GESTIONE SOCIAL', 'PIANIFICAZIONE'];

const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
const sid = () => `s-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const blankReport = (uid: string, name: string | null, period: Period): TProfileReport => ({
  id: period.key,
  uid,
  name,
  period: period.key,
  sections: DEFAULT_SECTIONS.map((t) => ({ id: sid(), title: t, body: '' })),
  conclusion: '',
  updatedAt: 0,
});

/** '06 luglio – 12 luglio 2026' (intestazione del documento). */
const longRange = (p: Period) => {
  const f = new Date(`${p.from}T12:00:00`);
  const t = new Date(`${p.to}T12:00:00`);
  const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });
  return `${fmt(f)} – ${fmt(t)} ${t.getFullYear()}`;
};
/** Righe non vuote del corpo; l'indentazione segna la sotto-voce. */
const linesOf = (body: string) =>
  body.split('\n').filter((l) => l.trim()).map((l) => ({ text: l.trim(), sub: /^[\s\t]/.test(l) }));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ProfileReport: React.FC<Props> = ({
  me, isBoss, members, tasks, timeEntries, appointments, posts, extras, accounts, reports, onSave, color = '#161616',
}) => {
  const [uid, setUid] = React.useState(me.uid);
  const [period, setPeriod] = React.useState<Period>(() => monthPeriod(ymNow()));
  const [preview, setPreview] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);

  const person = members.find((m) => m.uid === uid);
  const personName = person?.name || me.name || '';
  const canEdit = !!onSave && (isBoss || uid === me.uid);

  const [draft, setDraft] = React.useState<TProfileReport>(() => blankReport(uid, personName, period));
  // Il draft si riallinea quando cambi persona o periodo (non a ogni salvataggio:
  // stai scrivendo, non deve saltarti sotto le dita).
  React.useEffect(() => {
    setDraft(reports[uid]?.[period.key] || blankReport(uid, person?.name || null, period));
  }, [uid, period.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next: TProfileReport) => {
    setDraft(next);
    if (canEdit) onSave?.({ ...next, uid, id: period.key, period: period.key, name: person?.name || personName || null, updatedAt: Date.now(), by: me.uid });
  };
  const patchSection = (id: string, patch: Partial<ProfileReportSection>) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  // ---------------------------------------------------------------- dati del periodo
  const inRange = (iso?: string | null) => !!iso && iso >= period.from && iso <= period.to;
  const accName = (ch: string) => accounts.find((a) => a.id === ch || a.name === ch)?.name || ch;

  /** Quello che l'app SA di questa persona nel periodo, già in forma di voci. */
  const derived = React.useMemo(() => {
    const social: string[] = [];
    const sito: string[] = [];
    const pian: string[] = [];

    // Contenuti pubblicati dal calendario editoriale, raggruppati per account + piattaforma
    const pubs = posts.filter((p) => p.createdBy === uid && p.status === 'pubblicato' && inRange(p.dateISO));
    const byKey = new Map<string, number>();
    pubs.forEach((p) => {
      const k = `${p.platform || 'social'}__${p.channel}`;
      byKey.set(k, (byKey.get(k) || 0) + 1);
    });
    byKey.forEach((n, k) => {
      const [platform, channel] = k.split('__');
      social.push(`Pubblicazione ${plural(n, 'contenuto', 'contenuti')} su ${platform} (${accName(channel)})`);
    });

    // Blog / eventi / gadget (nodo socMkt)
    const mine = extras.filter((i) => i.by === uid && inRange(i.date));
    const blog = mine.filter((i) => i.kind === 'blog');
    if (blog.length) sito.push(`Inseriti ${plural(blog.length, 'nuovo articolo', 'nuovi articoli')} nella sezione blog`);
    mine.filter((i) => i.kind === 'evento' || i.kind === 'gadget').forEach((i) => pian.push(`${i.kind === 'evento' ? 'Evento' : 'Gadget'}: ${i.title}`));

    // Riunioni e appuntamenti a cui ha partecipato
    appointments
      .filter((a) => a.kind !== 'nota' && inRange(a.date) && (a.participants ? a.participants[uid] : a.ownerUid === uid) && a.status !== 'rifiutato')
      .forEach((a) => pian.push(`${a.title}${a.withName ? ` con ${a.withName}` : ''}`));

    // Attività completate nel periodo (agenda). `isoOf` e non toISOString: quest'ultima
    // è UTC e a cavallo di mezzanotte sposterebbe l'attività al giorno prima.
    tasks
      .filter((t) => t.done && (t.assignee === uid || (t.assignees || []).includes(uid)) && inRange(isoOf(new Date(t.updatedAt || 0))))
      .forEach((t) => pian.push(t.title));

    return { social, sito, pian };
  }, [uid, period.key, posts, extras, appointments, tasks, accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const derivedCount = derived.social.length + derived.sito.length + derived.pian.length;

  /** Ore reali del periodo (dai cronometri): un dato che il report non deve digitare. */
  const trackedMin = React.useMemo(
    () => timeEntries
      .filter((e) => e.whoUid === uid && e.end && inRange(isoOf(new Date(e.end))))
      .reduce((s, e) => s + (e.minutes || 0), 0),
    [timeEntries, uid, period.key] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Aggiunge le voci derivate nella sezione più adatta, saltando quelle già scritte. */
  const precompile = () => {
    const sections = draft.sections.length ? [...draft.sections] : DEFAULT_SECTIONS.map((t) => ({ id: sid(), title: t, body: '' }));
    const already = new Set(sections.flatMap((s) => linesOf(s.body).map((l) => l.text.toLowerCase())));
    const target = (kw: string) => {
      const i = sections.findIndex((s) => s.title.toUpperCase().includes(kw));
      if (i >= 0) return i;
      sections.push({ id: sid(), title: 'ALTRE ATTIVITÀ', body: '' });
      return sections.length - 1;
    };
    const push = (kw: string, items: string[]) => {
      const fresh = items.filter((t) => !already.has(t.toLowerCase()));
      if (!fresh.length) return;
      const i = target(kw);
      sections[i] = { ...sections[i], body: [sections[i].body.replace(/\s+$/, ''), ...fresh].filter(Boolean).join('\n') };
      fresh.forEach((t) => already.add(t.toLowerCase()));
    };
    push('SOCIAL', derived.social);
    push('SITO', derived.sito);
    push('PIANIFIC', derived.pian);
    persist({ ...draft, sections });
  };

  const aiConclusion = async () => {
    const testo = draft.sections
      .filter((s) => s.body.trim())
      .map((s) => `${s.title}:\n${linesOf(s.body).map((l) => `- ${l.text}`).join('\n')}`)
      .join('\n\n');
    if (!testo.trim()) { alert('Scrivi prima le attività: la conclusione le riassume.'); return; }
    setAiLoading(true);
    try {
      const out = await callAi({
        prompt: `Scrivi la CONCLUSIONE di un report di attività ${period.mode === 'settimana' ? 'settimanale' : 'mensile'} di ${personName || 'un collaboratore'} del gruppo Aulico.
Riassumi in prosa scorrevole, in 3-4 paragrafi, SOLO le attività elencate qui sotto, senza inventarne altre e senza elenchi puntati:\n\n${testo.slice(0, 4000)}`,
        system: 'Scrivi in italiano, in terza persona impersonale ("sono state svolte…"), tono professionale e sobrio da report aziendale. Rispondi SOLO con il testo, senza titoli né preamboli.',
        maxTokens: 600,
      });
      if (out?.trim()) persist({ ...draft, conclusion: out.trim() });
      else alert('AI non disponibile ora: scrivi la conclusione a mano.');
    } catch {
      alert('AI non disponibile ora: scrivi la conclusione a mano.');
    } finally { setAiLoading(false); }
  };

  const kindLabel = period.mode === 'settimana' ? 'SETTIMANALE' : 'MENSILE';

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Barra comandi */}
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white"
          >
            {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === me.uid ? ' (tu)' : ''}</option>)}
          </select>
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[12px] font-bold cursor-pointer">
            {preview ? <><PencilLine className="w-4 h-4" /> Modifica</> : <><Eye className="w-4 h-4" /> Anteprima</>}
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
            <Printer className="w-4 h-4" /> Stampa / PDF
          </button>
        </div>
      </div>

      {!canEdit && (
        <p className="text-[12px] font-semibold text-[#8a8a8a] bg-white border border-[#e2e2e2] rounded-[16px] px-4 py-2.5 no-print">
          Stai leggendo il report di <b className="text-[#161616]">{personName}</b>: solo l'interessato (o un responsabile) può scriverlo.
        </p>
      )}

      {/* ---------------- EDITOR ---------------- */}
      {!preview && (
        <div className="flex flex-col gap-3 no-print">
          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[12.5px] font-bold text-[#161616]">Una riga = una voce. Una riga che inizia con uno spazio diventa una sotto-voce.</p>
              <p className="text-[11.5px] text-[#9a9a9a] font-semibold mt-0.5">
                {derivedCount > 0
                  ? `Dai dati del periodo l'app può scrivere ${plural(derivedCount, 'voce', 'voci')} (contenuti, articoli, riunioni, attività completate).`
                  : 'Per questo periodo l\'app non trova contenuti, riunioni o attività da attribuirti: scrivi le voci a mano.'}
              </p>
            </div>
            {canEdit && derivedCount > 0 && (
              <button onClick={precompile} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[12px] font-bold cursor-pointer shrink-0">
                <Wand2 className="w-4 h-4" /> Precompila dai dati
              </button>
            )}
          </div>

          {draft.sections.map((s, i) => (
            <div key={s.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-[#9a9a9a] w-5 shrink-0">{i + 1}.</span>
                <input
                  value={s.title}
                  disabled={!canEdit}
                  onChange={(e) => patchSection(s.id, { title: e.target.value })}
                  onBlur={() => persist(draft)}
                  className={`${inp} font-extrabold uppercase tracking-wide`}
                  placeholder="Titolo sezione"
                />
                {canEdit && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => { if (i === 0) return; const ss = [...draft.sections]; [ss[i - 1], ss[i]] = [ss[i], ss[i - 1]]; persist({ ...draft, sections: ss }); }} disabled={i === 0} className="w-8 h-8 rounded-lg hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer bg-transparent border-none disabled:opacity-30" title="Sposta su"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => { if (i === draft.sections.length - 1) return; const ss = [...draft.sections]; [ss[i + 1], ss[i]] = [ss[i], ss[i + 1]]; persist({ ...draft, sections: ss }); }} disabled={i === draft.sections.length - 1} className="w-8 h-8 rounded-lg hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer bg-transparent border-none disabled:opacity-30" title="Sposta giù"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => persist({ ...draft, sections: draft.sections.filter((x) => x.id !== s.id) })} className="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center cursor-pointer bg-transparent border-none" title="Elimina sezione"><Trash2 className="w-4 h-4" /></button>
                  </span>
                )}
              </div>
              <textarea
                value={s.body}
                disabled={!canEdit}
                onChange={(e) => patchSection(s.id, { body: e.target.value })}
                onBlur={() => persist(draft)}
                rows={Math.max(3, s.body.split('\n').length + 1)}
                placeholder={'Es. Pubblicazione 4 post su TikTok\nRiunione marketing con Angela e Dario\n  sotto-voce (riga che inizia con uno spazio)'}
                className={`${inp} resize-y leading-relaxed`}
              />
            </div>
          ))}

          {canEdit && (
            <button
              onClick={() => persist({ ...draft, sections: [...draft.sections, { id: sid(), title: 'NUOVA SEZIONE', body: '' }] })}
              className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-dashed border-[#c9c9c9] hover:border-[#161616] text-[12px] font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Aggiungi sezione
            </button>
          )}

          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Conclusione</p>
              {canEdit && (
                <button onClick={aiConclusion} disabled={aiLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-[#161616] text-[11.5px] font-bold cursor-pointer disabled:opacity-50">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Scrivila con l'AI
                </button>
              )}
            </div>
            <textarea
              value={draft.conclusion || ''}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, conclusion: e.target.value }))}
              onBlur={() => persist(draft)}
              rows={6}
              placeholder="Il racconto del periodo: cosa è stato fatto e perché. L'AI la scrive dalle voci qui sopra."
              className={`${inp} resize-y leading-relaxed`}
            />
          </div>
        </div>
      )}

      {/* ---------------- DOCUMENTO (anteprima + stampa) ---------------- */}
      <div className={`${preview ? 'block' : 'hidden print:block'} print-area bg-white border border-[#e2e2e2] rounded-[22px] p-8`}>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color }}>REPORT {kindLabel}</p>
        <h3 className="text-[24px] font-black text-[#161616] mt-1">{personName || '—'}</h3>
        <p className="text-[13px] font-bold text-[#555] mt-0.5">
          {period.mode === 'settimana' ? <>Settimana {period.week} · {longRange(period)}</> : <span className="capitalize">{period.label}</span>}
        </p>

        <div className="flex flex-col gap-4 mt-6">
          {draft.sections.filter((s) => s.title.trim() || s.body.trim()).map((s, i) => (
            <div key={s.id}>
              <p className="text-[13px] font-black text-[#161616] uppercase tracking-wide">{i + 1}. {s.title}</p>
              <div className="mt-1 flex flex-col gap-0.5">
                {linesOf(s.body).length === 0
                  ? <p className="text-[12.5px] italic text-[#b0b0b0]">—</p>
                  : linesOf(s.body).map((l, k) => (
                    <p key={k} className={`text-[12.5px] text-[#333] leading-relaxed ${l.sub ? 'pl-9' : 'pl-4'}`}>
                      <span className="text-[#9a9a9a] mr-1.5">{l.sub ? 'o' : '-'}</span>{l.text}
                    </p>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-black text-[#161616] uppercase tracking-wide">Conclusione</p>
          {draft.conclusion?.trim()
            ? draft.conclusion.split('\n').filter((p) => p.trim()).map((p, i) => (
              <p key={i} className="text-[12.5px] text-[#333] leading-relaxed mt-2 text-justify">{p}</p>
            ))
            : <p className="text-[12.5px] italic text-[#b0b0b0] mt-2">—</p>}
        </div>

        {trackedMin > 0 && (
          <p className="text-[11px] font-bold text-[#9a9a9a] mt-6 pt-3 border-t border-[#eee]">
            Ore tracciate col cronometro nel periodo: <b className="text-[#555]">{fmtDuration(trackedMin)}</b>
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileReport;
