/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GanttChart — visualizzazione a barre del Cronoprogramma di cantiere.
 * Legge gli stessi record della tabella (GenericRecord: title, date=inizio,
 * dateEnd=fine, status) e li dispone su una timeline (settimane o mesi, auto).
 * Nessun dato/nodo nuovo: è solo una vista dei record esistenti.
 */
import React from 'react';
import type { GenericRecord } from './RecordRegistry';

const DAY = 86400000;
const parse = (s?: string | null): number | null => {
  if (!s) return null;
  const t = new Date(s + 'T00:00:00').getTime();
  return isNaN(t) ? null : t;
};
const startOfWeek = (t: number) => { const d = new Date(t); const wd = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); return d.getTime() - wd * DAY; };
const startOfMonth = (t: number) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
const addMonth = (t: number) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); };
const fmtShort = (t: number) => new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
const fmtMonth = (t: number) => new Date(t).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });

/** stato → colore barra. */
const barColor = (status?: string | null, overdue?: boolean): string => {
  const v = (status || '').toLowerCase();
  if (['completat', 'chius', 'ok'].some((k) => v.includes(k))) return '#15803d';       // verde
  if (overdue) return '#dc2626';                                                        // rosso: in ritardo
  if (['corso', 'attesa'].some((k) => v.includes(k))) return '#b45309';                 // ambra
  return '#64748b';                                                                     // pianificata (slate)
};

export const GanttChart: React.FC<{ items: GenericRecord[]; accent?: string }> = ({ items, accent = '#161616' }) => {
  // Solo voci con inizio valido; fine = dateEnd o inizio (barra minima 1 giorno).
  const rows = items
    .map((r) => {
      const s = parse(r.date);
      if (s === null) return null;
      const e = Math.max(parse(r.dateEnd) ?? s, s);
      return { r, s, e: e + DAY }; // +1 giorno: la fine è inclusiva
    })
    .filter((x): x is { r: GenericRecord; s: number; e: number } => !!x)
    .sort((a, b) => a.s - b.s || a.e - b.e);

  const [scale, setScale] = React.useState<'auto' | 'week' | 'month'>('auto');

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dcdcdc] bg-[#fafafa] p-5 text-center text-[12.5px] text-[#9a9a9a]">
        Aggiungi lavorazioni con <b>data di inizio</b> (e fine) nella tabella qui sotto per vederle sul Gantt.
      </div>
    );
  }

  const minT = Math.min(...rows.map((r) => r.s));
  const maxT = Math.max(...rows.map((r) => r.e));
  const spanDays = (maxT - minT) / DAY;
  const useMonths = scale === 'month' || (scale === 'auto' && spanDays > 70);

  // Estremi allineati all'inizio periodo per far combaciare barre e griglia.
  const axisStart = useMonths ? startOfMonth(minT) : startOfWeek(minT);
  const axisEnd = useMonths ? addMonth(startOfMonth(maxT - DAY)) : startOfWeek(maxT - DAY) + 7 * DAY;
  const range = Math.max(axisEnd - axisStart, DAY);

  // Tacche/colonne.
  const ticks: number[] = [];
  if (useMonths) { for (let t = axisStart; t < axisEnd; t = addMonth(t)) ticks.push(t); }
  else { for (let t = axisStart; t < axisEnd; t += 7 * DAY) ticks.push(t); }

  const pxPer = useMonths ? 108 : 62;
  const timelineW = Math.max(ticks.length * pxPer, 280);
  const pct = (t: number) => ((t - axisStart) / range) * 100;
  const today = Date.now();
  const todayIn = today >= axisStart && today <= axisEnd;

  return (
    <div className="rounded-2xl border border-[#ececec] bg-white p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#8a8a8a]">Diagramma di Gantt</span>
        <div className="inline-flex items-center gap-1 bg-[#f3f3f1] rounded-lg p-0.5">
          {(['auto', 'week', 'month'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer border-none ${scale === s ? 'bg-white text-[#161616] shadow-xs' : 'bg-transparent text-[#8a8a8a]'}`}
            >
              {s === 'auto' ? 'Auto' : s === 'week' ? 'Settimane' : 'Mesi'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 150 + timelineW }}>
          {/* Header timeline */}
          <div className="flex items-end">
            <div className="w-[150px] shrink-0" />
            <div className="relative h-6" style={{ width: timelineW }}>
              {ticks.map((t, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-[#f0f0f0]" style={{ left: `${pct(t)}%` }}>
                  <span className="absolute -top-0.5 left-1 text-[10px] font-bold text-[#9a9a9a] whitespace-nowrap">
                    {useMonths ? fmtMonth(t) : fmtShort(t)}
                  </span>
                </div>
              ))}
              {todayIn && <div className="absolute top-0 bottom-0 w-[2px] bg-rose-500/70 z-10" style={{ left: `${pct(today)}%` }} title="Oggi" />}
            </div>
          </div>

          {/* Righe */}
          <div className="flex flex-col gap-1 mt-1">
            {rows.map(({ r, s, e }) => {
              const overdue = e < today && !['completat', 'chius'].some((k) => (r.status || '').toLowerCase().includes(k));
              const col = barColor(r.status, overdue);
              const left = pct(s);
              const width = Math.max(pct(e) - left, 1.2);
              return (
                <div key={r.id} className="flex items-center">
                  <div className="w-[150px] shrink-0 pr-2">
                    <div className="text-[12px] font-bold text-[#161616] truncate leading-tight">{r.title}</div>
                    <div className="text-[10px] text-[#9a9a9a] truncate">{fmtShort(s)}{e - s > DAY + 1 ? ` → ${fmtShort(e - DAY)}` : ''}</div>
                  </div>
                  <div className="relative h-8 rounded-md bg-[#fafafa]" style={{ width: timelineW }}>
                    {/* griglia leggera */}
                    {ticks.map((t, i) => <div key={i} className="absolute top-0 bottom-0 border-l border-[#f4f4f4]" style={{ left: `${pct(t)}%` }} />)}
                    {todayIn && <div className="absolute top-0 bottom-0 w-[2px] bg-rose-500/60" style={{ left: `${pct(today)}%` }} />}
                    <div
                      className="absolute top-1.5 bottom-1.5 rounded-md flex items-center px-2 min-w-[6px] shadow-xs"
                      style={{ left: `${left}%`, width: `${width}%`, background: col }}
                      title={`${r.title}${r.status ? ` · ${r.status}` : ''}`}
                    >
                      {width > 12 && <span className="text-[10px] font-bold text-white truncate">{r.status || ''}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 flex-wrap mt-2.5 text-[10.5px] font-bold text-[#8a8a8a]">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#64748b' }} /> Pianificata</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#b45309' }} /> In corso</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#15803d' }} /> Completata</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#dc2626' }} /> In ritardo</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-[2px] h-3.5 bg-rose-500" /> Oggi</span>
      </div>
    </div>
  );
};
