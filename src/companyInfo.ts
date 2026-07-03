/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * companyInfo — dati "carta intestata" per società, usati dalla generazione
 * documenti da modello (preventivi/contratti stampabili). Fonte: i modelli
 * DOCX in AULICO 2.0/docs/SEZIONI/<società>/COMMERCIALE (preventivi ESEMPIO
 * + carte intestate). Le società senza dati (Unico/Fantastico) hanno campi
 * vuoti che nel documento vengono resi come righe da completare.
 */

export interface CompanyDocInfo {
  legalName: string;          // ragione sociale completa (firma)
  brand: string;              // nome breve/logo testuale
  piva?: string;
  address?: string;           // sede
  contacts?: string;          // riga contatti footer (tel/email/web/social)
  pec?: string;
  bank?: string;
  iban?: string;
  validityDays: number;       // validità preventivo di default
  importiNote: string;        // nota sotto al totale (IVA/cassa…)
  acceptText: string;         // testo ACCETTAZIONE
  extraNote?: string;         // N.B. finale (es. documentazione richiesta Onirico)
}

export const COMPANY_DOC: Record<string, CompanyDocInfo> = {
  studio: {
    legalName: 'Onirico Design Società Tra Professionisti S.R.L.',
    brand: 'onirico',
    piva: '02751830742',
    address: 'C.da Rosara - 72017 Ostuni (BR)',
    contacts: 'T. +39 0831 303 448 · info@oniricodesign.com · oniricodesign.com · IG/FB @onirico_dyv',
    bank: 'Banca di Credito Cooperativo di Ostuni',
    iban: 'IT21D0870615900000000710065',
    validityDays: 3,
    importiNote: 'Gli importi della presente commissione si intendono al netto di IVA 22%, CNPAIA 4%, diritti di segreteria ed eventuali oneri a terzi enti coinvolti. Eventuali modifiche e variazioni alla soluzione di progetto proposta saranno quantificate in corso a seconda delle specifiche richieste.',
    acceptText: 'La firma del presente documento e il contestuale pagamento del primo acconto determina l\'accettazione del preventivo. Le tempistiche sopra descritte verranno ricalcolate nel caso in cui il pagamento del primo acconto dovesse avvenire oltre i giorni di validità del preventivo.',
    extraNote: 'Al fine di avviare le attività previste dal presente preventivo, il Cliente è tenuto a fornire la seguente documentazione tramite email all\'indirizzo progetti@oniricodesign.com: codice fiscale e carta d\'identità del committente; visura camerale (in caso di società); atto di locazione (se l\'immobile non è di proprietà); copia del titolo di proprietà dell\'immobile; documentazione catastale aggiornata; eventuali permessi edilizi già ottenuti; planimetrie esistenti dell\'immobile (DWG o PDF).',
  },
  strategico: {
    legalName: 'Strategico S.R.L.',
    brand: 'strategico',
    piva: '02799350745',
    address: 'Via Ten. Antonio Tanzarella, 1 - 72017 Ostuni (BR)',
    contacts: 'Tel +39 0831 303448',
    pec: 'strategicosrl@pec.it',
    bank: 'Banca di Credito Cooperativo di Ostuni',
    iban: 'IT46Y0870615900000000710060',
    validityDays: 7,
    importiNote: 'Gli importi della presente commissione si intendono al netto di IVA 22%.',
    acceptText: 'La firma del presente documento e il contestuale pagamento determina l\'accettazione del preventivo.',
  },
  materico: {
    legalName: 'Materico S.R.L.',
    brand: 'materico',
    piva: '02799360744',
    address: '72017 Ostuni (BR)',
    bank: 'Banca di Credito Cooperativo di Ostuni',
    iban: 'IT67B0870615900000000710063',
    validityDays: 7,
    importiNote: 'Gli importi della presente commissione si intendono al netto di IVA 22%.',
    acceptText: 'La firma del presente documento e il contestuale pagamento determina l\'accettazione del preventivo.',
  },
  unico: {
    legalName: 'Unico S.R.L.',
    brand: 'unico',
    validityDays: 7,
    importiNote: 'Gli importi della presente commissione si intendono al netto di IVA 22%.',
    acceptText: 'La firma del presente documento e il contestuale pagamento determina l\'accettazione del preventivo.',
  },
  fantastico: {
    legalName: 'Fantastico S.R.L.',
    brand: 'fantastico',
    validityDays: 7,
    importiNote: 'Gli importi della presente commissione si intendono al netto di IVA 22%.',
    acceptText: 'La firma del presente documento e il contestuale pagamento determina l\'accettazione del preventivo.',
  },
};

export const companyDoc = (soc: string): CompanyDocInfo =>
  COMPANY_DOC[soc] || { legalName: soc, brand: soc, validityDays: 7, importiNote: 'Gli importi si intendono al netto di IVA 22%.', acceptText: 'La firma del presente documento determina l\'accettazione del preventivo.' };
