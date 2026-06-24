/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Motore finanziario della holding Onirico.
 * Funzioni PURE riusate da FinanzeView, ClientPortalView, FurnishingsBoard.
 * Regole di ricavo per società:
 *  - Studio: 15% del valore opera (computo lavori + arredi fissi) + 20% arredi mobili
 *            se lo Studio ne cura scelta/approvvigionamento. Pagamento a SAL.
 *  - Materico: ricarico 15% sul costo partner (il margine È il ricavo Studio/Materico).
 *  - Unico: margine = prezzo di rivendita − acquisto − ristrutturazione.
 */

import { Project, Furnishing, MatericoRequest, UnicoDeal } from './types';

/** Le 4 società della holding. */
export type Company = 'studio' | 'strategico' | 'materico' | 'unico';

export const COMPANY_LABEL: Record<Company, string> = {
  studio: 'Studio',
  strategico: 'Strategico',
  materico: 'Materico',
  unico: 'Unico'
};

/** Prefisso numerazione fatture per società (libri separati). */
export const COMPANY_INVOICE_PREFIX: Record<Company, string> = {
  studio: 'FE-STU',
  strategico: 'FE-STR',
  materico: 'FE-MAT',
  unico: 'FE-UNI'
};

/** Colore identificativo della società (schema grafico Onirico, vedi CLAUDE.md §10). */
export const COMPANY_COLOR: Record<Company, string> = {
  studio: '#161616',
  strategico: '#b45309',
  materico: '#c2410c',
  unico: '#4338ca'
};

// --- Costanti di default (override-abili per progetto) ---
export const STUDIO_FEE_PCT = 0.15;
export const ARREDI_MOBILI_FEE_PCT = 0.20;
export const MATERICO_MARKUP_PCT = 0.15;
export const VAT_PCT_DEFAULT = 22;     // aliquota IVA ordinaria
export const CASSA_PCT_DEFAULT = 4;    // cassa previdenziale (Inarcassa)

// ============================================================
// Interfacce finanza condivise (prima locali in FinanzeView)
// `sector` esteso a 'unico'.
// ============================================================
export interface ComputoItem {
  id: string;
  desc: string;
  category: string; // Demolizioni, Murature, Impianti, Finiture, Allestimenti, Strategia
  quantity: number;
  unitPrice: number;
}

export interface Computo {
  id: string;
  projectId: string;
  title: string;
  items: ComputoItem[];
  sourceFileName?: string; // file originale caricato (xlsx/csv/pdf di riferimento)
}

export interface InvoiceActive {
  id: string;
  clientName: string;
  projectId: string;
  projectName: string;
  amount: number;  // imponibile
  taxRate: number; // aliquota IVA (0 = IVA non applicata)
  cassaPct?: number | null; // % cassa previdenziale (null/0 = non applicata)
  status: 'bozza' | 'inviata_sdi' | 'consegnata_sdi' | 'pagata' | 'scaduta';
  sdiCode: string;
  date: string;
  dueDate: string;
  sector: Company;
  isSal?: boolean;
  salNumber?: number;
}

export interface InvoicePassive {
  id: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  amount: number;
  category: string;
  status: 'ricevuta' | 'approvata' | 'pagata' | 'scaduta';
  date: string;
  dueDate: string;
  sector: Company;
  description: string;
}

export interface ScadenzaItem {
  id: string;
  kind: 'entrata' | 'uscita';
  desc: string;
  clientOrSupplier: string;
  amount: number;
  dueDate: string;
  status: 'scaduta' | 'pago_attesa' | 'pagato';
  projectId?: string;
  sector: Company;
}

// ============================================================
// Funzioni di calcolo
// ============================================================

/**
 * Totali di un documento fiscale con IVA e Cassa previdenziale spuntabili.
 * La cassa (es. Inarcassa 4%) concorre alla base imponibile IVA:
 * totale = (imponibile + cassa) × (1 + IVA%).
 */
export interface DocTotals {
  imponibile: number;
  cassa: number;
  iva: number;
  totale: number;
}

export function docTotals(imponibile: number, vatPct: number, cassaPct: number): DocTotals {
  const base = Number(imponibile) || 0;
  const cassa = base * ((Number(cassaPct) || 0) / 100);
  const iva = (base + cassa) * ((Number(vatPct) || 0) / 100);
  return { imponibile: base, cassa, iva, totale: base + cassa + iva };
}

/** Totali documento di un preventivo/parcella (nodo quotes). */
export function quoteTotals(q: {
  lines?: { amount: number }[];
  vatEnabled?: boolean; vatPct?: number;
  cassaEnabled?: boolean; cassaPct?: number;
}): DocTotals {
  const imponibile = (q.lines || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const vat = (q.vatEnabled ?? true) ? (q.vatPct ?? VAT_PCT_DEFAULT) : 0;
  const cassa = q.cassaEnabled ? (q.cassaPct ?? CASSA_PCT_DEFAULT) : 0;
  return docTotals(imponibile, vat, cassa);
}

/** Totali documento di una fattura attiva (amount = imponibile). */
export function invoiceTotals(inv: { amount: number; taxRate?: number; cassaPct?: number | null }): DocTotals {
  return docTotals(inv.amount, inv.taxRate ?? 0, inv.cassaPct ?? 0);
}

/** Totale del computo metrico = Σ(q.tà × prezzo unitario). */
export function computoTotal(computo?: Computo | null): number {
  if (!computo || !computo.items) return 0;
  return computo.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
}

/**
 * Totali arredi per tipo: fissi vs mobili. Σ price×(quantity||1).
 * Distingue il **valore selezionato** (tutti gli item con prezzo) dal **valore
 * confermato** (`status:'confermato'`): SOLO i confermati entrano in contabilità
 * (parcella, SAL, snapshot portale). I non confermati restano scelte in corso.
 */
export function arrediTotals(furnishings: Furnishing[]): {
  fissi: number;
  mobili: number;
  fissiConfermati: number;
  mobiliConfermati: number;
} {
  let fissi = 0;
  let mobili = 0;
  let fissiConfermati = 0;
  let mobiliConfermati = 0;
  for (const f of furnishings || []) {
    const val = (Number(f.price) || 0) * (Number(f.quantity) || 1);
    if (f.kind === 'fisso') {
      fissi += val;
      if (f.status === 'confermato') fissiConfermati += val;
    } else {
      mobili += val;
      if (f.status === 'confermato') mobiliConfermati += val;
    }
  }
  return { fissi, mobili, fissiConfermati, mobiliConfermati };
}

export interface ParcellaResult {
  baseOpera: number;       // computo + arredi fissi
  feePct: number;          // % onorari Studio
  onorari: number;         // 15% × baseOpera
  managesMobili: boolean;
  mobiliFeePct: number;    // % fee arredi mobili
  arrediMobili: number;    // valore arredi mobili
  feeMobili: number;       // 20% × arredi mobili (se gestiti)
  totaleParcella: number;  // onorari + feeMobili
}

/**
 * Parcella Studio: 15% su (computo + arredi fissi) + 20% su arredi mobili gestiti.
 * Le % sono override-abili sul progetto.
 */
export function studioParcella(
  project: Pick<Project, 'studioManagesArrediMobili' | 'studioFeePct' | 'arrediMobiliFeePct'> | null | undefined,
  computoTot: number,
  arrediFissi: number,
  arrediMobili: number
): ParcellaResult {
  const feePct = project?.studioFeePct ?? STUDIO_FEE_PCT;
  const mobiliFeePct = project?.arrediMobiliFeePct ?? ARREDI_MOBILI_FEE_PCT;
  const managesMobili = !!project?.studioManagesArrediMobili;

  const baseOpera = (computoTot || 0) + (arrediFissi || 0);
  const onorari = baseOpera * feePct;
  const feeMobili = managesMobili ? (arrediMobili || 0) * mobiliFeePct : 0;

  return {
    baseOpera,
    feePct,
    onorari,
    managesMobili,
    mobiliFeePct,
    arrediMobili: arrediMobili || 0,
    feeMobili,
    totaleParcella: onorari + feeMobili
  };
}

export interface MatericoMarginResult {
  baseCost: number;     // costo partner (miglior offerta o offerta selezionata)
  markupPct: number;    // % di ricarico
  clientPrice: number;  // prezzo al cliente
  ricavoStudio: number; // margine Materico = ricavo holding
}

/**
 * Margine Materico: ricarico sul costo partner.
 * baseCost = offerta del partner selezionato, altrimenti la più conveniente.
 */
export function matericoMargin(req: MatericoRequest): MatericoMarginResult {
  const offers = Object.values(req.offers || {});
  let baseCost = 0;
  if (req.selectedPartnerUid && req.offers && req.offers[req.selectedPartnerUid]) {
    baseCost = req.offers[req.selectedPartnerUid].amount;
  } else if (offers.length > 0) {
    baseCost = Math.min(...offers.map((o) => o.amount));
  }
  const markupPct = (req.marginPct ?? MATERICO_MARKUP_PCT * 100) / 100;
  const clientPrice = req.clientPrice != null ? req.clientPrice : Math.round(baseCost * (1 + markupPct));
  return {
    baseCost,
    markupPct,
    clientPrice,
    ricavoStudio: Math.max(0, clientPrice - baseCost)
  };
}

/** Margine operazione Unico: rivendita − acquisto − ristrutturazione. */
export function unicoMargin(deal: UnicoDeal): number {
  return (deal.targetSalePrice || 0) - (deal.acquisitionCost || 0) - (deal.renovationBudget || 0);
}

export interface CompanyBook {
  company: Company;
  ricavi: number;
  costi: number;
  netto: number;
}

/** Consolida i libri delle società in KPI per società + totale gruppo. */
export function consolidato(byCompany: Record<Company, { ricavi: number; costi: number }>): {
  books: CompanyBook[];
  totale: CompanyBook;
} {
  const companies: Company[] = ['studio', 'strategico', 'materico', 'unico'];
  const books: CompanyBook[] = companies.map((c) => {
    const r = byCompany[c]?.ricavi || 0;
    const k = byCompany[c]?.costi || 0;
    return { company: c, ricavi: r, costi: k, netto: r - k };
  });
  const totale: CompanyBook = books.reduce(
    (acc, b) => ({ company: 'studio', ricavi: acc.ricavi + b.ricavi, costi: acc.costi + b.costi, netto: acc.netto + b.netto }),
    { company: 'studio' as Company, ricavi: 0, costi: 0, netto: 0 }
  );
  return { books, totale };
}

// ============================================================
// Parser CSV/TSV nativo per import computo (no dipendenze).
// Excel (.xlsx): richiede SheetJS — vedi nota in FinanzeView.
// ============================================================

/** Una riga grezza del file importato (cella per colonna). */
export type RawRow = string[];

export interface ParsedSheet {
  headers: string[];
  rows: RawRow[];
}

/** Riconosce il separatore (virgola, punto e virgola, tab). */
function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    ';': (line.match(/;/g) || []).length,
    ',': (line.match(/,/g) || []).length,
    '\t': (line.match(/\t/g) || []).length
  };
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || ',';
}

/** Parser CSV minimale con supporto a campi quotati. */
export function parseCsv(text: string): ParsedSheet {
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = clean.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const delim = detectDelimiter(lines[0]);

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

/** Mappatura colonna → campo del computo. */
export interface ColumnMapping {
  desc: number;
  category: number;
  quantity: number;
  unitPrice: number;
}

/** Tenta di indovinare la mappatura colonne dagli header. */
export function guessMapping(headers: string[]): ColumnMapping {
  const find = (...keys: string[]) => {
    const idx = headers.findIndex((h) => keys.some((k) => h.toLowerCase().includes(k)));
    return idx;
  };
  return {
    desc: find('descr', 'lavoro', 'voce', 'articolo'),
    category: find('categ', 'tipo', 'capitolo'),
    quantity: find('q.tà', 'q.ta', 'quant', 'qta', 'qty'),
    unitPrice: find('prezzo', 'unit', 'importo', 'costo', '€')
  };
}

/** Converte le righe grezze in ComputoItem[] secondo la mappatura. */
export function rowsToComputoItems(rows: RawRow[], map: ColumnMapping): ComputoItem[] {
  const num = (s?: string) => {
    if (s == null) return 0;
    return parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0;
  };
  const items: ComputoItem[] = [];
  rows.forEach((r, i) => {
    const desc = map.desc >= 0 ? (r[map.desc] || '').trim() : '';
    const quantity = map.quantity >= 0 ? num(r[map.quantity]) : 0;
    const unitPrice = map.unitPrice >= 0 ? num(r[map.unitPrice]) : 0;
    if (!desc && !quantity && !unitPrice) return; // riga vuota
    items.push({
      id: `ci-imp-${Date.now()}-${i}`,
      desc: desc || `Voce ${i + 1}`,
      category: map.category >= 0 ? (r[map.category] || 'Opere Edili').trim() || 'Opere Edili' : 'Opere Edili',
      quantity: quantity || 1,
      unitPrice
    });
  });
  return items;
}
