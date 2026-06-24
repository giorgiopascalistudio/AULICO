/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DocRegistry — registro documenti generico (nome + categoria + scadenza + upload Drive/link).
 * Riusato per tutte le sezioni "documenti" della struttura PDF del Cantiere
 * (Documenti, POS/PSC/DUVRI, Verbali, Permessi, Certificati, DURC/Visure/Polizze/SOA…).
 */
import React, { useState } from 'react';
import { FileText, Trash2, AlertTriangle } from 'lucide-react';
import { fmtDay, safeUrl } from '../../utils';
import { DriveUploader } from './DriveUploader';

export interface DocItem {
  id: string;
  name: string;
  driveUrl?: string | null;
  link?: string | null;
  category?: string | null;
  expiry?: string | null;
  by?: string;
  at: number;
}

interface DocRegistryProps {
  items: DocItem[];
  folderName: string;
  canWrite: boolean;
  canDelete?: (item: DocItem) => boolean;
  onAdd: (data: { name: string; driveFileId?: string | null; driveUrl?: string | null; link?: string | null; category?: string | null; expiry?: string | null }) => void;
  onDelete: (id: string) => void;
  categories?: string[];
  withExpiry?: boolean;
  emptyText?: string;
}

const expiryBadge = (expiry?: string | null) => {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (isNaN(days)) return null;
  if (days < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700">Scaduto {fmtDay(expiry)}</span>;
  if (days <= 30) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700">Scade {fmtDay(expiry)}</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">Valido al {fmtDay(expiry)}</span>;
};

export const DocRegistry: React.FC<DocRegistryProps> = ({ items, folderName, canWrite, canDelete, onAdd, onDelete, categories, withExpiry, emptyText }) => {
  const [cat, setCat] = useState('');
  const [expiry, setExpiry] = useState('');
  const [name, setName] = useState('');
  const list = [...items].sort((a, b) => b.at - a.at);

  const push = (f: { driveFileId?: string; driveUrl?: string; link?: string; name?: string }) => {
    onAdd({
      name: name.trim() || f.name || (categories && cat ? cat : 'Documento'),
      driveFileId: f.driveFileId || null,
      driveUrl: f.driveUrl || null,
      link: f.link || null,
      category: cat || null,
      expiry: expiry || null
    });
    setCat(''); setExpiry(''); setName('');
  };

  return (
    <div className="flex flex-col gap-3">
      {canWrite && (
        <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome documento (facoltativo)" className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
            {categories && categories.length > 0 && (
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12px] outline-none">
                <option value="">Categoria…</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {withExpiry && (
              <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} title="Scadenza" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
            )}
          </div>
          <DriveUploader folderName={folderName} onUploaded={push} />
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-[12.5px] italic text-[#9a9a9a] py-3">{emptyText || 'Nessun documento.'}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {list.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#eee]">
              <a href={safeUrl(d.driveUrl || d.link) || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12.5px] font-medium text-[#161616] min-w-0">
                <FileText className="w-4 h-4 text-[#9a9a9a] shrink-0" />
                <span className="truncate">{d.name}</span>
                {d.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f1f1f1] text-[#6b6b6b] font-bold shrink-0">{d.category}</span>}
              </a>
              <div className="flex items-center gap-2 shrink-0">
                {withExpiry ? expiryBadge(d.expiry) : <span className="text-[11px] text-[#9a9a9a]">{fmtDay(new Date(d.at).toISOString().slice(0, 10))}</span>}
                {(!canDelete || canDelete(d)) && canWrite && (
                  <button onClick={() => onDelete(d.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!canWrite && list.length === 0 && null}
      {withExpiry && canWrite && list.length === 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#b0b0b0]"><AlertTriangle className="w-3 h-3" /> Carica i documenti con la relativa scadenza per tenere monitorate le validità.</span>
      )}
    </div>
  );
};
