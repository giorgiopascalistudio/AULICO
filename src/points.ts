/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Incentivi & Point system (visione Aulico) — funzioni PURE.
 * Punti per **team interno** (produttività/qualità → compenso) e
 * **subappaltatori** (puntualità/precisione → affidabilità). Ranking + fasce bonus.
 * Nessuna dipendenza da Firebase/React.
 */

import type { PointActivity, PointEvent, BonusTier, PointAudience } from './types';

/**
 * Catalogo attività a punti (default override-abili in futuro). Insieme di base
 * categorizzato; estendibile. `points` negativo = penalità (precisione/affidabilità).
 */
export const POINT_CATALOG: PointActivity[] = [
  // --- Team: Produttività ---
  { id: 'task_in_tempo', label: 'Task completato nei tempi', points: 5, category: 'Produttività', audience: 'team' },
  { id: 'task_anticipo', label: 'Task completato in anticipo', points: 8, category: 'Produttività', audience: 'team' },
  { id: 'pratica_chiusa', label: 'Pratica/fase chiusa', points: 15, category: 'Produttività', audience: 'team' },
  { id: 'preventivo_accettato', label: 'Preventivo accettato dal cliente', points: 20, category: 'Produttività', audience: 'team' },
  // --- Team: Qualità ---
  { id: 'zero_rilievi', label: 'Consegna senza rilievi/correzioni', points: 10, category: 'Qualità', audience: 'team' },
  { id: 'cliente_soddisfatto', label: 'Feedback cliente positivo', points: 12, category: 'Qualità', audience: 'team' },
  { id: 'rilievo_qualita', label: 'Errore/rifacimento richiesto', points: -8, category: 'Qualità', audience: 'team' },
  // --- Team: Relazione/varie ---
  { id: 'lead_portato', label: 'Lead/opportunità portata', points: 15, category: 'Relazione', audience: 'team' },
  { id: 'task_scaduto', label: 'Task scaduto non gestito', points: -5, category: 'Puntualità', audience: 'team' },
  // --- Partner (subappaltatori): Puntualità ---
  { id: 'sal_in_tempo', label: 'SAL/consegna nei tempi', points: 10, category: 'Puntualità', audience: 'partner' },
  { id: 'ritardo_lieve', label: 'Ritardo lieve (entro tolleranza)', points: -4, category: 'Puntualità', audience: 'partner' },
  { id: 'ritardo_grave', label: 'Ritardo grave / penale', points: -12, category: 'Puntualità', audience: 'partner' },
  // --- Partner: Precisione/Qualità ---
  { id: 'lavoro_conforme', label: 'Lavorazione conforme (no contestazioni)', points: 10, category: 'Precisione', audience: 'partner' },
  { id: 'non_conformita', label: 'Non conformità rilevata', points: -10, category: 'Precisione', audience: 'partner' },
  { id: 'doc_in_regola', label: 'Documentazione/impresa in regola', points: 5, category: 'Precisione', audience: 'partner' },
  // --- Entrambi ---
  { id: 'manual', label: 'Assegnazione manuale', points: 0, category: 'Altro', audience: 'both' },
];

export function catalogFor(audience: 'team' | 'partner'): PointActivity[] {
  return POINT_CATALOG.filter((a) => a.audience === audience || a.audience === 'both');
}

export function activityById(id: string): PointActivity | undefined {
  return POINT_CATALOG.find((a) => a.id === id);
}

/** Fasce bonus (ranking). minPoints crescente; l'ultima ≤ punti vince. */
export const BONUS_TIERS: BonusTier[] = [
  { id: 'base', label: 'Base', minPoints: 0, bonusPct: 0, color: '#a8a29e' },
  { id: 'bronzo', label: 'Bronzo', minPoints: 50, bonusPct: 2, perk: 'Riconoscimento', color: '#b45309' },
  { id: 'argento', label: 'Argento', minPoints: 120, bonusPct: 4, perk: 'Priorità ferie', color: '#94a3b8' },
  { id: 'oro', label: 'Oro', minPoints: 250, bonusPct: 7, perk: 'Bonus + formazione', color: '#d97706' },
  { id: 'platino', label: 'Platino', minPoints: 450, bonusPct: 10, perk: 'Bonus massimo', color: '#4338ca' },
];

const inPeriod = (date: string, from?: string, to?: string) =>
  (!from || date >= from) && (!to || date <= to);

/** Somma punti di un utente (opz. in un periodo). */
export function totalPoints(events: PointEvent[], uid: string, from?: string, to?: string): number {
  return events.filter((e) => e.uid === uid && inPeriod(e.date, from, to)).reduce((s, e) => s + (e.points || 0), 0);
}

export interface LeaderRow {
  uid: string;
  points: number;
  positives: number;
  negatives: number;
  events: number;
}

/** Classifica per gli uid dati (ordinata per punti decrescenti), opz. in un periodo. */
export function leaderboard(events: PointEvent[], uids: string[], from?: string, to?: string): LeaderRow[] {
  return uids.map((uid) => {
    const mine = events.filter((e) => e.uid === uid && inPeriod(e.date, from, to));
    const positives = mine.filter((e) => (e.points || 0) > 0).reduce((s, e) => s + e.points, 0);
    const negatives = mine.filter((e) => (e.points || 0) < 0).reduce((s, e) => s + e.points, 0);
    return { uid, points: positives + negatives, positives, negatives, events: mine.length };
  }).sort((a, b) => b.points - a.points);
}

/** Fascia bonus corrente per un totale punti. */
export function tierFor(points: number): BonusTier {
  let t = BONUS_TIERS[0];
  for (const tier of BONUS_TIERS) if (points >= tier.minPoints) t = tier;
  return t;
}

/** Fascia successiva + punti mancanti (null se già al massimo). */
export function nextTier(points: number): { tier: BonusTier; remaining: number } | null {
  const upper = BONUS_TIERS.find((t) => t.minPoints > points);
  return upper ? { tier: upper, remaining: upper.minPoints - points } : null;
}

/**
 * Punteggio di affidabilità del partner 0–100 (precisione/puntualità):
 * parte da 70 e si muove con il saldo punti partner, con clamp.
 */
export function reliabilityScore(events: PointEvent[], uid: string): number {
  const pts = totalPoints(events, uid);
  return Math.max(0, Math.min(100, 70 + pts));
}
