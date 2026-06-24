/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TrashView — Cestino condiviso (nodo trash/<id>).
 * Gli elementi eliminati da ogni sezione restano qui 60 giorni (purge automatico
 * in App), con ripristino al volo o eliminazione definitiva (doppia conferma).
 * Organizzato per società (Studio · Strategico · Materico · Unico · Generale),
 * poi per sezione di provenienza, con barra di ricerca.
 */
import React, { useMemo, useState } from 'react';
import { Trash2, RotateCcw, Clock, Search, X } from 'lucide-react';
import { TrashItem } from '../types';
import { COMPANY_COLOR, type Company } from '../finance';
import { TRASH_RETENTION_DAYS } from '../utils';

export { TRASH_RETENTION_DAYS };

/** Etichette leggibili delle sezioni di provenienza. */
const SECTION_LABEL: Record<string, string> = {
  progetti: 'Progetti',
  task: 'Agenda & Task',
  preventivi: 'Preventivi & Parcelle',
  fatture_attive: 'Fatture attive',
  fatture_passive: 'Fatture passive',
  scadenze: 'Scadenziario',
  movimenti: 'Movimenti',
  documenti: 'Documenti',
  arredi: 'Arredi & Moodboard',
  appuntamenti: 'Appuntamenti',
  materico: 'Richieste Materico',
  estimates: 'Preventivi Materico',
  rubrica: 'Rubrica clienti',
  crm_lead: 'CRM — Lead',
  crm_supplier: 'CRM — Fornitori',
  unico: 'Unico — Operazioni',
  cantieri: 'Cantieri',
  cantiere: 'Cantiere — voci',
  impresa: 'Area Impresa',
  ferie: 'Ferie & assenze'
};

export const sectionLabel = (s: string) => SECTION_LABEL[s] || s;

const COMPANIES: Company[] = ['studio', 'strategico', 'materico', 'unico'];
const COMPANY_LABEL: Record<string, string> = {
  studio: 'Studio',
  strategico: 'Strategico',
  materico: 'Materico',
  unico: 'Unico',
  altro: 'Generale'
};
const companyColor = (c: string) => (c === 'altro' ? '#8a8a8a' : COMPANY_COLOR[c as Company]);

const isCompany = (v: any): v is Company => typeof v === 'string' && (COMPANIES as string[]).includes(v);

/**
 * Determina la società di appartenenza di un elemento del cestino:
 * 1. campo division/sector nel payload (progetti, preventivi, fatture, cantieri…);
 * 2. sezione intrinsecamente legata a una società (Materico, Unico);
 * 3. risalita al progetto/cantiere di origine (task, documenti, arredi, voci cantiere);
 * 4. altrimenti "Generale" (rubrica, CRM, ferie, appuntamenti…).
 */
const companyOf = (
  t: TrashItem,
  projects?: Record<string, { division?: string }>,
  cantieri?: Record<string, { division?: string }>
): Company | 'altro' => {
  const p: any = t.payload || {};
  if (isCompany(p.division)) return p.division;
  if (isCompany(p.sector)) return p.sector;
  if (t.section === 'materico' || t.section === 'estimates') return 'materico';
  if (t.section === 'unico') return 'unico';
  const pid = p.projectId || t.meta?.pid;
  const fromProj = pid && projects?.[pid]?.division;
  if (isCompany(fromProj)) return fromProj;
  const cid = p.cantiereId || t.meta?.cid;
  const fromCant = cid && cantieri?.[cid]?.division;
  if (isCompany(fromCant)) return fromCant;
  return 'altro';
};

const fmtWhen = (t: number) =>
  new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

const daysLeft = (deletedAt: number) =>
  Math.max(0, TRASH_RETENTION_DAYS - Math.floor((Date.now() - deletedAt) / 86400000));

interface TrashViewProps {
  trash: Record<string, TrashItem>;
  onRestore: (item: TrashItem) => void;
  onDeleteForever: (item: TrashItem) => void;
  /** Mappe live per risalire alla società di task/documenti/voci cantiere. */
  projects?: Record<string, { division?: string }>;
  cantieri?: Record<string, { division?: string }>;
}

export const TrashView: React.FC<TrashViewProps> = ({ trash, onRestore, onDeleteForever, projects, cantieri }) => {
  const [company, setCompany] = useState<string>('tutte');
  const [section, setSection] = useState<string>('tutti');
  const [query, setQuery] = useState('');

  const all = useMemo(
    () =>
      Object.values(trash)
        .map((t) => ({ ...t, _company: companyOf(t, projects, cantieri) }))
        .sort((a, b) => b.deletedAt - a.deletedAt),
    [trash, projects, cantieri]
  );

  // Conteggi per società (per i badge delle pillole)
  const companyCounts = useMemo(() => {
    const m: Record<string, number> = {};
    all.forEach((t) => { m[t._company] = (m[t._company] || 0) + 1; });
    return m;
  }, [all]);

  const byCompany = company === 'tutte' ? all : all.filter((t) => t._company === company);

  // Sezioni disponibili nella società selezionata
  const sections = useMemo(() => Array.from(new Set(byCompany.map((t) => t.section))), [byCompany]);
  const effSection = sections.includes(section) ? section : 'tutti';

  const q = query.trim().toLowerCase();
  const list = byCompany.filter((t) => {
    if (effSection !== 'tutti' && t.section !== effSection) return false;
    if (!q) return true;
    return [t.label, t.detail, sectionLabel(t.section), t.deletedByName, COMPANY_LABEL[t._company]]
      .some((v) => (v || '').toLowerCase().includes(q));
  });

  // Raggruppa per sezione quando non c'è un filtro sezione attivo
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    list.forEach((t) => {
      const arr = m.get(t.section) || [];
      arr.push(t);
      m.set(t.section, arr);
    });
    return Array.from(m.entries());
  }, [list]);

  const companyTabs = ['tutte', ...COMPANIES.filter((c) => companyCounts[c]), ...(companyCounts['altro'] ? ['altro'] : [])];

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Cestino
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">
            Gli elementi eliminati restano qui {TRASH_RETENTION_DAYS} giorni, poi vengono rimossi definitivamente in automatico.
          </p>
        </div>
        <span className="text-[11px] font-extrabold text-[#161616] bg-[#f0f0f0] border border-[#e2e2e2] px-3 py-1.5 rounded-full">
          {all.length} {all.length === 1 ? 'elemento' : 'elementi'}
        </span>
      </div>

      {/* Barra di ricerca */}
      <div className="relative w-full sm:max-w-[380px]">
        <Search className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca nel cestino (nome, sezione, chi ha eliminato…)"
          className="w-full bg-white border border-[#e2e2e2] rounded-full pl-10 pr-9 py-2.5 text-[13px] font-semibold text-[#161616] placeholder:text-[#b0b0b0] outline-none focus:border-[#161616] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#f0f0f0] hover:bg-[#e2e2e2] flex items-center justify-center text-[#8a8a8a] cursor-pointer border-none"
            title="Pulisci ricerca"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Barra società (colori settore) */}
      {all.length > 0 && (
        <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap w-fit max-w-full">
          {companyTabs.map((c) => {
            const active = company === c;
            const count = c === 'tutte' ? all.length : companyCounts[c] || 0;
            return (
              <button
                key={c}
                onClick={() => { setCompany(c); setSection('tutti'); }}
                className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all whitespace-nowrap ${
                  active ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'
                }`}
              >
                {c !== 'tutte' && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: companyColor(c) }} />
                )}
                {c === 'tutte' ? 'Tutte' : COMPANY_LABEL[c]}
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-[#e2e2e2] text-[#6b6b6b]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Barra sezioni (dentro la società selezionata) */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {['tutti', ...sections].map((s) => {
            const active = effSection === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap border ${
                  active
                    ? 'bg-[#161616] text-white border-[#161616] font-extrabold'
                    : 'text-[#6b6b6b] bg-white border-[#e2e2e2] hover:text-[#161616] hover:border-[#c9c9c9]'
                }`}
              >
                {s === 'tutti' ? 'Tutte le sezioni' : sectionLabel(s)}
              </button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">
            {q ? `Nessun risultato per “${query.trim()}”.` : 'Il cestino è vuoto.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([sec, items]) => (
            <div key={sec} className="flex flex-col gap-2.5">
              {/* Intestazione sezione (solo quando si vedono più sezioni insieme) */}
              {effSection === 'tutti' && (
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-[#6b6b6b]">{sectionLabel(sec)}</h3>
                  <span className="text-[10px] font-extrabold bg-[#ececec] text-[#8a8a8a] px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
              )}
              {items.map((t) => {
                const left = daysLeft(t.deletedAt);
                return (
                  <div key={t.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                          style={{ background: companyColor(t._company) }}
                        >
                          {COMPANY_LABEL[t._company]}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#f0f0f0] text-[#6b6b6b] px-2 py-0.5 rounded-full">
                          {sectionLabel(t.section)}
                        </span>
                        <b className="text-[13.5px] font-extrabold text-[#161616] truncate">{t.label}</b>
                      </div>
                      <div className="text-[11.5px] text-[#8a8a8a] mt-1 flex items-center gap-2 flex-wrap">
                        <span>Eliminato il {fmtWhen(t.deletedAt)}{t.deletedByName ? ` da ${t.deletedByName}` : ''}</span>
                        {t.detail && <span>· {t.detail}</span>}
                        <span className={`inline-flex items-center gap-1 font-bold ${left <= 7 ? 'text-rose-600' : 'text-[#8a8a8a]'}`}>
                          <Clock className="w-3 h-3" /> {left === 0 ? 'in eliminazione' : `${left} ${left === 1 ? 'giorno' : 'giorni'} rimasti`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestore(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Ripristina
                      </button>
                      <button
                        onClick={() => onDeleteForever(t)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 cursor-pointer transition-colors"
                        title="Elimina definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
