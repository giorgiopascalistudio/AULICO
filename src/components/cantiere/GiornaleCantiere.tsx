/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GiornaleCantiere — Giornale di cantiere con calendario mensile.
 * Modellato sul giornale dei lavori D.M. 49/2018 (art. 14): per ogni giornata si
 * registrano lavorazioni, manodopera (qualifica+numero), mezzi, meteo, materiali
 * ed eventi/annotazioni (visite, ordini di servizio, sospensioni, infortuni).
 *  - studio (DL): compila voci ufficiali (auto-approvate) e approva i rapportini.
 *  - impresa partner: invia rapportini giornalieri (status 'inviato').
 * Il calendario evidenzia i giorni compilati; cliccando un giorno si vedono le
 * voci + le registrazioni collegate (presenze, materiali, foto di quella data).
 */
import React, { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Trash2, Pencil, CloudSun,
  Users, Truck, ImageIcon, Boxes, Clock, BookOpen
} from 'lucide-react';
import { Cantiere, Rapportino, RapportinoManodopera, Presenza, CantiereFoto, CantiereMateriale } from '../../types';
import { DOW, isoDate, todayISO, addDays, startOfMonth, startOfWeek, fmtMonthYear, fmtDayLong, parseISO, fmtDay, safeUrl } from '../../utils';
import { DriveUploader } from './DriveUploader';

const newId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 900)}`;

const METEO_OPTS = ['Sereno', 'Variabile', 'Nuvoloso', 'Pioggia', 'Temporale', 'Vento', 'Neve'];
const QUALIFICHE = ['Operaio comune', 'Operaio qualificato', 'Operaio specializzato', 'Capo squadra', 'Capo cantiere', 'Tecnico'];

const STATUS_PILL: Record<Rapportino['status'], string> = {
  approvato: 'bg-emerald-50 text-emerald-700',
  inviato: 'bg-amber-50 text-amber-700',
  rifiutato: 'bg-rose-50 text-rose-700'
};
const STATUS_DOT: Record<Rapportino['status'], string> = {
  approvato: 'bg-emerald-500',
  inviato: 'bg-amber-500',
  rifiutato: 'bg-rose-500'
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export interface GiornaleCantiereProps {
  cantiere: Cantiere;
  isStudio: boolean;
  canWrite: boolean;
  myUid: string;
  myName: string;
  myRole: string;
  folderName: string;
  rapportini: Rapportino[];
  presenze: Presenza[];
  foto: CantiereFoto[];
  materiali: CantiereMateriale[];
  saveEntity: (coll: string, item: any) => void;
  delEntity: (coll: string, id: string) => void;
  onApprove?: (id: string, approve: boolean) => void;
}

type ManoRow = { qualifica: string; n: string };

export const GiornaleCantiere: React.FC<GiornaleCantiereProps> = (p) => {
  const { isStudio, canWrite, myUid, myName, folderName } = p;

  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [selDay, setSelDay] = useState<string>(todayISO());

  // -------- form (compila/modifica voce) --------
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rapportino | null>(null);
  const [meteo, setMeteo] = useState('');
  const [tMin, setTMin] = useState('');
  const [tMax, setTMax] = useState('');
  const [ore, setOre] = useState('');
  const [mano, setMano] = useState<ManoRow[]>([]);
  const [mezzi, setMezzi] = useState('');
  const [desc, setDesc] = useState('');
  const [note, setNote] = useState('');
  const [fotoIds, setFotoIds] = useState<string[]>([]);

  const resetForm = () => {
    setEditing(null); setMeteo(''); setTMin(''); setTMax(''); setOre('');
    setMano([]); setMezzi(''); setDesc(''); setNote(''); setFotoIds([]);
  };
  const openNew = () => { resetForm(); setFormOpen(true); };
  const openEdit = (r: Rapportino) => {
    setEditing(r);
    setMeteo(r.meteo || '');
    setTMin(r.tempMin != null ? String(r.tempMin) : '');
    setTMax(r.tempMax != null ? String(r.tempMax) : '');
    setOre(r.ore != null ? String(r.ore) : '');
    setMano((r.manodopera || []).map((m) => ({ qualifica: m.qualifica, n: String(m.n) })));
    setMezzi(r.mezzi || '');
    setDesc(r.descrizione || '');
    setNote(r.annotazioni || '');
    setFotoIds(r.fotoIds || []);
    setFormOpen(true);
  };

  const num = (s: string): number | null => {
    if (!s.trim()) return null;
    const v = parseFloat(s.replace(',', '.'));
    return isNaN(v) ? null : v;
  };

  const save = () => {
    if (!desc.trim()) return;
    const manodopera: RapportinoManodopera[] = mano
      .filter((m) => m.qualifica.trim() && parseInt(m.n, 10) > 0)
      .map((m) => ({ qualifica: m.qualifica.trim(), n: parseInt(m.n, 10) }));
    const r: Rapportino = {
      id: editing?.id || newId('rap'),
      date: selDay,
      partnerUid: myUid,
      partnerName: myName,
      authorRole: isStudio ? 'studio' : 'impresa',
      meteo: meteo || null,
      tempMin: num(tMin),
      tempMax: num(tMax),
      ore: num(ore),
      manodopera: manodopera.length ? manodopera : undefined,
      mezzi: mezzi.trim() || null,
      descrizione: desc.trim(),
      annotazioni: note.trim() || null,
      fotoIds: fotoIds.length ? fotoIds : undefined,
      // lo studio (DL) firma la propria voce; l'impresa (ri)invia per approvazione
      status: isStudio ? 'approvato' : 'inviato',
      ...(isStudio ? { approvedBy: myUid } : {}),
      at: editing?.at || Date.now()
    };
    p.saveEntity('cantiereRapportini', r);
    resetForm();
    setFormOpen(false);
  };

  // -------- indici per data --------
  const entriesBy = useMemo(() => {
    const m: Record<string, Rapportino[]> = {};
    p.rapportini.forEach((r) => { (m[r.date] = m[r.date] || []).push(r); });
    Object.values(m).forEach((l) => l.sort((a, b) => a.at - b.at));
    return m;
  }, [p.rapportini]);
  const presBy = useMemo(() => {
    const m: Record<string, Presenza[]> = {};
    p.presenze.forEach((x) => { (m[x.date] = m[x.date] || []).push(x); });
    return m;
  }, [p.presenze]);
  const matBy = useMemo(() => {
    const m: Record<string, CantiereMateriale[]> = {};
    p.materiali.forEach((x) => { (m[x.date] = m[x.date] || []).push(x); });
    return m;
  }, [p.materiali]);
  const fotoBy = useMemo(() => {
    const m: Record<string, CantiereFoto[]> = {};
    p.foto.forEach((x) => { const d = isoDate(new Date(x.at)); (m[d] = m[d] || []).push(x); });
    return m;
  }, [p.foto]);

  // -------- calendario --------
  const gridStart = startOfWeek(startOfMonth(month));
  const cells = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));
  const today = todayISO();

  const monthEntries = p.rapportini.filter((r) => {
    const d = parseISO(r.date);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });
  const monthDays = new Set(monthEntries.map((r) => r.date)).size;
  const monthPending = monthEntries.filter((r) => r.status === 'inviato').length;
  const monthOre = monthEntries.reduce((s, r) => s + (r.ore || 0), 0);

  const dayEntries = entriesBy[selDay] || [];
  const dayPres = presBy[selDay] || [];
  const dayMat = matBy[selDay] || [];
  const dayFoto = fotoBy[selDay] || [];
  const hasLinked = dayPres.length > 0 || dayMat.length > 0 || dayFoto.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* header mese */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMonth(startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)))} className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[#e2e2e2] hover:bg-[#fafafa]"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-[14px] font-extrabold text-[#161616] min-w-[140px] text-center">{cap(fmtMonthYear(month))}</span>
          <button onClick={() => setMonth(startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)))} className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[#e2e2e2] hover:bg-[#fafafa]"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => { setMonth(startOfMonth(new Date())); setSelDay(todayISO()); }} className="ml-1 px-3 py-1.5 rounded-xl border border-[#e2e2e2] text-[12px] font-bold hover:bg-[#fafafa]">Oggi</button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-full bg-[#f3f3f3] text-[#6b6b6b]">{monthDays} {monthDays === 1 ? 'giorno compilato' : 'giorni compilati'}</span>
          {monthOre > 0 && <span className="px-2.5 py-1 rounded-full bg-[#f3f3f3] text-[#6b6b6b]">{monthOre}h registrate</span>}
          {monthPending > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">{monthPending} da approvare</span>}
        </div>
      </div>

      {/* griglia mese */}
      <div className="border border-[#e2e2e2] rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#ececec] bg-[#fbfbfb]">
          {DOW.map((d) => (
            <div key={d} className="py-2 text-[10px] font-bold text-[#8a8a8a] tracking-widest uppercase text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-[#ececec] gap-[1px]">
          {cells.map((c, i) => {
            const iso = isoDate(c);
            const inMonth = c.getMonth() === month.getMonth();
            const isToday = iso === today;
            const isSel = iso === selDay;
            const entries = entriesBy[iso] || [];
            const linked = (presBy[iso]?.length || 0) + (matBy[iso]?.length || 0) + (fotoBy[iso]?.length || 0);
            return (
              <button
                key={i}
                onClick={() => { setSelDay(iso); if (!inMonth) setMonth(startOfMonth(c)); }}
                className={`relative flex flex-col items-start gap-1 p-1.5 min-h-[46px] md:min-h-[60px] text-left transition-colors ${isSel ? 'bg-[#f5f5f3]' : 'bg-white hover:bg-[#fafafa]'} ${!inMonth ? 'opacity-45' : ''}`}
              >
                <span className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[11px] font-bold ${isToday ? 'bg-[#161616] text-white' : isSel ? 'bg-[#e2e2e2] text-[#161616]' : 'text-[#6b6b6b]'}`}>
                  {c.getDate()}
                </span>
                {(entries.length > 0 || linked > 0) && (
                  <span className="flex items-center gap-[3px] pl-0.5">
                    {entries.slice(0, 4).map((e) => (
                      <span key={e.id} className={`w-[7px] h-[7px] rounded-full ${STATUS_DOT[e.status]}`} />
                    ))}
                    {linked > 0 && <span className="w-[7px] h-[7px] rounded-full border-[1.5px] border-[#bdbdbd]" title="presenze / materiali / foto" />}
                  </span>
                )}
                {entries.length > 0 && (
                  <span className="hidden md:block text-[10px] text-[#9a9a9a] truncate w-full">
                    {entries.length === 1 ? '1 voce' : `${entries.length} voci`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* legenda */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-t border-[#ececec] bg-[#fbfbfb] text-[10.5px] text-[#9a9a9a]">
          <span className="inline-flex items-center gap-1"><span className="w-[7px] h-[7px] rounded-full bg-emerald-500" /> approvata</span>
          <span className="inline-flex items-center gap-1"><span className="w-[7px] h-[7px] rounded-full bg-amber-500" /> da approvare</span>
          <span className="inline-flex items-center gap-1"><span className="w-[7px] h-[7px] rounded-full bg-rose-500" /> rifiutata</span>
          <span className="inline-flex items-center gap-1"><span className="w-[7px] h-[7px] rounded-full border-[1.5px] border-[#bdbdbd]" /> presenze/materiali/foto</span>
        </div>
      </div>

      {/* giorno selezionato */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <h5 className="inline-flex items-center gap-2 text-[14px] font-extrabold text-[#161616]">
          <BookOpen className="w-4 h-4" /> {cap(fmtDayLong(parseISO(selDay)))}
        </h5>
        {canWrite && !formOpen && (
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161616] text-white text-[12px] font-bold">
            <Plus className="w-4 h-4" /> Compila giornale
          </button>
        )}
      </div>

      {/* form compilazione */}
      {formOpen && (
        <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-[#eee] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-extrabold text-[#161616]">
              {editing ? 'Modifica voce' : 'Nuova voce'} — {fmtDay(selDay)}
              {isStudio && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#161616] text-white font-bold">Direzione lavori</span>}
            </span>
            <button onClick={() => { resetForm(); setFormOpen(false); }} className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[#9a9a9a] hover:bg-[#f0f0f0]"><X className="w-4 h-4" /></button>
          </div>

          {/* meteo + ore */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#6b6b6b]">Meteo</label>
              <select value={meteo} onChange={(e) => setMeteo(e.target.value)} className="px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none bg-white w-36">
                <option value="">—</option>
                {METEO_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#6b6b6b]">T. min °C</label>
              <input value={tMin} onChange={(e) => setTMin(e.target.value)} inputMode="numeric" placeholder="—" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#6b6b6b]">T. max °C</label>
              <input value={tMax} onChange={(e) => setTMax(e.target.value)} inputMode="numeric" placeholder="—" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#6b6b6b]">Ore lavorate (tot.)</label>
              <input value={ore} onChange={(e) => setOre(e.target.value)} inputMode="decimal" placeholder="es. 8" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-28" />
            </div>
          </div>

          {/* manodopera */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#6b6b6b]">Manodopera impiegata (qualifica e numero)</label>
            {mano.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={m.qualifica}
                  onChange={(e) => setMano((l) => l.map((x, j) => (j === i ? { ...x, qualifica: e.target.value } : x)))}
                  list="giornale-qualifiche"
                  placeholder="Qualifica (es. Operaio specializzato)"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none"
                />
                <input
                  value={m.n}
                  onChange={(e) => setMano((l) => l.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))}
                  inputMode="numeric"
                  placeholder="N."
                  className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none w-16"
                />
                <button onClick={() => setMano((l) => l.filter((_, j) => j !== i))} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <datalist id="giornale-qualifiche">
              {QUALIFICHE.map((q) => <option key={q} value={q} />)}
            </datalist>
            <button onClick={() => setMano((l) => [...l, { qualifica: '', n: '1' }])} className="self-start inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-[#cfcfcf] text-[11.5px] font-bold text-[#6b6b6b] hover:bg-white">
              <Plus className="w-3.5 h-3.5" /> Aggiungi qualifica
            </button>
          </div>

          {/* mezzi */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#6b6b6b]">Mezzi e attrezzature impiegate</label>
            <input value={mezzi} onChange={(e) => setMezzi(e.target.value)} placeholder="es. Gru, betoniera, ponteggio…" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none" />
          </div>

          {/* lavorazioni */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#6b6b6b]">Lavorazioni eseguite *</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Ordine, modo e attività con cui progrediscono le lavorazioni…" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none resize-none" />
          </div>

          {/* annotazioni / eventi */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#6b6b6b]">Annotazioni ed eventi</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Visite in cantiere, ordini di servizio, sospensioni/riprese, eventi infortunistici, varianti…" className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none resize-none" />
          </div>

          {/* foto */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#6b6b6b]">Foto della giornata {fotoIds.length > 0 && <span className="text-[#9a9a9a]">({fotoIds.length} allegate)</span>}</label>
            <DriveUploader folderName={folderName} onUploaded={(f) => {
              const photo: CantiereFoto = { id: newId('foto'), driveFileId: f.driveFileId || null, driveUrl: f.driveUrl || null, link: f.link || null, caption: `Giornale ${fmtDay(selDay)}`, by: myUid, role: p.myRole, at: Date.now() };
              p.saveEntity('cantiereFoto', photo);
              setFotoIds((arr) => [...arr, photo.id]);
            }} />
          </div>

          <button onClick={save} disabled={!desc.trim()} className="self-start px-4 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold disabled:opacity-40">
            {editing ? 'Salva modifiche' : 'Registra sul giornale'}
          </button>
        </div>
      )}

      {/* voci del giorno */}
      {dayEntries.length === 0 ? (
        <p className="text-[12.5px] italic text-[#9a9a9a] py-1">Nessuna voce di giornale per questa data.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {dayEntries.map((r) => {
            const mine = r.partnerUid === myUid;
            const isDL = r.authorRole === 'studio';
            return (
              <div key={r.id} className="p-3.5 rounded-2xl border border-[#eee]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-bold text-[#161616]">{r.partnerName || 'Autore'}</span>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold ${isDL ? 'bg-[#161616] text-white' : 'bg-orange-50 text-orange-700'}`}>{isDL ? 'Direzione lavori' : 'Impresa'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_PILL[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isStudio && r.status === 'inviato' && (
                      <>
                        <button onClick={() => p.onApprove?.(r.id, true)} title="Approva" className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700"><Check className="w-4 h-4" /></button>
                        <button onClick={() => p.onApprove?.(r.id, false)} title="Rifiuta" className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-700"><X className="w-4 h-4" /></button>
                      </>
                    )}
                    {mine && canWrite && (
                      <button onClick={() => openEdit(r)} title="Modifica" className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[#6b6b6b] hover:bg-[#f3f3f3]"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    {(isStudio || mine) && (
                      <button onClick={() => p.delEntity('cantiereRapportini', r.id)} title="Elimina" className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>

                {/* meta: meteo / ore / mezzi */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[#6b6b6b] mb-1.5">
                  {r.meteo && (
                    <span className="inline-flex items-center gap-1"><CloudSun className="w-3.5 h-3.5" /> {r.meteo}{(r.tempMin != null || r.tempMax != null) && ` · ${r.tempMin != null ? `${r.tempMin}°` : ''}${r.tempMin != null && r.tempMax != null ? '/' : ''}${r.tempMax != null ? `${r.tempMax}°` : ''}`}</span>
                  )}
                  {r.ore != null && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.ore}h</span>}
                  {r.mezzi && <span className="inline-flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {r.mezzi}</span>}
                  {r.fotoIds?.length ? <span className="inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> {r.fotoIds.length} foto</span> : null}
                </div>

                {/* manodopera */}
                {r.manodopera?.length ? (
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9a9a9a]" />
                    {r.manodopera.map((m, i) => (
                      <span key={i} className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#f3f3f3] text-[#6b6b6b] font-bold">{m.n}× {m.qualifica}</span>
                    ))}
                  </div>
                ) : null}

                <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a]">Lavorazioni</div>
                <p className="text-[12.5px] text-[#3a3a3a] whitespace-pre-wrap mt-0.5">{r.descrizione}</p>

                {r.annotazioni && (
                  <>
                    <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a] mt-2">Annotazioni ed eventi</div>
                    <p className="text-[12.5px] text-[#6b6b6b] whitespace-pre-wrap mt-0.5 italic">{r.annotazioni}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* registrazioni collegate alla data (da Presenze / Materiali / Foto) */}
      {hasLinked && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {dayPres.length > 0 && (
            <div className="p-3 rounded-2xl border border-[#eee] bg-[#fafafa]">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a] mb-1.5"><Clock className="w-3.5 h-3.5" /> Presenze ({dayPres.reduce((s, x) => s + (x.ore || 0), 0)}h)</div>
              <div className="flex flex-col gap-1">
                {dayPres.map((x) => (
                  <div key={x.id} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#161616]">{x.lavoratore}{x.mansione ? <span className="text-[#9a9a9a]"> · {x.mansione}</span> : null}</span>
                    <span className="font-bold text-[#161616]">{x.ore}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dayMat.length > 0 && (
            <div className="p-3 rounded-2xl border border-[#eee] bg-[#fafafa]">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a] mb-1.5"><Boxes className="w-3.5 h-3.5" /> Materiali</div>
              <div className="flex flex-col gap-1">
                {dayMat.map((x) => (
                  <div key={x.id} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#161616] truncate">{x.desc}</span>
                    <span className="text-[#9a9a9a] shrink-0 ml-2">{x.qty} {x.unit} · {x.tipo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dayFoto.length > 0 && (
            <div className="p-3 rounded-2xl border border-[#eee] bg-[#fafafa]">
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#9a9a9a] mb-1.5"><ImageIcon className="w-3.5 h-3.5" /> Foto ({dayFoto.length})</div>
              <div className="flex flex-col gap-1">
                {dayFoto.map((x) => (
                  <a key={x.id} href={safeUrl(x.driveUrl || x.link) || '#'} target="_blank" rel="noreferrer" className="text-[12px] text-[#161616] font-medium underline truncate">
                    {x.caption || 'Foto'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
