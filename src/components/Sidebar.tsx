/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutGrid, Calendar, Folder, Users, FileText, DollarSign, Target, Trash2, Inbox } from 'lucide-react';
import { UserProfile } from '../types';
import { initials } from '../utils';

interface SidebarProps {
  route: string;
  peopleTab: 'team' | 'clienti' | 'partner';
  profile: UserProfile | null;
  counts: {
    todoToday: number;
    activeProjects: number;
    newClientRequests?: number;
  };
  onNav: (route: string, tab?: 'team' | 'clienti' | 'partner') => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  route,
  peopleTab,
  profile,
  counts,
  onNav,
  onOpenProfile
}) => {
  if (!profile) return null;

  const showTeamOnly = profile.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, count: 0 },
    { id: 'calendario', label: 'Calendario', icon: Calendar, count: counts.todoToday },
    { id: 'progetti', label: 'Progetti', icon: Folder, count: counts.activeProjects },
    ...(profile.role === 'admin' || profile.role === 'manager'
      ? [{ id: 'crm', label: 'CRM', icon: Target, count: 0 }]
      : []),
    ...(profile.role === 'admin' || profile.role === 'manager'
      ? [{ id: 'richieste-clienti', label: 'Richieste', icon: Inbox, count: counts.newClientRequests || 0 }]
      : []),
    { id: 'documenti', label: 'Documenti', icon: FileText, count: 0 },
    ...(profile.role === 'admin' || profile.role === 'manager'
      ? [{ id: 'finanze', label: 'Finanze', icon: DollarSign, count: 0 }]
      : []),
    ...(profile.role === 'admin' ? [{ id: 'team', label: 'Team', icon: Users, count: 0 }] : []),
    ...(profile.role === 'admin' || profile.role === 'manager'
      ? [{ id: 'cestino', label: 'Cestino', icon: Trash2, count: 0 }]
      : [])
  ];

  return (
    <aside className="hidden md:flex flex-col w-[248px] bg-gradient-to-b from-white to-[#f5f5f5] border-r border-[#e2e2e2] p-[22px] pb-[14px]">
      {/* Brand logo & header */}
      <div className="flex items-center gap-1.5 px-2 pb-[24px]">
        {/* Customized Logo with styled Onirico font */}
        <span className="font-extrabold text-[22px] tracking-tight text-[#161616] font-sans antialiased">
          Onirico<span className="text-[#8a8a8a] font-normal"> · OS</span>
        </span>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex flex-col gap-[3px] mt-1 text-left">
        <span className="text-[10.5px] tracking-wider uppercase text-[#a8a8a8] font-bold px-3 py-1 mb-2">
          Workspace
        </span>

        {menuItems.map(item => {
          const isActive =
            route === item.id || (item.id === 'progetti' && route === 'progetto');
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[14.5px] transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#161616] text-[#eeeeee] shadow-sm font-semibold'
                  : 'text-[#333333] hover:bg-[#ececec] hover:text-[#161616]'
              }`}
            >
              <IconComponent className={`w-[19px] h-[19px] ${isActive ? 'opacity-100' : 'opacity-70'}`} />
              <span className="flex-1 truncate text-left">{item.label}</span>
              {item.count > 0 && (
                <span
                  className={`text-[11px] font-bold min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-[#eeeeee]' : 'bg-[#1b1b1b] text-white'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile button at the bottom */}
      <div className="mt-auto pt-3 border-t border-[#f5f5f5]/80">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-[11px] p-[9px] rounded-xl hover:bg-[#ececec] transition-colors w-full text-left cursor-pointer"
        >
          <span
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[13px] font-bold"
            style={{
              background:
                profile.role === 'admin'
                  ? '#1b1b1b'
                  : profile.role === 'manager'
                  ? '#6e6e6e'
                  : '#3d3d3d'
            }}
          >
            {initials(profile.name)}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block text-[13.5px] font-bold text-[#161616] truncate leading-tight tracking-tight">
              {profile.name}
            </b>
            <small className="block text-[11px] text-[#8a8a8a] capitalize truncate mt-[2px]">
              {profile.role === 'admin'
                ? 'Amministratore'
                : profile.role === 'manager'
                ? 'Project Manager'
                : profile.role === 'staff'
                ? 'Operatore'
                : 'Cliente'}
            </small>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[16px] h-[16px] text-[#8a8a8a]">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
