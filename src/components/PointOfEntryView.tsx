/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PointOfEntryView — STRATEGICO · Point of Entry (docs 01-STRATEGICO):
 * "tutti i lead e le richieste di preventivo transitano da qui prima di essere
 * smistati alla società competente". Inbox unificata: LEAD da smistare
 * (pipeline CRM, bottoni società) + RICHIESTE CLIENTI dal portale (prendi in
 * carico / converti in progetto / chiudi). Nessun nodo nuovo: riusa crmLeads
 * e clientRequests coi handler esistenti.
 */
import React from 'react';
import { Inbox, Target, User, ArrowRight, CheckCircle2, XCircle, Briefcase } from 'lucide-react';
import type { ClientRequest } from '../types';
import type { Lead } from './CrmView';
import { eur } from '../utils';

const SOC_OPTS: { id: 'studio' | 'strategico' | 'materico'; label: string; color: string }[] = [
  { id: 'studio', label: 'Onirico', color: '#161616' },
  { id: 'strategico', label: 'Strategico', color: '#b45309' },
  { id: 'materico', label: 'Materico', color: '#c2410c' },
];
const DIV_LABEL: Record<string, string> = { studio: 'Onirico', strategico: 'Strategico', unico: 'Unico', materico: 'Materico' };
const fmtD = (ms?: number | null) => (ms ? new Date(ms).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—');

interface Props {
  leads: Lead[];
  requests: ClientRequest[];
  myName?: string;
  color?: string;
  canEdit?: boolean;
  onSaveLeads?: (arr: Lead[]) => void;
  onRouteLead?: (lead: Lead, sector: 'studio' | 'strategico' | 'materico') => void;
  onTakeCharge?: (req: ClientRequest) => void;
  onConvert?: (req: ClientRequest) => void;
  onCloseRequest?: (req: ClientRequest) => void;
  onOpenCrm?: () => void;
  onOpenRichieste?: () => void;
}

export const PointOfEntryView: React.FC<Props> = ({ leads, requests, myName, color = '#b45309', canEdit = false, onSaveLeads, onRouteLead, onTakeCharge, onConvert, onCloseRequest, onOpenCrm, onOpenRichieste }) => {
  const daSmistare = leads.filter((l) => !l.routed && l.stage !== 'perso' && l.stage !== 'vinto');
  const nuoveRichieste = requests.filter((r) => r.status === 'inviata').sort((a, b) => b.createdAt - a.createdAt);
  const inCarico = requests.filter((r) => r.status === 'presa_in_carico').sort((a, b) => b.createdAt - a.createdAt);
  const weekAgo = Date.now() - 7 * 86400000;
  const smistatiSettimana = leads.filter((l) => l.routed && (l.routedAt || 0) >= weekAgo).length;

  const route = (lead: Lead, sector: 'studio' | 'strategico' | 'materico') => {
    if (!canEdit) return;
    const updated: Lead = { ...lead, sector, routed: true, routedAt: Date.now(), routedByName: myName || null };
    onSaveLeads?.(leads.map((l) => (l.id === lead.id ? updated : l)));
    onRouteLead?.(updated, sector);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Inbox className="w-5.5 h-5.5 text-[#161616]" /> Point of Entry</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Tutto entra da qui: lead e richieste dei clienti, smistati alla società competente prima di diventare lavoro.</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenCrm && <button onClick={onOpenCrm} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer"><Target className="w-4 h-4" /> Pipeline completa</button>}
          {onOpenRichieste && <button onClick={onOpenRichieste} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer"><User className="w-4 h-4" /> Tutte le richieste</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Lead da smistare', v: String(daSmistare.length), c: daSmistare.length ? '#e11d48' : undefined },
          { l: 'Richieste nuove', v: String(nuoveRichieste.length), c: nuoveRichieste.length ? '#b45309' : undefined },
          { l: 'In carico', v: String(inCarico.length) },
          { l: 'Smistati (7gg)', v: String(smistatiSettimana) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEAD da smistare */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Lead da smistare · a quale società compete?</p>
          {daSmistare.length === 0 ? (
            <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessun lead in attesa di smistamento.</p>
          ) : daSmistare.map((l) => (
            <div key={l.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-[13.5px] text-[#161616] block truncate">{l.name}{l.company ? ` · ${l.company}` : ''}</b>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5">{[l.stage, l.value ? eur(l.value) : null, l.email || l.phone, fmtD(l.createdAt)].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] mr-0.5">Smista a</span>
                  {SOC_OPTS.map((s) => (
                    <button key={s.id} onClick={() => route(l, s.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-[11px] font-bold cursor-pointer border-none" style={{ background: s.color }}>
                      {s.label} <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RICHIESTE CLIENTI dal portale */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Richieste dei clienti (dal portale)</p>
          {nuoveRichieste.length === 0 && inCarico.length === 0 ? (
            <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna richiesta aperta.</p>
          ) : [...nuoveRichieste, ...inCarico].map((r) => (
            <div key={r.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-[13.5px] text-[#161616] block truncate">{r.title}</b>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5 truncate">{[r.clientName, DIV_LABEL[r.division] || r.division, r.budget ? eur(r.budget) : null, r.location, fmtD(r.createdAt)].filter(Boolean).join(' · ')}</p>
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${r.status === 'inviata' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>{r.status === 'inviata' ? 'Nuova' : `In carico${r.handledByName ? ` · ${r.handledByName}` : ''}`}</span>
              </div>
              {r.description && <p className="text-[12px] text-[#555] mt-1.5 line-clamp-2">{r.description}</p>}
              {canEdit && (
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {r.status === 'inviata' && onTakeCharge && <button onClick={() => onTakeCharge(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[11px] font-bold cursor-pointer border-none"><User className="w-3 h-3" /> Prendi in carico</button>}
                  {onConvert && <button onClick={() => onConvert(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-emerald-400 text-emerald-700 text-[11px] font-bold cursor-pointer"><Briefcase className="w-3 h-3" /> Converti in progetto ({DIV_LABEL[r.division] || r.division})</button>}
                  {onCloseRequest && <button onClick={() => onCloseRequest(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-rose-300 text-rose-600 text-[11px] font-bold cursor-pointer"><XCircle className="w-3 h-3" /> Chiudi</button>}
                  {r.projectId && <span className="text-[10.5px] font-bold text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Progetto creato</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PointOfEntryView;
