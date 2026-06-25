/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DailyQuiz — quiz informativo giornaliero (5 domande) per il cliente.
 * Genera domande dal SUO progetto (stato, fasi, avanzamento) + qualche domanda
 * sul funzionamento del portale, per tenerlo aggiornato. Una volta al giorno:
 * salva l'esito su users/<uid>/quiz (nessun nodo nuovo). Streak + punteggio.
 */
import React, { useMemo, useState } from 'react';
import { HelpCircle, Check, X, Trophy } from 'lucide-react';
import { Project, UserProfile } from '../types';
import { updateNode } from '../firebase';

type Q = { q: string; options: string[]; correct: number; explain: string };
const todayKey = () => new Date().toISOString().slice(0, 10);

// PRNG deterministico (seed da data+uid) → stesso quiz per tutto il giorno
function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Crea una domanda mescolando le opzioni e tenendo traccia della corretta
function mk(q: string, correctLabel: string, distractors: string[], explain: string, rnd: () => number): Q {
  const opts = shuffle([correctLabel, ...distractors].slice(0, 4), rnd);
  return { q, options: opts, correct: opts.indexOf(correctLabel), explain };
}

function buildQuiz(project: Project | null, rnd: () => number): Q[] {
  const qs: Q[] = [];
  const STATI: Record<string, string> = { attivo: 'Attivo', completato: 'Completato', sospeso: 'Sospeso', annullato: 'Annullato' };
  if (project) {
    const phases = Object.values(project.phases || {}).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const phaseNames = phases.map((p: any) => p.name).filter(Boolean);
    let done = 0, tot = 0;
    phases.forEach((ph: any) => Object.values(ph.tasks || {}).forEach((t: any) => { tot++; if (t.done) done++; }));
    const pct = tot ? Math.round((done / tot) * 100) : 0;
    const bucket = (n: number) => n < 25 ? '0–25%' : n < 50 ? '25–50%' : n < 75 ? '50–75%' : n < 100 ? '75–99%' : 'Completato';

    qs.push(mk(`In che stato è il tuo progetto "${project.name}"?`, STATI[project.status] || 'Attivo', Object.values(STATI).filter((s) => s !== (STATI[project.status] || 'Attivo')), `Il progetto è attualmente "${STATI[project.status] || 'Attivo'}".`, rnd));
    if (phaseNames.length) {
      qs.push(mk('Quante fasi compongono il tuo progetto?', String(phaseNames.length), [String(phaseNames.length + 1), String(Math.max(1, phaseNames.length - 1)), String(phaseNames.length + 2)], `Il progetto ha ${phaseNames.length} fasi.`, rnd));
      const current = phases.find((ph: any) => Object.values(ph.tasks || {}).some((t: any) => !t.done)) as any;
      if (current && phaseNames.length > 1) {
        qs.push(mk('Qual è la fase attualmente in lavorazione?', current.name, phaseNames.filter((n) => n !== current.name), `La fase in corso è "${current.name}".`, rnd));
      }
    }
    if (tot > 0) {
      qs.push(mk('A che punto è l\'avanzamento dei lavori?', bucket(pct), ['0–25%', '25–50%', '50–75%', '75–99%', 'Completato'].filter((b) => b !== bucket(pct)), `Avanzamento attuale: circa ${pct}%.`, rnd));
    }
  }

  // Domande sul portale (sempre disponibili, riempiono fino a 5)
  const portalQs: Q[] = [
    mk('Dove segui foto e rapportini del cantiere?', 'Nella sezione Cantiere del progetto', ['Via email', 'Per telefono', 'Non sono disponibili'], 'Foto, rapportini e avanzamento sono nella sezione Cantiere.', rnd),
    mk('Come invii una nuova idea/richiesta allo studio?', 'Dalla sezione "La tua idea"', ['Chiamando lo studio', 'Andando di persona', 'Non è possibile'], 'Usa "La tua idea" per inviare una nuova richiesta con descrizione e moodboard.', rnd),
    mk('Dove trovi documenti e preventivi del tuo progetto?', 'Nel portale, nelle sezioni dedicate', ['Solo via email', 'Non disponibili', 'In segreteria'], 'Documenti e preventivi sono consultabili dal portale.', rnd),
    mk('Come comunichi con lo studio sul progetto?', 'Dalla chat del progetto', ['Solo per telefono', 'Solo di persona', 'Non si può'], 'La chat del progetto ti collega direttamente allo studio.', rnd),
    mk('Cosa puoi comporre per mostrare il tuo gusto?', 'Una moodboard (anche 3D)', ['Un foglio Excel', 'Niente', 'Un disegno a mano'], 'La moodboard 3D aiuta a comunicare lo stile che desideri.', rnd),
  ];
  for (const pq of portalQs) { if (qs.length >= 5) break; qs.push(pq); }
  return qs.slice(0, 5);
}

export const DailyQuiz: React.FC<{ profile: UserProfile; projects: Project[] }> = ({ profile, projects }) => {
  const today = todayKey();
  const quizState = (profile as any).quiz || {};
  const alreadyDone = quizState.lastDate === today;

  const primary = useMemo(() => projects.find((p) => p.status === 'attivo' && !p.archived) || projects[0] || null, [projects]);
  const questions = useMemo(() => buildQuiz(primary, seeded(today + profile.uid)), [primary, today, profile.uid]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(alreadyDone);

  if (!questions.length) return null;

  const finish = async (finalScore: number) => {
    setFinished(true);
    const streak = (quizState.lastDate && new Date(today).getTime() - new Date(quizState.lastDate).getTime() <= 2 * 864e5) ? (quizState.streak || 0) + 1 : 1;
    try { await updateNode(`users/${profile.uid}`, { quiz: { lastDate: today, lastScore: finalScore, bestScore: Math.max(finalScore, quizState.bestScore || 0), streak } }); } catch { /* opzionale */ }
  };

  const choose = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === questions[idx].correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (idx + 1 >= questions.length) { finish(score); return; }
    setIdx((x) => x + 1); setPicked(null);
  };

  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white border border-[#e5e5e5] rounded-[22px] p-5">{children}</div>
  );

  if (finished) {
    const last = alreadyDone ? quizState.lastScore : score;
    return (
      <Card>
        <div className="flex items-center gap-2 mb-1"><Trophy className="w-[18px] h-[18px] text-[#b45309]" /><b className="text-[15px]">Quiz del giorno</b></div>
        <p className="text-[13px] text-[#555] mt-1">{alreadyDone ? 'Hai già completato il quiz di oggi.' : 'Quiz completato!'} Punteggio: <b>{last}/{questions.length}</b>{quizState.streak ? ` · serie di ${quizState.streak} giorni 🔥` : ''}</p>
        <p className="text-[12px] text-[#8a8a8a] mt-1.5">Torna domani per nuove domande sul tuo progetto.</p>
      </Card>
    );
  }

  const cur = questions[idx];
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><HelpCircle className="w-[18px] h-[18px] text-[#b45309]" /><b className="text-[15px]">Quiz del giorno</b></div>
        <span className="text-[11.5px] text-[#8a8a8a]">Domanda {idx + 1} / {questions.length}</span>
      </div>
      <p className="text-[14px] font-semibold text-[#161616] mb-3">{cur.q}</p>
      <div className="flex flex-col gap-2">
        {cur.options.map((o, i) => {
          const isCorrect = picked != null && i === cur.correct;
          const isWrongPick = picked === i && i !== cur.correct;
          return (
            <button key={i} onClick={() => choose(i)} disabled={picked != null}
              className={`text-left text-[13.5px] px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer disabled:cursor-default flex items-center justify-between gap-2 ${
                isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : isWrongPick ? 'border-red-300 bg-red-50 text-red-700' : 'border-[#e2e2e2] bg-white hover:border-[#161616]'
              }`}>
              <span>{o}</span>
              {isCorrect && <Check className="w-4 h-4" />}
              {isWrongPick && <X className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-[#555]">{cur.explain}</span>
          <button onClick={next} className="shrink-0 text-[12.5px] font-bold px-4 py-2 rounded-xl bg-[#1b1b1b] text-white border-none cursor-pointer">{idx + 1 >= questions.length ? 'Fine' : 'Avanti'}</button>
        </div>
      )}
    </Card>
  );
};
