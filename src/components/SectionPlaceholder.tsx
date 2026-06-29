/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Hammer } from 'lucide-react';
import type { SectionConfig } from '../societyConfig';

interface Props {
  section: SectionConfig;
  societyLabel: string;
  color: string;
}

/** Sezione dichiarata ma non ancora costruita: segnaposto navigabile. */
export const SectionPlaceholder: React.FC<Props> = ({ section, societyLabel, color }) => {
  const Icon = section.icon;
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-[420px] w-full bg-white border border-[#e2e2e2] rounded-[24px] p-8 text-center shadow-sm">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: `${color}14`, color }}
        >
          <Icon className="w-7 h-7" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-1">{societyLabel}</div>
        <h2 className="text-[20px] font-extrabold text-[#161616] tracking-tight">{section.label}</h2>
        <p className="text-[13.5px] text-[#6e6e6e] mt-2 leading-relaxed">
          {section.note || 'Questa sezione è in preparazione.'}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-5 text-[12px] font-bold text-[#8a8a8a] bg-[#f5f5f3] rounded-full px-3 py-1.5">
          <Hammer className="w-3.5 h-3.5" /> In costruzione
        </div>
      </div>
    </div>
  );
};
