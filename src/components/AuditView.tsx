/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AuditView — Registro attività (audit log, nodo `auditLog`). Trail delle azioni
 * dello studio (create/update/delete/restore…). Solo admin/manager. Sola lettura.
 */
import React, { useMemo, useState } from 'react';
import { ScrollText, Search, Plus, Pencil, Trash2, RotateCcw, Dot } from 'lucide-react';
import { AuditEntry } from '../types';

const ACTION: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  create: { label: 'Creazione', color: '#059669', icon: Plus },
  update: { label: 'Modifica', color: '#2563eb', icon: Pencil },
  delete: { label: 'Eliminazione', color: '#dc2626', icon: Trash2 },
  restore: { label: 'Ripristino', color: '#d97706', icon: RotateCcw },
  login: { label: 'Accesso', color: '#6b7280', icon: Dot },
  other: { label: 'Azione', color: '#6b7280', icon: Dot },
};

const fmt = (t: number) => new Date(t).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const AuditView: React.FC<{ entries: AuditEntry[] }> = ({ entries }) => {
  const [q, setQ] = useState('');
  const [section, setSection] = useState<'all' | string>('all');
  const [action, setAction] = useState<'all' | string>('all');

  const sections = useMemo(() => Array.from(new Set(entries.map((e) => e.section))).sort(), [entries]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...entries]
      .filter((e) => section === 'all' || e.section === section)
      .filter((e) => action === 'all' || e.action === action)
      .filter((e) => !term || `${e.label} ${e.detail || ''} ${e.byName || ''} ${e.section}`.toLowerCase().includes(term))
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [entries, q, section, action]);

  return (
    <div className="flex flex-col gap-5 text-left">
      <div>
        <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2"><ScrollText className="w-5 h-5" /> Registro attività</h2>
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">Trail delle azioni dello studio (creazioni, modifiche, eliminazioni, ripristini). Sola lettura.</p>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca…" className="pl-9 pr-3 py-2 text-[13px] rounded-xl border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] w-[200px]" />
        </div>
        <select value={section} onChange={(e) => setSection(e.target.value)} className="py-2 px-3 text-[13px] rounded-xl border border-[#e2e2e2] bg-white cursor-pointer">
          <option value="all">Tutte le aree</option>
          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="py-2 px-3 text-[13px] rounded-xl border border-[#e2e2e2] bg-white cursor-pointer">
          <option value="all">Tutte le azioni</option>
          {Object.entries(ACTION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-[11.5px] text-[#8a8a8a] ml-auto">{list.length} voci</span>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <ScrollText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessuna attività registrata.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {list.map((e) => {
            const a = ACTION[e.action] || ACTION.other;
            const Icon = a.icon;
            return (
              <div key={e.id} className="bg-white border border-[#e2e2e2] rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.color + '1a', color: a.color }}><Icon className="w-4 h-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-[#161616] truncate">{e.label}</div>
                  <div className="text-[11.5px] text-[#8a8a8a] truncate">
                    <span style={{ color: a.color }} className="font-bold">{a.label}</span> · {e.section}{e.detail ? ` · ${e.detail}` : ''}{e.byName ? ` · ${e.byName}` : ''}
                  </div>
                </div>
                <span className="text-[11px] text-[#9a9a9a] shrink-0">{fmt(e.at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
