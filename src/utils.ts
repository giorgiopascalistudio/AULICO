/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './types';

// Giorni di permanenza nel Cestino prima del purge automatico (vive qui — e non
// in TrashView — così App può importarlo senza tirare il chunk lazy della vista).
export const TRASH_RETENTION_DAYS = 60;

// Locale corrente per date/numeri. Default italiano; il portale cliente lo
// commuta via setI18nLocale (vedi src/i18n.tsx). Tenuto qui — senza importare
// i18n — per evitare dipendenze circolari (i18n importa utils).
let _intlLocale = 'it-IT';
let _lang: 'it' | 'en' = 'it';

/** Imposta la lingua per i formattatori (date/valuta) e le parole di relDay/DOW. */
export function setI18nLocale(lang: 'it' | 'en'): void {
  _lang = lang;
  _intlLocale = lang === 'en' ? 'en-GB' : 'it-IT';
}

const df = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(_intlLocale, options);

export function isoDate(d: Date | string | number): string {
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function parseISO(s: string): Date {
  if (!s) return new Date(NaN);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function addDays(d: Date | string, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date | string): Date {
  const x = new Date(d);
  const off = (x.getDay() + 6) % 7; // Monday-start adjustment
  x.setDate(x.getDate() - off);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d: Date | string): Date {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), 1);
}

export function sameDay(a: Date | string, b: Date | string): boolean {
  return isoDate(a) === isoDate(b);
}

export function fmtDay(s: string | Date): string {
  if (!s) return '—';
  const parsed = typeof s === 'string' ? parseISO(s) : s;
  if (isNaN(parsed.getTime())) return '—';
  return df({ day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

export function fmtDayLong(d: Date): string {
  if (isNaN(d.getTime())) return '—';
  return df({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function fmtMonthYear(d: Date): string {
  if (isNaN(d.getTime())) return '—';
  return df({ month: 'long', year: 'numeric' }).format(d);
}

export function relDay(s: string): string {
  const t = todayISO();
  const en = _lang === 'en';
  if (s === t) return en ? 'Today' : 'Oggi';
  if (s === isoDate(addDays(new Date(), 1))) return en ? 'Tomorrow' : 'Domani';
  if (s === isoDate(addDays(new Date(), -1))) return en ? 'Yesterday' : 'Ieri';
  return fmtDay(s);
}

const DOW_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DOW_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Etichette giorni-settimana nella lingua corrente (lun-dom). */
export function dowLabels(): string[] {
  return _lang === 'en' ? DOW_EN : DOW_IT;
}

// Retro-compatibilità: DOW resta l'array italiano per il lato studio (che non
// usa l'i18n). I componenti del portale usano dowLabels().
export const DOW = DOW_IT;

/**
 * Sanifica gli URL inseriti dagli utenti prima di usarli come href
 * (whitelist di schema: blocca javascript:, data:, vbscript: → XSS).
 * Ritorna '' se l'URL non è sicuro: usare `safeUrl(u) || '#'` nei render.
 */
export function safeUrl(u?: string | null): string {
  const s = (u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^(mailto:|tel:)/i.test(s)) return s;
  return '';
}

export function eur(n: number | string | null | undefined): string {
  const val = typeof n === 'string' ? parseFloat(n) : (n || 0);
  return new Intl.NumberFormat(_intlLocale, { style: 'currency', currency: 'EUR' }).format(val);
}

export function numIt(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
}

const AV_COLORS = [
  '#2a2a2a', // deep charcoal
  '#4a5568', // grayish blue
  '#2d3748', // slate 
  '#1a202c', // darker slate
  '#2c5282', // navy
  '#2b6cb0', // blue
  '#4c51bf', // indigo
  '#2c7a7b', // teal
  '#2f855a'  // forest green
];

export function avColor(name?: string | null): string {
  const s = name || '?';
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return AV_COLORS[h % AV_COLORS.length];
}

export function initials(name?: string | null): string {
  const p = (name || '?').trim().split(/\s+/);
  if (!p.length || !p[0]) return '?';
  const first = p[0][0] || '';
  const last = p.length > 1 ? (p[p.length - 1][0] || '') : '';
  return (first + last).toUpperCase() || '?';
}

export function occursOn(t: Task, iso: string): boolean {
  if (!t.date || iso < t.date) return false;
  const f = t.frequency || 'once';
  if (f === 'once') return iso === t.date;
  if (f === 'daily') return true;
  
  const a = parseISO(t.date);
  const d = parseISO(iso);
  if (isNaN(a.getTime()) || isNaN(d.getTime())) return false;
  
  const diffDays = Math.round((d.getTime() - a.getTime()) / 86400000);
  if (f === 'weekly') return diffDays % 7 === 0;
  if (f === 'monthly') {
    const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === Math.min(a.getDate(), lastDayOfMonth);
  }
  return false;
}

export function taskDoneOn(t: Task, iso: string): boolean {
  const f = t.frequency || 'once';
  if (f === 'once') return !!t.done;
  return !!(t.completions && t.completions[iso]);
}

/**
 * Normalizza `forwardedTo` di una MatericoRequest in elenco di uid.
 * Gestisce sia la nuova forma a mappa `{uid:true}` sia l'array legacy `string[]`.
 */
export function forwardedUids(forwardedTo?: Record<string, boolean> | string[] | null): string[] {
  if (!forwardedTo) return [];
  if (Array.isArray(forwardedTo)) return forwardedTo.filter(Boolean);
  return Object.keys(forwardedTo).filter((k) => forwardedTo[k]);
}

/** True se la richiesta è stata inoltrata al partner `uid` (mappa o array legacy). */
export function isForwardedTo(forwardedTo: Record<string, boolean> | string[] | null | undefined, uid: string): boolean {
  if (!forwardedTo || !uid) return false;
  if (Array.isArray(forwardedTo)) return forwardedTo.includes(uid);
  return !!forwardedTo[uid];
}
