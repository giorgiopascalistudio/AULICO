/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Calendar, Folder, FileText, Users, Heart, Sparkles, MessageSquare } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: typeof LayoutGrid;
  content: string;
  color: string;
}

const DEMO_TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: LayoutGrid, content: 'Benvenuto nel nuovo pannello interattivo. Sfoglia i tuoi moduli con feedback tattile.', color: 'from-orange-500 to-amber-500' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, content: 'Organizza i tuoi appuntamenti di studio con un click sulla timeline fluida.', color: 'from-red-500 to-rose-500' },
  { id: 'progetti', label: 'Progetti', icon: Folder, content: 'Gestisci le tue pratiche in 3D con un calcolo intelligente della timeline complessiva.', color: 'from-blue-500 to-indigo-500' },
  { id: 'chat', label: 'Assistenza', icon: MessageSquare, content: 'Chatta in tempo reale con i professionisti dello studio associato.', color: 'from-emerald-500 to-teal-500' }
];

export const MotionTabsMenu: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [direction, setDirection] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = DEMO_TABS.findIndex(t => t.id === activeTab);
  const activeData = DEMO_TABS[activeIndex];

  const handleTabClick = (tabId: string) => {
    const newIndex = DEMO_TABS.findIndex(t => t.id === tabId);
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveTab(tabId);
  };

  const contentVariants = {
    enter: (dir: number) => ({
      x: dir * 30,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(4px)'
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)'
    },
    exit: (dir: number) => ({
      x: dir * -30,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(4px)'
    })
  };

  return (
    <div
      ref={containerRef}
      className="bg-white border border-[#e2e2e2] rounded-[26px] p-6 shadow-sm text-left flex flex-col gap-5 w-full max-w-md mx-auto"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase font-extrabold text-[#8a8a8a] tracking-wider flex items-center gap-1.5 select-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Componente Interactive
        </span>
        <span className="text-[11.5px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Motion Menu
        </span>
      </div>

      {/* Slide Content wrapper with AnimatePresence */}
      <div className="min-h-[85px] relative overflow-hidden bg-gray-50 rounded-2xl p-4 flex items-center">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 28
            }}
            className="w-full flex flex-col gap-1.5"
          >
            <b className="text-[14.5px] font-bold text-[#161616] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${activeData.color}`} />
              Modulo {activeData.label}
            </b>
            <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed">
              {activeData.content}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating style bottom bar matching Unlumen description */}
      <div className="flex justify-center mt-2">
        <div className="inline-flex items-center gap-1 bg-[#161616] rounded-full p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]">
          {DEMO_TABS.map(tab => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative inline-flex items-center gap-1.5 border-none bg-transparent p-2.5 rounded-full font-bold text-[12.5px] cursor-pointer transition-colors duration-300 select-none ${
                  isActive ? 'text-black' : 'text-[#9a9a9a] hover:text-white'
                }`}
                style={{ touchAction: 'none' }}
              >
                {/* Underlay Active Pill animation using layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="unlumen-tabs-active-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 32
                    }}
                    className="absolute inset-0 bg-white rounded-full z-0"
                  />
                )}

                {/* Micro scale press feedback physics */}
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  whileTap={{ scaleY: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                </motion.div>

                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{
                        width: { type: 'spring', stiffness: 420, damping: 32 },
                        opacity: { delay: 0.08, duration: 0.12 } // delay: 0.08 matches unlumen specs
                      }}
                      className="relative z-10 overflow-hidden"
                    >
                      <span className="pr-1 font-bold truncate block">{tab.label}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default MotionTabsMenu;
