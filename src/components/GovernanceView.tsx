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
  Award, BookOpen, X, Pencil, CornerLeftUp,
  Users, Lock, KeyRound, Eye, EyeOff, Globe, Wrench, ExternalLink, Copy, Search,
} from 'lucide-react';
import { safeUrl } from '../utils';
import type { OrgNode, OrgKind, OrgIdentita, OrgParentRef, GovernanceSop, GovernanceMansionario, VaultEntry, VaultConfig, VaultCategory } from '../types';

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
  // Mansionari (CRUD)
  mansionari?: Record<string, GovernanceMansionario>;
  onSaveMansionario?: (m: GovernanceMansionario) => void;
  onDeleteMansionario?: (id: string) => void;
  // Cassaforte password
  vault?: Record<string, VaultEntry>;
  vaultConfig?: VaultConfig;
  onSaveVaultEntry?: (e: VaultEntry) => void;
  onDeleteVaultEntry?: (id: string) => void;
  onSetVaultConfig?: (cfg: VaultConfig) => Promise<any>;
  // Team & permessi (embedded)
  teamSlot?: React.ReactNode;
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
interface LEdge { from: string; to: string; quota?: number | null; sx: number; sy: number; ex: number; ey: number; midY: number; left?: boolean; }
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

/** Layout ad ALBERO che cresce anche in VERTICALE: i gruppi di sole foglie vengono impilati
 * in colonna sotto il genitore (riduce la larghezza, molto più leggibile). Genitore primario =
 * il più "profondo" tra i genitori; gli altri restano come archi secondari (con %). */
function computeTreeLayout(items: OrgNode[], collapsed: Record<string, boolean>, NW: number, NH: number): Layout {
  const byId = new Map(items.map((n) => [n.id, n]));
  const parentsAll = (n: OrgNode) => nodeParents(n).map((p) => p.id).filter((id) => byId.has(id));
  // profondità (longest path) per scegliere il genitore primario
  const depth = new Map<string, number>();
  const depthOf = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const ps = parentsAll(byId.get(id)!);
    const d = ps.length ? Math.max(...ps.map((p) => depthOf(p, seen))) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  items.forEach((n) => depthOf(n.id));
  const primaryParent = (n: OrgNode): string | null => {
    const ps = parentsAll(n);
    if (!ps.length) return null;
    return ps.slice().sort((a, b) => (depth.get(b)! - depth.get(a)!))[0];
  };
  const order = (id: string) => { const n = byId.get(id)!; return n.order ?? n.createdAt ?? 0; };
  const childrenMap = new Map<string, string[]>();
  items.forEach((n) => { const p = primaryParent(n); if (p) { const a = childrenMap.get(p) || []; a.push(n.id); childrenMap.set(p, a); } });
  const kidsOf = (id: string) => (collapsed[id] ? [] : (childrenMap.get(id) || []).slice().sort((a, b) => order(a) - order(b)));
  const roots = items.filter((n) => !primaryParent(n)).map((n) => n.id).sort((a, b) => order(a) - order(b));

  const VGAP = 46, HGAP = 22, SVGAP = 12, SINDENT = 24, STACK_MIN = 3;
  const subW = new Map<string, number>(), subH = new Map<string, number>();
  const stacked = new Set<string>();
  const measure = (id: string) => {
    const kids = kidsOf(id);
    if (!kids.length) { subW.set(id, NW); subH.set(id, NH); return; }
    kids.forEach(measure);
    const allLeaves = kids.every((k) => kidsOf(k).length === 0);
    if (allLeaves && kids.length >= STACK_MIN) {
      stacked.add(id);
      subW.set(id, SINDENT + NW);
      subH.set(id, NH + kids.length * (NH + SVGAP));
    } else {
      const w = kids.reduce((s, k) => s + subW.get(k)!, 0) + (kids.length - 1) * HGAP;
      subW.set(id, Math.max(NW, w));
      subH.set(id, NH + VGAP + Math.max(...kids.map((k) => subH.get(k)!)));
    }
  };
  roots.forEach(measure);

  const pos = new Map<string, Pos>();
  const place = (id: string, left: number, top: number) => {
    const kids = kidsOf(id);
    const w = subW.get(id)!;
    if (!kids.length) { pos.set(id, { x: left + (w - NW) / 2, y: top, layer: 0 }); return; }
    if (stacked.has(id)) {
      pos.set(id, { x: left, y: top, layer: 0 });
      let cy = top + NH + SVGAP;
      kids.forEach((k) => { pos.set(k, { x: left + SINDENT, y: cy, layer: 0 }); cy += NH + SVGAP; });
      return;
    }
    const childY = top + NH + VGAP;
    let cx = left;
    kids.forEach((k) => { place(k, cx, childY); cx += subW.get(k)! + HGAP; });
    const fk = pos.get(kids[0])!, lk = pos.get(kids[kids.length - 1])!;
    const center = ((fk.x + NW / 2) + (lk.x + NW / 2)) / 2;
    pos.set(id, { x: center - NW / 2, y: top, layer: 0 });
  };
  let rx = 0;
  roots.forEach((r) => { place(r, rx, 0); rx += subW.get(r)! + HGAP * 2; });

  const visible = new Set(pos.keys());
  const edges: LEdge[] = [];
  items.forEach((n) => {
    if (!visible.has(n.id)) return;
    const cp = pos.get(n.id)!;
    const ps = nodeParents(n).filter((p) => visible.has(p.id));
    ps.forEach((pr, ci) => {
      const pp = pos.get(pr.id)!;
      const leftEntry = stacked.has(pr.id) && primaryParent(n) === pr.id;
      if (leftEntry) {
        const sx = pp.x + SINDENT / 2, sy = pp.y + NH, ey = cp.y + NH / 2, ex = cp.x;
        edges.push({ from: pr.id, to: n.id, quota: pr.quota, sx, sy, ex, ey, midY: ey, left: true });
      } else {
        const sx = pp.x + NW / 2, sy = pp.y + NH;
        const ex = cp.x + (NW * (ci + 1)) / (ps.length + 1), ey = cp.y;
        const midY = sy + Math.max(14, (ey - sy) / 2);
        edges.push({ from: pr.id, to: n.id, quota: pr.quota, sx, sy, ex, ey, midY });
      }
    });
  });

  let minX = Infinity; pos.forEach((p) => (minX = Math.min(minX, p.x))); if (!isFinite(minX)) minX = 0;
  let width = 0, height = 0;
  pos.forEach((p, k) => { const np = { ...p, x: p.x - minX }; pos.set(k, np); width = Math.max(width, np.x + NW); height = Math.max(height, np.y + NH); });
  if (minX !== 0) edges.forEach((e) => { e.sx -= minX; e.ex -= minX; });
  return { pos, edges, width: width + 6, height: height + 6 };
}

export const GovernanceView: React.FC<Props> = ({ org, sops, members, canEdit = false, onSaveNode, onDeleteNode, onSeed, onSaveSop, onDeleteSop, mansionari = {}, onSaveMansionario, onDeleteMansionario, vault = {}, vaultConfig = {}, onSaveVaultEntry, onDeleteVaultEntry, onSetVaultConfig, teamSlot }) => {
  const [tab, setTab] = React.useState<'organigramma' | 'mansionari' | 'sop' | 'team' | 'password'>('organigramma');
  const nodes = Object.values(org);

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><Network className="w-5.5 h-5.5" /> Governance & Organizzazione</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Chi fa cosa nel gruppo: organigrammi, mansionari, procedure, team e credenziali.</p>
        </div>
      </div>

      <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start flex-wrap">
        {([['organigramma', 'Organigramma', Network], ['mansionari', 'Mansionari & PFV', Award], ['sop', 'Procedure (SOP)', BookOpen], ['team', 'Team & Permessi', Users], ['password', 'Password', KeyRound]] as const).map(([id, lbl, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all ${tab === id ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
            <Icon className="w-3.5 h-3.5" /> {lbl}
          </button>
        ))}
      </div>

      {tab === 'organigramma' && <Organigramma nodes={nodes} members={members} canEdit={canEdit} onSaveNode={onSaveNode} onDeleteNode={onDeleteNode} onSeed={onSeed} />}
      {tab === 'mansionari' && <Mansionari nodes={nodes} mansionari={mansionari} canEdit={canEdit} onSave={onSaveMansionario} onDelete={onDeleteMansionario} />}
      {tab === 'sop' && <SopTab sops={sops} canEdit={canEdit} onSaveSop={onSaveSop} onDeleteSop={onDeleteSop} />}
      {tab === 'team' && <div>{teamSlot || <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Sezione Team non disponibile.</p>}</div>}
      {tab === 'password' && <PasswordVault vault={vault} config={vaultConfig} canEdit={canEdit} onSave={onSaveVaultEntry} onDelete={onDeleteVaultEntry} onSetConfig={onSetVaultConfig} />}
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
  const NW = chart === 'societario' ? 204 : 172;
  const NH = chart === 'societario' ? 84 : 62;
  const HG = chart === 'societario' ? 30 : 18;
  const VG = chart === 'societario' ? 64 : 50;
  // Societario = grafo (più genitori, % sugli archi). Funzionale = albero che cresce anche in verticale.
  const layout = React.useMemo(
    () => (chart === 'societario' ? computeLayout(items, collapsed, NW, NH, HG, VG) : computeTreeLayout(items, collapsed, NW, NH)),
    [items, collapsed, chart, NW, NH, HG, VG],
  );
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

  // ---- box render UNIFICATO (stesso stile nei due schemi) ----
  const Box: React.FC<{ n: OrgNode }> = ({ n }) => {
    const isSel = selId === n.id;
    const meta = KIND_META[n.kind];
    const Icon = meta.icon;
    return (
      <div className="w-full h-full rounded-[14px] bg-white flex flex-col items-center justify-center text-center px-2.5 pt-2.5 pb-1.5 relative" style={{ border: isSel ? `2px solid ${meta.color}` : '1px solid #e2e2e2', boxShadow: isSel ? `0 8px 18px ${meta.color}26` : '0 2px 8px rgba(0,0,0,0.08)' }}>
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm shrink-0" style={{ background: meta.color, color: '#fff' }}><Icon className="w-3.5 h-3.5" /></span>
        <span className="text-[12px] font-extrabold text-[#161616] leading-[1.12] mt-1 break-words line-clamp-2">{n.label}</span>
        {n.person && <span className="text-[10px] text-[#6b6b6b] font-semibold leading-tight mt-0.5 break-words line-clamp-1">{n.person}</span>}
        {n.desc && <span className="text-[9px] text-[#9a9a9a] leading-tight mt-0.5 break-words line-clamp-1">{n.desc}</span>}
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
                  const d = e.left
                    ? `M ${e.sx} ${e.sy} L ${e.sx} ${e.ey} L ${e.ex} ${e.ey}`
                    : `M ${e.sx} ${e.sy} L ${e.sx} ${e.midY} L ${e.ex} ${e.midY} L ${e.ex} ${e.ey}`;
                  const vertical = !e.left && Math.abs(e.ex - e.sx) < 8;
                  const lx = e.left ? e.sx + 12 : vertical ? e.sx + 13 : (e.sx + e.ex) / 2;
                  const ly = e.left ? e.ey - 5 : vertical ? (e.sy + e.ey) / 2 : e.midY - 6;
                  return (
                    <g key={i}>
                      <path d={d} fill="none" stroke="#9a9a9a" strokeWidth={1.5} markerEnd="url(#og-arrow)" />
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

// ============================ MANSIONARI & PFV (CRUD) ============================
const Mansionari: React.FC<{ nodes: OrgNode[]; mansionari: Record<string, GovernanceMansionario>; canEdit: boolean; onSave?: (m: GovernanceMansionario) => void; onDelete?: (id: string) => void }> = ({ nodes, mansionari, canEdit, onSave, onDelete }) => {
  const [editing, setEditing] = React.useState<GovernanceMansionario | null>(null);
  const list = Object.values(mansionari).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
  const blank = (): GovernanceMansionario => ({ id: `mans-${Date.now()}`, role: '', person: null, area: null, identita: null, mansioni: null, pfv: null, requisiti: null, order: Date.now(), createdAt: Date.now() });
  // Ruoli presenti nell'organigramma non ancora codificati → import rapido come mansionario.
  const orgRoles = nodes.filter((n) => n.kind === 'ruolo');
  const importable = orgRoles.filter((r) => !list.some((m) => m.role.trim().toLowerCase() === r.label.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuovo mansionario</button>
          {importable.length > 0 && (
            <select value="" onChange={(e) => { const r = orgRoles.find((x) => x.id === e.target.value); if (r && onSave) onSave({ id: `mans-${Date.now()}`, role: r.label, person: r.person || null, area: null, identita: r.identita || null, mansioni: r.mansioni || null, pfv: r.pfv || null, requisiti: null, order: Date.now(), createdAt: Date.now() }); }} className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-semibold bg-white outline-none focus:border-[#161616] cursor-pointer">
              <option value="">＋ Importa da organigramma…</option>
              {importable.map((r) => <option key={r.id} value={r.id}>{r.label}{r.person ? ` · ${r.person}` : ''}</option>)}
            </select>
          )}
        </div>
      )}
      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Nessun mansionario.{canEdit ? ' Crea il primo o importalo dall\'organigramma.' : ''}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((m) => (
            <div key={m.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-[14px] text-[#161616]">{m.role || 'Senza titolo'}</b>
                  {(m.person || m.area) && <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">{[m.person, m.area].filter(Boolean).join(' · ')}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {m.identita && <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{m.identita}</span>}
                  {canEdit && <><button onClick={() => setEditing(m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete?.(m.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button></>}
                </div>
              </div>
              {m.mansioni && <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">Mansioni</p><p className="text-[12.5px] text-[#333] leading-relaxed whitespace-pre-line">{m.mansioni}</p></div>}
              {m.pfv && <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">PFV</p><p className="text-[12.5px] text-[#161616] font-medium italic">{m.pfv}</p></div>}
              {m.requisiti && <div><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase">Requisiti</p><p className="text-[12.5px] text-[#555] leading-relaxed whitespace-pre-line">{m.requisiti}</p></div>}
            </div>
          ))}
        </div>
      )}
      {editing && onSave && <MansionarioEditor mans={editing} onClose={() => setEditing(null)} onSave={(m) => { onSave(m); setEditing(null); }} />}
    </div>
  );
};

const MansionarioEditor: React.FC<{ mans: GovernanceMansionario; onClose: () => void; onSave: (m: GovernanceMansionario) => void }> = ({ mans, onClose, onSave }) => {
  const [d, setD] = React.useState<GovernanceMansionario>(mans);
  const set = (c: Partial<GovernanceMansionario>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[88vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616]">{mans.role ? 'Modifica mansionario' : 'Nuovo mansionario'}</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <input value={d.role} onChange={(e) => set({ role: e.target.value })} placeholder="Ruolo / figura (es. Responsabile Rilievi)" className={inp} />
          <div className="grid grid-cols-2 gap-2">
            <input value={d.person || ''} onChange={(e) => set({ person: e.target.value || null })} placeholder="Persona" className={inp} />
            <input value={d.area || ''} onChange={(e) => set({ area: e.target.value || null })} placeholder="Area / società" className={inp} />
          </div>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Identità societaria</span>
            <select value={d.identita || ''} onChange={(e) => set({ identita: (e.target.value || null) as any })} className={inp}>
              <option value="">—</option>{IDENTITA.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Mansioni (compiti & responsabilità)</span><textarea value={d.mansioni || ''} onChange={(e) => set({ mansioni: e.target.value || null })} rows={4} className={`${inp} resize-none`} /></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">PFV — Prodotto Finale di Valore</span><textarea value={d.pfv || ''} onChange={(e) => set({ pfv: e.target.value || null })} rows={2} className={`${inp} resize-none`} placeholder="Es. l'emozione suscitata nel cliente" /></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Requisiti / competenze</span><textarea value={d.requisiti || ''} onChange={(e) => set({ requisiti: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
          <button onClick={() => onSave({ ...d, role: d.role.trim(), updatedAt: Date.now() })} disabled={!d.role.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva mansionario</button>
        </div>
      </div>
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

// ============================ CASSAFORTE PASSWORD ============================
const VAULT_CATS: { id: VaultCategory; label: string; icon: any }[] = [
  { id: 'sito', label: 'Siti', icon: Globe },
  { id: 'portale', label: 'Portali', icon: ExternalLink },
  { id: 'software', label: 'Software', icon: Wrench },
  { id: 'strumento', label: 'Strumenti', icon: KeyRound },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'altro', label: 'Altro', icon: Lock },
];
const catMeta = (c?: VaultCategory) => VAULT_CATS.find((x) => x.id === c) || VAULT_CATS[5];

/** SHA-256(salt + password) → hex. Gate soft (i dati restano leggibili in DB da chi ha i permessi). */
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const randSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, '0')).join('');

const PasswordVault: React.FC<{ vault: Record<string, VaultEntry>; config: VaultConfig; canEdit: boolean; onSave?: (e: VaultEntry) => void; onDelete?: (id: string) => void; onSetConfig?: (cfg: VaultConfig) => Promise<any> }> = ({ vault, config, canEdit, onSave, onDelete, onSetConfig }) => {
  const [unlocked, setUnlocked] = React.useState(false);
  const hasPass = !!config.passHash;

  if (!unlocked) return <VaultLock config={config} canEdit={canEdit} onUnlock={() => setUnlocked(true)} onSetConfig={onSetConfig} />;
  return <VaultContents vault={vault} canEdit={canEdit} hasPass={hasPass} onSave={onSave} onDelete={onDelete} onSetConfig={onSetConfig} onLock={() => setUnlocked(true)} />;
};

const VaultLock: React.FC<{ config: VaultConfig; canEdit: boolean; onUnlock: () => void; onSetConfig?: (cfg: VaultConfig) => Promise<any> }> = ({ config, canEdit, onUnlock, onSetConfig }) => {
  const [pass, setPass] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [setup, setSetup] = React.useState(false); // schermata "imposta/reimposta password" (admin)
  const [np1, setNp1] = React.useState('');
  const [np2, setNp2] = React.useState('');
  const hasPass = !!config.passHash;

  const tryUnlock = async () => {
    setErr(''); setBusy(true);
    try {
      const h = await sha256Hex((config.salt || '') + pass);
      if (h === config.passHash) onUnlock();
      else setErr('Password errata.');
    } finally { setBusy(false); }
  };
  const saveNew = async () => {
    if (np1.length < 4) { setErr('Minimo 4 caratteri.'); return; }
    if (np1 !== np2) { setErr('Le due password non coincidono.'); return; }
    setErr(''); setBusy(true);
    try {
      const salt = randSalt();
      const passHash = await sha256Hex(salt + np1);
      await onSetConfig?.({ salt, passHash });
      onUnlock();
    } catch { setErr('Errore salvataggio.'); } finally { setBusy(false); }
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[14px] outline-none focus:border-[#161616] bg-white';
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-8 shadow-sm max-w-md mx-auto flex flex-col items-center text-center gap-3">
      <span className="w-14 h-14 rounded-2xl bg-[#161616] text-white flex items-center justify-center"><Lock className="w-6 h-6" /></span>
      <h3 className="text-[18px] font-extrabold text-[#161616]">Cassaforte password</h3>
      {!hasPass && !setup && (
        <>
          <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed">Nessuna password di sezione impostata.{canEdit ? ' Impostane una per proteggere le credenziali.' : ' Chiedi a un amministratore di impostarla.'}</p>
          {canEdit && <button onClick={() => { setSetup(true); setErr(''); }} className="mt-1 px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Imposta password</button>}
        </>
      )}
      {hasPass && !setup && (
        <>
          <p className="text-[12.5px] text-[#8a8a8a]">Inserisci la password per accedere alle credenziali.</p>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') tryUnlock(); }} placeholder="Password sezione" className={inp} autoFocus />
          {err && <p className="text-[12px] text-rose-600 font-semibold">{err}</p>}
          <button onClick={tryUnlock} disabled={busy || !pass} className="w-full px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Sblocca</button>
          {canEdit && <button onClick={() => { setSetup(true); setErr(''); setNp1(''); setNp2(''); }} className="text-[11.5px] font-semibold text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none">Reimposta password (amministratore)</button>}
        </>
      )}
      {setup && canEdit && (
        <>
          <p className="text-[12.5px] text-[#8a8a8a]">{hasPass ? 'Reimposta la password di sezione.' : 'Imposta la password di sezione.'} Modificabile in seguito dal profilo amministratori.</p>
          <input type="password" value={np1} onChange={(e) => setNp1(e.target.value)} placeholder="Nuova password" className={inp} autoFocus />
          <input type="password" value={np2} onChange={(e) => setNp2(e.target.value)} placeholder="Ripeti password" className={inp} />
          {err && <p className="text-[12px] text-rose-600 font-semibold">{err}</p>}
          <div className="flex items-center gap-2 w-full">
            <button onClick={() => { setSetup(false); setErr(''); }} className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[13px] font-bold cursor-pointer">Annulla</button>
            <button onClick={saveNew} disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva</button>
          </div>
        </>
      )}
      <p className="text-[10.5px] text-[#b8b8b8] leading-relaxed mt-1">Protezione di livello UI: le credenziali sono condivise nel gruppo. Non inserire qui password personali/bancarie critiche.</p>
    </div>
  );
};

const VaultContents: React.FC<{ vault: Record<string, VaultEntry>; canEdit: boolean; hasPass: boolean; onSave?: (e: VaultEntry) => void; onDelete?: (id: string) => void; onSetConfig?: (cfg: VaultConfig) => Promise<any>; onLock: () => void }> = ({ vault, canEdit, hasPass, onSave, onDelete, onSetConfig, onLock }) => {
  const [editing, setEditing] = React.useState<VaultEntry | null>(null);
  const [reveal, setReveal] = React.useState<Record<string, boolean>>({});
  const [query, setQuery] = React.useState('');
  const [cat, setCat] = React.useState<'all' | VaultCategory>('all');
  const [copied, setCopied] = React.useState<string>('');
  const [chgPass, setChgPass] = React.useState(false);
  const list = Object.values(vault)
    .filter((e) => (cat === 'all' || (e.category || 'altro') === cat))
    .filter((e) => { const q = query.trim().toLowerCase(); if (!q) return true; return [e.label, e.username, e.url, e.note].filter(Boolean).some((s) => (s as string).toLowerCase().includes(q)); })
    .sort((a, b) => a.label.localeCompare(b.label));
  const blank = (): VaultEntry => ({ id: `vault-${Date.now()}`, label: '', category: 'sito', url: null, username: null, password: null, note: null, createdAt: Date.now() });
  const copy = (txt: string, key: string) => { navigator.clipboard?.writeText(txt).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1200); }).catch(() => {}); };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca credenziale…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> Nuova credenziale</button>}
          {canEdit && onSetConfig && <button onClick={() => setChgPass(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><KeyRound className="w-3.5 h-3.5" /> Password sezione</button>}
          <button onClick={onLock} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-black text-[#161616] text-[12px] font-bold cursor-pointer"><Lock className="w-3.5 h-3.5" /> Blocca</button>
        </div>
      </div>

      <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start flex-wrap">
        {([['all', 'Tutte'] as const, ...VAULT_CATS.map((c) => [c.id, c.label] as const)]).map(([id, lbl]) => (
          <button key={id} onClick={() => setCat(id as any)} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none transition-all ${cat === id ? 'bg-[#161616] text-white shadow-xs' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>{lbl}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[22px] p-8 text-center">Nessuna credenziale{query || cat !== 'all' ? ' per il filtro attivo' : ''}.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((e) => {
            const m = catMeta(e.category); const Icon = m.icon; const url = e.url ? safeUrl(e.url) : null; const shown = reveal[e.id];
            return (
              <div key={e.id} className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[#161616]/[0.06] text-[#161616] flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
                    <div className="min-w-0">
                      <b className="text-[13.5px] text-[#161616] truncate block">{e.label || 'Senza nome'}</b>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">{m.label}</span>
                    </div>
                  </div>
                  {canEdit && <div className="flex items-center gap-1 shrink-0"><button onClick={() => setEditing(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete?.(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3.5 h-3.5" /></button></div>}
                </div>
                {url && <a href={url} target="_blank" rel="noreferrer" className="text-[12px] text-indigo-600 hover:underline inline-flex items-center gap-1 truncate"><ExternalLink className="w-3 h-3 shrink-0" /> {e.url}</a>}
                {e.username && (
                  <div className="flex items-center justify-between gap-2 bg-gray-50 border border-[#eee] rounded-lg px-2.5 py-1.5">
                    <span className="text-[12px] text-[#333] truncate"><span className="text-[#a0a0a0]">Utente:</span> {e.username}</span>
                    <button onClick={() => copy(e.username!, `u-${e.id}`)} className="text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none shrink-0" title="Copia utente">{copied === `u-${e.id}` ? <span className="text-[10px] font-bold text-emerald-600">✓</span> : <Copy className="w-3.5 h-3.5" />}</button>
                  </div>
                )}
                {e.password && (
                  <div className="flex items-center justify-between gap-2 bg-gray-50 border border-[#eee] rounded-lg px-2.5 py-1.5">
                    <span className="text-[12px] text-[#333] font-mono truncate">{shown ? e.password : '•'.repeat(Math.min(12, e.password.length))}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setReveal((r) => ({ ...r, [e.id]: !r[e.id] }))} className="text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none" title={shown ? 'Nascondi' : 'Mostra'}>{shown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => copy(e.password!, `p-${e.id}`)} className="text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none" title="Copia password">{copied === `p-${e.id}` ? <span className="text-[10px] font-bold text-emerald-600">✓</span> : <Copy className="w-3.5 h-3.5" />}</button>
                    </div>
                  </div>
                )}
                {e.note && <p className="text-[11.5px] text-[#8a8a8a] leading-relaxed">{e.note}</p>}
              </div>
            );
          })}
        </div>
      )}

      {editing && onSave && <VaultEditor entry={editing} onClose={() => setEditing(null)} onSave={(e) => { onSave(e); setEditing(null); }} />}
      {chgPass && onSetConfig && <VaultChangePass onClose={() => setChgPass(false)} onSetConfig={onSetConfig} />}
    </div>
  );
};

const VaultEditor: React.FC<{ entry: VaultEntry; onClose: () => void; onSave: (e: VaultEntry) => void }> = ({ entry, onClose, onSave }) => {
  const [d, setD] = React.useState<VaultEntry>(entry);
  const [show, setShow] = React.useState(false);
  const set = (c: Partial<VaultEntry>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[88vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616]">{entry.label ? 'Modifica credenziale' : 'Nuova credenziale'}</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <input value={d.label} onChange={(e) => set({ label: e.target.value })} placeholder="Nome (es. Google Workspace, Instagram, AutoCAD)" className={inp} />
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Categoria</span>
            <select value={d.category || 'sito'} onChange={(e) => set({ category: e.target.value as VaultCategory })} className={inp}>{VAULT_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </label>
          <input value={d.url || ''} onChange={(e) => set({ url: e.target.value || null })} placeholder="URL / link (https://…)" className={inp} />
          <input value={d.username || ''} onChange={(e) => set({ username: e.target.value || null })} placeholder="Utente / email" className={inp} />
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={d.password || ''} onChange={(e) => set({ password: e.target.value || null })} placeholder="Password / chiave" className={`${inp} pr-10`} />
            <button onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#161616] cursor-pointer bg-transparent border-none">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <textarea value={d.note || ''} onChange={(e) => set({ note: e.target.value || null })} placeholder="Note (2FA, recupero, riferimenti…)" rows={2} className={`${inp} resize-none`} />
          <button onClick={() => onSave({ ...d, label: d.label.trim(), updatedAt: Date.now() })} disabled={!d.label.trim()} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva credenziale</button>
        </div>
      </div>
    </div>
  );
};

const VaultChangePass: React.FC<{ onClose: () => void; onSetConfig: (cfg: VaultConfig) => Promise<any> }> = ({ onClose, onSetConfig }) => {
  const [np1, setNp1] = React.useState(''); const [np2, setNp2] = React.useState('');
  const [err, setErr] = React.useState(''); const [busy, setBusy] = React.useState(false);
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[14px] outline-none focus:border-[#161616] bg-white';
  const save = async () => {
    if (np1.length < 4) { setErr('Minimo 4 caratteri.'); return; }
    if (np1 !== np2) { setErr('Le due password non coincidono.'); return; }
    setErr(''); setBusy(true);
    try { const salt = randSalt(); const passHash = await sha256Hex(salt + np1); await onSetConfig({ salt, passHash }); onClose(); }
    catch { setErr('Errore salvataggio.'); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-[16px] font-extrabold text-[#161616] inline-flex items-center gap-1.5"><KeyRound className="w-4 h-4" /> Password di sezione</h3><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button></div>
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-[#8a8a8a]">Imposta la nuova password per accedere alla cassaforte.</p>
          <input type="password" value={np1} onChange={(e) => setNp1(e.target.value)} placeholder="Nuova password" className={inp} autoFocus />
          <input type="password" value={np2} onChange={(e) => setNp2(e.target.value)} placeholder="Ripeti password" className={inp} />
          {err && <p className="text-[12px] text-rose-600 font-semibold">{err}</p>}
          <button onClick={save} disabled={busy} className="px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">Salva password</button>
        </div>
      </div>
    </div>
  );
};

export default GovernanceView;
