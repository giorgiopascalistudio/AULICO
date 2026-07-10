/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NotificheView — sezione "Home → Notifiche" di ogni società operativa.
 * Mostra le notifiche/messaggi persistenti dell'utente + le CHAT coi clienti
 * (riuso di projectMessages) sui progetti di quella società. Le chat 1:1 tra
 * collaboratori e la stanza di società arriveranno con il modulo Chat dedicato.
 */
import React from 'react';
import { Bell, Inbox, MessageSquare, ChevronRight } from 'lucide-react';
import type { Project, ProjectMessage } from '../types';

const relTime = (at?: number | null): string => {
  if (!at) return '';
  const d = Date.now() - at;
  if (d < 60e3) return 'ora';
  if (d < 36e5) return `${Math.floor(d / 60e3)} min`;
  if (d < 864e5) return `${Math.floor(d / 36e5)} h`;
  if (d < 6048e5) return `${Math.floor(d / 864e5)} g`;
  return new Date(at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
};

interface NotifItem { id: string; title: string; text: string; time: string; read: boolean; link?: string | null }

interface Props {
  socLabel: string;
  color: string;
  notifications: NotifItem[];
  projects: Project[];                                   // progetti della società
  projectMessages: Record<string, Record<string, ProjectMessage>>;
  myUid: string;
  onOpenNotification: (id: string, link?: string | null) => void;
  onOpenProject: (pid: string) => void;
}

export const NotificheView: React.FC<Props> = ({ socLabel, color, notifications, projects, projectMessages, myUid, onOpenNotification, onOpenProject }) => {
  const nameOf = React.useMemo(() => {
    const m: Record<string, Project> = {};
    projects.forEach((p) => { m[p.id] = p; });
    return m;
  }, [projects]);

  // Chat coi clienti: ultimo messaggio per progetto (solo progetti di questa società con messaggi).
  const chats = Object.entries(projectMessages || {})
    .map(([pid, msgs]) => {
      const p = nameOf[pid];
      if (!p) return null;
      const arr = Object.values(msgs || {});
      if (!arr.length) return null;
      const last = arr.reduce((a, b) => (a.at >= b.at ? a : b));
      return { pid, p, last, n: arr.length };
    })
    .filter((x): x is { pid: string; p: Project; last: ProjectMessage; n: number } => !!x)
    .sort((a, b) => b.last.at - a.last.at);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-5 text-left">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-tight text-[#161616]">Notifiche & messaggi</h2>
        <p className="text-[12.5px] text-[#8a8a8a] mt-0.5">Aggiornamenti e conversazioni di {socLabel}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Notifiche */}
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#f5f5f3] text-[#161616]"><Bell className="w-4 h-4" /></span>
              <b className="text-[14px] font-extrabold text-[#161616]">Notifiche</b>
            </div>
            {unread > 0 && <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#161616] text-white text-[11px] font-extrabold">{unread}</span>}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-[#9a9a9a]">
              <Inbox className="w-9 h-9 opacity-30 mx-auto mb-2" />
              <p className="text-[12.5px]">Nessuna notifica.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => onOpenNotification(n.id, n.link)}
                  className={`w-full flex items-start gap-3 py-2.5 px-2 border-b border-[#f5f5f5] last:border-b-0 rounded-xl text-left cursor-pointer border-none bg-transparent hover:bg-[#fafafa] ${n.read ? 'opacity-60' : ''}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-[#d6d6d6]' : 'bg-orange-500'}`} />
                  <span className="flex-1 min-w-0">
                    <b className="block text-[13px] font-bold text-[#161616] leading-tight truncate">{n.title}</b>
                    {n.text && <span className="block text-[11.5px] text-[#8a8a8a] leading-snug mt-0.5 line-clamp-2">{n.text}</span>}
                  </span>
                  <span className="text-[10px] text-[#9a9a9a] font-semibold shrink-0 mt-0.5">{n.time}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat coi clienti */}
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#f5f5f3] text-[#161616]"><MessageSquare className="w-4 h-4" /></span>
            <b className="text-[14px] font-extrabold text-[#161616]">Chat coi clienti</b>
          </div>
          {chats.length === 0 ? (
            <div className="text-center py-8 text-[#9a9a9a]">
              <MessageSquare className="w-9 h-9 opacity-30 mx-auto mb-2" />
              <p className="text-[12.5px]">Nessuna conversazione. Le chat coi clienti compaiono qui quando c'è un messaggio su un progetto della società.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {chats.map(({ pid, p, last }) => (
                <button
                  key={pid}
                  onClick={() => onOpenProject(pid)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer text-left border-l-[3px]"
                  style={{ borderLeftColor: color }}
                >
                  <span className="flex-1 min-w-0">
                    <b className="block text-[13px] font-bold text-[#161616] truncate leading-tight">{p.name}</b>
                    <span className="block text-[11.5px] text-[#8a8a8a] truncate mt-0.5">
                      {last.from === myUid ? 'Tu' : (last.name || 'Cliente')}: {last.text}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#9a9a9a] font-semibold shrink-0">{relTime(last.at)}</span>
                  <ChevronRight className="w-4 h-4 text-[#c9c9c9] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
