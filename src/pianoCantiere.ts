/**
 * Piano di cantiere automatico (nota utente bb-18 + moduli Onirico OA02 "Cantiere e
 * Sicurezza" e OA04 "Strutture"). Dal tipo di intervento e dalle date del cantiere genera:
 * checklist "prima di entrare" con punti di fermo, visite obbligatorie della DL, riunione
 * di avvio, ordini da anticipare, attese tecniche, scadenze di legge.
 * Le voci vivono in `cantiereRecords/<cid>` con section 'piano' (e 'getti' per il registro
 * dei getti); quelle da fare in una data diventano attività in agenda `tasks/pc-<cid>-<key>`.
 */

export type PianoFase = 'prima' | 'avvio' | 'strutture' | 'esecuzione' | 'chiusura';
export type PianoKind = 'check' | 'visita' | 'riunione' | 'ordine' | 'attesa' | 'scadenza' | 'ricorrente';

export interface PianoOpts {
  tipo: 'nuova' | 'ristrutturazione' | 'ampliamento';
  strutture: boolean;      // strutture in c.a. / muratura armata (denuncia sismica, getti, collaudo)
  demolizioni: boolean;
  amianto: boolean;
  piscina: boolean;
  confinati: boolean;      // cisterne, fosse, Imhoff, vasche
  scavi: boolean;
  piuImprese: boolean;     // più imprese → CSP/CSE, notifica preliminare
}

export interface PianoVoce {
  key: string;
  fase: PianoFase;
  kind: PianoKind;
  title: string;
  who: 'DL' | 'CSE' | 'Impresa' | 'Committente' | 'Progettista';
  hold?: boolean;          // punto di fermo: non si procede finché non è fatto
  note?: string;
  /** Posizione: giorni dall'inizio (start), giorni dalla fine (end) o frazione della durata (at). */
  start?: number; end?: number; at?: number;
  /** Ordini/attese: giorni di anticipo rispetto alla posizione. */
  lead?: number;
  when?: (o: PianoOpts) => boolean;
}

export const FASE_LABEL: Record<PianoFase, string> = {
  prima: 'Prima di entrare in cantiere',
  avvio: 'Avvio',
  strutture: 'Strutture',
  esecuzione: 'Esecuzione e finiture',
  chiusura: 'Chiusura',
};
export const KIND_LABEL: Record<PianoKind, string> = {
  check: 'Verifica', visita: 'Visita DL', riunione: 'Riunione', ordine: 'Ordine', attesa: 'Attesa tecnica', scadenza: 'Scadenza', ricorrente: 'Ricorrente',
};

const isEsistente = (o: PianoOpts) => o.tipo !== 'nuova';

export const LIBRERIA: PianoVoce[] = [
  // ---------------------------------------------------------------- prima di entrare
  { key: 'diagnosi-lotto', fase: 'prima', kind: 'check', who: 'DL', start: -21, title: 'Diagnosi del lotto', note: 'Pendenze e stabilità del suolo, linee elettriche aeree e pali ENEL, alberi da tutelare, preesistenze (trulli, lamie, cisterne, muretti a secco), accesso per i mezzi pesanti e strettoie.' },
  { key: 'diagnosi-strutturale', fase: 'prima', kind: 'check', who: 'Progettista', start: -30, when: (o) => isEsistente(o) && o.strutture, title: 'Diagnosi strutturale dell\'esistente', note: 'Rilievo materico, termografia, quadro fessurativo, saggi sulle fondazioni. Cambio d\'uso o sopraelevazione = adeguamento sismico.' },
  { key: 'amianto', fase: 'prima', kind: 'check', who: 'CSE', hold: true, start: -35, when: (o) => o.amianto, title: 'Amianto: piano di lavoro e notifica ASL', note: 'Ditta specializzata, notifica ASL almeno 30 giorni prima, smaltimento tracciato, collaudo di restituibilità.' },
  { key: 'ordigni', fase: 'prima', kind: 'check', who: 'CSE', start: -30, when: (o) => o.scavi, title: 'Valutazione rischio ordigni bellici', note: 'Il CSP valuta il rischio nel PSC; se probabile, parere dell\'autorità militare e bonifica prima degli scavi.' },
  { key: 'psc', fase: 'prima', kind: 'check', who: 'CSE', start: -21, when: (o) => o.piuImprese, title: 'PSC trasmesso alle imprese' },
  { key: 'layout', fase: 'prima', kind: 'check', who: 'CSE', hold: true, start: -14, title: 'Layout di cantiere nel PSC', note: 'Arretramento 5–6 m per betoniere e gru, recinzione rigida, parcheggio 6×12 m, bagno chimico, armadietto sicurezza (PSC, POS, fascicolo, registri), area carico/scarico, base del ponteggio, deposito terra di scavo (il volume raddoppia), quadro elettrico con messa a terra.' },
  { key: 'idoneita', fase: 'prima', kind: 'check', who: 'Committente', hold: true, start: -10, title: 'Idoneità delle imprese', note: 'CCIAA, DURC, autocertificazione requisiti, organico medio (sopra 200 uomini-giorno anche INPS/INAIL/Cassa Edile e contratto applicato).' },
  { key: 'denuncia-sismica', fase: 'prima', kind: 'check', who: 'Progettista', hold: true, start: -10, when: (o) => o.strutture, title: 'Denuncia sismica / autorizzazione e inizio lavori strutturali', note: 'Deposito al Genio Civile prima di qualunque lavoro strutturale.' },
  { key: 'pos', fase: 'prima', kind: 'check', who: 'CSE', hold: true, start: -7, title: 'POS verificati', note: 'Esecutrice → affidataria → CSE: verifica entro 15 giorni. Solo con esito positivo si entra.' },
  { key: 'notifica', fase: 'prima', kind: 'check', who: 'Committente', hold: true, start: -7, when: (o) => o.piuImprese, title: 'Notifica preliminare ad ASL e Ispettorato', note: 'Obbligatoria con più imprese o oltre 200 uomini-giorno. Va affissa in cantiere e aggiornata a ogni variante.' },
  { key: 'inizio-comune', fase: 'prima', kind: 'scadenza', who: 'DL', hold: true, start: -3, title: 'Comunicazione di inizio lavori al Comune', note: 'Entro un anno dal rilascio del titolo.' },
  { key: 'cartello', fase: 'prima', kind: 'check', who: 'Impresa', start: 0, title: 'Cartello di cantiere con tutte le nomine' },
  // ---------------------------------------------------------------- avvio
  { key: 'riunione-avvio', fase: 'avvio', kind: 'riunione', who: 'DL', start: 0, title: 'Riunione di avvio con imprese e fornitori', note: 'Presentare le regole: accessi, sicurezza, pulizia, documenti attesi, cronoprogramma.' },
  { key: 'messa-terra-cantiere', fase: 'avvio', kind: 'check', who: 'Impresa', start: 3, title: 'Dichiarazione di conformità della messa a terra del quadro di cantiere' },
  { key: 'pimus', fase: 'avvio', kind: 'check', who: 'Impresa', start: 7, title: 'PiMUS del ponteggio e base stabile', note: 'Basette su supporto coerente, diagonali e fermapiedi, distanza dalla parete non oltre 20 cm.' },
  { key: 'tracciamento', fase: 'avvio', kind: 'visita', who: 'DL', hold: true, start: 2, title: 'Tracciamento', note: 'Sempre con un riferimento e quote abbondanti; indicare scavo, fori, aerazioni e cavedi.' },
  { key: 'demolizioni', fase: 'avvio', kind: 'visita', who: 'DL', hold: true, at: 0.03, when: (o) => o.demolizioni, title: 'Verifica di stabilità prima delle demolizioni', note: 'Mai operare stando sul muro da demolire; convogliare i materiali.' },
  // ---------------------------------------------------------------- strutture
  { key: 'scavo-magrone', fase: 'strutture', kind: 'visita', who: 'DL', at: 0.08, when: (o) => o.strutture || o.scavi, title: 'Scavo pulito e magrone', note: 'Scavi oltre 1,5 m: pendenza entro il declivio naturale; regola 1:1 dal ciglio per i mezzi.' },
  { key: 'piscina-scavo', fase: 'strutture', kind: 'visita', who: 'DL', at: 0.12, when: (o) => o.piscina, title: 'Scavo della piscina', note: 'Steccato di tracciamento pulito, deposito terra ad almeno 3 m, area di stoccaggio per i reinterri.' },
  { key: 'armature-fondazioni', fase: 'strutture', kind: 'visita', who: 'DL', hold: true, at: 0.12, when: (o) => o.strutture, title: 'Armature di fondazione prima del getto', note: 'Diametri, posizione, copriferro. Foto prima di autorizzare il getto.' },
  { key: 'getto-fondazioni', fase: 'strutture', kind: 'visita', who: 'DL', hold: true, at: 0.13, when: (o) => o.strutture, title: 'Getto delle fondazioni con prelievo dei cubetti', note: 'DL presente; cubetti dalla betoniera o dalla pompa, mai dalla cassaforma; niente acqua aggiunta. Registrare il getto nel Registro getti.' },
  { key: 'armature-elevazioni', fase: 'strutture', kind: 'visita', who: 'DL', hold: true, at: 0.24, when: (o) => o.strutture, title: 'Armature di elevazioni e solai prima del getto' },
  { key: 'getto-solai', fase: 'strutture', kind: 'visita', who: 'DL', hold: true, at: 0.26, when: (o) => o.strutture, title: 'Getto di solai e coperture con prelievo dei cubetti' },
  { key: 'scassero', fase: 'strutture', kind: 'visita', who: 'DL', at: 0.31, when: (o) => o.strutture, title: 'Scassero: controllo nidi di ghiaia e allineamenti' },
  // ---------------------------------------------------------------- esecuzione
  { key: 'confinati', fase: 'esecuzione', kind: 'check', who: 'CSE', at: 0.2, when: (o) => o.confinati, title: 'Procedura ambienti confinati', note: 'Cisterne, fosse, vasche: misura dell\'atmosfera, ventilazione, assistente esterno, attrezzatura ATEX.' },
  { key: 'impermeabilizzazioni', fase: 'esecuzione', kind: 'visita', who: 'DL', hold: true, at: 0.42, title: 'Impermeabilizzazioni e copertura prima della chiusura' },
  { key: 'ordine-rubinetteria', fase: 'esecuzione', kind: 'ordine', who: 'DL', at: 0.5, lead: 28, title: 'Ordine della rubinetteria a incasso', note: '4 settimane prima degli impianti sottotraccia.' },
  { key: 'impianti-sottotraccia', fase: 'esecuzione', kind: 'visita', who: 'DL', hold: true, at: 0.5, title: 'Impianti sottotraccia prima delle chiusure', note: 'Foto di tutti i passaggi prima di intonaci e massetti.' },
  { key: 'ordine-infissi', fase: 'esecuzione', kind: 'ordine', who: 'DL', at: 0.7, lead: 56, title: 'Ordine di infissi e soglie', note: '8 settimane prima della posa.' },
  { key: 'massetti', fase: 'esecuzione', kind: 'attesa', who: 'DL', at: 0.58, title: 'Massetti: 28 giorni di asciugatura', note: 'Prima della posa dei pavimenti.' },
  { key: 'intonaci', fase: 'esecuzione', kind: 'attesa', who: 'DL', at: 0.6, title: 'Intonaci: arieggiare 28 giorni', note: 'Chiudere le finestre troppo presto intrappola l\'umidità.' },
  { key: 'ordine-ceramiche', fase: 'esecuzione', kind: 'ordine', who: 'DL', at: 0.75, lead: 84, title: 'Conferma dei materiali ceramici', note: '12 settimane prima della posa. Collegata alle scelte di Arredi & Moodboard del cliente.' },
  { key: 'piscina-impianto', fase: 'esecuzione', kind: 'visita', who: 'DL', at: 0.7, when: (o) => o.piscina, title: 'Impianto della piscina prima dei rivestimenti', note: 'Skimmer o sfioro, vasca di compenso, bocchette, locale tecnico.' },
  { key: 'test-differenziale', fase: 'esecuzione', kind: 'ricorrente', who: 'Impresa', start: 7, title: 'Test del pulsante "T" del differenziale (ogni lunedì)' },
  { key: 'sopralluogo-settimanale', fase: 'esecuzione', kind: 'ricorrente', who: 'DL', start: 4, title: 'Sopralluogo settimanale della DL (annuncialo all\'impresa)', note: '"Giovedì vengo a controllare X": la lista delle attività a breve termine spinge il cantiere.' },
  { key: 'caldo', fase: 'esecuzione', kind: 'check', who: 'CSE', at: 0.4, title: 'Caldo oltre 35°: stop dalle 11 alle 15 se previsto nel PSC' },
  // ---------------------------------------------------------------- chiusura
  { key: 'collaudi-impianti', fase: 'chiusura', kind: 'check', who: 'Impresa', end: -10, title: 'Collaudi e dichiarazioni di conformità degli impianti' },
  { key: 'messa-terra-def', fase: 'chiusura', kind: 'check', who: 'Impresa', end: -7, title: 'Messa a terra definitiva' },
  { key: 'fine-lavori', fase: 'chiusura', kind: 'scadenza', who: 'DL', end: 0, title: 'Comunicazione di fine lavori' },
  { key: 'agibilita', fase: 'chiusura', kind: 'scadenza', who: 'DL', end: 15, title: 'Richiesta di agibilità', note: 'Dopo collaudo statico, DOCFA, APE e conformità: vedi Fase abilitativa.' },
];

const DAY = 864e5;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Voci del piano con la loro data, per le opzioni e le date del cantiere. */
export function generaPiano(o: PianoOpts, startISO: string, endISO: string): (PianoVoce & { date: string })[] {
  const s = new Date(startISO + 'T12:00:00').getTime();
  const e = Math.max(new Date(endISO + 'T12:00:00').getTime(), s + 30 * DAY);
  return LIBRERIA.filter((v) => !v.when || v.when(o)).map((v) => {
    let t = v.start != null ? s + v.start * DAY : v.end != null ? e + v.end * DAY : s + (v.at || 0) * (e - s);
    if (v.lead) t -= v.lead * DAY;
    return { ...v, date: iso(t) };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/** Prelievi minimi (controllo di tipo A, NTC 2018): 1 per giorno di getto, 3 ogni 300 m³. */
export function prelieviMinimi(getti: { date?: string | null; m3: number }[]): number {
  const giorni = new Set(getti.map((g) => g.date).filter(Boolean)).size;
  const m3 = getti.reduce((a, g) => a + (Number(g.m3) || 0), 0);
  return Math.max(giorni, m3 > 0 ? 3 * Math.ceil(m3 / 300) : 0);
}

/** Opzioni di partenza dal tipo di intervento della pratica. */
export function optsDaPratica(tipoIntervento?: string | null): PianoOpts {
  const t = (tipoIntervento || '').toLowerCase();
  const nuova = /nuova|demolizione e ricostruzione/.test(t);
  const pesante = /pesante|nuova|demoliz|cambio/.test(t);
  return {
    tipo: nuova ? 'nuova' : /ampliam/.test(t) ? 'ampliamento' : 'ristrutturazione',
    strutture: pesante || nuova, demolizioni: /demoliz|ristruttur/.test(t), amianto: false,
    piscina: false, confinati: false, scavi: nuova || pesante, piuImprese: true,
  };
}
