/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TeamAssistant — assistente AI dello studio, come CHAT.
 * Bottone flottante globale → popup con conversazione. Riceve un contesto dei
 * dati a cui l'account è abilitato (progetti, task, clienti, finanza solo se
 * permessa) + una guida dell'app, così può: dare consigli organizzativi,
 * rispondere su dati reali e spiegare come funziona l'app. Via callAi (Groq).
 */
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Sparkles, Loader2, X, Send } from 'lucide-react';
import { Task, UserProfile, Project, ClientRecord } from '../types';
import { callAi } from '../firebase';

type Msg = { role: 'user' | 'assistant'; content: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Guida sintetica dell'app, per rispondere a "come funziona…". */
const APP_GUIDE = `GUIDA AULICO (per spiegare l'app):
- Aulico è il gestionale del gruppo: società Onirico (architettura), Materico (forniture/posa via partner), Unico (immobili/investimenti), Strategico (marketing). "Aulico" è la holding.
- Progetti: pratiche per divisione; dentro un progetto ci sono fasi/task, Documenti, Arredi & Moodboard (anche 3D), Cantiere, Contabilità di commessa.
- Cantiere: giornale di cantiere, rapportini, presenze, foto geolocalizzate, materiali, checklist, documenti, SAL (gli stati avanzamento lavori → fatturabili in Finanze).
- Finanze: parcelle/onorari, fatture attive/passive, scadenziario, preventivi & parcelle, conto economico per società + consolidato, Statistiche & BEP con il funnel di gruppo.
- CRM: pipeline lead, fornitori/partner, rubrica clienti.
- Materico: il cliente chiede, lo studio inoltra ai partner, raccoglie offerte, sceglie e invia al cliente; penali per ritardo.
- Unico: operazioni immobiliari, investitori, cascata ROE, commesse interne (CI-…).
- Strategico: progetti marketing con campagne, social, eventi, ads, SEO, sondaggi, contratti/retainer.
- Agenda: appuntamenti multi-partecipante e task.
- Incentivi: punti per team (bonus) e partner (affidabilità).
- Accessi & ruoli: admin/manager/staff (studio); cliente/partner (portale). Permessi anche per società.
- Cestino: ogni eliminazione è recuperabile 60 giorni.`;

export const TeamAssistant: React.FC<{
  profile: UserProfile;
  tasks: Task[];
  projects?: Project[];
  clients?: ClientRecord[];
  financeContext?: string;
}> = ({ profile, tasks, projects = [], clients = [], financeContext }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, loading]);

  // Snapshot dei dati a cui l'account ha accesso (compatto, per non gonfiare i token).
  const dataSnapshot = useMemo(() => {
    const today = todayISO();
    const mine = tasks.filter((t) => t.assignee === profile.uid || (t.assignees || []).includes(profile.uid));
    const open_ = mine.filter((t) => !t.done);
    const overdue = open_.filter((t) => t.date && t.date < today);
    const urgent = open_.filter((t) => t.priority === 'urgente');
    const active = projects.filter((p) => p.status === 'attivo' && !p.archived);
    const lines: string[] = [];
    lines.push(`Utente: ${profile.name}${profile.title ? ` (${profile.title})` : ''}, ruolo ${profile.role}.`);
    lines.push(`Progetti attivi (${active.length}): ${active.slice(0, 30).map((p) => `${p.name}${p.division ? ` [${p.division}]` : ''}${p.client ? ` – ${p.client}` : ''}`).join('; ') || 'nessuno'}.`);
    lines.push(`Tuoi task: ${open_.length} aperti, ${overdue.length} scaduti, ${urgent.length} urgenti.`);
    if (overdue.length) lines.push(`Scaduti: ${overdue.slice(0, 10).map((t) => `${t.title} (${t.date})`).join('; ')}.`);
    if (open_.length) lines.push(`Prossimi: ${open_.filter((t) => t.date && t.date >= today).sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 10).map((t) => `${t.title} (${t.date})`).join('; ')}.`);
    if (clients.length) lines.push(`Clienti in rubrica (${clients.length}): ${clients.slice(0, 30).map((c) => c.name).join(', ')}.`);
    if (financeContext) lines.push(`Finanza: ${financeContext}`);
    return lines.join('\n');
  }, [profile, tasks, projects, clients, financeContext]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    const history = [...msgs, { role: 'user' as const, content: q }];
    setMsgs(history);
    setInput('');
    setLoading(true);
    try {
      const transcript = history.slice(-8).map((m) => `${m.role === 'user' ? 'Utente' : 'Assistente'}: ${m.content}`).join('\n');
      const text = await callAi({
        prompt: `${transcript}\nAssistente:`,
        system:
          "Sei l'assistente AI dello studio Aulico. Aiuti il team con: consigli organizzativi, domande sui dati dello studio (forniti qui sotto) e spiegazioni su come funziona l'app (guida qui sotto). Usa SOLO i dati forniti; se un'informazione non c'è, dillo chiaramente e non inventare. Rispondi in italiano, conciso e pratico.\n\n" +
          APP_GUIDE + '\n\nDATI A CUI HAI ACCESSO:\n' + dataSnapshot,
        maxTokens: 600,
      });
      setMsgs((m) => [...m, { role: 'assistant', content: text || 'Non ho una risposta.' }]);
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: '⚠️ AI non disponibile. Verifica la configurazione del Worker (GROQ_KEY).' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Assistente Aulico"
          className="fixed bottom-5 right-5 z-[150] w-12 h-12 rounded-full bg-[#1b1b1b] hover:bg-black text-white shadow-lg flex items-center justify-center cursor-pointer border-none active:scale-95 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[150] w-[min(94vw,400px)] h-[min(80vh,560px)] bg-white border border-[#e2e2e2] rounded-[20px] shadow-2xl flex flex-col animate-[popIn_0.2s_ease_both]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ececec] shrink-0">
            <b className="text-[14px] inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#b45309]" /> Assistente Aulico</b>
            <div className="flex items-center gap-1">
              {msgs.length > 0 && <button onClick={() => setMsgs([])} className="text-[11px] font-bold text-stone-400 hover:text-[#161616] bg-transparent border-none cursor-pointer px-1">Pulisci</button>}
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {msgs.length === 0 && (
              <div className="text-[12.5px] text-[#8a8a8a] leading-relaxed">
                Ciao {(/** primo nome */ profile.name || '').split(' ')[0]}! Chiedimi un consiglio sui tuoi impegni, informazioni sui progetti/clienti, oppure "come funziona…" una parte dell'app.
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {['Cosa faccio oggi?', 'Quali task sono in ritardo?', 'Come funziona il Cantiere?'].map((s) => (
                    <button key={s} onClick={() => setInput(s)} className="text-[11.5px] font-bold px-2.5 py-1 rounded-full border border-[#e2e2e2] bg-white hover:bg-[#fafafa] cursor-pointer">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[88%] text-[13px] leading-relaxed px-3 py-2 rounded-2xl whitespace-pre-wrap ${m.role === 'user' ? 'self-end bg-[#1b1b1b] text-white rounded-br-sm' : 'self-start bg-[#f3f3f1] text-[#222] rounded-bl-sm'}`}>{m.content}</div>
            ))}
            {loading && <div className="self-start bg-[#f3f3f1] text-stone-500 px-3 py-2 rounded-2xl rounded-bl-sm inline-flex items-center gap-2 text-[13px]"><Loader2 className="w-4 h-4 animate-spin" /> sto pensando…</div>}
          </div>

          <div className="flex gap-2 items-end p-3 border-t border-[#ececec] shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Scrivi un messaggio…"
              className="flex-1 max-h-[90px] border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px] resize-none outline-none focus:border-[#161616]"
            />
            <button onClick={send} disabled={loading || !input.trim()} className="h-[38px] w-[38px] rounded-xl bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center border-none cursor-pointer disabled:opacity-40 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
