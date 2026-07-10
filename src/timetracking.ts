/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Time Tracking — motore puro dei cronometri e del TEMPO MEDIO per tipo attività.
 * La media si ricalcola dallo STORICO recente (finestra mobile), così un singolo
 * lavoro più lungo/corto non la sposta, ma un trend sì (richiesta utente).
 */
import type { TimeEntry } from './types';

/** Finestra mobile di default: quante ultime rilevazioni pesano sulla media. */
export const AVG_WINDOW = 8;

/** Normalizza la chiave-tipo (case/spazi) per raggruppare le rilevazioni. */
export const normTipo = (s?: string | null): string => (s || '').trim().toLowerCase();

/** Rilevazioni chiuse (con minuti) di un dato tipo, dalla più recente. */
export const closedForTipo = (entries: TimeEntry[], tipo: string): TimeEntry[] => {
  const key = normTipo(tipo);
  if (!key) return [];
  return entries
    .filter((e) => e.end != null && (e.minutes ?? 0) > 0 && normTipo(e.tipo) === key)
    .sort((a, b) => (b.end || 0) - (a.end || 0));
};

/**
 * Tempo medio (minuti) del tipo, sulle ultime `window` rilevazioni chiuse.
 * Ritorna null se non ci sono rilevazioni → nessuna stima suggerita.
 */
export const avgMinutesForTipo = (entries: TimeEntry[], tipo: string, window = AVG_WINDOW): number | null => {
  const list = closedForTipo(entries, tipo).slice(0, window);
  if (!list.length) return null;
  const sum = list.reduce((s, e) => s + (e.minutes || 0), 0);
  return Math.round(sum / list.length);
};

/** Numero di rilevazioni chiuse considerate per la media di un tipo. */
export const countForTipo = (entries: TimeEntry[], tipo: string, window = AVG_WINDOW): number =>
  Math.min(closedForTipo(entries, tipo).length, window);

/** Cronometro in corso dell'utente (end==null), se presente. */
export const runningEntry = (entries: TimeEntry[], uid: string): TimeEntry | null =>
  entries.find((e) => e.whoUid === uid && e.end == null) || null;

/** Minuti totali già registrati su un task (somma rilevazioni chiuse). */
export const minutesForTask = (entries: TimeEntry[], taskId: string): number =>
  entries.filter((e) => e.taskId === taskId && e.end != null).reduce((s, e) => s + (e.minutes || 0), 0);

/** "3h 45m" / "45m" / "2h". */
export const fmtDuration = (minutes?: number | null): string => {
  if (minutes == null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

/** "01:23:45" per il cronometro live (da millisecondi trascorsi). */
export const fmtStopwatch = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/** Aggregazione per collaboratore e per tipo su un intervallo (per i report). */
export interface TimeAgg {
  totalMinutes: number;
  byTipo: Record<string, { minutes: number; count: number; avg: number }>;
  byWho: Record<string, { minutes: number; count: number; name: string }>;
}
export const aggregate = (entries: TimeEntry[], fromMs?: number, toMs?: number): TimeAgg => {
  const out: TimeAgg = { totalMinutes: 0, byTipo: {}, byWho: {} };
  entries
    .filter((e) => e.end != null && (e.minutes ?? 0) > 0 && (fromMs == null || (e.end || 0) >= fromMs) && (toMs == null || (e.end || 0) <= toMs))
    .forEach((e) => {
      const min = e.minutes || 0;
      out.totalMinutes += min;
      const tk = normTipo(e.tipo) || '—';
      const t = (out.byTipo[tk] = out.byTipo[tk] || { minutes: 0, count: 0, avg: 0 });
      t.minutes += min; t.count += 1; t.avg = Math.round(t.minutes / t.count);
      const w = (out.byWho[e.whoUid] = out.byWho[e.whoUid] || { minutes: 0, count: 0, name: e.whoName || '' });
      w.minutes += min; w.count += 1; if (e.whoName) w.name = e.whoName;
    });
  return out;
};
