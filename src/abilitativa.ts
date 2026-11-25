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
