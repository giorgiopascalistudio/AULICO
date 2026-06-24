/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gamification cliente (visione Aulico) — coinvolgimento nel portale.
 * Obiettivi/badge e livello calcolati in modo PURO sui dati GIÀ esistenti
 * (profilo, arredi, moodboard, messaggi, avanzamento progetti): nessun nodo DB
 * nuovo. Usato dal portale cliente (ClientPortalView).
 */

import type { Project, UserProfile } from './types';

export interface ClientObjective {
  id: string;
  label: string;
  hint: string;
  points: number;
  done: boolean;
}

export interface ClientLevel {
  id: string;
  label: string;
  minPoints: number;
  color: string;
}

export const CLIENT_LEVELS: ClientLevel[] = [
  { id: 'nuovo', label: 'Nuovo cliente', minPoints: 0, color: '#a8a29e' },
  { id: 'attivo', label: 'Cliente attivo', minPoints: 30, color: '#b45309' },
  { id: 'coinvolto', label: 'Cliente coinvolto', minPoints: 60, color: '#4338ca' },
  { id: 'ambassador', label: 'Ambassador', minPoints: 90, color: '#059669' },
];

export interface ClientGameInput {
  profile: Pick<UserProfile, 'profileComplete' | 'firstName' | 'lastName' | 'telefono' | 'residenza' | 'photoURL'>;
  projects: Project[];
  furnishingCount: number;     // arredi scelti su tutti i propri progetti
  moodboardElements: number;   // elementi moodboard 3D totali
  messageCount: number;        // messaggi inviati dal cliente
}

export interface ClientGameResult {
  points: number;
  max: number;
  level: ClientLevel;
  next: { level: ClientLevel; remaining: number } | null;
  objectives: ClientObjective[];
  completed: number;
}

/** Calcola obiettivi, punti e livello del cliente (PURA). */
export function clientGame(input: ClientGameInput): ClientGameResult {
  const p = input.profile || ({} as ClientGameInput['profile']);
  const profileDone = !!(p.profileComplete || (p.firstName && p.lastName && p.telefono && p.residenza));
  const hasProject = input.projects.length > 0;
  const hasMilestone = input.projects.some((pr) => {
    const phases = Object.values(pr.phases || {});
    return phases.some((ph: any) => Object.values(ph.tasks || {}).some((t: any) => t.done));
  });

  const objectives: ClientObjective[] = [
    { id: 'profilo', label: 'Completa il profilo', hint: 'Nome, telefono e residenza', points: 20, done: profileDone },
    { id: 'foto', label: 'Aggiungi una foto profilo', hint: 'Personalizza il tuo account', points: 10, done: !!p.photoURL },
    { id: 'progetto', label: 'Hai un progetto attivo', hint: 'Il tuo primo progetto con lo studio', points: 20, done: hasProject },
    { id: 'arredi', label: 'Scegli i primi arredi', hint: 'Seleziona materiali/arredi', points: 15, done: input.furnishingCount > 0 },
    { id: 'moodboard', label: 'Crea la tua moodboard 3D', hint: 'Dai forma alle tue idee', points: 15, done: input.moodboardElements > 0 },
    { id: 'messaggio', label: 'Scrivi allo studio', hint: 'Invia un messaggio dal portale', points: 10, done: input.messageCount > 0 },
    { id: 'milestone', label: 'Primo traguardo di progetto', hint: 'Una fase completata', points: 10, done: hasMilestone },
  ];

  const max = objectives.reduce((s, o) => s + o.points, 0);
  const points = objectives.filter((o) => o.done).reduce((s, o) => s + o.points, 0);
  const completed = objectives.filter((o) => o.done).length;

  let level = CLIENT_LEVELS[0];
  for (const l of CLIENT_LEVELS) if (points >= l.minPoints) level = l;
  const upper = CLIENT_LEVELS.find((l) => l.minPoints > points);
  const next = upper ? { level: upper, remaining: upper.minPoints - points } : null;

  return { points, max, level, next, objectives, completed };
}
