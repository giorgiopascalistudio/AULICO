/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * serviceBenefits — catalogo "vantaggi" dei servizi (dal DOCX Onirico
 * "MODALITÀ OPERATIVE DEL SERVIZIO DI PROGETTAZIONE": ogni attività ha
 * obiettivo / cosa evita / cosa garantisce). Usato dal preventivo interattivo
 * del portale: quando il cliente esclude una voce, il banner spiega cosa perde.
 * Match per parole-chiave sulla descrizione della riga (line.benefits vince).
 */

interface BenefitEntry { keys: string[]; benefit: string; }

const CATALOG: BenefitEntry[] = [
  { keys: ['rilievo architettonico', 'laser scanner', 'rilievo dell'], benefit: 'Il rilievo con laser scanner restituisce lo stato di fatto con altissima precisione: evita errori dimensionali e incongruenze tra progetto e realtà, riduce i costi imprevisti in cantiere.' },
  { keys: ['rilievo topografico', 'topografic'], benefit: 'Il rilievo topografico definisce quote, pendenze e confini del terreno: evita errori di inserimento del progetto nel contesto reale e garantisce controllo nelle fasi successive.' },
  { keys: ['moodboard', 'analisi', 'concept', 'riferimenti'], benefit: 'La fase di analisi e moodboard allinea studio e cliente PRIMA di progettare: evita ripensamenti e revisioni costose, dà coerenza a tutte le scelte successive.' },
  { keys: ['preliminare'], benefit: 'Il progetto preliminare (fino a 2 soluzioni) traduce le esigenze in una proposta concreta e valutabile: evita scelte affrettate e modifiche rilevanti nelle fasi avanzate.' },
  { keys: ['esecutivo', 'esecutiva'], benefit: 'Il progetto esecutivo definisce ogni dettaglio prima del cantiere: evita modifiche in corso d\'opera e garantisce precisione nella realizzazione.' },
  { keys: ['opere su misura', 'disegni esecutivi', 'su misura'], benefit: 'I disegni esecutivi delle opere su misura definiscono misure, materiali e dettagli per la produzione: evitano errori di realizzazione e adattamenti in cantiere.' },
  { keys: ['render', '3d', 'modellazione'], benefit: 'Modello 3D e render fotorealistici (fino a 10 esterni e 15 interni) mostrano il risultato PRIMA di realizzarlo: evitano incomprensioni e danno piena consapevolezza delle scelte.' },
  { keys: ['schema impianti', 'impianti'], benefit: 'Lo schema impianti integra tutti gli impianti con l\'architettura: evita interferenze e problematiche d\'uso, garantisce comfort e qualità abitativa.' },
  { keys: ['elettrico'], benefit: 'Il progetto elettrico definisce la distribuzione dell\'impianto: evita impianti inadeguati o modifiche in cantiere, garantisce sicurezza e affidabilità quotidiana.' },
  { keys: ['strutturale', 'struttura'], benefit: 'Il progetto strutturale garantisce stabilità e sicurezza dell\'edificio: evita criticità strutturali e non conformità nel tempo.' },
  { keys: ['computo'], benefit: 'Il computo metrico quantifica lavorazioni, materiali e costi nel dettaglio: evita aumenti imprevisti e perdita di controllo economico sull\'investimento.' },
  { keys: ['capitolato'], benefit: 'Il capitolato fissa materiali, finiture e modalità esecutive: evita ambiguità con l\'impresa e riduzioni di qualità, garantisce coerenza tra progetto e realizzazione.' },
  { keys: ['cila'], benefit: 'La CILA consente di avviare l\'intervento in modo rapido e conforme: evita sanzioni e irregolarità.' },
  { keys: ['scia'], benefit: 'La SCIA permette l\'avvio immediato di interventi complessi: evita ritardi burocratici e non conformità.' },
  { keys: ['permesso di costruire', 'pdc'], benefit: 'Il Permesso di Costruire consente opere complesse in piena regolarità: evita blocchi amministrativi e contenziosi, garantisce la legittimità dell\'opera nel tempo.' },
  { keys: ['paesaggistica'], benefit: 'L\'autorizzazione paesaggistica è necessaria nelle aree vincolate: evita il blocco dell\'intervento e sanzioni.' },
  { keys: ['direzione lavori', 'dl '], benefit: 'La direzione lavori controlla che il cantiere rispetti progetto, tempi e qualità: evita difformità, contestazioni e costi extra.' },
  { keys: ['ff&e', 'arredi', 'arredo'], benefit: 'Il servizio arredi/FF&E cura ricerca, selezione e coordinamento delle forniture: evita acquisti incoerenti col progetto e garantisce un risultato curato in ogni dettaglio.' },
  { keys: ['ape', 'energetic'], benefit: 'La pratica energetica certifica le prestazioni dell\'immobile: obbligatoria per compravendite/locazioni, valorizza l\'immobile.' },
  { keys: ['catast'], benefit: 'L\'aggiornamento catastale mantiene l\'immobile conforme: evita problemi in compravendita e sanzioni.' },
];

/** Vantaggio da mostrare quando il cliente esclude una voce (fallback generico). */
export function benefitFor(desc?: string | null, own?: string | null): string {
  if (own && own.trim()) return own.trim();
  const d = (desc || '').toLowerCase();
  const hit = CATALOG.find((e) => e.keys.some((k) => d.includes(k)));
  return hit?.benefit
    || 'Questa attività è parte del percorso consigliato dallo studio: escludendola rinunci al relativo risultato e alle garanzie che offre nelle fasi successive del progetto.';
}
