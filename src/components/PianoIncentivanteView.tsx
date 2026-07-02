/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PianoIncentivanteView — Piano incentivante (Contabilità & Amministrazione). Classifica dei
 * collaboratori per merito (punti), fascia bonus, valore "erogato" e bonus stimato; base per
 * i pagamenti della parte variabile. Riusa il sistema punti (points.ts). Sola lettura.
 */
import React from 'react';
import { Award, Trophy, TrendingUp } from 'lucide-react';
import type { PointEvent } from '../types';
import { leaderboard, tierFor, nextTier, erogatoOf, BONUS_TIERS } from '../points';
import { eur, initials } from '../utils';

interface Member { uid: string; name: string; }
interface Props {
  members: Member[];
  pointEvents: PointEvent[];
  socLabel?: string;
  color?: string;
}

const YEARS = () => { const y = new Date().getFullYear(); return [y, y - 1, y - 2]; };

export const PianoIncentivanteView: React.FC<Props> = ({ members, pointEvents, socLabel }) => {
  const [year, setYear] = React.useState<'all' | number>('all');
  const from = year === 'all' ? undefined : `${year}-01-01`;
  const to = year === 'all' ? undefined : `${year}-12-31`;
  const rows = leaderboard(pointEvents, members.map((m) => m.uid), from, to);
  const nameOf = (uid: string) => members.find((m) => m.uid === uid)?.name || uid;
  const erogatoTot = members.reduce((s, m) => s + erogatoOf(pointEvents.filter((e) => (from ? e.date >= from && e.date <= (to as string) : true)), m.uid), 0);
  const totPunti = rows.reduce((s, r) => s + r.points, 0);

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Award className="w-5.5 h-5.5" /> Piano incentivante {socLabel ? `· ${socLabel}` : ''}</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Merito, fasce bonus e valore erogato: base per la parte variabile del compenso.</p>
        </div>
        <select value={String(year)} onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] font-bold bg-white outline-none focus:border-[#161616] cursor-pointer">
          <option value="all">Tutto lo storico</option>
          {YEARS().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Fasce bonus (legenda) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {BONUS_TIERS.map((t) => (
          <div key={t.id} className="bg-white border border-[#e2e2e2] rounded-[14px] px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} /><b className="text-[12.5px] text-[#161616]">{t.label}</b></div>
            <p className="text-[10.5px] text-[#9a9a9a] mt-0.5">≥ {t.minPoints} pt · bonus {t.bonusPct}%{t.perk ? ` · ${t.perk}` : ''}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ l: 'Punti totali team', v: String(totPunti), i: Trophy }, { l: 'Erogato (valore attività)', v: eur(erogatoTot), i: TrendingUp }, { l: 'Collaboratori', v: String(members.length), i: Award }].map((k) => { const Icon = k.i; return (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[16px] p-4 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p><Icon className="w-4 h-4 text-[#c9c9c9]" /></div>
            <p className="text-[19px] font-black text-[#161616] mt-1 leading-none">{k.v}</p>
          </div>
        ); })}
      </div>

      <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] min-w-[640px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eee] text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">
                <th className="text-left py-2.5 px-3">#</th>
                <th className="text-left py-2.5 px-3">Collaboratore</th>
                <th className="text-right py-2.5 px-3">Punti</th>
                <th className="text-left py-2.5 px-3">Fascia</th>
                <th className="text-right py-2.5 px-3">Bonus %</th>
                <th className="text-right py-2.5 px-3">Erogato</th>
                <th className="text-left py-2.5 px-3">Prossima fascia</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-[13px] text-[#9a9a9a]">Nessun collaboratore.</td></tr> : rows.map((r, idx) => {
                const t = tierFor(r.points); const nx = nextTier(r.points);
                const erog = erogatoOf(pointEvents.filter((e) => (from ? e.date >= from && e.date <= (to as string) : true)), r.uid);
                return (
                  <tr key={r.uid} className="border-b border-[#f6f6f6] hover:bg-[#fafafa]">
                    <td className="py-2 px-3 text-[#b0b0b0] font-bold">{idx + 1}</td>
                    <td className="py-2 px-3"><span className="inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-[#444] border border-[#ececec]">{initials(nameOf(r.uid))}</span><b className="text-[13px] text-[#161616]">{nameOf(r.uid)}</b></span></td>
                    <td className="py-2 px-3 text-right font-black text-[#161616]">{r.points}</td>
                    <td className="py-2 px-3"><span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: t.color }}>{t.label}</span></td>
                    <td className="py-2 px-3 text-right font-bold text-[#161616]">{t.bonusPct}%</td>
                    <td className="py-2 px-3 text-right font-semibold text-[#444]">{eur(erog)}</td>
                    <td className="py-2 px-3 text-[11.5px] text-[#8a8a8a]">{nx ? `${nx.tier.label} tra ${nx.remaining} pt` : 'Massima'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-[#b0b0b0]">Il bonus % è la fascia di merito. La parte variabile del compenso si calcola applicandolo alla base concordata; i punti maturano automaticamente dalla produttività (completamento attività).</p>
    </div>
  );
};

export default PianoIncentivanteView;
