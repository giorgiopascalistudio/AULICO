/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HubCestino — pannello "Cestino & Archivio" riusato dai tre hub di Strategico
 * (Marketing, Direzione, Commerciale): mostra gli elementi ELIMINATI dell'area
 * (dal cestino condiviso `trash`, filtrati per sezione, con ripristino e
 * eliminazione definitiva) e gli ARCHIVIATI dell'area (lista passata dal hub,
 * es. preventivi archiviati, contenuti pubblicati, cicli chiusi).
 */
import React from 'react';
import { Trash2, Archive, RotateCcw, X } from 'lucide-react';
import type { TrashItem } from '../types';

export interface HubArchivedItem {
  id: string;
  label: string;
  meta?: string;
  onUnarchive?: () => void;
  unarchiveLabel?: string;
}

interface Props {
  /** Sezioni del cestino condiviso pertinenti a quest'area. */
  sections: string[];
  trash: TrashItem[];
  archived?: HubArchivedItem[];
  archiveHint?: string;
  canEdit?: boolean;
  onRestore?: (item: TrashItem) => void;
  onDeleteForever?: (item: TrashItem) => void;
}

const fmtD = (ms: number) => new Date(ms).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
const SECTION_LABEL: Record<string, string> = {
  preventivi: 'Preventivo', editorial: 'Contenuto', 'mkt-account': 'Account', 'mkt-spesa': 'Spesa',
  'fin-costplan': 'Costo programmato', 'fin-budget': 'Area budget', 'fin-ciclo': 'Ciclo',
  fatture_attive: 'Fattura attiva', fatture_passive: 'Fattura passiva', scadenze: 'Scadenza', movimenti: 'Movimento',
};

export const HubCestino: React.FC<Props> = ({ sections, trash, archived = [], archiveHint, canEdit = false, onRestore, onDeleteForever }) => {
  const [tab, setTab] = React.useState<'cestino' | 'archivio'>('cestino');
  const items = trash.filter((t) => sections.includes(t.section)).sort((a, b) => b.deletedAt - a.deletedAt);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          <button onClick={() => setTab('cestino')} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === 'cestino' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}><Trash2 className="w-3.5 h-3.5" /> Cestino ({items.length})</button>
          <button onClick={() => setTab('archivio')} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === 'archivio' ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}><Archive className="w-3.5 h-3.5" /> Archivio ({archived.length})</button>
        </div>
        <p className="text-[11px] text-[#a8a8a8] font-semibold">Gli elementi eliminati restano nel cestino 60 giorni, poi vengono rimossi.</p>
      </div>

      {tab === 'cestino' && (
        items.length === 0 ? (
          <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun elemento eliminato in quest'area.</p>
        ) : (
          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-2 flex flex-col">
            {items.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 px-2.5 py-2 border-b border-[#f3f3f3] last:border-none">
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{SECTION_LABEL[t.section] || t.section}</span>
                <div className="min-w-0 flex-1">
                  <b className="block text-[12.5px] text-[#161616] truncate">{t.label}</b>
                  <span className="block text-[10.5px] text-[#9a9a9a]">{[t.detail, `eliminato ${fmtD(t.deletedAt)}${t.deletedByName ? ` da ${t.deletedByName}` : ''}`].filter(Boolean).join(' · ')}</span>
                </div>
                {canEdit && onRestore && (
                  <button onClick={() => onRestore(t)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-emerald-400 text-emerald-700 text-[11px] font-bold cursor-pointer shrink-0"><RotateCcw className="w-3 h-3" /> Ripristina</button>
                )}
                {canEdit && onDeleteForever && (
                  <button onClick={() => onDeleteForever(t)} title="Elimina definitivamente" className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none shrink-0"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'archivio' && (
        <>
          {archiveHint && <p className="text-[11.5px] text-[#9a9a9a] font-semibold">{archiveHint}</p>}
          {archived.length === 0 ? (
            <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun elemento in archivio.</p>
          ) : (
            <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-2 flex flex-col">
              {archived.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 px-2.5 py-2 border-b border-[#f3f3f3] last:border-none">
                  <Archive className="w-3.5 h-3.5 text-[#b0b0b0] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <b className="block text-[12.5px] text-[#161616] truncate">{a.label}</b>
                    {a.meta && <span className="block text-[10.5px] text-[#9a9a9a] truncate">{a.meta}</span>}
                  </div>
                  {canEdit && a.onUnarchive && (
                    <button onClick={a.onUnarchive} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[11px] font-bold cursor-pointer shrink-0"><RotateCcw className="w-3 h-3" /> {a.unarchiveLabel || 'Ripristina'}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HubCestino;
