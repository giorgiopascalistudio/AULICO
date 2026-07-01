/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Registro Unico delle Persone — vista master-detail (ispirata al prototipo
 * docs/V2/PROTOTIPI/aulico-crm). Lista a sinistra (bollino pagamenti, badge),
 * scheda dedicata a destra con banner liberatoria bloccante e tab:
 * Anagrafica & Target · Asset del Brand · Credenziali protette · Memoria interazioni.
 */

import React from 'react';
import {
  Users, Plus, Search, Mail, Phone, MapPin, FileText, Lock, AlertTriangle,
  Clock, CheckCircle2, XCircle, Eye, EyeOff, Edit2, Trash2, Share2, Calendar,
  Gift, Megaphone, Target, ChevronDown, FolderOpen, Hash, UserCog, Upload, Download, FileDown, Star,
} from 'lucide-react';
import type { ClientRecord, BrandAsset, ContactCredential, ContactInteraction } from '../types';

interface Soc { id: string; label: string; color: string; }
interface Role { id: string; label: string; }
interface PayInfo { ok: boolean; daIncassare: number; }

interface ProjRef { id: string; name: string; status?: string; manager?: string | null; }
interface Props {
  clients: ClientRecord[];
  societies: Soc[];
  roles: Role[];
  onSave: (rec: ClientRecord) => void;
  onDelete: (rec: ClientRecord) => void;
  onEdit: (id: string) => void;
  onNew: () => void;
  onImport?: () => void;
  paymentStatus: (rec: ClientRecord) => PayInfo;
  projectsOf?: (rec: ClientRecord) => ProjRef[];
  memberName?: (uid: string) => string;
  restrictRoles?: string[];   // se presente: lista pre-filtrata a questi ruoli (es. fornitori)
  variant?: 'clienti' | 'fornitori';  // filtri e scheda differenziati
  title?: string;
}

const onKeys = (m?: Record<string, boolean>) => Object.keys(m || {}).filter((k) => m![k]);
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

// ---- Ranking partner/fornitori ----
const RATING_CRITERIA: [keyof NonNullable<ClientRecord['partnerRating']>, string][] = [
  ['tempistiche', 'Tempistiche rispettate'],
  ['qualita', 'Qualità delle lavorazioni'],
  ['preventivazione', 'Velocità di preventivazione'],
  ['costo', 'Costo / competitività'],
  ['organizzazione', 'Organizzazione & maestranze'],
];
const ratingAvg = (r?: ClientRecord['partnerRating'] | null): number => {
  if (!r) return 0;
  const vals = RATING_CRITERIA.map(([k]) => r[k]).filter((v) => typeof v === 'number' && (v as number) > 0) as number[];
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};
const Stars: React.FC<{ value: number; size?: number; onSet?: (v: number) => void }> = ({ value, size = 14, onSet }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`${onSet ? 'cursor-pointer' : ''}`} onClick={onSet ? () => onSet(i) : undefined} style={{ width: size, height: size }}
        fill={i <= Math.round(value) ? '#f59e0b' : 'none'} color={i <= Math.round(value) ? '#f59e0b' : '#d0d0d0'} />
    ))}
  </span>
);
const tierStyle = (t?: number | null) => (t === 1 ? 'bg-rose-50 text-rose-700' : t === 2 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700');
const INT_ICON = { riunione: FileText, evento: Calendar, campagna: Megaphone, regalo: Gift } as const;
const INT_LABEL = { riunione: 'Riunione / Nota', evento: 'Evento', campagna: 'Campagna', regalo: 'Pensiero / Gadget' } as const;

export const CrmRegistro: React.FC<Props> = ({ clients, societies, roles, onSave, onDelete, onEdit, onNew, onImport, paymentStatus, projectsOf, memberName, restrictRoles, variant = 'clienti', title }) => {
  const isFornitori = variant === 'fornitori';
  const [selId, setSelId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [soc, setSoc] = React.useState<'all' | string>('all');
  const [role, setRole] = React.useState<'all' | string>('all');
  const [minStars, setMinStars] = React.useState(0);
  const [detTab, setDetTab] = React.useState<'anagrafica' | 'brand' | 'credenziali' | 'storia'>('anagrafica');
  const [pwShown, setPwShown] = React.useState<Record<string, boolean>>({});

  const list = clients
    .filter((c) => {
      if (restrictRoles && !restrictRoles.some((r) => c.roles?.[r])) return false;
      const q = search.trim().toLowerCase();
      if (q && !(`${c.name} ${c.companyName || ''} ${c.email || ''} ${c.phone || ''} ${c.codiceReferenza || ''} ${(c.targetTags || []).join(' ')}`.toLowerCase().includes(q))) return false;
      if (soc !== 'all' && !c.societies?.[soc]) return false;
      if (role !== 'all' && !c.roles?.[role]) return false;
      if (isFornitori && minStars > 0 && ratingAvg(c.partnerRating) < minStars) return false;
      return true;
    })
    .sort((a, b) => (isFornitori ? (ratingAvg(b.partnerRating) - ratingAvg(a.partnerRating)) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)));

  // seleziona il primo della lista filtrata se nulla è selezionato o l'attuale è uscito dai filtri
  React.useEffect(() => {
    if (!list.find((c) => c.id === selId)) setSelId(list[0]?.id || null);
  }, [list, selId]);

  // ruoli mostrati nel filtro tipo (esclude quelli "fissi" del restrict)
  const filterRoles = restrictRoles ? roles.filter((r) => !restrictRoles.includes(r.id)) : roles;

  const sel = selId ? clients.find((c) => c.id === selId) || null : null;

  // patch helper: aggiorna il contatto selezionato e persiste
  const patch = (changes: Partial<ClientRecord>) => { if (sel) onSave({ ...sel, ...changes, updatedAt: Date.now() }); };

  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.label || id;

  // ---- Export (rispetta i filtri correnti) ----
  const respName = (c: ClientRecord) => c.responsabileNome || Object.keys(c.responsabili || {}).map((u) => (memberName ? memberName(u) : u)).join(', ');
  const EXP_COLS: [string, (c: ClientRecord) => string][] = [
    ['Codice', (c) => c.codiceReferenza || ''],
    ['Nome', (c) => c.name],
    ['Tipo', (c) => c.type],
    ['Email', (c) => c.email || ''],
    ['Telefono', (c) => c.phone || ''],
    ['Indirizzo', (c) => c.address || ''],
    ['Fascia', (c) => (c.tier ? String(c.tier) : '')],
    ['Stato', (c) => (c.stato || '')],
    ['Responsabile', (c) => respName(c)],
    ['Rif. comunicazione', (c) => c.riferimentoComunicazione || ''],
    ['Preventivo', (c) => (c.preventivoStato === 'firmato' ? 'Firmato' : c.preventivoStato === 'non_firmato' ? 'Non firmato' : '')],
    ['Saldato', (c) => (c.saldato === true ? 'SI' : c.saldato === false ? 'NO' : '')],
    ['Data inizio', (c) => c.dataInizio || ''],
    ['Data fine', (c) => c.dataFine || ''],
    ['Da incassare', (c) => { const p = paymentStatus(c); return p.daIncassare ? p.daIncassare.toFixed(2) : ''; }],
    ...(isFornitori ? [['Valutazione', (c: ClientRecord) => { const a = ratingAvg(c.partnerRating); return a ? a.toFixed(1) : ''; }] as [string, (c: ClientRecord) => string]] : []),
  ];
  const exportCsv = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [EXP_COLS.map((c) => c[0]), ...list.map((c) => EXP_COLS.map(([, f]) => f(c)))].map((r) => r.map(esc).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `registro-${(title || 'clienti').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const exportPdf = () => {
    const esc = (v: string) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const w = window.open('', '_blank');
    if (!w) return;
    const head = EXP_COLS.map((c) => `<th>${esc(c[0])}</th>`).join('');
    const body = list.map((c) => `<tr>${EXP_COLS.map(([, f]) => `<td>${esc(f(c))}</td>`).join('')}</tr>`).join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || 'Registro clienti')}</title>
      <style>body{font-family:Inter,Arial,sans-serif;color:#161616;padding:24px}h1{font-size:18px;margin:0 0 4px}p{color:#888;font-size:12px;margin:0 0 16px}
      table{border-collapse:collapse;width:100%;font-size:10.5px}th,td{border:1px solid #ddd;padding:5px 7px;text-align:left}th{background:#f4f4f2;text-transform:uppercase;font-size:9px;letter-spacing:.04em}tr:nth-child(even) td{background:#fafafa}</style></head>
      <body><h1>${esc(title || 'Registro clienti')}</h1><p>${list.length} contatti · ${new Date().toLocaleDateString('it-IT')}</p>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      <script>window.onload=function(){window.print();}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[560px]">
      {/* ===== LISTA (master) ===== */}
      <div className="lg:w-[40%] xl:w-[34%] flex flex-col bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-[#f0f0f0] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-[14px] font-extrabold text-[#161616]"><Users className="w-4.5 h-4.5" /> {title || 'Registro Unico'} <span className="text-[#b0b0b0] font-bold">({list.length})</span></h3>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button onClick={exportCsv} title="Esporta CSV (filtri applicati)" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Download className="w-3.5 h-3.5" /> CSV</button>
              <button onClick={exportPdf} title="Esporta PDF / stampa (filtri applicati)" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><FileDown className="w-3.5 h-3.5" /> PDF</button>
              {onImport && <button onClick={onImport} title="Importa da CSV (registro clienti)" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Upload className="w-3.5 h-3.5" /> Importa</button>}
              <button onClick={onNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none"><Plus className="w-3.5 h-3.5" /> Nuovo</button>
            </div>
          </div>
          {/* Ricerca */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca nome, azienda, email, codice…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616]" />
          </div>
          {/* Filtri compatti — differenziati clienti / fornitori */}
          <div className="flex items-center gap-2">
            {isFornitori ? (
              <div className="relative flex-1">
                <select value={minStars} onChange={(e) => setMinStars(Number(e.target.value))} className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl border border-[#e2e2e2] text-[12px] font-semibold text-[#333] bg-white outline-none focus:border-[#161616] cursor-pointer">
                  <option value={0}>Tutte le valutazioni</option>
                  <option value={4}>★★★★ e più</option>
                  <option value={3}>★★★ e più</option>
                  <option value={2}>★★ e più</option>
                  <option value={1}>★ e più</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="relative flex-1">
                <select value={soc} onChange={(e) => setSoc(e.target.value)} className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl border border-[#e2e2e2] text-[12px] font-semibold text-[#333] bg-white outline-none focus:border-[#161616] cursor-pointer">
                  <option value="all">Tutte le società</option>
                  {societies.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            {filterRoles.length > 0 && (
              <div className="relative flex-1">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl border border-[#e2e2e2] text-[12px] font-semibold text-[#333] bg-white outline-none focus:border-[#161616] cursor-pointer">
                  <option value="all">{isFornitori ? 'Tutte le categorie' : 'Tutti i tipi'}</option>
                  {filterRoles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
          {/* Indicatore società attiva (pallino colore) */}
          {soc !== 'all' && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#8a8a8a] font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ background: societies.find((s) => s.id === soc)?.color }} />
              Stai vedendo i contatti di {societies.find((s) => s.id === soc)?.label}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#f3f3f3] max-h-[520px]">
          {list.length === 0 ? (
            <div className="p-8 text-center text-[#9a9a9a] text-[13px]">Nessun contatto con i filtri correnti.</div>
          ) : list.map((c) => {
            const pay = paymentStatus(c);
            const isSel = selId === c.id;
            return (
              <div key={c.id} onClick={() => { setSelId(c.id); setDetTab('anagrafica'); }}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${isSel ? 'bg-[#fafafa] border-l-[3px] border-[#161616]' : 'hover:bg-[#fafafa]/60 border-l-[3px] border-transparent'}`}>
                <div className="relative pt-0.5">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#444] font-bold text-[12px] border border-[#ececec]">{(c.name || '?').slice(0, 2).toUpperCase()}</div>
                  <span title={pay.ok ? 'In regola coi pagamenti' : 'Morosità / saldo aperto'} className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${pay.ok ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[13.5px] font-bold text-[#161616] truncate">{c.name}</h4>
                    {onKeys(c.roles)[0] && <span className="text-[9px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">{roleLabel(onKeys(c.roles)[0])}</span>}
                  </div>
                  {c.companyName && <p className="text-[11.5px] text-[#8a8a8a] truncate mt-0.5 font-medium">{c.companyName}</p>}
                  {isFornitori && (() => { const avg = ratingAvg(c.partnerRating); return <div className="flex items-center gap-1.5 mt-1"><Stars value={avg} size={13} />{avg > 0 && <span className="text-[10.5px] font-bold text-[#8a8a8a]">{avg.toFixed(1)}</span>}</div>; })()}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {c.tier && <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${tierStyle(c.tier)}`}>Fascia {c.tier}</span>}
                    {c.acquisitionChannel && <span className="text-[9.5px] bg-gray-50 text-gray-500 border border-gray-100 px-1.5 py-0.5 rounded capitalize">{c.acquisitionChannel}</span>}
                    {c.privacyLiberatoria === false && <span className="text-[9.5px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> NO LIBERATORIA</span>}
                    {societies.filter((s) => c.societies?.[s.id]).slice(0, 3).map((s) => <span key={s.id} title={s.label} className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== DETTAGLIO (vista dedicata) ===== */}
      <div className="flex-1 bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm flex flex-col">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center text-[#9a9a9a] text-[13.5px]">Seleziona un contatto dalla lista.</div>
        ) : (() => {
          const pay = paymentStatus(sel);
          return (
            <>
              {/* Header */}
              <div className="p-5 border-b border-[#f0f0f0] bg-[#fafafa] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="h-13 w-13 min-w-[52px] h-[52px] rounded-full bg-[#161616] text-white flex items-center justify-center font-bold text-[16px]">{(sel.name || '?').slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[18px] font-black text-[#161616] leading-tight">{sel.name}</h2>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${pay.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{pay.ok ? '● Pagamenti ok' : '● Morosità'}</span>
                    </div>
                    {sel.companyName && <p className="text-[12.5px] text-[#8a8a8a] font-medium mt-0.5">{sel.companyName}</p>}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[9px] text-[#b0b0b0] font-bold uppercase tracking-wider mr-1">Società</span>
                      {societies.map((s) => {
                        const on = !!sel.societies?.[s.id];
                        return <span key={s.id} className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase" style={on ? { background: s.color, color: '#fff' } : { background: '#f0f0f0', color: '#c4c4c4' }}>{s.label}</span>;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onEdit(sel.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e2e2e2] hover:border-black text-[#333] text-[12.5px] font-bold cursor-pointer bg-white"><Edit2 className="w-4 h-4" /> Modifica</button>
                  <button onClick={() => onDelete(sel)} className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer bg-white"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* BANNER LIBERATORIA BLOCCANTE */}
              {sel.privacyLiberatoria === false && (
                <div className="bg-rose-600 text-white px-5 py-3 flex items-center gap-3 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-yellow-300 shrink-0" />
                  <div className="text-[12.5px]">
                    <p className="font-extrabold uppercase tracking-wider">Marketing: vietato pubblicare immagini/video</p>
                    <p className="text-rose-100 text-[11.5px]">La liberatoria privacy per immagini e video di cantiere NON è stata firmata.</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="border-b border-[#f0f0f0] px-5 flex items-center gap-5 overflow-x-auto">
                {([['anagrafica', 'Anagrafica & Target', FileText], ['brand', 'Asset del Brand', Share2], ['credenziali', 'Credenziali protette', Lock], ['storia', 'Memoria interazioni', Clock]] as const).map(([id, lbl, Icon]) => (
                  <button key={id} onClick={() => setDetTab(id)} className={`inline-flex items-center gap-2 py-3 text-[12.5px] font-bold border-b-2 whitespace-nowrap transition-all ${detTab === id ? 'border-[#161616] text-[#161616]' : 'border-transparent text-[#a8a8a8] hover:text-[#666]'}`}>
                    <Icon className="w-4 h-4" /> {lbl}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {detTab === 'anagrafica' && <AnagraficaPane sel={sel} pay={pay} societies={societies} roles={roles} onPatch={patch} projectsOf={projectsOf} memberName={memberName} isFornitori={isFornitori} />}
                {detTab === 'brand' && <BrandPane sel={sel} onSave={(b) => patch({ brandAsset: b })} />}
                {detTab === 'credenziali' && <CredenzialiPane sel={sel} pwShown={pwShown} setPwShown={setPwShown} onSave={(cr) => patch({ credentials: cr })} />}
                {detTab === 'storia' && <StoriaPane sel={sel} onSave={(it) => patch({ interactions: it })} />}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

// ---- ANAGRAFICA ----
const Info: React.FC<{ icon: any; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3"><Icon className="w-4 h-4 text-[#b0b0b0] mt-0.5" /><div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">{label}</p><div className="text-[13px] font-medium text-[#222]">{children}</div></div></div>
);
const Box: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-4 flex flex-col gap-3.5"><h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#666]">{title}</h4>{children}</div>
);
const AnagraficaPane: React.FC<{ sel: ClientRecord; pay: PayInfo; societies: Soc[]; roles: Role[]; onPatch: (c: Partial<ClientRecord>) => void; projectsOf?: (rec: ClientRecord) => ProjRef[]; memberName?: (uid: string) => string; isFornitori?: boolean }> = ({ sel, pay, roles, onPatch, projectsOf, memberName, isFornitori }) => {
  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.label || id;
  const onTogglePrivacy = (v: boolean) => onPatch({ privacyLiberatoria: v });
  const [ref, setRef] = React.useState(sel.codiceReferenza || '');
  const [refBy, setRefBy] = React.useState(sel.referredByCode || '');
  const [respNome, setRespNome] = React.useState(sel.responsabileNome || '');
  const [rifCom, setRifCom] = React.useState(sel.riferimentoComunicazione || '');
  React.useEffect(() => { setRef(sel.codiceReferenza || ''); setRefBy(sel.referredByCode || ''); setRespNome(sel.responsabileNome || ''); setRifCom(sel.riferimentoComunicazione || ''); }, [sel.id]);
  const projects = projectsOf ? projectsOf(sel) : [];
  // team di riferimento: responsabili rubrica + manager dei progetti collegati
  const teamUids = Array.from(new Set([...Object.keys(sel.responsabili || {}).filter((u) => sel.responsabili![u]), ...projects.map((p) => p.manager).filter(Boolean) as string[]]));
  const saveRef = () => { if ((sel.codiceReferenza || '') !== ref) onPatch({ codiceReferenza: ref || null }); };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box title="Contatti & recapiti">
          {sel.email && <Info icon={Mail} label="Email"><a href={`mailto:${sel.email}`} className="hover:underline">{sel.email}</a></Info>}
          {sel.phone && <Info icon={Phone} label="Telefono"><a href={`tel:${sel.phone}`} className="hover:underline">{sel.phone}</a></Info>}
          {sel.address && <Info icon={MapPin} label="Indirizzo">{sel.address}</Info>}
        </Box>
        <Box title="Profilazione strategica">
          <Info icon={FileText} label="CF / P.IVA"><span className="font-mono">{sel.partitaIva || sel.codiceFiscale || 'Non fornito'}</span></Info>
          {(sel.targetTags || []).length > 0 && <Info icon={Target} label="Target / categoria"><span className="inline-flex flex-wrap gap-1">{(sel.targetTags || []).map((t) => <span key={t} className="bg-white border border-[#e2e2e2] rounded px-2 py-0.5 text-[12px]">🎯 {t}</span>)}</span></Info>}
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">Fascia</p><div className="flex items-center gap-1.5 mt-1"><span className="h-6 w-6 rounded-full bg-[#161616] text-white text-[11px] font-bold flex items-center justify-center">{sel.tier || '—'}</span><span className="text-[12px] font-semibold text-[#555]">{sel.tier === 1 ? 'Alto valore' : sel.tier === 2 ? 'Medio' : sel.tier === 3 ? 'Standard' : ''}</span></div></div>
            <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">Canale</p><p className="text-[12px] font-bold uppercase text-[#555] mt-1.5">{sel.acquisitionChannel || '—'}</p></div>
          </div>
          <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Tipi di contatto</p><div className="flex flex-wrap gap-1">{onKeys(sel.roles).map((r) => <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{roleLabel(r)}</span>)}</div></div>
        </Box>
      </div>

      {/* Riferimenti & relazioni (codice referenza, progetti, team) */}
      <Box title="Riferimenti & relazioni">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1 inline-flex items-center gap-1"><Hash className="w-3 h-3" /> Codice referral (proprio)</p>
            <input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} onBlur={saveRef} placeholder="auto: nome+anno" className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] font-mono outline-none focus:border-[#161616] bg-white" />
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1 mt-2 inline-flex items-center gap-1">Portato da (referral)</p>
            <input value={refBy} onChange={(e) => setRefBy(e.target.value.toUpperCase())} onBlur={() => (sel.referredByCode || '') !== refBy && onPatch({ referredByCode: refBy || null })} placeholder="codice di chi ha segnalato" className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] font-mono outline-none focus:border-[#161616] bg-white" />
          </div>
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1 inline-flex items-center gap-1"><UserCog className="w-3 h-3" /> Team di riferimento</p>
            {teamUids.length === 0 ? <p className="text-[12px] text-[#9a9a9a] mt-1.5">Nessuno assegnato.</p> : (
              <div className="flex flex-wrap gap-1 mt-1">
                {teamUids.map((u) => <span key={u} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#e2e2e2] text-[#444]">{memberName ? memberName(u) : u}</span>)}
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1.5 inline-flex items-center gap-1"><FolderOpen className="w-3 h-3" /> Progetti collegati ({projects.length})</p>
          {projects.length === 0 ? <p className="text-[12px] text-[#9a9a9a]">Nessun progetto collegato a questo contatto.</p> : (
            <div className="flex flex-col gap-1.5">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <span className="text-[12.5px] font-medium text-[#161616] truncate inline-flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-[#b0b0b0]" /> {p.name}</span>
                  {p.status && <span className="text-[10px] font-bold text-[#8a8a8a] uppercase shrink-0">{p.status}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Box>

      {/* Pratica & registro (campi Registro Clienti, editabili inline) */}
      <Box title="Pratica & registro">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Stato</p>
            <select value={sel.stato || ''} onChange={(e) => onPatch({ stato: (e.target.value || null) as any })} className="w-full px-2.5 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616] bg-white cursor-pointer">
              <option value="">—</option><option value="attivo">Attivo</option><option value="chiuso">Chiuso</option>
            </select>
          </div>
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Preventivo</p>
            <select value={sel.preventivoStato || ''} onChange={(e) => onPatch({ preventivoStato: (e.target.value || null) as any })} className="w-full px-2.5 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616] bg-white cursor-pointer">
              <option value="">—</option><option value="firmato">Firmato</option><option value="non_firmato">Non firmato</option>
            </select>
          </div>
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Saldato</p>
            <button onClick={() => onPatch({ saldato: !(sel.saldato ?? false) })} className={`w-full px-2.5 py-2 rounded-lg text-[12.5px] font-bold border cursor-pointer ${sel.saldato ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-[#8a8a8a] border-[#e2e2e2]'}`}>{sel.saldato ? 'Sì' : 'No'}</button>
          </div>
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Data inizio</p>
            <input type="date" value={sel.dataInizio || ''} onChange={(e) => onPatch({ dataInizio: e.target.value || null })} className="w-full px-2.5 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616] bg-white" />
          </div>
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Data fine</p>
            <input type="date" value={sel.dataFine || ''} onChange={(e) => onPatch({ dataFine: e.target.value || null })} className="w-full px-2.5 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616] bg-white" />
          </div>
          <div>
            <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Responsabile</p>
            <input value={respNome} onChange={(e) => setRespNome(e.target.value)} onBlur={() => (sel.responsabileNome || '') !== respNome && onPatch({ responsabileNome: respNome || null })} className="w-full px-2.5 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616] bg-white" />
          </div>
        </div>
        <div>
          <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Riferimento comunicazione</p>
          <input value={rifCom} onChange={(e) => setRifCom(e.target.value)} onBlur={() => (sel.riferimentoComunicazione || '') !== rifCom && onPatch({ riferimentoComunicazione: rifCom || null })} className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616] bg-white" />
        </div>
      </Box>

      {/* Checklist amministrativa */}
      <Box title="Checklist amministrativa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#f0f0f0]">
            {pay.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />}
            <div><p className="text-[12px] font-bold text-[#444]">Regolarità pagamenti</p><p className={`text-[12px] ${pay.ok ? 'text-emerald-600 font-medium' : 'text-rose-600 font-extrabold'}`}>{pay.ok ? 'In regola' : `Saldo aperto € ${Math.round(pay.daIncassare).toLocaleString('it-IT')} — download bloccati`}</p></div>
          </div>
          <button onClick={() => onTogglePrivacy(!(sel.privacyLiberatoria ?? false))} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#f0f0f0] text-left cursor-pointer hover:border-[#cfcfcf]">
            {sel.privacyLiberatoria ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
            <div><p className="text-[12px] font-bold text-[#444]">Liberatoria privacy immagini</p><p className={`text-[12px] ${sel.privacyLiberatoria ? 'text-emerald-600 font-medium' : 'text-rose-500 font-extrabold'}`}>{sel.privacyLiberatoria ? 'Firmata' : 'NON firmata — clicca per segnare firmata'}</p></div>
          </button>
        </div>
      </Box>

      {/* Ranking & valutazione (solo fornitori/partner) */}
      {isFornitori && (() => {
        const rt = sel.partnerRating || {};
        const avg = ratingAvg(rt);
        const setCrit = (k: keyof NonNullable<ClientRecord['partnerRating']>, v: number) => onPatch({ partnerRating: { ...rt, [k]: (rt[k] === v ? 0 : v) } });
        return (
          <Box title="Ranking & valutazione">
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#f0f0f0]">
              <div>
                <p className="text-[12px] font-bold text-[#444]">Punteggio complessivo</p>
                <p className="text-[11px] text-[#8a8a8a]">Media dei criteri valutati</p>
              </div>
              <div className="flex items-center gap-2"><Stars value={avg} size={18} /><span className="text-[16px] font-black text-[#161616]">{avg ? avg.toFixed(1) : '—'}</span></div>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {RATING_CRITERIA.map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-[#444]">{label}</span>
                  <Stars value={rt[k] || 0} size={16} onSet={(v) => setCrit(k, v)} />
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-[#b0b0b0] leading-relaxed mt-1">Clic sulle stelle per valutare (riclicca sulla stessa per azzerare). Le imprese con punteggio più alto compaiono in cima al registro fornitori.</p>
          </Box>
        );
      })()}
    </div>
  );
};

// ---- BRAND ----
const BrandPane: React.FC<{ sel: ClientRecord; onSave: (b: BrandAsset) => void }> = ({ sel, onSave }) => {
  const [b, setB] = React.useState<BrandAsset>(sel.brandAsset || {});
  React.useEffect(() => { setB(sel.brandAsset || {}); }, [sel.id]);
  const Fld = (label: string, key: keyof BrandAsset, rows = 2) => (
    <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">{label}</p>
      <textarea value={(b[key] as string) || ''} onChange={(e) => setB((p) => ({ ...p, [key]: e.target.value }))} rows={rows} className="w-full p-2.5 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] resize-none" /></div>
  );
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Box title="Identità strategica del brand">
        {Fld('Obiettivi del cliente', 'obiettivi')}
        {Fld('Tono di voce', 'tonoVoce', 1)}
        {Fld('Target di riferimento', 'targetRiferimento', 1)}
        <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Asset grafici (uno per riga: nome o link)</p>
          <textarea value={(b.assetGrafici || []).join('\n')} onChange={(e) => setB((p) => ({ ...p, assetGrafici: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))} rows={3} className="w-full p-2.5 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] resize-none" /></div>
      </Box>
      <button onClick={() => onSave(b)} className="self-start px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva asset brand</button>
    </div>
  );
};

// ---- CREDENZIALI ----
const CredenzialiPane: React.FC<{ sel: ClientRecord; pwShown: Record<string, boolean>; setPwShown: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; onSave: (cr: ContactCredential[]) => void }> = ({ sel, pwShown, setPwShown, onSave }) => {
  const creds = sel.credentials || [];
  const [draft, setDraft] = React.useState<Partial<ContactCredential>>({});
  const add = () => {
    if (!draft.service) return;
    onSave([...creds, { id: `cr-${Date.now()}`, service: draft.service!, username: draft.username || null, password: draft.password || null, note: draft.note || null }]);
    setDraft({});
  };
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#666]">Credenziali & password</h4>
        <span className="inline-flex items-center gap-1 text-[10.5px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Riservato</span>
      </div>
      {creds.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a] py-2">Nessuna credenziale salvata.</p> : creds.map((c) => {
        const vis = pwShown[c.id];
        return (
          <div key={c.id} className="bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-3.5">
            <div className="flex items-center justify-between border-b border-[#eee] pb-2 mb-2">
              <span className="text-[12px] font-bold text-[#161616] uppercase tracking-wider">{c.service}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPwShown((p) => ({ ...p, [c.id]: !p[c.id] }))} className="p-1 rounded hover:bg-gray-200 text-[#666] cursor-pointer">{vis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                <button onClick={() => onSave(creds.filter((x) => x.id !== c.id))} className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div><p className="text-[9px] text-[#b0b0b0] font-bold uppercase">Username</p><p className="font-mono font-semibold text-[#444]">{c.username || '—'}</p></div>
              <div><p className="text-[9px] text-[#b0b0b0] font-bold uppercase">Password</p><p className="font-mono font-semibold text-[#444] tracking-wider">{vis ? (c.password || '—') : '••••••••••'}</p></div>
            </div>
            {c.note && <p className="text-[11px] text-[#9a9a9a] italic mt-2 pt-2 border-t border-[#eee]">{c.note}</p>}
          </div>
        );
      })}
      {/* aggiungi */}
      <div className="bg-white border border-dashed border-[#e2e2e2] rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={draft.service || ''} onChange={(e) => setDraft((d) => ({ ...d, service: e.target.value }))} placeholder="Servizio (es. Instagram)" className="px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none" />
        <input value={draft.username || ''} onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))} placeholder="Username" className="px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none" />
        <input value={draft.password || ''} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} placeholder="Password" className="px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none" />
        <input value={draft.note || ''} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} placeholder="Nota (facoltativa)" className="px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none" />
        <button onClick={add} disabled={!draft.service} className="sm:col-span-2 px-4 py-2 rounded-lg bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40">+ Aggiungi credenziale</button>
      </div>
    </div>
  );
};

// ---- STORIA / INTERAZIONI ----
const StoriaPane: React.FC<{ sel: ClientRecord; onSave: (it: ContactInteraction[]) => void }> = ({ sel, onSave }) => {
  const items = (sel.interactions || []).slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const [titolo, setTitolo] = React.useState('');
  const [descrizione, setDescrizione] = React.useState('');
  const [tipo, setTipo] = React.useState<ContactInteraction['tipo']>('riunione');
  const add = () => {
    if (!titolo.trim()) return;
    const it: ContactInteraction = { id: `int-${Date.now()}`, tipo, data: new Date().toISOString().slice(0, 10), titolo: titolo.trim(), descrizione: descrizione || null };
    onSave([it, ...(sel.interactions || [])]);
    setTitolo(''); setDescrizione(''); setTipo('riunione');
  };
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-4 flex flex-col gap-2.5">
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#666]">Nuova interazione</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Titolo (riunione, evento…)" className="px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none bg-white" />
          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none bg-white">
            <option value="riunione">Riunione / Nota</option><option value="evento">Partecipazione evento</option><option value="campagna">Campagna marketing</option><option value="regalo">Pensiero / Gadget</option>
          </select>
        </div>
        <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Sintesi / decisioni / dettagli…" rows={2} className="w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[12.5px] outline-none bg-white resize-none" />
        <button onClick={add} disabled={!titolo.trim()} className="self-end px-4 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40">Salva appunto</button>
      </div>

      {items.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a]">Nessuna interazione registrata.</p> : (
        <div className="flex flex-col gap-2">
          {items.map((it) => {
            const Icon = INT_ICON[it.tipo] || FileText;
            return (
              <div key={it.id} className="flex items-start gap-3 bg-white border border-[#f0f0f0] rounded-xl p-3">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#555] shrink-0"><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[13px] text-[#161616] truncate">{it.titolo}</b>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold uppercase text-[#9a9a9a]">{INT_LABEL[it.tipo]}</span>
                      <button onClick={() => onSave((sel.interactions || []).filter((x) => x.id !== it.id))} className="text-rose-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {it.descrizione && <p className="text-[12px] text-[#666] mt-0.5 leading-relaxed">{it.descrizione}</p>}
                  <span className="text-[10.5px] text-[#b0b0b0]">{fmtDate(it.data)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CrmRegistro;
