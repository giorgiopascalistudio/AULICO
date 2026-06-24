/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RecordRegistry — registro voci generico (lista di record con pochi campi).
 * Riusato per le sezioni "lista" della struttura PDF del Cantiere e dell'Area Impresa
 * (squadre, operai, mezzi, attrezzature, non conformità, ordini di servizio, scadenze,
 * cronoprogramma, DPI, formazione, visite mediche, patentini, incidenti…).
 */
import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { fmtDay } from '../../utils';

export interface GenericRecord {
  id: string;
  section: string;
  title: string;
  date?: string | null;
  dateEnd?: string | null;
  status?: string | null;
  fields?: Record<string, string>;
  note?: string | null;
  by?: string;
  at: number;
}

export interface RecordColumn {
  key: string;                       // 'title' | 'date' | 'dateEnd' | 'status' | <chiave libera in fields>
  label: string;
  type?: 'text' | 'date' | 'number';
}

interface RecordRegistryProps {
  items: GenericRecord[];
  columns: RecordColumn[];
  statuses?: string[];
  canWrite: boolean;
  canDelete?: (r: GenericRecord) => boolean;
  onAdd: (data: { title: string; date?: string | null; dateEnd?: string | null; status?: string | null; fields?: Record<string, string> }) => void;
  onDelete: (id: string) => void;
  emptyText?: string;
}

const SPECIAL = new Set(['title', 'date', 'dateEnd', 'status']);

const statusStyle = (s?: string | null) => {
  const v = (s || '').toLowerCase();
  if (['chiusa', 'risolta', 'completato', 'completata', 'ok', 'conforme'].some((k) => v.includes(k))) return 'bg-emerald-50 text-emerald-700';
  if (['aperta', 'in_corso', 'in corso', 'attesa'].some((k) => v.includes(k))) return 'bg-amber-50 text-amber-700';
  if (['critica', 'non_conforme', 'non conforme', 'scaduto', 'bloccante'].some((k) => v.includes(k))) return 'bg-rose-50 text-rose-700';
  return 'bg-[#f1f1f1] text-[#6b6b6b]';
};

export const RecordRegistry: React.FC<RecordRegistryProps> = ({ items, columns, statuses, canWrite, canDelete, onAdd, onDelete, emptyText }) => {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const list = [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.at - a.at);

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const add = () => {
    const title = (draft.title || '').trim();
    if (!title) return;
    const fields: Record<string, string> = {};
    columns.forEach((c) => { if (!SPECIAL.has(c.key) && draft[c.key]) fields[c.key] = draft[c.key]; });
    onAdd({
      title,
      date: draft.date || null,
      dateEnd: draft.dateEnd || null,
      status: draft.status || (statuses && statuses[0]) || null,
      fields: Object.keys(fields).length ? fields : undefined
    });
    setDraft({});
  };

  return (
    <div className="flex flex-col gap-3">
      {canWrite && (
        <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-wrap gap-2 items-center">
          {columns.map((c) => {
            if (c.key === 'status' && statuses && statuses.length) {
              return (
                <select key={c.key} value={draft.status || ''} onChange={(e) => set('status', e.target.value)} className="px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12px] outline-none">
                  <option value="">{c.label}…</option>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              );
            }
            return (
              <input
                key={c.key}
                type={c.type === 'date' ? 'date' : c.type === 'number' ? 'number' : 'text'}
                value={draft[c.key] || ''}
                onChange={(e) => set(c.key, e.target.value)}
                placeholder={c.label}
                title={c.label}
                className={`px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none ${c.key === 'title' ? 'flex-1 min-w-[160px]' : c.type === 'date' ? 'w-[150px]' : 'w-32'}`}
              />
            );
          })}
          <button onClick={add} disabled={!(draft.title || '').trim()} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-[12.5px] italic text-[#9a9a9a] py-3">{emptyText || 'Nessuna voce.'}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {list.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-bold text-[#161616] truncate">{r.title}</span>
                  {r.status && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${statusStyle(r.status)}`}>{r.status}</span>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-[#9a9a9a]">
                  {r.date && <span>{fmtDay(r.date)}{r.dateEnd ? ` → ${fmtDay(r.dateEnd)}` : ''}</span>}
                  {columns.filter((c) => !SPECIAL.has(c.key)).map((c) => r.fields?.[c.key] ? <span key={c.key}>{c.label}: {r.fields[c.key]}</span> : null)}
                </div>
              </div>
              {canWrite && (!canDelete || canDelete(r)) && (
                <button onClick={() => onDelete(r.id)} className="text-rose-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
