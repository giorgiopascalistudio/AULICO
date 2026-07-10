/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Questionario iniziale cliente (brief). Riusato IDENTICO lato studio (fascicolo)
 * e lato cliente (portale). In sola lettura mostra le risposte; in modifica salva
 * su `projectBriefs/<pid>`. Le risposte alimentano moodboard/preventivi/presentazioni.
 */
import React from 'react';
import { ClipboardList, Check, Sparkles } from 'lucide-react';
import type { ProjectBrief } from '../types';
import { BRIEF_QUESTIONS, briefQuestionsByGroup, briefCompletion } from '../projectBrief';

interface Props {
  pid: string;
  brief?: ProjectBrief | null;
  canEdit?: boolean;
  color?: string;
  /** true = variante portale cliente (testi rivolti al cliente, bottone "Invia"). */
  clientMode?: boolean;
  onSave?: (brief: ProjectBrief) => void;
}

export const ProjectBriefForm: React.FC<Props> = ({ pid, brief, canEdit = true, color = '#161616', clientMode = false, onSave }) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>(brief?.answers || {});
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => { setAnswers(brief?.answers || {}); setDirty(false); }, [brief?.pid, brief?.updatedAt]);

  const groups = briefQuestionsByGroup();
  const comp = briefCompletion(answers);

  const set = (id: string, v: string) => { setAnswers((p) => ({ ...p, [id]: v })); setDirty(true); };

  const save = (asCompleted: boolean) => {
    if (!onSave) return;
    const budgetStr = answers['budget'];
    const next: ProjectBrief = {
      pid,
      answers,
      budget: budgetStr && !isNaN(Number(budgetStr)) ? Number(budgetStr) : null,
      updatedAt: Date.now(),
      completedByClient: asCompleted ? true : brief?.completedByClient || false,
      completedAt: asCompleted ? Date.now() : brief?.completedAt || null,
    };
    onSave(next);
    setDirty(false);
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> {clientMode ? 'Raccontaci il tuo progetto' : 'Questionario iniziale'}
          </h3>
          <p className="text-[12px] text-[#8a8a8a] font-medium">
            {clientMode
              ? 'Le tue risposte guidano stile, materiali, moodboard e preventivo. Puoi modificarle quando vuoi.'
              : 'Le risposte alimentano moodboard, preventivi e presentazioni. Compilabile anche dal cliente.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Completamento</div>
            <div className="text-[18px] font-black" style={{ color }}>{comp.pct}%</div>
          </div>
          <div className="w-12 h-12 rounded-full grid place-items-center" style={{ background: `conic-gradient(${color} ${comp.pct * 3.6}deg, #eee 0deg)` }}>
            <div className="w-9 h-9 rounded-full bg-white grid place-items-center text-[10px] font-bold text-[#6b6b6b]">{comp.done}/{comp.total}</div>
          </div>
        </div>
      </div>

      {brief?.completedByClient && (
        <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <Check className="w-4 h-4" /> Questionario inviato dal cliente{brief.completedAt ? ` il ${new Date(brief.completedAt).toLocaleDateString('it-IT')}` : ''}.
        </div>
      )}

      {BRIEF_QUESTIONS.length > 0 && Object.entries(groups).map(([group, qs]) => (
        <div key={group} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {group}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qs.map((q) => {
              const val = answers[q.id] || '';
              const full = q.type === 'textarea';
              return (
                <label key={q.id} className={`flex flex-col gap-1.5 ${full ? 'md:col-span-2' : ''}`}>
                  <span className="text-[12px] font-bold text-[#333]">{q.label}</span>
                  {!canEdit ? (
                    <div className="min-h-10 px-3 py-2 rounded-xl bg-[#faf9f7] border border-[#eee] text-[13.5px] text-[#161616] whitespace-pre-wrap">
                      {val || <span className="italic text-[#b0b0b0]">—</span>}
                    </div>
                  ) : q.type === 'select' ? (
                    <select value={val} onChange={(e) => set(q.id, e.target.value)} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px] bg-white">
                      <option value="">— scegli —</option>
                      {(q.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : q.type === 'textarea' ? (
                    <textarea value={val} onChange={(e) => set(q.id, e.target.value)} rows={2} placeholder={q.placeholder} className="input border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" />
                  ) : (
                    <input type={q.type === 'number' ? 'number' : 'text'} value={val} onChange={(e) => set(q.id, e.target.value)} placeholder={q.placeholder} className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {canEdit && onSave && (
        <div className="flex items-center gap-2 justify-end">
          {dirty && <span className="text-[11.5px] text-amber-600 font-semibold mr-auto">Modifiche non salvate</span>}
          <button onClick={() => save(false)} className="text-[13px] font-bold px-4 py-2.5 rounded-xl border border-[#e2e2e2] bg-white hover:border-black cursor-pointer">
            Salva
          </button>
          {clientMode && (
            <button onClick={() => save(true)} className="text-[13px] font-bold px-4 py-2.5 rounded-xl text-white cursor-pointer border-none" style={{ backgroundColor: '#1b1b1b' }}>
              Invia allo studio
            </button>
          )}
        </div>
      )}
    </div>
  );
};
