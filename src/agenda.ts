/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Agenda — Aree del Vivere, identità società (pallino) e ricorrenza appuntamenti.
 * Il colore RIEMPIE il blocco in base all'Area del Vivere; la società resta un
 * PALLINO (scelta utente, coerente con la regola "colore società solo nei pallini").
 */
import type { Appointment } from './types';

export type LifeArea = 'personale' | 'familiare' | 'sociale' | 'professionale';

/** Le 4 Aree del Vivere: colore riempimento tenue (fill), bordo/testo, pallino. */
export const AREA_META: Record<LifeArea, { label: string; dot: string; fill: string; border: string; text: string }> = {
  personale:     { label: 'Personale',     dot: '#2563eb', fill: '#eff6ff', border: '#2563eb', text: '#1e3a8a' }, // Blu
  familiare:     { label: 'Familiare',     dot: '#0284c7', fill: '#f0f9ff', border: '#0ea5e9', text: '#075985' }, // Azzurro
  sociale:       { label: 'Sociale',       dot: '#0891b2', fill: '#ecfeff', border: '#06b6d4', text: '#155e75' }, // Celeste
  professionale: { label: 'Professionale', dot: '#475569', fill: '#f6f7f9', border: '#64748b', text: '#334155' }, // Neutro → la società la porta il pallino
};
export const LIFE_AREAS: LifeArea[] = ['personale', 'familiare', 'sociale', 'professionale'];

/**
 * Società per il PALLINO identità in agenda. Palette dal documento (docs/V2/agg.txt):
 * Onirico → Verde, Strategico → Rosso, Materico → Arancione, Unico → Giallo,
 * Fantastico → Viola. NB: solo per il pallino d'agenda (il resto dell'app usa
 * COMPANY_COLOR come unica fonte, vedi §10).
 */
export const SOC_META: Record<string, { label: string; color: string }> = {
  studio:     { label: 'Onirico',    color: '#16a34a' }, // Verde
  strategico: { label: 'Strategico', color: '#dc2626' }, // Rosso (scala del rosso)
  materico:   { label: 'Materico',   color: '#ea580c' }, // Arancione
  unico:      { label: 'Unico',      color: '#eab308' }, // Giallo
  fantastico: { label: 'Fantastico', color: '#7c3aed' }, // Viola
};
export const SOC_LIST: string[] = ['studio', 'strategico', 'materico', 'unico', 'fantastico'];

/** Stile riempimento blocco appuntamento in base all'Area (fallback: verde legacy). */
export const apptFillStyle = (a: Pick<Appointment, 'area'>): { backgroundColor: string; borderColor: string; color: string } => {
  const m = a.area ? AREA_META[a.area] : null;
  return m
    ? { backgroundColor: m.fill, borderColor: m.border, color: m.text }
    : { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#064e3b' };
};

/** Colore del pallino società (o null se non impostata / sconosciuta). */
export const apptSocDot = (a: Pick<Appointment, 'societa'>): string | null =>
  a.societa && SOC_META[a.societa] ? SOC_META[a.societa].color : null;

/**
 * Riempimento blocco agenda per SOCIETÀ (scelta utente 15 lug: colore blocco = società,
 * pallino = urgenza — inversione dello schema precedente area/pallino-società).
 * Senza società → neutro grigio.
 */
export const socFillStyle = (societa?: string | null): { backgroundColor: string; borderColor: string; color: string } => {
  const m = societa ? SOC_META[societa] : null;
  return m
    ? { backgroundColor: `${m.color}1c`, borderColor: m.color, color: '#161616' }
    : { backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#161616' };
};

/** Colore del pallino URGENZA (priorità di task e appuntamenti) in agenda. */
export const PRIO_COLOR: Record<string, string> = {
  urgente: '#e11d48',
  alta: '#f97316',
  media: '#f59e0b',
  bassa: '#10b981',
};

/** Minuti dell'ora "hh:mm" (0..1440), senza clamp. */
export const hhmmToMinutes = (hhmm?: string | null): number | null => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h)) return null;
  return (h || 0) * 60 + (m || 0);
};

/** Durata in minuti dell'appuntamento (endTime−time), default se assente/incoerente. */
export const apptDurationMin = (a: Pick<Appointment, 'time' | 'endTime'>, fallback = 45): number => {
  const s = hhmmToMinutes(a.time);
  const e = hhmmToMinutes(a.endTime);
  if (s == null || e == null || e <= s) return fallback;
  return e - s;
};

/**
 * L'appuntamento cade nel giorno `iso`? Gestisce ricorrenza (daily/weekly/monthly,
 * ogni N, until) ed eccezioni. Senza recurrence → solo il giorno esatto.
 */
export const apptOccursOn = (a: Appointment, iso: string): boolean => {
  if (a.exceptions && a.exceptions[iso]) return false;
  if (!a.recurrence) return a.date === iso;
  if (iso < a.date) return false;
  const r = a.recurrence;
  if (r.until && iso > r.until) return false;
  const start = new Date(a.date + 'T00:00:00');
  const cur = new Date(iso + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(cur.getTime())) return false;
  const interval = Math.max(1, r.interval || 1);
  if (r.freq === 'daily') {
    const diff = Math.round((cur.getTime() - start.getTime()) / 86400000);
    return diff >= 0 && diff % interval === 0;
  }
  if (r.freq === 'weekly') {
    const diff = Math.round((cur.getTime() - start.getTime()) / 86400000);
    return diff >= 0 && diff % (7 * interval) === 0;
  }
  if (r.freq === 'monthly') {
    const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    if (cur.getDate() !== Math.min(start.getDate(), lastDay)) return false;
    const months = (cur.getFullYear() - start.getFullYear()) * 12 + (cur.getMonth() - start.getMonth());
    return months >= 0 && months % interval === 0;
  }
  return false;
};

/** Etichetta breve ricorrenza per badge (es. "Ogni sett."). */
export const recurrenceLabel = (r?: ApptRecurrenceLike | null): string | null => {
  if (!r) return null;
  const n = Math.max(1, r.interval || 1);
  const base = r.freq === 'daily' ? 'giorno' : r.freq === 'weekly' ? 'sett.' : 'mese';
  return n === 1 ? `Ogni ${base}` : `Ogni ${n} ${r.freq === 'daily' ? 'giorni' : r.freq === 'weekly' ? 'sett.' : 'mesi'}`;
};
type ApptRecurrenceLike = { freq: 'daily' | 'weekly' | 'monthly'; interval: number };
