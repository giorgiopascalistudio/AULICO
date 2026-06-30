/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, Societa } from '../types';
import { initials } from '../utils';
import {
  SOCIETY_REGISTRY, canViewSection, societaSlug, type SectionConfig,
} from '../societyConfig';

interface AulicoSidebarProps {
  profile: UserProfile | null;
  activeSocieta: Societa;
  activeSection: string;
  badges?: Record<string, number>; // chiave `${societa}:${sectionId}`
  onNav: (hash: string) => void;
  onOpenProfile: () => void;
}

export const AulicoSidebar: React.FC<AulicoSidebarProps> = ({
  profile, activeSocieta, activeSection, badges, onNav, onOpenProfile,
}) => {
  if (!profile) return null;

  // Gruppi società con almeno una sezione visibile dall'utente (RBAC).
  const groups = SOCIETY_REGISTRY
    .map((society) => ({ society, visible: society.sections.filter((s) => canViewSection(profile, society.id, s)) }))
    .filter((g) => g.visible.length > 0);

  const showHeaders = groups.length > 1;

  const renderSection = (soc: Societa, sec: SectionConfig, depth: number) => {
    const Icon = sec.icon;
    const isActive = activeSocieta === soc && activeSection === sec.id;
    const badge = badges?.[`${soc}:${sec.id}`] || 0;
    return (
      <button
        key={`${soc}:${sec.id}`}
        onClick={() => onNav(`#${societaSlug(soc)}/${sec.id}`)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[14px] transition-all cursor-pointer ${
          isActive
            ? 'bg-[#161616] text-[#eeeeee] shadow-sm font-semibold'
            : 'text-[#333333] hover:bg-[#ececec] hover:text-[#161616]'
        }`}
        style={{ paddingLeft: depth ? 12 + depth * 16 : undefined }}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? 'opacity-100' : 'opacity-70'}`} />
        <span className="flex-1 truncate text-left">{sec.label}</span>
        {badge > 0 && (
          <span className={`text-[11px] font-bold min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center ${
            isActive ? 'bg-white/20 text-[#eeeeee]' : 'bg-[#1b1b1b] text-white'
          }`}>{badge}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-[248px] bg-gradient-to-b from-white to-[#f5f5f5] border-r border-[#e2e2e2] p-[22px] pb-[14px]">
      {/* Brand */}
      <div className="flex items-center gap-1.5 px-2 pb-[20px]">
        <span className="font-extrabold text-[22px] tracking-tight text-[#161616] font-sans antialiased">Aulico</span>
      </div>

      {/* Navigazione guidata dalle autorizzazioni */}
      <nav className="flex flex-col gap-[3px] mt-1 text-left overflow-y-auto flex-1 min-h-0 -mr-1 pr-1">
        {groups.map(({ society, visible }) => {
          const soc = society.id;
          const top = visible.filter((s) => !s.parent);
          return (
            <div key={soc} className="mb-1.5">
              {showHeaders && (
                <div className="flex items-center gap-2 px-3 py-1 mt-2 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: society.color }} />
                  <span className="text-[10.5px] tracking-wider uppercase text-[#a8a8a8] font-bold truncate">{society.label}</span>
                </div>
              )}
              {top.map((sec) => (
                <React.Fragment key={`${soc}:${sec.id}:wrap`}>
                  {renderSection(soc, sec, 0)}
                  {visible.filter((c) => c.parent === sec.id).map((child) => renderSection(soc, child, 1))}
                </React.Fragment>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Profilo */}
      <div className="mt-auto pt-3 border-t border-[#f5f5f5]/80">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-[11px] p-[9px] rounded-xl hover:bg-[#ececec] transition-colors w-full text-left cursor-pointer"
        >
          <span
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[13px] font-bold"
            style={{ background: profile.role === 'admin' ? '#1b1b1b' : profile.role === 'manager' ? '#6e6e6e' : '#3d3d3d' }}
          >
            {initials(profile.name)}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block text-[13.5px] font-bold text-[#161616] truncate leading-tight tracking-tight">{profile.name}</b>
            <small className="block text-[11px] text-[#8a8a8a] capitalize truncate mt-[2px]">
              {profile.role === 'admin' ? 'Amministratore' : profile.role === 'manager' ? 'Project Manager' : profile.role === 'staff' ? 'Operatore' : 'Cliente'}
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
