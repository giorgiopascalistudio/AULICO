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

import { Project, Furnishing, MatericoRequest, UnicoDeal, UnicoRoeConfig } from './types';

/** Le 4 società della holding. */
export type Company = 'studio' | 'strategico' | 'materico' | 'unico';

export const COMPANY_LABEL: Record<Company, string> = {
  studio: 'Onirico',
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
  // Intercompany (commesse interne): marcatura per l'elisione nel consolidato di gruppo
  internalOrderId?: string | null;
  counterpartySector?: Company | null;
  intercompany?: boolean;
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
  // Intercompany (commesse interne)
  internalOrderId?: string | null;
  counterpartySector?: Company | null;
  intercompany?: boolean;
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
  // Intercompany (commesse interne)
  internalOrderId?: string | null;
  counterpartySector?: Company | null;
  intercompany?: boolean;
}

// ============================================================
// Servizio core finance.record (bridge unico verso la finanza).
// Vedi docs/SCHEMA-COMMESSE-INTERNE.md §3. L'implementazione concreta
// (che scrive i nodi) vive in App.tsx; qui solo i tipi del contratto.
// ============================================================
export type FinanceKind = 'active' | 'passive' | 'scadenza';

export interface FinanceRecordInput {
  sector: Company;            // società a cui imputare il movimento
  kind: FinanceKind;
  amount: number;             // imponibile
  taxRate?: number;           // IVA (0/assente = non applicata)
  cassaPct?: number | null;
  description: string;
  counterparty?: string;      // nome cliente/fornitore (anche società del gruppo)
  date: string;
  dueDate?: string;
  // collegamenti (consolidato, commessa, filtri)
  projectId?: string;
  internalOrderId?: string;
  counterpartySector?: Company; // valorizzato per i movimenti intercompany
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

// --- Penali Materico per ritardo (override-abili) ---
export const MATERICO_PENALTY_PCT_PER_DAY = 1;  // 1% al giorno di ritardo
export const MATERICO_PENALTY_CAP_PCT = 10;     // tetto 10% sul costo partner

export interface MatericoPenaltyResult {
  days: number;
  pctPerDay: number;
  capPct: number;
  base: number;
  amount: number;
  capped: boolean;
}

/** Giorni di ritardo tra scadenza concordata e consegna (0 se non in ritardo). */
export function delayDays(agreed?: string | null, completed?: string | null): number {
  if (!agreed || !completed) return 0;
  const a = new Date(agreed).getTime();
  const c = new Date(completed).getTime();
  if (isNaN(a) || isNaN(c) || c <= a) return 0;
  return Math.ceil((c - a) / (1000 * 60 * 60 * 24));
}

/** Penale = base × %/giorno × giorni, con tetto. Funzione PURA. */
export function matericoPenalty(
  base: number,
  days: number,
  pctPerDay: number = MATERICO_PENALTY_PCT_PER_DAY,
  capPct: number = MATERICO_PENALTY_CAP_PCT,
): MatericoPenaltyResult {
  const b = base || 0;
  const raw = b * (pctPerDay / 100) * (days || 0);
  const cap = b * (capPct / 100);
  const amount = Math.min(raw, cap);
  return { days: days || 0, pctPerDay, capPct, base: b, amount, capped: raw > cap };
}

/** Margine operazione Unico: rivendita − acquisto − ristrutturazione. */
export function unicoMargin(deal: UnicoDeal): number {
  return (deal.targetSalePrice || 0) - (deal.acquisitionCost || 0) - (deal.renovationBudget || 0);
}

// ============================================================
// Cascata ROE di Unico (visione Aulico) — default override-abili.
// Vedi docs/SCHEMA-COMMESSE-INTERNE.md §2.
// ============================================================
export const UNICO_AGENCY_PCT = 3;       // % commissione agenzia su acquisto (landCost)
export const UNICO_ONIRICO_PCT = 15;     // % progettazione+DL Onirico su costo realizzazione (worksCost)
export const UNICO_STRATEGICO_FEE = 10000; // € promozione Strategico (fisso)
export const UNICO_RESALE_PCT = 4;       // % commissione rivendita su prezzo finale (resalePrice)

export interface RoeResult {
  agencyCost: number;     // landCost * agencyPct%
  oniricoCost: number;    // worksCost * oniricoPct%   → commessa interna a Onirico
  strategicoCost: number; // strategicoFee (fisso)     → commessa interna a Strategico
  resaleCost: number;     // resalePrice * resalePct%
  totalCost: number;      // land + agency + notary + onirico + works + strategico + resale
  netMargin: number;      // resalePrice − totalCost
  equity: number;         // capitale conferito (cap table)
  roe: number;            // netMargin / equity (0 se equity = 0)
  paybackMonths: number | null; // mesi tra acquisto e rivendita (se date presenti)
}

/** Differenza in mesi (arrotondata) tra due date ISO; null se mancanti/non valide. */
function monthsBetween(from?: string | null, to?: string | null): number | null {
  if (!from || !to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (isNaN(a) || isNaN(b) || b < a) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.4375));
}

/**
 * Calcola la cascata ROE di un'operazione Unico (funzione PURA).
 * `equity` = capitale conferito dagli investitori (dalla cap table del deal).
 * Le percentuali assenti usano i default `UNICO_*`.
 */
export function unicoRoe(cfg: UnicoRoeConfig, equity: number): RoeResult {
  const landCost = cfg.landCost || 0;
  const notaryCost = cfg.notaryCost || 0;
  const worksCost = cfg.worksCost || 0;
  const resalePrice = cfg.resalePrice || 0;
  const agencyPct = cfg.agencyPct ?? UNICO_AGENCY_PCT;
  const oniricoPct = cfg.oniricoPct ?? UNICO_ONIRICO_PCT;
  const strategicoFee = cfg.strategicoFee ?? UNICO_STRATEGICO_FEE;
  const resalePct = cfg.resalePct ?? UNICO_RESALE_PCT;

  const agencyCost = landCost * (agencyPct / 100);
  const oniricoCost = worksCost * (oniricoPct / 100);
  const strategicoCost = strategicoFee;
  const resaleCost = resalePrice * (resalePct / 100);
  const totalCost = landCost + agencyCost + notaryCost + oniricoCost + worksCost + strategicoCost + resaleCost;
  const netMargin = resalePrice - totalCost;
  const eq = equity || 0;
  const roe = eq > 0 ? netMargin / eq : 0;

  return {
    agencyCost,
    oniricoCost,
    strategicoCost,
    resaleCost,
    totalCost,
    netMargin,
    equity: eq,
    roe,
    paybackMonths: monthsBetween(cfg.purchaseDate, cfg.resaleDate),
  };
}

export interface CompanyBook {
  company: Company;
  ricavi: number;
  costi: number;
  netto: number;
}

/**
 * Consolida i libri delle società in KPI per società + totale gruppo.
 * `intercompany` (opzionale) = ricavi/costi generati DENTRO il gruppo (commesse
 * interne): restano nei libri di società singola ma vengono **elisi dal totale
 * di gruppo** (non gonfiano il fatturato consolidato).
 */
export function consolidato(
  byCompany: Record<Company, { ricavi: number; costi: number }>,
  intercompany?: { ricavi: number; costi: number },
): {
  books: CompanyBook[];
  totale: CompanyBook;
} {
  const companies: Company[] = ['studio', 'strategico', 'materico', 'unico'];
  const books: CompanyBook[] = companies.map((c) => {
    const r = byCompany[c]?.ricavi || 0;
    const k = byCompany[c]?.costi || 0;
    return { company: c, ricavi: r, costi: k, netto: r - k };
  });
  const grossR = books.reduce((s, b) => s + b.ricavi, 0);
  const grossK = books.reduce((s, b) => s + b.costi, 0);
  const elimR = intercompany?.ricavi || 0;
  const elimK = intercompany?.costi || 0;
  const totale: CompanyBook = {
    company: 'studio',
    ricavi: grossR - elimR,
    costi: grossK - elimK,
    netto: (grossR - elimR) - (grossK - elimK),
  };
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
