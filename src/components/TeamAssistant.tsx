/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TeamAssistant — assistente personale del team (consigli organizzativi via AI).
 * Costruisce il contesto dai task reali dell'utente (aperti/scaduti/urgenti/in
 * scadenza) e chiede consigli a `callAi` (Worker Groq, gratis). Niente nodi DB.
 */
import React, { useMemo, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Task, UserProfile } from '../types';
import { callAi } from '../firebase';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const TeamAssistant: React.FC<{ profile: UserProfile; tasks: Task[] }> = ({ profile, tasks }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [err, setErr] = useState('');

  // Task dell'utente (assegnatario singolo o multiplo)
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
    } catch (e: any) {
      setErr('AI non disponibile al momento. Verifica la configurazione del Worker (GROQ_KEY).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[22px] border border-[#e2e2e2] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-[14.5px] font-extrabold text-[#161616]">
          <Sparkles className="w-4.5 h-4.5 text-[#b45309]" /> Assistente personale
        </h3>
        <span className="text-[11.5px] text-[#8a8a8a]">{open_.length} aperti · {overdue.length} in ritardo</span>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-3 w-full py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none">
          Chiedi un consiglio organizzativo
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          <textarea
            value={q} onChange={(e) => setQ(e.target.value)} rows={2}
            placeholder="Domanda opzionale (es. 'come organizzo la settimana?'). Lascia vuoto per un consiglio sui tuoi task."
            className="w-full border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px] resize-none outline-none focus:border-[#161616]"
          />
          <div className="flex gap-2">
            <button onClick={ask} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sto pensando…</> : <>✨ Consiglio</>}
            </button>
            <button onClick={() => { setOpen(false); setAnswer(''); setErr(''); }} className="px-4 py-2.5 rounded-xl bg-[#f0f0f0] text-[#161616] font-bold text-[13px] cursor-pointer border-none">Chiudi</button>
          </div>
          {err && <p className="text-[12.5px] text-red-600">{err}</p>}
          {answer && (
            <div className="text-[13px] text-[#222] whitespace-pre-wrap leading-relaxed bg-[#fafafa] border border-[#ececec] rounded-xl p-3.5">{answer}</div>
          )}
        </div>
      )}
    </div>
  );
};
