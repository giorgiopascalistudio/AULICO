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
 * attiva scorre con animazione (layoutId). Tutte mostrano icona + NOME (semplificazione 25/11:
 * le sole icone non dicevano nulla a chi non conosce l'app).
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
            title={tab.label}
            className={`relative flex-1 shrink-0 inline-flex items-center justify-center gap-1.5 border-none bg-transparent px-3.5 py-2.5 rounded-full font-bold text-[13px] cursor-pointer transition-colors duration-300 select-none whitespace-nowrap ${
              active ? 'text-[#161616]' : 'text-[#c8c8c8] hover:text-white'
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
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className={`pr-0.5 ${active ? 'font-extrabold' : 'font-semibold'}`}>{tab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
