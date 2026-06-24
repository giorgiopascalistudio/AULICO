/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * RBAC Aulico — risoluzione permessi per-società/per-modulo.
 *
 * Modello: ogni utente può avere una `access: AccessMap` con, per società, un
 * `default` e override opzionali `modules[modulo]`. La risoluzione è
 * `modules[modulo] ?? default`.
 *
 * TRANSIZIONE: gli account esistenti non hanno ancora `access`. Finché manca,
 * si usa il **fallback dal ruolo legacy** (`legacyAccess`), così il
 * comportamento attuale resta identico (vecchi ruoli validi finché non rivisti).
 * Quando un admin assegna un `access` esplicito, quello prevale sul fallback.
 *
 * Funzioni PURE: nessun side-effect, nessuna dipendenza da Firebase/React.
 */

import type { AccessLevel, AccessMap, Societa, SocietaAccess, UserProfile, UserRole } from './types';

/** Tutte le società del gruppo, in ordine di presentazione. */
export const SOCIETA: Societa[] = ['studio', 'strategico', 'materico', 'unico', 'holding'];

/** Etichette UI delle società (chiavi codice invariate; "studio" → "Onirico"). */
export const SOCIETA_LABEL: Record<Societa, string> = {
  studio: 'Onirico',
  strategico: 'Strategico',
  materico: 'Materico',
  unico: 'Unico',
  holding: 'Aulico (Holding)',
};

/** Livelli in ordine, per confronti monotòni. */
export const LEVELS: AccessLevel[] = ['none', 'view', 'operate', 'admin'];
const RANK: Record<AccessLevel, number> = { none: 0, view: 1, operate: 2, admin: 3 };

export const LEVEL_LABEL: Record<AccessLevel, string> = {
  none: 'Nessuno',
  view: 'Visualizza',
  operate: 'Opera',
  admin: 'Amministra',
};

export function rankOf(l: AccessLevel | undefined): number {
  return l ? RANK[l] : 0;
}

/** Vero se `level` è almeno `min` (es. atLeast('operate','view') === true). */
export function atLeast(level: AccessLevel | undefined, min: AccessLevel): boolean {
  return rankOf(level) >= rankOf(min);
}

/**
 * Mappa di permessi derivata dal ruolo legacy, usata quando l'utente non ha
 * ancora un `access` esplicito. Replica l'attuale modello role-based:
 * - admin/manager → admin su tutte le società (il vincolo "il manager non crea
 *   admin" resta nelle regole Firebase, non qui).
 * - staff → opera sulle 4 società operative (NIENTE finanza: modulo finance =
 *   none, come oggi canFinance = admin|manager); holding in sola lettura.
 * - cliente/partner → nessun accesso interno (usano il portale).
 */
export function legacyAccess(role: UserRole | undefined): AccessMap {
  switch (role) {
    case 'admin':
    case 'manager': {
      const all: AccessMap = {};
      for (const s of SOCIETA) all[s] = { default: 'admin' };
      return all;
    }
    case 'staff': {
      const map: AccessMap = {};
      for (const s of SOCIETA) {
        if (s === 'holding') map[s] = { default: 'view' };
        else map[s] = { default: 'operate', modules: { finance: 'none' } };
      }
      return map;
    }
    default:
      return {};
  }
}

/** Restituisce la AccessMap effettiva dell'utente (esplicita o fallback ruolo). */
export function effectiveAccess(profile: Pick<UserProfile, 'access' | 'role'> | null | undefined): AccessMap {
  if (!profile) return {};
  if (profile.access && Object.keys(profile.access).length > 0) return profile.access;
  return legacyAccess(profile.role);
}

/**
 * Livello effettivo dell'utente su (società[, modulo]).
 * `modules[modulo] ?? default` della società; società assente ⇒ 'none'.
 */
export function resolveAccess(
  profile: Pick<UserProfile, 'access' | 'role'> | null | undefined,
  societa: Societa,
  modulo?: string,
): AccessLevel {
  const map = effectiveAccess(profile);
  const sa: SocietaAccess | undefined = map[societa];
  if (!sa) return 'none';
  if (modulo && sa.modules && sa.modules[modulo] != null) return sa.modules[modulo];
  return sa.default;
}

export function canView(p: Parameters<typeof resolveAccess>[0], s: Societa, m?: string): boolean {
  return atLeast(resolveAccess(p, s, m), 'view');
}
export function canOperate(p: Parameters<typeof resolveAccess>[0], s: Societa, m?: string): boolean {
  return atLeast(resolveAccess(p, s, m), 'operate');
}
export function canAdmin(p: Parameters<typeof resolveAccess>[0], s: Societa, m?: string): boolean {
  return atLeast(resolveAccess(p, s, m), 'admin');
}

/** Vero se l'utente ha almeno `min` su ALMENO una società (per gate globali). */
export function canAnywhere(
  p: Parameters<typeof resolveAccess>[0],
  min: AccessLevel,
  modulo?: string,
): boolean {
  return SOCIETA.some((s) => atLeast(resolveAccess(p, s, modulo), min));
}
