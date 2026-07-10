/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pill fluttuante del cronometro attivo (uno per utente). Mostra il tempo che
 * scorre in tempo reale e il pulsante Stop. Fixed in basso a destra, sopra la
 * bottom-nav (z-[210] < Modal z-220).
 */
import React from 'react';
import { Square, Timer } from 'lucide-react';
import type { TimeEntry } from '../types';
import { fmtStopwatch } from '../timetracking';

export const RunningTimerPill: React.FC<{ entry: TimeEntry | null; onStop: () => void }> = ({ entry, onStop }) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!entry) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [entry?.id]);
  if (!entry) return null;
  const label = entry.taskTitle || entry.tipo;
  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[210] select-none">
      <div className="flex items-center gap-3 bg-[#161616] text-white rounded-2xl shadow-lg pl-3.5 pr-2 py-2 border border-black/20">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1">
            <Timer className="w-3 h-3" /> In corso
          </span>
          <span className="text-[12.5px] font-bold truncate max-w-[150px]">{label}</span>
        </div>
        <span className="tabular-nums text-[15px] font-extrabold tracking-tight">{fmtStopwatch(now - entry.start)}</span>
        <button
          onClick={onStop}
          title="Ferma e registra"
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer border-none text-white shrink-0"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
