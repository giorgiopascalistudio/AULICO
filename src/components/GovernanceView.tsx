/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Governance & Organizzazione (Strategico/HR): organigramma dinamico a 3 livelli
 * (società → aree → ruoli/persone), mansionari + PFV, procedure operative (SOP),
 * collegamenti a Incentivi/Registro/Permessi. Vedi docs/V2/STRATEGICO/GOVERNANCE_ORGANIGRAMMI.
 */

import React from 'react';
import {
  Network, Plus, Trash2, ChevronDown, ChevronRight, Building2, Layers, UserCircle2,
  ScrollText, Award, ShieldCheck, BookOpen, X, Pencil,
} from 'lucide-react';
import type { OrgNode, OrgKind, OrgIdentita, GovernanceSop } from '../types';

interface Member { uid: string; name: string; }
interface Props {
  org: Record<string, OrgNode>;
  sops: Record<string, GovernanceSop>;
  members: Member[];
  color?: string;
  canEdit?: boolean;
  onSaveNode: (n: OrgNode) => void;
  onDeleteNode: (id: string) => void;
  onSaveSop: (s: GovernanceSop) => void;
  onDeleteSop: (id: string) => void;
  onNav?: (hash: string) => void;
}

const KIND_META: Record<OrgKind, { label: string; color: string; icon: any }> = {
  societa: { label: 'Società', color: '#161616', icon: Building2 },
  area: { label: 'Area', color: '#b45309', icon: Layers },
  ruolo: { label: 'Ruolo', color: '#4338ca', icon: UserCircle2 },
};
const IDENTITA: { id: OrgIdentita; label: string }[] = [
  { id: 'amministratore', label: 'Amministratore' },
  { id: 'socio', label: 'Socio' },
  { id: 'dipendente', label: 'Dipendente' },
  { id: 'collaboratore', label: 'Collaboratore' },
];
const childKind = (k: OrgKind): OrgKind => (k === 'societa' ? 'area' : 'ruolo');

/** Seed fedele alle due immagini (idempotente: id stabili → riesegue senza duplicare). */
function buildGroupSeed(): OrgNode[] {
  const t = Date.now();
  let o = 0;
  const out: OrgNode[] = [];
  const add = (n: Partial<OrgNode> & { id: string; kind: OrgKind; label: string }) => out.push({ parentId: null, chart: 'funzionale', order: t + o++, createdAt: t, ...n } as OrgNode);

  // ---- ORGANIGRAMMA FUNZIONALE (chi fa cosa) ----
  add({ id: 'f-root', kind: 'societa', label: 'Amministratore', person: 'Dario Flore', chart: 'funzionale' });
  const areaPerson: Record<string, string> = { 'f-hr': 'Dario Flore', 'f-mkt': 'Rosa Custodero', 'f-amm': 'Francesco Zurlo', 'f-prod': 'Dario Flore', 'f-comm': 'Dario Flore' };
  const areas: [string, string, [string, string][]][] = [
    ['f-hr', 'Risorse Umane', [['HR Manager', 'Dario Flore'], ['Recruiter', 'Dario Flore'], ['Amministrazione del Personale', 'Francesco Zurlo'], ['Consulente del Lavoro', 'Giuseppe Renzulli']]],
    ['f-mkt', 'Marketing', [['Marketing Manager', 'Dario Flore'], ['Content Creator', 'Rosa Custodero'], ['Grafico', 'Giorgio Pascali'], ['Social Media Manager', 'Rosa Custodero']]],
    ['f-amm', 'Amministrazione', [['Responsabile Amministrativo', 'Francesco Zurlo'], ['Contabile', 'Francesco Zurlo'], ['Segreteria Amministrativa', 'Francesco Zurlo'], ['Consulente Fiscale / Commercialista', 'Angela Parrella']]],
    ['f-prod', 'Produzione', [['Area Architettonica', ''], ['Area Strutturale', ''], ['Area Energetica', ''], ['Area Design', ''], ['Area Esecutiva', ''], ['Area Sicurezza', ''], ['Area Abilitativa', '']]],
    ['f-comm', 'Commerciale', [['Direttore Commerciale', 'Dario Flore'], ['Account Manager', 'Dario Flore'], ['Sales Support', 'Francesco Zurlo'], ['Customer Care', 'Francesco Zurlo']]],
  ];
  areas.forEach(([aid, alabel, ruoli]) => {
    add({ id: aid, parentId: 'f-root', kind: 'area', label: alabel, person: areaPerson[aid] || null, chart: 'funzionale' });
    ruoli.forEach(([rlabel, rperson], i) => add({ id: `${aid}-${i}`, parentId: aid, kind: 'ruolo', label: rlabel, person: rperson || null, chart: 'funzionale' }));
  });

  // ---- ORGANIGRAMMA SOCIETARIO (holding e quote) ----
  add({ id: 's-holding', kind: 'societa', label: 'DF Holdings S.r.l.', person: 'Dario Flore (Socio unico)', quota: 100, chart: 'societario' });
  const soc: [string, string, number, [string, number][]?][] = [
    ['s-onirico', 'Onirico Design S.T.P. S.r.l.', 100],
    ['s-strategico', 'Strategico S.r.l.', 100],
    ['s-unico', 'Unico RE S.r.l.', 100],
    ['s-materico', 'Materico S.r.l.', 60, [['Marco Epifani', 20], ['Raffaele Zivoli', 20]]],
  ];
  soc.forEach(([sid, slabel, q, soci]) => {
    add({ id: sid, parentId: 's-holding', kind: 'societa', label: slabel, quota: q, chart: 'societario' });
    (soci || []).forEach(([sn, sq], i) => add({ id: `${sid}-socio-${i}`, parentId: sid, kind: 'ruolo', label: sn, quota: sq, identita: 'socio', chart: 'societario' }));
  });
  return out;
}

export const GovernanceView: React.FC<Props> = ({ org, sops, members, color = '#b45309', canEdit = false, onSaveNode, onDeleteNode, onSaveSop, onDeleteSop, onNav }) => {
  const [tab, setTab] = React.useState<'organigramma' | 'mansionari' | 'sop' | 'collegamenti'>('organigramma');
  const nodes = Object.values(org);
  const childrenOf = (pid: string | null) => nodes.filter((n) => (n.parentId || null) === pid).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Network className="w-5.5 h-5.5" /> Governance & Organizzazione</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Chi fa cosa nel gruppo: organigrammi, mansionari, procedure.</p>
        </div>
      </div>

      <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start flex-wrap">
        {([['organigramma', 'Organigramma', Network], ['mansionari', 'Mansionari & PFV', Award], ['sop', 'Procedure (SOP)', BookOpen], ['collegamenti', 'Collegamenti', ShieldCheck]] as const).map(([id, lbl, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${tab === id ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
            <Icon className="w-3.5 h-3.5" /> {lbl}
          </button>
        ))}
      </div>

      {tab === 'organigramma' && <Organigramma nodes={nodes} childrenOf={childrenOf} members={members} canEdit={canEdit} onSaveNode={onSaveNode} onDeleteNode={onDeleteNode} />}
      {tab === 'mansionari' && <Mansionari nodes={nodes} members={members} />}
      {tab === 'sop' && <SopTab sops={sops} canEdit={canEdit} onSaveSop={onSaveSop} onDeleteSop={onDeleteSop} />}
      {tab === 'collegamenti' && <Collegamenti onNav={onNav} color={color} />}
    </div>
  );
};

// ============================ ORGANIGRAMMA ============================
const Organigramma: React.FC<{ nodes: OrgNode[]; childrenOf: (pid: string | null) => OrgNode[]; members: Member[]; canEdit: boolean; onSaveNode: (n: OrgNode) => void; onDeleteNode: (id: string) => void }> = ({ nodes, childrenOf, members, canEdit, onSaveNode, onDeleteNode }) => {
  const [selId, setSelId] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [chart, setChart] = React.useState<'societario' | 'funzionale'>('funzionale');
  const [zoom, setZoom] = React.useState(1);
  const roots = childrenOf(null).filter((n) => (n.chart || 'funzionale') === chart);
  const sel = selId ? nodes.find((n) => n.id === selId) || null : null;

  const addNode = (parent: OrgNode | null) => {
    const kind: OrgKind = parent ? childKind(parent.kind) : 'societa';
    const n: OrgNode = { id: `org-${Date.now()}-${Math.floor(Math.random() * 900)}`, parentId: parent?.id || null, kind, chart: parent ? (parent.chart || 'funzionale') : chart, label: kind === 'societa' ? 'Nuova società' : kind === 'area' ? 'Nuova area' : 'Nuovo ruolo', societa: parent ? (parent.societa || (parent.kind === 'societa' ? parent.id : null)) : null, order: Date.now(), createdAt: Date.now() };
    onSaveNode(n);
    setSelId(n.id);
  };
  const seed = () => { buildGroupSeed().forEach(onSaveNode); };

  // Nodo-box dello schema (ricorsivo, con connettori CSS via .orgchart)
  const ChartNode: React.FC<{ node: OrgNode }> = ({ node }) => {
    const kids = childrenOf(node.id);
    const meta = KIND_META[node.kind];
    const Icon = meta.icon;
    const isCol = collapsed[node.id];
    const isSel = selId === node.id;
    const canAdd = canEdit && node.kind !== 'ruolo';
    return (
      <li>
        <div className="og-wrap">
          <div
            onClick={() => setSelId(node.id)}
            className={`og-node relative inline-flex flex-col items-center text-center align-top bg-white border rounded-2xl px-3.5 py-2.5 cursor-pointer transition-all select-none ${isSel ? 'shadow-md -translate-y-0.5' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
            style={{ borderColor: isSel ? meta.color : '#e2e2e2', borderWidth: isSel ? 2 : 1, minWidth: 148, maxWidth: 210, boxShadow: isSel ? `0 6px 18px ${meta.color}22` : undefined }}
          >
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm" style={{ background: meta.color, color: '#fff' }}><Icon className="w-3.5 h-3.5" /></span>
            <span className="text-[12.5px] font-extrabold text-[#161616] leading-tight mt-2.5 break-words">{node.label}</span>
            {node.person && <span className="text-[10.5px] text-[#6b6b6b] font-semibold mt-0.5 break-words leading-tight">{node.person}</span>}
            <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
              {node.quota != null && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ background: `${meta.color}14`, color: meta.color }}>{node.quota}%</span>}
              {node.identita && <span className="text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{node.identita}</span>}
            </div>
            {/* controlli */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {kids.length > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setCollapsed((c) => ({ ...c, [node.id]: !c[node.id] })); }} title={isCol ? `Espandi (${kids.length})` : 'Comprimi'} className="w-5 h-5 rounded-full bg-white border border-[#d7d7d3] flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] hover:border-[#161616] shadow-sm cursor-pointer">
                  {isCol ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 rotate-90" />}
                </button>
              )}
              {canAdd && <button onClick={(e) => { e.stopPropagation(); addNode(node); }} title="Aggiungi sotto-elemento" className="w-5 h-5 rounded-full bg-[#161616] text-white flex items-center justify-center hover:bg-black shadow-sm cursor-pointer border-none"><Plus className="w-3 h-3" /></button>}
            </div>
            {isCol && kids.length > 0 && <span className="absolute -bottom-2.5 -right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-200 text-[#555]">+{kids.length}</span>}
          </div>
        </div>
        {!isCol && kids.length > 0 && <ul>{kids.map((k) => <ChartNode key={k.id} node={k} />)}</ul>}
      </li>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="lg:flex-1 w-full bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm min-h-[440px]">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          {/* Toggle tipo organigramma */}
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            {([['funzionale', 'Funzionale'], ['societario', 'Societario']] as const).map(([id, lbl]) => (
              <button key={id} onClick={() => { setChart(id); setSelId(null); }} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none transition-all ${chart === id ? 'bg-[#161616] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* zoom */}
            <div className="inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] rounded-full">
              <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="w-7 h-7 flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] cursor-pointer bg-transparent border-none">−</button>
              <span className="text-[11px] font-bold text-[#6b6b6b] w-9 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))} className="w-7 h-7 flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] cursor-pointer bg-transparent border-none">+</button>
            </div>
            {canEdit && (
              <>
                <button onClick={seed} title="Precompila con la struttura delle immagini" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Network className="w-3.5 h-3.5" /> Carica esempio</button>
                <button onClick={() => addNode(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none"><Plus className="w-3.5 h-3.5" /> {chart === 'societario' ? 'Società' : 'Ramo'}</button>
              </>
            )}
          </div>
        </div>
        {roots.length === 0 ? (
          <div className="text-center py-14">
            <Network className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-[#8a8a8a] mb-4">Organigramma {chart} vuoto.{canEdit ? ' Caricalo dalle immagini o aggiungi a mano.' : ''}</p>
            {canEdit && <button onClick={seed} className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Carica organigrammi (come da immagini)</button>}
          </div>
        ) : (
          <div className="overflow-auto -mx-1 px-1 pb-2" style={{ maxHeight: '68vh' }}>
            <div className="orgchart" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <ul>{roots.map((r) => <ChartNode key={r.id} node={r} />)}</ul>
            </div>
          </div>
        )}
      </div>

      {/* Pannello dettaglio nodo */}
      <div className="lg:w-[340px] w-full lg:sticky lg:top-4 bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm">
        {!sel ? <p className="text-[13px] text-[#9a9a9a] text-center py-10">Seleziona un box dello schema per modificarlo, oppure usa <b className="text-[#161616]">＋</b> su un nodo per aggiungere un sotto-elemento.</p> : (
          <NodeEditor key={sel.id} node={sel} members={members} canEdit={canEdit} onSave={onSaveNode} onDelete={(id) => { onDeleteNode(id); setSelId(null); }} hasChildren={childrenOf(sel.id).length > 0} onAddChild={() => addNode(sel)} />
        )}
      </div>
    </div>
  );
};

const NodeEditor: React.FC<{ node: OrgNode; members: Member[]; canEdit: boolean; onSave: (n: OrgNode) => void; onDelete: (id: string) => void; hasChildren: boolean; onAddChild?: () => void }> = ({ node, members, canEdit, onSave, onDelete, hasChildren, onAddChild }) => {
  const [d, setD] = React.useState<OrgNode>(node);
  React.useEffect(() => setD(node), [node]);
  const meta = KIND_META[node.kind];
  const set = (c: Partial<OrgNode>) => setD((p) => ({ ...p, ...c }));
  const save = () => onSave({ ...d, updatedAt: Date.now() });
  const Lbl: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">{children}</span>;
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${meta.color}14`, color: meta.color }}>{meta.label}</span>
        {canEdit && <button onClick={() => onDelete(node.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer bg-transparent border-none" title={hasChildren ? 'Elimina (ed eventuali figli orfani)' : 'Elimina'}><Trash2 className="w-4 h-4" /></button>}
      </div>
      <label className="flex flex-col gap-1"><Lbl>Nome</Lbl><input disabled={!canEdit} value={d.label} onChange={(e) => set({ label: e.target.value })} className={inp} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><Lbl>Persona</Lbl><input disabled={!canEdit} value={d.person || ''} onChange={(e) => set({ person: e.target.value })} className={inp} placeholder="Nome" /></label>
        <label className="flex flex-col gap-1"><Lbl>Account team</Lbl>
          <select disabled={!canEdit} value={d.personUid || ''} onChange={(e) => { const m = members.find((x) => x.uid === e.target.value); set({ personUid: e.target.value || null, person: m ? m.name : d.person }); }} className={inp}>
            <option value="">—</option>{members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
          </select>
        </label>
      </div>
      {node.kind === 'societa' && <label className="flex flex-col gap-1"><Lbl>Quota %</Lbl><input disabled={!canEdit} type="number" value={d.quota ?? ''} onChange={(e) => set({ quota: e.target.value ? Number(e.target.value) : null })} className={inp} /></label>}
      {node.kind === 'ruolo' && (
        <>
          <label className="flex flex-col gap-1"><Lbl>Identità societaria</Lbl>
            <select disabled={!canEdit} value={d.identita || ''} onChange={(e) => set({ identita: (e.target.value || null) as any })} className={inp}>
              <option value="">—</option>{IDENTITA.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1"><Lbl>Mansioni (compiti & responsabilità)</Lbl><textarea disabled={!canEdit} value={d.mansioni || ''} onChange={(e) => set({ mansioni: e.target.value })} rows={3} className={`${inp} resize-none`} /></label>
          <label className="flex flex-col gap-1"><Lbl>PFV — Prodotto Finale di Valore</Lbl><textarea disabled={!canEdit} value={d.pfv || ''} onChange={(e) => set({ pfv: e.target.value })} rows={2} className={`${inp} resize-none`} placeholder="Es. l'emozione suscitata nel cliente" /></label>
        </>
      )}
      {canEdit && (
        <div className="flex flex-col gap-2 mt-1">
          <button onClick={save} className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva</button>
          {node.kind !== 'ruolo' && onAddChild && <button onClick={onAddChild} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12.5px] font-bold cursor-pointer"><Plus className="w-3.5 h-3.5" /> Aggiungi {node.kind === 'societa' ? 'area / sotto-società' : 'ruolo'}</button>}
        </div>
      )}
    </div>
  );
};

// ============================ MANSIONARI & PFV ============================
const Mansionari: React.FC<{ nodes: OrgNode[]; members: Member[] }> = ({ nodes }) => {
  const ruoli = nodes.filter((n) => n.kind === 'ruolo').sort((a, b) => a.label.localeCompare(b.label));
  if (ruoli.length === 0) return <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Nessun ruolo nell'organigramma. Aggiungi ruoli nella tab Organigramma.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ruoli.map((r) => (
        <div key={r.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <b className="text-[14px] text-[#161616]">{r.label}</b>
            {r.identita && <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{r.identita}</span>}
          </div>
          {r.person && <span className="text-[12px] text-[#6b6b6b] font-semibold">{r.person}</span>}
          {r.mansioni && <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">Mansioni</p><p className="text-[12.5px] text-[#333] leading-relaxed whitespace-pre-line">{r.mansioni}</p></div>}
          {r.pfv && <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">PFV</p><p className="text-[12.5px] text-[#161616] font-medium italic">{r.pfv}</p></div>}
          {!r.mansioni && !r.pfv && <p className="text-[12px] text-[#b0b0b0] italic">Mansioni e PFV da definire (tab Organigramma).</p>}
        </div>
      ))}
    </div>
  );
};

// ============================ SOP ============================
const SopTab: React.FC<{ sops: Record<string, GovernanceSop>; canEdit: boolean; onSaveSop: (s: GovernanceSop) => void; onDeleteSop: (id: string) => void }> = ({ sops, canEdit, onSaveSop, onDeleteSop }) => {
  const list = Object.values(sops).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  const [editing, setEditing] = React.useState<GovernanceSop | null>(null);
  const blank = (): GovernanceSop => ({ id: `sop-${Date.now()}`, title: '', area: null, description: null, steps: [''], createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-3">
      {canEdit && <button onClick={() => setEditing(blank())} className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova procedura</button>}
      {list.length === 0 ? <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Nessuna procedura operativa.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((s) => (
            <div key={s.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-[14px] text-[#161616] inline-flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#8a8a8a]" /> {s.title || 'Senza titolo'}</b>
                  {s.area && <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">{s.area}</p>}
                </div>
                {canEdit && <div className="flex items-center gap-1 shrink-0"><button onClick={() => setEditing(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDeleteSop(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button></div>}
              </div>
              {s.description && <p className="text-[12.5px] text-[#555] mt-1.5">{s.description}</p>}
              <ol className="mt-2.5 flex flex-col gap-1.5">
                {(s.steps || []).filter(Boolean).map((st, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#333]"><span className="w-5 h-5 rounded-full bg-[#161616] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span><span className="leading-relaxed">{st}</span></li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
      {editing && <SopEditor sop={editing} onClose={() => setEditing(null)} onSave={(s) => { onSaveSop(s); setEditing(null); }} />}
    </div>
  );
};

const SopEditor: React.FC<{ sop: GovernanceSop; onClose: () => void; onSave: (s: GovernanceSop) => void }> = ({ sop, onClose, onSave }) => {
  const [d, setD] = React.useState<GovernanceSop>(sop);
  const set = (c: Partial<GovernanceSop>) => setD((p) => ({ ...p, ...c }));
  const setStep = (i: number, v: string) => setD((p) => ({ ...p, steps: p.steps.map((s, j) => (j === i ? v : s)) }));
  const addStep = () => setD((p) => ({ ...p, steps: [...p.steps, ''] }));
  const rmStep = (i: number) => setD((p) => ({ ...p, steps: p.steps.filter((_, j) => j !== i) }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[88vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616]">{sop.title ? 'Modifica procedura' : 'Nuova procedura'}</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <input value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Titolo (es. Rilievo con laser scanner)" className={inp} />
          <input value={d.area || ''} onChange={(e) => set({ area: e.target.value || null })} placeholder="Area / strumento (facoltativo)" className={inp} />
          <textarea value={d.description || ''} onChange={(e) => set({ description: e.target.value || null })} placeholder="Descrizione breve" rows={2} className={`${inp} resize-none`} />
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Passi</span>
            {d.steps.map((st, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#161616] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <input value={st} onChange={(e) => setStep(i, e.target.value)} placeholder={`Passo ${i + 1}`} className={inp} />
                {d.steps.length > 1 && <button onClick={() => rmStep(i)} className="text-rose-400 hover:text-rose-600 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>}
              </div>
            ))}
            <button onClick={addStep} className="self-start text-[12px] font-bold text-[#161616] inline-flex items-center gap-1 cursor-pointer bg-transparent border-none"><Plus className="w-3.5 h-3.5" /> Aggiungi passo</button>
          </div>
          <button onClick={() => onSave({ ...d, steps: d.steps.map((s) => s.trim()).filter(Boolean), updatedAt: Date.now() })} disabled={!d.title.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva procedura</button>
        </div>
      </div>
    </div>
  );
};

// ============================ COLLEGAMENTI ============================
const Collegamenti: React.FC<{ onNav?: (hash: string) => void; color: string }> = ({ onNav }) => {
  const cards = [
    { label: 'Incentivi & Performance', desc: 'KPI e punteggio merito dei collaboratori.', icon: Award, hash: '#strategico/hr-team' },
    { label: 'Registro attività (Audit)', desc: 'Trail inalterabile di tutte le azioni.', icon: ScrollText, hash: '#strategico/hr-registro' },
    { label: 'Permessi & Accessi', desc: 'Ruoli e autorizzazioni (filtra le sezioni visibili).', icon: ShieldCheck, hash: '#strategico/hr-team' },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.label} onClick={() => onNav?.(c.hash)} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-5 shadow-sm hover:shadow-md hover:border-[#cfcfcf] transition-all cursor-pointer flex flex-col gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-[#161616]/[0.06] flex items-center justify-center text-[#161616]"><Icon className="w-5 h-5" /></span>
              <b className="text-[14px] text-[#161616]">{c.label}</b>
              <p className="text-[12px] text-[#8a8a8a] leading-relaxed">{c.desc}</p>
            </button>
          );
        })}
      </div>
      <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[20px] p-5 text-[12.5px] text-[#8a8a8a]">
        <b className="text-[#161616] inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Credenziali protette di gruppo</b> — in arrivo: cassaforte con master password per codici e accessi dei sistemi/social del gruppo. (Le credenziali per-cliente sono già nel CRM → scheda contatto.)
      </div>
    </div>
  );
};

export default GovernanceView;
