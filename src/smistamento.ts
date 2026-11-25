/**
 * Smistamento automatico delle richieste (nota utente tutti-1): il cliente scrive solo cosa
 * vuole, Aulico propone la società per parole chiave e lo staff conferma nel Point of Entry.
 * Una richiesta può toccare più società (es. B&B: progetto + lavori + marketing + gestione).
 */
export type SocKey = 'studio' | 'materico' | 'strategico' | 'unico' | 'fantastico';

export const SOC_NAME: Record<SocKey, string> = { studio: 'Onirico', materico: 'Materico', strategico: 'Strategico', unico: 'Unico', fantastico: 'Fantastico' };

const KEYWORDS: Record<SocKey, string[]> = {
  studio: ['progett', 'architett', 'rilievo', 'ristruttur', 'ampliament', 'pratica', 'permesso', 'cila', 'scia', 'catast', 'docfa', 'agibilit', 'ape ', 'certificazion', 'interni', 'arredo', 'arredi', 'render', 'casa', 'villa', 'trullo', 'lamia', 'masseria', 'b&b', 'bed and breakfast', 'piscina', 'giardino', 'sanatoria', 'condono', 'frazionament', 'cambio d\'uso', 'cambio di destinazione', 'direzione lavori', 'struttur', 'sismic'],
  materico: ['lavori', 'impresa', 'imprese', 'eseguire', 'realizzare', 'posa', 'fornitura', 'fornire', 'material', 'pavimento', 'pavimenti', 'rivestiment', 'infissi', 'finestre', 'porte', 'impianto', 'impianti', 'idraulic', 'elettric', 'cappotto', 'tetto', 'copertura', 'muratur', 'intonac', 'tinteggiat', 'bagno nuovo', 'rifare il bagno', 'cucina su misura', 'preventivo lavori', 'cantiere'],
  strategico: ['sito', 'web', 'logo', 'brand', 'marchio', 'social', 'instagram', 'facebook', 'marketing', 'pubblicit', 'sponsor', 'campagn', 'booking', 'airbnb', 'prenotazion', 'foto professional', 'video', 'comunicazion', 'grafica', 'nome della struttura'],
  unico: ['investiment', 'investire', 'investitor', 'rendita', 'rendiment', 'acquistare un immobile', 'comprare un immobile', 'compravendita', 'rivendere', 'rivendita', 'capitale', 'operazione immobiliare'],
  fantastico: ['gestione', 'gestire', 'manutenzion', 'pulizi', 'biancheria', 'giardinier', 'giardinaggio', 'ospiti', 'check-in', 'transfer', 'affitti brevi', 'property', 'custodia', 'apertura attivit', 'avvio attivit', 'codice identificativo', 'questura'],
};

/** Società suggerite, dalla più probabile; sempre almeno una (Onirico come capofila). */
export function classifica(text: string): { soc: SocKey; score: number }[] {
  const t = ` ${(text || '').toLowerCase()} `;
  const out = (Object.keys(KEYWORDS) as SocKey[]).map((soc) => ({
    soc, score: KEYWORDS[soc].reduce((a, k) => a + (t.includes(k) ? 1 : 0), 0),
  })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return out.length ? out : [{ soc: 'studio', score: 0 }];
}
