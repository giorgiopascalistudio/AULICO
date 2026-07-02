/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatericoHomeView — Home del modulo Materico (§1-2). Cruscotto scoped a Materico:
 * commesse/pipeline, cantieri, contratti, scadenze; vista per responsabile (edile/impianti);
 * accesso ai moduli trasversali (Amministrazione, Strategico, HR, Marketing).
 */
import React from 'react';
import {
  LayoutGrid, Target, Building2, FileSignature, TrendingUp, Briefcase, BarChart3, Users, Megaphone, CalendarDays, ChevronRight,
} from 'lucide-react';
import type { MatericoDeal, MatericoContract, MatericoDealStage } from '../types';
import { eur } from '../utils';

interface Member { uid: string; name: string; }
interface Props {
  deals: MatericoDeal[];
  cantieriCount?: number;
  contracts?: MatericoContract[];
  members?: Member[];
  color?: string;
  onOpen?: (hash: string) => void;
}

const OPEN: MatericoDealStage[] = ['nuovo', 'valutazione', 'preventivo', 'contrattualizzazione'];
const STAGE_LABEL: Record<MatericoDealStage, string> = { nuovo: 'Nuovo', valutazione: 'Valutazione', preventivo: 'Preventivo', contrattualizzazione: 'Contratto', vinta: 'Vinta', persa: 'Persa' };
const STAGE_COLOR: Record<MatericoDealStage, string> = { nuovo: '#6b7280', valutazione: '#b45309', preventivo: '#c2410c', contrattualizzazione: '#4338ca', vinta: '#059669', persa: '#dc2626' };
const margineOf = (d: MatericoDeal) => (d.valoreStimato || 0) - (d.costoStimato || 0);

export const MatericoHomeView: React.FC<Props> = ({ deals, cantieriCount = 0, contracts = [], members = [], color = '#c2410c', onOpen }) => {
  const [resp, setResp] = React.useState<'all' | string>('all');
  const scoped = deals.filter((d) => resp === 'all' || d.responsabileUid === resp);
  const open = scoped.filter((d) => OPEN.includes(d.stage));
  const pipeline = open.reduce((s, d) => s + (d.valoreStimato || 0), 0);
  const marginTot = open.reduce((s, d) => s + margineOf(d), 0);
  const won = scoped.filter((d) => d.stage === 'vinta');
  const inFirma = contracts.filter((c) => c.status === 'inviato').length;
  const go = (h: string) => onOpen?.(h);

  const KPI = [
    { l: 'Commesse aperte', v: String(open.length), s: eur(pipeline), i: Target, h: '#materico/potenziale' },
    { l: 'Margine atteso', v: eur(marginTot), s: 'commesse aperte', i: TrendingUp, h: '#materico/potenziale' },
    { l: 'Cantieri', v: String(cantieriCount), i: Building2, s: 'in gestione', h: '#materico/cicli' },
    { l: 'Contratti in firma', v: String(inFirma), i: FileSignature, s: 'OTP in attesa', h: '#materico/contratti' },
  ];
  const TRASV = [
    { l: 'Amministrazione', d: 'Adempimenti, polizze, scadenze, sicurezza.', i: Briefcase, h: '#strategico/amm-contabilita' },
    { l: 'Strategico', d: 'Obiettivi, KPI, report direzionali.', i: BarChart3, h: '#strategico/marketing' },
    { l: 'Risorse Umane', d: 'Collaboratori, ruoli, ferie, formazione.', i: Users, h: '#strategico/hr-governance' },
    { l: 'Marketing', d: 'Campagne, foto/video, materiale.', i: Megaphone, h: '#strategico/marketing' },
  ];

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><LayoutGrid className="w-5.5 h-5.5" /> Home Materico</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Il quadro operativo di Materico: commesse, cantieri, contratti e scadenze.</p>
        </div>
        {members.length > 0 && (
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
            <button onClick={() => setResp('all')} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${resp === 'all' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>Tutti</button>
            {members.map((m) => <button key={m.uid} onClick={() => setResp(m.uid)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${resp === m.uid ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{m.name}</button>)}
          </div>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI.map((k) => { const Icon = k.i; return (
          <button key={k.l} onClick={() => go(k.h)} className="text-left bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm hover:border-[#cfcfcf] cursor-pointer">
            <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p><Icon className="w-4 h-4 text-[#c9c9c9]" /></div>
            <p className="text-[20px] font-black text-[#161616] mt-1 leading-none">{k.v}</p>
            {k.s && <p className="text-[11px] text-[#9a9a9a] mt-1">{k.s}</p>}
          </button>
        ); })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Pipeline per stato */}
        <div className="lg:flex-1 w-full bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3"><b className="text-[14px] text-[#161616]">Pipeline commesse</b><button onClick={() => go('#materico/potenziale')} className="text-[11.5px] font-bold text-[#8a8a8a] hover:text-[#161616] inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none">Apri <ChevronRight className="w-3.5 h-3.5" /></button></div>
          {(['nuovo', 'valutazione', 'preventivo', 'contrattualizzazione', 'vinta'] as MatericoDealStage[]).map((st) => {
            const items = scoped.filter((d) => d.stage === st);
            const val = items.reduce((s, d) => s + (d.valoreStimato || 0), 0);
            const max = Math.max(1, ...['nuovo', 'valutazione', 'preventivo', 'contrattualizzazione', 'vinta'].map((s2) => scoped.filter((d) => d.stage === s2).reduce((a, d) => a + (d.valoreStimato || 0), 0)));
            return (
              <div key={st} className="flex items-center gap-2 mb-2">
                <span className="w-24 text-[11.5px] font-semibold text-[#555] shrink-0">{STAGE_LABEL[st]}</span>
                <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(val / max) * 100}%`, background: STAGE_COLOR[st] }} /></div>
                <span className="w-8 text-[11px] font-bold text-[#8a8a8a] text-right">{items.length}</span>
                <span className="w-20 text-[11px] font-semibold text-[#161616] text-right shrink-0">{eur(val)}</span>
              </div>
            );
          })}
          {won.length > 0 && <p className="text-[11.5px] text-emerald-600 font-semibold mt-2">{won.length} commesse acquisite · {eur(won.reduce((s, d) => s + (d.valoreStimato || 0), 0))}</p>}
        </div>

        {/* Accessi rapidi */}
        <div className="lg:w-[300px] w-full bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm">
          <b className="text-[14px] text-[#161616]">Accessi rapidi</b>
          <div className="flex flex-col gap-2 mt-3">
            {[['Agenda', CalendarDays, '#calendario'], ['Cicli / cantieri', Building2, '#materico/cicli'], ['Mappa operativa', Target, '#materico/mappa']].map(([l, I, h]) => { const Icon = I as any; return (
              <button key={l as string} onClick={() => go(h as string)} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#f0f0f0] hover:border-[#cfcfcf] hover:bg-gray-50 cursor-pointer bg-transparent text-left"><span className="w-8 h-8 rounded-lg bg-[#161616]/[0.06] flex items-center justify-center text-[#161616]"><Icon className="w-4 h-4" /></span><span className="text-[13px] font-bold text-[#161616]">{l as string}</span></button>
            ); })}
          </div>
        </div>
      </div>

      {/* Moduli trasversali (§2) */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">Moduli trasversali (consultabili)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRASV.map((c) => { const Icon = c.i; return (
            <button key={c.l} onClick={() => go(c.h)} className="text-left bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm hover:border-[#cfcfcf] cursor-pointer flex flex-col gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#161616]/[0.06] flex items-center justify-center text-[#161616]"><Icon className="w-4.5 h-4.5" /></span>
              <b className="text-[13.5px] text-[#161616]">{c.l}</b>
              <p className="text-[11.5px] text-[#8a8a8a] leading-relaxed">{c.d}</p>
            </button>
          ); })}
        </div>
      </div>
    </div>
  );
};

export default MatericoHomeView;
