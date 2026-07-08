/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DevReportsView — Strategico → Sviluppo Software → "Aulico — Segnalazioni".
 * Raccolta del periodo di test: bug/malfunzionamenti, richieste di implementazione
 * ed errori inoltrati dai box di errore (nodo devReports, tipo DevReport).
 * canEdit (admin/manager + permesso Opera) = cambia stato / elimina; tutti gli
 * altri vedono la lista in sola consultazione.
 */
import React from 'react';
import { Bug, Lightbulb, AlertTriangle, Trash2, ChevronDown, Plus, Inbox, Smartphone, Hash } from 'lucide-react';
import type { DevReport } from '../types';

const KIND_META: Record<DevReport['kind'], { label: string; icon: React.FC<any>; cls: string }> = {
  bug: { label: 'Bug', icon: Bug, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  richiesta: { label: 'Richiesta', icon: Lightbulb, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  errore: { label: 'Errore app', icon: AlertTriangle, cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};
const STATUSES: DevReport['status'][] = ['aperta', 'in_lavorazione', 'risolta', 'chiusa'];
const STATUS_LABEL: Record<DevReport['status'], string> = {
  aperta: 'Aperta', in_lavorazione: 'In lavorazione', risolta: 'Risolta', chiusa: 'Chiusa',
};
const STATUS_CLS: Record<DevReport['status'], string> = {
  aperta: 'bg-rose-50 text-rose-700 border-rose-200',
  in_lavorazione: 'bg-amber-50 text-amber-700 border-amber-200',
  risolta: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  chiusa: 'bg-gray-100 text-gray-500 border-gray-200',
};

const fmtDate = (at: number) =>
  new Date(at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) +
  ' · ' + new Date(at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

interface Props {
  reports: DevReport[];
  color: string;
  canEdit: boolean;
  onSetStatus: (id: string, status: DevReport['status']) => void;
  onDelete: (r: DevReport) => void;
  onNew: () => void;
}

export const DevReportsView: React.FC<Props> = ({ reports, color, canEdit, onSetStatus, onDelete, onNew }) => {
  const [kindFilter, setKindFilter] = React.useState<'tutte' | DevReport['kind']>('tutte');
  const [showClosed, setShowClosed] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const open = reports.filter((r) => r.status === 'aperta').length;
  const working = reports.filter((r) => r.status === 'in_lavorazione').length;
  const solved = reports.filter((r) => r.status === 'risolta' || r.status === 'chiusa').length;

  const list = reports
    .filter((r) => kindFilter === 'tutte' || r.kind === kindFilter)
    .filter((r) => showClosed || (r.status !== 'risolta' && r.status !== 'chiusa'))
    .sort((a, b) => {
      const w = (s: DevReport['status']) => (s === 'aperta' ? 0 : s === 'in_lavorazione' ? 1 : 2);
      return w(a.status) - w(b.status) || b.at - a.at;
    });

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#161616]">Aulico — Segnalazioni</h2>
          <p className="text-[12.5px] text-[#8a8a8a] mt-0.5">Bug, malfunzionamenti, richieste ed errori inoltrati durante il periodo di test.</p>
        </div>
        <button onClick={onNew} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none shadow-sm">
          <Plus className="w-4 h-4" /> Nuova segnalazione
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Aperte', value: open, accent: open ? '#dc2626' : undefined },
          { label: 'In lavorazione', value: working, accent: working ? '#b45309' : undefined },
          { label: 'Risolte / chiuse', value: solved },
          { label: 'Totale', value: reports.length },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#e2e2e2] rounded-xl p-3">
            <div className="text-[22px] font-black tracking-tight leading-none" style={{ color: k.accent || '#161616' }}>{k.value}</div>
            <div className="text-[10.5px] text-[#8a8a8a] mt-1.5 font-bold uppercase tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['tutte', 'bug', 'richiesta', 'errore'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={`px-3 py-1.5 rounded-full border text-[12px] font-bold cursor-pointer ${kindFilter === k ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2] text-[#555]'}`}
          >
            {k === 'tutte' ? 'Tutte' : KIND_META[k].label}
          </button>
        ))}
        <button
          onClick={() => setShowClosed((v) => !v)}
          className={`ml-auto px-3 py-1.5 rounded-full border text-[12px] font-bold cursor-pointer ${showClosed ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2] text-[#555]'}`}
        >
          {showClosed ? 'Nascondi risolte' : 'Mostra anche risolte'}
        </button>
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-10 text-center text-[#8a8a8a]">
          <Inbox className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <b className="block text-[#161616] text-[15px] font-semibold mb-1">Nessuna segnalazione</b>
          <p className="text-[13px] max-w-[380px] mx-auto">Le segnalazioni degli utenti (pulsante "Segnala un problema" e "Segnala" sui box di errore) compariranno qui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((r) => {
            const meta = KIND_META[r.kind];
            const Icon = meta.icon;
            const expanded = openId === r.id;
            return (
              <div key={r.id} className="bg-white border border-[#e2e2e2] rounded-[18px] overflow-hidden">
                <button
                  onClick={() => setOpenId(expanded ? null : r.id)}
                  className="w-full flex items-center gap-3 p-3.5 cursor-pointer bg-transparent border-none text-left"
                >
                  <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.cls}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <b className="block text-[13.5px] font-bold text-[#161616] truncate leading-tight">{r.title}</b>
                    <span className="block text-[11px] text-[#8a8a8a] truncate mt-0.5">
                      {r.byName}{r.byRole ? ` (${r.byRole})` : ''} · {fmtDate(r.at)}{r.route ? ` · ${r.route}` : ''}
                    </span>
                  </span>
                  <span className={`px-2.5 py-1 rounded-full border text-[10.5px] font-extrabold uppercase tracking-wide shrink-0 ${STATUS_CLS[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#b0b0b0] shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#f2f2f0]">
                    {r.description && <p className="text-[13px] text-[#333] whitespace-pre-wrap mb-3 mt-2">{r.description}</p>}
                    {r.errorText && (
                      <pre className="text-[11.5px] text-[#7a3a12] bg-orange-50 border border-orange-200 rounded-xl p-3 whitespace-pre-wrap break-words font-mono mb-3 mt-2">{r.errorText}</pre>
                    )}
                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#8a8a8a] mb-3">
                      {r.route && <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" /> {r.route}</span>}
                      {r.device && <span className="inline-flex items-center gap-1 min-w-0"><Smartphone className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[420px]">{r.device}</span></span>}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={r.status}
                          onChange={(e) => onSetStatus(r.id, e.target.value as DevReport['status'])}
                          className="px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none focus:border-[#161616] bg-white cursor-pointer"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                        <button onClick={() => onDelete(r)} className="ml-auto p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer bg-white" title="Elimina (nel Cestino)">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
