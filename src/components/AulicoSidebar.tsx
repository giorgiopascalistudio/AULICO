/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Societa } from '../types';
import { initials } from '../utils';
import {
  SOCIETY_REGISTRY, getSociety, canViewSection, societaSlug, type SectionConfig,
} from '../societyConfig';

/** Le 5 categorie-società mostrate come accordion (in ordine). */
const CATEGORIE: Societa[] = ['strategico', 'studio', 'materico', 'unico', 'fantastico'];

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
  // Accordion: una sola categoria aperta per volta. Si apre da sola quella attiva.
  const [openSoc, setOpenSoc] = React.useState<Societa | null>(
    CATEGORIE.includes(activeSocieta) ? activeSocieta : null,
  );
  React.useEffect(() => {
    if (CATEGORIE.includes(activeSocieta)) setOpenSoc(activeSocieta);
  }, [activeSocieta]);

  if (!profile) return null;

  // Voci di gruppo (Aulico/holding): Dashboard + Agenda in cima, Registro + Cestino in fondo.
  const holding = getSociety('holding');
  const holdingVisible = holding ? holding.sections.filter((s) => canViewSection(profile, 'holding', s)) : [];
  const topItems = holdingVisible.filter((s) => s.id === 'dashboard' || s.id === 'agenda');
  const bottomItems = holdingVisible.filter((s) => s.id === 'registro' || s.id === 'cestino');

  // Categorie con almeno una sezione visibile dall'utente (RBAC).
  const groups = SOCIETY_REGISTRY
    .filter((s) => CATEGORIE.includes(s.id))
    .map((society) => ({ society, visible: society.sections.filter((sec) => canViewSection(profile, society.id, sec)) }))
    .filter((g) => g.visible.length > 0);

  // Bottone-voce (sezione foglia). `depth` = indentazione per le sotto-sezioni.
  const itemBtn = (soc: Societa, sec: SectionConfig, depth: number) => {
    const Icon = sec.icon;
    const isActive = activeSocieta === soc && activeSection === sec.id;
    const badge = badges?.[`${soc}:${sec.id}`] || 0;
    return (
      <button
        key={`${soc}:${sec.id}`}
        onClick={() => onNav(`#${societaSlug(soc)}/${sec.id}`)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[13.5px] transition-all cursor-pointer w-full ${
          isActive
            ? 'bg-[#161616] text-[#eeeeee] shadow-sm font-semibold'
            : 'text-[#333333] hover:bg-[#ececec] hover:text-[#161616]'
        }`}
        style={{ paddingLeft: depth ? 12 + depth * 14 : undefined }}
      >
        <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
        <span className="flex-1 truncate text-left">{sec.label}</span>
        {badge > 0 && (
          <span className={`text-[11px] font-bold min-w-[19px] h-[19px] px-1.5 rounded-full flex items-center justify-center ${
            isActive ? 'bg-white/20 text-[#eeeeee]' : 'bg-[#1b1b1b] text-white'
          }`}>{badge}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-[248px] bg-gradient-to-b from-white to-[#f5f5f5] border-r border-[#e2e2e2] p-[22px] pb-[14px]">
      {/* Brand */}
      <div className="flex items-center gap-1.5 px-2 pb-[18px]">
        <span className="font-extrabold text-[22px] tracking-tight text-[#161616] font-sans antialiased">Aulico</span>
      </div>

      <nav className="flex flex-col gap-[3px] text-left overflow-y-auto flex-1 min-h-0 -mr-1 pr-1">
        {/* Voci uniche per ogni account: Dashboard + Agenda */}
        {topItems.map((sec) => itemBtn('holding', sec, 0))}

        {topItems.length > 0 && groups.length > 0 && <div className="h-px bg-[#ececec] my-2 mx-1" />}

        {/* Categorie società (accordion: una aperta per volta) */}
        {groups.map(({ society, visible }) => {
          const soc = society.id;
          const open = openSoc === soc;
          const top = visible.filter((s) => !s.parent);
          const isActiveCat = activeSocieta === soc;
          return (
            <div key={soc}>
              <button
                onClick={() => setOpenSoc(open ? null : soc)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full cursor-pointer transition-colors ${
                  isActiveCat && !open ? 'bg-[#ececec]' : 'hover:bg-[#ececec]'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: society.color }} />
                <span className="flex-1 truncate text-left text-[11.5px] font-extrabold uppercase tracking-wider text-[#5b5b5b]">
                  {society.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#9a9a9a] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key={`${soc}:body`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="flex flex-col gap-[2px] mt-[2px] mb-1.5">
                      {top.map((sec) => (
                        <React.Fragment key={`${soc}:${sec.id}:wrap`}>
                          {itemBtn(soc, sec, 1)}
                          {visible.filter((c) => c.parent === sec.id).map((child) => itemBtn(soc, child, 2))}
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Voci di gruppo in fondo: Registro, Cestino */}
        {bottomItems.length > 0 && <div className="h-px bg-[#ececec] my-2 mx-1" />}
        {bottomItems.map((sec) => itemBtn('holding', sec, 0))}
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
