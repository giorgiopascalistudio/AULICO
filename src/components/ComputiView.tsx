/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ComputiView — sezione "Computi" della Produzione di OGNI società (era placeholder).
 * Stesso nodo dei computi di Finanze (`finComputi`, array intero, admin/manager):
 * qui si vedono/gestiscono SOLO i computi dei progetti della società attiva
 * (un computo per progetto). Voci a mano o import CSV (parser di finance.ts,
 * stessa mappatura colonne del tab Computi di FinanzeView).
 */
import React from 'react';
import {
  Calculator, Plus, ArrowLeft, Trash2, Printer, UploadCloud, FileText, X, Search,
} from 'lucide-react';
import type { Project } from '../types';
import {
  Computo, ComputoItem, computoTotal,
  guessMapping, rowsToComputoItems, ColumnMapping, ParsedSheet,
} from '../finance';
import { watchNode, writeNode } from '../firebase';
import { eur } from '../utils';
import { readTabularFile, type ExportColumn } from '../dataIO';
import ExportMenu from './ExportMenu';

const CATEGORIES = ['Demolizioni', 'Murature', 'Impianti', 'Finiture', 'Allestimenti', 'Strategia', 'Altro'];

/** Colonne export (Excel/PDF) delle voci di un computo. */
const COMPUTO_EXPORT_COLS: ExportColumn<ComputoItem>[] = [
  { header: 'Categoria', value: (r) => r.category || 'Altro', width: 18 },
  { header: 'Descrizione', value: (r) => r.desc, width: 44 },
  { header: 'Q.tà', value: (r) => r.quantity, type: 'number', width: 10 },
  { header: 'Prezzo unit.', value: (r) => r.unitPrice, type: 'currency', width: 14 },
  { header: 'Importo', value: (r) => (r.quantity || 0) * (r.unitPrice || 0), type: 'currency', width: 14 },
];
const inp = 'px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const toArr = (v: any): any[] => (Array.isArray(v) ? v.filter(Boolean) : v ? Object.values(v) : []);

interface Props {
  /** Progetti della SOCIETÀ attiva (già filtrati per division da App). */
  projects: Project[];
  socLabel: string;
  color?: string;
  canEdit?: boolean;
  askDelete?: (title: string, message: string | null, onConfirm: () => void) => void;
  /** Cestino condiviso (sezione 'computo'): copia di sicurezza prima dell'eliminazione. */
  onTrashItem?: (section: string, label: string, payload: any, meta?: string, detail?: string) => void;
}

export const ComputiView: React.FC<Props> = ({ projects, socLabel, color = '#161616', canEdit = false, askDelete, onTrashItem }) => {
  // Nodo intero come FinanzeView (normalizza items: Firebase non salva gli array vuoti).
  const [all, setAll] = React.useState<Computo[]>([]);
  React.useEffect(() => watchNode('finComputi', (v) => setAll(
    toArr(v).map((c: any) => ({ ...c, items: Array.isArray(c.items) ? c.items : c.items ? Object.values(c.items) : [] }))
  ), () => {}), []);
  const saveAll = (arr: Computo[]) => {
    setAll(arr);
    writeNode('finComputi', arr).catch(() => {});
  };

  const projById = React.useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const mine = all.filter((c) => projById[c.projectId]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const open = mine.find((c) => c.id === openId) || null;

  const withoutComputo = projects.filter((p) => !all.some((c) => c.projectId === p.id));
  const totValue = mine.reduce((s, c) => s + computoTotal(c), 0);
  const totVoci = mine.reduce((s, c) => s + (c.items || []).length, 0);

  const createFor = (pid: string) => {
    const p = projById[pid];
    if (!p || all.some((c) => c.projectId === pid)) return;
    const nc: Computo = { id: `cp-${Date.now()}`, projectId: pid, title: `Computo Metrico — ${p.name}`, items: [] };
    saveAll([...all, nc]);
    setOpenId(nc.id);
  };
  const updateComputo = (id: string, patch: Partial<Computo>) => saveAll(all.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const deleteComputo = (c: Computo) => {
    const doIt = () => {
      onTrashItem?.('computo', c.title || 'Computo metrico', c, undefined, projById[c.projectId]?.name);
      saveAll(all.filter((x) => x.id !== c.id));
      setOpenId(null);
    };
    if (askDelete) askDelete('Eliminare questo computo metrico?', `"${c.title}" (${(c.items || []).length} voci) finirà nel Cestino.`, doIt);
    else if (window.confirm('Eliminare questo computo?')) doIt();
  };

  if (open) {
    return (
      <ComputoEditor
        computo={open}
        projectName={projById[open.projectId]?.name || '—'}
        color={color}
        canEdit={canEdit}
        askDelete={askDelete}
        onChange={(patch) => updateComputo(open.id, patch)}
        onDelete={() => deleteComputo(open)}
        onBack={() => setOpenId(null)}
      />
    );
  }

  const list = mine
    .filter((c) => { const t = q.trim().toLowerCase(); return !t || `${c.title} ${projById[c.projectId]?.name || ''}`.toLowerCase().includes(t); })
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
            <Calculator className="w-5.5 h-5.5" style={{ color }} /> Computi metrici
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">
            Un computo per ogni progetto di {socLabel}: voci a mano o importate da CSV. Il valore opera alimenta parcelle e contabilità di commessa.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { l: 'Computi', v: String(mine.length) },
            { l: 'Valore opere', v: eur(totValue) },
            { l: 'Voci', v: String(totVoci) },
            { l: 'Progetti senza computo', v: String(withoutComputo.length), c: withoutComputo.length ? '#b45309' : undefined },
          ].map((k) => (
            <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[16px] px-3.5 py-2 shadow-sm text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
              <p className="text-[17px] font-black leading-none mt-0.5" style={{ color: k.c || color }}>{k.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[340px]">
          <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca computo o progetto…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
        </div>
        {canEdit && withoutComputo.length > 0 && (
          <select value="" onChange={(e) => { if (e.target.value) createFor(e.target.value); e.currentTarget.value = ''; }} className={`${inp} w-auto font-bold cursor-pointer`} title="Crea il computo di un progetto che non ce l'ha">
            <option value="">+ Nuovo computo per…</option>
            {withoutComputo.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">
          {mine.length === 0 ? `Nessun computo per i progetti di ${socLabel}.${canEdit && withoutComputo.length ? ' Creane uno con "+ Nuovo computo per…".' : ''}` : 'Nessun computo corrisponde alla ricerca.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((c) => (
            <button key={c.id} onClick={() => setOpenId(c.id)} className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <b className="text-[14px] text-[#161616] block truncate">{c.title}</b>
              <p className="text-[11.5px] text-[#8a8a8a] mt-0.5 truncate">{projById[c.projectId]?.name || '—'}</p>
              <p className="text-[18px] font-black mt-2" style={{ color }}>{eur(computoTotal(c))}</p>
              <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-0.5">
                {(c.items || []).length} voci{c.sourceFileName ? ` · da ${c.sourceFileName}` : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- Editor */
const ComputoEditor: React.FC<{
  computo: Computo;
  projectName: string;
  color: string;
  canEdit: boolean;
  askDelete?: Props['askDelete'];
  onChange: (patch: Partial<Computo>) => void;
  onDelete: () => void;
  onBack: () => void;
}> = ({ computo: c, projectName, color, canEdit, askDelete, onChange, onDelete, onBack }) => {
  const items = c.items || [];
  const total = computoTotal(c);
  const fileRef = React.useRef<HTMLInputElement>(null);
  // Bozza nuova voce
  const [nDesc, setNDesc] = React.useState('');
  const [nCat, setNCat] = React.useState('Finiture');
  const [nQty, setNQty] = React.useState('');
  const [nPrice, setNPrice] = React.useState('');
  // Import CSV: mappatura colonne (stessa logica del tab Computi di FinanzeView)
  const [sheet, setSheet] = React.useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null);
  const [fileName, setFileName] = React.useState('');
  const [toast, setToast] = React.useState('');
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3500); };

  const updItem = (id: string, patch: Partial<ComputoItem>) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const delItem = (it: ComputoItem) => {
    const doIt = () => onChange({ items: items.filter((x) => x.id !== it.id) });
    if (askDelete) askDelete('Eliminare la riga del computo?', `"${it.desc}" verrà rimossa.`, doIt);
    else doIt();
  };
  const addItem = () => {
    if (!nDesc.trim()) return;
    const it: ComputoItem = {
      id: `ci-${Date.now().toString(36)}`, desc: nDesc.trim(), category: nCat,
      quantity: Number(String(nQty).replace(',', '.')) || 1, unitPrice: Number(String(nPrice).replace(',', '.')) || 0,
    };
    onChange({ items: [...items, it] });
    setNDesc(''); setNQty(''); setNPrice('');
  };

  const onFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf')) {
      // PDF: solo allegato di riferimento (non è un formato dati affidabile).
      onChange({ sourceFileName: file.name });
      say('PDF allegato come riferimento. Per estrarre le voci carica un Excel o un CSV.');
      return;
    }
    try {
      const grid = await readTabularFile(file); // .xlsx/.xls o .csv/.tsv/.txt → griglia
      if (grid.length === 0) { say('File vuoto o non leggibile.'); return; }
      const s: ParsedSheet = { headers: grid[0] || [], rows: grid.slice(1) };
      if (s.headers.length === 0) { say('File vuoto o non leggibile.'); return; }
      setSheet(s); setMapping(guessMapping(s.headers)); setFileName(file.name);
    } catch (e) { console.error(e); say('Errore nella lettura del file.'); }
  };
  const confirmImport = () => {
    if (!sheet || !mapping) return;
    const nuovi = rowsToComputoItems(sheet.rows, mapping);
    if (nuovi.length === 0) { say('Nessuna riga valida: controlla la mappatura colonne.'); return; }
    onChange({ items: [...items, ...nuovi], sourceFileName: fileName || c.sourceFileName });
    setSheet(null); setMapping(null); setFileName('');
    say(`Importate ${nuovi.length} voci dal file.`);
  };

  // Voci raggruppate per categoria (lettura più comoda + stampa)
  const cats = [...new Set(items.map((it) => it.category || 'Altro'))];

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0"><ArrowLeft className="w-4 h-4" /></button>
          <div className="min-w-0 flex-1">
            <input disabled={!canEdit} value={c.title} onChange={(e) => onChange({ title: e.target.value })} className="w-full text-[20px] font-black tracking-tight text-[#161616] bg-transparent border-none outline-none p-0" />
            <p className="text-[11.5px] text-[#8a8a8a] font-semibold truncate">{projectName}{c.sourceFileName ? ` · file: ${c.sourceFileName}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer"><UploadCloud className="w-4 h-4" /> Importa Excel/CSV</button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ''; }} />
            </>
          )}
          <ExportMenu
            filename={`Computo_${c.title || projectName}`}
            title={`Computo — ${c.title || projectName}`}
            subtitle={projectName}
            columns={COMPUTO_EXPORT_COLS}
            rows={items}
            footer={[{ label: 'TOTALE opere', value: eur(computoTotal(c)) }]}
          />
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer"><Printer className="w-4 h-4" /> Stampa</button>
          {canEdit && <button onClick={onDelete} className="p-2 rounded-xl bg-white border border-[#e2e2e2] hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>

      {toast && <p className="no-print text-[12px] font-bold text-[#161616] bg-[#f5f5f3] border border-[#e2e2e2] rounded-xl px-3 py-2">{toast}</p>}

      <div className="print-area grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <p className="hidden print:block text-[16px] font-black">{c.title} — {projectName}</p>
          {items.length === 0 ? (
            <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna voce. Aggiungila qui sotto o importa un CSV.</p>
          ) : cats.map((cat) => (
            <div key={cat} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">{cat}</p>
                <p className="text-[11.5px] font-extrabold" style={{ color }}>{eur(items.filter((it) => (it.category || 'Altro') === cat).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0))}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {items.filter((it) => (it.category || 'Altro') === cat).map((it) => (
                  <div key={it.id} className="flex items-center gap-2 flex-wrap">
                    <input disabled={!canEdit} value={it.desc} onChange={(e) => updItem(it.id, { desc: e.target.value })} className={`${inp} flex-1 min-w-[180px]`} />
                    <input disabled={!canEdit} type="number" value={it.quantity || ''} placeholder="q.tà" onChange={(e) => updItem(it.id, { quantity: Number(e.target.value) || 0 })} className={`${inp} w-[84px] text-right`} title="Quantità" />
                    <input disabled={!canEdit} type="number" value={it.unitPrice || ''} placeholder="€/u" onChange={(e) => updItem(it.id, { unitPrice: Number(e.target.value) || 0 })} className={`${inp} w-[100px] text-right`} title="Prezzo unitario €" />
                    <span className="text-[12.5px] font-extrabold text-[#161616] min-w-[92px] text-right">{eur((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}</span>
                    {canEdit && <button onClick={() => delItem(it)} className="no-print w-7 h-7 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Nuova voce */}
          {canEdit && (
            <div className="no-print bg-white border border-dashed border-[#cfcfcf] rounded-[20px] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Nuova voce</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input value={nDesc} onChange={(e) => setNDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="Descrizione lavorazione…" className={`${inp} flex-1 min-w-[180px]`} />
                <select value={nCat} onChange={(e) => setNCat(e.target.value)} className={`${inp} w-[130px]`}>
                  {CATEGORIES.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <input value={nQty} onChange={(e) => setNQty(e.target.value)} inputMode="decimal" placeholder="q.tà" className={`${inp} w-[84px] text-right`} />
                <input value={nPrice} onChange={(e) => setNPrice(e.target.value)} inputMode="decimal" placeholder="€/u" className={`${inp} w-[100px] text-right`} />
                <button onClick={addItem} disabled={!nDesc.trim()} className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40"><Plus className="w-4 h-4" /> Aggiungi</button>
              </div>
            </div>
          )}
        </div>

        {/* Totale live */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border-2 rounded-[22px] p-5 lg:sticky lg:top-4" style={{ borderColor: color }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Valore opera (computo)</p>
            <p className="text-[32px] font-black leading-tight" style={{ color }}>{eur(total)}</p>
            <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-1.5">{items.length} voci · importi imponibili. Il valore alimenta parcella e contabilità di commessa.</p>
          </div>
          <div className="no-print bg-white border border-[#e2e2e2] rounded-[20px] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-1.5 inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Import da file</p>
            <p className="text-[11.5px] text-[#8a8a8a] leading-snug">CSV/TSV con intestazioni (descrizione, categoria, quantità, prezzo): mappatura colonne automatica e correggibile. Excel/PDF restano allegati come riferimento.</p>
          </div>
        </div>
      </div>

      {/* Modale mappatura import CSV */}
      {sheet && mapping && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSheet(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-extrabold text-[#161616]">Importa "{fileName}"</h3>
              <button onClick={() => setSheet(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[12px] text-[#8a8a8a] font-semibold mb-3">{sheet.rows.length} righe trovate. Controlla a quale colonna corrisponde ogni campo:</p>
            <div className="flex flex-col gap-2.5">
              {([['desc', 'Descrizione'], ['category', 'Categoria'], ['quantity', 'Quantità'], ['unitPrice', 'Prezzo unitario']] as const).map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-3">
                  <span className="w-[130px] text-[12.5px] font-bold text-[#161616]">{lbl}</span>
                  <select value={mapping[k]} onChange={(e) => setMapping({ ...mapping, [k]: Number(e.target.value) })} className={`${inp} flex-1`}>
                    <option value={-1}>— non presente —</option>
                    {sheet.headers.map((h, i) => <option key={i} value={i}>{h || `Colonna ${i + 1}`}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <button onClick={confirmImport} className="mt-4 w-full px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Importa {sheet.rows.length} righe</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputiView;
