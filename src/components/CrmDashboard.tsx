/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Users, TrendingUp, Briefcase, Wallet, Printer, FileText } from 'lucide-react';
import type { ClientRecord, Project } from '../types';

interface Lead { id: string; stage: string; value?: number; createdAt: number; }

interface Props {
  clients: ClientRecord[];
  leads: Lead[];
  projects?: Project[];
  societies: { id: string; label: string; color: string }[];
  roleLabel: (id: string) => string;
}

const fmtEuro = (n: number) => `€ ${Math.round(n).toLocaleString('it-IT')}`;
const ROLE_COLORS = ['#161616', '#b45309', '#c2410c', '#4338ca', '#0d9488', '#7c3aed', '#0369a1', '#be123c', '#65a30d', '#a16207', '#475569'];
const onKeys = (m?: Record<string, boolean>) => Object.keys(m || {}).filter((k) => m![k]);
const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm ${className || ''}`}>
    <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-3">{title}</div>
    {children}
  </div>
);

export const CrmDashboard: React.FC<Props> = ({ clients, leads, societies, roleLabel }) => {
  const [reportOpen, setReportOpen] = React.useState(false);

  // --- KPI ---
  const total = clients.length;
  const nClienti = clients.filter((c) => c.roles?.cliente).length;
  const nInvestitori = clients.filter((c) => c.roles?.investitore || c.roles?.investitore_potenziale).length;
  const closedStages = new Set(['perso', 'contratto_firmato', 'vinto', 'chiuso']);
  const openLeads = leads.filter((l) => !closedStages.has((l.stage || '').toLowerCase()));
  const pipelineValue = openLeads.reduce((s, l) => s + (Number(l.value) || 0), 0);

  // --- Contatti per società ---
  const perSocieta = societies.map((s) => ({ name: s.label, color: s.color, valore: clients.filter((c) => c.societies?.[s.id]).length }));

  // --- Distribuzione per tipo (roles) ---
  const roleCount: Record<string, number> = {};
  clients.forEach((c) => onKeys(c.roles).forEach((r) => { roleCount[r] = (roleCount[r] || 0) + 1; }));
  const perTipo = Object.entries(roleCount).map(([k, v]) => ({ name: roleLabel(k), value: v })).sort((a, b) => b.value - a.value).slice(0, 8);

  // --- Canale di acquisizione ---
  const chanCount: Record<string, number> = {};
  clients.forEach((c) => { const k = c.acquisitionChannel || 'Non indicato'; chanCount[k] = (chanCount[k] || 0) + 1; });
  const perCanale = Object.entries(chanCount).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

  // --- Pipeline per fase (valore) ---
  const stageMap: Record<string, { n: number; val: number }> = {};
  leads.forEach((l) => { const k = l.stage || 'altro'; (stageMap[k] = stageMap[k] || { n: 0, val: 0 }).n++; stageMap[k].val += Number(l.value) || 0; });
  const perFase = Object.entries(stageMap).map(([k, v]) => ({ name: k.replace(/_/g, ' '), contatti: v.n, valore: v.val }));

  // --- Andamento nuovi contatti (ultimi 6 mesi) ---
  const now = new Date();
  const months: { key: string; label: string; nuovi: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MESI[d.getMonth()], nuovi: 0 });
  }
  const monthIdx = new Map(months.map((m, i) => [m.key, i]));
  clients.forEach((c) => { const d = new Date(c.createdAt || 0); const idx = monthIdx.get(`${d.getFullYear()}-${d.getMonth()}`); if (idx != null) months[idx].nuovi++; });

  // --- Report settimanale: nuovi negli ultimi 7 gg ---
  const weekAgo = Date.now() - 7 * 86400000;
  const nuoviSettimana = clients.filter((c) => (c.createdAt || 0) >= weekAgo);

  const kpis = [
    { label: 'Contatti totali', value: String(total), icon: Users, color: '#161616' },
    { label: 'Clienti', value: String(nClienti), icon: Users, color: '#0d9488' },
    { label: 'Investitori', value: String(nInvestitori), icon: TrendingUp, color: '#4338ca' },
    { label: 'Lead aperti', value: String(openLeads.length), icon: Briefcase, color: '#b45309' },
    { label: 'Valore pipeline', value: fmtEuro(pipelineValue), icon: Wallet, color: '#c2410c' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Azioni */}
      <div className="flex items-center justify-between gap-3 no-print">
        <h2 className="text-[16px] font-extrabold text-[#161616]">Andamento CRM</h2>
        <button onClick={() => setReportOpen((v) => !v)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
          <FileText className="w-4 h-4" /> {reportOpen ? 'Chiudi report' : 'Report settimanale'}
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: `${k.color}15`, color: k.color }}><Icon className="w-4.5 h-4.5" /></span>
              <div className="text-[22px] font-extrabold tracking-tight text-[#161616] leading-none">{k.value}</div>
              <div className="text-[11px] text-[#8a8a8a] mt-1 font-semibold">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Contatti per società">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perSocieta} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f7f7f7' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} />
              <Bar dataKey="valore" radius={[6, 6, 0, 0]}>
                {perSocieta.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Nuovi contatti (ultimi 6 mesi)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={months} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="gNuovi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4338ca" stopOpacity={0.35} /><stop offset="100%" stopColor="#4338ca" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} />
              <Area type="monotone" dataKey="nuovi" stroke="#4338ca" strokeWidth={2.5} fill="url(#gNuovi)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Per tipo di contatto">
          {perTipo.length === 0 ? <p className="text-[13px] text-[#a8a8a8] py-8 text-center">Nessun dato</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={perTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2}>
                  {perTipo.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {perTipo.map((t, i) => (
              <span key={t.name} className="inline-flex items-center gap-1 text-[11px] text-[#6b6b6b] font-semibold"><span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }} />{t.name} ({t.value})</span>
            ))}
          </div>
        </Card>

        <Card title="Pipeline per fase">
          {perFase.length === 0 ? <p className="text-[13px] text-[#a8a8a8] py-8 text-center">Nessun lead in pipeline</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={perFase} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f7f7f7' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e2e2', fontSize: 12 }} />
                <Bar dataKey="contatti" fill="#b45309" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[['Contatti totali', String(total)], ['Nuovi (7 gg)', String(nuoviSettimana.length)], ['Lead aperti', String(openLeads.length)], ['Valore pipeline', fmtEuro(pipelineValue)]].map(([l, v]) => (
              <div key={l} className="bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-3">
                <div className="text-[20px] font-extrabold text-[#161616]">{v}</div>
                <div className="text-[11px] text-[#8a8a8a] font-semibold">{l}</div>
              </div>
            ))}
          </div>
          <div className="text-[13px] text-[#333] leading-relaxed">
            <p className="mb-2"><b>Nuovi contatti della settimana:</b> {nuoviSettimana.length === 0 ? 'nessuno' : nuoviSettimana.map((c) => c.name).join(', ')}.</p>
            <p className="mb-2"><b>Distribuzione per società:</b> {perSocieta.filter((s) => s.valore > 0).map((s) => `${s.name} ${s.valore}`).join(' · ') || '—'}.</p>
            <p><b>Pipeline:</b> {openLeads.length} lead aperti per un valore potenziale di {fmtEuro(pipelineValue)}.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmDashboard;
