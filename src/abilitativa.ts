/**
 * Fase abilitativa (Onirico): voci della lavagna pratiche × documenti.
 * Nodo `abilitativa/<pid>/<voceId>` = AbilCell. Vista: components/AbilitativaView.
 */
export type AbilStato = 'da_fare' | 'in_corso' | 'fatto' | 'non_serve';
export interface AbilCell {
  stato: AbilStato;
  assignee?: string | null;
  due?: string | null;
  note?: string | null;
  taskId?: string | null;   // attività in agenda `tasks/abil-<pid>-<voce>`
  updatedAt?: number;
  by?: string | null;
}
export type AbilMap = Record<string, Record<string, AbilCell>>; // pid → voceId → cella

export const ABIL_VOCI: { id: string; label: string }[] = [
  { id: 'collaudo', label: 'Collaudo' },
  { id: 'idoneita_statica', label: 'Certificato di idoneità statica' },
  { id: 'tipo_mappale', label: 'Tipo mappale' },
  { id: 'docfa', label: 'DOCFA' },
  { id: 'scarico', label: 'Autorizzazione allo scarico' },
  { id: 'conformita', label: 'Dichiarazione di conformità' },
  { id: 'ape', label: 'APE' },
  { id: 'aqe', label: 'AQE' },
  { id: 'agibilita', label: 'Agibilità' },
  { id: 'variante', label: 'Variante' },
];
export const abilVoceLabel = (id: string) => ABIL_VOCI.find((v) => v.id === id)?.label || id;

/** Riconosce l'attività della pratica che corrisponde a una voce (titolo del task):
 *  la casella e l'attività del fascicolo restano allineate. */
export const ABIL_MATCH: Record<string, RegExp> = {
  collaudo: /collaud/i,
  idoneita_statica: /idoneit/i,
  tipo_mappale: /tipo mappale|pregeo/i,
  docfa: /docfa|accatastament/i,
  scarico: /scarico/i,
  conformita: /dichiarazion\w* di conformit|conformit/i,
  ape: /\bape\b|prestazione energetica/i,
  aqe: /\baqe\b/i,
  agibilita: /agibilit/i,
  variante: /variant/i,
};

/** Attività della pratica (fase/task) che corrispondono alla voce. */
export function abilPhaseTasks(project: any, voceId: string): { ph: string; t: string; done: boolean }[] {
  const re = ABIL_MATCH[voceId];
  if (!re || !project?.phases) return [];
  const out: { ph: string; t: string; done: boolean }[] = [];
  Object.entries(project.phases).forEach(([ph, phase]: [string, any]) =>
    Object.entries(phase?.tasks || {}).forEach(([t, task]: [string, any]) => {
      if (task && re.test(task.title || '')) out.push({ ph, t, done: !!task.done });
    }));
  return out;
}
