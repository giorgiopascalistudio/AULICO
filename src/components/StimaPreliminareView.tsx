/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StimaPreliminareView — ONIRICO · Fase Pianificazione: SIMULATORE della stima
 * preliminare (DOCX "STIMA PRELIMINARE - Simulatore"): si inseriscono solo le
 * QUANTITÀ (mq/ml) e per ogni voce un LIVELLO Base/Medio/Alto; piscina a
 * forfait; impianti/servizi a corpo (spunte). Il budget si calcola da solo.
 * Nodo `stimePreliminari/<id>`. (Evoluzione futura: valori alimentati dai
 * preventivi reali delle imprese partner di Materico, per area geografica.)
 */
import React from 'react';
import { Calculator, Plus, ArrowLeft, Trash2, Printer } from 'lucide-react';
import type { ClientRecord, PriceItem } from '../types';
import { eur } from '../utils';

export type StimaLevel = 'base' | 'medio' | 'alto';
export interface StimaPreliminare {
  id: string;
  title: string;
  /** Società proprietaria (slug config: studio/materico/unico/fantastico) — legacy senza soc = Onirico. */
  soc?: string | null;
  clientRecordId?: string | null;
  clientName?: string | null;
  qty?: Record<string, number>;              // quantità per voce parametrica
  lvl?: Record<string, StimaLevel>;          // livello per voce
  piscina?: boolean; piscinaLvl?: StimaLevel;
  extras?: Record<string, boolean>;          // impianti/servizi a corpo
  /** Voci aggiunte dal LISTINO della società (qty × prezzo, entrano nel totale). */
  voci?: { id: string; label: string; unit?: string | null; unitPrice: number; qty: number }[];
  notes?: string | null;
  createdAt: number; updatedAt?: number; createdBy?: string | null;
}

// Valori parametrici dal DOCX (€/mq o €/ml, Base/Medio/Alto)
const PARAM: { key: string; label: string; unit: string; group: string; v: [number, number, number] }[] = [
  { key: 'abitazione', label: 'Abitazione', unit: '€/mq', group: 'Nuove costruzioni', v: [2000, 3000, 4000] },
  { key: 'deposito', label: 'Deposito e garage', unit: '€/mq', group: 'Nuove costruzioni', v: [1000, 1500, 2000] },
  { key: 'trulli', label: 'Recupero trulli e lamie', unit: '€/mq', group: 'Recupero edifici esistenti', v: [3000, 4000, 5000] },
  { key: 'pergolato', label: 'Pergolato', unit: '€/mq', group: 'Opere esterne', v: [150, 250, 350] },
  { key: 'portico', label: 'Portico', unit: '€/mq', group: 'Opere esterne', v: [1500, 2000, 2500] },
  { key: 'tettoia', label: 'Tettoia', unit: '€/mq', group: 'Opere esterne', v: [500, 750, 1000] },
  { key: 'giardino', label: 'Giardino (irrigazione compresa)', unit: '€/mq', group: 'Opere esterne', v: [100, 200, 300] },
  { key: 'piazzali', label: 'Piazzali', unit: '€/mq', group: 'Opere esterne', v: [50, 100, 300] },
  { key: 'camminamenti', label: 'Camminamenti', unit: '€/mq', group: 'Opere esterne', v: [50, 100, 300] },
  { key: 'muretti', label: 'Muretti a secco', unit: '€/ml', group: 'Opere esterne', v: [80, 150, 150] },
];
const PISCINA: [number, number, number] = [50000, 60000, 70000];
const EXTRAS: { key: string; label: string; cost: number }[] = [
  { key: 'pozzo', label: 'Pozzo artesiano', cost: 15000 },
  { key: 'imhoff', label: 'Fossa Imhoff + subirrigazione', cost: 5000 },
  { key: 'cisterna', label: 'Cisterna', cost: 7500 },
  { key: 'cancello', label: 'Cancello in ferro', cost: 5000 },
  { key: 'colonne', label: 'Colonne ingresso', cost: 2000 },
  { key: 'automazione', label: 'Automazione cancello', cost: 2000 },
  { key: 'fotovoltaico', label: 'Impianto fotovoltaico', cost: 15000 },
  { key: 'batteria', label: 'Batteria di accumulo', cost: 5000 },
];
const LVL_IDX: Record<StimaLevel, 0 | 1 | 2> = { base: 0, medio: 1, alto: 2 };
export function stimaTotal(s: StimaPreliminare): number {
  let t = 0;
  for (const p of PARAM) {
    const q = s.qty?.[p.key] || 0;
    if (q > 0) t += q * p.v[LVL_IDX[s.lvl?.[p.key] || 'medio']];
  }
  if (s.piscina) t += PISCINA[LVL_IDX[s.piscinaLvl || 'medio']];
  for (const e of EXTRAS) if (s.extras?.[e.key]) t += e.cost;
  for (const v of s.voci || []) t += (Number(v.qty) || 0) * (Number(v.unitPrice) || 0);
  return t;
}

interface Props {
  stime: StimaPreliminare[];
  rubrica: ClientRecord[];
  /** Listino della società (già filtrato da App): voci aggiungibili alla stima. */
  priceList?: PriceItem[];
  color?: string;
  canEdit?: boolean;
  onSave?: (s: StimaPreliminare) => void;
  onDelete?: (id: string) => void;
}
const inp = 'px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';

export const StimaPreliminareView: React.FC<Props> = ({ stime, rubrica, priceList = [], color = '#161616', canEdit = false, onSave, onDelete }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = stime.find((s) => s.id === openId) || null;
  if (open) return <Editor stima={open} rubrica={rubrica} priceList={priceList} color={color} canEdit={canEdit} onSave={onSave} onDelete={onDelete} onBack={() => setOpenId(null)} />;
  const nuova = () => {
    const s: StimaPreliminare = { id: `st-${Date.now().toString(36)}`, title: 'Nuova stima', createdAt: Date.now() };
    onSave?.(s); setOpenId(s.id);
  };
  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Calculator className="w-5.5 h-5.5" style={{ color }} /> Stima Preliminare</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Il simulatore della fase Pianificazione: inserisci solo le quantità e il livello Base/Medio/Alto — il budget si calcola da solo.</p>
        </div>
        {canEdit && <button onClick={nuova} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova stima</button>}
      </div>
      {stime.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna stima. Creane una per simulare il budget di un intervento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...stime].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)).map((s) => (
            <button key={s.id} onClick={() => setOpenId(s.id)} className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <b className="text-[14px] text-[#161616] block truncate">{s.title}</b>
              <p className="text-[11.5px] text-[#8a8a8a] mt-0.5 truncate">{s.clientName || '—'}</p>
              <p className="text-[18px] font-black mt-2" style={{ color }}>{eur(stimaTotal(s))}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LevelPills: React.FC<{ value: StimaLevel; disabled?: boolean; onChange: (l: StimaLevel) => void }> = ({ value, disabled, onChange }) => (
  <span className="inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[2px] rounded-full gap-[1px] shrink-0">
    {(['base', 'medio', 'alto'] as const).map((l) => (
      <button key={l} disabled={disabled} onClick={() => onChange(l)} className={`text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer border-none capitalize ${value === l ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}>{l}</button>
    ))}
  </span>
);

const Editor: React.FC<{ stima: StimaPreliminare; rubrica: ClientRecord[]; priceList?: PriceItem[]; color: string; canEdit: boolean; onSave?: (s: StimaPreliminare) => void; onDelete?: (id: string) => void; onBack: () => void }> = ({ stima: s, rubrica, priceList = [], color, canEdit, onSave, onDelete, onBack }) => {
  const set = (c: Partial<StimaPreliminare>) => onSave?.({ ...s, ...c, updatedAt: Date.now() });
  const groups = [...new Set(PARAM.map((p) => p.group))];
  const total = stimaTotal(s);
  // Voci dal listino della società (qty × prezzo unitario, entrano nel budget).
  const voci = s.voci || [];
  const addVoce = (itemId: string) => {
    const it = priceList.find((p) => p.id === itemId);
    if (!it) return;
    set({ voci: [...voci, { id: `vc-${Date.now().toString(36)}`, label: it.label, unit: it.unit || null, unitPrice: it.unitPrice, qty: 1 }] });
  };
  const updVoce = (id: string, patch: Partial<{ qty: number; unitPrice: number }>) =>
    set({ voci: voci.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  const delVoce = (id: string) => set({ voci: voci.filter((v) => v.id !== id) });
  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0"><ArrowLeft className="w-4 h-4" /></button>
          <input disabled={!canEdit} value={s.title} onChange={(e) => set({ title: e.target.value })} className="text-[20px] font-black tracking-tight text-[#161616] bg-transparent border-none outline-none min-w-0 p-0" />
        </div>
        <div className="flex items-center gap-2">
          <select disabled={!canEdit} value={s.clientRecordId || ''} onChange={(e) => { const c = rubrica.find((x) => x.id === e.target.value); set({ clientRecordId: e.target.value || null, clientName: c?.name || null }); }} className={inp}>
            <option value="">— cliente (rubrica) —</option>
            {rubrica.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer"><Printer className="w-4 h-4" /> Stampa</button>
          {canEdit && onDelete && <button onClick={() => onDelete(s.id)} className="p-2 rounded-xl bg-white border border-[#e2e2e2] hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="print-area grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <p className="hidden print:block text-[16px] font-black">{s.title}{s.clientName ? ` — ${s.clientName}` : ''}</p>
          {groups.map((g) => (
            <div key={g} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">{g}</p>
              <div className="flex flex-col gap-1.5">
                {PARAM.filter((p) => p.group === g).map((p) => {
                  const q = s.qty?.[p.key] || 0;
                  const lvl = s.lvl?.[p.key] || 'medio';
                  const sub = q * p.v[LVL_IDX[lvl]];
                  return (
                    <div key={p.key} className="flex items-center gap-2 flex-wrap">
                      <span className="w-[210px] text-[12.5px] font-semibold text-[#161616]">{p.label} <span className="text-[10px] text-[#9a9a9a]">({p.unit.replace('€/', '')})</span></span>
                      <input disabled={!canEdit} type="number" value={q || ''} placeholder="0" onChange={(e) => set({ qty: { ...(s.qty || {}), [p.key]: Number(e.target.value) || 0 } })} className={`${inp} w-[90px] text-right`} />
                      <LevelPills value={lvl} disabled={!canEdit} onChange={(l) => set({ lvl: { ...(s.lvl || {}), [p.key]: l } })} />
                      <span className="ml-auto text-[12.5px] font-extrabold text-[#161616] min-w-[92px] text-right">{sub > 0 ? eur(sub) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Piscina (forfait) · Impianti e servizi (a corpo)</p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer w-[210px]">
                <input type="checkbox" disabled={!canEdit} checked={!!s.piscina} onChange={(e) => set({ piscina: e.target.checked })} className="w-4 h-4 accent-[#161616]" />
                <span className="text-[12.5px] font-semibold text-[#161616]">Piscina completa</span>
              </label>
              {s.piscina && <LevelPills value={s.piscinaLvl || 'medio'} disabled={!canEdit} onChange={(l) => set({ piscinaLvl: l })} />}
              {s.piscina && <span className="ml-auto text-[12.5px] font-extrabold text-[#161616]">{eur(PISCINA[LVL_IDX[s.piscinaLvl || 'medio']])}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {EXTRAS.map((e) => (
                <label key={e.key} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" disabled={!canEdit} checked={!!s.extras?.[e.key]} onChange={(ev) => set({ extras: { ...(s.extras || {}), [e.key]: ev.target.checked } })} className="w-4 h-4 accent-[#161616]" />
                  <span className="flex-1 text-[12.5px] font-semibold text-[#333]">{e.label}</span>
                  <span className="text-[11.5px] font-bold text-[#8a8a8a]">{eur(e.cost)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Voci dal LISTINO della società (spec utente: le liste si usano anche nelle stime) */}
          {(priceList.length > 0 || voci.length > 0) && (
            <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Voci dal listino</p>
                {canEdit && priceList.length > 0 && (
                  <select value="" onChange={(e) => { if (e.target.value) addVoce(e.target.value); e.currentTarget.value = ''; }} className={`${inp} no-print w-[220px]`} title="Aggiungi una voce dal listino della società">
                    <option value="">+ dal listino…</option>
                    {priceList.map((it) => <option key={it.id} value={it.id}>{it.label}{it.unit ? ` (${it.unit})` : ''} · {eur(it.unitPrice)}</option>)}
                  </select>
                )}
              </div>
              {voci.length === 0 ? (
                <p className="text-[12px] italic text-[#9a9a9a]">Nessuna voce aggiunta. Le voci si gestiscono nel Listino della società (Commerciale → Listino).</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {voci.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 flex-wrap">
                      <span className="w-[210px] text-[12.5px] font-semibold text-[#161616]">{v.label} {v.unit && <span className="text-[10px] text-[#9a9a9a]">({v.unit})</span>}</span>
                      <input disabled={!canEdit} type="number" value={v.qty || ''} placeholder="1" onChange={(e) => updVoce(v.id, { qty: Number(e.target.value) || 0 })} className={`${inp} w-[90px] text-right`} />
                      <span className="text-[11.5px] text-[#8a8a8a] font-semibold">× {eur(v.unitPrice)}</span>
                      {canEdit && <button onClick={() => delVoce(v.id)} className="no-print w-7 h-7 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
                      <span className="ml-auto text-[12.5px] font-extrabold text-[#161616] min-w-[92px] text-right">{eur((Number(v.qty) || 0) * (Number(v.unitPrice) || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totale live */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border-2 rounded-[22px] p-5 sticky top-4" style={{ borderColor: color }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Budget stimato</p>
            <p className="text-[32px] font-black leading-tight" style={{ color }}>{eur(total)}</p>
            <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-1.5">Stima parametrica indicativa (IVA e oneri esclusi). I valori si aggiorneranno coi preventivi reali delle imprese partner.</p>
          </div>
          <textarea disabled={!canEdit} value={s.notes || ''} onChange={(e) => set({ notes: e.target.value || null })} rows={4} placeholder="Note per il cliente…" className={`${inp} w-full resize-none`} />
        </div>
      </div>
    </div>
  );
};

export default StimaPreliminareView;
