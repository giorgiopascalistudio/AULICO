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
  // ===================== TEAM =====================
  // --- Produttività ---
  { id: 'task_in_tempo', label: 'Task completato nei tempi', points: 5, category: 'Produttività', audience: 'team' },
  { id: 'task_anticipo', label: 'Task completato in anticipo', points: 8, category: 'Produttività', audience: 'team' },
  { id: 'pratica_chiusa', label: 'Pratica/fase chiusa', points: 15, category: 'Produttività', audience: 'team' },
  { id: 'preventivo_accettato', label: 'Preventivo accettato dal cliente', points: 20, category: 'Produttività', audience: 'team' },
  { id: 'obiettivo_settimanale', label: 'Obiettivo settimanale raggiunto', points: 10, category: 'Produttività', audience: 'team' },
  { id: 'sopralluogo_eseguito', label: 'Sopralluogo eseguito', points: 6, category: 'Produttività', audience: 'team' },
  { id: 'computo_consegnato', label: 'Computo metrico consegnato', points: 8, category: 'Produttività', audience: 'team' },
  { id: 'pratica_protocollata', label: 'Pratica protocollata in Comune/Ente', points: 12, category: 'Produttività', audience: 'team' },
  { id: 'progetto_consegnato', label: 'Progetto/elaborato consegnato', points: 14, category: 'Produttività', audience: 'team' },
  // --- Qualità ---
  { id: 'zero_rilievi', label: 'Consegna senza rilievi/correzioni', points: 10, category: 'Qualità', audience: 'team' },
  { id: 'cliente_soddisfatto', label: 'Feedback cliente positivo', points: 12, category: 'Qualità', audience: 'team' },
  { id: 'elaborato_approvato_subito', label: 'Elaborato approvato alla prima', points: 9, category: 'Qualità', audience: 'team' },
  { id: 'recensione_positiva', label: 'Recensione pubblica positiva', points: 18, category: 'Qualità', audience: 'team' },
  { id: 'rilievo_qualita', label: 'Errore/rifacimento richiesto', points: -8, category: 'Qualità', audience: 'team' },
  { id: 'errore_grave', label: 'Errore grave su elaborato/pratica', points: -15, category: 'Qualità', audience: 'team' },
  { id: 'reclamo_cliente', label: 'Reclamo cliente', points: -12, category: 'Qualità', audience: 'team' },
  // --- Commerciale / Relazione ---
  { id: 'lead_portato', label: 'Lead/opportunità portata', points: 15, category: 'Commerciale', audience: 'team' },
  { id: 'lead_convertito', label: 'Lead convertito in commessa', points: 25, category: 'Commerciale', audience: 'team' },
  { id: 'referral_cliente', label: 'Referral da cliente esistente', points: 12, category: 'Commerciale', audience: 'team' },
  { id: 'upsell', label: 'Servizio aggiuntivo venduto (upsell)', points: 16, category: 'Commerciale', audience: 'team' },
  // --- Puntualità / Presenza ---
  { id: 'sempre_puntuale', label: 'Settimana senza ritardi', points: 4, category: 'Puntualità', audience: 'team' },
  { id: 'task_scaduto', label: 'Task scaduto non gestito', points: -5, category: 'Puntualità', audience: 'team' },
  { id: 'ritardo_consegna', label: 'Ritardo nella consegna', points: -8, category: 'Puntualità', audience: 'team' },
  { id: 'assenza_ingiustificata', label: 'Assenza ingiustificata', points: -10, category: 'Puntualità', audience: 'team' },
  // --- Collaborazione ---
  { id: 'aiuto_collega', label: 'Aiuto concreto a un collega', points: 6, category: 'Collaborazione', audience: 'team' },
  { id: 'mentoring', label: 'Affiancamento/mentoring junior', points: 10, category: 'Collaborazione', audience: 'team' },
  { id: 'condivisione_conoscenza', label: 'Condivisione know-how/procedura', points: 7, category: 'Collaborazione', audience: 'team' },
  { id: 'riunione_costruttiva', label: 'Contributo utile in riunione', points: 3, category: 'Collaborazione', audience: 'team' },
  // --- Iniziativa ---
  { id: 'proposta_miglioramento', label: 'Proposta di miglioramento adottata', points: 12, category: 'Iniziativa', audience: 'team' },
  { id: 'automazione_introdotta', label: 'Automazione/processo introdotto', points: 15, category: 'Iniziativa', audience: 'team' },
  { id: 'iniziativa_extra', label: 'Iniziativa oltre i compiti assegnati', points: 8, category: 'Iniziativa', audience: 'team' },
  // --- Sicurezza & Compliance ---
  { id: 'formazione_completata', label: 'Corso/formazione completata', points: 10, category: 'Sicurezza & Compliance', audience: 'team' },
  { id: 'near_miss_segnalato', label: 'Near-miss/rischio segnalato', points: 6, category: 'Sicurezza & Compliance', audience: 'team' },
  { id: 'privacy_rispettata', label: 'Procedura privacy/GDPR rispettata', points: 4, category: 'Sicurezza & Compliance', audience: 'team' },
  { id: 'violazione_procedura', label: 'Violazione procedura/sicurezza', points: -15, category: 'Sicurezza & Compliance', audience: 'team' },
  // --- Amministrazione ---
  { id: 'fattura_puntuale', label: 'Fattura emessa puntualmente', points: 4, category: 'Amministrazione', audience: 'team' },
  { id: 'scadenza_rispettata', label: 'Scadenza amministrativa rispettata', points: 5, category: 'Amministrazione', audience: 'team' },
  { id: 'documentazione_ordinata', label: 'Documentazione ordinata e completa', points: 4, category: 'Amministrazione', audience: 'team' },

  // ===================== PARTNER (subappaltatori) =====================
  // --- Puntualità ---
  { id: 'sal_in_tempo', label: 'SAL/consegna nei tempi', points: 10, category: 'Puntualità', audience: 'partner' },
  { id: 'consegna_anticipata', label: 'Consegna in anticipo', points: 14, category: 'Puntualità', audience: 'partner' },
  { id: 'cantiere_in_orario', label: 'Squadra in cantiere puntuale', points: 4, category: 'Puntualità', audience: 'partner' },
  { id: 'ritardo_lieve', label: 'Ritardo lieve (entro tolleranza)', points: -4, category: 'Puntualità', audience: 'partner' },
  { id: 'ritardo_grave', label: 'Ritardo grave / penale', points: -12, category: 'Puntualità', audience: 'partner' },
  // --- Precisione / Qualità ---
  { id: 'lavoro_conforme', label: 'Lavorazione conforme (no contestazioni)', points: 10, category: 'Precisione', audience: 'partner' },
  { id: 'zero_difetti', label: 'Consegna a zero difetti', points: 12, category: 'Precisione', audience: 'partner' },
  { id: 'collaudo_superato', label: 'Collaudo/verifica superata alla prima', points: 14, category: 'Precisione', audience: 'partner' },
  { id: 'non_conformita', label: 'Non conformità rilevata', points: -10, category: 'Precisione', audience: 'partner' },
  { id: 'rifacimento_richiesto', label: 'Rifacimento richiesto', points: -14, category: 'Precisione', audience: 'partner' },
  // --- Sicurezza in cantiere ---
  { id: 'cantiere_pulito', label: 'Cantiere pulito e ordinato', points: 6, category: 'Sicurezza cantiere', audience: 'partner' },
  { id: 'dpi_squadra', label: 'DPI indossati da tutta la squadra', points: 6, category: 'Sicurezza cantiere', audience: 'partner' },
  { id: 'psc_rispettato', label: 'PSC/piano sicurezza rispettato', points: 8, category: 'Sicurezza cantiere', audience: 'partner' },
  { id: 'incidente_cantiere', label: 'Incidente/infortunio in cantiere', points: -20, category: 'Sicurezza cantiere', audience: 'partner' },
  { id: 'violazione_sicurezza', label: 'Violazione norme di sicurezza', points: -15, category: 'Sicurezza cantiere', audience: 'partner' },
  // --- Documentazione impresa ---
  { id: 'doc_in_regola', label: 'Documentazione/impresa in regola', points: 5, category: 'Documentazione', audience: 'partner' },
  { id: 'durc_aggiornato', label: 'DURC/visure aggiornati', points: 5, category: 'Documentazione', audience: 'partner' },
  { id: 'rapportino_puntuale', label: 'Rapportini compilati puntualmente', points: 4, category: 'Documentazione', audience: 'partner' },
  { id: 'doc_scaduto', label: 'Documento scaduto/non valido', points: -10, category: 'Documentazione', audience: 'partner' },
  // --- Collaborazione ---
  { id: 'coordinamento_efficace', label: 'Coordinamento efficace con la DL', points: 6, category: 'Collaborazione', audience: 'partner' },
  { id: 'disponibilita_extra', label: 'Disponibilità extra (urgenze)', points: 8, category: 'Collaborazione', audience: 'partner' },
  { id: 'comunicazione_tempestiva', label: 'Comunicazione tempestiva di problemi', points: 5, category: 'Collaborazione', audience: 'partner' },

  // ===================== ENTRAMBI =====================
  { id: 'manual', label: 'Assegnazione manuale', points: 0, category: 'Altro', audience: 'both' },
];

export function catalogFor(audience: 'team' | 'partner'): PointActivity[] {
  return POINT_CATALOG.filter((a) => a.audience === audience || a.audience === 'both');
}

export function activityById(id: string): PointActivity | undefined {
  return POINT_CATALOG.find((a) => a.id === id);
}

/** Valore economico ("erogato") di un'attività: esplicito se presente, altrimenti €10 per punto. */
export function activityValue(a?: PointActivity | null): number {
  if (!a) return 0;
  return a.value != null ? a.value : Math.max(0, a.points) * 10;
}

/** Punti automatici per un task senza attività di catalogo, in base alla priorità. */
export const PRIORITY_POINTS: Record<string, number> = { urgente: 5, alta: 4, media: 2, bassa: 1 };

/** Totale "erogato" (€) di un collaboratore dai suoi eventi punti. */
export function erogatoOf(events: PointEvent[], uid: string): number {
  return events.filter((e) => e.uid === uid).reduce((s, e) => s + (e.value || 0), 0);
}

/** Campi che concorrono alla completezza del profilo (incentiva la banca dati aggiornata). */
export const PROFILE_FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'photoURL', label: 'Foto' },
  { key: 'title', label: 'Ruolo/qualifica' },
  { key: 'functions', label: 'Mansioni' },
];
/** % completezza profilo + campi mancanti. */
export function profileCompleteness(u: any): { pct: number; done: number; total: number; missing: string[] } {
  const has = (k: string) => {
    const v = u?.[k];
    if (k === 'functions') return Array.isArray(v) ? v.length > 0 : !!v && Object.keys(v).length > 0;
    return v != null && String(v).trim() !== '';
  };
  const missing = PROFILE_FIELDS.filter((f) => !has(f.key)).map((f) => f.label);
  const done = PROFILE_FIELDS.length - missing.length;
  return { pct: Math.round((done / PROFILE_FIELDS.length) * 100), done, total: PROFILE_FIELDS.length, missing };
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
