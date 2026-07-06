/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CommercialeHub — Centro Commerciale di Strategico: gestisce la parte
 * commerciale di TUTTE le società (stesso pattern di Marketing/Direzione).
 *   1. CENTRO — pipeline per società: elaborati/in attesa/accettati, valore,
 *      conversione, in scadenza, risposte dal portale cliente.
 *   2. WORKSPACE SOCIETÀ — Preventivi & Contratti (firma OTP + invio al
 *      portale interattivo), Documenti (generatore da modello con carta
 *      intestata: contratti Arredi Fissi/FF&E, Accordo imprese, Manifestazione
 *      d'interesse, stampa preventivo), Listino (+ Contratti imprese per Materico).
 */
import React from 'react';
import { Target, ArrowLeft, FileText, FileSignature, ListChecks, AlertTriangle, Trash2, Star } from 'lucide-react';
import type { Quote, ClientRecord, QuoteClientChoice, MatericoContract, MatericoDeal, MatericoPriceItem, PriceItem, TrashItem } from '../types';
import HubCestino from './HubCestino';
import { eur } from '../utils';
import { SOCIETA_LABEL } from '../access';
import { SOCIETY_COLOR } from '../societyConfig';
import { CommercialeView } from './CommercialeView';
import { PriceListModal } from './QuotesView';
import ContractPrintDoc, { CONTRACT_TEMPLATES, type ContractTemplateId } from './ContractPrintDoc';
import MatericoContractsView from './MatericoContractsView';
import MatericoListinoView from './MatericoListinoView';

const SOCS = ['studio', 'strategico', 'materico', 'unico', 'fantastico'] as const;
const socLabel = (s: string) => (SOCIETA_LABEL as any)[s] || s;
const socColor = (s: string) => (SOCIETY_COLOR as any)[s] || '#8a8a8a';
const todayISO = () => new Date().toISOString().slice(0, 10);

interface Member { uid: string; name: string; }
interface Props {
  quotes: Quote[];
  clients: Record<string, ClientRecord>;
  choices: Record<string, QuoteClientChoice>;
  members: Member[];
  priceList: PriceItem[];
  matericoContracts: Record<string, MatericoContract>;
  matericoDeals: MatericoDeal[];
  matericoListino: Record<string, MatericoPriceItem>;
  color?: string;
  canEdit?: boolean;
  onSetStatus?: (id: string, status: Quote['status']) => void;
  onArchive?: (id: string, archived: boolean) => void;
  onSaveQuote?: (q: Quote) => void;
  onShare?: (q: Quote) => void;
  onOpenEditor?: (soc: string) => void;
  onSaveMatContract?: (c: MatericoContract) => void;
  onDeleteMatContract?: (id: string) => void;
  onSaveMatListino?: (i: MatericoPriceItem) => void;
  onDeleteMatListino?: (id: string) => void;
  /** Salva il listino voci (nodo priceList, array intero): abilita "Modifica listino" nel workspace. */
  onSavePriceList?: (arr: PriceItem[]) => void;
  // Cestino & Archivio dell'area
  trash?: TrashItem[];
  onRestoreTrash?: (t: TrashItem) => void;
  onTrashDeleteForever?: (t: TrashItem) => void;
  /** Valutazione imprese (PDF Materico): salva `valutazioni` sul record rubrica. */
  onSaveClient?: (c: ClientRecord) => void;
}

type WsTab = 'preventivi' | 'documenti' | 'listino' | 'imprese' | 'valutazioni';

export const CommercialeHub: React.FC<Props> = (p) => {
  const [activeSoc, setActiveSoc] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<WsTab>('preventivi');
  const [showCestino, setShowCestino] = React.useState(false);
  if (showCestino) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCestino(false)} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer" title="Centro Commerciale"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-[20px] font-black tracking-tight text-[#161616]">Cestino & Archivio · Commerciale</h2>
        </div>
        <HubCestino
          sections={['preventivi']}
          trash={p.trash || []}
          archived={p.quotes.filter((q) => q.archived).map((q) => ({
            id: q.id,
            label: `${q.number} · ${q.clientName || 'Cliente'}`,
            meta: `${socLabel(q.division)} · ${eur(q.total || 0)}`,
            onUnarchive: p.onArchive ? () => p.onArchive!(q.id, false) : undefined,
            unarchiveLabel: 'Riattiva',
          }))}
          archiveHint="Preventivi archiviati (si riattivano da qui o dalla pagina della società)."
          canEdit={p.canEdit}
          onRestore={p.onRestoreTrash}
          onDeleteForever={p.onTrashDeleteForever}
        />
      </div>
    );
  }
  if (activeSoc) return <Workspace {...p} soc={activeSoc} tab={tab} onTab={setTab} onBack={() => setActiveSoc(null)} />;
  return <Centro {...p} onOpen={(s) => { setActiveSoc(s); setTab('preventivi'); }} onOpenCestino={() => setShowCestino(true)} />;
};

// ---------------------------------------------------------------- Centro
const Centro: React.FC<Props & { onOpen: (s: string) => void; onOpenCestino?: () => void }> = ({ quotes, choices, color = '#b45309', onOpen, onOpenCestino }) => {
  const t = todayISO();
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const per = SOCS.map((soc) => {
    const qs = quotes.filter((q) => q.division === soc && !q.archived);
    const elaborati = qs.filter((q) => q.status === 'elaborato' || q.status === 'in_attesa');
    const accettati = qs.filter((q) => q.status === 'accettato');
    const decisi = accettati.length + qs.filter((q) => q.status === 'rifiutato').length;
    const scadenza = elaborati.filter((q) => q.validUntil && q.validUntil >= t && q.validUntil <= in7);
    const risposte = qs.filter((q) => choices[q.id] && q.status !== 'accettato');
    return {
      soc, tot: qs.length, elaborati: elaborati.length, accettati: accettati.length,
      valore: elaborati.reduce((s, q) => s + (q.total || 0), 0),
      valoreAcc: accettati.reduce((s, q) => s + (q.total || 0), 0),
      conv: decisi ? Math.round((accettati.length / decisi) * 100) : null,
      scadenza, risposte,
    };
  });
  const alerts: { text: string; soc: string }[] = [];
  per.forEach((x) => {
    x.risposte.forEach((q) => {
      const c = choices[q.id];
      alerts.push({ text: `${socLabel(x.soc)}: il cliente ha ${c.accepted ? 'ACCETTATO' : 'risposto a'} "${q.number}" dal portale.`, soc: x.soc });
    });
    if (x.scadenza.length) alerts.push({ text: `${socLabel(x.soc)}: ${x.scadenza.length} preventiv${x.scadenza.length === 1 ? 'o' : 'i'} in scadenza entro 7 giorni.`, soc: x.soc });
  });
  const totPipeline = per.reduce((s, x) => s + x.valore, 0);
  const totAccettato = per.reduce((s, x) => s + x.valoreAcc, 0);

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Target className="w-5.5 h-5.5" style={{ color }} /> Centro Commerciale</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">La parte commerciale di tutte le società: preventivi interattivi, contratti e documenti da modello, per società.</p>
        </div>
        {onOpenCestino && (
          <button onClick={onOpenCestino} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[12.5px] font-bold cursor-pointer"><Trash2 className="w-4 h-4" /> Cestino & Archivio</button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Pipeline aperta (gruppo)', v: eur(totPipeline) },
          { l: 'Valore accettato', v: eur(totAccettato) },
          { l: 'Risposte dal portale', v: String(per.reduce((s, x) => s + x.risposte.length, 0)), c: per.some((x) => x.risposte.length) ? '#b45309' : undefined },
          { l: 'In scadenza (7gg)', v: String(per.reduce((s, x) => s + x.scadenza.length, 0)), c: per.some((x) => x.scadenza.length) ? '#e11d48' : undefined },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>
      {alerts.length > 0 && (
        <div className="bg-white border border-[#f3d9b1] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#b45309] inline-flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Richiede attenzione</p>
          <div className="flex flex-col gap-1.5">
            {alerts.slice(0, 7).map((a, i) => (
              <button key={i} onClick={() => onOpen(a.soc)} className="text-left text-[12.5px] text-[#555] hover:text-[#161616] cursor-pointer bg-transparent border-none p-0 font-semibold">· {a.text}</button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {per.map((x) => (
          <button key={x.soc} onClick={() => onOpen(x.soc)} className="text-left bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: socColor(x.soc) }} /><b className="text-[14.5px] text-[#161616]">{socLabel(x.soc)}</b></span>
              {x.conv != null && <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f3f3f1] text-[#555]">{x.conv}% accettati</span>}
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1 text-[11.5px] text-[#8a8a8a] font-semibold">
              <span>In corso: <b className="text-[#555]">{x.elaborati}</b></span>
              <span>Accettati: <b className="text-[#555]">{x.accettati}</b></span>
              <span>Pipeline: <b className="text-[#555]">{eur(x.valore)}</b></span>
              <span>Vinto: <b className="text-[#555]">{eur(x.valoreAcc)}</b></span>
            </div>
            {(x.risposte.length > 0 || x.scadenza.length > 0) && (
              <p className="mt-2 text-[10.5px] font-extrabold" style={{ color: x.risposte.length ? '#b45309' : '#e11d48' }}>
                {x.risposte.length ? `${x.risposte.length} rispost${x.risposte.length === 1 ? 'a' : 'e'} dal portale` : ''}
                {x.risposte.length && x.scadenza.length ? ' · ' : ''}
                {x.scadenza.length ? `${x.scadenza.length} in scadenza` : ''}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Workspace
const Workspace: React.FC<Props & { soc: string; tab: WsTab; onTab: (t: WsTab) => void; onBack: () => void }> = (p) => {
  const { soc, tab, onTab, onBack, canEdit = false } = p;
  const [openTpl, setOpenTpl] = React.useState<ContractTemplateId | null>(null);
  const [listinoOpen, setListinoOpen] = React.useState(false);
  const tabs: { id: WsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'preventivi', label: 'Preventivi & Contratti', icon: Target },
    { id: 'documenti', label: 'Documenti', icon: FileText },
    ...(soc === 'materico' ? [
      { id: 'imprese' as WsTab, label: 'Contratti imprese', icon: FileSignature },
      { id: 'valutazioni' as WsTab, label: 'Valutazione imprese', icon: Star },
    ] : []),
    { id: 'listino', label: 'Listino', icon: ListChecks },
  ];
  const templates = CONTRACT_TEMPLATES.filter((tp) => tp.soc === soc);
  const rubricaList = Object.values(p.clients);

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer shrink-0" title="Centro Commerciale"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h2 className="text-[20px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: socColor(soc) }} />{socLabel(soc)} · Commerciale</h2>
            <p className="text-[11.5px] text-[#8a8a8a] font-semibold">Preventivi interattivi, firma OTP e documenti da modello con carta intestata.</p>
          </div>
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onTab(id)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}><Icon className="w-3.5 h-3.5" /> {label}</button>
          ))}
        </div>
      </div>

      {tab === 'preventivi' && (
        <CommercialeView
          quotes={p.quotes.filter((q) => q.division === soc)}
          soc={soc}
          socLabel={socLabel(soc)}
          clients={p.clients}
          choices={p.choices}
          members={p.members}
          color={socColor(soc)}
          canEdit={canEdit}
          onSetStatus={p.onSetStatus}
          onArchive={p.onArchive}
          onSaveQuote={p.onSaveQuote}
          onShare={p.onShare}
          onOpenEditor={p.onOpenEditor ? () => p.onOpenEditor!(soc) : undefined}
        />
      )}

      {tab === 'documenti' && (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold">I documenti di {socLabel(soc)} dai modelli ufficiali: campi auto-compilati dalla rubrica, testo modificabile prima della stampa. Il PREVENTIVO stampabile è sulla card di ogni preventivo (pulsante "Documento").</p>
          {templates.length === 0 ? (
            <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Per {socLabel(soc)} è disponibile il modello Preventivo (dalle card dei preventivi). Altri modelli arriveranno quando mi darai i documenti.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((tp) => (
                <button key={tp.id} onClick={() => setOpenTpl(tp.id)} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm hover:border-[#161616] hover:shadow-md transition-all cursor-pointer">
                  <p className="inline-flex items-center gap-2 font-extrabold text-[14px] text-[#161616]"><FileSignature className="w-4 h-4" style={{ color: socColor(soc) }} /> {tp.label}</p>
                  <p className="text-[11.5px] text-[#8a8a8a] mt-1">{tp.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'valutazioni' && soc === 'materico' && (
        <ImpreseRating rubrica={rubricaList} canEdit={canEdit} color={socColor(soc)} onSaveClient={p.onSaveClient} />
      )}

      {tab === 'imprese' && soc === 'materico' && (
        <MatericoContractsView
          contracts={p.matericoContracts}
          deals={p.matericoDeals}
          partners={rubricaList.filter((c: any) => c.roles?.impresa || c.roles?.fornitore).map((c) => ({ id: c.id, name: c.name }))}
          color={socColor(soc)}
          canEdit={canEdit}
          onSave={p.onSaveMatContract}
          onDelete={p.onDeleteMatContract}
        />
      )}

      {tab === 'listino' && (
        soc === 'materico' ? (
          <MatericoListinoView items={p.matericoListino} color={socColor(soc)} canEdit={canEdit} onSave={p.onSaveMatListino} onDelete={p.onDeleteMatListino} />
        ) : (() => {
          const items = p.priceList.filter((i) => !i.division || i.division === soc);
          return (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[12.5px] text-[#8a8a8a] font-semibold">
                  Le voci di {socLabel(soc)}, riusabili in preventivi e stime. <b>% valore</b> = quanto la voce
                  aumenta il valore dell'immobile nel preventivo interattivo del portale.
                </p>
                {canEdit && p.onSavePriceList && (
                  <button onClick={() => setListinoOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none shrink-0">
                    <ListChecks className="w-4 h-4" /> Modifica listino
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna voce di listino per {socLabel(soc)}.{canEdit && p.onSavePriceList ? ' Aggiungile con "Modifica listino".' : ''}</p>
              ) : (
                <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[560px]">
                    <thead><tr className="border-b border-[#eee] bg-[#f7f6f4]">
                      {['Voce', 'Categoria', 'U.M.', 'Prezzo', '% valore'].map((h, i) => <th key={h} className={`px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i >= 3 ? 'text-right' : ''}`}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.id} className="border-b border-[#f3f3f3] last:border-none">
                          <td className="px-3 py-2 text-[12.5px] font-semibold text-[#161616]">{i.label}</td>
                          <td className="px-3 py-2 text-[11.5px] text-[#8a8a8a] capitalize">{String(i.macro).replace('_', ' ')}</td>
                          <td className="px-3 py-2 text-[11.5px] text-[#8a8a8a]">{i.unit || '—'}</td>
                          <td className="px-3 py-2 text-right text-[12.5px] font-extrabold text-[#161616]">{eur(i.unitPrice)}</td>
                          <td className="px-3 py-2 text-right text-[12.5px] font-extrabold text-emerald-700">{i.valuePct != null ? `+${i.valuePct}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {listinoOpen && p.onSavePriceList && (
                <PriceListModal items={p.priceList} company={soc} onSave={p.onSavePriceList} onClose={() => setListinoOpen(false)} />
              )}
            </div>
          );
        })()
      )}

      {openTpl && <ContractPrintDoc template={openTpl} soc={soc} rubrica={rubricaList} onClose={() => setOpenTpl(null)} />}
    </div>
  );
};

// ---------------------------------------------------------------- Valutazione imprese
// PDF Materico: "Valutazione impresa (per scegliere le migliori a colpo d'occhio)".
const CRITERI = [
  'Qualità lavorazioni', 'Affidabilità', 'Rispetto tempistiche', 'Capacità organizzativa',
  'Risoluzione problemi', 'Specializzazione', 'Rapporto qualità/prezzo',
];
const mediaOf = (v?: Record<string, number> | null) => {
  const vals = CRITERI.map((c) => v?.[c]).filter((x): x is number => typeof x === 'number' && x > 0);
  return vals.length ? Math.round((vals.reduce((s, x) => s + x, 0) / vals.length) * 10) / 10 : null;
};
const ImpreseRating: React.FC<{ rubrica: ClientRecord[]; canEdit: boolean; color: string; onSaveClient?: (c: ClientRecord) => void }> = ({ rubrica, canEdit, color, onSaveClient }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const imprese = rubrica
    .filter((c: any) => c.category === 'partner' || c.roles?.impresa || c.roles?.fornitore)
    .sort((a, b) => (mediaOf(b.valutazioni) || 0) - (mediaOf(a.valutazioni) || 0));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-[#8a8a8a] font-semibold">Valuta le imprese sui 7 criteri (1–5): la classifica ti fa scegliere le migliori a colpo d'occhio. La valutazione si salva sulla scheda del Registro Utenti.</p>
      {imprese.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">Nessuna impresa/fornitore in rubrica (categoria "partner").</p>
      ) : (
        <div className="flex flex-col gap-2">
          {imprese.map((c) => {
            const m = mediaOf(c.valutazioni);
            const open = openId === c.id;
            return (
              <div key={c.id} className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden">
                <button onClick={() => setOpenId(open ? null : c.id)} className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer bg-transparent border-none text-left">
                  <b className="text-[13.5px] text-[#161616] flex-1 truncate">{c.name}</b>
                  {m != null ? (
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5" style={{ color: i <= Math.round(m) ? '#f59e0b' : '#e2e2e2', fill: i <= Math.round(m) ? '#f59e0b' : 'none' }} />)}</span>
                      <b className="text-[13px] text-[#161616]">{m}</b>
                    </span>
                  ) : <span className="text-[11px] font-bold text-[#b0b0b0] shrink-0">da valutare</span>}
                </button>
                {open && (
                  <div className="px-4 pb-3 flex flex-col gap-1.5 border-t border-[#f3f3f3] pt-2.5">
                    {CRITERI.map((cr) => {
                      const val = c.valutazioni?.[cr] || 0;
                      return (
                        <div key={cr} className="flex items-center gap-2">
                          <span className="w-[190px] text-[12px] font-semibold text-[#555]">{cr}</span>
                          <span className="inline-flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button
                                key={i}
                                disabled={!canEdit}
                                onClick={() => onSaveClient?.({ ...c, valutazioni: { ...(c.valutazioni || {}), [cr]: i === val ? 0 : i } })}
                                className="p-0.5 cursor-pointer bg-transparent border-none"
                              ><Star className="w-4 h-4" style={{ color: i <= val ? color : '#d9d9d5', fill: i <= val ? color : 'none' }} /></button>
                            ))}
                          </span>
                        </div>
                      );
                    })}
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

export default CommercialeHub;
