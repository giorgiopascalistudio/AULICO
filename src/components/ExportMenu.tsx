/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ExportMenu — pulsante riusabile "Esporta ▾" (Excel .xlsx / PDF) da mettere
 * sull'intestazione di qualsiasi lista. Una sola definizione di colonne
 * (ExportColumn[]) serve a entrambi i formati. Excel è lazy (chunk xlsx a parte).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportXlsx, exportPdf, type ExportColumn } from '../dataIO';

interface Props<T> {
  /** Nome file (senza estensione/data: aggiunte in automatico) e titolo del PDF. */
  filename: string;
  title?: string;
  subtitle?: string;
  /** slug società per la carta intestata del PDF (studio/strategico/materico/unico/fantastico). */
  company?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  footer?: { label: string; value: string }[];
  /** Nome del foglio Excel (default = title/filename). */
  sheetName?: string;
  disabled?: boolean;
  className?: string;
  /** compatto: solo icona + caret. */
  compact?: boolean;
}

export function ExportMenu<T>({ filename, title, subtitle, company, columns, rows, footer, sheetName, disabled, className, compact }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const isEmpty = !rows || rows.length === 0;
  const doXlsx = async () => {
    setOpen(false); setBusy(true);
    try { await exportXlsx(filename, sheetName || title || filename, columns, rows); }
    catch (e) { console.error(e); alert('Export Excel non riuscito.'); }
    finally { setBusy(false); }
  };
  const doPdf = () => {
    setOpen(false);
    exportPdf({ title: title || filename, subtitle, company, columns, rows, footer });
  };

  return (
    <div className={`relative inline-block ${className || ''}`} ref={ref}>
      <button
        type="button"
        disabled={disabled || isEmpty || busy}
        onClick={() => setOpen((o) => !o)}
        title={isEmpty ? 'Nessun dato da esportare' : 'Esporta in Excel o PDF'}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12.5px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        {!compact && <span>{busy ? 'Esporto…' : 'Esporta'}</span>}
        <ChevronDown className="w-3.5 h-3.5 -ml-0.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 z-[210] min-w-[184px] bg-white rounded-2xl border border-[#e6e6e6] shadow-xl p-1.5">
          <button type="button" onClick={doXlsx} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f5f5f3] text-left text-[13px] font-semibold text-[#161616] cursor-pointer bg-transparent border-none">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
          </button>
          <button type="button" onClick={doPdf} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f5f5f3] text-left text-[13px] font-semibold text-[#161616] cursor-pointer bg-transparent border-none">
            <FileText className="w-4 h-4 text-rose-600" /> PDF (stampa)
          </button>
          <div className="px-3 pt-1 pb-0.5 text-[10px] text-[#b0b0b0]">{rows.length} righe</div>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
