/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Configuratore creazione progetti STUDIO (Onirico).
 * Tipo di intervento edilizio → titolo abilitativo (auto-suggerito) → categorie di
 * lavorazione → fasi/task generati dalla libreria reale (taskLibrary.ts).
 */

import { TASK_LIBRARY } from './taskLibrary';
import type { Phase, ProjectTask } from './types';

// Ordine fasi dello Studio (Onirico) per la generazione del progetto.
export const STUDIO_FASI = ['Progettazione', 'Burocrazia', 'Cantiere', 'Restauro', 'Vendita'];

// Categorie disponibili, raggruppate per fase (derivate dal catalogo reale).
export const STUDIO_CATEGORIE_BY_FASE: { fase: string; categorie: string[] }[] = STUDIO_FASI
  .map(fase => ({
    fase,
    categorie: Array.from(
      new Set(TASK_LIBRARY.filter(t => t.society === 'Onirico' && t.fase === fase).map(t => t.categoria))
    )
  }))
  .filter(g => g.categorie.length > 0);

// Titoli abilitativi (T.U. Edilizia DPR 380/2001).
export const TITOLI_ABILITATIVI: { id: string; label: string }[] = [
  { id: 'edilizia_libera', label: 'Edilizia libera / CIL' },
  { id: 'cila', label: 'CILA' },
  { id: 'scia', label: 'SCIA' },
  { id: 'scia_pdc', label: 'SCIA alternativa al PdC' },
  { id: 'pdc', label: 'Permesso di Costruire' }
];

export interface InterventoEdilizio {
  id: string;
  label: string;
  titolo: string;       // titolo abilitativo suggerito (id)
  categorie: string[];  // categorie pre-selezionate
}

// Tipi di intervento edilizio con titolo suggerito e categorie di default (modificabili).
export const INTERVENTI_EDILIZI: InterventoEdilizio[] = [
  { id: 'manutenzione_ordinaria', label: 'Manutenzione ordinaria', titolo: 'edilizia_libera', categorie: ['Architettonico'] },
  { id: 'manutenzione_straordinaria', label: 'Manutenzione straordinaria', titolo: 'cila', categorie: ['Rilievo', 'Architettonico', 'Pratica edilizia', 'Accatastamento'] },
  { id: 'restauro_risanamento', label: 'Restauro e risanamento conservativo', titolo: 'cila', categorie: ['Rilievo', 'Architettonico', 'Pratica edilizia', 'Pratica paesaggistica', 'Accatastamento'] },
  { id: 'ristrutturazione_leggera', label: 'Ristrutturazione edilizia leggera', titolo: 'scia', categorie: ['Rilievo', 'Architettonico', 'Impiantistico', 'Pratica edilizia', 'Pratica energetica', 'Accatastamento'] },
  { id: 'ristrutturazione_pesante', label: 'Ristrutturazione edilizia pesante', titolo: 'pdc', categorie: ['Rilievo', 'Studio di fattibilità', 'Architettonico', 'Strutturale', 'Impiantistico', 'Pratica edilizia', 'Pratica strutturale', 'Pratica energetica', 'Accatastamento'] },
  { id: 'nuova_costruzione', label: 'Nuova costruzione', titolo: 'pdc', categorie: ['Rilievo', 'Studio di fattibilità', 'Architettonico', 'Strutturale', 'Impiantistico', 'Pratica edilizia', 'Pratica strutturale', 'Pratica energetica', 'Pratica paesaggistica', 'Accatastamento'] },
  { id: 'demolizione_ricostruzione', label: 'Demolizione e ricostruzione', titolo: 'pdc', categorie: ['Rilievo', 'Studio di fattibilità', 'Architettonico', 'Strutturale', 'Impiantistico', 'Pratica edilizia', 'Pratica strutturale', 'Pratica energetica', 'Accatastamento'] },
  { id: 'cambio_uso', label: "Cambio di destinazione d'uso", titolo: 'scia', categorie: ['Rilievo', 'Architettonico', 'Pratica edilizia', 'Pratica energetica', 'Accatastamento'] }
];

export const DEFAULT_INTERVENTO = 'ristrutturazione_leggera';

export const interventoById = (id: string): InterventoEdilizio | undefined =>
  INTERVENTI_EDILIZI.find(i => i.id === id);
export const interventoLabel = (id?: string | null): string =>
  (id && INTERVENTI_EDILIZI.find(i => i.id === id)?.label) || (id || '');
export const titoloLabel = (id?: string | null): string =>
  (id && TITOLI_ABILITATIVI.find(t => t.id === id)?.label) || (id || '');

// Categoria → ruolo (MANSIONI dell'app) per assegnare i task generati.
const CATEGORIA_ROLE: Record<string, string> = {
  'Rilievo': 'Sopralluoghi/Rilievi',
  'Rilievo cantiere': 'Sopralluoghi/Rilievi',
  'Studio di fattibilità': 'Architetto',
  'Architettonico': 'Architetto',
  'Strutturale': 'Ingegnere',
  'Impiantistico': 'Impiantista',
  'Perizie': 'Architetto',
  'Pratica edilizia': 'Pratiche',
  'Pratica ASL': 'Pratiche',
  'Pratica paesaggistica': 'Pratiche',
  'Pratica energetica': 'Impiantista',
  'Pratica strutturale': 'Ingegnere',
  'Accatastamento': 'Geometra',
  'Pratica produttiva': 'Pratiche',
  'Pratica insegna': 'Pratiche',
  'Comunicazioni': 'Pratiche',
  'Bandi': 'Amministrazione',
  'Collaudi': 'Ingegnere',
  'Contabilità': 'Amministrazione',
  'Sicurezza': 'Sicurezza',
  'Assistenza cantiere': 'Direzione Lavori',
  'Assistenza cliente': 'Direzione Lavori',
  'ENEL': 'Pratiche',
  'Contabilità cantiere': 'Computi',
  'Controllo strutture': 'Direzione Lavori',
  'Diagnosi': 'Ingegnere',
  'Intervento': 'Ingegnere',
  'Pipeline': 'Amministrazione',
  'Documenti': 'Amministrazione'
};
export const roleForCategoria = (categoria: string): string | null => CATEGORIA_ROLE[categoria] || null;

// La categoria "Pratica edilizia" contiene i task dei tre titoli (CILA/SCIA/P.d.C.):
// in base al titolo scelto teniamo solo quelli giusti + i task comuni (Agibilità, ecc.).
const TITOLO_PREFIX: Record<string, string | null> = {
  edilizia_libera: null,
  cila: 'CILA',
  scia: 'SCIA',
  scia_pdc: 'SCIA',
  pdc: 'P.d.C.'
};
const PRATICA_PREFIXES = ['CILA', 'SCIA', 'P.d.C.'];

/** Task della libreria Onirico filtrati per categorie selezionate e titolo abilitativo. */
export function studioTasks(categorie: string[], titolo: string) {
  const wanted = new Set(categorie);
  const prefix = TITOLO_PREFIX[titolo] ?? null;
  return TASK_LIBRARY.filter(t => {
    if (t.society !== 'Onirico' || !wanted.has(t.categoria)) return false;
    if (t.categoria !== 'Pratica edilizia') return true;
    const isTitoloDoc = PRATICA_PREFIXES.some(p => t.task.startsWith(p));
    if (!isTitoloDoc) return true;            // task comuni a tutte le pratiche
    return prefix ? t.task.startsWith(prefix) : false;
  });
}

/** Costruisce le fasi/task del progetto Studio dalle categorie + titolo scelti. */
export function buildStudioPhases(categorie: string[], titolo: string): Record<string, Phase> {
  const tasks = studioTasks(categorie, titolo);
  const phases: Record<string, Phase> = {};
  STUDIO_FASI.forEach((fase, fi) => {
    const ft = tasks.filter(t => t.fase === fase);
    if (!ft.length) return;
    const tasksMap: Record<string, ProjectTask> = {};
    ft.forEach((t, ti) => {
      const id = `t${ti}`;
      tasksMap[id] = { id, title: t.task, order: ti, done: false, role: roleForCategoria(t.categoria) };
    });
    const pid = `p${fi}`;
    phases[pid] = { id: pid, name: fase, order: fi, tasks: tasksMap };
  });
  return phases;
}

/** Riepilogo per l'anteprima nel modale: numero di fasi e task generati. */
export function studioSummary(categorie: string[], titolo: string) {
  const tasks = studioTasks(categorie, titolo);
  return { fasi: new Set(tasks.map(t => t.fase)).size, tasks: tasks.length };
}
