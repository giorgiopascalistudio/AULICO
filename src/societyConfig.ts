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
  Bell, Calculator, Award, Lock, Gift, CheckSquare, MessageSquare, Swords, Search, Home,
} from 'lucide-react';
import type { AccessLevel, Societa, UserProfile, Project, Task, Appointment, ClientRequest, ProjectMessage } from './types';
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
export interface WidgetListItem {
  label: string;
  meta?: string;
  hash?: string;
  progress?: number;   // 0..100 → barra di avanzamento sotto la label (es. cicli)
  accent?: string;     // colore del pallino a sinistra (es. colore società)
  sub?: string;        // seconda riga sotto la label (es. anteprima messaggio)
  unread?: boolean;    // evidenzia la voce come non letta (pallino pieno)
}

/** Riquadro statistico compatto (griglia di tessere numero+etichetta). */
export interface WidgetStat {
  label: string;
  value: string;
  accent?: string;   // colore del numero (default nero)
  hash?: string;     // tessera cliccabile
}

export type WidgetData =
  | { kind: 'kpi'; value: string; sub?: string }
  | { kind: 'stats'; items: WidgetStat[] }
  | { kind: 'list'; items: WidgetListItem[]; emptyText?: string };

export interface DashboardCtx {
  societa: Societa;
  profile: UserProfile | null;
  projects: Project[];
  tasks: Task[];
  appointments: Appointment[];
  clientRequests: ClientRequest[];
  notifications?: { id: string; title: string; body?: string | null; link?: string | null; read: boolean; at: number }[];
  /** Messaggi di progetto per la preview "Chat recenti" (pid → msgId → messaggio). */
  projectMessages?: Record<string, Record<string, ProjectMessage>>;
  go: (hash: string) => void;
}

export interface WidgetSpec {
  id: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;    // icona nell'header del riquadro
  compute: (ctx: DashboardCtx) => WidgetData;
}

export interface DashboardSpec { widgets: WidgetSpec[]; }

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Tempo relativo compatto (es. "ora", "5 min", "2 h", "3 g", o data breve). */
function relTime(at?: number | null): string {
  if (!at) return '';
  const diff = Date.now() - at;
  if (diff < 60e3) return 'ora';
  if (diff < 36e5) return `${Math.floor(diff / 60e3)} min`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)} h`;
  if (diff < 6048e5) return `${Math.floor(diff / 864e5)} g`;
  return new Date(at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

/**
 * Dashboard di DEFAULT: gli STESSI widget per ogni società, ma i dati si
 * filtrano in base a `ctx.societa` → "una dashboard più o meno uguale per tutti
 * che si popola con informazioni differenti".
 */
export const DEFAULT_DASHBOARD: DashboardSpec = {
  widgets: [
    {
      id: 'progetti-attivi', title: 'Progetti attivi', size: 'sm', icon: Layers,
      compute: (c) => {
        const n = c.projects.filter((p) => p.status === 'attivo' && !p.archived).length;
        return { kind: 'kpi', value: String(n), sub: 'in corso' };
      },
    },
    {
      id: 'cicli-totali', title: 'Cicli / commesse', size: 'sm', icon: Briefcase,
      compute: (c) => {
        const n = c.projects.filter((p) => !p.archived).length;
        return { kind: 'kpi', value: String(n), sub: 'totali' };
      },
    },
    {
      id: 'task-oggi', title: 'Attività di oggi', size: 'sm', icon: CheckSquare,
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
      id: 'prossimi-appuntamenti', title: 'Prossimi appuntamenti', size: 'md', icon: Calendar,
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
      id: 'richieste-clienti', title: 'Richieste clienti', size: 'md', icon: Inbox,
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

/** Avanzamento di un ciclo/commessa (da task delle fasi). */
function projProgress(p: Project): { done: number; tot: number; pc: number } {
  let done = 0, tot = 0;
  Object.values(p.phases || {}).forEach((ph) => {
    Object.values(ph.tasks || {}).forEach((t) => { tot++; if (t.done) done++; });
  });
  return { done, tot, pc: tot ? Math.round((done / tot) * 100) : 0 };
}

/** Vero se il ciclo è "mio": ho un'attività di fase assegnata, un impegno collegato o l'ho creato. */
function isMyProject(p: Project, uid: string | undefined, tasks: Task[]): boolean {
  if (!uid) return false;
  const emb = Object.values(p.phases || {}).some((ph) =>
    Object.values(ph.tasks || {}).some((t) => t.assignee === uid),
  );
  if (emb) return true;
  return tasks.some((t) => t.projectId === p.id && isMine(t, uid));
}

/**
 * Dashboard PERSONALE (home "Aulico"): quadro generale del mio account —
 * vista d'insieme, agenda (attività di oggi + appuntamenti), notifiche/chat e
 * anteprima dei cicli attivi che mi riguardano. Vedi §DASHBOARD.
 */
export const PERSONAL_DASHBOARD: DashboardSpec = {
  widgets: [
    {
      id: 'vista-generale', title: 'Vista generale', size: 'md', icon: LayoutGrid,
      compute: (c) => {
        const uid = c.profile?.uid; const tk = todayKey();
        const mine = c.tasks.filter((t) => isMine(t, uid));
        const open = mine.filter((t) => !t.done).length;
        const todo = mine.filter((t) => !t.done && (t.date || '').slice(0, 10) === tk).length;
        const urgent = mine.filter((t) => !t.done && t.priority === 'urgente').length;
        const overdue = mine.filter((t) => !t.done && (t.date || '') < tk).length;
        const activeCycles = c.projects.filter((p) => p.status === 'attivo' && !p.archived);
        const mineCycles = activeCycles.filter((p) => isMyProject(p, uid, c.tasks));
        // Coerente col widget "Cicli attivi": i miei, o tutti gli attivi se non ne ho di miei.
        const myCycles = mineCycles.length || activeCycles.length;
        const unread = (c.notifications || []).filter((n) => !n.read).length;
        return { kind: 'stats', items: [
          { label: 'Cicli attivi', value: String(myCycles), hash: '#progetti' },
          { label: 'Oggi', value: String(todo), hash: '#calendario' },
          { label: 'Aperte', value: String(open), hash: '#calendario' },
          { label: 'Urgenti', value: String(urgent), accent: urgent ? '#dc2626' : undefined, hash: '#calendario' },
          { label: 'Scadute', value: String(overdue), accent: overdue ? '#dc2626' : undefined, hash: '#calendario' },
          { label: 'Non lette', value: String(unread), accent: unread ? '#b45309' : undefined },
        ] };
      },
    },
    {
      id: 'oggi', title: 'Le mie attività di oggi', size: 'md', icon: CheckSquare,
      compute: (c) => {
        const uid = c.profile?.uid; const tk = todayKey();
        const items = c.tasks
          .filter((t) => isMine(t, uid) && !t.done && (t.date || '').slice(0, 10) === tk)
          .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
          .slice(0, 8)
          .map((t) => ({
            label: t.title || 'Attività',
            meta: t.priority === 'urgente' ? 'URGENTE' : (t.time || ''),
            accent: t.priority === 'urgente' ? '#dc2626' : t.priority === 'alta' ? '#b45309' : undefined,
            hash: '#calendario',
          }));
        return { kind: 'list', items, emptyText: 'Nessuna attività per oggi 🎉' };
      },
    },
    {
      id: 'cicli-attivi', title: 'Cicli attivi', size: 'md', icon: Layers,
      compute: (c) => {
        const uid = c.profile?.uid;
        const active = c.projects.filter((p) => p.status === 'attivo' && !p.archived);
        const mine = active.filter((p) => isMyProject(p, uid, c.tasks));
        // Mostro i miei cicli; se non ne ho (es. direzione), l'insieme dei cicli attivi.
        const list = (mine.length ? mine : active)
          .slice()
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
          .slice(0, 6)
          .map((p) => {
            const { pc } = projProgress(p);
            return {
              label: p.name,
              sub: p.client || undefined,
              meta: `${pc}%`,
              progress: pc,
              accent: SOCIETY_COLOR[(p.division as Societa) || 'studio'],
              hash: `#progetto/${p.id}`,
            };
          });
        return { kind: 'list', items: list, emptyText: 'Nessun ciclo attivo' };
      },
    },
    {
      id: 'prossimi-appuntamenti', title: 'Prossimi appuntamenti', size: 'md', icon: Calendar,
      compute: (c) => {
        const uid = c.profile?.uid as string;
        const now = Date.now();
        const items = c.appointments
          .filter((a) => (a.participants ? !!a.participants[uid] : (a as any).ownerUid === uid))
          .filter((a) => new Date(`${a.date}T${(a as any).time || '00:00'}`).getTime() >= now - 36e5)
          .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare((b as any).time || ''))
          .slice(0, 5)
          .map((a) => ({
            label: (a as any).title || 'Appuntamento',
            sub: (a as any).withName || undefined,
            meta: `${new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}${(a as any).time ? ` · ${(a as any).time}` : ''}`,
            accent: a.status === 'pending' ? '#9a9a9a' : '#15803d',
            hash: '#calendario',
          }));
        return { kind: 'list', items, emptyText: 'Nessun appuntamento in arrivo' };
      },
    },
    {
      id: 'notifiche', title: 'Notifiche & messaggi', size: 'md', icon: Bell,
      compute: (c) => {
        const items = (c.notifications || [])
          .slice()
          .sort((a, b) => (Number(a.read) - Number(b.read)) || (b.at - a.at))
          .slice(0, 6)
          .map((n) => ({
            label: n.title,
            sub: n.body || undefined,
            meta: relTime(n.at),
            unread: !n.read,
            hash: n.link || undefined,
          }));
        return { kind: 'list', items, emptyText: 'Nessuna notifica' };
      },
    },
    {
      id: 'chat-recenti', title: 'Chat recenti', size: 'md', icon: MessageSquare,
      compute: (c) => {
        const uid = c.profile?.uid;
        const byProject = c.projectMessages || {};
        const nameOf = (pid: string) => c.projects.find((p) => p.id === pid)?.name || 'Progetto';
        // Ultimo messaggio per progetto, poi i più recenti in cima.
        const latest = Object.entries(byProject)
          .map(([pid, msgs]) => {
            const arr = Object.values(msgs || {});
            if (!arr.length) return null;
            const last = arr.reduce((a, b) => (a.at >= b.at ? a : b));
            return { pid, last };
          })
          .filter((x): x is { pid: string; last: ProjectMessage } => !!x)
          .sort((a, b) => b.last.at - a.last.at)
          .slice(0, 5)
          .map(({ pid, last }) => ({
            label: nameOf(pid),
            sub: `${last.from === uid ? 'Tu' : (last.name || 'Ospite')}: ${last.text}`,
            meta: relTime(last.at),
            hash: `#progetto/${pid}`,
          }));
        return { kind: 'list', items: latest, emptyText: 'Nessun messaggio recente' };
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
  s.push({ id: 'home-piano', label: 'Piano di Battaglia', icon: Swords, parent: 'home', module: 'produzione', view: 'piano-battaglia', note: 'La settimana operativa: porta qui i cicli quando vanno lavorati (PDF: Agenda ↔ Cicli ↔ Piano di Battaglia dialogano).' });
  s.push(ph('home-notifiche', 'Notifiche', Bell, 'home', 'produzione', 'Notifiche e messaggi della società.'));

  // ---- PRODUZIONE (Progetti · Computi · Mappa operativa) ----
  s.push({ id: 'produzione', label: 'Produzione', icon: Layers, module: 'produzione', kind: 'group' });
  if (isUni) s.push({ id: 'prod-opportunita', label: 'Ricerca Opportunità', icon: Search, parent: 'produzione', module: 'produzione', view: 'unico-opportunita', note: 'Workflow a step obbligatori: contatto → sopralluogo → raccolta → analisi → due diligence → manifestazione → negoziazione → preliminare → atto → INVESTIMENTO.' });
  if (soc === 'studio') s.push({ id: 'prod-stima', label: 'Stima Preliminare', icon: Calculator, parent: 'produzione', module: 'produzione', view: 'stima-preliminare', note: 'Simulatore della fase Pianificazione: quantità × livello Base/Medio/Alto → budget automatico.' });
  if (soc === 'fantastico') s.push({ id: 'prod-gestione', label: 'Immobili & Servizi', icon: Home, parent: 'produzione', module: 'produzione', view: 'fantastico-gestione', note: 'Gestione immobiliare: immobili in gestione + richieste di servizio/manutenzione smistate ai partner (con margine).' });
  if (isMat) s.push({ id: 'prod-potenziale', label: 'Potenziale Cantiere', icon: Target, parent: 'produzione', module: 'produzione', view: 'materico-deals' });
  s.push({ id: 'prod-progetti', label: isUni ? 'Operazioni & Investitori' : 'Progetti', icon: isUni ? Building2 : Layers, parent: 'produzione', module: 'produzione', legacyRoute: 'progetti', preset: { division: div } });
  s.push(ph('prod-computi', 'Computi', Calculator, 'produzione', 'produzione', 'Computi metrici.'));
  s.push({ id: 'prod-mappa', label: 'Mappa operativa', icon: MapPin, parent: 'produzione', module: 'produzione', view: 'mappa-operativa', note: 'I siti della società geolocalizzati: pratiche/cantieri/opportunità/immobili, con azioni rapide (problematica, sopralluogo).' });

  // ---- COMMERCIALE (consultazione: gestione centralizzata nel Centro Commerciale di Strategico) ----
  s.push({ id: 'commerciale', label: 'Commerciale', icon: Target, module: 'commerciale', kind: 'group' });
  s.push({ id: 'comm-preventivi', label: 'Preventivi & Contratti', icon: FileText, parent: 'commerciale', module: 'commerciale', view: 'commerciale', note: 'Consultazione dei preventivi della società — la gestione (nuovi preventivi, firma, portale, documenti) è in Strategico → Centro Commerciale.' });
  s.push({ id: 'comm-clienti', label: isMat ? 'Imprese & Fornitori' : 'Registro clienti', icon: isMat ? Truck : BookUser, parent: 'commerciale', module: 'crm', legacyRoute: 'crm', preset: { crmTab: isMat ? 'fornitori' : 'clienti' } });

  // ---- MARKETING (consultazione: il piano editoriale è gestito dal Centro Marketing di Strategico) ----
  s.push({ id: 'marketing', label: 'Marketing', icon: Megaphone, module: 'marketing', kind: 'group' });
  s.push({ id: 'mkt-calendario', label: 'Calendario editoriale', icon: Calendar, parent: 'marketing', module: 'marketing', view: 'editorial', note: 'Piano editoriale della società in sola lettura — la gestione operativa è nel Centro Marketing di Strategico.' });

  // ---- CONTABILITÀ & AMMINISTRAZIONE (consultazione: gestione centralizzata nel Centro Direzione di Strategico) ----
  s.push({ id: 'amm', label: 'Contabilità & Amministrazione', icon: DollarSign, module: 'finance', kind: 'group' });
  s.push({ id: 'amm-quadro', label: 'Quadro contabile', icon: DollarSign, parent: 'amm', module: 'finance', view: 'contabilita-read', note: 'Numeri della società in sola consultazione — la gestione è in Strategico → Centro Direzione.' });
  s.push({ id: 'amm-credenziali', label: 'Credenziali & password', icon: Lock, parent: 'amm', module: 'finance', view: 'credenziali-soc', note: 'Cassaforte credenziali della società (master password).' });
  s.push({ id: 'amm-registro', label: 'Registro attività', icon: ScrollText, parent: 'amm', module: 'registro', legacyRoute: 'registro', shared: true });

  // ---- RISORSE UMANE ----
  s.push({ id: 'hr', label: 'Risorse umane', icon: Users, module: 'hr', kind: 'group' });
  s.push({ id: 'hr-team', label: 'Team & permessi', icon: Users, parent: 'hr', module: 'hr', legacyRoute: 'team' });
  s.push({ id: 'hr-incentivi', label: 'Piano incentivante', icon: Award, parent: 'hr', module: 'hr', view: 'piano-incentivante', note: 'Merito, fasce bonus, erogato: base della parte variabile.' });
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
      // === POINT OF ENTRY (docs: tutti i lead e le richieste transitano da qui) ===
      { id: 'point-of-entry', label: 'Point of Entry', icon: Inbox, module: 'crm', view: 'point-of-entry', note: 'Inbox unificata: lead da smistare alla società competente + richieste dei clienti dal portale (prendi in carico / converti in progetto).' },
      // === SOTTO-CATEGORIA: Risorse Umane ===
      { id: 'hr', label: 'Risorse Umane', icon: Users, module: 'hr', kind: 'group', dashLabel: 'Agenda HR' },
      { id: 'hr-crm', label: 'CRM', icon: BookUser, parent: 'hr', shared: true, module: 'crm', legacyRoute: 'crm' },
      { id: 'hr-recruiting', label: 'Recruiting', icon: UserPlus, parent: 'hr', module: 'hr', view: 'recruiting', note: 'Annunci di lavoro, pipeline candidati (candidatura→colloquio→prova→inserito), piani di inserimento a 6 mesi.' },
      { id: 'hr-governance', label: 'Governance', icon: Network, parent: 'hr', module: 'governance', view: 'governance', note: 'Organigramma, mansionari, procedure (SOP), team & permessi, cassaforte password.' },
      { id: 'hr-registro', label: 'Registro attività', icon: ScrollText, parent: 'hr', shared: true, module: 'registro', legacyRoute: 'registro' },
      // === SOTTO-CATEGORIA: Marketing (Centro Marketing: hub di TUTTI gli account gestiti) ===
      { id: 'marketing', label: 'Marketing', icon: Megaphone, module: 'marketing', kind: 'group' },
      { id: 'mkt-centro', label: 'Centro Marketing', icon: Megaphone, parent: 'marketing', module: 'marketing', view: 'marketing-hub', note: 'Salute di tutti gli account gestiti (5 società + clienti terzi); ogni account ha il SUO workspace: scheda/liberatoria, calendario editoriale, workflow 9 fasi, KPI, spese & budget, report mensile, eventi & gadget, blog.' },
      // === SOTTO-CATEGORIA: Commerciale (Centro Commerciale: la parte commerciale di TUTTE le società) ===
      { id: 'commerciale', label: 'Commerciale', icon: Target, module: 'commerciale', kind: 'group' },
      { id: 'comm-centro', label: 'Centro Commerciale', icon: Target, parent: 'commerciale', module: 'commerciale', view: 'commerciale-hub', note: 'Pipeline di tutte le società → workspace per società: preventivi interattivi (il cliente sceglie le voci dal portale col totale live), firma OTP, sconti/maggiorazioni, documenti da modello (contratti Arredi Fissi/FF&E, accordo imprese, manifestazione d\'interesse), listino.' },
      { id: 'comm-clienti', label: 'Registro clienti', icon: BookUser, parent: 'commerciale', module: 'crm', legacyRoute: 'crm', preset: { crmTab: 'clienti' } },
      // === SOTTO-CATEGORIA: Amministrazione & Contabilità (Centro Direzione: amministra TUTTE le società) ===
      { id: 'amm', label: 'Amministrazione & Contabilità', icon: Briefcase, module: 'finance', kind: 'group' },
      { id: 'amm-centro', label: 'Centro Direzione', icon: Briefcase, parent: 'amm', module: 'finance', view: 'direzione-hub', note: 'Salute economica di tutte le società + workspace per società con le sezioni della riunione strategica: KPI, Piano finanziario, IVA & Fiscale, Programmazione (fatturazione+costi), BEP, Budget per aree, Cicli aperti, Obiettivi, Report stampabile.' },
      { id: 'amm-contabilita', label: 'Contabilità operativa', icon: DollarSign, parent: 'amm', shared: true, module: 'finance', legacyRoute: 'finanze', note: 'Registrazione fatture, scadenze, movimenti e preventivi di tutte le società (selettore Società).' },
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
