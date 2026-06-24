/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ClientRequestsView — lato STUDIO (admin/manager).
 * Inbox delle richieste inviate dai clienti dal portale (nodo clientRequests).
 * Per ogni richiesta: dettaglio + moodboard 3D del cliente, "Prendi in carico",
 * "Converti in progetto" (crea il progetto e collega il cliente), "Chiudi",
 * "Elimina".
 */

import React, { useState, lazy, Suspense } from 'react';
import {
  Inbox, Box, ExternalLink, FolderPlus, Clock, X,
  Building2, Boxes, Megaphone, Home, Trash2,
} from 'lucide-react';
import type { ClientRequest } from '../types';
import { COMPANY_COLOR } from '../finance';
import { safeUrl } from '../utils';

const Moodboard3D = lazy(() => import('./moodboard3d/Moodboard3D'));

const DIV_META: Record<string, { name: string; sub: string; icon: React.ComponentType<{ className?: string }> }> = {
  studio: { name: 'Studio', sub: 'Architettura & Ingegneria', icon: Building2 },
  materico: { name: 'Materico', sub: 'Forniture & Posa', icon: Boxes },
  strategico: { name: 'Strategico', sub: 'Marketing & Brand', icon: Megaphone },
  unico: { name: 'Unico', sub: 'Atelier immobiliare', icon: Home },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  inviata: { label: 'Nuova', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  presa_in_carico: { label: 'In carico', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  convertita: { label: 'Attivata', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  chiusa: { label: 'Chiusa', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'attive', label: 'Da gestire' },
  { key: 'inviata', label: 'Nuove' },
  { key: 'presa_in_carico', label: 'In carico' },
  { key: 'convertita', label: 'Attivate' },
  { key: 'chiusa', label: 'Chiuse' },
  { key: 'tutte', label: 'Tutte' },
];

interface ClientRequestsViewProps {
  requests: ClientRequest[];
  onTakeCharge: (req: ClientRequest) => void;
  onConvert: (req: ClientRequest) => void;
  onCloseRequest: (req: ClientRequest) => void;
  onDelete: (req: ClientRequest) => void;
}

export const ClientRequestsView: React.FC<ClientRequestsViewProps> = ({
  requests, onTakeCharge, onConvert, onCloseRequest, onDelete,
}) => {
  const [filter, setFilter] = useState('attive');
  const [mbReq, setMbReq] = useState<ClientRequest | null>(null);

  const sorted = [...requests].sort((a, b) => b.createdAt - a.createdAt);
  const visible = sorted.filter((r) => {
    if (filter === 'tutte') return true;
    if (filter === 'attive') return r.status === 'inviata' || r.status === 'presa_in_carico';
    return r.status === filter;
  });
  const newCount = sorted.filter((r) => r.status === 'inviata').length;

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto w-full">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-10 h-10 rounded-2xl bg-[#161616] text-white flex items-center justify-center">
          <Inbox className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-[22px] font-extrabold text-[#161616] tracking-tight">Richieste clienti</h1>
          <p className="text-[12.5px] text-[#8a8a8a]">Le idee inviate dai clienti dal portale. Valutale e convertile in progetti.</p>
        </div>
      </div>

      {/* Filtri */}
      <div className="pillbar flex items-center gap-1.5 mt-5 mb-4">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          const badge = f.key === 'inviata' && newCount > 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-all ${on ? 'bg-[#1b1b1b] text-white border-[#1b1b1b]' : 'bg-white text-[#161616] border-[#e2e2e2] hover:border-stone-400'}`}
            >
              {f.label}
              {badge && <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center">{newCount}</span>}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <Inbox className="w-8 h-8 text-[#cfcfcf] mx-auto mb-2" />
          <b className="block text-[#161616] text-[15px]">Nessuna richiesta</b>
          <p className="text-[12.5px] text-[#8a8a8a] mt-1">Qui arriveranno le idee inviate dai clienti dal loro portale.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((r) => {
            const m = DIV_META[r.division] || DIV_META.studio;
            const st = STATUS_META[r.status] || STATUS_META.inviata;
            const color = COMPANY_COLOR[r.division] || '#161616';
            const links = (r.links || []).filter(Boolean);
            return (
              <div key={r.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: color }}>
                    <m.icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-[15px] text-[#161616]">{r.title}</b>
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      {(r.moodboard || []).length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md px-1.5 py-0.5">
                          <Box className="w-3 h-3" /> Moodboard 3D
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-[#8a8a8a]">
                      {m.name} · {r.clientName} · {new Date(r.createdAt).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-[#3a3a3a] leading-relaxed mt-3 whitespace-pre-wrap">{r.description}</p>

                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[12px] text-[#555]">
                  {r.budget != null && <span><b className="text-[#161616]">Budget:</b> € {Number(r.budget).toLocaleString('it-IT')}</span>}
                  {r.location && <span><b className="text-[#161616]">Dove:</b> {r.location}</span>}
                  {r.clientEmail && <span><b className="text-[#161616]">Email:</b> {r.clientEmail}</span>}
                </div>

                {links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {links.map((l, i) => (
                      <a key={i} href={safeUrl(l) || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-indigo-600 hover:underline bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">
                        <ExternalLink className="w-3 h-3" /> Link {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {/* Azioni */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  {(r.moodboard || []).length > 0 && (
                    <button onClick={() => setMbReq(r)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold py-2 px-3 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-all active:scale-95">
                      <Box className="w-4 h-4" /> Vedi moodboard 3D
                    </button>
                  )}
                  {r.status === 'convertita' && r.projectId ? (
                    <a href={`#progetto/${r.projectId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold py-2 px-3 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-all active:scale-95">
                      <ExternalLink className="w-4 h-4" /> Apri progetto
                    </a>
                  ) : (
                    <>
                      {r.status === 'inviata' && (
                        <button onClick={() => onTakeCharge(r)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold py-2 px-3 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] cursor-pointer transition-all active:scale-95">
                          <Clock className="w-4 h-4" /> Prendi in carico
                        </button>
                      )}
                      {r.status !== 'chiusa' && (
                        <button onClick={() => onConvert(r)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold py-2 px-3 rounded-xl bg-[#1b1b1b] hover:bg-black text-white cursor-pointer transition-all active:scale-95">
                          <FolderPlus className="w-4 h-4" /> Converti in progetto
                        </button>
                      )}
                      {r.status !== 'chiusa' && (
                        <button onClick={() => onCloseRequest(r)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold py-2 px-3 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] text-stone-500 cursor-pointer transition-all active:scale-95">
                          <X className="w-4 h-4" /> Chiudi
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => onDelete(r)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold py-2 px-3 rounded-xl border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 cursor-pointer transition-all active:scale-95 ml-auto">
                    <Trash2 className="w-4 h-4" /> Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moodboard 3D del cliente (sola consultazione: onSave no-op) */}
      {mbReq && (
        <Suspense fallback={<div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center text-white text-sm font-bold">Carico la moodboard 3D…</div>}>
          <Moodboard3D
            open={!!mbReq}
            onClose={() => setMbReq(null)}
            projectName={`${mbReq.title} · ${mbReq.clientName}`}
            elements={mbReq.moodboard || []}
            onSave={() => { /* sola consultazione lato studio */ }}
          />
        </Suspense>
      )}
    </div>
  );
};
