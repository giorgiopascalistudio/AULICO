/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TeamAssistant — assistente personale del team (consigli organizzativi via AI).
 * Pulsante FLOTTANTE globale (in basso a destra) che apre un popup; raggiungibile
 * da ogni schermata. Costruisce il contesto dai task reali dell'utente e chiede
 * consigli a `callAi` (Worker Groq, gratis). Niente nodi DB.
 */
import React, { useMemo, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { Task, UserProfile } from '../types';
import { callAi } from '../firebase';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const TeamAssistant: React.FC<{ profile: UserProfile; tasks: Task[] }> = ({ profile, tasks }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [err, setErr] = useState('');

  const mine = useMemo(
    () => tasks.filter((t) => t.assignee === profile.uid || (t.assignees || []).includes(profile.uid)),
    [tasks, profile.uid]
  );
  const today = todayISO();
  const open_ = mine.filter((t) => !t.done);
  const overdue = open_.filter((t) => t.date && t.date < today);
  const urgent = open_.filter((t) => t.priority === 'urgente');
  const soon = open_.filter((t) => t.date && t.date >= today).sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 8);

  const buildPrompt = () => {
    const lines: string[] = [];
    lines.push(`Collaboratore: ${profile.name}${profile.title ? ` (${profile.title})` : ''}.`);
    lines.push(`Task aperti: ${open_.length}; scaduti: ${overdue.length}; urgenti: ${urgent.length}.`);
    if (overdue.length) lines.push(`In ritardo: ${overdue.slice(0, 8).map((t) => `${t.title} (dal ${t.date})`).join('; ')}.`);
    if (soon.length) lines.push(`Prossime scadenze: ${soon.map((t) => `${t.title} (${t.date}${t.priority === 'urgente' ? ', URGENTE' : ''})`).join('; ')}.`);
    if (q.trim()) lines.push(`Domanda specifica: ${q.trim()}`);
    lines.push('Dammi consigli organizzativi pratici: cosa fare oggi, come dare priorità, eventuali rischi. Massimo 6 punti puntati, concisi, in italiano.');
    return lines.join('\n');
  };

  const ask = async () => {
    setLoading(true); setErr(''); setAnswer('');
    try {
      const text = await callAi({
        prompt: buildPrompt(),
        system: "Sei l'assistente organizzativo personale di un collaboratore di uno studio di architettura/ingegneria (gruppo Aulico). Tono pratico e diretto, niente preamboli. Rispondi in italiano con elenco puntato.",
        maxTokens: 500,
      });
      setAnswer(text || 'Nessun suggerimento generato.');
    } catch {
      setErr('AI non disponibile al momento. Verifica la configurazione del Worker (GROQ_KEY).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bottone flottante (poco invasivo) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Assistente personale"
          className="fixed bottom-5 right-5 z-[150] w-12 h-12 rounded-full bg-[#1b1b1b] hover:bg-black text-white shadow-lg flex items-center justify-center cursor-pointer border-none active:scale-95 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Popup */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[150] w-[min(92vw,380px)] bg-white border border-[#e2e2e2] rounded-[20px] shadow-2xl flex flex-col max-h-[78vh] animate-[popIn_0.2s_ease_both]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ececec]">
            <b className="text-[14px] inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#b45309]" /> Assistente</b>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-4 flex flex-col gap-2.5 overflow-y-auto">
            <span className="text-[11.5px] text-[#8a8a8a]">{open_.length} task aperti · {overdue.length} in ritardo · {urgent.length} urgenti</span>
            <textarea
              value={q} onChange={(e) => setQ(e.target.value)} rows={2}
              placeholder="Domanda opzionale… (vuoto = consiglio sui tuoi task)"
              className="w-full border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px] resize-none outline-none focus:border-[#161616]"
            />
            <button onClick={ask} disabled={loading} className="w-full py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sto pensando…</> : <>✨ Consiglio organizzativo</>}
            </button>
            {err && <p className="text-[12.5px] text-red-600">{err}</p>}
            {answer && (
              <div className="text-[13px] text-[#222] whitespace-pre-wrap leading-relaxed bg-[#fafafa] border border-[#ececec] rounded-xl p-3.5">{answer}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
