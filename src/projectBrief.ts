/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Catalogo del Questionario iniziale cliente (brief di progetto). Le risposte
 * (ProjectBrief.answers, keyed per id) alimentano moodboard, preventivi e
 * presentazioni. Aggiungere domande qui NON richiede migrazioni.
 */
export type BriefFieldType = 'text' | 'textarea' | 'number' | 'select';

export interface BriefQuestion {
  id: string;
  label: string;
  type: BriefFieldType;
  group: string;
  placeholder?: string;
  options?: string[];         // per type 'select'
  hint?: string;
}

export const BRIEF_GROUPS: string[] = ['Stile & gusto', 'Materiali & finiture', 'Esigenze & funzioni', 'Budget & tempi', 'Riferimenti'];

export const BRIEF_QUESTIONS: BriefQuestion[] = [
  // Stile & gusto
  { id: 'stile', label: 'Stile preferito', type: 'select', group: 'Stile & gusto',
    options: ['Moderno', 'Contemporaneo', 'Minimal', 'Classico', 'Industriale', 'Rustico', 'Mediterraneo', 'Scandinavo', 'Eclettico', 'Non so ancora'] },
  { id: 'atmosfera', label: 'Atmosfera desiderata', type: 'textarea', group: 'Stile & gusto', placeholder: 'Calda e accogliente, luminosa, essenziale…' },
  { id: 'colori', label: 'Colori preferiti / da evitare', type: 'text', group: 'Stile & gusto', placeholder: 'Toni neutri e legno; evitare il nero' },

  // Materiali & finiture
  { id: 'materiali', label: 'Materiali preferiti', type: 'text', group: 'Materiali & finiture', placeholder: 'Legno, pietra naturale, microcemento…' },
  { id: 'materiali_no', label: 'Materiali/finiture da evitare', type: 'text', group: 'Materiali & finiture', placeholder: 'Marmi lucidi, gres effetto legno…' },

  // Esigenze & funzioni
  { id: 'composizione', label: 'Chi vivrà lo spazio', type: 'text', group: 'Esigenze & funzioni', placeholder: 'Coppia con 2 bambini, animali domestici…' },
  { id: 'ambienti', label: 'Ambienti da progettare', type: 'text', group: 'Esigenze & funzioni', placeholder: 'Cucina, soggiorno, 2 bagni, studio…' },
  { id: 'funzioni', label: 'Funzioni e necessità particolari', type: 'textarea', group: 'Esigenze & funzioni', placeholder: 'Smart working, tanta contenitività, zona lavanderia…' },
  { id: 'must', label: 'Elementi irrinunciabili', type: 'textarea', group: 'Esigenze & funzioni', placeholder: 'Isola in cucina, cabina armadio, camino…' },

  // Budget & tempi
  { id: 'budget', label: 'Budget indicativo (€)', type: 'number', group: 'Budget & tempi', placeholder: '80000' },
  { id: 'tempistiche', label: 'Tempistiche desiderate', type: 'text', group: 'Budget & tempi', placeholder: 'Entro la primavera, nessuna fretta…' },
  { id: 'priorita', label: "Priorità del progetto", type: 'select', group: 'Budget & tempi',
    options: ['Qualità e materiali', 'Contenere i costi', 'Velocità di realizzazione', 'Estetica e design', 'Sostenibilità'] },

  // Riferimenti
  { id: 'riferimenti', label: 'Riferimenti e ispirazioni (link/immagini)', type: 'textarea', group: 'Riferimenti', placeholder: 'Link Pinterest/Instagram, foto che ti piacciono…' },
  { id: 'note', label: 'Note libere', type: 'textarea', group: 'Riferimenti', placeholder: 'Tutto ciò che vuoi farci sapere…' },
];

export const briefQuestionsByGroup = (): Record<string, BriefQuestion[]> => {
  const out: Record<string, BriefQuestion[]> = {};
  BRIEF_GROUPS.forEach((g) => { out[g] = BRIEF_QUESTIONS.filter((q) => q.group === g); });
  return out;
};

/** Quante risposte compilate su totale → percentuale di completamento. */
export const briefCompletion = (answers?: Record<string, string>): { done: number; total: number; pct: number } => {
  const total = BRIEF_QUESTIONS.length;
  const done = BRIEF_QUESTIONS.filter((q) => (answers?.[q.id] || '').toString().trim() !== '').length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
};

export const briefLabel = (id: string): string => BRIEF_QUESTIONS.find((q) => q.id === id)?.label || id;
