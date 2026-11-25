/**
 * Modalità manutenzione.
 * - MAINTENANCE = true: l'app è chiusa al pubblico.
 * - TEAM_OPEN = true ("solo team"): entrano comunque admin, manager e staff approvati e gli
 *   account di PROVA (email con "+prova", es. mario+prova1@gmail.com) per i test pratici;
 *   i clienti veri vedono la schermata "in aggiornamento".
 * Per riaprire a tutti: MAINTENANCE = false + push.
 */
export const MAINTENANCE = true;
export const TEAM_OPEN = true;
export const MAINTENANCE_BYPASS = ['giorgio.pascali990@gmail.com'];

export const isTestEmail = (email?: string | null) => /\+prova[^@]*@/i.test(email || '');

/** Prima di sapere il ruolo: passa chi è nella lista, un account di prova o (in solo team) chiunque. */
export const maintenanceAllowsEmail = (email?: string | null) =>
  !MAINTENANCE || MAINTENANCE_BYPASS.includes((email || '').toLowerCase()) || isTestEmail(email);

/** Con il profilo caricato: in "solo team" passa anche il team approvato. */
export const isMaintenanceBlocked = (email?: string | null, profile?: { role?: string | null; status?: string | null } | null) => {
  if (maintenanceAllowsEmail(email)) return false;
  if (TEAM_OPEN && profile && profile.status === 'approved' && ['admin', 'manager', 'staff'].includes(profile.role || '')) return false;
  return true;
};
