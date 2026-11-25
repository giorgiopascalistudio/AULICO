/**
 * Modalità manutenzione: con MAINTENANCE = true l'app è bloccata per tutti
 * tranne il proprietario (MAINTENANCE_BYPASS). Per riaprire: false + push.
 */
export const MAINTENANCE = true;
export const MAINTENANCE_BYPASS = ['giorgio.pascali990@gmail.com'];

export const isMaintenanceBlocked = (email?: string | null) =>
  MAINTENANCE && !MAINTENANCE_BYPASS.includes((email || '').toLowerCase());
