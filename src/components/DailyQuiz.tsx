/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DailyQuiz — quiz informativo giornaliero (5 domande) per il cliente.
 * Domande **inerenti alle attività** dello studio (architettura, strutture,
 * edilizia, efficienza energetica, cantiere) + una domanda personalizzata sul
 * SUO progetto. A fine quiz mostra un **riepilogo con le risposte corrette** e
 * la spiegazione, così il cliente impara qualcosa ogni giorno. Una volta al
 * giorno salva l'esito su users/<uid>/quiz (nessun nodo nuovo). Streak + punteggio.
 */
import React, { useMemo, useState } from 'react';
import { HelpCircle, Check, X, Trophy, BookOpen } from 'lucide-react';
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

/** Banca domande "di mestiere": architettura, strutture, edilizia, energia, cantiere. */
type Item = { q: string; correct: string; distractors: string[]; explain: string };
const KNOWLEDGE: Item[] = [
  {
    q: 'Quale tipo di struttura regge meglio i carichi scaricandoli per sola compressione?',
    correct: "L'arco",
    distractors: ['La trave appoggiata', 'Una mensola a sbalzo', 'Un solaio sottile'],
    explain: "L'arco trasferisce i carichi alle imposte lavorando quasi solo a compressione: per questo regge grandi luci anche con materiali (pietra, mattoni) deboli a trazione.",
  },
  {
    q: 'Nel cemento armato a cosa serve principalmente l\'acciaio (i ferri)?',
    correct: 'A resistere alla trazione',
    distractors: ['A resistere alla compressione', 'A isolare dal freddo', 'A impermeabilizzare'],
    explain: 'Il calcestruzzo è forte a compressione ma debole a trazione: i ferri d\'armatura assorbono gli sforzi di trazione, completando il materiale.',
  },
  {
    q: 'A parità di sezione, quale materiale lavora meglio a compressione che a trazione?',
    correct: 'Il calcestruzzo',
    distractors: ['L\'acciaio', 'Il legno lamellare', 'La fibra di carbonio'],
    explain: 'Il calcestruzzo ha ottima resistenza a compressione ma scarsa a trazione: per questo si arma con acciaio dove serve resistere agli sforzi di trazione.',
  },
  {
    q: 'Quale fondazione è più indicata su un terreno poco portante o cedevole?',
    correct: 'Fondazione su pali',
    distractors: ['Plinto isolato poco profondo', 'Cordolo superficiale', 'Nessuna fondazione'],
    explain: 'I pali trasferiscono i carichi a strati di terreno profondi e più resistenti, evitando cedimenti su suoli superficiali deboli.',
  },
  {
    q: 'A cosa serve il "cappotto termico" su un edificio?',
    correct: 'A ridurre le dispersioni di calore',
    distractors: ['A sostenere i carichi', 'A impermeabilizzare il tetto', 'A schermare i rumori da calpestio'],
    explain: 'Il cappotto è uno strato isolante esterno che riduce le dispersioni termiche: meno consumi per riscaldare e raffrescare e classe energetica migliore.',
  },
  {
    q: 'Che cos\'è un "ponte termico"?',
    correct: 'Un punto dove il calore disperde più facilmente',
    distractors: ['Una trave che collega due edifici', 'Un tipo di fondazione', 'Un impianto di riscaldamento'],
    explain: 'È una discontinuità nell\'isolamento (es. balconi, pilastri, spigoli) dove il calore "scappa" più in fretta: causa muffe e sprechi energetici.',
  },
  {
    q: 'Cosa indica l\'APE (Attestato di Prestazione Energetica)?',
    correct: 'La classe energetica dell\'immobile',
    distractors: ['La proprietà catastale', 'Il valore di mercato', 'La conformità antincendio'],
    explain: 'L\'APE certifica il consumo energetico dell\'edificio con una classe da A4 (migliore) a G (peggiore) ed è obbligatorio per vendite e locazioni.',
  },
  {
    q: 'Per una piccola ristrutturazione interna senza opere strutturali, quale titolo edilizio basta di norma?',
    correct: 'CILA',
    distractors: ['Permesso di Costruire', 'Concessione edilizia', 'Nessuna comunicazione'],
    explain: 'La CILA (Comunicazione Inizio Lavori Asseverata) copre la manutenzione straordinaria leggera senza interventi sulle strutture portanti.',
  },
  {
    q: 'A cosa serve un "vespaio areato" (es. igloo) sotto il pavimento del piano terra?',
    correct: 'A isolare dall\'umidità di risalita',
    distractors: ['A sostenere i pilastri', 'A riscaldare i locali', 'A schermare i terremoti'],
    explain: 'Il vespaio crea un\'intercapedine ventilata sotto il solaio contro terra: allontana l\'umidità del terreno e migliora l\'isolamento.',
  },
  {
    q: 'In una muratura, qual è la differenza di un muro "portante"?',
    correct: 'Sostiene i carichi della struttura',
    distractors: ['Serve solo da divisorio', 'È sempre in cartongesso', 'Si può demolire liberamente'],
    explain: 'Il muro portante scarica a terra il peso di solai e tetto: non si può demolire o forare senza un progetto strutturale e idonei rinforzi.',
  },
  {
    q: 'Quale forma resiste meglio a parità di materiale per coprire grandi luci scaricando trazioni e compressioni?',
    correct: 'La trave reticolare (capriata)',
    distractors: ['Una lastra piana sottile', 'Un muretto', 'Un tramezzo'],
    explain: 'La trave reticolare scompone i carichi in aste tese e compresse: copre grandi luci con poco materiale, da qui il suo uso in coperture e ponti.',
  },
  {
    q: 'Cosa garantisce la "guaina" bituminosa o sintetica su un tetto piano?',
    correct: "L'impermeabilizzazione",
    distractors: ['La resistenza sismica', 'L\'isolamento acustico', 'La portata strutturale'],
    explain: 'La guaina è lo strato impermeabile che impedisce alle infiltrazioni d\'acqua di raggiungere il solaio: va sempre risvoltata sui bordi.',
  },
  {
    q: 'Un solaio in laterocemento è composto principalmente da…',
    correct: 'Travetti, pignatte (laterizio) e getto di calcestruzzo',
    distractors: ['Solo lamiera grecata', 'Solo legno massello', 'Solo vetro strutturale'],
    explain: 'È il solaio più diffuso in Italia: i travetti armati e le pignatte alleggeriscono il peso, il getto di calcestruzzo lo rende collaborante.',
  },
  {
    q: 'Per migliorare la resistenza di un edificio esistente al sisma si può…',
    correct: 'Inserire controventi o rinforzi strutturali',
    distractors: ['Aggiungere solo tinteggiatura', 'Togliere le fondazioni', 'Aumentare i tramezzi leggeri'],
    explain: 'Il miglioramento/adeguamento sismico usa controventi, incamiciature, FRP o nuove pareti per dissipare e ridistribuire le forze orizzontali del terremoto.',
  },
  {
    q: 'A parità di luce, quale soluzione di copertura smaltisce meglio acqua e neve?',
    correct: 'Il tetto a falde inclinate',
    distractors: ['Il tetto perfettamente piano', 'Una soletta in contropendenza', 'Una copertura senza pendenza'],
    explain: 'Le falde inclinate fanno defluire acqua e neve per gravità, riducendo ristagni e carichi: il tetto piano richiede pendenze e impermeabilizzazioni accurate.',
  },
  {
    q: 'Cosa misura la "classe energetica A" rispetto alla "G"?',
    correct: 'Consuma molta meno energia',
    distractors: ['È più grande di metratura', 'Ha più stanze', 'Costa sempre meno al metro quadro'],
    explain: 'La scala A→G indica l\'efficienza: un edificio in classe A consuma una frazione dell\'energia di uno in classe G, con bollette e impatto ambientale minori.',
  },
];

function buildQuiz(project: Project | null, rnd: () => number): Q[] {
  const qs: Q[] = [];
  // 1 domanda personalizzata sul progetto del cliente (se disponibile)
  const STATI: Record<string, string> = { attivo: 'Attivo', completato: 'Completato', sospeso: 'Sospeso', annullato: 'Annullato' };
  if (project) {
    const phases = Object.values(project.phases || {}).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    let done = 0, tot = 0;
    phases.forEach((ph: any) => Object.values(ph.tasks || {}).forEach((t: any) => { tot++; if (t.done) done++; }));
    const pct = tot ? Math.round((done / tot) * 100) : 0;
    const bucket = (n: number) => n < 25 ? '0–25%' : n < 50 ? '25–50%' : n < 75 ? '50–75%' : n < 100 ? '75–99%' : 'Completato';
    if (tot > 0) {
      qs.push(mk(`A che punto è l'avanzamento dei lavori del tuo progetto "${project.name}"?`, bucket(pct), ['0–25%', '25–50%', '50–75%', '75–99%', 'Completato'].filter((b) => b !== bucket(pct)), `Avanzamento attuale: circa ${pct}%.`, rnd));
    } else {
      qs.push(mk(`In che stato è il tuo progetto "${project.name}"?`, STATI[project.status] || 'Attivo', Object.values(STATI).filter((s) => s !== (STATI[project.status] || 'Attivo')), `Il progetto è attualmente "${STATI[project.status] || 'Attivo'}".`, rnd));
    }
  }

  // Riempi con domande "di mestiere" pescate a caso dalla banca (stabili nel giorno)
  const pool = shuffle(KNOWLEDGE, rnd);
  for (const it of pool) {
    if (qs.length >= 5) break;
    qs.push(mk(it.q, it.correct, it.distractors, it.explain, rnd));
  }
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

        {/* Riepilogo con le risposte corrette + spiegazione */}
        <div className="mt-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">
          <BookOpen className="w-[15px] h-[15px]" /> Le risposte corrette
        </div>
        <div className="mt-2 flex flex-col gap-2.5">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-[#ececec] bg-[#fafafa] p-3">
              <div className="text-[13px] font-semibold text-[#161616]">{qi + 1}. {q.q}</div>
              <div className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-emerald-800">
                <Check className="w-4 h-4 shrink-0 mt-px" />
                <span className="font-bold">{q.options[q.correct]}</span>
              </div>
              <p className="text-[12px] text-[#666] mt-1 leading-relaxed">{q.explain}</p>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[#8a8a8a] mt-3">Torna domani per nuove domande sul mondo delle costruzioni e sul tuo progetto.</p>
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
