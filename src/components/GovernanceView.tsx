/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Governance & Organizzazione (Strategico/HR): organigramma dinamico a grafo (DAG)
 * — un box può avere PIÙ genitori, ognuno con quota % sull'arco (es. Materico ←
 * DF Holdings 60% + Epifani 20% + Zivoli 20%). Due schemi: Funzionale (chi fa cosa)
 * e Societario (holding e quote). Vedi docs/V2/STRATEGICO/GOVERNANCE_ORGANIGRAMMI.
 */

import React from 'react';
import {
  Network, Plus, Trash2, Building2, Layers, UserCircle2,
  ScrollText, Award, ShieldCheck, BookOpen, X, Pencil, CornerLeftUp,
} from 'lucide-react';
import type { OrgNode, OrgKind, OrgIdentita, OrgParentRef, GovernanceSop } from '../types';

interface Member { uid: string; name: string; }
interface Props {
  org: Record<string, OrgNode>;
  sops: Record<string, GovernanceSop>;
  members: Member[];
  color?: string;
  canEdit?: boolean;
  onSaveNode: (n: OrgNode) => void;
  onDeleteNode: (id: string) => void;
  onSeed?: (nodes: OrgNode[]) => void;
  onSaveSop: (s: GovernanceSop) => void;
  onDeleteSop: (id: string) => void;
  onNav?: (hash: string) => void;
}

const KIND_META: Record<OrgKind, { label: string; color: string; icon: any }> = {
  societa: { label: 'Società / Ente', color: '#161616', icon: Building2 },
  area: { label: 'Area', color: '#b45309', icon: Layers },
  ruolo: { label: 'Ruolo / Persona', color: '#4338ca', icon: UserCircle2 },
};
const IDENTITA: { id: OrgIdentita; label: string }[] = [
  { id: 'amministratore', label: 'Amministratore' },
  { id: 'socio', label: 'Socio' },
  { id: 'dipendente', label: 'Dipendente' },
  { id: 'collaboratore', label: 'Collaboratore' },
];
const childKind = (k: OrgKind): OrgKind => (k === 'societa' ? 'area' : 'ruolo');
const parentKind = (k: OrgKind): OrgKind => (k === 'ruolo' ? 'area' : 'societa');

/** Genitori di un nodo (compatibile col vecchio parentId singolo). */
const nodeParents = (n: OrgNode): OrgParentRef[] => (n.parents && n.parents.length ? n.parents : n.parentId ? [{ id: n.parentId }] : []);

/** Stile box "Funzionale" (come immagine 1): intestazione colorata + sotto-box persona. */
const FUNZ: Record<OrgKind, { head: string; headTx: string; body: string; bodyTx: string }> = {
  societa: { head: '#e07a54', headTx: '#ffffff', body: '#f4e4cb', bodyTx: '#6a5030' },
  area: { head: '#f2b200', headTx: '#3a2d00', body: '#fbe9b3', bodyTx: '#5c4a12' },
  ruolo: { head: '#f9e4a0', headTx: '#5c4a12', body: '#fdf6d8', bodyTx: '#6b5a1e' },
};

/** Seed fedele alle due immagini (idempotente: id stabili → riesegue senza duplicare). */
function buildGroupSeed(): OrgNode[] {
  const t = Date.now();
  let o = 0;
  const out: OrgNode[] = [];
  const add = (n: Partial<OrgNode> & { id: string; kind: OrgKind; label: string; chart: 'societario' | 'funzionale' }) =>
    out.push({ parentId: null, parents: [], order: t + o++, createdAt: t, ...n } as OrgNode);

  // ---------- ORGANIGRAMMA FUNZIONALE (immagine 1) ----------
  add({ id: 'f-root', kind: 'societa', label: 'Amministratore', person: 'Dario Flore', chart: 'funzionale' });
  const areas: [string, string, string, [string, string][]][] = [
    ['f-hr', 'Risorse Umane', 'Dario Flore', [['HR Manager', 'Dario Flore'], ['Recruiter', 'Dario Flore'], ['Amministrazione del Personale', 'Francesco Zurlo'], ['Consulente del Lavoro', 'Giuseppe Renzulli']]],
    ['f-mkt', 'Marketing', 'Rosa Custodero', [['Marketing Manager', 'Dario Flore'], ['Content Creator', 'Rosa Custodero'], ['Grafico', 'Giorgio Pascali'], ['Social Media Manager', 'Rosa Custodero']]],
    ['f-amm', 'Amministrazione', 'Francesco Zurlo', [['Responsabile Amministrativo', 'Francesco Zurlo'], ['Contabile', 'Francesco Zurlo'], ['Segreteria Amministrativa', 'Francesco Zurlo'], ['Consulente Fiscale / Commercialista', 'Angela Parrella - ST']]],
    ['f-prod', 'Produzione', 'Dario Flore', [['Area Architettonica', ''], ['Area Strutturale', ''], ['Area Energetica', ''], ['Area Design', ''], ['Area Esecutiva', ''], ['Area Sicurezza', ''], ['Area Abilitativa', '']]],
    ['f-comm', 'Commerciale', 'Dario Flore', [['Direttore Commerciale', 'Dario Flore'], ['Account Manager', 'Dario Flore'], ['Sales Support', 'Francesco Zurlo'], ['Customer Care', 'Francesco Zurlo']]],
  ];
  areas.forEach(([aid, alabel, aperson, ruoli]) => {
    add({ id: aid, parents: [{ id: 'f-root' }], kind: 'area', label: alabel, person: aperson || null, chart: 'funzionale' });
    ruoli.forEach(([rlabel, rperson], i) => add({ id: `${aid}-${i}`, parents: [{ id: aid }], kind: 'ruolo', label: rlabel, person: rperson || null, chart: 'funzionale' }));
  });

  // ---------- ORGANIGRAMMA SOCIETARIO: GRUPPO DF (immagine 2) ----------
  add({ id: 's-flore', kind: 'ruolo', label: 'Dario Flore', person: 'Socio unico', identita: 'socio', chart: 'societario' });
  add({ id: 's-holding', kind: 'societa', label: 'DF Holdings S.r.l.', person: 'Società madre', parents: [{ id: 's-flore', quota: 100 }], chart: 'societario' });
  add({ id: 's-onirico', kind: 'societa', label: 'Onirico Design S.T.P. S.r.l.', person: 'Architectural & Design Firm', desc: 'Servizi di Ingegneria e Architettura', parents: [{ id: 's-flore', quota: 67 }, { id: 's-holding', quota: 33 }], chart: 'societario' });
  add({ id: 's-strategico', kind: 'societa', label: 'Strategico S.r.l.', desc: 'Consulenza Aziendale', parents: [{ id: 's-holding', quota: 100 }], chart: 'societario' });
  add({ id: 's-unico', kind: 'societa', label: 'Unico RE S.r.l.', desc: 'Sviluppo Immobiliare', parents: [{ id: 's-holding', quota: 100 }], chart: 'societario' });
  add({ id: 's-epifani', kind: 'ruolo', label: 'Marco Epifani', person: 'Socio', identita: 'socio', chart: 'societario' });
  add({ id: 's-zivoli', kind: 'ruolo', label: 'Raffaele Zivoli', person: 'Socio', identita: 'socio', chart: 'societario' });
  add({ id: 's-materico', kind: 'societa', label: 'Materico S.r.l.', desc: 'Design & Materiali', parents: [{ id: 's-holding', quota: 60 }, { id: 's-epifani', quota: 20 }, { id: 's-zivoli', quota: 20 }], chart: 'societario' });
  return out;
}

// ============================ LAYOUT (grafo a livelli) ============================
interface Pos { x: number; y: number; layer: number; }
interface LEdge { from: string; to: string; quota?: number | null; sx: number; sy: number; ex: number; ey: number; midY: number; }
interface Layout { pos: Map<string, Pos>; edges: LEdge[]; width: number; height: number; }

function computeLayout(items: OrgNode[], collapsed: Record<string, boolean>, NW: number, NH: number, HG: number, VG: number): Layout {
  const byId = new Map(items.map((n) => [n.id, n]));
  const parentsOf = (id: string) => nodeParents(byId.get(id)!).map((p) => p.id).filter((pid) => byId.has(pid));
  const childrenMap = new Map<string, string[]>();
  items.forEach((n) => parentsOf(n.id).forEach((pid) => { const a = childrenMap.get(pid) || []; a.push(n.id); childrenMap.set(pid, a); }));

  // topological order (Kahn, cycle-safe)
  const indeg = new Map<string, number>();
  items.forEach((n) => indeg.set(n.id, parentsOf(n.id).length));
  const q = items.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id);
  const topo: string[] = [];
  while (q.length) { const id = q.shift()!; topo.push(id); (childrenMap.get(id) || []).forEach((c) => { indeg.set(c, (indeg.get(c) || 0) - 1); if ((indeg.get(c) || 0) === 0) q.push(c); }); }
  items.forEach((n) => { if (!topo.includes(n.id)) topo.push(n.id); });

  // visibilità (collapse): nascondi i figli dei nodi compressi
  const visible = new Set<string>();
  topo.forEach((id) => { const ps = parentsOf(id); if (ps.length === 0) visible.add(id); else if (ps.some((p) => visible.has(p) && !collapsed[p])) visible.add(id); });
  const vis = (id: string) => visible.has(id);

  // layering (longest-path dai root) + pull-down delle sorgenti verso i figli
  const layer = new Map<string, number>();
  topo.forEach((id) => { if (!vis(id)) return; const ps = parentsOf(id).filter(vis); layer.set(id, ps.length ? Math.max(...ps.map((p) => layer.get(p) ?? 0)) + 1 : 0); });
  [...topo].reverse().forEach((id) => {
    if (!vis(id)) return;
    const kids = (childrenMap.get(id) || []).filter(vis);
    if (kids.length) {
      const ps = parentsOf(id).filter(vis);
      const lo = ps.length ? Math.max(...ps.map((p) => layer.get(p)!)) + 1 : 0;
      const minChild = Math.min(...kids.map((c) => layer.get(c)!));
      layer.set(id, Math.max(lo, minChild - 1));
    }
  });

  const visItems = topo.filter(vis);
  const maxL = visItems.length ? Math.max(...visItems.map((id) => layer.get(id)!)) : 0;
  const layers: string[][] = Array.from({ length: maxL + 1 }, () => []);
  const ord = (id: string) => { const n = byId.get(id)!; return n.order ?? n.createdAt ?? 0; };
  visItems.slice().sort((a, b) => ord(a) - ord(b)).forEach((id) => layers[layer.get(id)!].push(id));

  // coordinate x via barycenter (median) con risoluzione sovrapposizioni
  const x = new Map<string, number>();
  layers.forEach((row) => row.forEach((id, i) => x.set(id, i * (NW + HG))));
  const median = (arr: number[]) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const resolve = (row: string[]) => { row.sort((a, b) => x.get(a)! - x.get(b)!); for (let i = 1; i < row.length; i++) { const min = x.get(row[i - 1])! + NW + HG; if (x.get(row[i])! < min) x.set(row[i], min); } };
  for (let it = 0; it < 12; it++) {
    for (let L = 1; L <= maxL; L++) { layers[L].forEach((id) => { const ps = parentsOf(id).filter(vis); if (ps.length) x.set(id, median(ps.map((p) => x.get(p)!))); }); resolve(layers[L]); }
    for (let L = maxL - 1; L >= 0; L--) { layers[L].forEach((id) => { const kids = (childrenMap.get(id) || []).filter(vis); if (kids.length) x.set(id, median(kids.map((c) => x.get(c)!))); }); resolve(layers[L]); }
  }
  let minX = Infinity; x.forEach((v) => (minX = Math.min(minX, v))); if (!isFinite(minX)) minX = 0;
  const rowH = NH + VG;
  const pos = new Map<string, Pos>();
  visItems.forEach((id) => pos.set(id, { x: x.get(id)! - minX, y: layer.get(id)! * rowH, layer: layer.get(id)! }));

  // archi con ancore distribuite (più genitori su un figlio, più figli su un genitore)
  const inParents = new Map<string, OrgParentRef[]>();
  const outChildren = new Map<string, string[]>();
  visItems.forEach((id) => {
    const ps = nodeParents(byId.get(id)!).filter((p) => vis(p.id));
    ps.sort((a, b) => pos.get(a.id)!.x - pos.get(b.id)!.x);
    inParents.set(id, ps);
    ps.forEach((p) => { const a = outChildren.get(p.id) || []; a.push(id); outChildren.set(p.id, a); });
  });
  outChildren.forEach((arr) => arr.sort((a, b) => pos.get(a)!.x - pos.get(b)!.x));
  const edges: LEdge[] = [];
  visItems.forEach((id) => {
    const cp = pos.get(id)!;
    const ins = inParents.get(id) || [];
    ins.forEach((pr, ci) => {
      const pp = pos.get(pr.id)!;
      const outs = outChildren.get(pr.id) || [];
      const oi = Math.max(0, outs.indexOf(id));
      const sx = pp.x + (NW * (oi + 1)) / (outs.length + 1);
      const sy = pp.y + NH;
      const ex = cp.x + (NW * (ci + 1)) / (ins.length + 1);
      const ey = cp.y;
      const midY = sy + Math.max(16, (ey - sy) / 2);
      edges.push({ from: pr.id, to: id, quota: pr.quota, sx, sy, ex, ey, midY });
    });
  });
  let width = 0, height = 0;
  pos.forEach((p) => { width = Math.max(width, p.x + NW); height = Math.max(height, p.y + NH); });
  return { pos, edges, width: width + 6, height: height + 6 };
}

export const GovernanceView: React.FC<Props> = ({ org, sops, members, color = '#b45309', canEdit = false, onSaveNode, onDeleteNode, onSeed, onSaveSop, onDeleteSop, onNav }) => {
  const [tab, setTab] = React.useState<'organigramma' | 'mansionari' | 'sop' | 'collegamenti'>('organigramma');
  const nodes = Object.values(org);

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

      {tab === 'organigramma' && <Organigramma nodes={nodes} members={members} canEdit={canEdit} onSaveNode={onSaveNode} onDeleteNode={onDeleteNode} onSeed={onSeed} />}
      {tab === 'mansionari' && <Mansionari nodes={nodes} />}
      {tab === 'sop' && <SopTab sops={sops} canEdit={canEdit} onSaveSop={onSaveSop} onDeleteSop={onDeleteSop} />}
      {tab === 'collegamenti' && <Collegamenti onNav={onNav} color={color} />}
    </div>
  );
};

// ============================ ORGANIGRAMMA ============================
const Organigramma: React.FC<{ nodes: OrgNode[]; members: Member[]; canEdit: boolean; onSaveNode: (n: OrgNode) => void; onDeleteNode: (id: string) => void; onSeed?: (nodes: OrgNode[]) => void }> = ({ nodes, members, canEdit, onSaveNode, onDeleteNode, onSeed }) => {
  const [selId, setSelId] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [chart, setChart] = React.useState<'societario' | 'funzionale'>('funzionale');
  const [zoom, setZoom] = React.useState(1);

  const items = React.useMemo(() => nodes.filter((n) => (n.chart || 'funzionale') === chart), [nodes, chart]);
  const NW = chart === 'societario' ? 210 : 144;
  const NH = chart === 'societario' ? 84 : 54;
  const HG = chart === 'societario' ? 30 : 16;
  const VG = chart === 'societario' ? 64 : 52;
  const layout = React.useMemo(() => computeLayout(items, collapsed, NW, NH, HG, VG), [items, collapsed, NW, NH, HG, VG]);
  const sel = selId ? items.find((n) => n.id === selId) || null : null;
  const childCount = (id: string) => items.filter((n) => nodeParents(n).some((p) => p.id === id)).length;

  const seed = () => { const s = buildGroupSeed(); if (onSeed) onSeed(s); else s.forEach(onSaveNode); };
  const addChild = (parent: OrgNode | null) => {
    const kind: OrgKind = parent ? childKind(parent.kind) : 'societa';
    const n: OrgNode = { id: `org-${Date.now()}-${Math.floor(Math.random() * 900)}`, parentId: parent?.id || null, parents: parent ? [{ id: parent.id }] : [], kind, chart, label: kind === 'societa' ? 'Nuova società' : kind === 'area' ? 'Nuova area' : 'Nuovo ruolo', order: Date.now(), createdAt: Date.now() };
    onSaveNode(n);
    setSelId(n.id);
  };
  const addParent = (node: OrgNode) => {
    const kind: OrgKind = chart === 'societario' ? 'ruolo' : parentKind(node.kind);
    const np: OrgNode = { id: `org-${Date.now()}-${Math.floor(Math.random() * 900)}`, parentId: null, parents: [], kind, chart, label: chart === 'societario' ? 'Nuovo socio' : kind === 'societa' ? 'Nuova società' : 'Nuova area', identita: chart === 'societario' ? 'socio' : null, order: Date.now(), createdAt: Date.now() };
    onSaveNode(np);
    const cur = nodeParents(node);
    onSaveNode({ ...node, parents: [...cur, { id: np.id, quota: null }], parentId: null, updatedAt: Date.now() });
    setSelId(np.id);
  };

  // ---- box render (stile per schema) ----
  const Box: React.FC<{ n: OrgNode }> = ({ n }) => {
    const isSel = selId === n.id;
    if (chart === 'societario') {
      return (
        <div className="w-full h-full rounded-[12px] overflow-hidden flex flex-col bg-white" style={{ boxShadow: isSel ? '0 10px 22px rgba(0,0,0,0.20)' : '0 3px 10px rgba(0,0,0,0.13)', border: isSel ? '2px solid #4338ca' : '1px solid #d6d6d6' }}>
          <div style={{ height: 7, background: 'linear-gradient(180deg,#f4f4f4,#c6c6c6)' }} />
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-1 min-h-0">
            <span className="text-[11px] font-black text-[#2b2b2b] leading-[1.1] uppercase break-words line-clamp-2">{n.label}</span>
            {n.person && <span className="text-[9px] font-bold text-[#7a7a7a] leading-tight mt-0.5">({n.person})</span>}
            {n.desc && <><span className="block w-8 my-1 border-t border-[#e2e2e2]" /><span className="text-[8.5px] text-[#8a8a8a] leading-tight break-words line-clamp-2">{n.desc}</span></>}
          </div>
        </div>
      );
    }
    const s = FUNZ[n.kind];
    return (
      <div className="w-full h-full rounded-[6px] overflow-hidden flex flex-col" style={{ border: isSel ? '2px solid #161616' : '1px solid #c9bda0', boxShadow: isSel ? '0 6px 15px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.12)' }}>
        <div className="flex-1 flex items-center justify-center text-center px-1.5 py-0.5 min-h-0" style={{ background: s.head, color: s.headTx }}>
          <span className="text-[8.5px] font-bold uppercase leading-[1.05] break-words line-clamp-3 tracking-tight">{n.label}</span>
        </div>
        <div className="flex items-center justify-center text-center px-1" style={{ height: 17, background: n.person ? s.body : '#d9d9d9', color: s.bodyTx }}>
          <span className="text-[8px] font-semibold leading-none truncate">{n.person || ' '}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="lg:flex-1 w-full min-w-0 bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm min-h-[440px]">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            {([['funzionale', 'Funzionale'], ['societario', 'Societario']] as const).map(([id, lbl]) => (
              <button key={id} onClick={() => { setChart(id); setSelId(null); }} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none transition-all ${chart === id ? 'bg-[#161616] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] rounded-full text-[11px] font-bold text-[#6b6b6b]">
              <button onClick={() => setCollapsed({})} className="px-2.5 h-7 flex items-center hover:text-[#161616] cursor-pointer bg-transparent border-none">Espandi</button>
              <span className="w-px h-4 bg-[#dcdcdc]" />
              <button onClick={() => { const c: Record<string, boolean> = {}; items.forEach((n) => { if (childCount(n.id)) c[n.id] = true; }); setCollapsed(c); }} className="px-2.5 h-7 flex items-center hover:text-[#161616] cursor-pointer bg-transparent border-none">Comprimi</button>
            </div>
            <div className="inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] rounded-full">
              <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="w-7 h-7 flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] cursor-pointer bg-transparent border-none">−</button>
              <span className="text-[11px] font-bold text-[#6b6b6b] w-9 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} className="w-7 h-7 flex items-center justify-center text-[#6b6b6b] hover:text-[#161616] cursor-pointer bg-transparent border-none">+</button>
            </div>
            {canEdit && (
              <>
                <button onClick={seed} title="Precompila con la struttura delle immagini" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Network className="w-3.5 h-3.5" /> Carica esempio</button>
                <button onClick={() => addChild(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none"><Plus className="w-3.5 h-3.5" /> {chart === 'societario' ? 'Società' : 'Ramo'}</button>
              </>
            )}
          </div>
        </div>

        {layout.pos.size === 0 ? (
          <div className="text-center py-14">
            <Network className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-[#8a8a8a] mb-4">Organigramma {chart} vuoto.{canEdit ? ' Caricalo dalle immagini o aggiungi a mano.' : ''}</p>
            {canEdit && <button onClick={seed} className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Carica organigrammi (come da immagini)</button>}
          </div>
        ) : (
          <OrgCanvas zoom={zoom} depsKey={`${chart}-${items.length}-${Object.keys(collapsed).length}-${Math.round(layout.width)}`}>
            <div style={{ position: 'relative', width: layout.width, height: layout.height }}>
              <svg width={layout.width} height={layout.height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
                <defs>
                  <marker id="og-arrow" markerWidth="9" markerHeight="9" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#9a9a9a" /></marker>
                </defs>
                {layout.edges.map((e, i) => {
                  const vertical = Math.abs(e.ex - e.sx) < 8;
                  const lx = vertical ? e.sx + 13 : (e.sx + e.ex) / 2;
                  const ly = vertical ? (e.sy + e.ey) / 2 : e.midY - 6;
                  return (
                    <g key={i}>
                      <path d={`M ${e.sx} ${e.sy} L ${e.sx} ${e.midY} L ${e.ex} ${e.midY} L ${e.ex} ${e.ey}`} fill="none" stroke="#9a9a9a" strokeWidth={1.5} markerEnd="url(#og-arrow)" />
                      {e.quota != null && <text x={lx} y={ly} textAnchor="middle" style={{ fontSize: 10.5, fontWeight: 800, fill: '#2f2f2f', paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinejoin: 'round' }}>{e.quota}%</text>}
                    </g>
                  );
                })}
              </svg>
              {items.filter((n) => layout.pos.has(n.id)).map((n) => {
                const p = layout.pos.get(n.id)!;
                const kids = childCount(n.id);
                const isCol = !!collapsed[n.id];
                return (
                  <div key={n.id} className="group absolute" style={{ left: p.x, top: p.y, width: NW, height: NH }}>
                    <div onClick={() => setSelId(n.id)} className="w-full h-full cursor-pointer">
                      <Box n={n} />
                    </div>
                    {/* aggiungi genitore (sopra) */}
                    {canEdit && (
                      <button onClick={(e) => { e.stopPropagation(); addParent(n); }} title="Aggiungi genitore (sopra)" className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-[#c9c9c9] text-[#4338ca] flex items-center justify-center shadow-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"><CornerLeftUp className="w-3 h-3" /></button>
                    )}
                    {/* controlli in basso: comprimi + aggiungi figlio */}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                      {kids > 0 && <button onClick={(e) => { e.stopPropagation(); setCollapsed((c) => ({ ...c, [n.id]: !c[n.id] })); }} title={isCol ? `Espandi (${kids})` : 'Comprimi'} className="min-w-5 h-5 px-1 rounded-full bg-white border border-[#c9c9c9] flex items-center justify-center text-[#555] hover:text-[#161616] hover:border-[#161616] shadow-sm cursor-pointer text-[10px] font-black leading-none">{isCol ? `+${kids}` : '−'}</button>}
                      {canEdit && n.kind !== 'ruolo' && <button onClick={(e) => { e.stopPropagation(); addChild(n); }} title="Aggiungi figlio (sotto)" className="w-5 h-5 rounded-full bg-[#161616] text-white flex items-center justify-center hover:bg-black shadow-sm cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="w-3 h-3" /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </OrgCanvas>
        )}
      </div>

      {/* Pannello dettaglio nodo */}
      <div className="lg:w-[340px] w-full lg:sticky lg:top-4 bg-white border border-[#e2e2e2] rounded-[22px] p-4 shadow-sm">
        {!sel ? (
          <p className="text-[13px] text-[#9a9a9a] text-center py-10 leading-relaxed">Seleziona un box per modificarlo.<br /><span className="text-[11.5px]">In hover su un box: <b className="text-[#4338ca]">↰</b> aggiunge un <b>genitore</b> sopra, <b className="text-[#161616]">＋</b> un <b>figlio</b> sotto, <b>−</b> comprime.</span></p>
        ) : (
          <NodeEditor key={sel.id} node={sel} allNodes={items} members={members} canEdit={canEdit} onSave={onSaveNode} onDelete={(id) => { onDeleteNode(id); setSelId(null); }} hasChildren={childCount(sel.id) > 0} onAddChild={() => addChild(sel)} onAddParent={() => addParent(sel)} />
        )}
      </div>
    </div>
  );
};

/** Canvas che rimpicciolisce lo schema per farlo stare nella larghezza disponibile (auto-fit). */
const OrgCanvas: React.FC<{ zoom: number; depsKey: string; children: React.ReactNode }> = ({ zoom, depsKey, children }) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState(1);
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [avail, setAvail] = React.useState(0);

  React.useLayoutEffect(() => {
    const measure = () => {
      const a = wrapRef.current?.clientWidth ?? 0;
      const nat = innerRef.current?.scrollWidth ?? 0;
      const natH = innerRef.current?.scrollHeight ?? 0;
      setAvail(a);
      setSize({ w: nat, h: natH });
      setFit(nat > 0 && a > 0 ? Math.min(1, a / nat) : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [depsKey]);

  const scale = fit * zoom;
  const scaledW = size.w * scale;
  const scaledH = size.h * scale;
  const overflowX = scaledW > avail + 1;
  return (
    <div ref={wrapRef} style={{ overflowX: overflowX ? 'auto' : 'hidden', overflowY: 'auto', maxHeight: '74vh' }}>
      <div style={{ width: scaledW ? scaledW : '100%', height: scaledH || undefined, margin: '0 auto', position: 'relative' }}>
        <div ref={innerRef} style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const NodeEditor: React.FC<{ node: OrgNode; allNodes: OrgNode[]; members: Member[]; canEdit: boolean; onSave: (n: OrgNode) => void; onDelete: (id: string) => void; hasChildren: boolean; onAddChild?: () => void; onAddParent?: () => void }> = ({ node, allNodes, members, canEdit, onSave, onDelete, hasChildren, onAddChild, onAddParent }) => {
  const [d, setD] = React.useState<OrgNode>({ ...node, parents: nodeParents(node) });
  React.useEffect(() => setD({ ...node, parents: nodeParents(node) }), [node]);
  const meta = KIND_META[node.kind];
  const set = (c: Partial<OrgNode>) => setD((p) => ({ ...p, ...c }));
  const save = () => onSave({ ...d, parentId: (d.parents && d.parents.length === 1) ? d.parents[0].id : null, updatedAt: Date.now() });
  const Lbl: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">{children}</span>;
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  const nameOf = (id: string) => allNodes.find((n) => n.id === id)?.label || '—';
  const setParentQuota = (pid: string, q: string) => setD((p) => ({ ...p, parents: (p.parents || []).map((x) => (x.id === pid ? { ...x, quota: q === '' ? null : Number(q) } : x)) }));
  const removeParent = (pid: string) => setD((p) => ({ ...p, parents: (p.parents || []).filter((x) => x.id !== pid) }));
  // candidati per collegare un genitore esistente: stesso schema, non se stesso, non già genitore, non discendente (anti-ciclo)
  const descendants = React.useMemo(() => {
    const set2 = new Set<string>([node.id]);
    let grow = true;
    while (grow) { grow = false; allNodes.forEach((n) => { if (!set2.has(n.id) && nodeParents(n).some((p) => set2.has(p.id))) { set2.add(n.id); grow = true; } }); }
    return set2;
  }, [allNodes, node.id]);
  const linkCandidates = allNodes.filter((n) => !descendants.has(n.id) && !(d.parents || []).some((p) => p.id === n.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${meta.color}14`, color: meta.color }}>{meta.label}</span>
        {canEdit && <button onClick={() => onDelete(node.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer bg-transparent border-none" title={hasChildren ? 'Elimina (ripulisce i riferimenti nei figli)' : 'Elimina'}><Trash2 className="w-4 h-4" /></button>}
      </div>

      <label className="flex flex-col gap-1"><Lbl>Tipo</Lbl>
        <select disabled={!canEdit} value={d.kind} onChange={(e) => set({ kind: e.target.value as OrgKind })} className={inp}>
          <option value="societa">Società / Ente</option><option value="area">Area</option><option value="ruolo">Ruolo / Persona</option>
        </select>
      </label>
      <label className="flex flex-col gap-1"><Lbl>Nome</Lbl><input disabled={!canEdit} value={d.label} onChange={(e) => set({ label: e.target.value })} className={inp} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><Lbl>Persona / sottotitolo</Lbl><input disabled={!canEdit} value={d.person || ''} onChange={(e) => set({ person: e.target.value })} className={inp} placeholder="Nome" /></label>
        <label className="flex flex-col gap-1"><Lbl>Account team</Lbl>
          <select disabled={!canEdit} value={d.personUid || ''} onChange={(e) => { const m = members.find((x) => x.uid === e.target.value); set({ personUid: e.target.value || null, person: m ? m.name : d.person }); }} className={inp}>
            <option value="">—</option>{members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1"><Lbl>Descrizione / settore</Lbl><input disabled={!canEdit} value={d.desc || ''} onChange={(e) => set({ desc: e.target.value || null })} className={inp} placeholder="Es. Servizi di Ingegneria e Architettura" /></label>

      {/* Genitori (con quota sull'arco) */}
      <div className="flex flex-col gap-1.5">
        <Lbl>Genitori & quote %</Lbl>
        {(d.parents || []).length === 0 && <p className="text-[11.5px] text-[#b0b0b0] italic">Nessun genitore (nodo radice).</p>}
        {(d.parents || []).map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className="flex-1 text-[12px] font-semibold text-[#333] truncate bg-gray-50 border border-[#eee] rounded-lg px-2 py-1.5">{nameOf(p.id)}</span>
            <input disabled={!canEdit} type="number" value={p.quota ?? ''} onChange={(e) => setParentQuota(p.id, e.target.value)} placeholder="%" className="w-14 px-2 py-1.5 rounded-lg border border-[#e2e2e2] text-[12px] text-center outline-none focus:border-[#161616] bg-white" />
            {canEdit && <button onClick={() => removeParent(p.id)} className="text-rose-400 hover:text-rose-600 cursor-pointer bg-transparent border-none" title="Scollega"><X className="w-4 h-4" /></button>}
          </div>
        ))}
        {canEdit && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <button onClick={() => onAddParent?.()} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#4338ca] hover:bg-[#372fae] text-white text-[11.5px] font-bold cursor-pointer border-none"><CornerLeftUp className="w-3.5 h-3.5" /> Nuovo genitore</button>
            <select value="" onChange={(e) => { if (e.target.value) setD((prev) => ({ ...prev, parents: [...(prev.parents || []), { id: e.target.value, quota: null }] })); }} className="flex-1 px-2 py-1.5 rounded-lg border border-[#e2e2e2] text-[12px] outline-none focus:border-[#161616] bg-white">
              <option value="">＋ Collega esistente…</option>
              {linkCandidates.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
        )}
      </div>

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
          {node.kind !== 'ruolo' && onAddChild && <button onClick={onAddChild} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12.5px] font-bold cursor-pointer"><Plus className="w-3.5 h-3.5" /> Aggiungi figlio</button>}
        </div>
      )}
    </div>
  );
};

// ============================ MANSIONARI & PFV ============================
const Mansionari: React.FC<{ nodes: OrgNode[] }> = ({ nodes }) => {
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
