/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LegaleView — AREA LEGALE di Strategico (era placeholder `legale-contratti`):
 * la parte legale di TUTTE le società del gruppo. Tre tab:
 *   1. REGISTRO — documenti legali (contratti, liberatorie, informative, incarichi,
 *      polizze) con società, controparte, firma/scadenza e alert; nodo `legalDocs/<id>`
 *      (admin/manager, scrittura per-elemento, self-subscribe come ComputiView).
 *   2. MODELLI — i generatori di contratto da modello già esistenti (ContractPrintDoc).
 *   3. PRIVACY — cruscotto liberatorie marketing + consensi account portale + registro
 *      consensi GDPR (i dati vivono in mktAccounts / users.consents / mktConsents).
 */
import React from 'react';
import {
  Scale, FileSignature, ShieldCheck, FileText, Search, Plus, X, Trash2,
  ExternalLink, AlertTriangle, CheckCircle2, Ban,
} from 'lucide-react';
import type { LegalDoc, LegalDocKind, LegalDocStatus, ClientRecord, UserProfile, MktAccount, MktConsent } from '../types';
import { watchNode, writeNode, removeNode } from '../firebase';
import { safeUrl } from '../utils';
import { SOCIETA_LABEL } from '../access';
import { SOCIETY_COLOR } from '../societyConfig';
import ContractPrintDoc, { CONTRACT_TEMPLATES, type ContractTemplateId } from './ContractPrintDoc';

const inp = 'px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';

const KIND_LABEL: Record<LegalDocKind, string> = {
  contratto: 'Contratto', liberatoria: 'Liberatoria', informativa: 'Informativa privacy',
  incarico: 'Incarico / nomina', polizza: 'Polizza', altro: 'Altro',
};
const STATUS_META: Record<LegalDocStatus, { label: string; cls: string }> = {
  bozza: { label: 'Bozza', cls: 'bg-stone-100 text-stone-600' },
  attivo: { label: 'Attivo', cls: 'bg-emerald-50 text-emerald-700' },
  scaduto: { label: 'Scaduto', cls: 'bg-rose-50 text-rose-700' },
  disdetto: { label: 'Disdetto', cls: 'bg-amber-50 text-amber-700' },
};
const SOCS: { id: string; label: string }[] = [
  { id: '', label: 'Gruppo Aulico' },
  ...(['studio', 'strategico', 'materico', 'unico', 'fantastico'] as const).map((s) => ({ id: s, label: (SOCIETA_LABEL as any)[s] || s })),
];
const socLabel = (s?: string | null) => SOCS.find((x) => x.id === (s || ''))?.label || s || 'Gruppo';
const socColor = (s?: string | null) => (s ? (SOCIETY_COLOR as any)[s] || '#8a8a8a' : '#3f3f46');
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT') : '—');
const daysTo = (d?: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null);

interface Props {
  rubrica: ClientRecord[];
  users: Record<string, UserProfile>;
  mktAccounts: MktAccount[];
  mktConsents: MktConsent[];
  color?: string;
  canEdit?: boolean;
  askDelete?: (title: string, message: string | null, onConfirm: () => void) => void;
  onTrashItem?: (section: string, label: string, payload: any, meta?: string, detail?: string) => void;
}

type Tab = 'registro' | 'modelli' | 'privacy';

export const LegaleView: React.FC<Props> = ({ rubrica, users, mktAccounts, mktConsents, color = '#b45309', canEdit = false, askDelete, onTrashItem }) => {
  const [tab, setTab] = React.useState<Tab>('registro');
  const [docs, setDocs] = React.useState<Record<string, LegalDoc>>({});
  React.useEffect(() => watchNode('legalDocs', (v) => setDocs(v || {}), () => {}), []);

  const save = (d: LegalDoc) => {
    const enriched = { ...d, updatedAt: Date.now() };
    setDocs((p) => ({ ...p, [d.id]: enriched }));
    writeNode(`legalDocs/${d.id}`, enriched).catch(() => {});
  };
  const del = (d: LegalDoc) => {
    const doIt = () => {
      onTrashItem?.('legale-doc', d.title || 'Documento legale', d, undefined, d.counterparty || undefined);
      setDocs((p) => { const n = { ...p }; delete n[d.id]; return n; });
      removeNode(`legalDocs/${d.id}`).catch(() => {});
    };
    if (askDelete) askDelete('Eliminare questo documento legale?', `"${d.title}" finirà nel Cestino.`, doIt);
    else if (window.confirm('Eliminare il documento?')) doIt();
  };

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'registro', label: 'Registro legale', icon: Scale },
    { id: 'modelli', label: 'Modelli', icon: FileSignature },
    { id: 'privacy', label: 'Privacy & liberatorie', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
            <Scale className="w-5.5 h-5.5 text-[#161616]" /> Area Legale
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">
            Contrattualistica, liberatorie e privacy di tutte le società del gruppo — gestita da Strategico.
          </p>
        </div>
        <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'registro' && <RegistroTab docs={Object.values(docs)} rubrica={rubrica} color={color} canEdit={canEdit} onSave={save} onDelete={del} />}
      {tab === 'modelli' && <ModelliTab rubrica={rubrica} />}
      {tab === 'privacy' && <PrivacyTab users={users} mktAccounts={mktAccounts} mktConsents={mktConsents} />}
    </div>
  );
};

/* ---------------------------------------------------------------- Registro */
const RegistroTab: React.FC<{
  docs: LegalDoc[]; rubrica: ClientRecord[]; color: string; canEdit: boolean;
  onSave: (d: LegalDoc) => void; onDelete: (d: LegalDoc) => void;
}> = ({ docs, rubrica, color, canEdit, onSave, onDelete }) => {
  const [q, setQ] = React.useState('');
  const [socF, setSocF] = React.useState<string>('all');
  const [editing, setEditing] = React.useState<LegalDoc | null>(null);

  const attivi = docs.filter((d) => d.status === 'attivo');
  const inScadenza = attivi.filter((d) => { const g = daysTo(d.expiry); return g != null && g >= 0 && g <= 60; });
  const scaduti = docs.filter((d) => d.status === 'scaduto' || (d.status === 'attivo' && (daysTo(d.expiry) ?? 1) < 0));

  const list = docs
    .filter((d) => socF === 'all' || (d.soc || '') === socF)
    .filter((d) => { const t = q.trim().toLowerCase(); return !t || `${d.title} ${d.counterparty || ''} ${KIND_LABEL[d.kind]}`.toLowerCase().includes(t); })
    .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  const blank = (): LegalDoc => ({
    id: `lg-${Date.now().toString(36)}`, title: '', kind: 'contratto', soc: null,
    counterparty: null, clientRecordId: null, signedAt: null, expiry: null,
    status: 'bozza', link: null, note: null, createdAt: Date.now(),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Documenti attivi', v: String(attivi.length) },
          { l: 'In scadenza ≤60gg', v: String(inScadenza.length), c: inScadenza.length ? '#b45309' : undefined },
          { l: 'Scaduti', v: String(scaduti.length), c: scaduti.length ? '#e11d48' : undefined },
          { l: 'Totale registro', v: String(docs.length) },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {inScadenza.length > 0 && (
        <div className="bg-white border border-[#f3d9b1] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#b45309] inline-flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> In scadenza</p>
          <div className="flex flex-col gap-1">
            {inScadenza.slice(0, 5).map((d) => (
              <button key={d.id} onClick={() => setEditing(d)} className="text-left text-[12.5px] text-[#555] hover:text-[#161616] cursor-pointer bg-transparent border-none p-0 font-semibold">
                · {d.title} ({socLabel(d.soc)}) — scade il {fmtD(d.expiry)} ({daysTo(d.expiry)}gg)
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca documento, controparte…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
        </div>
        <select value={socF} onChange={(e) => setSocF(e.target.value)} className={`${inp} w-auto font-bold cursor-pointer`}>
          <option value="all">Tutte le società</option>
          {SOCS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {canEdit && (
          <button onClick={() => setEditing(blank())} className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
            <Plus className="w-4 h-4" /> Nuovo documento
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">
          Nessun documento nel registro.{canEdit ? ' Inizia con "Nuovo documento".' : ''}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((d) => {
            const gg = daysTo(d.expiry);
            const expired = d.status === 'scaduto' || (d.status === 'attivo' && gg != null && gg < 0);
            const st = expired ? STATUS_META.scaduto : STATUS_META[d.status];
            return (
              <button key={d.id} onClick={() => setEditing(d)} className="text-left bg-white border border-[#e2e2e2] rounded-[18px] px-4 py-3 hover:border-[#161616] cursor-pointer flex items-center gap-3 flex-wrap">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#f5f5f3] text-[#161616]"><FileText className="w-4.5 h-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <b className="text-[13.5px] text-[#161616] flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: socColor(d.soc) }} />{d.title || 'Senza titolo'}</b>
                  <p className="text-[11px] text-[#8a8a8a] truncate">
                    {KIND_LABEL[d.kind]} · {socLabel(d.soc)}{d.counterparty ? ` · ${d.counterparty}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {d.expiry && d.status === 'attivo' && !expired && gg != null && gg <= 60 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">scade tra {gg}gg</span>
                  )}
                  {d.expiry && <span className="text-[11px] text-[#9a9a9a] font-semibold">→ {fmtD(d.expiry)}</span>}
                  <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {editing && (
        <DocEditor
          doc={editing}
          rubrica={rubrica}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
          onSave={(d) => { onSave(d); setEditing(null); }}
          onDelete={docs.some((x) => x.id === editing.id) ? () => { onDelete(editing); setEditing(null); } : undefined}
        />
      )}
    </div>
  );
};

const DocEditor: React.FC<{
  doc: LegalDoc; rubrica: ClientRecord[]; canEdit: boolean;
  onClose: () => void; onSave: (d: LegalDoc) => void; onDelete?: () => void;
}> = ({ doc, rubrica, canEdit, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<LegalDoc>({ ...doc });
  const set = (p: Partial<LegalDoc>) => setD((x) => ({ ...x, ...p }));
  const fileUrl = safeUrl(d.link || '');
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{doc.title ? 'Documento legale' : 'Nuovo documento legale'}</h3>
          <div className="flex items-center gap-1">
            {canEdit && onDelete && <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1 col-span-2"><span className={lbl}>Titolo *</span>
            <input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Contratto quadro impresa Rossi" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Tipo</span>
            <select disabled={!canEdit} value={d.kind} onChange={(e) => set({ kind: e.target.value as LegalDocKind })} className={inp}>
              {(Object.keys(KIND_LABEL) as LegalDocKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Società</span>
            <select disabled={!canEdit} value={d.soc || ''} onChange={(e) => set({ soc: e.target.value || null })} className={inp}>
              {SOCS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Controparte (rubrica)</span>
            <select disabled={!canEdit} value={d.clientRecordId || ''} onChange={(e) => { const c = rubrica.find((x) => x.id === e.target.value); set({ clientRecordId: e.target.value || null, counterparty: c?.name || d.counterparty }); }} className={inp}>
              <option value="">— libera / nessuna —</option>
              {rubrica.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Controparte (nome)</span>
            <input disabled={!canEdit} value={d.counterparty || ''} onChange={(e) => set({ counterparty: e.target.value || null })} className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Data firma</span>
            <input disabled={!canEdit} type="date" value={d.signedAt || ''} onChange={(e) => set({ signedAt: e.target.value || null })} className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Scadenza / rinnovo</span>
            <input disabled={!canEdit} type="date" value={d.expiry || ''} onChange={(e) => set({ expiry: e.target.value || null })} className={inp} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Stato</span>
            <select disabled={!canEdit} value={d.status} onChange={(e) => set({ status: e.target.value as LegalDocStatus })} className={inp}>
              {(Object.keys(STATUS_META) as LegalDocStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select></label>
          <label className="flex flex-col gap-1"><span className={lbl}>File (link Drive/URL)</span>
            <input disabled={!canEdit} value={d.link || ''} onChange={(e) => set({ link: e.target.value || null })} placeholder="https://…" className={inp} /></label>
          <label className="flex flex-col gap-1 col-span-2"><span className={lbl}>Note</span>
            <textarea disabled={!canEdit} value={d.note || ''} onChange={(e) => set({ note: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
        </div>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#161616] hover:underline"><ExternalLink className="w-3.5 h-3.5" /> Apri file allegato</a>
        )}
        {canEdit && (
          <button onClick={() => d.title.trim() && onSave(d)} disabled={!d.title.trim()} className="mt-4 w-full px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva documento</button>
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Modelli */
const ModelliTab: React.FC<{ rubrica: ClientRecord[] }> = ({ rubrica }) => {
  const [open, setOpen] = React.useState<{ id: ContractTemplateId; soc: string } | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-[#8a8a8a] font-semibold">
        I contratti da modello con carta intestata (gli stessi del Centro Commerciale): campi auto-compilati dalla rubrica, ogni sezione modificabile prima della Stampa/PDF.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CONTRACT_TEMPLATES.map((tp) => (
          <button key={tp.id} onClick={() => setOpen({ id: tp.id, soc: tp.soc })} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm hover:border-[#161616] hover:shadow-md transition-all cursor-pointer">
            <p className="inline-flex items-center gap-2 font-extrabold text-[14px] text-[#161616]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: socColor(tp.soc) }} />
              <FileSignature className="w-4 h-4 text-[#161616]" /> {tp.label}
            </p>
            <p className="text-[11.5px] text-[#8a8a8a] mt-1">{socLabel(tp.soc)} · {tp.desc}</p>
          </button>
        ))}
      </div>
      {open && <ContractPrintDoc template={open.id} soc={open.soc} rubrica={rubrica} onClose={() => setOpen(null)} />}
    </div>
  );
};

/* ---------------------------------------------------------------- Privacy */
const PrivacyTab: React.FC<{ users: Record<string, UserProfile>; mktAccounts: MktAccount[]; mktConsents: MktConsent[] }> = ({ users, mktAccounts, mktConsents }) => {
  const clienti = Object.values(users).filter((u: any) => u && u.role === 'cliente');
  const conConsensi = clienti.filter((u: any) => u.consents);
  const marketingOk = clienti.filter((u: any) => u.consents?.marketing);
  const terzi = mktAccounts.filter((a) => a.kind === 'cliente');
  const senzaLib = terzi.filter((a) => !a.liberatoria);
  const consents = [...mktConsents].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  const granted = consents.filter((c) => c.granted).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Account cliente', v: String(clienti.length) },
          { l: 'Consenso marketing', v: String(marketingOk.length), c: '#059669' },
          { l: 'Liberatorie mancanti', v: String(senzaLib.length), c: senzaLib.length ? '#e11d48' : undefined },
          { l: 'Consensi GDPR attivi', v: `${granted}/${consents.length}` },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-[#e2e2e2] rounded-[18px] p-4 shadow-sm">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#a0a0a0]">{k.l}</p>
            <p className="text-[20px] font-black mt-1 leading-none" style={{ color: k.c || '#161616' }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {/* Liberatorie marketing clienti terzi */}
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Liberatorie marketing — clienti terzi</p>
          {terzi.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a] italic">Nessun cliente terzo gestito nel Centro Marketing.</p> : (
            <div className="flex flex-col gap-1.5">
              {terzi.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="font-semibold text-[#161616] truncate">{a.name}</span>
                  {a.liberatoria
                    ? <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-emerald-700 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> firmata</span>
                    : <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-rose-600 shrink-0"><Ban className="w-3.5 h-3.5" /> NON PUBBLICARE</span>}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-2">La liberatoria si attiva dalla scheda account nel Centro Marketing.</p>
        </div>

        {/* Registro consensi GDPR (mktConsents) */}
        <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Registro consensi GDPR</p>
          {consents.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a] italic">Nessun consenso registrato.</p> : (
            <div className="flex flex-col gap-1.5">
              {consents.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="font-semibold text-[#161616] truncate">{c.subject}<span className="text-[10.5px] text-[#9a9a9a] font-semibold"> · {(c.scopes || []).join(', ')}</span></span>
                  {c.granted
                    ? <span className="text-[10.5px] font-extrabold text-emerald-700 shrink-0">concesso</span>
                    : <span className="text-[10.5px] font-extrabold text-rose-600 shrink-0">revocato</span>}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-2">Gestione completa in Strategico → Marketing → Consensi.</p>
        </div>
      </div>

      {/* Consensi account portale */}
      <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-x-auto">
        <div className="px-4 pt-3.5 pb-1"><p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Consensi degli account portale (registrazione)</p></div>
        {clienti.length === 0 ? <p className="text-[12.5px] text-[#9a9a9a] italic px-4 pb-4">Nessun account cliente.</p> : (
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead><tr className="border-b border-[#eee] bg-[#f7f6f4]">
              {['Cliente', 'Privacy', 'Newsletter', 'Marketing', 'Data'].map((h, i) => <th key={h} className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#9a9a9a] ${i > 0 && i < 4 ? 'text-center' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {conConsensi.map((u: any) => (
                <tr key={u.uid} className="border-b border-[#f3f3f3] last:border-none">
                  <td className="px-4 py-2 text-[12.5px] font-semibold text-[#161616]">{u.name}</td>
                  {(['privacy', 'newsletter', 'marketing'] as const).map((k) => (
                    <td key={k} className="px-4 py-2 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${u.consents?.[k] ? 'bg-emerald-500' : 'bg-[#e0e0e0]'}`} />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-[11.5px] text-[#9a9a9a]">{u.consentsAt ? new Date(u.consentsAt).toLocaleDateString('it-IT') : '—'}</td>
                </tr>
              ))}
              {conConsensi.length === 0 && <tr><td colSpan={5} className="px-4 py-3 text-[12.5px] text-[#9a9a9a] italic">Nessun account con consensi registrati (spunte in registrazione).</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LegaleView;
