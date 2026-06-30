/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { SectionConfig } from '../societyConfig';

/**
 * "Portale" di una sotto-categoria (es. Risorse Umane): pagina-hub che mostra
 * le sue voci (sotto-sotto-categorie) come riquadri cliccabili. Cliccando una
 * tile si apre la sezione corrispondente.
 */
interface Props {
  title: string;
  color: string;
  items: SectionConfig[];
  onOpen: (sectionId: string) => void;
}

export const SectionPortal: React.FC<Props> = ({ title, color, items, onOpen }) => (
  <div className="flex-1 overflow-y-auto px-[30px] py-5 text-left">
    <div className="flex items-center gap-2.5 mb-5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <h1 className="text-[22px] font-extrabold text-[#161616] tracking-tight">{title}</h1>
    </div>

    {items.length === 0 ? (
      <p className="text-[13px] text-[#8a8a8a]">Nessuna sezione disponibile in quest'area.</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => onOpen(sec.id)}
              className="group text-left bg-white border border-[#e2e2e2] rounded-[20px] p-5 shadow-sm hover:shadow-md hover:border-[#cfcfcf] transition-all cursor-pointer flex flex-col gap-3"
            >
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <b className="text-[15px] font-extrabold text-[#161616]">{sec.label}</b>
                  <ChevronRight className="w-4 h-4 text-[#bdbdbd] group-hover:text-[#161616] group-hover:translate-x-0.5 transition-all" />
                </div>
                {sec.note && <p className="text-[12.5px] text-[#8a8a8a] mt-1 leading-relaxed">{sec.note}</p>}
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);
