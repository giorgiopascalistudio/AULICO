/**
 * AbilitativaView — ONIRICO · Produzione → "Fase abilitativa".
 * Lavagna a colpo d'occhio (dal foglio a mano dello studio): righe = documenti di
 * chiusura/abilitativi, colonne = pratiche Onirico attive. Ogni cella dice solo
 * SE è stato fatto e A CHI è assegnato. Nodo `abilitativa/<pid>/<voceId>`.
 * Assegnando una cella nasce un'attività in agenda (`tasks/abil-<pid>-<voce>`):
 * se la si spunta in agenda, la cella risulta fatta.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Check, Clock, Minus, Circle, User, Filter } from 'lucide-react';
import { Modal } from './Modal';
import type { Project, Task } from '../types';
import { ABIL_VOCI, abilVoceLabel, type AbilStato, type AbilCell, type AbilMap } from '../abilitativa';


const STATI: { id: AbilStato; label: string; icon: React.ElementType; cls: string }[] = [
  { id: 'da_fare', label: 'Da fare', icon: Circle, cls: 'bg-white text-[#9a9a9a] border-[#e2e2e2]' },
  { id: 'in_corso', label: 'In corso', icon: Clock, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'fatto', label: 'Fatto', icon: Check, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'non_serve', label: 'Non serve', icon: Minus, cls: 'text-[#b0b0b0] border-[#ececec]' },
];
const statoMeta = (s: AbilStato) => STATI.find((x) => x.id === s) || STATI[0];
// Tratteggio come sul foglio a mano per "non serve".
const HATCH: React.CSSProperties = { backgroundImage: 'repeating-linear-gradient(135deg, #f3f3f1 0 4px, #fafaf9 4px 8px)' };

const initials = (name?: string | null) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

interface Props {
  projects: Project[];
  cells: AbilMap;
  tasks: Record<string, Task>;
  team: { uid: string; name: string }[];
  myUid: string;
  canEdit: boolean;
  onSave: (pid: string, voceId: string, cell: AbilCell | null) => void;
}

export const AbilitativaView: React.FC<Props> = ({ projects, cells, tasks, team, myUid, canEdit, onSave }) => {
  const [onlyMine, setOnlyMine] = React.useState(false);
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<{ pid: string; voce: string } | null>(null);
  const nameOf = (uid?: string | null) => team.find((t) => t.uid === uid)?.name || null;

  // Stato effettivo: se l'attività collegata è stata spuntata in agenda conta come fatta.
  const cellOf = (pid: string, voce: string): AbilCell => {
    const c = cells[pid]?.[voce] || { stato: 'da_fare' as AbilStato };
    if (c.taskId && tasks[c.taskId]?.done && c.stato !== 'non_serve') return { ...c, stato: 'fatto' };
    return c;
  };

  const cols = React.useMemo(
    () => [...projects].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [projects]
  );
  const visibleCols = cols.filter((p) => {
    if (!onlyMine && !onlyOpen) return true;
    return ABIL_VOCI.some((v) => {
      const c = cellOf(p.id, v.id);
      if (onlyMine && c.assignee !== myUid) return false;
      if (onlyOpen && (c.stato === 'fatto' || c.stato === 'non_serve')) return false;
      return true;
    });
  });

  // KPI: tutte le celle che servono (escluso "non serve").
  let tot = 0, fatte = 0, inCorso = 0, senzaNome = 0;
  cols.forEach((p) => ABIL_VOCI.forEach((v) => {
    const c = cellOf(p.id, v.id);
    if (c.stato === 'non_serve') return;
    tot++;
    if (c.stato === 'fatto') fatte++;
    else { if (c.stato === 'in_corso') inCorso++; if (!c.assignee) senzaNome++; }
  }));
  const colPct = (pid: string) => {
    let n = 0, d = 0;
    ABIL_VOCI.forEach((v) => { const c = cellOf(pid, v.id); if (c.stato === 'non_serve') return; n++; if (c.stato === 'fatto') d++; });
    return n ? Math.round((d / n) * 100) : 100;
  };

  const kpis = [
    { label: 'Voci da chiudere', value: tot - fatte },
    { label: 'In corso', value: inCorso },
    { label: 'Senza assegnatario', value: senzaNome },
    { label: 'Completate', value: tot ? `${Math.round((fatte / tot) * 100)}%` : '—' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f5f5f3] flex items-center justify-center text-[#161616]"><ClipboardCheck className="w-5 h-5" /></div>
          <div>
            <h2 className="text-[20px] font-black text-[#161616] leading-tight">Fase abilitativa</h2>
            <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Per ogni pratica: cosa è fatto e a chi è assegnato. Clicca una casella per aggiornarla.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Toggle on={onlyOpen} onClick={() => setOnlyOpen((v) => !v)} icon={Filter} label="Solo da chiudere" />
          <Toggle on={onlyMine} onClick={() => setOnlyMine((v) => !v)} icon={User} label="Assegnate a me" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white border border-[#e2e2e2] rounded-[22px] px-4 py-3">
            <div className="text-[22px] font-black text-[#161616]">{k.value}</div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-[11.5px] font-bold text-[#8a8a8a]">
        {STATI.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-md border inline-flex items-center justify-center ${s.cls}`} style={s.id === 'non_serve' ? HATCH : undefined}><s.icon className="w-3 h-3" /></span>
            {s.label}
          </span>
        ))}
      </div>

      {cols.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center text-[13px] text-[#9a9a9a]">Nessuna pratica Onirico attiva.</div>
      ) : (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] overflow-x-auto">
          <table className="border-separate border-spacing-0 min-w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white text-left px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] border-b border-[#efefef] min-w-[190px]">Documento</th>
                <AnimatePresence initial={false}>
                  {visibleCols.map((p) => {
                    const pct = colPct(p.id);
                    return (
                      <motion.th key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="px-2 py-3 border-b border-[#efefef] align-bottom min-w-[104px]">
                        <a href={`#progetto/${p.id}`} className="block text-[12px] font-black text-[#161616] hover:underline truncate max-w-[120px] mx-auto" title={p.name}>{p.name}</a>
                        <div className="h-1 rounded-full bg-[#f0f0ee] mt-2 overflow-hidden">
                          <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                        </div>
                        <div className="text-[10px] font-bold text-[#b0b0b0] mt-1">{pct}%</div>
                      </motion.th>
                    );
                  })}
                </AnimatePresence>
              </tr>
            </thead>
            <tbody>
              {ABIL_VOCI.map((v, ri) => (
                <tr key={v.id}>
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 text-[13px] font-bold text-[#161616] border-b border-[#f4f4f2] whitespace-nowrap">{v.label}</td>
                  {visibleCols.map((p, ci) => {
                    const c = cellOf(p.id, v.id);
                    const m = statoMeta(c.stato);
                    const who = nameOf(c.assignee);
                    const late = c.due && c.stato !== 'fatto' && c.stato !== 'non_serve' && c.due < new Date().toISOString().slice(0, 10);
                    return (
                      <td key={p.id} className="px-1.5 py-1.5 border-b border-[#f4f4f2] text-center">
                        <motion.button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setEdit({ pid: p.id, voce: v.id })}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(0.4, ri * 0.02 + ci * 0.015) }}
                          whileHover={canEdit ? { scale: 1.05 } : undefined}
                          whileTap={canEdit ? { scale: 0.95 } : undefined}
                          title={`${v.label} · ${p.name}: ${m.label}${who ? ' · ' + who : ''}${c.due ? ' · entro ' + c.due : ''}`}
                          className={`relative w-full min-w-[88px] h-11 rounded-xl border inline-flex items-center justify-center gap-1.5 text-[11px] font-extrabold ${m.cls} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                          style={c.stato === 'non_serve' ? HATCH : undefined}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span key={c.stato} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                              className="inline-flex"><m.icon className="w-3.5 h-3.5" /></motion.span>
                          </AnimatePresence>
                          {c.stato !== 'non_serve' && (who
                            ? <span className="w-6 h-6 rounded-full bg-[#161616] text-white text-[9.5px] font-black inline-flex items-center justify-center" title={who}>{initials(who)}</span>
                            : c.stato !== 'fatto' && <span className="text-[10px] font-bold text-[#c0c0c0]">—</span>)}
                          {late && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" title="Scaduta" />}
                        </motion.button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <CellEditor
          key={`${edit.pid}-${edit.voce}`}
          title={abilVoceLabel(edit.voce)}
          subtitle={cols.find((p) => p.id === edit.pid)?.name || ''}
          cell={cellOf(edit.pid, edit.voce)}
          team={team}
          onClose={() => setEdit(null)}
          onSave={(c) => { onSave(edit.pid, edit.voce, c); setEdit(null); }}
        />
      )}
    </div>
  );
};

const Toggle: React.FC<{ on: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({ on, onClick, icon: Icon, label }) => (
  <button type="button" onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-colors ${on ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#555] border-[#e2e2e2] hover:bg-[#f5f5f3]'}`}>
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

const CellEditor: React.FC<{
  title: string; subtitle: string; cell: AbilCell; team: { uid: string; name: string }[];
  onClose: () => void; onSave: (c: AbilCell | null) => void;
}> = ({ title, subtitle, cell, team, onClose, onSave }) => {
  const [stato, setStato] = React.useState<AbilStato>(cell.stato);
  const [assignee, setAssignee] = React.useState<string>(cell.assignee || '');
  const [due, setDue] = React.useState<string>(cell.due || '');
  const [note, setNote] = React.useState<string>(cell.note || '');
  return (
    <Modal isOpen title={title} subtitle={subtitle} onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <button type="button" onClick={() => onSave(null)} className="text-[12px] font-bold text-[#9a9a9a] hover:text-[#161616] bg-transparent border-none cursor-pointer">Azzera casella</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-[13px] cursor-pointer bg-gray-100 hover:bg-gray-200 border-none text-[#161616] font-bold">Annulla</button>
            <button type="button" onClick={() => onSave({ ...cell, stato, assignee: stato === 'non_serve' ? null : (assignee || null), due: due || null, note: note.trim() || null })}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-[13px] cursor-pointer bg-[#161616] hover:bg-black border-none text-white font-bold">Salva</button>
          </div>
        </div>
      }>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Stato</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATI.map((s) => (
              <motion.button key={s.id} type="button" whileTap={{ scale: 0.95 }} onClick={() => setStato(s.id)}
                className={`h-14 rounded-xl border-2 inline-flex flex-col items-center justify-center gap-1 text-[12px] font-extrabold cursor-pointer ${s.cls} ${stato === s.id ? '!border-[#161616]' : ''}`}
                style={s.id === 'non_serve' ? HATCH : undefined}>
                <s.icon className="w-4 h-4" /> {s.label}
              </motion.button>
            ))}
          </div>
        </div>
        {stato !== 'non_serve' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Assegnata a</span>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input">
                <option value="">— nessuno —</option>
                {team.map((t) => <option key={t.uid} value={t.uid}>{t.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Entro il <span className="normal-case font-bold">(facoltativo)</span></span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="input" />
            </label>
          </div>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Nota</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input" placeholder="Es. in attesa del tecnico, protocollo n…" />
        </label>
        {stato !== 'non_serve' && assignee && (
          <p className="text-[11.5px] text-[#9a9a9a] font-semibold">L'attività comparirà nell'agenda della persona assegnata; quando la spunta lì, qui risulterà fatta.</p>
        )}
      </div>
    </Modal>
  );
};
