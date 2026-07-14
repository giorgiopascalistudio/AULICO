/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PeriodSelect — selettore Settimana | Mese dei report (modello in `src/period.ts`).
 * In modalità mese usa l'input nativo; in settimana due frecce, perché `input[type=week]`
 * non esiste su Safari/Firefox (sul telefono non comparirebbe nulla).
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthPeriod, weekPeriod, weekIn, nextPeriod, prevPeriod, ymNow, type Period } from '../period';

export const PeriodSelect: React.FC<{ value: Period; onChange: (p: Period) => void }> = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <div className="inline-flex bg-[#f1f1f1] rounded-xl p-0.5">
      {(['settimana', 'mese'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m === 'mese' ? monthPeriod(value.ym) : weekPeriod(weekIn(value.ym)))}
          className={`px-3 py-1.5 rounded-[10px] text-[11.5px] font-bold capitalize cursor-pointer border-none ${value.mode === m ? 'bg-white text-[#161616] shadow-sm' : 'bg-transparent text-[#8a8a8a]'}`}
        >{m}</button>
      ))}
    </div>
    {value.mode === 'mese' ? (
      <input
        type="month"
        value={value.key}
        onChange={(e) => onChange(monthPeriod(e.target.value || ymNow()))}
        className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none bg-white"
      />
    ) : (
      <div className="inline-flex items-center gap-0.5 bg-white border border-[#e2e2e2] rounded-xl px-1 py-1">
        <button onClick={() => onChange(prevPeriod(value))} className="w-7 h-7 rounded-lg hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer bg-transparent border-none" title="Settimana precedente"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-[12.5px] font-bold text-[#161616] px-1 min-w-[130px] text-center">{value.label}</span>
        <button onClick={() => onChange(nextPeriod(value))} className="w-7 h-7 rounded-lg hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer bg-transparent border-none" title="Settimana successiva"><ChevronRight className="w-4 h-4" /></button>
      </div>
    )}
  </div>
);

export default PeriodSelect;
