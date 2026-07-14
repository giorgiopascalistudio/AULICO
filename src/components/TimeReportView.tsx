/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Report & Tempi — due schede:
 * 1) TEMPI & ATTIVITÀ — cruscotto AUTOMATICO (nessuna compilazione manuale):
 *    tempo medio per tipo attività, distribuzione ore per collaboratore, storico
 *    rilevazioni, liste attività dei collaboratori (base delle riunioni). Ogni dato
 *    è calcolato dai `tasks` e dai `timeEntries` già presenti.
 * 2) REPORT DI PROFILO (`ProfileReport`) — il report settimanale/mensile della singola
 *    persona nel formato del modello: attività svolte + conclusione, da stampare.
 */
import React from 'react';
import { Clock, BarChart3, Users, Printer, ChevronDown, Play, Timer, ListChecks, FileText } from 'lucide-react';
import type {
  Appointment, EditorialPost, ProfileReport as TProfileReport, SocMktItem, Task, TimeEntry, UserProfile,
} from '../types';
import { initials } from '../utils';
import { aggregate, fmtDuration } from '../timetracking';
import { ProfileReport } from './ProfileReport';

interface Props {
  tasks: Task[];
  timeEntries: TimeEntry[];
  members: UserProfile[];
  color?: string;
  onEditTask?: (id: string) => void;
  onNewTask?: () => void;
  // --- Report di profilo ---
  me?: { uid: string; name?: string | null };
  isBoss?: boolean;
  appointments?: Appointment[];
  posts?: EditorialPost[];
  extras?: SocMktItem[];
  accounts?: { id: string; name: string }[];
  profileReports?: Record<string, Record<string, TProfileReport>>;
  onSaveProfileReport?: (r: TProfileReport) => void;
}

type Range = 'week' | 'month' | 'all';

const rangeStartMs = (r: Range): number => {
  if (r === 'all') return 0;
  const d = new Date();
  if (r === 'week') { const off = (d.getDay() + 6) % 7; d.setDate(d.getDate() - off); } else { d.setDate(1); }
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const fmtWhen = (ms?: number | null) => (ms ? new Date(ms).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

/** Interruttore tra le due schede della sezione. */
const TabSwitch: React.FC<{ tab: 'tempi' | 'profilo'; onTab: (t: 'tempi' | 'profilo') => void }> = ({ tab, onTab }) => (
  <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] no-print">
    {([['tempi', 'Tempi & attività'], ['profilo', 'Report di profilo']] as const).map(([id, label]) => (
      <button key={id} onClick={() => onTab(id)} className={`text-[11.5px] font-bold px-3 py-1 rounded-full cursor-pointer border-none whitespace-nowrap ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>
        {label}
      </button>
    ))}
  </div>
);

export const TimeReportView: React.FC<Props> = ({
  tasks, timeEntries, members, color = '#161616', onEditTask, onNewTask,
  me, isBoss = false, appointments = [], posts = [], extras = [], accounts = [], profileReports = {}, onSaveProfileReport,
}) => {
  const [tab, setTab] = React.useState<'tempi' | 'profilo'>('tempi');
  const [range, setRange] = React.useState<Range>('week');
  const [openUid, setOpenUid] = React.useState<string | null>(null);
  const fromMs = rangeStartMs(range);
  const todayIso = new Date().toISOString().slice(0, 10);

  const agg = React.useMemo(() => aggregate(timeEntries, fromMs || undefined), [timeEntries, fromMs]);
  const tipoRows = React.useMemo(
    () => Object.entries(agg.byTipo).sort((a, b) => b[1].minutes - a[1].minutes),
    [agg]
  );
  const whoRows = React.useMemo(
    () => Object.entries(agg.byWho).sort((a, b) => b[1].minutes - a[1].minutes),
    [agg]
  );
  const maxWhoMin = whoRows.reduce((m, [, v]) => Math.max(m, v.minutes), 0) || 1;

  const completedInRange = tasks.filter((t) => t.done && (t.updatedAt || 0) >= fromMs).length;
  const activeCollabs = whoRows.length;

  const nameByUid = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;

  const tasksFor = (uid: string) => {
    const mine = tasks.filter((t) => t.assignee === uid || (t.assignees || []).includes(uid));
    const open = mine.filter((t) => !t.done);
    return {
      urgenti: open.filter((t) => t.priority === 'urgente'),
      scaduti: open.filter((t) => t.date && t.date < todayIso),
      aperti: open,
      completati: mine.filter((t) => t.done && (t.updatedAt || 0) >= fromMs),
    };
  };

  const recent = React.useMemo(
    () => timeEntries.filter((e) => e.end != null && (e.minutes ?? 0) > 0).sort((a, b) => (b.end || 0) - (a.end || 0)).slice(0, 40),
    [timeEntries]
  );

  const rangeLabel = range === 'week' ? 'questa settimana' : range === 'month' ? 'questo mese' : 'sempre';

  // Scheda "Report di profilo": vive qui perché ha già collaboratori, attività e cronometri.
  if (tab === 'profilo' && me) {
    return (
      <div className="flex flex-col gap-5 text-left">
        <div className="flex items-center justify-between gap-3 flex-wrap no-print">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#161616] flex items-center gap-2">
              <FileText className="w-5 h-5" /> Report di profilo
            </h2>
            <p className="text-[12.5px] text-[#8a8a8a] font-medium">Cosa ha fatto una persona nella settimana o nel mese: attività svolte + conclusione, da stampare.</p>
          </div>
          <TabSwitch tab={tab} onTab={setTab} />
        </div>
        <ProfileReport
          me={me}
          isBoss={isBoss}
          members={members}
          tasks={tasks}
          timeEntries={timeEntries}
          appointments={appointments}
          posts={posts}
          extras={extras}
          accounts={accounts}
          reports={profileReports}
          onSave={onSaveProfileReport}
          color={color}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left print-area">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#161616] flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Report & Tempi
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-medium">Report automatici dai cronometri e dalle attività — nessuna compilazione manuale.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {me && <TabSwitch tab={tab} onTab={setTab} />}
          <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            {(['week', 'month', 'all'] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`text-[11.5px] font-bold px-3 py-1 rounded-full cursor-pointer border-none ${range === r ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>
                {r === 'week' ? 'Settimana' : r === 'month' ? 'Mese' : 'Sempre'}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white hover:border-black cursor-pointer">
            <Printer className="w-4 h-4" /> Stampa
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: `Ore tracciate (${rangeLabel})`, value: fmtDuration(agg.totalMinutes) },
          { icon: ListChecks, label: 'Attività completate', value: String(completedInRange) },
          { icon: Timer, label: 'Rilevazioni', value: String(Object.values(agg.byTipo).reduce((s, v) => s + v.count, 0)) },
          { icon: Users, label: 'Collaboratori attivi', value: String(activeCollabs) },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4">
            <span className="w-9 h-9 rounded-xl bg-[#f5f5f3] flex items-center justify-center mb-2"><k.icon className="w-4.5 h-4.5 text-[#161616]" /></span>
            <div className="text-[22px] font-black text-[#161616] leading-none">{k.value}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a] mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tempo medio per tipo */}
        <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
          <h3 className="text-[14.5px] font-extrabold text-[#161616] mb-3 flex items-center gap-2"><Clock className="w-4.5 h-4.5" /> Tempo medio per tipo di attività</h3>
          {tipoRows.length === 0 ? (
            <p className="text-[12.5px] italic text-[#9a9a9a] py-4">Nessuna rilevazione nel periodo. Usa il cronometro (Avvia/Ferma) sulle attività dell'agenda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-wider text-[#9a9a9a] text-left border-b border-[#eee]">
                    <th className="py-2 font-bold">Tipo</th>
                    <th className="py-2 font-bold text-right">Media</th>
                    <th className="py-2 font-bold text-right">Rilevazioni</th>
                    <th className="py-2 font-bold text-right">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {tipoRows.map(([tipo, v]) => (
                    <tr key={tipo} className="border-b border-[#f4f4f4]">
                      <td className="py-2 font-semibold text-[#161616] capitalize">{tipo}</td>
                      <td className="py-2 text-right font-extrabold" style={{ color }}>{fmtDuration(v.avg)}</td>
                      <td className="py-2 text-right text-[#6b6b6b]">{v.count}</td>
                      <td className="py-2 text-right text-[#6b6b6b]">{fmtDuration(v.minutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Distribuzione ore per collaboratore */}
        <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
          <h3 className="text-[14.5px] font-extrabold text-[#161616] mb-3 flex items-center gap-2"><Users className="w-4.5 h-4.5" /> Distribuzione ore per collaboratore</h3>
          {whoRows.length === 0 ? (
            <p className="text-[12.5px] italic text-[#9a9a9a] py-4">Nessuna ora tracciata nel periodo.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {whoRows.map(([uid, v]) => (
                <div key={uid}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="font-bold text-[#161616] truncate">{v.name || nameByUid(uid)}</span>
                    <span className="font-extrabold text-[#161616] tabular-nums">{fmtDuration(v.minutes)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, (v.minutes / maxWhoMin) * 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LISTE ATTIVITÀ DEI COLLABORATORI */}
      <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-[14.5px] font-extrabold text-[#161616] flex items-center gap-2"><ListChecks className="w-4.5 h-4.5" /> Liste attività dei collaboratori</h3>
          {onNewTask && (
            <button onClick={onNewTask} className="no-print text-[12px] font-bold px-3 py-2 rounded-xl text-white cursor-pointer border-none" style={{ backgroundColor: '#1b1b1b' }}>
              + Assegna attività
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-[#9a9a9a] mb-3 no-print">La base delle riunioni: apri la lista di ciascuno, controlla lo stato e riassegna con un tap.</p>
        <div className="flex flex-col gap-2">
          {members.map((u) => {
            const s = tasksFor(u.uid);
            const isOpen = openUid === u.uid;
            const trackedMin = agg.byWho[u.uid]?.minutes || 0;
            return (
              <div key={u.uid} className="border border-[#eee] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenUid(isOpen ? null : u.uid)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-3 bg-[#fafafa] hover:bg-[#f5f5f3] cursor-pointer border-none text-left"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#161616] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{initials(u.name)}</span>
                    <span className="min-w-0">
                      <b className="text-[13px] text-[#161616] block truncate">{u.name}</b>
                      <span className="text-[11px] text-[#9a9a9a]">{s.aperti.length} aperti · {trackedMin ? fmtDuration(trackedMin) + ' tracciate' : 'nessuna ora'}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {s.urgenti.length > 0 && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{s.urgenti.length} urg.</span>}
                    {s.scaduti.length > 0 && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{s.scaduti.length} scad.</span>}
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{s.completati.length} fatti</span>
                    <ChevronDown className={`w-4 h-4 text-[#9a9a9a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-3.5 py-3 flex flex-col gap-1.5">
                    {s.aperti.length === 0 ? (
                      <p className="text-[12px] italic text-[#9a9a9a] py-1">Nessuna attività aperta.</p>
                    ) : (
                      s.aperti
                        .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
                        .map((t) => {
                          const overdue = t.date && t.date < todayIso;
                          return (
                            <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#f0f0f0] hover:border-gray-300">
                              <span className="flex items-center gap-2 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'urgente' ? 'bg-rose-600' : t.priority === 'alta' ? 'bg-orange-500' : t.priority === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className="min-w-0">
                                  <b className="text-[12.5px] text-[#161616] block truncate">{t.title}</b>
                                  <span className="text-[10.5px] text-[#9a9a9a]">
                                    {t.tipo ? t.tipo + ' · ' : ''}{t.date ? <span className={overdue ? 'text-amber-600 font-bold' : ''}>{t.date}</span> : 'senza data'}
                                    {t.estMinutes ? ` · stima ${fmtDuration(t.estMinutes)}` : ''}{t.actualMinutes ? ` · reale ${fmtDuration(t.actualMinutes)}` : ''}
                                  </span>
                                </span>
                              </span>
                              {onEditTask && (
                                <button onClick={() => onEditTask(t.id)} className="no-print text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#e2e2e2] bg-white hover:border-black cursor-pointer shrink-0">
                                  Apri
                                </button>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Storico rilevazioni */}
      <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4">
        <h3 className="text-[14.5px] font-extrabold text-[#161616] mb-3 flex items-center gap-2"><Play className="w-4.5 h-4.5" /> Storico rilevazioni</h3>
        {recent.length === 0 ? (
          <p className="text-[12.5px] italic text-[#9a9a9a] py-2">Ancora nessuna rilevazione.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[520px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-wider text-[#9a9a9a] text-left border-b border-[#eee]">
                  <th className="py-2 font-bold">Quando</th>
                  <th className="py-2 font-bold">Chi</th>
                  <th className="py-2 font-bold">Tipo / Attività</th>
                  <th className="py-2 font-bold text-right">Durata</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id} className="border-b border-[#f4f4f4]">
                    <td className="py-2 text-[#6b6b6b] whitespace-nowrap">{fmtWhen(e.end)}</td>
                    <td className="py-2 font-semibold text-[#161616]">{e.whoName || nameByUid(e.whoUid)}</td>
                    <td className="py-2 text-[#161616] truncate max-w-[220px]"><span className="capitalize">{e.tipo}</span>{e.taskTitle && e.taskTitle !== e.tipo ? <span className="text-[#9a9a9a]"> · {e.taskTitle}</span> : null}</td>
                    <td className="py-2 text-right font-extrabold tabular-nums">{fmtDuration(e.minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
