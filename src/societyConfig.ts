/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Aulico V2 — registry dichiarativo società → sezioni.
 *
 * Idea: la navigazione NON è una sidebar statica per funzione, ma è guidata dai
 * dati di questo registry + dalle autorizzazioni dell'utente (`src/access.ts`).
 * Ogni società dichiara le proprie sezioni (con sotto-sezioni via `parent`);
 * alcune sezioni sono **condivise di gruppo** (`shared`, sotto la "società"
 * `holding` = Aulico). Aggiungere/spostare una sezione = modificare questo file,
 * non il cablaggio in App.tsx.
 *
 * Le sezioni `kind:'view'` montano una vista ESISTENTE tramite `legacyRoute`
 * (+ eventuali `preset`), così la Fase 1 è un'ossatura sopra l'app funzionante.
 * Le sezioni non ancora costruite sono `kind:'placeholder'`.
 *
 * Le liste definitive per ciascuna società verranno affinate dall'utente: questo
 * è un seed coerente con i documenti `docs/V2`.
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid, Calendar, Layers, Target, Megaphone, DollarSign, Briefcase, Users,
  BookUser, ScrollText, Trash2, Inbox, FileText, Scale, Code2, Network, Building2,
  Truck, UserPlus, BarChart3, ListChecks, FileSignature, MapPin,
  Bell, Calculator, Award, Lock, Gift,
} from 'lucide-react';
import type { AccessLevel, Societa, UserProfile, Project, Task, Appointment, ClientRequest } from './types';
import { SOCIETA_LABEL, canView } from './access';

/** Divisioni "operative" (società con progetti/finanza già esistenti). */
export type Division = 'studio' | 'strategico' | 'materico' | 'unico';

/** Mappa Societa → Division (le società senza progetti restituiscono null). */
export function divisionOf(s: Societa): Division | null {
  return s === 'studio' || s === 'strategico' || s === 'materico' || s === 'unico' ? s : null;
}

// ---- Slug per il routing hash `#<slug>/<sezione>` -------------------------
const SLUG_BY_SOCIETA: Record<Societa, string> = {
  studio: 'onirico',
  strategico: 'strategico',
  materico: 'materico',
  unico: 'unico',
  fantastico: 'fantastico',
  holding: 'aulico',
};
const SOCIETA_BY_SLUG: Record<string, Societa> = Object.fromEntries(
  Object.entries(SLUG_BY_SOCIETA).map(([s, slug]) => [slug, s as Societa]),
) as Record<string, Societa>;

export function societaSlug(s: Societa): string { return SLUG_BY_SOCIETA[s]; }
export function slugToSocieta(slug: string): Societa | null {
  // accetta sia lo slug ('onirico') sia la chiave codice ('studio')
  return SOCIETA_BY_SLUG[slug] ?? ((slug in SLUG_BY_SOCIETA) ? (slug as Societa) : null);
}

/** Colore identificativo società (schema §10 CLAUDE.md). */
export const SOCIETY_COLOR: Record<Societa, string> = {
  studio: '#161616',
  strategico: '#b45309',
  materico: '#c2410c',
  unico: '#4338ca',
  fantastico: '#0d9488', // teal
  holding: '#3f3f46',    // zinc (Aulico, gruppo)
};

// ---- Tipi di configurazione ----------------------------------------------
// 'group' = SOTTO-CATEGORIA contenitore (livello 2): non naviga, in sidebar si
// espande per mostrare le sue voci foglia (sezioni con `parent` = id del group).
export type SectionKind = 'dashboard' | 'view' | 'placeholder' | 'group';

export interface SectionPreset {
  division?: Division;
  finStartTab?: 'preventivi' | 'statistiche' | null;
  peopleTab?: 'team' | 'clienti' | 'partner';
  financeLock?: Division;                 // limita la Contabilità a una sola società (no selettore/consolidato)
  crmTab?: 'dashboard' | 'pipeline' | 'fornitori' | 'clienti'; // tab iniziale del CRM
}

export interface SectionConfig {
  id: string;                 // univoco nella società
  label: string;
  icon: LucideIcon;
  parent?: string;            // id della sezione padre (→ sotto-sezione)
  shared?: boolean;           // dato di gruppo (non filtrato per società)
  module: string;             // chiave RBAC passata a resolveAccess
  minLevel?: AccessLevel;     // default 'view'
  kind?: SectionKind;         // default 'view'
  view?: string;              // id componente standalone V2 (renderView → case 'sview')
  legacyRoute?: string;       // route esistente in renderView (per kind 'view' senza `view`)
  preset?: SectionPreset;     // stato da impostare prima del render
  note?: string;              // testo per i placeholder
  dashLabel?: string;         // etichetta della voce "dashboard" nel portale di gruppo (default "Dashboard")
}

export interface SocietyConfig {
  id: Societa;
  label: string;
  color: string;
  dashboard?: DashboardSpec;
  sections: SectionConfig[];
}

// ---- Dashboard engine (uniforme per tutti, popolata per società) ----------
export type WidgetData =
  | { kind: 'kpi'; value: string; sub?: string }
  | { kind: 'list'; items: { label: string; meta?: string; hash?: string }[]; emptyText?: string };

export interface DashboardCtx {
  societa: Societa;
  profile: UserProfile | null;
  projects: Project[];
  tasks: Task[];
  appointments: Appointment[];
  clientRequests: ClientRequest[];
  notifications?: { id: string; title: string; body?: string | null; link?: string | null; read: boolean; at: number }[];
  go: (hash: string) => void;
}

export interface WidgetSpec {
  id: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  compute: (ctx: DashboardCtx) => WidgetData;
}

export interface DashboardSpec { widgets: WidgetSpec[]; }

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Dashboard di DEFAULT: gli STESSI widget per ogni società, ma i dati si
 * filtrano in base a `ctx.societa` → "una dashboard più o meno uguale per tutti
 * che si popola con informazioni differenti".
 */
export const DEFAULT_DASHBOARD: DashboardSpec = {
  widgets: [
    {
      id: 'progetti-attivi', title: 'Progetti attivi', size: 'sm',
      compute: (c) => {
        const n = c.projects.filter((p) => p.status === 'attivo' && !p.archived).length;
        return { kind: 'kpi', value: String(n), sub: 'in corso' };
      },
    },
    {
      id: 'cicli-totali', title: 'Cicli / commesse', size: 'sm',
      compute: (c) => {
        const n = c.projects.filter((p) => !p.archived).length;
        return { kind: 'kpi', value: String(n), sub: 'totali' };
      },
    },
    {
      id: 'task-oggi', title: 'Attività di oggi', size: 'sm',
      compute: (c) => {
        const uid = c.profile?.uid;
        const tk = todayKey();
        const n = c.tasks.filter((t) =>
          !t.done && (t.date || '').slice(0, 10) === tk &&
          (t.assignee === uid || (t.assignees || []).includes(uid as string) || t.owner === uid),
        ).length;
        return { kind: 'kpi', value: String(n), sub: 'da fare' };
      },
    },
    {
      id: 'prossimi-appuntamenti', title: 'Prossimi appuntamenti', size: 'md',
      compute: (c) => {
        const uid = c.profile?.uid as string;
        const now = Date.now();
        const items = c.appointments
          .filter((a) => (a.participants ? !!a.participants[uid] : (a as any).ownerUid === uid))
          .filter((a) => new Date(`${a.date}T${(a as any).time || '00:00'}`).getTime() >= now - 36e5)
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          .slice(0, 4)
          .map((a) => ({
            label: (a as any).title || 'Appuntamento',
            meta: new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
            hash: '#calendario',
          }));
        return { kind: 'list', items, emptyText: 'Nessun appuntamento in arrivo' };
      },
    },
    {
      id: 'richieste-clienti', title: 'Richieste clienti', size: 'md',
      compute: (c) => {
        const items = c.clientRequests
          .filter((r) => r.status === 'inviata')
          .slice(0, 4)
          .map((r) => ({ label: (r as any).title || 'Richiesta', meta: 'nuova', hash: '#richieste-clienti' }));
        return { kind: 'list', items, emptyText: 'Nessuna nuova richiesta' };
      },
    },
  ],
};

/** Task "miei": assegnato, tra gli assegnatari, o owner. */
const isMine = (t: Task, uid?: string) => !!uid && (t.assignee === uid || (t.assignees || []).includes(uid) || (t as any).owner === uid);

/**
 * Dashboard PERSONALE (home "Aulico"): le mie attività di oggi, stato delle attività
 * di cui faccio parte, notifiche/messaggi e prossimi appuntamenti. Vedi §DASHBOARD.
 */
export const PERSONAL_DASHBOARD: DashboardSpec = {
  widgets: [
    {
      id: 'stato-attivita', title: 'Le mie attività — stato', size: 'md',
      compute: (c) => {
        const uid = c.profile?.uid; const tk = todayKey();
        const mine = c.tasks.filter((t) => isMine(t, uid));
        const open = mine.filter((t) => !t.done).length;
        const urgent = mine.filter((t) => !t.done && t.priority === 'urgente').length;
        const overdue = mine.filter((t) => !t.done && (t.date || '') < tk).length;
        const done = mine.filter((t) => t.done).length;
        return { kind: 'list', items: [
          { label: 'Aperti', meta: String(open), hash: '#calendario' },
          { label: 'Urgenti', meta: String(urgent), hash: '#calendario' },
          { label: 'Scaduti', meta: String(overdue), hash: '#calendario' },
          { label: 'Completati', meta: String(done), hash: '#calendario' },
        ] };
      },
    },
    {
      id: 'oggi', title: 'Le mie attività di oggi', size: 'lg',
      compute: (c) => {
        const uid = c.profile?.uid; const tk = todayKey();
        const items = c.tasks
          .filter((t) => isMine(t, uid) && !t.done && (t.date || '').slice(0, 10) === tk)
          .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
          .slice(0, 8)
          .map((t) => ({ label: t.title || 'Attività', meta: t.priority === 'urgente' ? 'URGENTE' : (t.time || ''), hash: '#calendario' }));
        return { kind: 'list', items, emptyText: 'Nessuna attività per oggi 🎉' };
      },
    },
    {
      id: 'notifiche', title: 'Notifiche & messaggi', size: 'md',
      compute: (c) => {
        const items = (c.notifications || [])
          .slice()
          .sort((a, b) => (Number(a.read) - Number(b.read)) || (b.at - a.at))
          .slice(0, 6)
          .map((n) => ({ label: n.title, meta: n.read ? '' : '•', hash: n.link || '#' }));
        return { kind: 'list', items, emptyText: 'Nessuna notifica' };
      },
    },
    {
      id: 'prossimi-appuntamenti', title: 'Prossimi appuntamenti', size: 'md',
      compute: (c) => {
        const uid = c.profile?.uid as string;
        const now = Date.now();
        const items = c.appointments
          .filter((a) => (a.participants ? !!a.participants[uid] : (a as any).ownerUid === uid))
          .filter((a) => new Date(`${a.date}T${(a as any).time || '00:00'}`).getTime() >= now - 36e5)
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          .slice(0, 4)
          .map((a) => ({ label: (a as any).title || 'Appuntamento', meta: new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }), hash: '#calendario' }));
        return { kind: 'list', items, emptyText: 'Nessun appuntamento in arrivo' };
      },
    },
  ],
};

// ============================================================================
// REGISTRY — seed iniziale (affinabile dall'utente)
// ============================================================================
/**
 * Struttura STANDARD a 7 gruppi per le società operative (tutte tranne Strategico):
 * Home · Produzione · Commerciale · Marketing · Contabilità & Amministrazione · Risorse umane · Cestino.
 * Ogni gruppo è un portale con sotto-sezioni. Si collega a ciò che esiste; il resto è placeholder
 * (fase "navigazione", i moduli nuovi si riempiono dopo). Vedi docs/V2/Aulico 00.pdf.
 */
function standardSections(soc: 'studio' | 'unico' | 'materico' | 'fantastico'): SectionConfig[] {
  const isMat = soc === 'materico';
  const isUni = soc === 'unico';
  const div = soc as unknown as Division;
  const ph = (id: string, label: string, icon: LucideIcon, parent: string, module: string, note?: string): SectionConfig =>
    ({ id, label, icon, parent, module, kind: 'placeholder', note });
  const s: SectionConfig[] = [];

  // ---- HOME (Agenda · Cicli · Notifiche · Quadro generale) ----
  s.push({ id: 'home', label: 'Home', icon: LayoutGrid, module: 'produzione', kind: 'group', dashLabel: 'Quadro generale' });
  s.push({ id: 'home-agenda', label: 'Agenda', icon: Calendar, parent: 'home', module: 'produzione', legacyRoute: 'calendario', shared: true });
  s.push({ id: 'home-cicli', label: 'Lista dei cicli', icon: Layers, parent: 'home', module: 'produzione', legacyRoute: 'progetti', preset: { division: div } });
  s.push(ph('home-notifiche', 'Notifiche', Bell, 'home', 'produzione', 'Notifiche e messaggi della società.'));

  // ---- PRODUZIONE (Progetti · Computi · Mappa operativa) ----
  s.push({ id: 'produzione', label: 'Produzione', icon: Layers, module: 'produzione', kind: 'group' });
  if (isMat) s.push({ id: 'prod-potenziale', label: 'Potenziale Cantiere', icon: Target, parent: 'produzione', module: 'produzione', view: 'materico-deals' });
  s.push({ id: 'prod-progetti', label: isUni ? 'Operazioni & Investitori' : 'Progetti', icon: isUni ? Building2 : Layers, parent: 'produzione', module: 'produzione', legacyRoute: 'progetti', preset: { division: div } });
  s.push(ph('prod-computi', 'Computi', Calculator, 'produzione', 'produzione', 'Computi metrici.'));
  if (isMat) s.push({ id: 'prod-mappa', label: 'Mappa operativa', icon: MapPin, parent: 'produzione', module: 'produzione', view: 'materico-mappa' });
  else s.push(ph('prod-mappa', 'Mappa operativa', MapPin, 'produzione', 'produzione', 'Cantieri/interventi su mappa.'));

  // ---- COMMERCIALE (Preventivi · Contratti · Listino · Registro clienti) ----
  s.push({ id: 'commerciale', label: 'Commerciale', icon: Target, module: 'commerciale', kind: 'group' });
  s.push({ id: 'comm-preventivi', label: 'Preventivi', icon: FileText, parent: 'commerciale', module: 'commerciale', legacyRoute: 'finanze', preset: { finStartTab: 'preventivi', financeLock: div } });
  if (isMat) s.push({ id: 'comm-contratti', label: 'Contratti', icon: FileSignature, parent: 'commerciale', module: 'commerciale', view: 'materico-contracts' });
  else s.push(ph('comm-contratti', 'Contratti', FileSignature, 'commerciale', 'commerciale', 'Contratti + firma OTP.'));
  if (isMat) s.push({ id: 'comm-listino', label: 'Listino prezzi', icon: ListChecks, parent: 'commerciale', module: 'commerciale', view: 'materico-listino' });
  else s.push(ph('comm-listino', 'Listino prezzi', ListChecks, 'commerciale', 'commerciale', 'Listino prezzi.'));
  s.push({ id: 'comm-clienti', label: isMat ? 'Imprese & Fornitori' : 'Registro clienti', icon: isMat ? Truck : BookUser, parent: 'commerciale', module: 'crm', legacyRoute: 'crm', preset: { crmTab: isMat ? 'fornitori' : 'clienti' } });

  // ---- MARKETING (Calendario editoriale · Eventi · Blog · Statistiche) ----
  s.push({ id: 'marketing', label: 'Marketing', icon: Megaphone, module: 'marketing', kind: 'group' });
  s.push({ id: 'mkt-calendario', label: 'Calendario editoriale', icon: Megaphone, parent: 'marketing', module: 'marketing', view: 'marketing' });
  s.push(ph('mkt-eventi', 'Eventi & gadget', Gift, 'marketing', 'marketing', 'Eventi, gadget e pensieri.'));
  s.push(ph('mkt-blog', 'Articoli blog', FileText, 'marketing', 'marketing', 'Testi e grafiche del blog.'));
  s.push(ph('mkt-stat', 'Statistiche', BarChart3, 'marketing', 'marketing', 'Statistiche marketing.'));

  // ---- CONTABILITÀ & AMMINISTRAZIONE ----
  s.push({ id: 'amm', label: 'Contabilità & Amministrazione', icon: DollarSign, module: 'finance', kind: 'group' });
  s.push({ id: 'amm-contabilita', label: 'Contabilità', icon: DollarSign, parent: 'amm', module: 'finance', legacyRoute: 'finanze', preset: { financeLock: div } });
  s.push({ id: 'amm-piano', label: 'Piano finanziario', icon: BarChart3, parent: 'amm', module: 'finance', view: 'piano-finanziario', note: 'Piano finanziario (stile Excel) + KPI.' });
  s.push({ id: 'amm-fatturazione', label: 'Programmazione fatturazione', icon: FileText, parent: 'amm', module: 'finance', view: 'prog-fatturazione', note: 'Uso quotidiano: pianifica ed emetti le fatture.' });
  s.push(ph('amm-incentivi', 'Piano incentivante', Award, 'amm', 'finance', 'Pagamenti del piano incentivante.'));
  s.push(ph('amm-fiscale', 'Pianificazione fiscale', Scale, 'amm', 'finance', 'Controllo scadenze e adempimenti fiscali.'));
  s.push(ph('amm-credenziali', 'Credenziali & password', Lock, 'amm', 'finance', 'Cassaforte credenziali della società.'));
  s.push({ id: 'amm-registro', label: 'Registro attività', icon: ScrollText, parent: 'amm', module: 'registro', legacyRoute: 'registro', shared: true });

  // ---- RISORSE UMANE ----
  s.push({ id: 'hr', label: 'Risorse umane', icon: Users, module: 'hr', kind: 'group' });
  s.push({ id: 'hr-team', label: 'Team & permessi', icon: Users, parent: 'hr', module: 'hr', legacyRoute: 'team' });
  s.push({ id: 'hr-governance', label: 'Governance', icon: Network, parent: 'hr', module: 'governance', view: 'governance' });

  // ---- CESTINO ----
  s.push({ id: 'cestino', label: 'Cestino', icon: Trash2, module: 'cestino', legacyRoute: 'cestino', shared: true });
  return s;
}

export const SOCIETY_REGISTRY: SocietyConfig[] = [
  // -------------------------------------------------------------- STRATEGICO
  {
    id: 'strategico', label: SOCIETA_LABEL.strategico, color: SOCIETY_COLOR.strategico,
    sections: [
      // === SOTTO-CATEGORIA: Risorse Umane ===
      { id: 'hr', label: 'Risorse Umane', icon: Users, module: 'hr', kind: 'group', dashLabel: 'Agenda HR' },
      { id: 'hr-crm', label: 'CRM', icon: BookUser, parent: 'hr', shared: true, module: 'crm', legacyRoute: 'crm' },
      { id: 'hr-recruiting', label: 'Recruiting', icon: UserPlus, parent: 'hr', module: 'hr', kind: 'placeholder', note: 'Job description, annunci, colloqui, piani di inserimento.' },
      { id: 'hr-governance', label: 'Governance', icon: Network, parent: 'hr', module: 'governance', view: 'governance', note: 'Organigramma, mansionari, procedure (SOP), team & permessi, cassaforte password.' },
      { id: 'hr-registro', label: 'Registro attività', icon: ScrollText, parent: 'hr', shared: true, module: 'registro', legacyRoute: 'registro' },
      // === SOTTO-CATEGORIA: Marketing ===
      { id: 'marketing', label: 'Marketing', icon: Megaphone, module: 'marketing', kind: 'group' },
      { id: 'mkt-operativo', label: 'Marketing operativo', icon: Megaphone, parent: 'marketing', module: 'marketing', view: 'marketing', note: 'Produzione contenuti + calendario editoriale multi-canale.' },
      { id: 'mkt-strategico', label: 'Marketing strategico', icon: BarChart3, parent: 'marketing', module: 'marketing', legacyRoute: 'progetti', preset: { division: 'strategico' }, note: 'Analisi dati, KPI, budget.' },
      // === SOTTO-CATEGORIA: Amministrazione & Contabilità ===
      { id: 'amm', label: 'Amministrazione & Contabilità', icon: Briefcase, module: 'finance', kind: 'group' },
      { id: 'amm-contabilita', label: 'Contabilità', icon: DollarSign, parent: 'amm', shared: true, module: 'finance', legacyRoute: 'finanze', note: 'Preventivi, contratti, fatturazione, provvigioni.' },
      { id: 'amm-commerciale', label: 'Commerciale', icon: Target, parent: 'amm', module: 'commerciale', legacyRoute: 'finanze', preset: { finStartTab: 'preventivi' }, note: 'Vendite + preventivi interattivi per nuovi servizi.' },
      // === SOTTO-CATEGORIA: Sviluppo Software ===
      { id: 'software', label: 'Sviluppo Software', icon: Code2, module: 'software', kind: 'group' },
      { id: 'sw-gestionale', label: 'Gestionale & Automazioni', icon: Code2, parent: 'software', module: 'software', kind: 'placeholder', note: 'Software house interna: gestionale, automazioni, compilatore pratiche.' },
      // === SOTTO-CATEGORIA: Area Legale ===
      { id: 'legale', label: 'Area Legale', icon: Scale, module: 'legale', kind: 'group' },
      { id: 'legale-contratti', label: 'Contrattualistica', icon: FileText, parent: 'legale', module: 'legale', kind: 'placeholder', note: 'Contrattualistica, sicurezza dati, liberatorie privacy.' },
    ],
  },
  // ----------------------------------------------------------------- ONIRICO
  { id: 'studio', label: SOCIETA_LABEL.studio, color: SOCIETY_COLOR.studio, sections: standardSections('studio') },
  // ---------------------------------------------------------------- MATERICO
  { id: 'materico', label: SOCIETA_LABEL.materico, color: SOCIETY_COLOR.materico, sections: standardSections('materico') },
  // ------------------------------------------------------------------- UNICO
  { id: 'unico', label: SOCIETA_LABEL.unico, color: SOCIETY_COLOR.unico, sections: standardSections('unico') },
  // -------------------------------------------------------------- FANTASTICO
  { id: 'fantastico', label: SOCIETA_LABEL.fantastico, color: SOCIETY_COLOR.fantastico, sections: standardSections('fantastico') },
  // -------------------------------------------------- AULICO (gruppo/shared)
  {
    id: 'holding', label: 'Aulico', color: SOCIETY_COLOR.holding,
    dashboard: PERSONAL_DASHBOARD,
    sections: [
      // Voci UNICHE per ogni account: una sola Dashboard e una sola Agenda,
      // mostrate in cima alla sidebar (fuori dalle categorie società).
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, module: 'dashboard', kind: 'dashboard' },
      { id: 'agenda', label: 'Agenda', icon: Calendar, module: 'agenda', legacyRoute: 'calendario' },
      // Voci di gruppo (in fondo).
      { id: 'registro', label: 'Registro attività', icon: ScrollText, shared: true, module: 'registro', legacyRoute: 'registro' },
      { id: 'cestino', label: 'Cestino', icon: Trash2, shared: true, module: 'cestino', legacyRoute: 'cestino' },
    ],
  },
];

// ---- Lookup helpers --------------------------------------------------------
export function getSociety(s: Societa): SocietyConfig | undefined {
  return SOCIETY_REGISTRY.find((x) => x.id === s);
}

export function findSection(s: Societa, sectionId: string): SectionConfig | undefined {
  return getSociety(s)?.sections.find((sec) => sec.id === sectionId);
}

/** Vero se l'utente può vedere la sezione (RBAC). */
export function canViewSection(profile: Parameters<typeof canView>[0], s: Societa, sec: SectionConfig): boolean {
  return canView(profile, s, sec.module);
}

/** Prima rotta autorizzata per l'utente, per il landing/redirect. */
export function firstAuthorizedHash(profile: Parameters<typeof canView>[0]): string {
  // Landing universale: la Dashboard di gruppo (se autorizzata).
  const holding = getSociety('holding');
  const dash = holding?.sections.find((s) => s.id === 'dashboard');
  if (dash && canViewSection(profile, 'holding', dash)) return '#aulico/dashboard';
  for (const soc of SOCIETY_REGISTRY) {
    const sec = soc.sections.find((x) => !x.parent && canViewSection(profile, soc.id, x));
    if (sec) return `#${societaSlug(soc.id)}/${sec.id}`;
  }
  return '#aulico/dashboard';
}
