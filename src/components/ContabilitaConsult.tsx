/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ContabilitaConsult — "Quadro contabile" della società in SOLA CONSULTAZIONE.
 * La gestione contabile è centralizzata nel Centro Direzione di Strategico
 * (visione Aulico): qui la società vede i propri numeri senza poterli toccare.
 */
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { InvoiceActive, InvoicePassive, ScadenzaItem } from '../finance';
import { eur } from '../utils';

interface Props {
  soc: string;
  socLabel?: string;
  invA: InvoiceActive[];
  invP: InvoicePassive[];
  scadenze: ScadenzaItem[];
  color?: string;
}

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }) : '—');

export const ContabilitaConsult: React.FC<Props> = ({ soc, socLabel, invA, invP, scadenze, color = '#161616' }) => {
  const year = new Date().getFullYear();
  const a = invA.filter((i) => i.sector === soc && i.status !== 'bozza' && (i.date || '').startsWith(String(year)));
  const p = invP.filter((i) => i.sector === soc && (i.date || '').startsWith(String(year)));
  const sc = scadenze.filter((s) => s.sector === soc && s.status !== 'pagato');
  const fatturato = a.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const incassato = a.filter((i) => i.status === 'pagata').reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const costi = p.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const perMese = Array.from({ length: 12 }, (_, m) => ({
    f: a.filter((i) => new Date(i.date).getMonth() === m).reduce((s, i) => s + (Number(i.amount) || 0), 0),
    c: p.filter((i) => new Date(i.date).getMonth() === m).reduce((s, i) => s + (Number(i.amount) || 0), 0),
  }));
  const maxV = Math.max(1, ...perMese.map((x) => Math.max(x.f, x.c)));

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><DollarSign className="w-5.5 h-5.5" style={{ color }} /> Quadro contabile {socLabel ? `· ${socLabel}` : ''}</h2>
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Sola consultazione — la gestione contabile è centralizzata in Strategico → Centro Direzione.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: `Fatturato ${year}`, v: eur(fatturato) },
          { l: 'Incassato', v: eur(incassato) },
          { l: 'Da incassare', v: eur(fatturato - incassato) },
          { l: `Costi ${year}`, v: eur(costi) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[19px] font-black text-[#161616] mt-1 leading-none">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Andamento ricavi/costi */}
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-3">Ricavi vs costi {year}</p>
        <div className="flex items-end gap-1.5 h-[110px]">
          {perMese.map((x, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="w-full flex items-end justify-center gap-[2px] h-[90px]">
                <div className="w-1/2 rounded-t-sm" style={{ height: `${Math.max(2, (x.f / maxV) * 90)}px`, background: '#161616' }} title={`Fatturato ${eur(x.f)}`} />
                <div className="w-1/2 rounded-t-sm" style={{ height: `${Math.max(2, (x.c / maxV) * 90)}px`, background: '#d4d4d0' }} title={`Costi ${eur(x.c)}`} />
              </div>
              <span className="text-[9px] font-bold text-[#b0b0b0]">{MESI[i]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-sm bg-[#161616]" /> Fatturato</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-sm bg-[#d4d4d0]" /> Costi</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2 inline-flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Ultime fatture attive</p>
          {a.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Nessuna fattura {year}.</p> : (
            <div className="flex flex-col gap-1">
              {[...a].sort((x, y) => (y.date || '').localeCompare(x.date || '')).slice(0, 8).map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-[12.5px]">
                  <span className="text-[#9a9a9a] font-semibold w-[64px] shrink-0">{fmtD(i.date)}</span>
                  <span className="flex-1 truncate text-[#161616] font-semibold">{i.clientName}</span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${i.status === 'pagata' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{i.status.replace('_', ' ')}</span>
                  <span className="font-extrabold text-[#161616]">{eur(Number(i.amount) || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2 inline-flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Scadenze aperte</p>
          {sc.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Nessuna scadenza aperta.</p> : (
            <div className="flex flex-col gap-1">
              {[...sc].sort((x, y) => (x.dueDate || '').localeCompare(y.dueDate || '')).slice(0, 8).map((s) => {
                const late = (s.dueDate || '') < new Date().toISOString().slice(0, 10);
                return (
                  <div key={s.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className={`font-semibold w-[64px] shrink-0 ${late ? 'text-rose-600' : 'text-[#9a9a9a]'}`}>{fmtD(s.dueDate)}</span>
                    <span className="flex-1 truncate text-[#161616] font-semibold">{s.desc || s.clientOrSupplier}</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${s.kind === 'entrata' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{s.kind}</span>
                    <span className="font-extrabold text-[#161616]">{eur(s.amount || 0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContabilitaConsult;
