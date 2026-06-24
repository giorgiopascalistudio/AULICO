/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SectionPlaceholder — pannello coerente per le sezioni del Cantiere ancora
 * "in preparazione" (struttura completa del PDF già navigabile, contenuto in arrivo).
 */
import React from 'react';
import { Hammer } from 'lucide-react';

export const SectionPlaceholder: React.FC<{ label: string; hint?: string }> = ({ label, hint }) => (
  <div className="bg-[#fafafa] border border-dashed border-[#dcdcdc] rounded-[20px] p-8 text-center">
    <div className="w-11 h-11 rounded-2xl bg-white border border-[#ececec] flex items-center justify-center mx-auto mb-3">
      <Hammer className="w-5 h-5 text-[#b0b0b0]" />
    </div>
    <p className="text-[13.5px] font-bold text-[#3a3a3a]">{label}</p>
    <p className="text-[12px] text-[#9a9a9a] mt-1 max-w-sm mx-auto">
      {hint || 'Sezione in preparazione: la struttura è pronta, le funzioni di dettaglio arriveranno a breve.'}
    </p>
  </div>
);
