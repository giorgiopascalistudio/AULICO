/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, CheckSquare, Folder, Calendar, AlertTriangle, Plus, MoreHorizontal, Check, X, Inbox, ChevronRight } from 'lucide-react';
import { Project, Task, UserProfile, Appointment, MktProject, TeamLeave } from '../types';
import { eur, fmtDayLong, initials } from '../utils';
import { Company, COMPANY_LABEL, COMPANY_COLOR } from '../finance';
import { SmartText } from './SmartText';

const LEAVE_LABEL: Record<TeamLeave['type'], string> = { ferie: 'Ferie', permesso: 'Permesso', malattia: 'Malattia' };
const LEAVE_STYLE: Record<TeamLeave['type'], string> = {
  ferie: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  permesso: 'bg-amber-50 text-amber-700 border-amber-200',
  malattia: 'bg-rose-50 text-rose-700 border-rose-200',
};

interface DashboardViewProps {
  profile: UserProfile;
  tasks: Task[];
  projects: Project[];
  /** Progetti marketing dello Strategico (mostrati tra i progetti, card uguali). */
  mktProjects?: MktProject[];
  users: Record<string, UserProfile>;
  onNav: (route: string) => void;
  onToggleTask: (taskId: string, date: string) => void;
  onEditTask: (taskId: string) => void;
  onNewTask: () => void;
  appointmentRequests?: Appointment[];
  onConfirmAppointment?: (id: string) => void;
  onDeclineAppointment?: (id: string) => void;
  /** Messaggi/richieste recenti (notifiche persistenti + richieste appuntamento) per il box sotto l'agenda. */
  messages?: { id: string; title: string; text: string; time: string; read: boolean; link?: string | null }[];
  onOpenMessage?: (id: string, link?: string | null) => void;
  /** Ferie/assenze del team: chi è assente OGGI compare in cima all'agenda. */
  teamLeave?: TeamLeave[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  tasks,
  projects,
  mktProjects = [],
  users,
  onNav,
  onToggleTask,
  onEditTask,
  onNewTask,
  appointmentRequests = [],
  onConfirmAppointment,
  onDeclineAppointment,
  messages = [],
  onOpenMessage,
  teamLeave = []
}) => {
  const todayISO = () => {
    const x = new Date();
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const today = todayISO();
  const todaysTasks = tasks.filter(t => {
    if (!t.date || today < t.date) return false;
    const f = t.frequency || 'once';
    if (f === 'once') return today === t.date;
    if (f === 'daily') return true;
    const a = new Date(t.date);
    const d = new Date(today);
    const diff = Math.round((d.getTime() - a.getTime()) / 86400000);
    if (f === 'weekly') return diff % 7 === 0;
    if (f === 'monthly') {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(a.getDate(), lastDay);
    }
    return false;
  }).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  // Assenze che coprono oggi (intervallo dateFrom..dateTo inclusivo), ordinate.
  const todaysLeaves = (teamLeave || [])
    .filter(l => l.dateFrom && l.dateFrom <= today && today <= (l.dateTo || l.dateFrom))
    .sort((a, b) => (a.uid === profile.uid ? -1 : b.uid === profile.uid ? 1 : a.name.localeCompare(b.name)));

  const doneToday = todaysTasks.filter(t => {
    if (t.frequency === 'once') return !!t.done;
    return !!(t.completions && t.completions[today]);
  });

  const pendingToday = todaysTasks.filter(t => {
    if (t.frequency === 'once') return !t.done;
    return !(t.completions && t.completions[today]);
  });

  // Calculate project task statistics
  const projTaskCounts = (p: Project) => {
    let done = 0, tot = 0;
    Object.values(p.phases || {}).forEach(ph => {
      Object.values(ph.tasks || {}).forEach(t => {
        tot++;
        if (t.done) done++;
      });
    });
    return { done, tot };
  };

  const activeProjects = projects.filter(p => p.status === 'attivo' && !p.archived);

  // Lista unificata di card progetto: pratiche + progetti marketing (Strategico).
  type ProjCard = { id: string; name: string; client: string; company: Company; pc: number; tot: number; isMkt: boolean };
  const projectCards: ProjCard[] = [
    ...activeProjects.map((p) => {
      const { done, tot } = projTaskCounts(p);
      return { id: p.id, name: p.name, client: p.client || '—', company: ((p.division as Company) || 'studio'), pc: tot ? Math.round((done / tot) * 100) : 0, tot, isMkt: false };
    }),
    ...mktProjects.filter((p) => p.status === 'attivo').map((p) => (
      { id: p.id, name: p.name, client: p.clientName || '—', company: 'strategico' as Company, pc: 0, tot: 0, isMkt: true }
    )),
  ];

  // Overdue single-instance tasks
  const overdueCount = tasks.filter(t => t.frequency === 'once' && !t.done && t.date && t.date < today).length;

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Buongiorno' : hr < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const firstName = (profile.name || '').split(' ')[0];

  // ---- Home MOBILE a tile: i numeri chiave aprono un overlay (zero scroll) ----
  const [dashModal, setDashModal] = React.useState<null | 'agenda' | 'messaggi' | 'progetti'>(null);
  const unreadCount = messages.filter((m) => !m.read).length;

  // Bottom-sheet mobile (portal su body: mai intrappolato dai wrapper animati, §9-bis).
  const sheet = (title: string, sub: string, body: React.ReactNode, action?: React.ReactNode) => createPortal(
    <div className="md:hidden fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end" onClick={() => setDashModal(null)}>
      <div className="w-full max-h-[82vh] overflow-y-auto bg-white rounded-t-[26px] p-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 pb-3 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <b className="block text-[16px] tracking-tight text-[#161616] truncate">{title}</b>
            <span className="text-[11.5px] text-[#8a8a8a]">{sub}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action}
            <button onClick={() => setDashModal(null)} className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none"><X className="w-4.5 h-4.5" /></button>
          </div>
        </div>
        {body}
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Welcome Banner */}
      <div className="text-left">
        <h1 className="text-[24px] sm:text-[30px] lg:text-[34px] font-extrabold tracking-tight text-[#161616] leading-tight font-sans">
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <div className="text-[12.5px] sm:text-[14px] text-[#8a8a8a] capitalize mt-0.5 sm:mt-1 font-semibold">
          {fmtDayLong(new Date())}
        </div>
      </div>

      {/* MOBILE — tile compatte coi numeri chiave: il dettaglio si apre in overlay */}
      <div className="grid grid-cols-2 gap-2.5 md:hidden">
        <button onClick={() => setDashModal('agenda')} className="relative bg-white border border-[#e2e2e2] rounded-[20px] p-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2 min-h-[96px]">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center"><Clock className="w-4 h-4" /></span>
            <ChevronRight className="w-4 h-4 text-[#c9c9c9]" />
          </div>
          <div className="mt-auto">
            <div className="text-[26px] font-black tracking-tight text-[#161616] leading-none">{pendingToday.length}</div>
            <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-bold uppercase tracking-wider">Da fare oggi</div>
            <div className="text-[10.5px] text-[#9a9a9a] font-semibold">{doneToday.length} completat{doneToday.length === 1 ? 'o' : 'i'}{todaysLeaves.length > 0 ? ` · ${todaysLeaves.length} assent${todaysLeaves.length === 1 ? 'e' : 'i'}` : ''}</div>
          </div>
        </button>

        <button onClick={() => setDashModal('messaggi')} className="relative bg-white border border-[#e2e2e2] rounded-[20px] p-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2 min-h-[96px]">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center"><Inbox className="w-4 h-4" /></span>
            {(unreadCount > 0 || appointmentRequests.length > 0) && <span className="w-2 h-2 rounded-full bg-orange-500" />}
          </div>
          <div className="mt-auto">
            <div className="text-[26px] font-black tracking-tight text-[#161616] leading-none">{unreadCount}</div>
            <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-bold uppercase tracking-wider">Messaggi</div>
            <div className="text-[10.5px] text-[#9a9a9a] font-semibold">{appointmentRequests.length > 0 ? `${appointmentRequests.length} richieste appuntamento` : 'notifiche recenti'}</div>
          </div>
        </button>

        <button onClick={() => setDashModal('progetti')} className="relative bg-white border border-[#e2e2e2] rounded-[20px] p-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2 min-h-[96px]">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><Folder className="w-4 h-4" /></span>
            <ChevronRight className="w-4 h-4 text-[#c9c9c9]" />
          </div>
          <div className="mt-auto">
            <div className="text-[26px] font-black tracking-tight text-[#161616] leading-none">{projectCards.length}</div>
            <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-bold uppercase tracking-wider">Progetti attivi</div>
            <div className="text-[10.5px] text-[#9a9a9a] font-semibold">tocca per l'elenco</div>
          </div>
        </button>

        <button onClick={() => onNav('calendario')} className={`relative border rounded-[20px] p-3.5 text-left cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2 min-h-[96px] ${overdueCount > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-[#e2e2e2]'}`}>
          <div className="flex items-center justify-between">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{overdueCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}</span>
            <ChevronRight className="w-4 h-4 text-[#c9c9c9]" />
          </div>
          <div className="mt-auto">
            <div className={`text-[26px] font-black tracking-tight leading-none ${overdueCount > 0 ? 'text-rose-700' : 'text-[#161616]'}`}>{overdueCount}</div>
            <div className="text-[10.5px] text-[#8a8a8a] mt-1 font-bold uppercase tracking-wider">Task scaduti</div>
            <div className="text-[10.5px] text-[#9a9a9a] font-semibold">vai all'agenda</div>
          </div>
        </button>
      </div>

      {/* MOBILE — anteprima "Agenda di oggi": usa lo spazio sotto le tile (il resto sta negli overlay) */}
      <div className="md:hidden bg-white border border-[#e2e2e2] rounded-[20px] p-4 text-left">
        <div className="flex items-center justify-between mb-1.5">
          <b className="text-[15px] font-extrabold tracking-tight text-[#161616]">Agenda di oggi</b>
          <button onClick={() => setDashModal('agenda')} className="text-[11.5px] font-bold text-[#8a8a8a] bg-transparent border-none cursor-pointer inline-flex items-center gap-0.5 p-0">
            Tutti ({todaysTasks.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {todaysLeaves.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {todaysLeaves.slice(0, 3).map(l => (
              <span key={l.id} className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10.5px] font-bold ${LEAVE_STYLE[l.type]}`}>
                {LEAVE_LABEL[l.type]} · {l.uid === profile.uid ? 'Io' : (l.name || '').split(' ')[0]}
              </span>
            ))}
            {todaysLeaves.length > 3 && <span className="text-[10.5px] font-bold text-[#9a9a9a] self-center">+{todaysLeaves.length - 3}</span>}
          </div>
        )}
        {pendingToday.length > 0 ? (
          <div className="flex flex-col">
            {pendingToday.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-2.5 py-2 border-b border-[#f5f5f5] last:border-b-0">
                <button
                  onClick={() => onToggleTask(t.id, today)}
                  className="w-[20px] h-[20px] rounded-md border-2 border-[#e2e2e2] bg-white cursor-pointer shrink-0"
                  aria-label="Completa"
                />
                <span className="flex-1 min-w-0 text-[13px] font-semibold text-[#161616] truncate">{t.title}</span>
                {t.time && <span className="bg-[#ececec] text-[#333] font-mono text-[11px] px-1.5 py-0.5 rounded-md shrink-0">{t.time}</span>}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'alta' ? 'bg-red-600' : t.priority === 'media' ? 'bg-amber-500' : 'bg-gray-300'}`} />
              </div>
            ))}
            {pendingToday.length > 3 && (
              <button onClick={() => setDashModal('agenda')} className="text-left text-[11.5px] font-bold text-[#8a8a8a] pt-2 bg-transparent border-none cursor-pointer p-0">
                +{pendingToday.length - 3} altri impegni…
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 text-[12.5px] text-[#8a8a8a] font-semibold">
            <CheckSquare className="w-4 h-4 text-emerald-600" /> {todaysTasks.length > 0 ? 'Tutto completato per oggi.' : 'Nessun impegno per oggi.'}
          </div>
        )}
      </div>

      {/* Richieste di appuntamento in attesa (desktop; su mobile stanno nell'overlay Messaggi) */}
      {appointmentRequests.length > 0 && (
        <div className="hidden md:block bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-amber-700" />
            <b className="text-[13.5px] text-amber-900">Richieste di appuntamento ({appointmentRequests.length})</b>
          </div>
          <div className="flex flex-col gap-2">
            {appointmentRequests.map((a) => (
              <div key={a.id} className="bg-white border border-amber-200/70 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <b className="text-[13px] text-[#161616] block truncate">{a.createdByName || 'Cliente'}</b>
                  <span className="text-[11.5px] text-[#8a8a8a]">
                    {a.date}{a.time ? ` · ${a.time}` : ''}{a.note ? ` · ${a.note}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onConfirmAppointment?.(a.id)} className="w-8 h-8 rounded-lg bg-[#1b1b1b] hover:bg-black text-white flex items-center justify-center cursor-pointer border-none" title="Conferma">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeclineAppointment?.(a.id)} className="w-8 h-8 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 flex items-center justify-center cursor-pointer" title="Rifiuta">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Grid (desktop; su mobile i numeri vivono nelle tile) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e2e2e2] rounded-xl p-3 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex justify-between items-center">
            <div className="text-[22px] font-black tracking-tight text-[#161616]">
              <SmartText value={pendingToday.length} />
            </div>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[11px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wider">Rimasti oggi</div>
        </div>

        <div className="bg-white border border-[#e2e2e2] rounded-xl p-3 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex justify-between items-center">
            <div className="text-[22px] font-black tracking-tight text-[#161616]">
              <SmartText value={doneToday.length} />
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[11px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wider">Completati</div>
        </div>

        <div className="bg-white border border-[#e2e2e2] rounded-xl p-3 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex justify-between items-center">
            <div className="text-[22px] font-black tracking-tight text-[#161616]">
              <SmartText value={activeProjects.length} />
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Folder className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[11px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wider">Progetti attivi</div>
        </div>

        <div className="bg-white border border-[#e2e2e2] rounded-xl p-3 shadow-xs text-left relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex justify-between items-center">
            <div className="text-[22px] font-black tracking-tight text-[#161616]">
              <SmartText value={todaysTasks.length} />
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[11px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wider">Totali oggi</div>
        </div>
      </div>

      {/* Overdue Alert banner */}
      {overdueCount > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-3xs text-left hidden md:flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7.5 h-7.5 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-[13px] text-[#161616] font-semibold leading-normal truncate">
              Hai <span className="font-extrabold text-rose-600">{overdueCount}</span> {overdueCount === 1 ? 'task scaduto' : 'task scaduti'} nell'agenda personale.
            </p>
          </div>
          <button
            onClick={() => onNav('calendario')}
            className="bg-[#161616] hover:bg-black text-[#eeeeee] font-extrabold text-[11px] py-1.5 px-3.5 rounded-lg flex-shrink-0 cursor-pointer transition-all active:scale-95 border-none"
          >
            Rivedi
          </button>
        </div>
      )}

      {/* Main Dual Grid (desktop; su mobile le card si aprono dalle tile) */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        {/* Colonna sinistra: Agenda + Messaggi & richieste */}
        <div className="flex flex-col gap-4 lg:gap-6">
        {/* Agenda Section */}
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#161616]">Agenda di oggi</h2>
              <span className="text-[12px] text-[#8a8a8a]">Lista attività giornaliere</span>
            </div>
            <button
              onClick={onNewTask}
              className="btn btn-sm bg-[#ececec] text-[#161616] hover:bg-[#dedede] border-none font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Task
            </button>
          </div>

          {todaysLeaves.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-[#f0f0f0]">
              {todaysLeaves.map(l => (
                <span
                  key={l.id}
                  title={`${LEAVE_LABEL[l.type]} · ${l.name}${l.dateFrom !== l.dateTo ? ` (fino al ${l.dateTo})` : ''}${l.note ? ` · ${l.note}` : ''}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11.5px] font-bold ${LEAVE_STYLE[l.type]}`}
                >
                  {LEAVE_LABEL[l.type]} · {l.uid === profile.uid ? 'Io' : l.name}
                  {l.dateFrom !== l.dateTo && <span className="font-medium opacity-70">→ {l.dateTo}</span>}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {todaysTasks.length > 0 ? (
              todaysTasks.map(t => {
                const done = t.frequency === 'once' ? !!t.done : !!(t.completions && t.completions[today]);
                const projModel = t.projectId ? projects.find(pr => pr.id === t.projectId) : null;
                const assigneeName = t.assignee && users[t.assignee] ? users[t.assignee].name : null;

                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 py-3 px-2 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] rounded-xl transition-colors ${
                      done ? 'opacity-65' : ''
                    }`}
                  >
                    <button
                      onClick={() => onToggleTask(t.id, today)}
                      className={`w-[21px] h-[21px] rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                        done ? 'bg-green-700 border-green-700 text-white' : 'border-[#e2e2e2] bg-white hover:border-[#161616]'
                      }`}
                    >
                      {done && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-[13px] h-[13px]">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <b className={`block text-[14.5px] font-semibold text-[#161616] leading-tight ${done ? 'line-through text-[#8a8a8a]' : ''}`}>
                        {t.title}
                      </b>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[#8a8a8a] text-[11.5px] font-medium">
                        <span className={`inline-flex items-center gap-1 ${t.priority === 'alta' ? 'text-red-700' : t.priority === 'media' ? 'text-amber-700' : 'text-[#8a8a8a]'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.priority === 'alta' ? 'bg-red-700' : t.priority === 'media' ? 'bg-amber-600' : 'bg-gray-400'}`} />
                          {t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Media' : 'Bassa'}
                        </span>
                        {t.frequency !== 'once' && (
                          <span className="bg-[#f0f0f0] text-[#161616] px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                            Ricorrente
                          </span>
                        )}
                        {projModel && (
                          <span onClick={() => onNav(`progetto/${projModel.id}`)} className="text-[#161616] hover:underline cursor-pointer">
                            · {projModel.name}
                          </span>
                        )}
                        {assigneeName && <span>· Assegnato a: {assigneeName}</span>}
                      </div>
                    </div>

                    {t.time && (
                      <span className="bg-[#ececec] text-[#333333] font-mono text-[12px] font-medium px-2 py-0.5 rounded-lg">
                        {t.time}
                      </span>
                    )}

                    <button
                      onClick={() => onEditTask(t.id)}
                      className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[#8a8a8a] hover:bg-[#ececec] hover:text-[#161616] cursor-pointer"
                    >
                      <MoreHorizontal className="w-[16px] h-[16px]" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-[42px] px-5 text-[#8a8a8a]">
                <CheckSquare className="w-10 h-10 opacity-30 mx-auto mb-3" />
                <b className="block text-[#161616] text-[15px] font-semibold mb-1">Nessun task per oggi</b>
                <p className="text-[13px] max-w-[340px] mx-auto">L'agenda di oggi è libera. Aggiungi un task personale o di studio.</p>
              </div>
            )}
          </div>
        </div>

        {/* Messaggi & richieste (sotto l'Agenda di oggi) */}
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#161616]">Messaggi & richieste</h2>
              <span className="text-[12px] text-[#8a8a8a]">Notifiche e richieste recenti</span>
            </div>
            {messages.filter(m => !m.read).length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#161616] text-white text-[11.5px] font-extrabold">
                {messages.filter(m => !m.read).length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {messages.length > 0 ? (
              messages.slice(0, 8).map(m => (
                <button
                  key={m.id}
                  onClick={() => onOpenMessage?.(m.id, m.link)}
                  className={`w-full flex items-start gap-3 py-2.5 px-2 border-b border-[#f5f5f5] last:border-b-0 rounded-xl transition-colors cursor-pointer border-none bg-transparent text-left hover:bg-[#fafafa] ${m.read ? 'opacity-60' : ''}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${m.read ? 'bg-[#d6d6d6]' : 'bg-orange-500'}`} />
                  <span className="flex-1 min-w-0">
                    <b className="block text-[13.5px] font-bold text-[#161616] leading-tight truncate">{m.title}</b>
                    {m.text && <span className="block text-[12px] text-[#8a8a8a] leading-snug mt-0.5 line-clamp-2">{m.text}</span>}
                  </span>
                  <span className="text-[10.5px] text-[#9a9a9a] font-semibold shrink-0 mt-0.5">{m.time}</span>
                </button>
              ))
            ) : (
              <div className="text-center py-8 px-5 text-[#8a8a8a]">
                <Inbox className="w-9 h-9 opacity-30 mx-auto mb-2.5" />
                <b className="block text-[#161616] text-[14px] font-semibold mb-1">Nessun messaggio</b>
                <p className="text-[12.5px] max-w-[320px] mx-auto">Le richieste e le notifiche recenti compariranno qui.</p>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Active Projects Quick Panel */}
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#161616]">Progetti attivi</h2>
              <span className="text-[12px] text-[#8a8a8a]">Lavori in corso di esecuzione</span>
            </div>
            <button
              onClick={() => onNav('progetti')}
              className="btn btn-sm bg-[#ececec] text-[#161616] hover:bg-[#dedede] border-none font-bold py-1.5 px-3 rounded-xl cursor-pointer"
            >
              Tutti
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {projectCards.length > 0 ? (
              projectCards.slice(0, 6).map(p => {
                const col = COMPANY_COLOR[p.company];
                return (
                  <div
                    key={p.id}
                    onClick={() => onNav(p.isMkt ? 'progetti' : `progetto/${p.id}`)}
                    className="flex items-center gap-3.5 p-3 rounded-xl border border-[#f5f5f5] hover:bg-[#fcfcfc] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xs border-l-[4px]"
                    style={{ borderLeftColor: col }}
                  >
                    <div className="w-[38px] h-[38px] rounded-xl text-white flex items-center justify-center flex-shrink-0" style={{ background: col }}>
                      <Folder className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <b className="block text-[14.5px] font-bold text-[#161616] truncate leading-snug">
                        {p.name}
                      </b>
                      <small className="block text-[11.5px] text-[#8a8a8a] truncate mt-0.5">
                        <span className="font-extrabold" style={{ color: col }}>{COMPANY_LABEL[p.company]}</span> · {p.client} · {p.isMkt ? 'marketing' : `${p.tot} task`}
                      </small>
                    </div>

                    {p.isMkt ? (
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full" style={{ color: col, background: `${col}14` }}>Marketing</span>
                      </div>
                    ) : (
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-[13px] font-extrabold text-[#161616] tracking-tight">{p.pc}%</div>
                        <div className="w-[54px] h-[5px] bg-[#ececec] rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${p.pc === 100 ? 'bg-green-700' : 'bg-[#1b1b1b]'}`}
                            style={{ width: `${p.pc}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 px-5 text-[#8a8a8a]">
                <Folder className="w-10 h-10 opacity-30 mx-auto mb-3" />
                <b className="block text-[#161616] text-[15px] font-semibold mb-1">Nessun progetto attivo</b>
                <p className="text-[13px] max-w-[340px] mx-auto">Non ci sono progetti attivi registrati. Crea una nuova commessa da un template.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Overlay mobile: Agenda di oggi --- */}
      {dashModal === 'agenda' && sheet(
        'Agenda di oggi',
        `${pendingToday.length} da fare · ${doneToday.length} completati`,
        <>
          {todaysLeaves.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-[#f0f0f0]">
              {todaysLeaves.map(l => (
                <span key={l.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11.5px] font-bold ${LEAVE_STYLE[l.type]}`}>
                  {LEAVE_LABEL[l.type]} · {l.uid === profile.uid ? 'Io' : l.name}
                  {l.dateFrom !== l.dateTo && <span className="font-medium opacity-70">→ {l.dateTo}</span>}
                </span>
              ))}
            </div>
          )}
          {todaysTasks.length > 0 ? (
            <div className="flex flex-col gap-1">
              {todaysTasks.map(t => {
                const done = t.frequency === 'once' ? !!t.done : !!(t.completions && t.completions[today]);
                return (
                  <div key={t.id} className={`flex items-center gap-3 py-3 px-1 border-b border-[#f5f5f5] last:border-b-0 ${done ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => onToggleTask(t.id, today)}
                      className={`w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${done ? 'bg-green-700 border-green-700 text-white' : 'border-[#e2e2e2] bg-white'}`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <b className={`block text-[14px] font-semibold text-[#161616] leading-tight truncate ${done ? 'line-through text-[#8a8a8a]' : ''}`}>{t.title}</b>
                      <span className={`text-[11px] font-bold ${t.priority === 'alta' ? 'text-red-700' : t.priority === 'media' ? 'text-amber-700' : 'text-[#9a9a9a]'}`}>
                        {t.priority === 'alta' ? 'Alta' : t.priority === 'media' ? 'Media' : 'Bassa'}{t.frequency !== 'once' ? ' · ricorrente' : ''}
                      </span>
                    </div>
                    {t.time && <span className="bg-[#ececec] text-[#333] font-mono text-[11.5px] font-medium px-2 py-0.5 rounded-lg shrink-0">{t.time}</span>}
                    <button onClick={() => { setDashModal(null); onEditTask(t.id); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a8a8a] hover:bg-[#ececec] cursor-pointer bg-transparent border-none shrink-0"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[#8a8a8a]">
              <CheckSquare className="w-9 h-9 opacity-30 mx-auto mb-2.5" />
              <b className="block text-[#161616] text-[14px] font-semibold mb-1">Nessun task per oggi</b>
              <p className="text-[12.5px]">L'agenda di oggi è libera.</p>
            </div>
          )}
        </>,
        <button onClick={() => { setDashModal(null); onNewTask(); }} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#161616] text-white text-[12px] font-bold cursor-pointer border-none"><Plus className="w-3.5 h-3.5" /> Task</button>,
      )}

      {/* --- Overlay mobile: Messaggi & richieste --- */}
      {dashModal === 'messaggi' && sheet(
        'Messaggi & richieste',
        unreadCount > 0 ? `${unreadCount} da leggere` : 'notifiche recenti',
        <>
          {appointmentRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 text-left">
              <b className="block text-[12.5px] text-amber-900 mb-2">Richieste di appuntamento ({appointmentRequests.length})</b>
              <div className="flex flex-col gap-2">
                {appointmentRequests.map((a) => (
                  <div key={a.id} className="bg-white border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <b className="text-[12.5px] text-[#161616] block truncate">{a.createdByName || 'Cliente'}</b>
                      <span className="text-[11px] text-[#8a8a8a]">{a.date}{a.time ? ` · ${a.time}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => onConfirmAppointment?.(a.id)} className="w-8 h-8 rounded-lg bg-[#1b1b1b] text-white flex items-center justify-center cursor-pointer border-none"><Check className="w-4 h-4" /></button>
                      <button onClick={() => onDeclineAppointment?.(a.id)} className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-amber-700 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {messages.length > 0 ? (
            <div className="flex flex-col gap-1">
              {messages.slice(0, 12).map(m => (
                <button key={m.id} onClick={() => { setDashModal(null); onOpenMessage?.(m.id, m.link); }} className={`w-full flex items-start gap-3 py-2.5 px-1 border-b border-[#f5f5f5] last:border-b-0 cursor-pointer border-none bg-transparent text-left ${m.read ? 'opacity-60' : ''}`}>
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${m.read ? 'bg-[#d6d6d6]' : 'bg-orange-500'}`} />
                  <span className="flex-1 min-w-0">
                    <b className="block text-[13px] font-bold text-[#161616] leading-tight truncate">{m.title}</b>
                    {m.text && <span className="block text-[11.5px] text-[#8a8a8a] leading-snug mt-0.5 line-clamp-2">{m.text}</span>}
                  </span>
                  <span className="text-[10px] text-[#9a9a9a] font-semibold shrink-0 mt-0.5">{m.time}</span>
                </button>
              ))}
            </div>
          ) : appointmentRequests.length === 0 ? (
            <div className="text-center py-8 text-[#8a8a8a]">
              <Inbox className="w-9 h-9 opacity-30 mx-auto mb-2.5" />
              <b className="block text-[#161616] text-[14px] font-semibold mb-1">Nessun messaggio</b>
              <p className="text-[12.5px]">Le notifiche recenti compariranno qui.</p>
            </div>
          ) : null}
        </>,
      )}

      {/* --- Overlay mobile: Progetti attivi --- */}
      {dashModal === 'progetti' && sheet(
        'Progetti attivi',
        `${projectCards.length} in corso`,
        projectCards.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {projectCards.map(p => {
              const col = COMPANY_COLOR[p.company];
              return (
                <button
                  key={p.id}
                  onClick={() => { setDashModal(null); onNav(p.isMkt ? 'progetti' : `progetto/${p.id}`); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#f0f0f0] bg-white cursor-pointer text-left border-l-[4px]"
                  style={{ borderLeftColor: col }}
                >
                  <span className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0" style={{ background: col }}><Folder className="w-4 h-4" /></span>
                  <span className="flex-1 min-w-0">
                    <b className="block text-[13.5px] font-bold text-[#161616] truncate leading-snug">{p.name}</b>
                    <small className="block text-[11px] text-[#8a8a8a] truncate mt-0.5">
                      <span className="font-extrabold" style={{ color: col }}>{COMPANY_LABEL[p.company]}</span> · {p.client}
                    </small>
                  </span>
                  {p.isMkt ? (
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full shrink-0" style={{ color: col, background: `${col}14` }}>MKT</span>
                  ) : (
                    <span className="font-mono text-[12px] font-extrabold text-[#161616] shrink-0">{p.pc}%</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#8a8a8a]">
            <Folder className="w-9 h-9 opacity-30 mx-auto mb-2.5" />
            <b className="block text-[#161616] text-[14px] font-semibold mb-1">Nessun progetto attivo</b>
            <p className="text-[12.5px]">Le commesse attive compariranno qui.</p>
          </div>
        ),
      )}
    </div>
  );
};
