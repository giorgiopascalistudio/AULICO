/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SmartText } from './SmartText';

interface StatusCardProps {
  fromCode: string;
  fromCity: string;
  fromTime: string;
  toCode: string;
  toCity: string;
  toTime: string;
  progress: number;
  eta: string;
  nextLabel: string;
  nextVal: string;
  rightLabel: string;
  rightVal: string;
}

const DOT_MATRIX: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"], B: ["110", "101", "110", "101", "110"], C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"], E: ["111", "100", "110", "100", "111"], F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"], H: ["101", "101", "111", "101", "101"], I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"], K: ["101", "110", "100", "110", "101"], L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"], N: ["101", "111", "111", "111", "101"], O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"], Q: ["010", "101", "101", "110", "011"], R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"], T: ["111", "010", "010", "010", "010"], U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"], W: ["101", "101", "111", "111", "101"], X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"], Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"], "2": ["110", "001", "010", "100", "111"],
  "3": ["111", "001", "010", "001", "110"], "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "110", "101", "010"], "7": ["111", "001", "010", "010", "010"], "8": ["010", "101", "010", "101", "010"],
  "9": ["010", "101", "011", "001", "110"], " ": ["000", "000", "000", "000", "000"], "-": ["000", "000", "111", "000", "000"]
};

const DotChar: React.FC<{ char: string }> = ({ char }) => {
  const norm = char.toUpperCase();
  const rows = DOT_MATRIX[norm] || DOT_MATRIX[" "];

  return (
    <span className="grid grid-cols-3 gap-[1.5px] w-[9px] h-[15px] select-none">
      {rows.flatMap((row, rIdx) =>
        row.split('').map((cell, cIdx) => (
          <i
            key={`${rIdx}-${cIdx}`}
            className={`w-[2px] h-[2px] rounded-full transition-colors duration-300 ${
              cell === '1' ? 'bg-white shadow-[0_0_1px_rgba(255,255,255,0.7)]' : 'bg-[#292929]'
            }`}
          />
        ))
      )}
    </span>
  );
};

const DotWord: React.FC<{ word: string }> = ({ word }) => {
  const letters = word.slice(0, 4).padEnd(4, ' ');
  return (
    <span className="flex gap-[3px] min-h-[15px] select-none">
      {letters.split('').map((char, idx) => (
        <DotChar key={idx} char={char} />
      ))}
    </span>
  );
};

export const StatusCard: React.FC<StatusCardProps> = ({
  fromCode,
  fromCity,
  fromTime,
  toCode,
  toCity,
  toTime,
  progress,
  eta,
  nextLabel,
  nextVal,
  rightLabel,
  rightVal
}) => {
  return (
    <div className="bg-[#161616] text-white rounded-2xl p-[22px] pb-[18px] w-full shadow-lg relative overflow-hidden text-left font-sans select-none">
      <div className="flex justify-between items-start gap-4 mb-2">
        <div className="flex flex-col gap-1 min-w-0 max-w-[46%]">
          <span className="text-[12px] font-bold text-[#bdbdbd] truncate">{fromCity}</span>
          <span className="text-[11px] text-[#8a8a8a] truncate min-h-[16px]">{fromTime}</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0 max-w-[46%] text-right items-end">
          <span className="text-[12px] font-bold text-[#bdbdbd] truncate">{toCity}</span>
          <span className="text-[11px] text-[#8a8a8a] truncate min-h-[16px]">{toTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 my-4">
        <div className="w-[8px] h-[8px] rounded-full bg-white flex-shrink-0 z-10" />
        <div className="flex-1 h-[3px] rounded bg-[#333] relative overflow-visible">
          <div
            className="absolute top-0 left-0 h-full rounded bg-gradient-to-r from-white to-[#cfcfcf] transition-all duration-[900s] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-white flex transition-all duration-[900s] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
            style={{ left: `${progress}%` }}
          >
            <span className="w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.4)] border border-gray-100 flex items-center justify-center -translate-y-[1.5px]">
              <span className="w-[5px] h-[5px] bg-[#161616] rounded-full" />
            </span>
          </div>
        </div>
        <div className="w-[8px] h-[8px] rounded-full bg-[#161616] border border-[#7a7a7a] flex-shrink-0 z-10" />
      </div>

      <div className="flex justify-center mb-3">
        <span className="text-[12px] text-[#d0d0d0] font-semibold bg-[#262626] py-1 px-[13px] rounded-full truncate max-w-full">
          {eta}
        </span>
      </div>

      <div className="flex justify-between items-center border-t border-[#2c2c2c] pt-[14px] gap-3">
        <div className="flex flex-col gap-[2px] min-w-0 max-w-[60%]">
          <span className="text-[9.5px] uppercase font-bold text-[#7a7a7a] tracking-wider truncate">{nextLabel}</span>
          <span className="text-[13.5px] font-bold text-white truncate">{nextVal}</span>
        </div>
        <span className="text-[21px] font-extrabold tracking-tight tabular-nums select-all flex-shrink-0">
          <SmartText value={`${progress}%`} />
        </span>
        <div className="flex flex-col gap-[2px] min-w-0 max-w-[35%] text-right items-end">
          <span className="text-[9.5px] uppercase font-bold text-[#7a7a7a] tracking-wider truncate">{rightLabel}</span>
          <span className="text-[13.5px] font-bold text-white truncate">{rightVal}</span>
        </div>
      </div>
    </div>
  );
};
