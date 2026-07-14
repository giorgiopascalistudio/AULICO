/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Periodo di un report: MESE ('yyyy-mm') oppure SETTIMANA ISO ('yyyy-Www', Lun–Dom).
 * Modello condiviso da tutti i report che si possono fare settimanali o mensili
 * (Centro Marketing, Report di profilo): stessa chiave, stesse etichette, stesso
 * selettore (`src/components/PeriodSelect.tsx`).
 *
 * `Period.ym` è SEMPRE il mese di riferimento (regola ISO: lo decide il giovedì della
 * settimana): i dati che l'app tiene per mese — KPI social, spese marketing — restano
 * leggibili anche dentro un report settimanale.
 */
export const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoOf(new Date());
export const ymNow = () => todayISO().slice(0, 7);
/** 'luglio 2026' */
export const ymLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
};
/** 'lug 2026' */
export const ymShort = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
};
export const prevYm = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 2, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
/** Lunedì della settimana che contiene `d`. */
export const mondayOf = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(x, -((x.getDay() + 6) % 7));
};
/** Numero di settimana ISO: il giovedì della settimana decide l'anno. */
export const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { year: t.getUTCFullYear(), week: Math.ceil(((+t - +y0) / 86400000 + 1) / 7) };
};

export interface Period {
  mode: 'mese' | 'settimana';
  key: string;    // 'yyyy-mm' | 'yyyy-Www' — id del report, unico per periodo
  from: string;   // primo giorno (yyyy-mm-dd)
  to: string;     // ultimo giorno (yyyy-mm-dd)
  ym: string;     // mese di riferimento (KPI e spese, che sono mensili)
  label: string;  // 'luglio 2026' | '6 – 12 lug 2026'
  week?: number;  // numero settimana ISO (solo mode 'settimana')
}

export const monthPeriod = (ym: string): Period => {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m || 1, 0).getDate();
  return { mode: 'mese', key: ym, from: `${ym}-01`, to: `${ym}-${pad(last)}`, ym, label: ymLabel(ym) };
};
export const weekPeriod = (day: Date): Period => {
  const mon = mondayOf(day);
  const sun = addDays(mon, 6);
  const { year, week } = isoWeek(mon);
  const head = mon.getMonth() === sun.getMonth() ? String(mon.getDate()) : mon.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  return {
    mode: 'settimana',
    key: `${year}-W${pad(week)}`,
    from: isoOf(mon),
    to: isoOf(sun),
    ym: isoOf(addDays(mon, 3)).slice(0, 7),
    label: `${head} – ${sun.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    week,
  };
};
/** Passando da mese a settimana: quella di oggi se il mese è quello corrente, altrimenti la prima del mese. */
export const weekIn = (ym: string) => (ym === ymNow() ? new Date() : new Date(`${ym}-01T12:00:00`));
/** Titolo leggibile: 'luglio 2026' oppure 'settimana 6 – 12 lug 2026'. */
export const periodTitle = (p: Period) => (p.mode === 'settimana' ? `settimana ${p.label}` : p.label);
/** Periodo precedente (settimana −7gg oppure mese −1). */
export const prevPeriod = (p: Period): Period =>
  p.mode === 'settimana' ? weekPeriod(addDays(new Date(`${p.from}T12:00:00`), -7)) : monthPeriod(prevYm(p.ym));
/** Periodo successivo. */
export const nextPeriod = (p: Period): Period => {
  if (p.mode === 'settimana') return weekPeriod(addDays(new Date(`${p.from}T12:00:00`), 7));
  const [y, m] = p.ym.split('-').map(Number);
  const d = new Date(y, m || 1, 1);
  return monthPeriod(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
};
