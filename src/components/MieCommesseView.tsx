/**
 * MieCommesseView — Materico → "Le mie commesse" (doc Materico: i responsabili di produzione,
 * edile e impianti, hanno una dashboard operativa che mostra SOLO le proprie attività).
 * Raccoglie: commesse (Potenziale Cantiere) di cui sono responsabili, i loro cantieri con
 * avanzamento, contratti in ritardo, attività aperte (agenda + fascicoli). Nessun nodo nuovo.
 */
import React from 'react';
import { motion } from 'motion/react';
import { HardHat, ListChecks, AlertTriangle, User, CalendarClock } from 'lucide-react';
import type { Cantiere, MatericoContract, MatericoDeal, Project, Task } from '../types';
import { penaleMaturata } from './MatericoContractsView';
import { eur } from '../utils';

interface Props {
  myUid: string;
  isBoss: boolean;
  team: { uid: string; name: string }[];
  deals: MatericoDeal[];
  cantieri: Cantiere[];
  contracts: MatericoContract[];
  projects: Project[];
  tasks: Task[];
  onToggleTask: (id: string, date: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const DISC: Record<string, string> = { edile: 'Edile', impianti: 'Impianti', misto: 'Misto' };

export const MieCommesseView: React.FC<Props> = (p) => {
  const [who, setWho] = React.useState(p.myUid);
  const mineDeals = p.deals.filter((d) => d.responsabileUid === who && d.stage !== 'persa');
  const dealCant = new Set(mineDeals.map((d) => d.cantiereId).filter(Boolean) as string[]);
  const dealProj = new Set(mineDeals.map((d) => d.projectId).filter(Boolean) as string[]);
  const myCantieri = p.cantieri.filter((c) => c.division === 'materico' && (dealCant.has(c.id) || dealProj.has(c.projectId)) && c.status !== 'concluso');
  const late = p.contracts.map((c) => ({ c, pm: penaleMaturata(c, c.cantiereId ? p.cantieri.find((x) => x.id === c.cantiereId) : null) }))
    .filter((x) => x.pm && (!x.c.cantiereId || myCantieri.some((m) => m.id === x.c.cantiereId)));

  // Attività aperte: agenda (Materico o pratiche Materico) + attività dei fascicoli assegnate
  const matProj = new Set(p.projects.filter((x) => x.division === 'materico').map((x) => x.id));
  const agenda = p.tasks.filter((t) => !t.done && t.frequency === 'once' && (t.assignee === who || (t.assignees || []).includes(who)) && (t.societa === 'materico' || (t.projectId && matProj.has(t.projectId))));
  const fasc: { id: string; title: string; due?: string | null; proj: string }[] = [];
  p.projects.filter((x) => x.division === 'materico' && !x.archived).forEach((pr) =>
    Object.entries(pr.phases || {}).forEach(([ph, phase]: [string, any]) =>
      Object.entries(phase.tasks || {}).forEach(([t, task]: [string, any]) => {
        if (!task.done && task.assignee === who) fasc.push({ id: `p::${pr.id}::${ph}::${t}`, title: task.title, due: task.due, proj: pr.name });
      })));
  const todo = [
    ...agenda.map((t) => ({ id: t.id, title: t.title, due: t.date, proj: p.projects.find((x) => x.id === t.projectId)?.name || '' })),
    ...fasc,
  ].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));

  const card = 'bg-white border border-[#e2e2e2] rounded-[22px] p-4';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[20px] font-black text-[#161616]">Le mie commesse</h2>
          <p className="text-[12.5px] text-[#6b6b6b] font-semibold">Solo quello di cui sei responsabile: commesse, cantieri, ritardi e attività da fare.</p>
        </div>
        {p.isBoss && (
          <label className="inline-flex items-center gap-2 text-[12px] font-bold text-[#555]"><User className="w-4 h-4" />
            <select value={who} onChange={(e) => setWho(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[13px]">
              {p.team.map((t) => <option key={t.uid} value={t.uid}>{t.name}{t.uid === p.myUid ? ' (io)' : ''}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Commesse', v: mineDeals.length },
          { l: 'Cantieri aperti', v: myCantieri.length },
          { l: 'In ritardo', v: late.length },
          { l: 'Attività da fare', v: todo.length },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={card}>
            <div className="text-[22px] font-black text-[#161616]">{k.v}</div>
            <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#767676]">{k.l}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#767676] mb-3 flex items-center gap-1.5"><HardHat className="w-4 h-4" /> Cantieri</p>
          {myCantieri.length === 0 ? <p className="text-[12.5px] text-[#767676]">Nessun cantiere aperto. Nasce da solo quando un contratto con l'impresa viene firmato.</p> : (
            <div className="flex flex-col gap-2.5">
              {myCantieri.map((c) => {
                const d = mineDeals.find((x) => x.cantiereId === c.id || x.projectId === c.projectId);
                const pct = c.progressPct || 0;
                return (
                  <a key={c.id} href={`#progetto/${c.projectId}`} className="block p-3 rounded-xl border border-[#efefef] hover:border-[#cfcfcf] no-underline">
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-[13.5px] text-[#161616] truncate">{c.name}</b>
                      {d?.discipline && <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-full bg-[#f1f1f1] text-[#555]">{DISC[d.discipline]}</span>}
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f0f0ee] mt-2 overflow-hidden"><motion.div className="h-full bg-[#161616]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} /></div>
                    <p className="text-[12px] text-[#767676] font-semibold mt-1">{pct}%{c.dueDate ? ` · fine prevista ${new Date(c.dueDate + 'T00:00').toLocaleDateString('it-IT')}` : ''}</p>
                  </a>
                );
              })}
            </div>
          )}
          {late.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {late.map(({ c, pm }) => (
                <div key={c.id} className="flex items-center gap-2 text-[12px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {c.partnerName}: {pm!.giorni} gg di ritardo{pm!.importo ? ` · penale ${eur(pm!.importo)}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#767676] mb-3 flex items-center gap-1.5"><ListChecks className="w-4 h-4" /> Da fare</p>
          {todo.length === 0 ? <p className="text-[12.5px] text-[#767676]">Tutto fatto.</p> : (
            <div className="flex flex-col gap-1.5">
              {todo.slice(0, 30).map((t) => {
                const overdue = t.due && t.due < today();
                return (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#f0f0f0]">
                    {who === p.myUid && <button onClick={() => p.onToggleTask(t.id, t.due || today())} className="w-5 h-5 rounded-md border-2 border-[#8a8a8a] bg-white cursor-pointer shrink-0" aria-label="Fatto" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#161616] truncate">{t.title}</p>
                      {t.proj && <p className="text-[12px] text-[#767676] truncate">{t.proj}</p>}
                    </div>
                    {t.due && <span className={`text-[12px] font-bold inline-flex items-center gap-1 ${overdue ? 'text-rose-600' : 'text-[#6b6b6b]'}`}><CalendarClock className="w-3.5 h-3.5" />{new Date(t.due + 'T00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {mineDeals.length > 0 && (
        <div className={card}>
          <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#767676] mb-3">Commesse</p>
          <div className="flex flex-wrap gap-2">
            {mineDeals.map((d) => <span key={d.id} className="px-3 py-1.5 rounded-xl bg-[#f5f5f3] text-[12.5px] font-bold text-[#161616]">{d.title} <span className="text-[#767676] font-semibold">· {d.stage}</span></span>)}
          </div>
        </div>
      )}
    </div>
  );
};
