/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Users, TrendingUp, FileSignature, Layers, Wallet, Printer, FileText } from 'lucide-react';
import type { ClientRecord } from '../types';

interface Lead { id: string; stage: string; value?: number; createdAt: number; sector?: string; }
interface Proj { createdAt?: number; division?: string; status?: string; }
interface Quote { createdAt?: number; division?: string; total?: number; status?: string; }

interface Props {
  clients: ClientRecord[];
  leads: Lead[];
  projects?: Proj[];
  quotes?: Quote[];
  invoices?: any[];
  societies: { id: string; label: string; color: string }[];
  roleLabel: (id: string) => string;
}

const fmtEuro = (n: number) => `€ ${Math.round(n).toLocaleString('it-IT')}`;
const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const STAGE_COLORS = ['#161616', '#b45309', '#4338ca', '#0d9488', '#7c3aed', '#be123c', '#0369a1', '#65a30d'];
const invTime = (i: any): number | undefined => {
  const s = i?.date || i?.dueDate;
  if (s) { const t = new Date(s).getTime(); if (!isNaN(t)) return t; }
  return i?.createdAt;
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm">
    <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-3">{title}</div>
    {children}
  </div>
);

// Sparkline minimale (trend rapido) per le card KPI.
const Spark: React.FC<{ data: number[]; color: string }> = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={30}>
    <LineChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} dot={false} isAnimationActive={false} />
    </LineChart>
  </ResponsiveContainer>
);

export const CrmDashboard: React.FC<Props> = ({ clients, leads, projects = [], quotes = [], invoices = [], societies, roleLabel }) => {
  const [reportOpen, setReportOpen] = React.useState(false);

  // --- bucket mensili (ultimi 6 mesi) ---
  const now = new Date();
  const buckets = Array.from({ length: 6 }).map((_, k) => { const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1); return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MESI[d.getMonth()] }; });
  const idxOf = (t?: number) => { if (!t) return -1; const d = new Date(t); return buckets.findIndex((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`); };
  const zero = () => buckets.map(() => 0);

  const sLead = zero(); leads.forEach((l) => { const i = idxOf(l.createdAt); if (i >= 0) sLead[i]++; });
  const sPrev = zero(); quotes.forEach((q) => { const i = idxOf(q.createdAt); if (i >= 0) sPrev[i]++; });
  const sPrat = zero(); projects.forEach((p) => { const i = idxOf(p.createdAt); if (i >= 0) sPrat[i]++; });
  const sCont = zero(); clients.forEach((c) => { const i = idxOf(c.createdAt); if (i >= 0) sCont[i]++; });
  const sInc = zero(); invoices.filter((i) => i?.status === 'pagata').forEach((inv) => { const i = idxOf(invTime(inv)); if (i >= 0) sInc[i] += Number(inv.amount) || 0; });

  const lineData = buckets.map((b, i) => ({ label: b.label, Lead: sLead[i], Preventivi: sPrev[i], Pratiche: sPrat[i], Incassi: Math.round(sInc[i]) }));

  // --- pipeline per società (valore lead per settore) ---
  const pipSoc = societies.map((s) => ({ name: s.label, color: s.color, valore: leads.filter((l) => (l.sector || '') === s.id).reduce((a, l) => a + (Number(l.value) || 0), 0) }));

  // --- distribuzione pipeline per stato (donut) ---
  const stageCount: Record<string, number> = {};
  leads.forEach((l) => { const k = l.stage || 'altro'; stageCount[k] = (stageCount[k] || 0) + 1; });
  const perStato = Object.entries(stageCount).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v }));

  // --- KPI ---
  const closed = new Set(['perso', 'vinto', 'contratto_firmato', 'chiuso']);
  const openLeads = leads.filter((l) => !closed.has((l.stage || '').toLowerCase()));
  const incassi6 = sInc.reduce((a, b) => a + b, 0);
  const weekAgo = Date.now() - 7 * 86400000;
  const nuoviSett = clients.filter((c) => (c.createdAt || 0) >= weekAgo);

  const kpis = [
    { label: 'Contatti totali', value: String(clients.length), spark: sCont, color: '#161616', icon: Users },
    { label: 'Lead aperti', value: String(openLeads.length), spark: sLead, color: '#b45309', icon: TrendingUp },
    { label: 'Preventivi', value: String(quotes.length), spark: sPrev, color: '#4338ca', icon: FileSignature },
    { label: 'Pratiche', value: String(projects.length), spark: sPrat, color: '#c2410c', icon: Layers },
    { label: 'Incassi (6 mesi)', value: fmtEuro(incassi6), spark: sInc, color: '#0d9488', icon: Wallet },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 no-print">
        <h2 className="text-[16px] font-extrabold text-[#161616]">Andamento CRM</h2>
        <button onClick={() => setReportOpen((v) => !v)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
          <FileText className="w-4 h-4" /> {reportOpen ? 'Chiudi report' : 'Report settimanale'}
        </button>
      </div>

      {/* KPI con sparkline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15`, color: k.color }}><Icon className="w-4 h-4" /></span>
              </div>
              <div className="text-[21px] font-extrabold tracking-tight text-[#161616] leading-none mt-2.5">{k.value}</div>
              <div className="text-[11px] text-[#8a8a8a] mt-1 font-semibold">{k.label}</div>
              <div className="mt-1.5 -mx-1"><Spark data={k.spark} color={k.color} /></div>
            </div>
          );
        })}
      </div>

      {/* LINE multi-serie: lead / preventivi / pratiche / incassi */}
      <Card title="Andamento — Lead · Preventivi · Pratiche · Incassi (ultimi 6 mesi)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="n" tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="e" orientation="right" tick={{ fontSize: 10, fill: '#0d9488' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} formatter={(v: any, n: any) => (n === 'Incassi' ? fmtEuro(v) : v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="n" type="monotone" dataKey="Lead" stroke="#b45309" strokeWidth={2.2} dot={{ r: 2 }} />
            <Line yAxisId="n" type="monotone" dataKey="Preventivi" stroke="#4338ca" strokeWidth={2.2} dot={{ r: 2 }} />
            <Line yAxisId="n" type="monotone" dataKey="Pratiche" stroke="#c2410c" strokeWidth={2.2} dot={{ r: 2 }} />
            <Line yAxisId="e" type="monotone" dataKey="Incassi" stroke="#0d9488" strokeWidth={2.6} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BAR: pipeline per società */}
        <Card title="Pipeline per società (valore €)">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={pipSoc} margin={{ top: 4, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8a8a8a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip cursor={{ fill: '#f7f7f7' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} formatter={(v: any) => fmtEuro(v)} />
              <Bar dataKey="valore" radius={[6, 6, 0, 0]}>{pipSoc.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* DONUT: distribuzione pipeline per stato */}
        <Card title="Distribuzione pipeline per stato">
          {perStato.length === 0 ? <p className="text-[13px] text-[#a8a8a8] py-10 text-center">Nessun lead in pipeline</p> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={perStato} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2}>
                    {perStato.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
                {perStato.map((s, i) => <span key={s.name} className="inline-flex items-center gap-1 text-[11px] text-[#6b6b6b] font-semibold capitalize"><span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }} />{s.name} ({s.value})</span>)}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Report settimanale (stampabile) */}
      {reportOpen && (
        <div className="print-area bg-white border border-[#e2e2e2] rounded-[22px] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[18px] font-black text-[#161616]">Report settimanale CRM</h3>
              <p className="text-[12px] text-[#8a8a8a]">Generato il {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <button onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e2e2e2] hover:border-black text-[#161616] text-[12.5px] font-bold cursor-pointer bg-white">
              <Printer className="w-4 h-4" /> Stampa / PDF
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {[['Contatti', String(clients.length)], ['Nuovi (7 gg)', String(nuoviSett.length)], ['Lead aperti', String(openLeads.length)], ['Preventivi', String(quotes.length)], ['Incassi 6m', fmtEuro(incassi6)]].map(([l, v]) => (
              <div key={l} className="bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-3">
                <div className="text-[18px] font-extrabold text-[#161616]">{v}</div>
                <div className="text-[11px] text-[#8a8a8a] font-semibold">{l}</div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#333] leading-relaxed"><b>Nuovi contatti della settimana:</b> {nuoviSett.length === 0 ? 'nessuno' : nuoviSett.map((c) => c.name).join(', ')}.</p>
        </div>
      )}
    </div>
  );
};

export default CrmDashboard;
