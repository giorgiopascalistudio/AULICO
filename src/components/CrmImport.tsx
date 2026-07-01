/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Import CSV del Registro Clienti (Excel → CSV) verso la rubrica `clients`.
 * Parser CSV nativo (nessuna dipendenza xlsx). I duplicati (nome+telefono) sono saltati a monte.
 */
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { ClientRecord } from '../types';

const normKey = (s: string): string =>
  s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

/** Parser CSV robusto: virgolette, campi multi-riga, delimitatore , o ; auto-rilevato. */
export function parseCsvText(text: string): string[][] {
  const nl = text.indexOf('\n');
  const firstLine = nl >= 0 ? text.slice(0, nl) : text;
  const delim = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
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
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Mappa le righe del Registro Clienti alle ClientRecord. Header riconosciuti (accent/spazi insensibili). */
export function rowsToClients(rows: string[][], myUid?: string): ClientRecord[] {
  if (rows.length < 2) return [];
  const header = rows[0].map(normKey);
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
  const iNum = idx(['numero', 'n', 'n.']);
  const iDen = idx(['denominazione', 'ragione sociale', 'azienda']);
  const iCog = idx(['cognome']);
  const iNom = idx(['nome']);
  const iInd = idx(['indirizzo']);
  const iEma = idx(['email', 'e-mail', 'mail']);
  const iTel = idx(['numero di telefono', 'telefono', 'tel', 'cellulare']);
  const iSta = idx(['stato']);
  const iFas = idx(['fascia']);
  const iRes = idx(['responsabile cliente', 'responsabile']);
  const iRif = idx(['riferimento comunicazione', 'riferimento']);
  const iPre = idx(['preventivo']);
  const iSal = idx(['saldato']);
  const iDi = idx(['data inizio']);
  const iDf = idx(['data fine']);
  const get = (r: string[], i: number) => (i >= 0 && i < r.length ? (r[i] || '').trim() : '');
  const out: ClientRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const den = get(row, iDen), cog = get(row, iCog), nom = get(row, iNom);
    const name = den || `${cog} ${nom}`.trim();
    if (!name) continue;
    const fasciaN = (get(row, iFas).match(/[123]/) || [])[0];
    const statoRaw = get(row, iSta).toLowerCase();
    const preRaw = get(row, iPre).toLowerCase();
    const salRaw = get(row, iSal).toLowerCase();
    out.push({
      id: `cli-imp-${Date.now()}-${r}-${Math.floor(Math.random() * 9000)}`,
      category: 'cliente',
      type: den ? 'azienda' : 'privato',
      name,
      firstName: nom || null,
      lastName: cog || null,
      companyName: den || null,
      email: get(row, iEma) || null,
      phone: get(row, iTel) || null,
      address: get(row, iInd) || null,
      tier: (fasciaN ? Number(fasciaN) : null) as 1 | 2 | 3 | null,
      responsabileNome: get(row, iRes) || null,
      riferimentoComunicazione: get(row, iRif) || null,
      stato: statoRaw.startsWith('att') ? 'attivo' : statoRaw.startsWith('chi') ? 'chiuso' : null,
      preventivoStato: preRaw.includes('non') ? 'non_firmato' : preRaw.includes('firm') ? 'firmato' : null,
      saldato: ['si', 'sì', 'true', 'x', '1'].includes(salRaw) ? true : salRaw ? false : null,
      dataInizio: get(row, iDi) || null,
      dataFine: get(row, iDf) || null,
      codiceReferenza: get(row, iNum) || null,
      roles: { cliente: true },
      createdBy: myUid || 'admin',
      createdAt: Date.now(),
    });
  }
  return out;
}

export const ClientImportModal: React.FC<{ onClose: () => void; onImport: (recs: ClientRecord[]) => { added: number; skipped: number }; myUid?: string }> = ({ onClose, onImport, myUid }) => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ClientRecord[] | null>(null);
  const [result, setResult] = useState('');
  const parse = (t: string) => setPreview(rowsToClients(parseCsvText(t), myUid));
  const onFile = (f?: File) => { if (!f) return; const rd = new FileReader(); rd.onload = () => { const t = String(rd.result || ''); setText(t); parse(t); }; rd.readAsText(f, 'utf-8'); };
  const doImport = () => { if (!preview) return; const r = onImport(preview); setResult(`Importati ${r.added} · saltati (già presenti/vuoti) ${r.skipped}.`); setPreview(null); setText(''); };
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616]">Importa Registro Clienti (CSV)</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-[#8a8a8a] leading-relaxed">Esporta il foglio Excel come <b>CSV</b> (o incolla il testo). Colonne riconosciute: Numero, Denominazione, Cognome, Nome, Indirizzo, Email, Numero di telefono, Stato, Fascia, Responsabile cliente, Riferimento comunicazione, Preventivo, Saldato, Data inizio, Data fine. I duplicati (stesso nome+telefono) vengono saltati.</p>
          <label className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[#161616] cursor-pointer self-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#e2e2e2] hover:border-black"><Upload className="w-4 h-4" /> Carica file CSV</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && parse(text)} placeholder="…oppure incolla qui il CSV e clicca Anteprima" rows={6} className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12px] font-mono outline-none focus:border-[#161616] bg-white resize-none" />
          <div className="flex items-center gap-2">
            <button onClick={() => parse(text)} disabled={!text.trim()} className="px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12.5px] font-bold cursor-pointer disabled:opacity-40">Anteprima</button>
            <button onClick={doImport} disabled={!preview || preview.length === 0} className="px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40">Importa{preview ? ` (${preview.length})` : ''}</button>
          </div>
          {result && <p className="text-[12.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{result}</p>}
          {preview && preview.length > 0 && (
            <div className="border border-[#eee] rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">Anteprima ({preview.length})</div>
              <div className="max-h-52 overflow-y-auto divide-y divide-[#f2f2f2]">
                {preview.slice(0, 80).map((c) => (
                  <div key={c.id} className="px-3 py-1.5 text-[12px] flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#161616] truncate">{c.name}</span>
                    <span className="text-[#9a9a9a] truncate">{[c.phone, c.tier ? `${c.tier}ª` : '', c.stato].filter(Boolean).join(' · ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientImportModal;
