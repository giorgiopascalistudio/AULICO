/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatericoMappaView — Mappa operativa dei cantieri e delle commesse (Materico §12).
 * Ogni sito è localizzato (coordinate o indirizzo) su mappa Google (embed, nessuna
 * dipendenza) con apertura scheda e navigazione. Strumento di lavoro quotidiano.
 */
import React from 'react';
import { MapPin, ExternalLink, Building2, Target, Search } from 'lucide-react';

export interface MapSite {
  id: string;
  title: string;
  subtitle?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  kind: 'deal' | 'cantiere';
  hash?: string | null;
}
interface Props { sites: MapSite[]; color?: string; onOpen?: (hash: string) => void; }

const query = (s: MapSite) => (s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : s.address || s.title);
const embedUrl = (s: MapSite) => `https://www.google.com/maps?q=${encodeURIComponent(query(s))}&z=${s.lat != null ? 15 : 13}&output=embed`;
const extUrl = (s: MapSite) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query(s))}`;

export const MatericoMappaView: React.FC<Props> = ({ sites, onOpen }) => {
  const [q, setQ] = React.useState('');
  const [kind, setKind] = React.useState<'all' | 'deal' | 'cantiere'>('all');
  const list = sites
    .filter((s) => kind === 'all' || s.kind === kind)
    .filter((s) => { const t = q.trim().toLowerCase(); return !t || `${s.title} ${s.subtitle || ''} ${s.address || ''}`.toLowerCase().includes(t); });
  const [selId, setSelId] = React.useState<string | null>(null);
  React.useEffect(() => { if (!list.find((s) => s.id === selId)) setSelId(list[0]?.id || null); }, [list, selId]);
  const sel = sites.find((s) => s.id === selId) || null;

  return (
    <div className="flex flex-col gap-5 text-left">
      <div>
        <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><MapPin className="w-5.5 h-5.5" /> Mappa operativa</h2>
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Cantieri e commesse geolocalizzati: individua, apri la scheda, naviga.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Elenco siti */}
        <div className="lg:w-[320px] w-full flex flex-col gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca sito…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
          </div>
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start">
            {([['all', 'Tutti'], ['cantiere', 'Cantieri'], ['deal', 'Commesse']] as const).map(([id, lbl]) => (
              <button key={id} onClick={() => setKind(id)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${kind === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 max-h-[62vh] overflow-y-auto">
            {list.length === 0 ? <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-2xl p-6 text-center">Nessun sito con indirizzo.</p> : list.map((s) => {
              const Icon = s.kind === 'cantiere' ? Building2 : Target;
              const isSel = selId === s.id;
              return (
                <button key={s.id} onClick={() => setSelId(s.id)} className={`text-left flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${isSel ? 'bg-[#fafafa] border-[#161616]' : 'bg-white border-[#e2e2e2] hover:border-[#cfcfcf]'}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.kind === 'cantiere' ? 'bg-[#c2410c]/10 text-[#c2410c]' : 'bg-gray-100 text-[#555]'}`}><Icon className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1">
                    <b className="text-[13px] text-[#161616] truncate block">{s.title}</b>
                    {s.subtitle && <p className="text-[11px] text-[#8a8a8a] truncate">{s.subtitle}</p>}
                    {s.address ? <p className="text-[11px] text-[#a0a0a0] truncate inline-flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {s.address}</p> : <p className="text-[10.5px] text-rose-400 italic">Indirizzo mancante</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mappa + azioni */}
        <div className="lg:flex-1 w-full bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm">
          {!sel ? (
            <div className="h-[60vh] flex items-center justify-center text-[13px] text-[#9a9a9a]">Seleziona un sito.</div>
          ) : (
            <>
              <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <b className="text-[15px] text-[#161616]">{sel.title}</b>
                  <p className="text-[12px] text-[#8a8a8a]">{[sel.subtitle, sel.address].filter(Boolean).join(' · ') || 'Posizione stimata dal nome'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={extUrl(sel)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold"><ExternalLink className="w-3.5 h-3.5" /> Apri in Google Maps</a>
                  {sel.hash && onOpen && <button onClick={() => onOpen(sel.hash!)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none">Apri scheda</button>}
                </div>
              </div>
              <iframe key={sel.id} title="mappa" src={embedUrl(sel)} className="w-full h-[58vh] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatericoMappaView;
