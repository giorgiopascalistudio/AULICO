/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UnicoStudioView — modulo "Unico" lato studio (interno).
 * Gestisce le operazioni immobiliari (acquisto → ristrutturazione → rivendita),
 * gli investitori e i numeri (capitale raccolto, profitto atteso, ROI/margine).
 * Vive come sotto-sezione della divisione UNICO dentro Progetti.
 * Persistenza Firebase: nodo `unicoDeals` (admin/manager).
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, MapPin, TrendingUp, Users, Coins, Trash2, Pencil, Building2,
  Tag, PiggyBank, Percent, Wallet, ArrowUpRight, Gem, Clapperboard,
  Landmark, Megaphone, HandCoins, Link2,
} from 'lucide-react';
import type {
  UnicoDeal, UnicoInvestor, UnicoDealStatus, UnicoShowcaseConfig, Project,
  UnicoUpdate, UnicoDistribution, UnicoDistributionKind, UserProfile,
  UnicoRoeConfig, InternalOrder,
} from '../types';
import { eur } from '../utils';
import { unicoRoe } from '../finance';
import { UnicoShowcaseEditor } from './UnicoShowcaseEditor';

const IN = 'w-full h-10 px-3 text-[14px] border border-[#e2e2e2] rounded-lg bg-white outline-none focus:border-[#161616]';

const STATUS: Record<UnicoDealStatus, { label: string; cls: string; dot: string }> = {
  valutazione: { label: 'Valutazione', cls: 'bg-stone-100 text-stone-600 border-stone-200', dot: '#a8a29e' },
  acquisizione: { label: 'Acquisizione', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: '#4338ca' },
  ristrutturazione: { label: 'Ristrutturazione', cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: '#c2410c' },
  vendita: { label: 'In vendita', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: '#2563eb' },
  concluso: { label: 'Concluso', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#059669' },
};
const STATUS_ORDER: UnicoDealStatus[] = ['valutazione', 'acquisizione', 'ristrutturazione', 'vendita', 'concluso'];

const raisedOf = (d: UnicoDeal) => (d.investors || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
const profitOf = (d: UnicoDeal) => (Number(d.targetSalePrice) || 0) - (Number(d.acquisitionCost) || 0) - (Number(d.renovationBudget) || 0);
const marginOf = (d: UnicoDeal) => {
  const base = (Number(d.acquisitionCost) || 0) + (Number(d.renovationBudget) || 0);
  return base ? (profitOf(d) / base) * 100 : 0;
};
const distributedOf = (d: UnicoDeal) => (d.distributions || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
// Rendimento atteso del singolo investitore = quota del profitto proporzionale al conferito.
const expectedReturnOf = (d: UnicoDeal, inv: UnicoInvestor) => {
  const raised = raisedOf(d);
  return raised ? ((Number(inv.amount) || 0) / raised) * profitOf(d) : 0;
};
const distributedToInvestor = (d: UnicoDeal, invId: string) =>
  (d.distributions || []).filter((x) => x.investorId === invId).reduce((s, x) => s + (Number(x.amount) || 0), 0);

interface Props {
  deals: UnicoDeal[];
  onSave: (deals: UnicoDeal[]) => void;
  projects: Project[];
  users?: Record<string, UserProfile>;
  canEdit: boolean;
  /** Notifica in-app agli investitori collegati (aggiornamenti/distribuzioni). */
  onNotifyInvestors?: (uids: string[], title: string, body: string) => void;
  /** Doppia conferma eliminazione (modale condivisa in App). */
  askDelete?: (title: string, message: string | null, onConfirm: () => void) => void;
  /** Sposta l'elemento eliminato nel Cestino condiviso. */
  onTrashItem?: (section: string, label: string, payload: any, meta?: Record<string, string>, detail?: string) => void;
  /** Commesse interne (intercompany) generate dalla cascata ROE. */
  internalOrders?: InternalOrder[];
  onConfirmInternalOrder?: (id: string) => void;
  onDeleteInternalOrder?: (id: string) => void;
}

export const UnicoStudioView: React.FC<Props> = ({ deals, onSave, projects, users, canEdit, onNotifyInvestors, askDelete, onTrashItem, internalOrders = [], onConfirmInternalOrder, onDeleteInternalOrder }) => {
  const [tab, setTab] = useState<'operazioni' | 'investitori' | 'rendiconto'>('operazioni');
  const [editing, setEditing] = useState<UnicoDeal | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showcaseFor, setShowcaseFor] = useState<UnicoDeal | null>(null); // editor pagina vetrina

  const totals = useMemo(() => {
    const raised = deals.reduce((s, d) => s + raisedOf(d), 0);
    const goal = deals.reduce((s, d) => s + (Number(d.capitalGoal) || 0), 0);
    const profit = deals.reduce((s, d) => s + profitOf(d), 0);
    const portfolio = deals.reduce((s, d) => s + (Number(d.acquisitionCost) || 0) + (Number(d.renovationBudget) || 0), 0);
    const investors = deals.reduce((s, d) => s + (d.investors?.length || 0), 0);
    return { raised, goal, profit, portfolio, investors };
  }, [deals]);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: `u-${Date.now()}`,
      title: '', type: 'Trullo', location: '',
      status: 'valutazione',
      acquisitionCost: 0, renovationBudget: 0, targetSalePrice: 0, capitalGoal: 0,
      minInvestment: 10000, targetRoi: 10, durationMonths: 18,
      investors: [], matericoProjectId: null, published: false, notes: '',
      createdAt: Date.now(),
    });
  };

  const saveDeal = (d: UnicoDeal) => {
    const prev = deals.find((x) => x.id === d.id);
    const next = isNew ? [...deals, { ...d, createdAt: d.createdAt || Date.now() }] : deals.map((x) => (x.id === d.id ? { ...d, updatedAt: Date.now() } : x));
    onSave(next);
    // Notifica gli investitori collegati per i NUOVI aggiornamenti pubblicati in questa modifica.
    const prevUpd = new Set((prev?.updates || []).map((u) => u.id));
    const newUpdates = (d.updates || []).filter((u) => !prevUpd.has(u.id));
    if (newUpdates.length && onNotifyInvestors) {
      const uids = (d.investors || []).map((i) => i.investorUid).filter(Boolean) as string[];
      newUpdates.forEach((u) => onNotifyInvestors(uids, `Unico · ${d.title || 'Operazione'}: ${u.title}`, u.body));
    }
    setEditing(null); setIsNew(false);
  };
  // Salva la config vetrina (+ pubblicazione) sul deal: lo snapshot pubblico
  // su `unicoShowcase` lo scrive saveUnicoDeals in App.
  const saveShowcase = (dealId: string, showcase: UnicoShowcaseConfig, published: boolean) => {
    onSave(deals.map((x) => (x.id === dealId ? { ...x, showcase, published, updatedAt: Date.now() } : x)));
    setShowcaseFor(null);
  };
  const deleteDeal = (id: string) => {
    const deal = deals.find((d) => d.id === id);
    const doDelete = () => {
      if (deal) onTrashItem?.('unico', deal.title || 'Operazione immobiliare', deal, undefined, deal.location);
      onSave(deals.filter((d) => d.id !== id));
    };
    if (askDelete) askDelete('Eliminare questa operazione immobiliare?', deal ? `"${deal.title}"` : null, doDelete);
    else if (confirm('Eliminare questa operazione immobiliare?')) doDelete();
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Building2 className="w-4 h-4" />} label="Operazioni" value={String(deals.length)} sub={`${deals.filter(d => d.status !== 'concluso').length} attive`} />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Capitale raccolto" value={eur(totals.raised)} sub={`obiettivo ${eur(totals.goal)}`} accent="#4338ca" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Profitto atteso" value={eur(totals.profit)} sub={`portafoglio ${eur(totals.portfolio)}`} accent="#059669" />
        <Kpi icon={<Users className="w-4 h-4" />} label="Investitori" value={String(totals.investors)} sub="conferimenti totali" />
      </div>

      {/* Tabs + azione */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {([{ id: 'operazioni', label: 'Operazioni' }, { id: 'investitori', label: 'Investitori' }, { id: 'rendiconto', label: 'Rendiconto' }] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative text-[12px] font-extrabold px-4 py-1.5 rounded-full transition-colors border-none bg-transparent cursor-pointer ${active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'}`}>
                {active && <motion.div layoutId="unicoSubTab" transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="absolute inset-0 bg-white rounded-full z-0 shadow-xs" />}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
        {canEdit && tab === 'operazioni' && (
          <button onClick={openNew} className="flex items-center gap-1.5 bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] h-10 px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Nuova operazione
          </button>
        )}
      </div>

      {tab === 'operazioni' ? (
        deals.length === 0 ? (
          <Empty onNew={canEdit ? openNew : undefined} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} canEdit={canEdit} onEdit={() => { setIsNew(false); setEditing(d); }} onShowcase={() => setShowcaseFor(d)} onDelete={() => deleteDeal(d.id)} />
            ))}
          </div>
        )
      ) : tab === 'investitori' ? (
        <InvestorsTable deals={deals} />
      ) : (
        <RendicontoView deals={deals} />
      )}

      <AnimatePresence>
        {editing && (
          <DealModal
            deal={editing}
            projects={projects}
            users={users}
            canEdit={canEdit}
            onClose={() => { setEditing(null); setIsNew(false); }}
            onSave={saveDeal}
            orders={internalOrders.filter((o) => o.committente.refId === editing.id)}
            onConfirmOrder={onConfirmInternalOrder}
            onDeleteOrder={onDeleteInternalOrder}
          />
        )}
        {showcaseFor && (
          <UnicoShowcaseEditor
            deal={showcaseFor}
            onClose={() => setShowcaseFor(null)}
            onSave={(cfg, published) => saveShowcase(showcaseFor.id, cfg, published)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- KPI ---------- */
const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }> = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
    <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{icon}{label}</span>
    <b className="block text-[22px] mt-1.5 leading-none tracking-tight" style={accent ? { color: accent } : undefined}>{value}</b>
    {sub && <span className="text-[11px] text-stone-400 mt-1 inline-block">{sub}</span>}
  </div>
);

/* ---------- Card operazione ---------- */
const DealCard: React.FC<{ deal: UnicoDeal; canEdit: boolean; onEdit: () => void; onShowcase: () => void; onDelete: () => void }> = ({ deal: d, canEdit, onEdit, onShowcase, onDelete }) => {
  const raised = raisedOf(d);
  const fundedPct = d.capitalGoal ? Math.min(100, Math.round((raised / d.capitalGoal) * 100)) : 0;
  const st = STATUS[d.status];
  const margin = marginOf(d);
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all border-l-[5px]" style={{ borderLeftColor: st.dot }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{d.type}</span>
          <b className="block text-[16px] tracking-tight truncate">{d.title || 'Senza nome'}</b>
          <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {d.location || '—'}</span>
        </div>
        <span className={`shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <Mini label="Acquisto" value={eur(d.acquisitionCost)} />
        <Mini label="Ristrutt." value={eur(d.renovationBudget)} />
        <Mini label="Vendita" value={eur(d.targetSalePrice)} />
      </div>

      <div className="flex items-center justify-between mt-3 text-[12px]">
        <span className="flex items-center gap-1 text-stone-500 font-semibold"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Profitto {eur(profitOf(d))}</span>
        <span className="font-bold" style={{ color: margin >= 0 ? '#059669' : '#dc2626' }}>{margin.toFixed(1)}%</span>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full bg-[#eee] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${fundedPct}%`, background: '#4338ca' }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 font-semibold">
          <span>{eur(raised)} / {eur(d.capitalGoal)}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {d.investors?.length || 0}</span>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer">
            <Pencil className="w-3.5 h-3.5" /> Gestisci
          </button>
          <button onClick={onShowcase} title={d.published ? 'Pagina vetrina (pubblicata)' : 'Allestisci pagina vetrina'}
            className={`relative flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-bold border cursor-pointer transition-colors ${d.published ? 'bg-indigo-50 border-indigo-200 text-[#4338ca] hover:bg-indigo-100' : 'bg-white border-[#e2e2e2] text-stone-600 hover:border-stone-400'}`}>
            <Clapperboard className="w-3.5 h-3.5" /> Vetrina
            {d.published && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#4338ca] border-2 border-white" />}
          </button>
          <button onClick={onDelete} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

const Mini: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-[#fafafa] border border-[#ececec] rounded-xl py-2">
    <span className="block text-[9.5px] uppercase tracking-wide text-stone-400 font-bold">{label}</span>
    <b className="block text-[12.5px] mt-0.5">{value}</b>
  </div>
);

/* ---------- Tabella investitori ---------- */
const InvestorsTable: React.FC<{ deals: UnicoDeal[] }> = ({ deals }) => {
  const rows = deals.flatMap((d) =>
    (d.investors || []).map((i) => ({ ...i, dealTitle: d.title, dealGoal: d.capitalGoal }))
  ).sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  if (rows.length === 0) {
    return <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center text-stone-400 text-[13.5px]">Nessun investitore registrato. Aggiungili dal dettaglio di un’operazione.</div>;
  }
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          <div className="grid grid-cols-[1.4fr_1.4fr_0.9fr_0.7fr] gap-2 px-4 py-3 bg-[#fafafa] border-b border-[#ececec] text-[10.5px] font-bold uppercase tracking-wide text-stone-400">
            <span>Investitore</span><span>Operazione</span><span className="text-right">Conferito</span><span className="text-right">Quota</span>
          </div>
          {rows.map((r) => {
            const quota = r.dealGoal ? (r.amount / r.dealGoal) * 100 : 0;
            return (
              <div key={r.id} className="grid grid-cols-[1.4fr_1.4fr_0.9fr_0.7fr] gap-2 px-4 py-3 border-b border-[#f3f3f3] items-center text-[13px]">
                <b className="truncate">{r.name}</b>
                <span className="text-stone-500 truncate">{r.dealTitle}</span>
                <span className="text-right font-semibold">{eur(r.amount)}</span>
                <span className="text-right text-stone-500">{quota.toFixed(1)}%</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between px-4 py-3 bg-[#fafafa] text-[13px] font-bold">
            <span>Totale ({rows.length})</span><span>{eur(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Rendiconto (riparto profitto + distribuzioni) ---------- */
const RendicontoView: React.FC<{ deals: UnicoDeal[] }> = ({ deals }) => {
  const withInvestors = deals.filter((d) => (d.investors || []).length > 0);
  const totProfit = deals.reduce((s, d) => s + profitOf(d), 0);
  const totDistributed = deals.reduce((s, d) => s + distributedOf(d), 0);

  if (withInvestors.length === 0) {
    return <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center text-stone-400 text-[13.5px]">Nessuna operazione con investitori. Aggiungi investitori dal dettaglio di un'operazione per vedere il rendiconto.</div>;
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Profitto atteso (gruppo)" value={eur(totProfit)} accent="#059669" />
        <Kpi icon={<HandCoins className="w-4 h-4" />} label="Distribuito" value={eur(totDistributed)} sub="rimborsi + rendimenti" />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Da distribuire (stima)" value={eur(Math.max(0, totProfit - totDistributed))} accent="#4338ca" />
      </div>

      {withInvestors.map((d) => {
        const profit = profitOf(d);
        return (
          <div key={d.id} className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#fafafa] border-b border-[#ececec]">
              <div className="min-w-0">
                <b className="text-[14px] truncate block">{d.title || 'Senza nome'}</b>
                <span className="text-[11.5px] text-stone-400">{STATUS[d.status].label} · profitto atteso {eur(profit)}{d.spvName ? ` · ${d.spvName}` : ''}</span>
              </div>
              <span className="text-[12px] font-bold text-emerald-700 shrink-0">Erogato {eur(distributedOf(d))}</span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr] gap-2 px-4 py-2 text-[10.5px] font-bold uppercase tracking-wide text-stone-400 border-b border-[#f3f3f3]">
                  <span>Investitore</span><span className="text-right">Quota</span><span className="text-right">Conferito</span><span className="text-right">Rend. atteso</span><span className="text-right">Distribuito</span>
                </div>
                {(d.investors || []).map((i) => {
                  const quota = d.capitalGoal ? ((Number(i.amount) || 0) / d.capitalGoal) * 100 : 0;
                  const dist = distributedToInvestor(d, i.id);
                  return (
                    <div key={i.id} className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-[#f5f5f5] items-center text-[12.5px]">
                      <b className="truncate flex items-center gap-1.5">{i.name}{i.investorUid && <Link2 className="w-3 h-3 text-[#4338ca] shrink-0" />}</b>
                      <span className="text-right text-stone-500">{quota.toFixed(1)}%</span>
                      <span className="text-right font-semibold">{eur(i.amount)}</span>
                      <span className="text-right text-emerald-700">{eur(Math.round(expectedReturnOf(d, i)))}</span>
                      <span className="text-right">{eur(dist)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Empty ---------- */
const Empty: React.FC<{ onNew?: () => void }> = ({ onNew }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-10 text-center">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4338ca] flex items-center justify-center mx-auto mb-3"><Gem className="w-6 h-6" /></div>
    <b className="block text-[16px]">Nessuna operazione immobiliare</b>
    <p className="text-[13px] text-stone-500 mt-1.5 max-w-[420px] mx-auto">Crea la prima operazione Unico: acquisto, ristrutturazione e rivendita con investitori.</p>
    {onNew && (
      <button onClick={onNew} className="inline-flex items-center gap-1.5 bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] h-10 px-5 rounded-xl border-none cursor-pointer mt-4">
        <Plus className="w-4 h-4" /> Nuova operazione
      </button>
    )}
  </div>
);

/* ---------- Modale dettaglio/edit ---------- */
const TYPES = ['Trullo', 'Masseria', 'Villa', 'Palazzo', 'Appartamento', 'Attico', 'Corte', 'Terreno', 'Altro'];

const DealModal: React.FC<{
  deal: UnicoDeal; projects: Project[]; users?: Record<string, UserProfile>; canEdit: boolean;
  onClose: () => void; onSave: (d: UnicoDeal) => void;
  orders?: InternalOrder[];
  onConfirmOrder?: (id: string) => void;
  onDeleteOrder?: (id: string) => void;
}> = ({ deal, projects, users, canEdit, onClose, onSave, orders = [], onConfirmOrder, onDeleteOrder }) => {
  const [d, setD] = useState<UnicoDeal>({ ...deal, investors: deal.investors || [] });
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invUid, setInvUid] = useState('');
  // Bozza aggiornamento e distribuzione
  const [updTitle, setUpdTitle] = useState('');
  const [updBody, setUpdBody] = useState('');
  const [distInv, setDistInv] = useState('');
  const [distAmount, setDistAmount] = useState('');
  const [distKind, setDistKind] = useState<UnicoDistributionKind>('rendimento');

  const set = (patch: Partial<UnicoDeal>) => setD((p) => ({ ...p, ...patch }));
  const num = (v: string) => (v === '' ? 0 : Number(v));

  // Account portale collegabili come investitori: clienti/aziende registrati.
  const clientAccounts = Object.values(users || {}).filter((u: any) => u && u.role === 'cliente');

  const addInvestor = () => {
    if (!invName.trim() || !invAmount) return;
    const amount = Number(invAmount);
    const inv: UnicoInvestor = {
      id: `inv-${Date.now()}`, name: invName.trim(), amount,
      email: invEmail.trim() || null, investorUid: invUid || null,
      units: d.unitPrice ? Math.round((amount / Number(d.unitPrice)) * 100) / 100 : undefined,
      committedAt: Date.now(), at: Date.now(),
    };
    set({ investors: [...(d.investors || []), inv] });
    setInvName(''); setInvAmount(''); setInvEmail(''); setInvUid('');
  };
  const removeInvestor = (id: string) => set({ investors: (d.investors || []).filter((i) => i.id !== id) });

  const addUpdate = () => {
    if (!updTitle.trim() || !updBody.trim()) return;
    const u: UnicoUpdate = { id: `upd-${Date.now()}`, title: updTitle.trim(), body: updBody.trim(), at: Date.now() };
    set({ updates: [u, ...(d.updates || [])] });
    setUpdTitle(''); setUpdBody('');
  };
  const removeUpdate = (id: string) => set({ updates: (d.updates || []).filter((u) => u.id !== id) });

  const addDistribution = () => {
    if (!distInv || !distAmount) return;
    const dist: UnicoDistribution = {
      id: `dist-${Date.now()}`, investorId: distInv, amount: Number(distAmount),
      date: Date.now(), kind: distKind,
    };
    set({ distributions: [dist, ...(d.distributions || [])] });
    setDistInv(''); setDistAmount('');
  };
  const removeDistribution = (id: string) => set({ distributions: (d.distributions || []).filter((x) => x.id !== id) });

  const raised = raisedOf(d);
  const fundedPct = d.capitalGoal ? Math.min(100, Math.round((raised / d.capitalGoal) * 100)) : 0;
  const unicoProjects = projects.filter((p) => p.division === 'unico' || p.division === 'materico');
  // Cascata ROE (override-abile). Defaults derivati dagli Economics.
  const roeDefaults = (): UnicoRoeConfig => ({
    landCost: d.acquisitionCost || 0, notaryCost: 0,
    worksCost: d.renovationBudget || 0, resalePrice: d.targetSalePrice || 0,
  });
  const setRoe = (patch: Partial<UnicoRoeConfig>) => set({ roe: { ...roeDefaults(), ...(d.roe || {}), ...patch } });
  const roeResult = d.roe ? unicoRoe(d.roe, raised) : null;
  const invName_ = (id: string) => (d.investors || []).find((i) => i.id === id)?.name || '—';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-[680px] max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
          <b className="text-[16px] tracking-tight">{deal.title ? deal.title : 'Nuova operazione'}</b>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldEl label="Titolo" full>
              <input className={IN} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Masseria Lucia" disabled={!canEdit} />
            </FieldEl>
            <FieldEl label="Tipologia">
              <select className={IN} value={d.type} onChange={(e) => set({ type: e.target.value })} disabled={!canEdit}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldEl>
            <FieldEl label="Località">
              <input className={IN} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="Es. Cisternino (BR)" disabled={!canEdit} />
            </FieldEl>
            <FieldEl label="Stato" full>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((s) => (
                  <button key={s} disabled={!canEdit} onClick={() => set({ status: s })}
                    className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ${d.status === s ? STATUS[s].cls : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}>
                    {STATUS[s].label}
                  </button>
                ))}
              </div>
            </FieldEl>
          </div>

          {/* Numeri operazione */}
          <div className="border-t border-[#ececec] pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Economics</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <FieldEl label="Acquisto €"><input type="number" className={IN} value={d.acquisitionCost || ''} onChange={(e) => set({ acquisitionCost: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Ristrutt. €"><input type="number" className={IN} value={d.renovationBudget || ''} onChange={(e) => set({ renovationBudget: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Vendita €"><input type="number" className={IN} value={d.targetSalePrice || ''} onChange={(e) => set({ targetSalePrice: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Capitale obiettivo €"><input type="number" className={IN} value={d.capitalGoal || ''} onChange={(e) => set({ capitalGoal: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[12.5px]">
              <span className="flex items-center gap-1.5 font-semibold"><TrendingUp className="w-4 h-4 text-emerald-600" /> Profitto atteso: <b>{eur(profitOf(d))}</b></span>
              <span className="flex items-center gap-1.5 font-semibold"><Percent className="w-4 h-4 text-[#4338ca]" /> Margine: <b style={{ color: marginOf(d) >= 0 ? '#059669' : '#dc2626' }}>{marginOf(d).toFixed(1)}%</b></span>
            </div>
          </div>

          {/* Cascata ROE + commesse interne intercompany */}
          <div className="border-t border-[#ececec] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><HandCoins className="w-3.5 h-3.5" /> Cascata ROE · commesse interne</span>
              {canEdit && !d.roe && (
                <button onClick={() => set({ roe: roeDefaults() })} className="text-[11.5px] font-bold text-[#4338ca] hover:underline cursor-pointer bg-transparent border-none">+ Attiva cascata</button>
              )}
              {canEdit && d.roe && (
                <button onClick={() => set({ roe: undefined })} className="text-[11.5px] font-bold text-stone-400 hover:text-red-600 cursor-pointer bg-transparent border-none">Disattiva</button>
              )}
            </div>
            {!d.roe ? (
              <p className="text-[12px] text-stone-500 mt-2">Attiva la cascata per ripartire i costi del gruppo (agenzia 3%, progettazione Onirico 15%, promozione Strategico €10k, rivendita 4%) e generare le <b>commesse interne</b> verso Onirico/Materico/Strategico al salvataggio.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <FieldEl label="Immobile/terreno €"><input type="number" className={IN} value={d.roe.landCost || ''} onChange={(e) => setRoe({ landCost: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Notaio/oneri €"><input type="number" className={IN} value={d.roe.notaryCost || ''} onChange={(e) => setRoe({ notaryCost: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Opere (Materico) €"><input type="number" className={IN} value={d.roe.worksCost || ''} onChange={(e) => setRoe({ worksCost: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Rivendita €"><input type="number" className={IN} value={d.roe.resalePrice || ''} onChange={(e) => setRoe({ resalePrice: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <FieldEl label="Agenzia %"><input type="number" className={IN} value={d.roe.agencyPct ?? ''} placeholder="3" onChange={(e) => setRoe({ agencyPct: e.target.value === '' ? undefined : num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Onirico %"><input type="number" className={IN} value={d.roe.oniricoPct ?? ''} placeholder="15" onChange={(e) => setRoe({ oniricoPct: e.target.value === '' ? undefined : num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Strategico € fisso"><input type="number" className={IN} value={d.roe.strategicoFee ?? ''} placeholder="10000" onChange={(e) => setRoe({ strategicoFee: e.target.value === '' ? undefined : num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Rivendita %"><input type="number" className={IN} value={d.roe.resalePct ?? ''} placeholder="4" onChange={(e) => setRoe({ resalePct: e.target.value === '' ? undefined : num(e.target.value) })} disabled={!canEdit} /></FieldEl>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <FieldEl label="Data acquisto"><input type="date" className={IN} value={d.roe.purchaseDate || ''} onChange={(e) => setRoe({ purchaseDate: e.target.value || null })} disabled={!canEdit} /></FieldEl>
                  <FieldEl label="Data rivendita"><input type="date" className={IN} value={d.roe.resaleDate || ''} onChange={(e) => setRoe({ resaleDate: e.target.value || null })} disabled={!canEdit} /></FieldEl>
                </div>
                {roeResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <Mini label="Costo totale" value={eur(roeResult.totalCost)} />
                    <Mini label="Margine netto" value={eur(roeResult.netMargin)} />
                    <Mini label="ROE" value={`${(roeResult.roe * 100).toFixed(1)}%`} />
                    <Mini label="Payback" value={roeResult.paybackMonths != null ? `${roeResult.paybackMonths} mesi` : '—'} />
                  </div>
                )}
                {/* Commesse interne generate */}
                <div className="mt-3 flex flex-col gap-2">
                  {orders.length === 0 && (
                    <p className="text-[12px] text-stone-500">Le commesse interne vengono generate al <b>salvataggio</b> dell'operazione.</p>
                  )}
                  {orders.sort((a, b) => a.code.localeCompare(b.code)).map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#ececec] bg-[#fafafa]">
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-bold text-[#161616] truncate">{o.code} · {o.title}</div>
                        <div className="text-[11.5px] text-stone-500">{eur(o.amount)} · {o.status === 'confermata' ? 'registrata in finanza' : 'bozza'}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {canEdit && o.status === 'bozza' && onConfirmOrder && (
                          <button onClick={() => onConfirmOrder(o.id)} className="text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg bg-[#4338ca] text-white cursor-pointer border-none hover:bg-[#3730a3]">Conferma</button>
                        )}
                        {o.status === 'confermata' && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓</span>
                        )}
                        {canEdit && onDeleteOrder && (
                          <button onClick={() => onDeleteOrder(o.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 flex items-center justify-center cursor-pointer border-none bg-transparent"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* SPV — società veicolo + cap table */}
          <div className="border-t border-[#ececec] pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> SPV · società veicolo</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <FieldEl label="Ragione sociale SPV"><input className={IN} value={d.spvName || ''} onChange={(e) => set({ spvName: e.target.value })} placeholder="Es. Unico Cisternino S.r.l." disabled={!canEdit} /></FieldEl>
              <FieldEl label="P.IVA / CF SPV"><input className={IN} value={d.spvVat || ''} onChange={(e) => set({ spvVat: e.target.value })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Valore quota €"><input type="number" className={IN} value={d.unitPrice || ''} onChange={(e) => set({ unitPrice: num(e.target.value) })} placeholder="Es. 5000" disabled={!canEdit} /></FieldEl>
            </div>
            {!!d.unitPrice && (
              <span className="text-[11.5px] text-stone-500 mt-2 inline-flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#4338ca]" /> Quote totali operazione: <b>{(Number(d.capitalGoal) / Number(d.unitPrice) || 0).toFixed(0)}</b> da {eur(d.unitPrice)} cad.
              </span>
            )}
          </div>

          {/* Parametri vetrina */}
          <div className="border-t border-[#ececec] pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Parametri vetrina (investitori)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <FieldEl label="Quota minima €"><input type="number" className={IN} value={d.minInvestment || ''} onChange={(e) => set({ minInvestment: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="ROI atteso %/anno"><input type="number" className={IN} value={d.targetRoi || ''} onChange={(e) => set({ targetRoi: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Durata (mesi)"><input type="number" className={IN} value={d.durationMonths || ''} onChange={(e) => set({ durationMonths: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input type="checkbox" checked={!!d.published} onChange={(e) => set({ published: e.target.checked })} disabled={!canEdit} className="w-4 h-4 accent-[#4338ca]" />
              <span className="text-[12.5px] text-stone-600">Pubblica nella vetrina Unico (visibile ai clienti)</span>
            </label>
          </div>

          {/* Commessa Materico collegata */}
          <FieldEl label="Commessa collegata (ristrutturazione)" full>
            <select className={IN} value={d.matericoProjectId || ''} onChange={(e) => set({ matericoProjectId: e.target.value || null })} disabled={!canEdit}>
              <option value="">— Nessuna —</option>
              {unicoProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FieldEl>

          {/* Investitori */}
          <div className="border-t border-[#ececec] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5" /> Investitori</span>
              <span className="text-[12px] font-bold text-[#4338ca]">{eur(raised)} / {eur(d.capitalGoal)} · {fundedPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#eee] rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${fundedPct}%`, background: '#4338ca' }} />
            </div>

            <div className="flex flex-col gap-2 mt-3">
              {(d.investors || []).map((i) => {
                const quota = d.capitalGoal ? ((Number(i.amount) || 0) / d.capitalGoal) * 100 : 0;
                return (
                  <div key={i.id} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
                    <Users className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <b className="text-[13px] truncate flex items-center gap-1.5">
                        {i.name}
                        {i.investorUid && <Link2 className="w-3 h-3 text-[#4338ca]" />}
                      </b>
                      <span className="text-[11px] text-stone-400">
                        {quota.toFixed(1)}% quota{i.units != null ? ` · ${i.units} quote` : ''}{i.email ? ` · ${i.email}` : ''}
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold shrink-0">{eur(i.amount)}</span>
                    {canEdit && <button onClick={() => removeInvestor(i.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>}
                  </div>
                );
              })}
              {(d.investors || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun investitore.</span>}
            </div>

            {canEdit && (
              <div className="bg-white border border-[#ececec] rounded-xl p-3 mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input className={`${IN} flex-1`} value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Nome investitore" />
                  <input type="number" className={`${IN} w-32`} value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="Conferito €" />
                </div>
                <div className="flex items-center gap-2">
                  <input className={`${IN} flex-1`} value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="Email (opzionale)" />
                  <select className={`${IN} flex-1`} value={invUid} onChange={(e) => {
                    const uid = e.target.value; setInvUid(uid);
                    const acc: any = uid ? (users || {})[uid] : null;
                    if (acc) { if (!invName.trim()) setInvName(acc.name || ''); if (!invEmail.trim()) setInvEmail(acc.email || ''); }
                  }}>
                    <option value="">Collega account portale…</option>
                    {clientAccounts.map((u: any) => <option key={u.uid} value={u.uid}>{u.name} · {u.email}</option>)}
                  </select>
                  <button onClick={addInvestor} className="h-10 px-3 rounded-lg bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1 shrink-0">
                    <Plus className="w-4 h-4" /> Aggiungi
                  </button>
                </div>
                <span className="text-[11px] text-stone-400">Collegando un account, l'investitore vedrà la propria posizione nel portale.</span>
              </div>
            )}
          </div>

          {/* Aggiornamenti agli investitori */}
          <div className="border-t border-[#ececec] pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Aggiornamenti agli investitori</span>
            <div className="flex flex-col gap-2 mt-3">
              {(d.updates || []).map((u) => (
                <div key={u.id} className="bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <b className="text-[13px] flex-1 truncate">{u.title}</b>
                    <span className="text-[11px] text-stone-400 shrink-0">{new Date(u.at).toLocaleDateString('it-IT')}</span>
                    {canEdit && <button onClick={() => removeUpdate(u.id)} className="w-6 h-6 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                  <p className="text-[12px] text-stone-600 mt-0.5 whitespace-pre-wrap">{u.body}</p>
                </div>
              ))}
              {(d.updates || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun aggiornamento pubblicato.</span>}
            </div>
            {canEdit && (
              <div className="bg-white border border-[#ececec] rounded-xl p-3 mt-3 flex flex-col gap-2">
                <input className={IN} value={updTitle} onChange={(e) => setUpdTitle(e.target.value)} placeholder="Titolo aggiornamento (es. Avanzamento lavori 60%)" />
                <textarea className={`${IN} h-auto py-2 min-h-[56px]`} value={updBody} onChange={(e) => setUpdBody(e.target.value)} placeholder="Testo dell'aggiornamento…" />
                <button onClick={addUpdate} disabled={!updTitle.trim() || !updBody.trim()} className="self-end h-9 px-4 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[12.5px] border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Aggiungi aggiornamento
                </button>
                <span className="text-[11px] text-stone-400">Al salvataggio, gli investitori collegati riceveranno una notifica.</span>
              </div>
            )}
          </div>

          {/* Distribuzioni / rendimenti */}
          <div className="border-t border-[#ececec] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><HandCoins className="w-3.5 h-3.5" /> Distribuzioni</span>
              <span className="text-[12px] font-bold text-emerald-700">Erogato {eur(distributedOf(d))}</span>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {(d.distributions || []).map((x) => (
                <div key={x.id} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
                  <HandCoins className="w-4 h-4 text-stone-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <b className="text-[13px] truncate">{invName_(x.investorId)}</b>
                    <span className="text-[11px] text-stone-400 block capitalize">{x.kind} · {new Date(x.date).toLocaleDateString('it-IT')}</span>
                  </div>
                  <span className="text-[13px] font-semibold shrink-0">{eur(x.amount)}</span>
                  {canEdit && <button onClick={() => removeDistribution(x.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              {(d.distributions || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessuna distribuzione registrata.</span>}
            </div>
            {canEdit && (d.investors || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <select className={`${IN} flex-1 min-w-[140px]`} value={distInv} onChange={(e) => setDistInv(e.target.value)}>
                  <option value="">Investitore…</option>
                  {(d.investors || []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <select className={`${IN} w-36`} value={distKind} onChange={(e) => setDistKind(e.target.value as UnicoDistributionKind)}>
                  <option value="rendimento">Rendimento</option>
                  <option value="capitale">Rimborso capitale</option>
                  <option value="plusvalenza">Plusvalenza</option>
                </select>
                <input type="number" className={`${IN} w-28`} value={distAmount} onChange={(e) => setDistAmount(e.target.value)} placeholder="€" />
                <button onClick={addDistribution} disabled={!distInv || !distAmount} className="h-10 px-3 rounded-lg bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Registra
                </button>
              </div>
            )}
          </div>

          <FieldEl label="Note" full>
            <textarea className={`${IN} h-auto py-2 min-h-[64px]`} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value })} disabled={!canEdit} placeholder="Annotazioni interne sull'operazione…" />
          </FieldEl>
        </div>

        {canEdit && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#ececec] sticky bottom-0 bg-white">
            <button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#161616] font-bold text-[13px] border-none cursor-pointer">Annulla</button>
            <button onClick={() => onSave(d)} disabled={!d.title.trim()} className="h-10 px-5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
              <ArrowUpRight className="w-4 h-4" /> Salva operazione
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const FieldEl: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
  <div className={`flex flex-col gap-1 ${full ? 'col-span-2 sm:col-span-4' : ''}`}>
    <label className="text-[11px] font-bold text-[#555]">{label}</label>
    {children}
  </div>
);
