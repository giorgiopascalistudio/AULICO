/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * QuotesView — Preventivi & Amministrazione (studio), sempre differenziato per società.
 * Vive dentro Finanze (tab "Preventivi"); registro preventivi/parcelle con macro-voci,
 * stati, IVA/cassa spuntabili, piano pagamenti e collegamento a fatturazione/incassi
 * (le rate "emesse" generano fattura attiva + scadenza in Finanze).
 */
import React, { useMemo, useState } from 'react';
import {
  FileSignature, Plus, Trash2, Receipt, ChevronDown, ChevronUp
} from 'lucide-react';
import { Quote, ClientRecord, Project } from '../types';
import { eur } from '../utils';
import { Company, COMPANY_LABEL, COMPANY_COLOR, quoteTotals } from '../finance';
import { QuoteEditor, emptyQuoteDraft, MACRO_LABEL } from './QuoteEditor';

const STATUS_LABEL: Record<Quote['status'], string> = {
  elaborato: 'Elaborato', in_attesa: 'In attesa', accettato: 'Accettato', rifiutato: 'Rifiutato'
};
const STATUS_STYLE: Record<Quote['status'], string> = {
  elaborato: 'bg-[#f1f1f1] text-[#6b6b6b]', in_attesa: 'bg-amber-50 text-amber-700',
  accettato: 'bg-emerald-50 text-emerald-700', rifiutato: 'bg-rose-50 text-rose-700'
};

interface QuotesViewProps {
  quotes: Record<string, Quote>;
  clients: Record<string, ClientRecord>;
  projects: Project[];
  myUid: string;
  /** Società selezionata nella barra di Finanze ('all'/'consolidato' = tutte, raggruppate per società). */
  company?: 'all' | 'consolidato' | Company;
  onSaveQuote: (q: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onSetStatus: (id: string, status: Quote['status']) => void;
  onEmitMilestone: (quoteId: string, milestoneId: string) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ quotes, clients, projects, myUid, company = 'all', onSaveQuote, onDeleteQuote, onSetStatus, onEmitMilestone }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Quote>(emptyQuoteDraft());
  const [filter, setFilter] = useState<'all' | Quote['status']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const showAll = company === 'all' || company === 'consolidato';

  const list = useMemo(() => Object.values(quotes)
    .filter((q) => showAll || (q.division || 'studio') === company)
    .filter((q) => filter === 'all' || q.status === filter)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [quotes, filter, company, showAll]);

  // Sempre differenziato per società: raggruppa per divisione (mostra solo i gruppi presenti).
  const groups = useMemo(() => {
    const order: Company[] = ['studio', 'strategico', 'materico', 'unico'];
    return order
      .map((c) => ({ company: c, items: list.filter((q) => (q.division || 'studio') === c) }))
      .filter((g) => g.items.length > 0);
  }, [list]);

  const kpi = useMemo(() => {
    const tot = list.reduce((s, q) => s + (q.total || 0), 0);
    const accepted = list.filter((q) => q.status === 'accettato');
    const acceptedTot = accepted.reduce((s, q) => s + (q.total || 0), 0);
    return { count: list.length, tot, acceptedCount: accepted.length, acceptedTot };
  }, [list]);

  const openNew = (docKind: 'preventivo' | 'parcella') => {
    setDraft(emptyQuoteDraft(showAll ? 'studio' : (company as Company), null, docKind));
    setEditorOpen(true);
  };
  const openEdit = (q: Quote) => { setDraft(q); setEditorOpen(true); };

  const renderQuote = (q: Quote) => {
    const open = expanded === q.id;
    const plan = q.paymentPlan || [];
    const fatturato = plan.filter((m) => m.status !== 'da_emettere').reduce((s, m) => s + m.amount, 0);
    const totals = quoteTotals(q);
    const col = COMPANY_COLOR[(q.division || 'studio') as Company];
    return (
      <div key={q.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 border-l-[5px]" style={{ borderLeftColor: col }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-extrabold text-[#161616]">{q.number || '(senza numero)'}</span>
              {q.docKind === 'parcella' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700">Parcella</span>
              )}
              <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider text-white" style={{ background: col }}>
                {COMPANY_LABEL[(q.division || 'studio') as Company]}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
            </div>
            <div className="text-[12px] text-[#8a8a8a] mt-0.5">
              {q.clientName} · imponibile {eur(totals.imponibile)}
              {(totals.cassa > 0 || totals.iva > 0) && <> · <b className="text-[#161616]">totale {eur(totals.totale)}</b></>}
              {plan.length > 0 ? ` · fatturato ${eur(fatturato)}/${eur(q.total)}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <select value={q.status} onChange={(e) => onSetStatus(q.id, e.target.value as Quote['status'])} className="px-2.5 py-1.5 rounded-xl border border-[#e2e2e2] text-[12px] font-bold outline-none bg-white cursor-pointer">
              {(['elaborato', 'in_attesa', 'accettato', 'rifiutato'] as Quote['status'][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <button onClick={() => setExpanded(open ? null : q.id)} className="w-8 h-8 rounded-xl border border-[#e2e2e2] flex items-center justify-center text-[#6b6b6b] bg-white cursor-pointer">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
            <button onClick={() => openEdit(q)} className="px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[12px] font-bold border-none cursor-pointer">Modifica</button>
            <button onClick={() => onDeleteQuote(q.id)} className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 cursor-pointer" title="Elimina (nel Cestino)"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        {open && (
          <div className="mt-3 pt-3 border-t border-[#f2f2f2] flex flex-col gap-3">
            {/* righe */}
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Voci</span>
              <div className="mt-1.5 flex flex-col gap-1">
                {(q.lines || []).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-[12.5px] px-3 py-1.5 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                    <span className="truncate"><span className="text-[10px] font-bold uppercase text-[#9a9a9a] mr-2">{MACRO_LABEL[l.macro]}</span>{l.desc}</span>
                    <span className="font-bold shrink-0">{eur(l.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* riepilogo IVA/cassa */}
            {(totals.cassa > 0 || totals.iva > 0) && (
              <div className="flex items-center justify-end gap-4 text-[12px] px-3 py-2 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                <span className="text-[#8a8a8a]">Imponibile <b className="text-[#161616]">{eur(totals.imponibile)}</b></span>
                {totals.cassa > 0 && <span className="text-[#8a8a8a]">Cassa {q.cassaPct ?? 4}% <b className="text-[#161616]">{eur(totals.cassa)}</b></span>}
                {totals.iva > 0 && <span className="text-[#8a8a8a]">IVA {q.vatPct ?? 22}% <b className="text-[#161616]">{eur(totals.iva)}</b></span>}
                <span className="font-black text-[#161616]">Totale {eur(totals.totale)}</span>
              </div>
            )}
            {/* piano pagamenti */}
            {plan.length > 0 && (
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Piano pagamenti</span>
                <div className="mt-1.5 flex flex-col gap-1">
                  {plan.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-[12.5px] px-3 py-1.5 rounded-lg border border-[#f0f0f0]">
                      <span className="truncate">{m.label}{m.dueDate ? ` · ${m.dueDate}` : ''}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold">{eur(m.amount)}</span>
                        {m.status === 'da_emettere' ? (
                          <button onClick={() => onEmitMilestone(q.id, m.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold border-none cursor-pointer"><Receipt className="w-3.5 h-3.5" /> Emetti</button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">{m.status === 'incassato' ? 'Incassato' : 'Fatturato'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {q.notes && <p className="text-[12px] text-[#6b6b6b] italic">{q.notes}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
            <FileSignature className="w-5 h-5" /> Preventivi &amp; Parcelle
            {!showAll && (
              <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider text-white" style={{ background: COMPANY_COLOR[company as Company] }}>
                {COMPANY_LABEL[company as Company]}
              </span>
            )}
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">Registro per società con macro-voci, stati, IVA/cassa e piano pagamenti collegato alla fatturazione.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openNew('parcella')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[13px] font-bold cursor-pointer transition-colors">
            <Plus className="w-4 h-4" /> Nuova parcella
          </button>
          <button onClick={() => openNew('preventivo')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">
            <Plus className="w-4 h-4" /> Nuovo preventivo
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Preventivi" value={String(kpi.count)} />
        <Kpi label="Valore totale (imponibile)" value={eur(kpi.tot)} />
        <Kpi label="Accettati" value={String(kpi.acceptedCount)} />
        <Kpi label="Valore accettato" value={eur(kpi.acceptedTot)} accent />
      </div>

      {/* Filtri stato */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {([['all', 'Tutti'], ['elaborato', 'Elaborato'], ['in_attesa', 'In attesa'], ['accettato', 'Accettato'], ['rifiutato', 'Rifiutato']] as const).map(([id, lbl]) => (
          <button key={id} onClick={() => setFilter(id as any)} className={`text-[11.5px] font-bold px-3 py-1 rounded-full border cursor-pointer ${filter === id ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2]'}`}>{lbl}</button>
        ))}
      </div>

      {/* Lista — sempre differenziata per società */}
      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <FileSignature className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun preventivo{showAll ? '' : ` per ${COMPANY_LABEL[company as Company]}`}. Creane uno con "Nuovo preventivo".</p>
        </div>
      ) : showAll ? (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.company} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COMPANY_COLOR[g.company] }} />
                <h3 className="text-[13px] font-black uppercase tracking-wider" style={{ color: COMPANY_COLOR[g.company] === '#161616' ? '#161616' : COMPANY_COLOR[g.company] }}>
                  {COMPANY_LABEL[g.company]}
                </h3>
                <span className="text-[10.5px] font-bold text-[#8a8a8a]">{g.items.length} · {eur(g.items.reduce((s, q) => s + (q.total || 0), 0))}</span>
                <span className="flex-1 h-px bg-[#e2e2e2]" />
              </div>
              {g.items.map(renderQuote)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">{list.map(renderQuote)}</div>
      )}

      {/* EDITOR */}
      {editorOpen && (
        <QuoteEditor
          initial={draft}
          isNew={!quotes[draft.id]}
          clients={clients}
          projects={projects}
          onSave={(q) => onSaveQuote({ ...q, createdBy: q.createdBy || myUid })}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`rounded-2xl p-3.5 border ${accent ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2]'}`}>
    <div className={`text-[10px] font-bold uppercase tracking-wider ${accent ? 'text-white/60' : 'text-[#9a9a9a]'}`}>{label}</div>
    <div className="text-[18px] font-black mt-0.5">{value}</div>
  </div>
);
