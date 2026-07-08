/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Navbar — navigazione MOBILE allineata alla struttura Aulico V2 (stessa fonte
 * del desktop: SOCIETY_REGISTRY + RBAC). Bottom bar: Home · Agenda · Società
 * (sheet a tutto schermo: scegli la società → le sue sezioni a gruppi) · Altro
 * (Registro attività, Cestino). Niente più voci legacy.
 */
import React, { useState } from 'react';
import { LayoutGrid, Calendar, Building2, Bell, MoreHorizontal, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Societa } from '../types';
import { initials } from '../utils';
import {
  SOCIETY_REGISTRY, getSociety, canViewSection, societaSlug, type SectionConfig, type SocietyConfig,
} from '../societyConfig';

const CATEGORIE: Societa[] = ['strategico', 'studio', 'materico', 'unico', 'fantastico'];

interface NavbarProps {
  profile: UserProfile | null;
  activeSocieta: Societa;
  activeSection: string;
  onNav: (hash: string) => void;
  onOpenProfile: () => void;
  actionButton?: React.ReactNode;
  notificationsCount: number;
  onNotificationsClick: () => void;
  /** richieste di accesso in attesa (admin/manager) — badge sul profilo mobile */
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile, activeSocieta, activeSection, onNav, onOpenProfile,
  actionButton, notificationsCount, onNotificationsClick, pendingCount = 0,
}) => {
  const [socOpen, setSocOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openSoc, setOpenSoc] = useState<Societa | null>(CATEGORIE.includes(activeSocieta) ? activeSocieta : null);

  if (!profile) return null;

  const go = (hash: string) => { onNav(hash); setSocOpen(false); setMoreOpen(false); };

  // Voci "Altro": le sezioni condivise della holding (Registro, Cestino) con RBAC.
  const holding = getSociety('holding');
  const moreItems = (holding?.sections || []).filter(
    (s) => s.id !== 'dashboard' && s.id !== 'agenda' && canViewSection(profile, 'holding', s),
  );

  // Sezioni visibili (livello 2) di una società, come la sidebar desktop.
  const topEntries = (society: SocietyConfig): { top: SectionConfig; children: SectionConfig[] }[] => {
    const out: { top: SectionConfig; children: SectionConfig[] }[] = [];
    for (const top of society.sections.filter((s) => !s.parent)) {
      if (top.kind === 'group') {
        const children = society.sections.filter((c) => c.parent === top.id && canViewSection(profile, society.id, c));
        if (children.length) out.push({ top, children });
      } else if (canViewSection(profile, society.id, top)) {
        out.push({ top, children: [] });
      }
    }
    return out;
  };
  const societies = SOCIETY_REGISTRY
    .filter((s) => CATEGORIE.includes(s.id))
    .map((society) => ({ society, entries: topEntries(society) }))
    .filter((g) => g.entries.length > 0);

  const isHome = activeSocieta === 'holding' && activeSection === 'dashboard';
  const isAgenda = activeSocieta === 'holding' && activeSection === 'agenda';
  const inSociety = CATEGORIE.includes(activeSocieta);
  const isMore = activeSocieta === 'holding' && !isHome && !isAgenda;

  const barTabs = [
    { id: 'home', label: 'Home', icon: LayoutGrid, active: isHome, onTap: () => go('#aulico/dashboard') },
    { id: 'agenda', label: 'Agenda', icon: Calendar, active: isAgenda, onTap: () => go('#aulico/agenda') },
    { id: 'societa', label: 'Società', icon: Building2, active: inSociety || socOpen, onTap: () => { setOpenSoc(null); setSocOpen(true); } },
    ...(moreItems.length ? [{ id: 'altro', label: 'Altro', icon: MoreHorizontal, active: isMore || moreOpen, onTap: () => setMoreOpen(true) }] : []),
  ];

  const activeSocietyCfg = inSociety ? getSociety(activeSocieta) : null;

  return (
    <>
      {/* Mobile Topbar */}
      <div className="flex md:hidden items-center justify-between gap-4 px-[18px] py-[14px] bg-white border-b border-[#ececec] sticky top-0 z-[40]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-extrabold text-[18px] tracking-tight text-[#161616] font-sans antialiased">Aulico</span>
          {activeSocietyCfg && (
            <button onClick={() => { setOpenSoc(activeSocieta); setSocOpen(true); }} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f3f3f1] border border-[#e6e6e4] cursor-pointer min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: activeSocietyCfg.color }} />
              <span className="text-[11px] font-extrabold text-[#444] truncate">{activeSocietyCfg.label}</span>
              <ChevronDown className="w-3 h-3 text-[#9a9a9a] shrink-0" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto shrink-0">
          <div className="m-actions-mobile inline-flex items-center">{actionButton}</div>
          <button
            onClick={onNotificationsClick}
            className="relative w-[38px] h-[38px] rounded-xl flex items-center justify-center text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all active:scale-95"
            aria-label="Notifiche"
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationsCount > 0 && <span className="absolute top-[4px] right-[4px] w-2 h-2 rounded-full bg-red-500 ring-1.5 ring-white animate-pulse" />}
          </button>
          <button
            onClick={onOpenProfile}
            className="relative w-[38px] h-[38px] rounded-xl flex items-center justify-center text-white text-[11px] font-bold border-none cursor-pointer active:scale-95 transition-transform"
            aria-label="Profilo"
            style={{ background: profile.role === 'admin' ? '#1b1b1b' : profile.role === 'manager' ? '#6e6e6e' : '#3d3d3d' }}
          >
            {initials(profile.name)}
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">{pendingCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-[50] bg-transparent border-none p-0 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] px-5 justify-center pointer-events-none">
        <div className="flex items-center gap-1 bg-[#161616] rounded-full p-2 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6)] pointer-events-auto w-full max-w-[420px] justify-between">
          {barTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={tab.onTap}
                className={`relative flex-1 inline-flex items-center justify-center gap-1.5 border-none bg-transparent py-3 px-2 rounded-full font-bold text-[13px] cursor-pointer transition-colors duration-300 select-none ${
                  tab.active ? 'text-[#161616] flex-[1.4]' : 'text-[#9a9a9a] hover:text-white'
                }`}
                style={{ touchAction: 'none' }}
              >
                {tab.active && (
                  <motion.div layoutId="mobileNavActivePill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="absolute inset-0 bg-white rounded-full z-0" />
                )}
                <div className="relative z-10 flex items-center justify-center gap-1.5">
                  <Icon className="w-[21px] h-[21px] flex-shrink-0" />
                  <span className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${tab.active ? 'max-w-[120px] opacity-100 font-bold' : 'max-w-0 opacity-0'}`}>
                    <span className="pr-1">{tab.label}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sheet SOCIETÀ — stessa struttura e permessi della sidebar desktop */}
      <AnimatePresence>
        {socOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSocOpen(false)}
          >
            <motion.div
              initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[82vh] overflow-y-auto bg-white rounded-t-[26px] border-t border-[#ececec] shadow-2xl p-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]"
            >
              {(() => {
                const pageSoc = openSoc && CATEGORIE.includes(openSoc) ? societies.find((g) => g.society.id === openSoc) : null;
                // LIVELLO 1 — griglia di card colorate (chooser società)
                if (!pageSoc) return (
                  <>
                    <div className="flex items-center justify-between px-1 pb-3 sticky top-0 bg-white z-10">
                      <b className="text-[15px] tracking-tight">Le società</b>
                      <button onClick={() => setSocOpen(false)} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none"><X className="w-4.5 h-4.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {societies.map(({ society, entries }) => {
                        const soc = society.id;
                        const secCount = entries.reduce((n, e) => n + (e.children.length || 1), 0);
                        const active = activeSocieta === soc;
                        return (
                          <button
                            key={soc}
                            onClick={() => setOpenSoc(soc)}
                            className="relative overflow-hidden rounded-[20px] border border-[#ececec] p-3.5 text-left flex flex-col gap-2 min-h-[104px] cursor-pointer active:scale-[0.98] transition-transform"
                            style={{ background: `${society.color}0f` }}
                          >
                            <span className="absolute top-0 left-0 h-full w-1.5" style={{ background: society.color }} />
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: society.color }}>
                              <Building2 className="w-4.5 h-4.5" />
                            </span>
                            <span className="flex-1 flex flex-col justify-end">
                              <span className="block text-[13.5px] font-extrabold text-[#161616] leading-tight truncate">{society.label}</span>
                              <span className="block text-[10.5px] font-bold text-[#8a8a8a] mt-0.5">{secCount} sezion{secCount === 1 ? 'e' : 'i'}</span>
                            </span>
                            {active && <span className="absolute top-2.5 right-2.5 text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#161616] text-white">attiva</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
                // LIVELLO 2 — pagina dedicata della società scelta
                const { society, entries } = pageSoc;
                const soc = society.id;
                return (
                  <>
                    <div className="flex items-center gap-2 px-1 pb-3 sticky top-0 bg-white z-10">
                      <button onClick={() => setOpenSoc(null)} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none"><ChevronLeft className="w-5 h-5" /></button>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: society.color }} />
                      <b className="flex-1 text-[15px] tracking-tight truncate">{society.label}</b>
                      <button onClick={() => setSocOpen(false)} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none"><X className="w-4.5 h-4.5" /></button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {entries.map(({ top, children }) => {
                        const TopIcon = top.icon;
                        // Voce singola (senza gruppo): riga piena uniforme.
                        if (children.length === 0) {
                          const active = activeSocieta === soc && activeSection === top.id;
                          return (
                            <button key={top.id} onClick={() => go(`#${societaSlug(soc)}/${top.id}`)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-[13px] font-bold cursor-pointer ${active ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#ececec] text-[#333]'}`}>
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white/15' : ''}`} style={active ? undefined : { background: `${society.color}14`, color: society.color }}>
                                <TopIcon className="w-4 h-4" />
                              </span>
                              <span className="flex-1 text-left truncate">{top.label}</span>
                              <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
                            </button>
                          );
                        }
                        // Gruppo: card morbida con le sue voci UNA PER RIGA (niente griglia).
                        return (
                          <div key={top.id} className="rounded-[18px] border border-[#ececec] bg-[#fafaf8] p-1.5">
                            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#8a8a8a]">
                              <TopIcon className="w-3.5 h-3.5" /> {top.label}
                            </div>
                            <div className="flex flex-col gap-1">
                              {children.map((sec) => {
                                const Icon = sec.icon;
                                const active = activeSocieta === soc && activeSection === sec.id;
                                return (
                                  <button
                                    key={sec.id}
                                    onClick={() => go(`#${societaSlug(soc)}/${sec.id}`)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[12.5px] font-bold cursor-pointer text-left ${active ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#efefed] text-[#333] hover:border-[#cfcfcf]'}`}
                                  >
                                    <Icon className={`w-4 h-4 shrink-0 ${active ? '' : 'opacity-55'}`} />
                                    <span className="flex-1 truncate leading-tight">{sec.label}</span>
                                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${active ? 'opacity-60' : 'opacity-25'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheet ALTRO — voci di gruppo (Registro, Cestino) */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-[26px] border-t border-[#ececec] shadow-2xl p-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]"
            >
              <div className="flex items-center justify-between px-1 pb-3">
                <b className="text-[15px] tracking-tight">Strumenti di gruppo</b>
                <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none"><X className="w-4.5 h-4.5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeSocieta === 'holding' && activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(`#aulico/${item.id}`)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border text-[12px] font-bold transition-colors cursor-pointer ${active ? 'bg-[#161616] text-white border-[#161616]' : 'bg-[#fafafa] border-[#ececec] text-[#3a3a3a] hover:border-[#cfcfcf]'}`}
                    >
                      <Icon className="w-[22px] h-[22px]" />
                      <span className="text-center leading-tight px-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
