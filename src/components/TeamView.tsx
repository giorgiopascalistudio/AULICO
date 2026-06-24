/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  Plus, 
  MoreHorizontal, 
  User, 
  Folder, 
  Lock, 
  Search, 
  Grid, 
  List, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  ShieldCheck, 
  Compass, 
  FileCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Project, Task } from '../types';
import { initials } from '../utils';

interface TeamViewProps {
  users: Record<string, UserProfile>;
  projects: Project[];
  peopleTab: 'team' | 'clienti' | 'partner';
  onSetPeopleTab: (tab: 'team' | 'clienti' | 'partner') => void;
  onNewUser: () => void;
  onNewClient: () => void;
  onEditUser: (uid: string) => void;
  onUserMenu: (uid: string, anchor: HTMLElement) => void;
  onNav: (route: string) => void;
  onPreviewClient: (uid: string) => void;
  myUid: string;
  tasks?: Task[];
}

export const TeamView: React.FC<TeamViewProps> = ({
  users,
  projects,
  peopleTab,
  onSetPeopleTab,
  onNewUser,
  onNewClient,
  onEditUser,
  onUserMenu,
  onNav,
  onPreviewClient,
  myUid,
  tasks = []
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<'tutti' | 'studio' | 'strategico' | 'materico'>('tutti');

  const usersList = Object.entries(users).map(([uid, u]) => ({ uid, ...(u as any) }));
  
  // Filtering & sorting for team members (internal staff)
  const teamList = usersList
    .filter(u => u.role !== 'cliente' && u.role !== 'partner')
    .sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return (a.name || '').localeCompare(b.name || '');
    })
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.title || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });
  
  // Filtering & sorting B2B partners
  const partnersList = usersList
    .filter(u => u.role === 'partner')
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.telefono || '').toLowerCase().includes(q) ||
        (u.title || '').toLowerCase().includes(q)
      );
    });

  // Filtering & sorting for clients based on division/sector
  const clientsList = usersList
    .filter(u => u.role === 'cliente')
    .filter(u => {
      if (selectedSector === 'tutti') return true;
      return u.sector === selectedSector;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.telefono || '').toLowerCase().includes(q) ||
        (u.title || '').toLowerCase().includes(q)
      );
    });

  const getClientProjects = (clientUid: string) => {
    return projects.filter(p => p.clientUid === clientUid);
  };

  const getManagedProjects = (u: any) => {
    // Return list of active or completed projects managed by this person
    return projects.filter(p => p.manager === u.name || p.manager === u.uid);
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>, uid: string) => {
    e.stopPropagation();
    onUserMenu(uid, e.currentTarget);
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string, uid: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const badges = {
    admin: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
    manager: 'bg-amber-55/70 text-amber-850 border border-amber-200/50',
    staff: 'bg-emerald-55/60 text-emerald-850 border border-emerald-200/50',
    cliente: 'bg-blue-55/50 text-blue-850 border border-blue-200/50',
    partner: 'bg-purple-55/50 text-purple-850 border border-purple-200/50'
  };

  const labels = {
    admin: 'Firma / Amministratore',
    manager: 'Project Manager',
    staff: 'Operatore',
    cliente: 'Cliente',
    partner: 'Partner B2B'
  };

  // Modern animated initials avatar background gradients based on name length
  const getAvatarGradient = (role: string, name: string) => {
    if (role === 'admin') return 'bg-gradient-to-tr from-zinc-800 to-zinc-900 text-white';
    const num = (name || '').length % 3;
    if (num === 0) return 'bg-gradient-to-tr from-stone-700 to-stone-850 text-white';
    if (num === 1) return 'bg-gradient-to-tr from-neutral-600 to-neutral-750 text-white';
    return 'bg-gradient-to-tr from-zinc-700 to-zinc-800 text-white';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 20 } }
  };

  return (
    <div className="flex flex-col gap-5 text-left animate-[riseIn_0.42s_ease_both]">
      {/* Search and Navigation Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-150 pb-4">
        
        {/* Switch Pills */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            <button
              onClick={() => {
                onSetPeopleTab('team');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 text-[12.5px] font-bold px-[15px] py-1.5 rounded-full transition-all cursor-pointer border-none bg-transparent ${
                peopleTab === 'team' ? 'bg-white text-[#161616] shadow-xs font-extrabold' : 'text-[#8a8a8a] hover:text-[#161616]'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Team
            </button>
            <button
              onClick={() => {
                onSetPeopleTab('clienti');
                setSearchQuery('');
                setSelectedSector('tutti');
              }}
              className={`flex items-center gap-1.5 text-[12.5px] font-bold px-[15px] py-1.5 rounded-full transition-all cursor-pointer border-none bg-transparent ${
                peopleTab === 'clienti' ? 'bg-white text-[#161616] shadow-xs font-extrabold' : 'text-[#8a8a8a] hover:text-[#161616]'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Clienti
            </button>
            <button
              onClick={() => {
                onSetPeopleTab('partner');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 text-[12.5px] font-bold px-[15px] py-1.5 rounded-full transition-all cursor-pointer border-none bg-transparent ${
                peopleTab === 'partner' ? 'bg-white text-[#161616] shadow-xs font-extrabold' : 'text-[#8a8a8a] hover:text-[#161616]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Partner
            </button>
          </div>

          {peopleTab === 'clienti' && (
            <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] animate-[fadeIn_0.18s_ease_both]">
              {(['tutti', 'studio', 'strategico', 'materico'] as const).map(sec => {
                const label = sec === 'tutti' ? 'Tutti' 
                            : sec === 'studio' ? 'Studio' 
                            : sec === 'strategico' ? 'Strategico' 
                            : 'Materico';
                const active = selectedSector === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => setSelectedSector(sec)}
                    className={`text-[12px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none transition-all ${
                      active 
                        ? 'bg-[#161616] text-white shadow-xs font-extrabold' 
                        : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Stats Summary */}
          <div className="text-[11px] font-mono font-bold text-[#8a8a8a] bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full uppercase tracking-wider">
            {peopleTab === 'team' 
              ? `${teamList.length} membri` 
              : peopleTab === 'partner'
              ? `${partnersList.length} partner`
              : `${clientsList.length} filtrati`
            }
          </div>
        </div>

        {/* Search, Layout Switcher and New User Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Elegant Search bar */}
          <div className="relative min-w-[200px] max-w-full flex-1 md:flex-none">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                peopleTab === 'team' 
                  ? "Cerca nel team..." 
                  : peopleTab === 'partner'
                  ? "Cerca nei partner..."
                  : "Cerca nei clienti..."
              }
              className="pl-9 pr-4 py-1.5 text-[12.5px] font-semibold text-[#161616] rounded-full border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] w-full md:w-[240px] focus:ring-0 placeholder-gray-400 font-sans shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-[10px] text-gray-450 hover:text-black font-semibold cursor-pointer"
              >
                Annulla
              </button>
            )}
          </div>

          {/* Layout Toggle (Grid / List) */}
          <div className="flex bg-[#f5f5f5] border border-[#e2e2e2] p-[2.5px] rounded-full shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full border-none cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-white text-[#161616] shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-black'
              }`}
              title="Vista Griglia"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full border-none cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-white text-[#161616] shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-black'
              }`}
              title="Vista Tabella"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add actions */}
          <div>
            {peopleTab === 'team' ? (
              <button
                onClick={onNewUser}
                className="bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold py-2 px-4 rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm border-none transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Nuovo Account
              </button>
            ) : (
              <button
                onClick={onNewClient}
                className="bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold py-2 px-4 rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm border-none transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> {peopleTab === 'partner' ? 'Nuovo Partner' : 'Nuovo Cliente'}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-[13px] text-[#8a8a8a] -mt-2 max-w-[700px] leading-relaxed">
        {peopleTab === 'team'
          ? "Gestisci l'organico e assegna i ruoli di sicurezza dello studio. Gli amministratori possiedono l'intero controllo, i PM sovrintendono ad avanzamenti e fatturazioni, mentre lo staff opera sulle commesse."
          : peopleTab === 'partner'
          ? "Elenco delle imprese partner, impiantisti, geometri e artigiani abilitati che collaborano alla realizzazione dei cantieri attivi dello studio."
          : "Elenco dei committenti registrati per i settori dello studio (Architettura, Brand e Finiture d'Interni) con credenziali di accesso dedicate."}
      </p>

      {/* DASHBOARD PRODUTTIVITÀ (solo team) */}
      {peopleTab === 'team' && (
        <ProductivityDashboard members={teamList} tasks={tasks} />
      )}

      {/* RENDER GRID MODE */}
      {viewMode === 'grid' ? (
        <AnimatePresence mode="wait">
          {peopleTab === 'team' ? (
            /* TEAM GRID */
            teamList.length > 0 ? (
              <motion.div 
                key="team-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {teamList.map(u => {
                  const isMe = u.uid === myUid;
                  const fns = Array.isArray(u.functions) ? u.functions : (u.functions ? Object.keys(u.functions) : []);
                  const mProjs = getManagedProjects(u);

                  return (
                    <motion.div
                      key={u.uid}
                      variants={itemVariants}
                      onClick={() => onNav(`persona/${u.uid}`)}
                      className="group bg-white border border-[#e2e2e2] rounded-[24px] p-5 hover:border-black flex flex-col justify-between hover:shadow-md transition-all duration-300 cursor-pointer relative"
                      whileHover={{ y: -3 }}
                    >
                      {/* Top Row: Avatar & Actions */}
                      <div className="flex justify-between items-start">
                        {/* Avatar container with status dot */}
                        <div className="relative">
                          <span
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[14px] shadow-2xs border border-white ${getAvatarGradient(u.role, u.name)}`}
                          >
                            {initials(u.name)}
                          </span>
                          {/* Active / Inactive status badge */}
                          <span className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${u.active === false ? 'bg-red-500' : 'bg-green-500'}`} />
                        </div>

                        {/* Dropdown or standard Menu action */}
                        {!isMe && (
                          <button
                            onClick={(e) => handleMenuClick(e, u.uid)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border border-[#e2e2e2] text-gray-500 bg-white hover:bg-[#161616] hover:text-white transition-all cursor-pointer shadow-3xs active:scale-95"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Middle Area: Personal Info */}
                      <div className="mt-4 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[14.5px] font-bold text-[#161616] group-hover:text-black tracking-tight leading-snug">
                            {u.name}
                          </h4>
                          {isMe && (
                            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">Tu</span>
                          )}
                        </div>

                        {/* Badge Ruolo */}
                        <div className="mt-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${badges[u.role] || badges.staff}`}>
                            {labels[u.role] || u.role}
                          </span>
                        </div>

                        {/* Incarico Operativo Text */}
                        {u.title && (
                          <p className="text-[12px] font-semibold text-gray-500 mt-2 italic leading-relaxed border-l-2 border-gray-150 pl-2">
                            {u.title}
                          </p>
                        )}
                      </div>

                      {/* Bottom Area: Contact and Functions details */}
                      <div className="mt-5 pt-3.5 border-t border-dashed border-[#ececec]">
                        {/* Interactive contact items */}
                        <div className="flex flex-col gap-1.5 text-[11.5px] font-medium text-gray-500">
                          <div 
                            onClick={(e) => handleCopyEmail(e, u.email, u.uid)}
                            className="flex items-center justify-between hover:text-black transition-colors rounded-lg py-1 px-1.5 hover:bg-gray-50/70"
                            title="Clicca per copiare l'email"
                          >
                            <span className="flex items-center gap-1.5 overflow-hidden text-ellipsis">
                              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </span>
                            {copiedUid === u.uid ? (
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                          </div>

                          {u.telefono && (
                            <a 
                              href={`tel:${u.telefono}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 hover:text-black transition-colors rounded-lg py-1 px-1.5 hover:bg-gray-50/70 no-underline text-inherit"
                            >
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{u.telefono}</span>
                            </a>
                          )}
                        </div>

                        {/* Functions Pills List */}
                        {fns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {fns.map(f => (
                              <span key={f} className="text-[9px] bg-slate-50 text-slate-800 border border-slate-200/55 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Managed Projects Pill counter */}
                        {mProjs.length > 0 && (
                          <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 bg-zinc-50 border border-zinc-150 rounded-xl px-2.5 py-1.5 w-fit">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Controlla {mProjs.length} pratiche</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="no-team"
                className="text-center py-12 bg-gray-50/40 rounded-2xl border border-dashed border-gray-200"
              >
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400 italic font-medium">Nessun membro del team corrisponde alla ricerca.</p>
              </motion.div>
            )
          ) : peopleTab === 'partner' ? (
            /* PARTNER GRID */
            partnersList.length > 0 ? (
              <motion.div 
                key="partners-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {partnersList.map(u => {
                  const clientProjs = getClientProjects(u.uid);

                  return (
                    <motion.div
                      key={u.uid}
                      variants={itemVariants}
                      onClick={() => onNav(`persona/${u.uid}`)}
                      className="group bg-white border border-[#e2e2e2] rounded-[24px] p-5 hover:border-black flex flex-col justify-between hover:shadow-md transition-all duration-300 cursor-pointer relative"
                      whileHover={{ y: -3 }}
                    >
                      {/* Top Row: Avatar & Actions */}
                      <div className="flex justify-between items-start">
                        {/* Avatar container with status dot */}
                        <div className="relative">
                          <span
                            className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[14px] shadow-2xs border border-white bg-gradient-to-tr from-purple-100 to-purple-200 text-purple-850"
                          >
                            {initials(u.name)}
                          </span>
                          <span className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${u.active === false ? 'bg-red-500' : 'bg-green-500'}`} />
                        </div>

                        {/* Action menu button */}
                        <button
                          onClick={(e) => handleMenuClick(e, u.uid)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-[#e2e2e2] text-gray-500 bg-white hover:bg-[#161616] hover:text-white transition-all cursor-pointer shadow-3xs active:scale-95"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info Area */}
                      <div className="mt-4 text-left">
                        <h4 className="text-[14.5px] font-extrabold text-[#161616] group-hover:text-black tracking-tight leading-none truncate font-extrabold">
                          {u.name}
                        </h4>
                        
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border-purple-200">
                            Partner B2B
                          </span>
                          {u.telefono && (
                            <span className="text-[10px] font-bold text-gray-400">∙ {u.telefono}</span>
                          )}
                        </div>

                        {/* Email box copyable */}
                        <div 
                          onClick={(e) => handleCopyEmail(e, u.email, u.uid)}
                          className="flex items-center justify-between text-[11.5px] font-medium text-gray-500 hover:text-black mt-3 hover:bg-gray-50/70 p-1 rounded-lg transition-colors overflow-hidden"
                          title="Copia email"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </span>
                          {copiedUid === u.uid ? (
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Connected Projects Pill List */}
                      <div className="mt-4 pt-3.5 border-t border-dashed border-[#ececec]">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-2 font-sans">
                          Pratiche edilizie collegate
                        </span>
                        {clientProjs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto pr-0.5">
                            {clientProjs.map(p => (
                              <button
                                key={p.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNav(`progetto/${p.id}`);
                                }}
                                className="inline-flex items-center gap-1 bg-[#f1f1f1] hover:bg-black text-[#161616] hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer text-left truncate max-w-full"
                              >
                                <Folder className="w-3 h-3 shrink-0" /> 
                                <span className="truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-gray-400 font-bold font-sans italic block mt-1">
                            Nessuna pratica attiva
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="no-partners"
                className="text-center py-12 bg-gray-50/40 rounded-2xl border border-dashed border-gray-200"
              >
                <Lock className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400 italic font-medium">Nessun partner B2B corrisponde alla ricerca.</p>
              </motion.div>
            )
          ) : (
            /* CLIENTS GRID */
            clientsList.length > 0 ? (
              <motion.div 
                key="clients-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {clientsList.map(u => {
                  const clientProjs = getClientProjects(u.uid);

                  return (
                    <motion.div
                      key={u.uid}
                      variants={itemVariants}
                      onClick={() => onNav(`persona/${u.uid}`)}
                      className="group bg-white border border-[#e2e2e2] rounded-[24px] p-5 hover:border-black flex flex-col justify-between hover:shadow-md transition-all duration-300 cursor-pointer relative"
                      whileHover={{ y: -3 }}
                    >
                      {/* Top Row: Avatar & Actions */}
                      <div className="flex justify-between items-start">
                        {/* Avatar container with status dot */}
                        <div className="relative">
                          <span
                            className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[14px] shadow-2xs border border-white bg-gradient-to-tr from-sky-100 to-sky-200 text-sky-850"
                          >
                            {initials(u.name)}
                          </span>
                          <span className={`w-3 h-3 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${u.active === false ? 'bg-red-500' : 'bg-green-500'}`} />
                        </div>

                        {/* Action menu button */}
                        <button
                          onClick={(e) => handleMenuClick(e, u.uid)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-[#e2e2e2] text-gray-500 bg-white hover:bg-[#161616] hover:text-white transition-all cursor-pointer shadow-3xs active:scale-95"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info Area */}
                      <div className="mt-4 text-left">
                        <h4 className="text-[14.5px] font-extrabold text-[#161616] group-hover:text-black tracking-tight leading-none truncate font-extrabold">
                          {u.name}
                        </h4>
                        
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider border px-2 py-0.5 rounded-full ${
                            u.sector === 'strategico'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : u.sector === 'materico'
                              ? 'bg-orange-50 text-orange-850 border-orange-200'
                              : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                          }`}>
                            {u.sector === 'strategico' 
                              ? 'Strategico' 
                              : u.sector === 'materico' 
                              ? 'Materico' 
                              : 'Studio'}
                          </span>
                          {u.telefono && (
                            <span className="text-[10px] font-bold text-gray-400">∙ {u.telefono}</span>
                          )}
                        </div>

                        {/* Email box copyable */}
                        <div 
                          onClick={(e) => handleCopyEmail(e, u.email, u.uid)}
                          className="flex items-center justify-between text-[11.5px] font-medium text-gray-500 hover:text-black mt-3 hover:bg-gray-50/70 p-1 rounded-lg transition-colors overflow-hidden"
                          title="Copia email"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </span>
                          {copiedUid === u.uid ? (
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Connected Projects Pill List */}
                      <div className="mt-4 pt-3.5 border-t border-dashed border-[#ececec]">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-2 font-sans font-extrabold">
                          Pratiche edilizie collegate
                        </span>
                        {clientProjs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto pr-0.5">
                            {clientProjs.map(p => (
                              <button
                                key={p.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNav(`progetto/${p.id}`);
                                }}
                                className="inline-flex items-center gap-1 bg-[#f1f1f1] hover:bg-black text-[#161616] hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer text-left truncate max-w-full"
                              >
                                <Folder className="w-3 h-3 shrink-0" /> 
                                <span className="truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-gray-400 font-bold font-sans italic block mt-1">
                            Nessuna pratica attiva
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="no-clients"
                className="text-center py-12 bg-gray-50/40 rounded-2xl border border-dashed border-gray-200"
              >
                <Lock className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400 italic font-medium">Nessun cliente corrisponde alla ricerca.</p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      ) : (
        /* RENDER STREAMLINED TABLE LIST MODE */
        <motion.div 
          key="table-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#e2e2e2] rounded-[24px] overflow-hidden shadow-xs"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2e2e2] bg-[#fafafa]">
                  <th className="font-bold text-[11px] text-[#8a8a8a] uppercase tracking-wider py-4 px-5">Utente</th>
                  <th className="font-bold text-[11px] text-[#8a8a8a] uppercase tracking-wider py-4 px-5">{peopleTab === 'team' ? 'Ruolo' : 'Tipologia'}</th>
                  <th className="font-bold text-[11px] text-[#8a8a8a] uppercase tracking-wider py-4 px-5">{peopleTab === 'team' ? 'Incarico Operativo / Note' : 'Pratiche Collegate'}</th>
                  <th className="font-bold text-[11px] text-[#8a8a8a] uppercase tracking-wider py-4 px-5">Stato</th>
                  <th className="py-4 px-5 text-right w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {peopleTab === 'team' ? (
                  /* TEAM TABLE ROW */
                  teamList.length > 0 ? (
                    teamList.map(u => {
                      const isMe = u.uid === myUid;
                      const fns = Array.isArray(u.functions) ? u.functions : (u.functions ? Object.keys(u.functions) : []);

                      return (
                        <tr
                          key={u.uid}
                          onClick={() => onNav(`persona/${u.uid}`)}
                          className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11.5px] ${getAvatarGradient(u.role, u.name)}`}
                              >
                                {initials(u.name)}
                              </span>
                              <div className="min-w-0">
                                <b className="block text-[13.5px] font-bold text-[#161616] tracking-tight truncate">
                                  {u.name} {isMe && <span className="text-gray-400 font-normal italic ml-0.5">(tu)</span>}
                                </b>
                                <span className="block text-[11.5px] text-gray-500 font-medium truncate mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${badges[u.role] || badges.staff}`}>
                              {labels[u.role] || u.role}
                            </span>
                          </td>

                          <td className="py-3 px-5">
                            {fns.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {fns.map(f => (
                                  <span key={f} className="text-[9px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12.5px] font-semibold text-gray-850 truncate max-w-[240px] block">{u.title || '—'}</span>
                            )}
                          </td>

                          <td className="py-3 px-5 whitespace-nowrap">
                            {u.active === false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-widest">
                                Disattivato
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-green-700">
                                <span className="w-1.5 h-1.5 bg-green-700 rounded-full" /> Attivo
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-5 text-right whitespace-nowrap">
                            {!isMe && (
                              <button
                                onClick={(e) => handleMenuClick(e, u.uid)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a8a8a] bg-transparent hover:bg-[#ececec] hover:text-[#161616] cursor-pointer border-none transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[13px] text-gray-400 italic">
                        Nessun membro corrisponde alla ricerca.
                      </td>
                    </tr>
                  )
                ) : peopleTab === 'partner' ? (
                  /* PARTNER TABLE ROW */
                  partnersList.length > 0 ? (
                    partnersList.map(u => {
                      const clientProjs = getClientProjects(u.uid);

                      return (
                        <tr
                          key={u.uid}
                          onClick={() => onNav(`persona/${u.uid}`)}
                          className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center text-[12px] font-bold font-sans">
                                {initials(u.name)}
                              </span>
                              <div className="min-w-0">
                                <b className="block text-[13.5px] font-bold text-[#161616] truncate">{u.name}</b>
                                <span className="block text-[11.5px] text-gray-500 font-medium truncate mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border bg-purple-50 text-purple-800 border-purple-200">
                              Partner B2B
                            </span>
                          </td>

                          <td className="py-4 px-5 text-left max-w-[280px]">
                            {clientProjs.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
                                {clientProjs.map(p => (
                                  <span
                                    key={p.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNav(`progetto/${p.id}`);
                                    }}
                                    className="inline-flex items-center gap-1 bg-[#ececec] text-[#161616] hover:bg-black hover:text-white px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    <Folder className="w-3 h-3 block" /> {p.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-gray-404 font-bold font-sans italic">Nessuna pratica</span>
                            )}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            {u.active === false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-widest">
                                Disabilitato
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-green-700">
                                <span className="w-1.5 h-1.5 bg-green-700 rounded-full" /> Attivo
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => handleMenuClick(e, u.uid)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a8a8a] bg-transparent hover:bg-[#ececec] hover:text-[#161616] cursor-pointer border-none transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[13px] text-gray-400 italic">
                        Nessun partner B2B corrisponde alla ricerca.
                      </td>
                    </tr>
                  )
                ) : (
                  /* CLIENTS TABLE ROW */
                  clientsList.length > 0 ? (
                    clientsList.map(u => {
                      const clientProjs = getClientProjects(u.uid);

                      return (
                        <tr
                          key={u.uid}
                          onClick={() => onNav(`persona/${u.uid}`)}
                          className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-[12px] font-bold font-sans">
                                {initials(u.name)}
                              </span>
                              <div className="min-w-0">
                                <b className="block text-[13.5px] font-bold text-[#161616] truncate">{u.name}</b>
                                <span className="block text-[11.5px] text-gray-500 font-medium truncate mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              u.sector === 'strategico'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : u.sector === 'materico'
                                ? 'bg-orange-50 text-orange-850 border-orange-200'
                                : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                            }`}>
                              {u.sector === 'strategico' 
                                ? 'Strategico' 
                                : u.sector === 'materico' 
                                ? 'Materico' 
                                : 'Studio'}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-left max-w-[280px]">
                            {clientProjs.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
                                {clientProjs.map(p => (
                                  <span
                                    key={p.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNav(`progetto/${p.id}`);
                                    }}
                                    className="inline-flex items-center gap-1 bg-[#ececec] text-[#161616] hover:bg-black hover:text-white px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    <Folder className="w-3 h-3 block" /> {p.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-gray-400 font-bold font-sans italic">Nessuna pratica</span>
                            )}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            {u.active === false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase tracking-widest">
                                Disabilitato
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-green-700">
                                <span className="w-1.5 h-1.5 bg-green-700 rounded-full" /> Attivo
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => handleMenuClick(e, u.uid)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a8a8a] bg-transparent hover:bg-[#ececec] hover:text-[#161616] cursor-pointer border-none transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[13px] text-gray-400 italic">
                        Nessun cliente corrisponde alla ricerca.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ---- Dashboard produttività per collaboratore ----
const ProductivityDashboard: React.FC<{ members: any[]; tasks: Task[] }> = ({ members, tasks }) => {
  const [range, setRange] = useState<'week' | 'month'>('week');
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (range === 'week') { const d = (start.getDay() + 6) % 7; start.setDate(start.getDate() - d); } else { start.setDate(1); }
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();

  const statsFor = (uid: string) => {
    const mine = tasks.filter((t) => t.assignee === uid || (t.assignees || []).includes(uid));
    const open = mine.filter((t) => !t.done);
    const overdue = open.filter((t) => t.date && t.date < todayIso);
    const completed = mine.filter((t) => t.done && (t.updatedAt || 0) >= startMs);
    const urgent = open.filter((t) => t.priority === 'urgente');
    return { open: open.length, overdue: overdue.length, completed: completed.length, urgent: urgent.length };
  };

  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <h3 className="inline-flex items-center gap-2 text-[14.5px] font-extrabold text-[#161616]"><Compass className="w-4.5 h-4.5" /> Produttività team</h3>
        <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {(['week', 'month'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`text-[11.5px] font-bold px-3 py-1 rounded-full ${range === r ? 'bg-[#161616] text-white' : 'text-[#8a8a8a]'}`}>
              {r === 'week' ? 'Settimana' : 'Mese'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {members.map((u) => {
          const s = statsFor(u.uid);
          return (
            <div key={u.uid} className="px-3 py-2.5 rounded-2xl border border-[#eee] bg-[#fafafa]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-[#161616] text-white flex items-center justify-center text-[10px] font-bold">{initials(u.name)}</span>
                <b className="text-[12.5px] text-[#161616] truncate">{u.name}</b>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div><div className="text-[15px] font-black text-[#161616]">{s.open}</div><div className="text-[8.5px] font-bold uppercase text-[#9a9a9a]">Aperti</div></div>
                <div><div className={`text-[15px] font-black ${s.urgent ? 'text-rose-600' : 'text-[#161616]'}`}>{s.urgent}</div><div className="text-[8.5px] font-bold uppercase text-[#9a9a9a]">Urgenti</div></div>
                <div><div className={`text-[15px] font-black ${s.overdue ? 'text-amber-600' : 'text-[#161616]'}`}>{s.overdue}</div><div className="text-[8.5px] font-bold uppercase text-[#9a9a9a]">Scaduti</div></div>
                <div><div className="text-[15px] font-black text-emerald-600">{s.completed}</div><div className="text-[8.5px] font-bold uppercase text-[#9a9a9a]">Fatti</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
