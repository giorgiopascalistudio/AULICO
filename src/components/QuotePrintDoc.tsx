/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * QuotePrintDoc — "generazione documento da modello": rende un preventivo/parcella
 * nel formato del modello DOCX di ogni società (carta intestata + PREVENTIVO
 * COMPETENZE PROFESSIONALI: committente, oggetto, servizi numerati, totale,
 * condizioni di pagamento, banca/IBAN, tempi/validità, accettazione, consenso
 * privacy e firme). Overlay con pulsante Stampa/PDF (CSS print .print-area).
 */
import React from 'react';
import { X, Printer } from 'lucide-react';
import type { Quote, ClientRecord } from '../types';
import { quoteTotals } from '../finance';
import { eur } from '../utils';
import { companyDoc } from '../companyInfo';
import { SOCIETY_COLOR } from '../societyConfig';

interface Props {
  quote: Quote;
  client?: ClientRecord | null;   // dalla rubrica (via clientRecordId)
  projectName?: string | null;
  onClose: () => void;
}

const blank = (v?: string | null, w = 'min-w-[180px]') =>
  v ? <b className="text-[#161616]">{v}</b> : <span className={`inline-block border-b border-[#9a9a9a] ${w} align-baseline`}>&nbsp;</span>;
const fmtD = (d?: string | number | null) => {
  if (!d) return null;
  const dt = typeof d === 'number' ? new Date(d) : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toLocaleDateString('it-IT');
};

export const QuotePrintDoc: React.FC<Props> = ({ quote: q, client, projectName, onClose }) => {
  const co = companyDoc(q.division);
  const color = (SOCIETY_COLOR as any)[q.division] || '#161616';
  const t = quoteTotals(q);
  const lines = q.lines || [];
  const plan = q.paymentPlan || [];
  const cf = client?.partitaIva || client?.codiceFiscale || null;

  return (
    <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-3xl my-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Barra comandi (non stampata) */}
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-[#eee]">
          <p className="text-[13px] font-extrabold text-[#161616]">Documento · {q.number || 'preventivo'} — modello {co.brand}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Printer className="w-4 h-4" /> Stampa / PDF</button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* DOCUMENTO (stampato) */}
        <div className="print-area px-8 py-7 text-[#161616]" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          {/* Carta intestata */}
          <div className="flex items-start justify-between gap-4 pb-3 mb-4" style={{ borderBottom: `3px solid ${color}` }}>
            <div>
              <p className="text-[26px] font-black tracking-tight leading-none" style={{ color }}>{co.brand}</p>
              <p className="text-[10.5px] text-[#8a8a8a] font-semibold mt-1">{co.legalName}{co.piva ? ` · P.IVA ${co.piva}` : ''}</p>
              {co.address && <p className="text-[10.5px] text-[#8a8a8a]">{co.address}</p>}
            </div>
            <div className="text-right text-[11px] text-[#555] shrink-0">
              <p>Data preventivo: {fmtD(q.createdAt) ? <b>{fmtD(q.createdAt)}</b> : blank(null, 'min-w-[90px]')}</p>
              <p>Data accettazione: {fmtD(q.signedAt) ? <b>{fmtD(q.signedAt)}</b> : blank(null, 'min-w-[90px]')}</p>
              {q.number && <p className="mt-1 font-mono text-[10.5px]">{q.number}</p>}
            </div>
          </div>

          <h3 className="text-[16px] font-black tracking-wide text-center mb-4">PREVENTIVO COMPETENZE PROFESSIONALI</h3>

          {/* Committente */}
          <div className="flex flex-col gap-1 mb-4 text-[12px]">
            <p>COMMITTENTE: {blank(q.clientName, 'min-w-[300px]')}</p>
            <p>INDIRIZZO: {blank(client?.address, 'min-w-[280px]')}</p>
            <p>COD. FISCALE / P.IVA: {blank(cf, 'min-w-[200px]')}&nbsp;&nbsp;&nbsp;COD. UNIVOCO: {blank(client?.sdi || client?.pec, 'min-w-[160px]')}</p>
            <p>OGGETTO: {blank(projectName || q.notes, 'min-w-[300px]')}</p>
          </div>

          {/* Servizi */}
          <p className="text-[12px] font-extrabold tracking-wide mb-1">SERVIZI</p>
          <table className="w-full border-collapse mb-1">
            <tbody>
              {(lines.length ? lines : Array.from({ length: 6 }, () => null)).map((l, i) => (
                <tr key={i} className="border-b border-[#f0f0f0]">
                  <td className="py-1 pr-2 text-[11px] text-[#9a9a9a] w-[24px] align-top">{i + 1}.</td>
                  <td className="py-1 pr-3 text-[12px]">{l ? l.desc || '—' : <span className="inline-block border-b border-[#c9c9c9] w-full">&nbsp;</span>}</td>
                  <td className="py-1 text-right text-[12px] font-bold whitespace-nowrap w-[110px]">{l ? eur(l.amount || 0) : 'euro ________'}</td>
                </tr>
              ))}
              {t.sconto > 0 && (
                <tr className="border-b border-[#f0f0f0]">
                  <td /><td className="py-1 pr-3 text-[12px] font-bold">Sconto {q.discountPct}%</td>
                  <td className="py-1 text-right text-[12px] font-bold text-rose-600 whitespace-nowrap">−{eur(t.sconto)}</td>
                </tr>
              )}
              {t.maggiorazione > 0 && (
                <tr className="border-b border-[#f0f0f0]">
                  <td /><td className="py-1 pr-3 text-[12px] font-bold">Maggiorazione {q.surchargePct}%</td>
                  <td className="py-1 text-right text-[12px] font-bold whitespace-nowrap">+{eur(t.maggiorazione)}</td>
                </tr>
              )}
              <tr>
                <td /><td className="py-1.5 pr-3 text-right text-[12.5px] font-extrabold">TOTALE {q.vatEnabled === false ? '' : '(escluso IVA)'}</td>
                <td className="py-1.5 text-right text-[13.5px] font-black whitespace-nowrap" style={{ color }}>{eur(t.imponibile)}</td>
              </tr>
              {(t.iva > 0 || t.cassa > 0) && (
                <tr>
                  <td /><td className="py-0.5 pr-3 text-right text-[11.5px] text-[#555]">TOTALE documento{t.cassa > 0 ? ` (+ cassa ${q.cassaPct ?? 4}%` : ' ('}{t.iva > 0 ? `${t.cassa > 0 ? ' e' : ''} IVA ${q.vatPct ?? 22}%` : ''})</td>
                  <td className="py-0.5 text-right text-[12.5px] font-extrabold whitespace-nowrap">{eur(t.totale)}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-[10.5px] text-[#555] mb-4">{co.importiNote}</p>

          {/* Condizioni di pagamento */}
          <p className="text-[12px] font-extrabold tracking-wide mb-1">CONDIZIONI DI PAGAMENTO</p>
          {plan.length ? (
            <ul className="mb-2 pl-4 list-disc text-[12px]">
              {plan.map((m) => (
                <li key={m.id} className="mb-0.5">
                  {m.label || 'Rata'}: <b>{eur(m.amount || 0)}</b>{m.percent ? ` (${m.percent}%)` : ''}{m.dueDate ? ` — ${fmtD(m.dueDate)}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] mb-2">euro {blank(null, 'min-w-[100px]')} (escluso IVA) all'accettazione</p>
          )}
          {(co.bank || co.iban) && (
            <p className="text-[11px] text-[#555] mb-4">
              BANCA: {co.bank || '____'}{co.iban ? ` · IBAN: ${co.iban}` : ''} · INTESTATO A: {co.legalName}{co.piva ? ` · P.IVA ${co.piva}` : ''}
            </p>
          )}

          {/* Tempi */}
          <p className="text-[12px] font-extrabold tracking-wide mb-1">TEMPI</p>
          <p className="text-[12px] mb-4">Validità preventivo: {q.validUntil ? <b>fino al {fmtD(q.validUntil)}</b> : <b>{co.validityDays} gg</b>}</p>

          {/* Accettazione */}
          <p className="text-[12px] font-extrabold tracking-wide mb-1">ACCETTAZIONE</p>
          <p className="text-[11.5px] text-[#333] mb-3">{co.acceptText}</p>
          {q.signedAt && (
            <p className="text-[11.5px] font-bold mb-3" style={{ color }}>
              ✓ Accettato con firma OTP {fmtD(q.signedAt)}{q.signedByName ? ` — ${q.signedByName}` : ''}
            </p>
          )}

          {/* Privacy + firme */}
          <p className="text-[9.5px] text-[#777] leading-snug mb-4">
            CONSENSO DA PARTE DELL'INTERESSATO — INFORMATIVA PRIVACY (artt. 13 e 14 Regolamento UE 2016/679): acquisite le informazioni
            fornite dal titolare del trattamento, il sottoscritto dichiara di aver ricevuto, letto e compreso l'informativa e presta il suo
            consenso al trattamento dei dati personali per le specifiche finalità connesse al presente incarico.
          </p>
          <div className="grid grid-cols-2 gap-8 mt-8 mb-2 text-[11px] text-[#555]">
            <div><div className="border-b border-[#9a9a9a] h-8" /><p className="mt-1">FIRMA {co.legalName.toUpperCase()}</p></div>
            <div><div className="border-b border-[#9a9a9a] h-8" /><p className="mt-1">FIRMA CLIENTE</p></div>
          </div>
          <p className="text-[11px] text-[#555] mb-4">Ostuni, lì {blank(null, 'min-w-[110px]')}</p>

          {co.extraNote && (
            <>
              <p className="text-[11px] font-extrabold tracking-wide mb-1">N.B.</p>
              <p className="text-[10px] text-[#555] leading-snug mb-3">{co.extraNote}</p>
            </>
          )}

          {/* Footer carta intestata */}
          {(co.contacts || co.pec) && (
            <p className="text-[9.5px] text-[#9a9a9a] pt-2 mt-2" style={{ borderTop: `2px solid ${color}` }}>
              {co.legalName}{co.address ? ` · ${co.address}` : ''}{co.contacts ? ` · ${co.contacts}` : ''}{co.pec ? ` · PEC ${co.pec}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotePrintDoc;
