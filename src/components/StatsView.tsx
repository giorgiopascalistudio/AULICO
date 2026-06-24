/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StatsView — Statistiche direzionali + Break Even Point.
 * Cruscotto analitico (admin/manager) che CALCOLA su dati già esistenti
 * (fatture attive/passive, scadenze, preventivi, progetti, task): nessun nodo
 * nuovo, nessuna regola. Riusa il motore `finance.ts` (consolidato, colori/etichette
 * società). 5 statistiche: 1) Redditività per società + gruppo, 2) Incassato vs
 * da incassare, 3) Punto di pareggio (BEP), 4) Avanzamento portafoglio commesse +
 * pipeline preventivi, 5) Carico per risorsa.
 */
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Scale, Briefcase, Users, ArrowRight, Filter } from 'lucide-react';
import { Project, Quote, Task, UserProfile } from '../types';
import {
  InvoiceActive,
  InvoicePassive,
  ScadenzaItem,
  Company,
  COMPANY_COLOR,
  COMPANY_LABEL,
  consolidato
} from '../finance';
import { eur, todayISO } from '../utils';

interface StatsViewProps {
  projects: Project[];
  invoicesActive: InvoiceActive[];
  invoicesPassive: InvoicePassive[];
  scadenze: ScadenzaItem[];
  quotes: Quote[];
  tasks: Task[];
  members: UserProfile[];
  /** Valore dei SAL approvati (Erogato nel funnel di gruppo). */
  erogato?: number;
  onNav: (route: string) => void;
}

const COMPANIES: Company[] = ['studio', 'strategico', 'materico', 'unico'];
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const monthKey = (iso?: string | null) => (iso && iso.length >= 7 ? iso.slice(0, 7) : '');
const monthLabel = (k: string) => {
  const [y, m] = k.split('-');
  const names = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${names[Number(m) - 1] || '?'} ${String(y).slice(2)}`;
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-[22px] border border-[#e2e2e2] p-5 ${className || ''}`}>{children}</div>
);

const Kpi: React.FC<{ label: string; value: string; sub?: string; icon: React.ElementType; accent?: string }> = ({ label, value, sub, icon: Icon, accent }) => (
  <Card>
    <div className="flex items-start justify-between">
      <span className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">{label}</span>
      <Icon className="w-[18px] h-[18px] text-[#bdbdbd]" />
    </div>
    <div className="text-[26px] font-extrabold mt-2 leading-none" style={accent ? { color: accent } : undefined}>{value}</div>
    {sub && <div className="text-[12.5px] text-[#8a8a8a] mt-1.5">{sub}</div>}
  </Card>
);

export const StatsView: React.FC<StatsViewProps> = ({
  projects, invoicesActive, invoicesPassive, scadenze, quotes, tasks, members, erogato = 0, onNav
}) => {
  const stats = useMemo(() => {
    // Fatture "emesse" = tutto tranne la bozza
    const emitted = invoicesActive.filter((i) => i.status !== 'bozza');
    const incassato = emitted.filter((i) => i.status === 'pagata').reduce((s, i) => s + (i.amount || 0), 0);
    const fatturato = emitted.reduce((s, i) => s + (i.amount || 0), 0);
    const daIncassare = Math.max(0, fatturato - incassato);

    const costiTot = invoicesPassive.reduce((s, i) => s + (i.amount || 0), 0);
    const costiPagati = invoicesPassive.filter((i) => i.status === 'pagata').reduce((s, i) => s + (i.amount || 0), 0);
    const daPagare = Math.max(0, costiTot - costiPagati);

    // Libri per società (ricavi = fatturato emesso, costi = passive)
    const byCompany = {} as Record<Company, { ricavi: number; costi: number }>;
    COMPANIES.forEach((c) => (byCompany[c] = { ricavi: 0, costi: 0 }));
    emitted.forEach((i) => { const c = (i.sector || 'studio') as Company; if (byCompany[c]) byCompany[c].ricavi += i.amount || 0; });
    invoicesPassive.forEach((i) => { const c = (i.sector || 'studio') as Company; if (byCompany[c]) byCompany[c].costi += i.amount || 0; });
    const cons = consolidato(byCompany);

    const netto = cons.totale.netto;
    const margine = fatturato > 0 ? netto / fatturato : 0;
    // BEP: fatturato che pareggia i costi registrati (qui costi non distinti fissi/variabili)
    const pareggio = costiTot;
    const surplus = fatturato - costiTot;

    // Fatturato mensile (ultimi 12 mesi)
    const months: string[] = [];
    const now = new Date();
    for (let k = 11; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const revByMonth: Record<string, number> = {};
    const costByMonth: Record<string, number> = {};
    months.forEach((m) => { revByMonth[m] = 0; costByMonth[m] = 0; });
    emitted.forEach((i) => { const m = monthKey(i.date); if (m in revByMonth) revByMonth[m] += i.amount || 0; });
    invoicesPassive.forEach((i) => { const m = monthKey(i.date); if (m in costByMonth) costByMonth[m] += i.amount || 0; });
    const maxMonth = Math.max(1, ...months.map((m) => Math.max(revByMonth[m], costByMonth[m])));

    // Portafoglio commesse (esclusi archiviati)
    const live = projects.filter((p) => !p.archived);
    const byStatus = { attivo: 0, completato: 0, sospeso: 0, annullato: 0 } as Record<string, number>;
    live.forEach((p) => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
    // Top commesse per fatturato
    const revByProj: Record<string, { name: string; amount: number }> = {};
    emitted.forEach((i) => {
      const key = i.projectId || i.projectName || '—';
      if (!revByProj[key]) revByProj[key] = { name: i.projectName || 'Senza commessa', amount: 0 };
      revByProj[key].amount += i.amount || 0;
    });
    const topProjects = Object.values(revByProj).sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Pipeline preventivi
    const qAccept = quotes.filter((q) => q.status === 'accettato');
    const qPending = quotes.filter((q) => q.status === 'in_attesa' || q.status === 'elaborato');
    const valAccept = qAccept.reduce((s, q) => s + (q.total || 0), 0);
    const valPending = qPending.reduce((s, q) => s + (q.total || 0), 0);
    const winRate = quotes.length > 0 ? qAccept.length / quotes.filter((q) => q.status !== 'elaborato').length || 0 : 0;

    // Funnel di gruppo: Preventivato → Venduto → Erogato → Fatturato → Incassato → Liquidità
    const preventivato = quotes.filter((q) => q.status !== 'rifiutato').reduce((s, q) => s + (q.total || 0), 0);
    const liquidita = incassato - costiPagati; // interim (integrazione bancaria reale = fase backend)
    const funnel = [
      { key: 'preventivato', label: 'Preventivato', value: preventivato, color: '#a8a29e' },
      { key: 'venduto', label: 'Venduto', value: valAccept, color: '#b45309' },
      { key: 'erogato', label: 'Erogato (SAL)', value: erogato, color: '#c2410c' },
      { key: 'fatturato', label: 'Fatturato', value: fatturato, color: '#4338ca' },
      { key: 'incassato', label: 'Incassato', value: incassato, color: '#2563eb' },
      { key: 'liquidita', label: 'Liquidità', value: liquidita, color: liquidita >= 0 ? '#059669' : '#dc2626' },
    ];
    const funnelMax = Math.max(1, ...funnel.map((f) => Math.abs(f.value)));

    // Carico per risorsa
    const today = todayISO();
    const carico = members.map((m) => {
      const mine = tasks.filter((t) => t.assignee === m.uid || (t.assignees || []).includes(m.uid));
      const open = mine.filter((t) => !t.done);
      const overdue = open.filter((t) => t.date && t.date < today);
      const urgent = open.filter((t) => t.priority === 'urgente');
      return { uid: m.uid, name: m.name, open: open.length, overdue: overdue.length, urgent: urgent.length };
    }).sort((a, b) => b.open - a.open);
    const maxCarico = Math.max(1, ...carico.map((c) => c.open));

    // Scadenze finanziarie aperte
    const scadAperte = scadenze.filter((s) => s.status !== 'pagato');
    const scadEntrate = scadAperte.filter((s) => s.kind === 'entrata').reduce((s, x) => s + (x.amount || 0), 0);
    const scadUscite = scadAperte.filter((s) => s.kind === 'uscita').reduce((s, x) => s + (x.amount || 0), 0);

    return {
      fatturato, incassato, daIncassare, costiTot, costiPagati, daPagare, netto, margine,
      pareggio, surplus, books: cons.books, totale: cons.totale,
      months, revByMonth, costByMonth, maxMonth,
      live: live.length, byStatus, topProjects,
      qAccept: qAccept.length, qPending: qPending.length, valAccept, valPending, winRate,
      carico, maxCarico, scadEntrate, scadUscite,
      funnel, funnelMax
    };
  }, [projects, invoicesActive, invoicesPassive, scadenze, quotes, tasks, members, erogato]);

  const s = stats;
  const bepReached = s.surplus >= 0;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#161616]">Statistiche</h1>
          <p className="text-[13.5px] text-[#8a8a8a] mt-0.5">Redditività, punto di pareggio e andamento del gruppo. Calcolato sui dati di contabilità.</p>
        </div>
        <button onClick={() => onNav('finanze')} className="hidden sm:flex items-center gap-1.5 text-[13px] font-bold text-[#161616] bg-white border border-[#e2e2e2] rounded-full px-4 py-2 hover:bg-[#ececec] transition-all">
          Apri Finanze <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI principali */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        <Kpi label="Fatturato emesso" value={eur(s.fatturato)} sub={`${eur(s.incassato)} incassati`} icon={TrendingUp} />
        <Kpi label="Costi registrati" value={eur(s.costiTot)} sub={`${eur(s.daPagare)} da pagare`} icon={TrendingDown} />
        <Kpi label="Margine netto" value={eur(s.netto)} sub={`margine ${pct(s.margine)}`} icon={Scale} accent={s.netto >= 0 ? '#2f855a' : '#c2410c'} />
        <Kpi label="Da incassare" value={eur(s.daIncassare)} sub={`${eur(s.scadEntrate)} a scadenziario`} icon={Wallet} />
      </div>

      {/* Funnel di gruppo: Preventivato → Venduto → Erogato → Fatturato → Incassato → Liquidità */}
      <Card className="mb-3.5">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-[18px] h-[18px] text-[#161616]" />
          <h2 className="text-[15px] font-extrabold">Funnel di gruppo</h2>
        </div>
        <p className="text-[12.5px] text-[#8a8a8a] mb-4">Dal preventivo alla liquidità. La liquidità è una stima (incassi − pagamenti); l'integrazione bancaria reale è prevista in seguito.</p>
        <div className="flex flex-col gap-2.5">
          {s.funnel.map((f, i) => {
            const w = Math.max(2, Math.round((Math.abs(f.value) / s.funnelMax) * 100));
            const prev = i > 0 ? s.funnel[i - 1].value : 0;
            const conv = i > 0 && prev > 0 ? (f.value / prev) * 100 : null;
            return (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-[120px] shrink-0 text-[12.5px] font-bold text-[#161616]">{f.label}</span>
                <div className="flex-1 h-7 rounded-lg bg-[#f0f0f0] overflow-hidden relative">
                  <div className="h-full rounded-lg flex items-center justify-end px-2 transition-all" style={{ width: `${w}%`, background: f.color }}>
                    <span className="text-[11.5px] font-bold text-white whitespace-nowrap">{eur(f.value)}</span>
                  </div>
                </div>
                <span className="w-[60px] shrink-0 text-right text-[11.5px] font-semibold text-[#8a8a8a]">{conv != null ? `${conv.toFixed(0)}%` : ''}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Break Even Point */}
      <Card className="mb-3.5">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-[18px] h-[18px] text-[#161616]" />
          <h2 className="text-[15px] font-extrabold">Punto di pareggio (Break Even Point)</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <div className="h-7 rounded-full bg-[#f0f0ee] overflow-hidden relative">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, s.pareggio > 0 ? (s.fatturato / s.pareggio) * 100 : 100)}%`, background: bepReached ? '#2f855a' : '#c2410c' }} />
              <div className="absolute inset-0 flex items-center px-3 text-[12px] font-bold text-[#161616]/80">
                Fatturato {eur(s.fatturato)} su pareggio {eur(s.pareggio)}
              </div>
            </div>
            <p className="text-[12.5px] text-[#8a8a8a] mt-2">
              Il pareggio è il fatturato che copre i costi registrati. {bepReached
                ? <>Superato: <b className="text-[#2f855a]">utile {eur(s.surplus)}</b>.</>
                : <>Mancano <b className="text-[#c2410c]">{eur(-s.surplus)}</b> per coprire i costi.</>}
            </p>
          </div>
          <div className="text-center sm:border-l sm:border-[#eee] sm:pl-4">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a]">Risultato</div>
            <div className="text-[28px] font-extrabold leading-none mt-1" style={{ color: bepReached ? '#2f855a' : '#c2410c' }}>{eur(s.surplus)}</div>
            <div className="text-[12px] text-[#8a8a8a] mt-1">margine {pct(s.margine)}</div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3.5 mb-3.5">
        {/* Redditività per società */}
        <Card>
          <h2 className="text-[15px] font-extrabold mb-3">Redditività per società</h2>
          <div className="space-y-2.5">
            {s.books.map((b) => {
              const m = b.ricavi > 0 ? b.netto / b.ricavi : 0;
              return (
                <div key={b.company} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COMPANY_COLOR[b.company] }} />
                  <span className="text-[13.5px] font-bold w-20 flex-shrink-0">{COMPANY_LABEL[b.company]}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#f0f0ee] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.totale.ricavi > 0 ? (b.ricavi / s.totale.ricavi) * 100 : 0}%`, background: COMPANY_COLOR[b.company] }} />
                  </div>
                  <span className="text-[12.5px] text-[#8a8a8a] w-24 text-right tabular-nums">{eur(b.ricavi)}</span>
                  <span className="text-[12.5px] font-bold w-14 text-right tabular-nums" style={{ color: b.netto >= 0 ? '#2f855a' : '#c2410c' }}>{pct(m)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#eee] text-[13px] font-extrabold">
            <span>Gruppo (consolidato)</span>
            <span className="tabular-nums">{eur(s.totale.ricavi)} · <span style={{ color: s.totale.netto >= 0 ? '#2f855a' : '#c2410c' }}>{eur(s.totale.netto)}</span></span>
          </div>
        </Card>

        {/* Pipeline preventivi */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-extrabold">Pipeline preventivi</h2>
            <button onClick={() => onNav('finanze')} className="text-[12px] font-bold text-[#8a8a8a] hover:text-[#161616]">Dettaglio →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f0faf3] border border-[#cfe9d8] p-3.5">
              <div className="text-[12px] font-bold text-[#2f855a]">Accettati</div>
              <div className="text-[22px] font-extrabold mt-1">{eur(s.valAccept)}</div>
              <div className="text-[12px] text-[#8a8a8a]">{s.qAccept} preventivi</div>
            </div>
            <div className="rounded-2xl bg-[#fbf6ee] border border-[#ecdcc4] p-3.5">
              <div className="text-[12px] font-bold text-[#b45309]">In attesa</div>
              <div className="text-[22px] font-extrabold mt-1">{eur(s.valPending)}</div>
              <div className="text-[12px] text-[#8a8a8a]">{s.qPending} preventivi</div>
            </div>
          </div>
          <div className="mt-3 text-[12.5px] text-[#8a8a8a]">Win rate (accettati / decisi): <b className="text-[#161616]">{pct(s.winRate || 0)}</b></div>
        </Card>
      </div>

      {/* Andamento mensile */}
      <Card className="mb-3.5">
        <h2 className="text-[15px] font-extrabold mb-3">Andamento ultimi 12 mesi <span className="font-medium text-[#8a8a8a] text-[12.5px]">· ricavi vs costi</span></h2>
        <div className="flex items-end gap-1.5 h-[150px]">
          {s.months.map((m) => (
            <div key={m} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
              <div className="w-full flex items-end justify-center gap-[2px] h-[120px]">
                <div className="w-1/2 rounded-t bg-[#161616]" style={{ height: `${(s.revByMonth[m] / s.maxMonth) * 100}%` }} title={`Ricavi ${eur(s.revByMonth[m])}`} />
                <div className="w-1/2 rounded-t bg-[#d8b4a0]" style={{ height: `${(s.costByMonth[m] / s.maxMonth) * 100}%` }} title={`Costi ${eur(s.costByMonth[m])}`} />
              </div>
              <span className="text-[9.5px] text-[#a8a8a8] font-medium">{monthLabel(m)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-[11.5px] text-[#8a8a8a]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#161616]" /> Ricavi</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#d8b4a0]" /> Costi</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3.5">
        {/* Portafoglio commesse */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-[18px] h-[18px] text-[#161616]" />
            <h2 className="text-[15px] font-extrabold">Portafoglio commesse</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[['attivo', 'Attive', '#2f855a'], ['completato', 'Chiuse', '#161616'], ['sospeso', 'Sospese', '#b45309'], ['annullato', 'Annull.', '#c2410c']].map(([k, lbl, col]) => (
              <div key={k} className="text-center rounded-xl bg-[#f7f7f5] border border-[#ececec] py-2">
                <div className="text-[20px] font-extrabold" style={{ color: col }}>{s.byStatus[k] || 0}</div>
                <div className="text-[11px] text-[#8a8a8a] font-medium">{lbl}</div>
              </div>
            ))}
          </div>
          <div className="text-[12px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">Top commesse per fatturato</div>
          <div className="space-y-1.5">
            {s.topProjects.length === 0 && <p className="text-[12.5px] text-[#a8a8a8]">Nessuna fattura emessa.</p>}
            {s.topProjects.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="truncate pr-2">{p.name}</span>
                <span className="font-bold tabular-nums flex-shrink-0">{eur(p.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Carico per risorsa */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-[18px] h-[18px] text-[#161616]" />
            <h2 className="text-[15px] font-extrabold">Carico per risorsa</h2>
          </div>
          <div className="space-y-2.5">
            {s.carico.length === 0 && <p className="text-[12.5px] text-[#a8a8a8]">Nessun membro del team.</p>}
            {s.carico.map((c) => (
              <div key={c.uid} className="flex items-center gap-3">
                <span className="text-[13px] font-bold w-28 truncate flex-shrink-0">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[#f0f0ee] overflow-hidden">
                  <div className="h-full rounded-full bg-[#161616]" style={{ width: `${(c.open / s.maxCarico) * 100}%` }} />
                </div>
                <span className="text-[12.5px] w-8 text-right tabular-nums font-bold">{c.open}</span>
                {c.overdue > 0 && <span className="text-[11px] font-bold text-[#c2410c] w-16 text-right">{c.overdue} scad.</span>}
                {c.overdue === 0 && <span className="w-16" />}
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-[#a8a8a8] mt-3">Task aperti per membro · in rosso quelli in ritardo.</p>
        </Card>
      </div>
    </div>
  );
};

export default StatsView;
