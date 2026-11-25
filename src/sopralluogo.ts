/**
 * Sopralluoghi + preventivazione dei RILIEVI (feedback periodo di test).
 * Chi va dal cliente: anagrafica → sopralluogo (in agenda) → parametri del rilievo →
 * stima live → PREVENTIVO (nodo quotes, già con firma OTP) → accettato = COMMESSA
 * con le attività del rilievo già generate (QuoteLine.tasks).
 * Nodi: `sopralluoghi/<id>` (Sopralluogo), `rilievoTariffe` (RilievoTariffe, admin/manager).
 */
import type { QuoteLine } from './types';

export type SopralluogoStato = 'programmato' | 'svolto' | 'preventivo' | 'firmato' | 'commessa' | 'perso';
export type Dettaglio = 'base' | 'medio' | 'alto';

export interface Sopralluogo {
  id: string;
  soc: string;                       // società (slug config, oggi 'studio' = Onirico)
  stato: SopralluogoStato;
  clientRecordId?: string | null;    // rubrica
  clientName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;           // immobile
  date?: string | null;
  time?: string | null;
  tecnicoUid?: string | null;        // chi va dal cliente → attività in agenda `sopr-<id>`
  tipologia?: string | null;
  mq?: number | null;
  dettaglio?: Dettaglio;
  servizi?: Record<string, boolean>; // id servizio (RilievoServizio) → incluso
  extra?: { id: string; desc: string; amount: number }[]; // altre voci a corpo
  esigenze?: string | null;          // cosa chiede il cliente
  note?: string | null;
  link?: string | null;              // foto/cartella Drive
  quoteId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: number;
  updatedAt?: number;
  by?: string | null;
}

export interface RilievoServizio {
  id: string;
  label: string;
  unit: 'mq' | 'corpo';
  price: number;        // €/mq oppure € a corpo
  min?: number;         // minimo fatturabile (solo mq)
  tasks: string[];      // attività generate nella commessa / in agenda
  role?: string;        // mansione per l'assegnazione automatica
}
export interface RilievoTariffe {
  servizi: RilievoServizio[];
  dettaglio: Record<Dettaglio, number>; // moltiplicatore sulle voci a mq
  updatedAt?: number;
  by?: string | null;
}

const R = 'Sopralluoghi/Rilievi';
/** Valori di PARTENZA (indicativi): lo studio li sostituisce con i propri da "Tariffe". */
export const DEFAULT_TARIFFE: RilievoTariffe = {
  dettaglio: { base: 1, medio: 1.2, alto: 1.5 },
  servizi: [
    { id: 'metrico', label: 'Rilievo metrico diretto', unit: 'mq', price: 2.5, min: 250, tasks: ['Rilievo metrico in situ'], role: R },
    { id: 'laser', label: 'Rilievo con laser scanner', unit: 'mq', price: 3, min: 400, tasks: ['Laser scanner in situ'], role: R },
    { id: 'nuvola', label: 'Allineamento nuvola di punti', unit: 'mq', price: 1, min: 150, tasks: ['Allineamento nuvola'], role: R },
    { id: 'restituzione', label: 'Restituzione grafica 2D (piante)', unit: 'mq', price: 3, min: 300, tasks: ['Restituzione grafica'], role: 'Architetto' },
    { id: 'prospetti', label: 'Prospetti e sezioni', unit: 'mq', price: 1.5, min: 200, tasks: ['Restituzione prospetti e sezioni'], role: 'Architetto' },
    { id: 'modello3d', label: 'Modello 3D', unit: 'mq', price: 4, min: 500, tasks: ['Modello 3D dal rilievo'], role: 'Architetto' },
    { id: 'materico', label: 'Rilievo materico e del degrado', unit: 'corpo', price: 300, tasks: ['Rilievo materico'], role: R },
    { id: 'termografia', label: 'Indagine termografica', unit: 'corpo', price: 350, tasks: ['Indagine termografica'], role: R },
    { id: 'topografico', label: 'Rilievo topografico plano-altimetrico', unit: 'corpo', price: 600, tasks: ['Rilievo topografico'], role: R },
  ],
};

/** Pacchetti rapidi (richiesta: solo rilievo / rilievo + restituzione / completo). */
export const PACCHETTI: { id: string; label: string; servizi: string[] }[] = [
  { id: 'solo', label: 'Solo rilievo', servizi: ['laser', 'nuvola'] },
  { id: 'restituzione', label: 'Rilievo + restituzione', servizi: ['laser', 'nuvola', 'restituzione', 'prospetti'] },
  { id: 'completo', label: 'Pacchetto completo', servizi: ['laser', 'nuvola', 'restituzione', 'prospetti', 'modello3d', 'materico'] },
];

export const TIPOLOGIE = ['Abitazione', 'Trullo / lamia', 'Masseria', 'Commerciale / ufficio', 'Esterni / terreno', 'Altro'];

export const STATI_SOPR: { id: SopralluogoStato; label: string }[] = [
  { id: 'programmato', label: 'Programmato' },
  { id: 'svolto', label: 'Svolto' },
  { id: 'preventivo', label: 'Preventivo' },
  { id: 'firmato', label: 'Firmato' },
  { id: 'commessa', label: 'Commessa' },
];

export interface RigaStima { id: string; label: string; detail: string; amount: number; tasks: string[]; role?: string }

/** Righe di stima dal sopralluogo (servizi spuntati + voci extra). */
export function stimaRighe(s: Pick<Sopralluogo, 'mq' | 'dettaglio' | 'servizi' | 'extra'>, t: RilievoTariffe): RigaStima[] {
  const mq = Math.max(0, Number(s.mq) || 0);
  const k = t.dettaglio[s.dettaglio || 'base'] || 1;
  const rows: RigaStima[] = [];
  t.servizi.forEach((sv) => {
    if (!s.servizi?.[sv.id]) return;
    let amount: number;
    let detail: string;
    if (sv.unit === 'mq') {
      const raw = mq * sv.price * k;
      amount = Math.max(raw, sv.min || 0);
      detail = `${mq} mq × ${sv.price} €${k !== 1 ? ` × ${k}` : ''}${amount > raw ? ` (minimo ${sv.min} €)` : ''}`;
    } else {
      amount = sv.price;
      detail = 'a corpo';
    }
    rows.push({ id: sv.id, label: sv.label, detail, amount: Math.round(amount), tasks: sv.tasks, role: sv.role });
  });
  (s.extra || []).forEach((e) => {
    if (e.desc?.trim() && Number(e.amount) > 0) rows.push({ id: e.id, label: e.desc.trim(), detail: 'a corpo', amount: Math.round(Number(e.amount)), tasks: [e.desc.trim()] });
  });
  return rows;
}

export const stimaTotale = (rows: RigaStima[]) => rows.reduce((a, r) => a + r.amount, 0);

/** Righe preventivo (QuoteLine) dalle righe di stima: ogni riga porta le sue attività. */
export function righeToQuoteLines(rows: RigaStima[]): QuoteLine[] {
  return rows.map((r, i) => ({
    id: `ql-${Date.now().toString(36)}-${i}`,
    macro: 'progettazione',
    desc: r.label,
    qty: 1,
    unitPrice: r.amount,
    amount: r.amount,
    role: r.role || null,
    tasks: r.tasks,
  }));
}

/** Stato effettivo: preventivo firmato/accettato e commessa prevalgono sul campo salvato. */
export function statoEffettivo(s: Sopralluogo, q?: { status?: string; signedAt?: number | null } | null, taskDone?: boolean): SopralluogoStato {
  if (s.stato === 'perso') return 'perso';
  if (s.projectId) return 'commessa';
  if (q && (q.signedAt || q.status === 'accettato')) return 'firmato';
  if (s.quoteId) return 'preventivo';
  if (s.stato === 'svolto' || taskDone) return 'svolto';
  return 'programmato';
}
