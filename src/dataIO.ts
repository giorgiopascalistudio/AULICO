/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * dataIO — import/export tabellare riusabile per tutto il gestionale.
 *  • readTabularFile(file)  → legge .xlsx/.xls (SheetJS) OPPURE .csv/.txt e
 *    restituisce una griglia string[][] (header incluso in riga 0). Così ogni
 *    importer esistente (che già lavora su string[][]) accetta anche Excel.
 *  • exportXlsx / exportXlsxMulti → genera veri file .xlsx.
 *  • exportPdf → apre una finestra di stampa con carta intestata della società
 *    (nessuna dipendenza: l'utente sceglie "Salva come PDF").
 *
 * SheetJS (`xlsx`) è pesante (~400KB) → import DINAMICO: sta in un chunk a parte,
 * scaricato solo alla prima operazione Excel (come il moodboard 3D). L'export PDF
 * NON usa xlsx e resta sempre disponibile.
 */
import { companyDoc } from './companyInfo';

// ------------------------------------------------------------------ tipi
/** Descrittore di colonna: una sola definizione serve sia a Excel sia a PDF. */
export interface ExportColumn<T> {
  header: string;
  /** Valore grezzo della cella (numero per i tipi numerici → Excel può sommarli). */
  value: (row: T, index: number) => string | number | boolean | null | undefined;
  /** Tipo per la formattazione: number/currency vengono allineati a destra nel PDF. */
  type?: 'text' | 'number' | 'currency' | 'date';
  /** Larghezza colonna (in caratteri) per Excel. */
  width?: number;
}

export interface Sheet<T> {
  name: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

// ------------------------------------------------------------------ util
const escapeHtml = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const nfNum = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const nfCur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

/** Testo formattato di una cella (per il PDF/umani). */
function displayCell<T>(col: ExportColumn<T>, row: T, i: number): string {
  const raw = col.value(row, i);
  if (raw == null || raw === '') return '';
  if (col.type === 'currency') {
    const n = Number(raw);
    return Number.isFinite(n) ? nfCur.format(n) : String(raw);
  }
  if (col.type === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? nfNum.format(n) : String(raw);
  }
  return String(raw);
}

/** Valore grezzo di una cella per Excel (numero dove ha senso, così è sommabile). */
function xlsxCell<T>(col: ExportColumn<T>, row: T, i: number): string | number {
  const raw = col.value(row, i);
  if (raw == null) return '';
  if (col.type === 'currency' || col.type === 'number') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return typeof raw === 'number' ? raw : String(raw);
}

/** Nome file "sicuro" con data: base → base_2026-07-09.ext */
export function stampFilename(base: string, ext: string): string {
  const clean = base.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 80) || 'export';
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${clean}_${day}.${ext}`;
}

// ------------------------------------------------------------------ CSV → grid
/** Parser CSV robusto (virgolette, campi multi-riga, delimitatore , ; o tab auto). */
export function csvToGrid(text: string): string[][] {
  const head = text.slice(0, text.indexOf('\n') >= 0 ? text.indexOf('\n') : text.length);
  const counts: Record<string, number> = {
    ';': (head.match(/;/g) || []).length,
    ',': (head.match(/,/g) || []).length,
    '\t': (head.match(/\t/g) || []).length,
  };
  const delim = (Object.keys(counts) as string[]).sort((a, b) => counts[b] - counts[a])[0] || ',';
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// ------------------------------------------------------------------ import
/**
 * Legge un file caricato dall'utente e restituisce una griglia string[][]
 * (riga 0 = intestazioni). Supporta .xlsx/.xls (primo foglio) e .csv/.txt.
 */
export async function readTabularFile(file: File): Promise<string[][]> {
  const name = (file.name || '').toLowerCase();
  const isExcel = /\.(xlsx|xls|xlsm|xlsb|ods)$/.test(name) ||
    /sheet|excel|ms-excel|spreadsheet/.test(file.type || '');
  if (isExcel) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return [];
    const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false, defval: '', blankrows: false });
    return aoa.map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? '' : String(c).trim())) : []))
      .filter((r) => r.some((c) => c !== ''));
  }
  // CSV / testo
  const text = await file.text();
  return csvToGrid(text);
}

// ------------------------------------------------------------------ export Excel
async function buildWorkbook<T>(sheets: Sheet<T>[]) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach((sh, si) => {
    const header = sh.columns.map((c) => c.header);
    const body = sh.rows.map((row, i) => sh.columns.map((c) => xlsxCell(c, row, i)));
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws['!cols'] = sh.columns.map((c) => ({ wch: c.width ?? Math.max(10, c.header.length + 2) }));
    // nome foglio: max 31 char, niente caratteri vietati da Excel
    const safe = (sh.name || `Foglio ${si + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Foglio ${si + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, safe);
  });
  return { XLSX, wb };
}

/** Esporta una singola tabella in .xlsx. */
export async function exportXlsx<T>(filenameBase: string, sheetName: string, columns: ExportColumn<T>[], rows: T[]): Promise<void> {
  const { XLSX, wb } = await buildWorkbook([{ name: sheetName, columns, rows }]);
  XLSX.writeFile(wb, stampFilename(filenameBase, 'xlsx'), { compression: true });
}

/** Esporta più fogli in un unico .xlsx (es. Consolidato: un foglio per società). */
export async function exportXlsxMulti(filenameBase: string, sheets: Sheet<any>[]): Promise<void> {
  const { XLSX, wb } = await buildWorkbook(sheets);
  XLSX.writeFile(wb, stampFilename(filenameBase, 'xlsx'), { compression: true });
}

// ------------------------------------------------------------------ export PDF (stampa)
export interface PdfOptions<T> {
  title: string;
  subtitle?: string;
  /** slug società per la carta intestata (studio/strategico/materico/unico/fantastico). */
  company?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  /** righe di riepilogo in fondo (es. TOTALE). */
  footer?: { label: string; value: string }[];
}

/**
 * Esporta una tabella in PDF aprendo una finestra di stampa con carta intestata.
 * Nessuna dipendenza: l'utente sceglie "Salva come PDF" nella finestra di stampa.
 */
export function exportPdf<T>(opts: PdfOptions<T>): void {
  const { title, subtitle, company, columns, rows, footer } = opts;
  const doc = company ? companyDoc(company) : null;
  const landscape = columns.length > 5;

  const head = `<tr>${columns.map((c) => {
    const align = c.type === 'number' || c.type === 'currency' ? 'right' : 'left';
    return `<th style="text-align:${align}">${escapeHtml(c.header)}</th>`;
  }).join('')}</tr>`;

  const body = rows.map((row, i) => `<tr>${columns.map((c) => {
    const align = c.type === 'number' || c.type === 'currency' ? 'right' : 'left';
    return `<td style="text-align:${align}">${escapeHtml(displayCell(c, row, i))}</td>`;
  }).join('')}</tr>`).join('');

  const foot = footer && footer.length
    ? `<tfoot>${footer.map((f) => `<tr><td colspan="${columns.length - 1}" style="text-align:right;font-weight:700">${escapeHtml(f.label)}</td><td style="text-align:right;font-weight:800">${escapeHtml(f.value)}</td></tr>`).join('')}</tfoot>`
    : '';

  const letterhead = doc ? `
    <div class="lh">
      <div class="lh-brand">${escapeHtml(doc.legalName)}</div>
      <div class="lh-sub">${escapeHtml([doc.piva ? 'P.IVA ' + doc.piva : '', doc.address || ''].filter(Boolean).join(' · '))}</div>
      ${doc.contacts ? `<div class="lh-sub">${escapeHtml(doc.contacts)}</div>` : ''}
    </div>` : '';

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 14mm; }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #161616; margin: 0; padding: 22px; }
      .lh { border-bottom: 2px solid #161616; padding-bottom: 8px; margin-bottom: 14px; }
      .lh-brand { font-size: 15px; font-weight: 800; }
      .lh-sub { font-size: 10px; color: #666; margin-top: 2px; }
      h1 { font-size: 17px; margin: 0 0 2px; }
      .subtitle { font-size: 11px; color: #777; margin: 0 0 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
      th { background: #f2f2f0; text-transform: uppercase; letter-spacing: .04em; font-size: 8.5px; color: #555; padding: 6px 7px; border-bottom: 1.5px solid #ccc; }
      td { padding: 5px 7px; border-bottom: 1px solid #eee; vertical-align: top; }
      tbody tr:nth-child(even) td { background: #fafafa; }
      tfoot td { border-top: 1.5px solid #161616; padding: 7px; font-size: 11px; }
      .meta { margin-top: 16px; font-size: 9px; color: #999; text-align: right; }
      @media print { .noprint { display: none; } }
      .toolbar { position: fixed; top: 10px; right: 10px; }
      .toolbar button { font: inherit; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 10px; border: none; background: #161616; color: #fff; cursor: pointer; }
    </style></head>
    <body>
      <div class="toolbar noprint"><button onclick="window.print()">Stampa / Salva PDF</button></div>
      ${letterhead}
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
      <table><thead>${head}</thead><tbody>${body}</tbody>${foot}</table>
      <div class="meta">${escapeHtml(rows.length + ' righe')} · Generato il ${escapeHtml(new Date().toLocaleString('it-IT'))} · Aulico</div>
      <script>window.onload=function(){setTimeout(function(){try{window.print()}catch(e){}},250)}<\/script>
    </body></html>`;

  const w = window.open('', '_blank', 'width=1024,height=768');
  if (!w) { alert('Consenti i popup per esportare il PDF.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
