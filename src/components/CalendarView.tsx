/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Sparkles, Edit2, Check, X, UserPlus, CalendarPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Task, Appointment, TeamLeave } from '../types';
import { fmtMonthYear, fmtDayLong, DOW, addDays, startOfMonth, startOfWeek, isoDate, relDay, sameDay, parseISO } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  appointments: Appointment[];
  calView: 'month' | 'week' | 'day';
  calDate: Date;
  onSetCalView: (view: 'month' | 'week' | 'day') => void;
  onSetCalDate: (date: Date) => void;
  onToggleTask: (taskId: string, date: string) => void;
  onEditTask: (taskId: string) => void;
  onNewTask: (presetDate?: string) => void;
  onNewAppointment: (presetDate?: string) => void;
  onConfirmAppointment: (id: string) => void;
  onDeclineAppointment: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  myUid: string;
  myName?: string;
  teamLeave?: TeamLeave[];
  onSaveLeave?: (leave: TeamLeave) => void;
  onDeleteLeave?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  projects,
  appointments,
  calView,
  calDate,
  onSetCalView,
  onSetCalDate,
  onToggleTask,
  onEditTask,
  onNewTask,
  onNewAppointment,
  onConfirmAppointment,
  onDeclineAppointment,
  onDeleteAppointment,
  myUid,
  myName,
  teamLeave = [],
  onSaveLeave,
  onDeleteLeave
}) => {
  const todayISO = isoDate(new Date());

  const apptsOn = (iso: string): Appointment[] =>
    (appointments || []).filter(a => a.date === iso).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

  const occursOn = (t: Task, iso: string): boolean => {
    if (!t.date || iso < t.date) return false;
    const f = t.frequency || 'once';
    if (f === 'once') return iso === t.date;
    if (f === 'daily') return true;
    const a = parseISO(t.date);
    const d = parseISO(iso);
    if (isNaN(a.getTime()) || isNaN(d.getTime())) return false;
    const diff = Math.round((d.getTime() - a.getTime()) / 86400000);
    if (f === 'weekly') return diff % 7 === 0;
    if (f === 'monthly') {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(a.getDate(), lastDay);
    }
    return false;
  };

  const taskDoneOn = (t: Task, iso: string): boolean => {
    const f = t.frequency || 'once';
    if (f === 'once') return !!t.done;
    return !!(t.completions && t.completions[iso]);
  };

  const projTasksOn = (iso: string): Task[] => {
    const out: Task[] = [];
    projects.forEach(p => {
      Object.keys(p.phases || {}).forEach(phId => {
        const ph = p.phases[phId];
        Object.keys(ph.tasks || {}).forEach(tId => {
          const t = ph.tasks[tId];
          if (t.assignee === myUid && t.due === iso) {
            out.push({
              id: `p::${p.id}::${phId}::${tId}`,
              title: t.title,
              date: t.due,
              frequency: 'once',
              priority: 'media',
              assignee: t.assignee,
              projectId: p.id,
              done: !!t.done,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              createdBy: p.manager || '',
              _proj: true
            });
          }
        });
      });
    });
    return out;
  };

  const tasksOnDate = (iso: string): Task[] => {
    const std = tasks.filter(t => occursOn(t, iso) && (t.assignee === myUid || (t.assignees || []).includes(myUid) || t.owner === myUid || (!t.assignee && !(t.assignees || []).length && t.createdBy === myUid)));
    const prj = projTasksOn(iso);
    return [...std, ...prj].sort((a, b) => {
      const timeCompare = (a.time || '99:99').localeCompare(b.time || '99:99');
      if (timeCompare !== 0) return timeCompare;
      const prioVal = (p: string) => (p === 'urgente' ? 0 : p === 'alta' ? 1 : p === 'media' ? 2 : 3);
      return prioVal(a.priority) - prioVal(b.priority);
    });
  };

  const handlePrev = () => {
    const d = new Date(calDate);
    if (calView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (calView === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    onSetCalDate(d);
  };

  const handleNext = () => {
    const d = new Date(calDate);
    if (calView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (calView === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    onSetCalDate(d);
  };

  const handleToday = () => {
    onSetCalDate(new Date());
  };

  const calHeadLabel = () => {
    if (calView === 'month') return fmtMonthYear(calDate);
    if (calView === 'week') {
      const s = startOfWeek(calDate);
      const e = addDays(s, 6);
      const df = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
      const dfYear = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${df.format(s)} – ${dfYear.format(e)}`;
    }
    return fmtDayLong(calDate);
  };

  // RENDER MONTH VIEW
  const renderMonth = () => {
    const first = startOfMonth(calDate);
    const gridStart = startOfWeek(first);
    const cells = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));

    return (
      <div className="bg-white border border-[#e2e2e2] rounded-[26px] overflow-hidden shadow-xs text-left">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-[#ececec] bg-[#fbfbfb]">
          {DOW.map(day => (
            <div key={day} className="p-3.5 text-[11px] font-bold text-[#8a8a8a] tracking-widest uppercase text-center border-r border-[#f5f5f5] last:border-r-0">
              {day}
            </div>
          ))}
        </div>        {/* Days grid */}
        <div className="grid grid-cols-7 grid-rows-6 auto-rows-[minmax(52px,1fr)] md:auto-rows-[minmax(82px,1fr)] bg-gray-200 gap-[1px]">
          {cells.map((c, i) => {
            const iso = isoDate(c);
            const inMonth = c.getMonth() === calDate.getMonth();
            const list = tasksOnDate(iso);
            const aps = apptsOn(iso);
            const apsPending = aps.some(a => a.status === 'pending');
            const isToday = iso === todayISO;

            return (
              <div
                key={i}
                onClick={() => {
                  onSetCalDate(c);
                  onSetCalView('day');
                }}
                className={`bg-white p-1 min-h-[52px] md:min-h-[82px] transition-all duration-200 cursor-pointer flex flex-col justify-start hover:bg-slate-50/50 relative group ${
                  !inMonth ? 'bg-gray-50/30 text-gray-400 opacity-60' : ''
                } ${isToday ? 'bg-orange-50/15' : ''}`}
              >
                {/* Day Header Row */}
                <div className="flex justify-between items-center w-full mb-0.5 p-0.5">
                  <span
                    className={`inline-flex items-center justify-center font-bold text-[10px] md:text-[11px] min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] rounded-full transition-all ${
                      isToday 
                        ? 'bg-orange-650 text-white shadow-xs' 
                        : !inMonth 
                        ? 'text-gray-400/70 hover:bg-gray-100' 
                        : 'text-gray-700 group-hover:bg-gray-100'
                    }`}
                  >
                    {c.getDate()}
                  </span>

                  {isToday && (
                    <span className="relative flex h-1.5 w-1.5 mr-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-450 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                    </span>
                  )}
                  {!isToday && aps.length > 0 && (
                    <span
                      title={`${aps.length} appuntamenti`}
                      className={`inline-flex items-center justify-center text-[8px] font-extrabold min-w-[14px] h-[14px] px-0.5 rounded-full ${apsPending ? 'bg-gray-400 text-white' : 'bg-emerald-500 text-white'}`}
                    >
                      {aps.length}
                    </span>
                  )}
                </div>

                {/* Desktop: Event lists rendered as horizontal Google Calendar-style strips */}
                <div className="hidden md:flex flex-col gap-0.5 w-full overflow-hidden mt-0.5">
                  {list.slice(0, 2).map(t => {
                    const done = taskDoneOn(t, iso);
                    const isProj = !!t._proj;

                    const bgStyle = done
                      ? 'bg-gray-100/70 border-gray-300 text-gray-400 line-through/50 opacity-60'
                      : isProj
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 hover:bg-indigo-100/90'
                      : t.priority === 'alta'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 hover:bg-rose-100/90'
                      : t.priority === 'media'
                      ? 'bg-amber-50 border-amber-550 text-amber-950 hover:bg-amber-100/90'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950 hover:bg-emerald-100/90';

                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(t.id);
                        }}
                        className={`text-[9.5px] font-bold py-0.5 px-1 rounded truncate text-left border-l-2 select-none transition-all duration-150 hover:translate-x-0.5 shadow-3xs leading-none ${bgStyle}`}
                        title={t.title}
                      >
                        <span className="truncate flex-1">
                          {t.time && <span className="font-extrabold mr-0.5 text-[8.5px] opacity-75">{t.time}</span>}
                          {t.title}
                        </span>
                      </div>
                    );
                  })}

                  {list.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCalDate(c);
                        onSetCalView('day');
                      }}
                      className="text-[9px] font-bold text-gray-500 pl-1 mt-0.2 text-left bg-transparent border-none cursor-pointer hover:text-black transition-colors"
                    >
                      +{list.length - 2} altri...
                    </button>
                  )}
                </div>

                {/* Mobile: Clean visual circular indicator dots to keep month view completely scroll-free and beautiful */}
                <div className="flex md:hidden items-center justify-center gap-1 mt-1.5 flex-wrap w-full px-0.5 overflow-hidden">
                  {list.slice(0, 3).map(t => {
                    const done = taskDoneOn(t, iso);
                    const isProj = !!t._proj;

                    let dotColor = 'bg-emerald-500';
                    if (done) dotColor = 'bg-gray-300';
                    else if (isProj) dotColor = 'bg-indigo-500';
                    else if (t.priority === 'alta') dotColor = 'bg-rose-500';
                    else if (t.priority === 'media') dotColor = 'bg-amber-400';

                    return (
                      <span
                        key={t.id}
                        className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                      />
                    );
                  })}
                  {list.length > 3 && (
                    <span className="text-[8px] font-bold text-gray-400 leading-none">
                      •
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // RENDER WEEK VIEW
  const renderWeek = () => {
    const s = startOfWeek(calDate);

    return (
      <div className="flex flex-col gap-4 text-left">
        {Array.from({ length: 7 }).map((_, i) => {
          const c = addDays(s, i);
          const iso = isoDate(c);
          const list = tasksOnDate(iso);
          const isToday = iso === todayISO;

          return (
            <div
              key={i}
              className={`grid grid-cols-1 md:grid-cols-[116px_1fr] bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-2xs transition-all duration-250 hover:shadow-xs ${
                isToday ? 'ring-1 ring-orange-500/30' : ''
              }`}
            >
              {/* Date Column */}
              <div 
                onClick={() => onNewTask(iso)} 
                className={`p-4 border-r border-[#f5f5f5] flex md:flex-col items-center justify-between md:justify-center cursor-pointer min-h-[76px] transition-colors ${
                  isToday ? 'bg-orange-50/10' : 'bg-gray-50/30 hover:bg-gray-50/80'
                }`}
              >
                <div className="flex items-center gap-2 md:flex-col md:gap-1">
                  <span className={`inline-flex items-center justify-center font-extrabold text-[24px] leading-none w-10 h-10 rounded-full ${
                    isToday ? 'bg-[#161616] text-white shadow-xs' : 'text-[#2b2b2b]'
                  }`}>
                    {c.getDate()}
                  </span>
                  <span className={`text-[11px] uppercase tracking-widest font-bold ${isToday ? 'text-orange-650' : 'text-[#8a8a8a]'}`}>
                    {DOW[i]}
                  </span>
                </div>

                {isToday && (
                  <span className="flex items-center gap-1.5 md:mt-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-orange-600">Oggi</span>
                  </span>
                )}
              </div>

              {/* Events Column */}
              <div
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.chk-btn, .edit-btn, .seg-link')) return;
                  onNewTask(iso);
                }}
                className="p-4 flex flex-col gap-2.5 justify-center cursor-pointer min-h-[76px]"
              >
                {list.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {list.map(t => {
                      const done = taskDoneOn(t, iso);
                      const projModel = t.projectId ? projects.find(pr => pr.id === t.projectId) : null;
                      const isProj = !!t._proj;

                      return (
                        <div
                          key={t.id}
                          className={`flex items-center gap-3.5 py-2 px-3.5 bg-white border border-[#ececec] rounded-xl transition-all duration-200 hover:border-gray-300 hover:shadow-2xs ${
                            done ? 'opacity-55' : ''
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(t.id, iso);
                            }}
                            className="chk-btn w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-150 cursor-pointer flex-shrink-0"
                            style={{
                              borderColor: done ? '#15803d' : '#8a8a8a',
                              backgroundColor: done ? '#15803d' : 'white'
                            }}
                          >
                            {done && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" className="w-[11px] h-[11px] text-white">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0 text-left">
                            <b className={`block text-[13.5px] font-bold text-[#161616] leading-tight ${done ? 'line-through text-gray-500' : ''}`}>
                              {t.title}
                            </b>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-gray-400 text-[11px] font-semibold">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] uppercase tracking-wider font-bold ${
                                done ? 'bg-gray-100 text-gray-400' :
                                isProj ? 'bg-indigo-50 text-indigo-700' :
                                t.priority === 'alta' ? 'bg-rose-50 text-rose-700' :
                                t.priority === 'media' ? 'bg-amber-50 text-amber-700' :
                                'bg-emerald-50 text-emerald-700'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${
                                  done ? 'bg-gray-400' :
                                  isProj ? 'bg-indigo-600' :
                                  t.priority === 'alta' ? 'bg-rose-600' :
                                  t.priority === 'media' ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`} />
                                {isProj ? 'Cantiere' : t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Media' : 'Bassa'}
                              </span>

                              {projModel && (
                                <span className="text-[#161616]/75 bg-slate-50 hover:bg-slate-100 hover:text-[#161616] transition-colors py-0.5 px-1.5 rounded-md seg-link font-medium border border-slate-100 flex items-center gap-1 capitalize">
                                  <Sparkles className="w-2.5 h-2.5 text-orange-600" /> {projModel.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {t.time && (
                            <span className="bg-[#f0f0f0] text-[#161616] font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 flex items-center gap-1 select-none border border-gray-200">
                              <Clock className="w-2.5 h-2.5 opacity-60" /> {t.time}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(t.id);
                            }}
                            className="edit-btn w-[32px] h-[32px] rounded-lg flex items-center justify-center text-[#8a8a8a] hover:bg-[#ececec] hover:text-[#161616] transition-colors cursor-pointer flex-shrink-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-gray-400 text-[13px] italic font-medium pl-1 select-none">Nessun task per questa giornata</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // RENDER DAY VIEW
  const renderDay = () => {
    const iso = isoDate(calDate);
    const list = tasksOnDate(iso);
    const dayAppts = apptsOn(iso);

    return (
      <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-6 shadow-xs text-left">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-[#161616] capitalize">{relDay(iso)}</h2>
            <span className="text-[12.5px] text-[#8a8a8a] font-medium">{list.length + dayAppts.length} impegni in agenda</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNewAppointment(iso)}
              className="btn btn-sm bg-white hover:bg-gray-50 border border-[#e2e2e2] hover:border-black text-[#161616] font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <CalendarPlus className="w-4 h-4" /> Appuntamento
            </button>
            <button
              onClick={() => onNewTask(iso)}
              className="btn btn-sm bg-[#161616] hover:bg-black border-none text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" /> Nuovo impegno
            </button>
          </div>
        </div>

        {/* Appuntamenti del giorno */}
        {dayAppts.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-4">
            {dayAppts.map(a => {
              const pending = a.status === 'pending';
              const refused = a.status === 'rifiutato';
              // posso confermare/rifiutare se sono un partecipante in attesa (o legacy: richiesta sulla mia agenda)
              const myState = a.participants ? a.participants[myUid] : undefined;
              const canRespond = myState === 'pending' || (!a.participants && pending && a.ownerUid === myUid);
              const partEntries = Object.entries(a.participants || {});
              return (
                <div
                  key={a.id}
                  className={`flex items-center justify-between gap-3.5 py-3.5 px-4 rounded-2xl border transition-all ${
                    pending
                      ? 'bg-gray-50 border-[#e2e2e2]'
                      : refused
                      ? 'bg-gray-50 border-[#f0f0f0] opacity-60'
                      : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pending || refused ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {a.kind === 'nota' ? <Edit2 className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <b className="text-[13.5px] text-[#161616] block truncate">
                        {a.time && <span className="font-extrabold mr-1.5 text-[12px]">{a.time}</span>}
                        {a.title}
                      </b>
                      <span className="text-[11.5px] text-[#8a8a8a] truncate block">
                        {[partEntries.length === 0 ? a.withName : null, a.createdByName && a.createdBy !== myUid ? `creato da ${a.createdByName}` : null, a.note]
                          .filter(Boolean)
                          .join(' · ')}
                        {pending && (partEntries.length > 0 ? ' · in attesa dei partecipanti' : ' · in attesa di conferma')}
                        {refused && ' · rifiutato'}
                      </span>
                      {/* Partecipanti con stato conferma */}
                      {partEntries.length > 0 && (
                        <span className="flex flex-wrap gap-1 mt-1.5">
                          {partEntries.map(([uid, st]) => (
                            <span
                              key={uid}
                              title={st === 'confermato' ? 'Ha confermato' : st === 'rifiutato' ? 'Ha rifiutato' : 'In attesa'}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                st === 'confermato'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : st === 'rifiutato'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-white text-gray-500 border-gray-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st === 'confermato' ? 'bg-emerald-500' : st === 'rifiutato' ? 'bg-rose-500' : 'bg-gray-400'}`} />
                              {uid === myUid ? 'Io' : a.participantNames?.[uid] || 'Utente'}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canRespond && (
                      <>
                        <button onClick={() => onConfirmAppointment(a.id)} title="Conferma" className="w-8 h-8 rounded-lg bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center cursor-pointer border-none">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDeclineAppointment(a.id)} title="Rifiuta" className="w-8 h-8 rounded-lg bg-white border border-[#e2e2e2] hover:bg-gray-50 text-gray-600 flex items-center justify-center cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => onDeleteAppointment(a.id)} title="Annulla appuntamento" className="w-8 h-8 rounded-lg bg-white border border-[#e2e2e2] hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-600 flex items-center justify-center cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {list.length > 0 ? (
            list.map(t => {
              const done = taskDoneOn(t, iso);
              const projModel = t.projectId ? projects.find(pr => pr.id === t.projectId) : null;
              const isProj = !!t._proj;

              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between gap-3.5 py-4 px-4 bg-gray-50/40 border border-[#f0f0f0] rounded-2xl transition-all duration-200 hover:border-gray-300 hover:bg-white ${
                    done ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(t.id, iso)}
                      className="w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all duration-150 cursor-pointer flex-shrink-0"
                      style={{
                        borderColor: done ? '#15803d' : '#8a8a8a',
                        backgroundColor: done ? '#15803d' : 'white'
                      }}
                    >
                      {done && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-[12px] h-[12px] text-white">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0 text-left">
                      <b className={`block text-[15px] font-bold text-[#161616] leading-snug ${done ? 'line-through text-gray-500 font-medium' : ''}`}>
                        {t.title}
                      </b>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-gray-400 text-[11.5px] font-semibold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] uppercase tracking-wider font-extrabold ${
                          done ? 'bg-gray-100 text-gray-400' :
                          isProj ? 'bg-indigo-50 text-indigo-700' :
                          t.priority === 'alta' ? 'bg-rose-50 text-rose-700' :
                          t.priority === 'media' ? 'bg-amber-50 text-amber-500' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            done ? 'bg-gray-400' :
                            isProj ? 'bg-indigo-600' :
                            t.priority === 'alta' ? 'bg-rose-600' :
                            t.priority === 'media' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`} />
                          {isProj ? 'Cantiere' : t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Media' : 'Bassa'}
                        </span>
                        
                        {projModel && (
                          <span className="text-[#161616] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded border border-gray-100 flex items-center gap-0.5">
                            · {projModel.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.time && (
                      <span className="bg-[#f0f0f0] text-[#161616] font-mono text-[11.5px] font-bold px-3 py-1.5 rounded-xl border border-gray-200 select-none flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" /> {t.time}
                      </span>
                    )}

                    <button
                      onClick={() => onEditTask(t.id)}
                      className="w-[34px] h-[34px] rounded-xl flex items-center justify-center text-[#8a8a8a] hover:bg-[#ececec] hover:text-[#161616] transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-[72px] px-5 text-[#8a8a8a] bg-gray-50/20 border border-dashed border-gray-200 rounded-3xl">
              <CalendarIcon className="w-12 h-12 opacity-30 mx-auto mb-3 text-gray-400" />
              <b className="block text-[#161616] text-[15.5px] font-bold mb-1">Crea un nuovo impegno</b>
              <p className="text-[13px] text-gray-400 max-w-[340px] mx-auto leading-relaxed">Nessun evento in agenda registrato per questo giorno.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation & Controls panel */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-left bg-transparent p-1">
        <div className="flex items-center gap-1 bg-white border border-[#e2e2e2] p-1 rounded-[18px] shadow-sm">
          <button
            onClick={handlePrev}
            className="w-8.5 h-8.5 rounded-xl hover:bg-[#f5f5f5] flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronLeft className="w-4.5 h-4.5 text-[#333]" />
          </button>
          <button
            onClick={handleToday}
            className="text-[12.5px] font-bold text-[#161616] px-3.5 py-1.5 hover:bg-[#f5f5f5] rounded-xl transition-colors cursor-pointer border-none bg-transparent"
          >
            Oggi
          </button>
          <button
            onClick={handleNext}
            className="w-8.5 h-8.5 rounded-xl hover:bg-[#f5f5f5] flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronRight className="w-4.5 h-4.5 text-[#333]" />
          </button>
        </div>

        <div className="font-extrabold text-[22px] tracking-tight text-[#161616] leading-none capitalize font-sans">
          {calHeadLabel()}
        </div>

        <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-2xl gap-[2px]">
          {(['day', 'week', 'month'] as const).map(view => (
            <button
              key={view}
              onClick={() => onSetCalView(view)}
              className={`text-[12.5px] font-bold px-[15px] py-1.5 rounded-xl cursor-pointer border-none outline-none flex items-center justify-center min-w-[76px] transition-colors duration-150 ${
                calView === view
                  ? 'bg-white text-[#161616] font-extrabold shadow-2xs'
                  : 'bg-transparent text-[#8a8a8a] hover:text-[#161616]'
              }`}
            >
              {view === 'month' ? 'Mese' : view === 'week' ? 'Settimana' : 'Giorno'}
            </button>
          ))}
        </div>
      </div>

      {/* Main calendar grid render with high fidelity wait transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={calView + '-' + calDate.toISOString()}
          initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {calView === 'month' ? renderMonth() : calView === 'week' ? renderWeek() : renderDay()}
        </motion.div>
      </AnimatePresence>

      <TeamLeavePanel teamLeave={teamLeave} myUid={myUid} myName={myName || ''} onSaveLeave={onSaveLeave} onDeleteLeave={onDeleteLeave} />
    </div>
  );
};

// ---- Ferie & Assenze team ----
const LEAVE_LABEL: Record<TeamLeave['type'], string> = { ferie: 'Ferie', permesso: 'Permesso', malattia: 'Malattia' };
const LEAVE_STYLE: Record<TeamLeave['type'], string> = {
  ferie: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  permesso: 'bg-amber-50 text-amber-700 border-amber-200',
  malattia: 'bg-rose-50 text-rose-700 border-rose-200'
};

const TeamLeavePanel: React.FC<{
  teamLeave: TeamLeave[];
  myUid: string;
  myName: string;
  onSaveLeave?: (l: TeamLeave) => void;
  onDeleteLeave?: (id: string) => void;
}> = ({ teamLeave, myUid, myName, onSaveLeave, onDeleteLeave }) => {
  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [type, setType] = React.useState<TeamLeave['type']>('ferie');
  const [note, setNote] = React.useState('');
  const todayIso = isoDate(new Date());

  const upcoming = [...teamLeave].filter((l) => l.dateTo >= todayIso).sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  // banner: ferie altrui che iniziano entro 7 giorni
  const soon = upcoming.filter((l) => {
    if (l.uid === myUid) return false;
    const days = Math.ceil((parseISO(l.dateFrom).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  });

  const add = () => {
    if (!from || !onSaveLeave) return;
    const id = `leave-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    onSaveLeave({ id, uid: myUid, name: myName || 'Membro', dateFrom: from, dateTo: to || from, type, note: note || null, at: Date.now() });
    setFrom(''); setTo(''); setType('ferie'); setNote(''); setOpen(false);
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#161616]">
          <CalendarIcon className="w-5 h-5" /> Ferie & Assenze team
        </h3>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] text-white text-[12.5px] font-bold">
          <Plus className="w-4 h-4" /> Segna assenza
        </button>
      </div>

      {soon.length > 0 && (
        <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
          <b>In arrivo entro 7 giorni:</b> {soon.map((l) => `${l.name} (${LEAVE_LABEL[l.type]} dal ${l.dateFrom})`).join(' · ')}
        </div>
      )}

      {open && (
        <div className="mb-3 p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1"><label className="text-[11px] font-bold text-[#6b6b6b]">Dal</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" /></div>
          <div className="flex flex-col gap-1"><label className="text-[11px] font-bold text-[#6b6b6b]">Al</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" /></div>
          <div className="flex flex-col gap-1"><label className="text-[11px] font-bold text-[#6b6b6b]">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as TeamLeave['type'])} className="px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12px] outline-none">
              <option value="ferie">Ferie</option><option value="permesso">Permesso</option><option value="malattia">Malattia</option>
            </select>
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (facoltativa)" className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
          <button onClick={add} disabled={!from} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">Conferma</button>
        </div>
      )}

      {upcoming.length === 0 ? (
        <p className="text-[12.5px] italic text-[#9a9a9a] py-2">Nessuna assenza programmata.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {upcoming.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${LEAVE_STYLE[l.type]}`}>{LEAVE_LABEL[l.type]}</span>
                <span className="text-[12.5px] font-bold text-[#161616] truncate">{l.name}</span>
                <span className="text-[11.5px] text-[#9a9a9a]">{l.dateFrom === l.dateTo ? l.dateFrom : `${l.dateFrom} → ${l.dateTo}`}{l.note ? ` · ${l.note}` : ''}</span>
              </div>
              {(l.uid === myUid) && onDeleteLeave && (
                <button onClick={() => onDeleteLeave(l.id)} className="text-rose-600 shrink-0"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
