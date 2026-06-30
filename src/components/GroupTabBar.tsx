/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

/**
 * Nav bar a pillole (stile dettaglio Progetti) per le sotto-categorie di un
 * "portale" (es. Risorse Umane → Dashboard · CRM · Recruiting · …). La pill
 * attiva scorre con animazione (layoutId) e mostra l'etichetta; le altre solo icona.
 */
interface GroupTab { id: string; label: string; icon: LucideIcon; }
interface Props {
  tabs: GroupTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const GroupTabBar: React.FC<Props> = ({ tabs, activeId, onSelect }) => (
  <div className="w-full mb-5">
    <div className="flex w-full items-center bg-[#161616] rounded-full p-1.5 shadow-[0_12px_34px_-10px_rgba(0,0,0,0.5)] overflow-x-auto gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`relative flex-1 inline-flex items-center justify-center gap-1.5 border-none bg-transparent p-2.5 rounded-full font-bold text-[13px] cursor-pointer transition-colors duration-300 select-none whitespace-nowrap ${
              active ? 'text-[#161616]' : 'text-[#9a9a9a] hover:text-white'
            }`}
            style={{ touchAction: 'none' }}
          >
            {active && (
              <motion.div
                layoutId="groupActivePill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 bg-white rounded-full z-0"
              />
            )}
            <div className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${
                  active ? 'max-w-[220px] opacity-100 font-extrabold' : 'max-w-0 opacity-0'
                }`}
              >
                <span className="pl-1 pr-1">{tab.label}</span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
