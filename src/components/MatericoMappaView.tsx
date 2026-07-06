/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatericoMappaView — Mappa operativa dei cantieri e delle commesse (Materico §12).
 * Ogni sito è localizzato (coordinate o indirizzo) su mappa Google (embed, nessuna
 * dipendenza) con apertura scheda e navigazione. Strumento di lavoro quotidiano.
 * Usata da TUTTE le società: ogni tipo di sito ha colore e icona propri.
 */
import React from 'react';
import {
  MapPin, ExternalLink, Target, Search, Briefcase, HardHat,
  FileText, Gem, Home, AlertTriangle, CalendarPlus, ArrowUpRight, Navigation,
} from 'lucide-react';

export type MapSiteKind = 'deal' | 'cantiere' | 'pratica' | 'opportunita' | 'investimento' | 'immobile';
export interface MapSite {
  id: string;
  title: string;
  subtitle?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  kind: MapSiteKind;
  hash?: string | null;
}
/** Etichetta (plurale + singolare), colore e icona per tipo di sito (la mappa è per TUTTE le società). */
const KIND_META: Record<MapSiteKind, { label: string; one: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  deal: { label: 'Commesse', one: 'Commessa', color: '#c2410c', icon: Briefcase },
  cantiere: { label: 'Cantieri', one: 'Cantiere', color: '#c2410c', icon: HardHat },
  pratica: { label: 'Pratiche', one: 'Pratica', color: '#161616', icon: FileText },
  opportunita: { label: 'Opportunità', one: 'Opportunità', color: '#4338ca', icon: Target },
  investimento: { label: 'Investimenti', one: 'Investimento', color: '#4338ca', icon: Gem },
  immobile: { label: 'Immobili', one: 'Immobile', color: '#0d9488', icon: Home },
};
interface Props {
  sites: MapSite[];
  color?: string;
  onOpen?: (hash: string) => void;
  canEdit?: boolean;
  /** Azioni operative dalla mappa (PDF): segnala problematica / programma sopralluogo → attività in agenda. */
  onQuickTask?: (title: string) => void;
}

const query = (s: MapSite) => (s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : s.address || s.title);
const embedUrl = (s: MapSite) => `https://www.google.com/maps?q=${encodeURIComponent(query(s))}&z=${s.lat != null ? 15 : 13}&output=embed`;
const extUrl = (s: MapSite) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query(s))}`;

export const MatericoMappaView: React.FC<Props> = ({ sites, color = '#161616', onOpen, canEdit = false, onQuickTask }) => {
  const [q, setQ] = React.useState('');
  const [report, setReport] = React.useState('');
  const [reporting, setReporting] = React.useState(false);
  const [kind, setKind] = React.useState<'all' | MapSiteKind>('all');
  const kindsPresent = [...new Set(sites.map((s) => s.kind))];
  const noAddress = sites.filter((s) => !s.address && s.lat == null).length;
  const list = sites
    .filter((s) => kind === 'all' || s.kind === kind)
    .filter((s) => { const t = q.trim().toLowerCase(); return !t || `${s.title} ${s.subtitle || ''} ${s.address || ''}`.toLowerCase().includes(t); });
  const [selId, setSelId] = React.useState<string | null>(null);
  React.useEffect(() => { if (!list.find((s) => s.id === selId)) setSelId(list[0]?.id || null); }, [list, selId]);
  const sel = sites.find((s) => s.id === selId) || null;
  const selMeta = sel ? KIND_META[sel.kind] : null;

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Header + KPI */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
            <MapPin className="w-5.5 h-5.5" style={{ color }} /> Mappa operativa
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">I siti della società sulla mappa: individua, apri la scheda, segnala, naviga.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-[#e2e2e2] rounded-[16px] px-3.5 py-2 shadow-sm text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#a0a0a0]">Siti</p>
            <p className="text-[17px] font-black leading-none mt-0.5" style={{ color }}>{sites.length}</p>
          </div>
          {kindsPresent.map((k) => (
            <div key={k} className="bg-white border border-[#e2e2e2] rounded-[16px] px-3.5 py-2 shadow-sm text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#a0a0a0]">{KIND_META[k].label}</p>
              <p className="text-[17px] font-black leading-none mt-0.5" style={{ color: KIND_META[k].color }}>{sites.filter((s) => s.kind === k).length}</p>
            </div>
          ))}
          {noAddress > 0 && (
            <div className="bg-white border border-rose-200 rounded-[16px] px-3.5 py-2 shadow-sm text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Senza indirizzo</p>
              <p className="text-[17px] font-black leading-none mt-0.5 text-rose-500">{noAddress}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Elenco siti */}
        <div className="lg:w-[330px] w-full flex flex-col gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca sito, indirizzo…" className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white shadow-sm" />
          </div>
          {kindsPresent.length > 1 && (
            <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start flex-wrap">
              {(['all', ...kindsPresent] as const).map((id) => (
                <button key={id} onClick={() => setKind(id as any)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${kind === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{id === 'all' ? 'Tutti' : KIND_META[id as MapSiteKind].label}</button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1.5 max-h-[62vh] overflow-y-auto pr-0.5">
            {list.length === 0 ? (
              <div className="bg-white border border-[#e2e2e2] rounded-2xl p-8 text-center">
                <MapPin className="w-7 h-7 mx-auto text-[#d0d0d0] mb-2" />
                <p className="text-[13px] text-[#9a9a9a] font-semibold">Nessun sito {q ? 'corrisponde alla ricerca' : 'con indirizzo'}.</p>
              </div>
            ) : list.map((s) => {
              const meta = KIND_META[s.kind];
              const Icon = meta.icon;
              const isSel = selId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelId(s.id)}
                  className={`text-left flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${isSel ? 'bg-white border-transparent shadow-md ring-2' : 'bg-white border-[#e2e2e2] hover:border-[#cfcfcf] hover:shadow-sm'}`}
                  style={isSel ? ({ ['--tw-ring-color' as any]: meta.color } as React.CSSProperties) : undefined}
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}14`, color: meta.color }}><Icon className="w-4.5 h-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <b className="text-[13px] text-[#161616] truncate">{s.title}</b>
                      {isSel && <Navigation className="w-3 h-3 shrink-0" style={{ color: meta.color }} />}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>{meta.one}{s.subtitle ? ` · ${s.subtitle}` : ''}</p>
                    {s.address
                      ? <p className="text-[11px] text-[#a0a0a0] truncate inline-flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" /> {s.address}</p>
                      : <p className="text-[10.5px] text-rose-400 italic mt-0.5">Indirizzo mancante</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mappa + azioni */}
        <div className="lg:flex-1 w-full bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm">
          {!sel ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-[#9a9a9a]">
              <MapPin className="w-8 h-8 text-[#d0d0d0]" />
              <p className="text-[13px] font-semibold">Seleziona un sito dall'elenco.</p>
            </div>
          ) : (
            <>
              <div className="h-1" style={{ background: selMeta!.color }} />
              <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${selMeta!.color}14`, color: selMeta!.color }}>
                    {React.createElement(selMeta!.icon, { className: 'w-5 h-5' })}
                  </span>
                  <div className="min-w-0">
                    <b className="text-[15px] text-[#161616] block truncate">{sel.title}</b>
                    <p className="text-[12px] text-[#8a8a8a] truncate">{[sel.subtitle, sel.address].filter(Boolean).join(' · ') || 'Posizione stimata dal nome'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {canEdit && onQuickTask && (
                    <>
                      <button onClick={() => setReporting((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold cursor-pointer ${reporting ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'}`}><AlertTriangle className="w-3.5 h-3.5" /> Segnala problematica</button>
                      <button onClick={() => onQuickTask(`Sopralluogo — ${sel.title}${sel.address ? ` (${sel.address})` : ''}`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><CalendarPlus className="w-3.5 h-3.5" /> Programma sopralluogo</button>
                    </>
                  )}
                  <a href={extUrl(sel)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold"><ExternalLink className="w-3.5 h-3.5" /> Google Maps</a>
                  {sel.hash && onOpen && <button onClick={() => onOpen(sel.hash!)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none"><ArrowUpRight className="w-3.5 h-3.5" /> Apri scheda</button>}
                </div>
              </div>
              {reporting && canEdit && onQuickTask && (
                <div className="px-4 py-3 border-b border-[#f0f0f0] bg-rose-50/40 flex items-center gap-2">
                  <input
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && report.trim()) { onQuickTask(`Problematica ${sel.title}: ${report.trim()}`); setReport(''); setReporting(false); } }}
                    placeholder="Descrivi la problematica (diventa un'attività in agenda)…"
                    className="flex-1 px-3 py-2 rounded-xl border border-rose-200 text-[13px] outline-none focus:border-rose-400 bg-white"
                    autoFocus
                  />
                  <button
                    onClick={() => { if (report.trim()) { onQuickTask(`Problematica ${sel.title}: ${report.trim()}`); setReport(''); setReporting(false); } }}
                    disabled={!report.trim()}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-[12px] font-bold cursor-pointer border-none disabled:opacity-40"
                  >Apri attività</button>
                </div>
              )}
              <iframe key={sel.id} title="mappa" src={embedUrl(sel)} className="w-full h-[58vh] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatericoMappaView;
