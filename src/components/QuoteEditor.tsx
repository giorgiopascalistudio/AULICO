/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * QuoteEditor — editor modale di un preventivo/parcella (nodo quotes).
 * Riusato da QuotesView (sezione Preventivi dentro Finanze) e dalla
 * "Contabilità di commessa" nel fascicolo progetto (ProjectsView).
 * IVA e Cassa previdenziale sono spuntabili; gli importi delle righe e del
 * piano pagamenti restano IMPONIBILI (IVA/cassa si applicano sul documento).
 */
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Quote, QuoteLine, QuoteMacro, PaymentMilestone, ClientRecord, Project } from '../types';
import { eur } from '../utils';
import { quoteTotals, VAT_PCT_DEFAULT, CASSA_PCT_DEFAULT } from '../finance';
import { Modal } from './Modal';

export const MACRO_LABEL: Record<QuoteMacro, string> = {
  progettazione: 'Progettazione', consulenza: 'Consulenza', opere_edili: 'Opere edili',
  impiantistica: 'Impiantistica', materiali: 'Materiali', altro: 'Altro'
};

const newId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 900)}`;
const num = (v: any) => Number(String(v).replace(',', '.')) || 0;

/** Bozza vuota di preventivo/parcella (riusata da QuotesView e ProjectsView). */
export const emptyQuoteDraft = (
  division: Quote['division'] = 'studio',
  project?: Project | null,
  docKind: 'preventivo' | 'parcella' = 'preventivo'
): Quote => ({
  id: newId('qt'), number: '', docKind, clientRecordId: null,
  clientName: project?.client || '', projectId: project?.id || null,
  division: (project?.division as Quote['division']) || division,
  status: 'elaborato', lines: [], total: 0,
  vatEnabled: true, vatPct: VAT_PCT_DEFAULT, cassaEnabled: false, cassaPct: CASSA_PCT_DEFAULT,
  paymentPlan: [], validUntil: null, notes: null, createdAt: Date.now()
});

interface QuoteEditorProps {
  initial: Quote;
  isNew: boolean;
  clients: Record<string, ClientRecord>;
  projects: Project[];
  /** Se valorizzato (fascicolo progetto): progetto e divisione bloccati. */
  lockProject?: Project | null;
  onSave: (q: Quote) => void;
  onClose: () => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({ initial, isNew, clients, projects, lockProject, onSave, onClose }) => {
  const [draft, setDraft] = useState<Quote>({ ...initial, lines: [...(initial.lines || [])], paymentPlan: [...(initial.paymentPlan || [])] });

  const totals = quoteTotals(draft);
  const isParcella = draft.docKind === 'parcella';

  const save = () => {
    if (!draft.number.trim() || !draft.clientName.trim()) return;
    onSave({ ...draft, total: totals.imponibile });
    onClose();
  };

  // -- line ops --
  const addLine = () => setDraft((d) => ({ ...d, lines: [...(d.lines || []), { id: newId('ln'), macro: 'progettazione', desc: '', qty: 1, unitPrice: 0, amount: 0 }] }));
  const updLine = (id: string, patch: Partial<QuoteLine>) => setDraft((d) => ({
    ...d, lines: (d.lines || []).map((l) => {
      if (l.id !== id) return l;
      const nl = { ...l, ...patch };
      nl.amount = num(nl.qty) * num(nl.unitPrice);
      return nl;
    })
  }));
  const delLine = (id: string) => setDraft((d) => ({ ...d, lines: (d.lines || []).filter((l) => l.id !== id) }));

  // -- payment plan ops --
  const addMilestone = () => setDraft((d) => ({ ...d, paymentPlan: [...(d.paymentPlan || []), { id: newId('ms'), label: 'Rata', percent: null, amount: 0, dueDate: null, status: 'da_emettere', invoiceId: null }] }));
  const updMilestone = (id: string, patch: Partial<PaymentMilestone>) => setDraft((d) => ({
    ...d, paymentPlan: (d.paymentPlan || []).map((m) => {
      if (m.id !== id) return m;
      const nm = { ...m, ...patch };
      if (patch.percent != null) nm.amount = Math.round(totals.imponibile * (num(patch.percent) / 100) * 100) / 100;
      return nm;
    })
  }));
  const delMilestone = (id: string) => setDraft((d) => ({ ...d, paymentPlan: (d.paymentPlan || []).filter((m) => m.id !== id) }));

  return (
    <Modal
      title={isNew ? (isParcella ? 'Nuova parcella' : 'Nuovo preventivo') : (isParcella ? 'Modifica parcella' : 'Modifica preventivo')}
      isOpen
      onClose={onClose}
      wide
      footer={
        <button onClick={save} disabled={!draft.number.trim() || !draft.clientName.trim()} className="btn bg-[#1b1b1b] text-white hover:bg-black font-semibold cursor-pointer disabled:opacity-40 justify-center">
          {isParcella ? 'Salva parcella' : 'Salva preventivo'}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <L label="Tipo documento">
            <select value={draft.docKind || 'preventivo'} onChange={(e) => setDraft((d) => ({ ...d, docKind: e.target.value as any }))} className="qi font-bold">
              <option value="preventivo">Preventivo</option>
              <option value="parcella">Parcella / onorari</option>
            </select>
          </L>
          <L label="Numero *"><input value={draft.number} onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))} placeholder={isParcella ? 'PAR-2026-001' : 'PRV-2026-001'} className="qi font-mono" /></L>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Cliente (rubrica)">
            <select value={draft.clientRecordId || ''} onChange={(e) => { const c = clients[e.target.value]; setDraft((d) => ({ ...d, clientRecordId: e.target.value || null, clientName: c ? c.name : d.clientName })); }} className="qi">
              <option value="">— seleziona / digita sotto —</option>
              {Object.values(clients).sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </L>
          <L label="Nome cliente *"><input value={draft.clientName} onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))} className="qi" /></L>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <L label="Divisione">
            <select value={draft.division} onChange={(e) => setDraft((d) => ({ ...d, division: e.target.value as any }))} disabled={!!lockProject} className="qi font-bold disabled:opacity-60">
              <option value="studio">Studio</option><option value="strategico">Strategico</option><option value="materico">Materico</option><option value="unico">Unico</option>
            </select>
          </L>
          <L label="Collega progetto">
            <select value={draft.projectId || ''} onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value || null }))} disabled={!!lockProject} className="qi disabled:opacity-60">
              <option value="">— nessuno —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </L>
          <L label="Validità (fino al)"><input type="date" value={draft.validUntil || ''} onChange={(e) => setDraft((d) => ({ ...d, validUntil: e.target.value || null }))} className="qi" /></L>
        </div>

        {/* righe macro-voci */}
        <div className="border border-[#eee] rounded-2xl p-3 bg-[#fafafa]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Voci per macro-categoria (importi imponibili)</span>
            <button onClick={addLine} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#161616] cursor-pointer bg-transparent border-none"><Plus className="w-3.5 h-3.5" /> Riga</button>
          </div>
          <div className="flex flex-col gap-2">
            {(draft.lines || []).map((l) => (
              <div key={l.id} className="rounded-xl border border-[#e2e2e2] bg-white p-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <select value={l.macro} onChange={(e) => updLine(l.id, { macro: e.target.value as QuoteMacro })} className="qi w-[150px] shrink-0">
                    {(Object.keys(MACRO_LABEL) as QuoteMacro[]).map((m) => <option key={m} value={m}>{MACRO_LABEL[m]}</option>)}
                  </select>
                  <input value={l.desc} onChange={(e) => updLine(l.id, { desc: e.target.value })} placeholder="Descrizione voce" className="qi flex-1 min-w-0" />
                  <button onClick={() => delLine(l.id)} className="text-rose-600 shrink-0 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-0.5"><span className="qlbl">Qtà</span><input value={l.qty} onChange={(e) => updLine(l.id, { qty: num(e.target.value) })} inputMode="decimal" className="qi" /></label>
                  <label className="flex flex-col gap-0.5"><span className="qlbl">Prezzo unit. €</span><input value={l.unitPrice} onChange={(e) => updLine(l.id, { unitPrice: num(e.target.value) })} inputMode="decimal" className="qi" /></label>
                  <div className="flex flex-col gap-0.5"><span className="qlbl">Importo</span><div className="h-9 flex items-center font-black text-[13px] text-[#161616]">{eur(l.amount)}</div></div>
                </div>
              </div>
            ))}
            {(draft.lines || []).length === 0 && <p className="text-[12px] italic text-[#9a9a9a]">Nessuna voce. Aggiungi una riga.</p>}
          </div>
        </div>

        {/* IVA & Cassa previdenziale spuntabili + riepilogo totali */}
        <div className="border border-[#eee] rounded-2xl p-3 bg-[#fafafa]">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] block mb-2">IVA &amp; Cassa previdenziale</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2.5 rounded-xl border border-[#e2e2e2] bg-white px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={draft.vatEnabled ?? true} onChange={(e) => setDraft((d) => ({ ...d, vatEnabled: e.target.checked }))} className="w-4 h-4 accent-[#161616] cursor-pointer" />
              <span className="text-[12.5px] font-bold text-[#161616] flex-1">IVA</span>
              <input
                value={draft.vatPct ?? VAT_PCT_DEFAULT}
                onChange={(e) => setDraft((d) => ({ ...d, vatPct: num(e.target.value) }))}
                disabled={!(draft.vatEnabled ?? true)}
                inputMode="decimal"
                className="qi w-[64px] text-right disabled:opacity-40"
              />
              <span className="text-[12px] font-bold text-[#8a8a8a]">%</span>
            </label>
            <label className="flex items-center gap-2.5 rounded-xl border border-[#e2e2e2] bg-white px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={!!draft.cassaEnabled} onChange={(e) => setDraft((d) => ({ ...d, cassaEnabled: e.target.checked }))} className="w-4 h-4 accent-[#161616] cursor-pointer" />
              <span className="text-[12.5px] font-bold text-[#161616] flex-1">Cassa previdenziale</span>
              <input
                value={draft.cassaPct ?? CASSA_PCT_DEFAULT}
                onChange={(e) => setDraft((d) => ({ ...d, cassaPct: num(e.target.value) }))}
                disabled={!draft.cassaEnabled}
                inputMode="decimal"
                className="qi w-[64px] text-right disabled:opacity-40"
              />
              <span className="text-[12px] font-bold text-[#8a8a8a]">%</span>
            </label>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#e2e2e2] grid grid-cols-2 sm:grid-cols-4 gap-2 text-right">
            <div><span className="qlbl block text-left sm:text-right">Imponibile</span><b className="text-[13px] font-black text-[#161616]">{eur(totals.imponibile)}</b></div>
            <div><span className="qlbl block text-left sm:text-right">Cassa</span><b className="text-[13px] font-black text-[#161616]">{totals.cassa > 0 ? eur(totals.cassa) : '—'}</b></div>
            <div><span className="qlbl block text-left sm:text-right">IVA</span><b className="text-[13px] font-black text-[#161616]">{totals.iva > 0 ? eur(totals.iva) : '—'}</b></div>
            <div><span className="qlbl block text-left sm:text-right">Totale documento</span><b className="text-[14px] font-black text-[#161616]">{eur(totals.totale)}</b></div>
          </div>
        </div>

        {/* piano pagamenti */}
        <div className="border border-[#eee] rounded-2xl p-3 bg-[#fafafa]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Piano pagamenti — importi imponibili (acconto / rate / saldo)</span>
            <button onClick={addMilestone} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#161616] cursor-pointer bg-transparent border-none"><Plus className="w-3.5 h-3.5" /> Rata</button>
          </div>
          <div className="flex flex-col gap-2">
            {(draft.paymentPlan || []).map((m) => (
              <div key={m.id} className="rounded-xl border border-[#e2e2e2] bg-white p-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input value={m.label} onChange={(e) => updMilestone(m.id, { label: e.target.value })} placeholder="Acconto / SAL / Saldo…" className="qi flex-1 min-w-0" />
                  <button onClick={() => delMilestone(m.id)} className="text-rose-600 shrink-0 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-0.5"><span className="qlbl">% del totale</span><input value={m.percent ?? ''} onChange={(e) => updMilestone(m.id, { percent: e.target.value ? num(e.target.value) : null })} placeholder="%" inputMode="decimal" className="qi" /></label>
                  <label className="flex flex-col gap-0.5"><span className="qlbl">Importo €</span><input value={m.amount} onChange={(e) => updMilestone(m.id, { amount: num(e.target.value) })} inputMode="decimal" className="qi" /></label>
                  <label className="flex flex-col gap-0.5"><span className="qlbl">Scadenza</span><input type="date" value={m.dueDate || ''} onChange={(e) => updMilestone(m.id, { dueDate: e.target.value || null })} className="qi" /></label>
                </div>
              </div>
            ))}
            {(draft.paymentPlan || []).length === 0 && <p className="text-[12px] italic text-[#9a9a9a]">Nessuna rata. Aggiungi acconto/rate/saldo.</p>}
          </div>
        </div>

        <L label="Note"><textarea value={draft.notes || ''} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || null }))} rows={2} className="qi resize-none" /></L>
      </div>

      <style>{`.qi{height:36px;border:1px solid #e2e2e2;border-radius:10px;padding:0 10px;font-size:12.5px;background:#fff;outline:none}.qi:focus{border-color:#161616}textarea.qi{height:auto;padding:8px 10px}.qlbl{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#9a9a9a}`}</style>
    </Modal>
  );
};

const L: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{label}</span>
    {children}
  </label>
);
