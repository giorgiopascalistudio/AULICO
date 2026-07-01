/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TeamRegistro — Registro del Team in stile master-detail (come il Registro contatti CRM).
 * La gestione accessi avviene DIRETTAMENTE dalla scheda: approvazione richieste, ruolo,
 * stato attivo, permessi granulari per società. Include produttività e merito/bonus.
 */
import React from 'react';
import {
  Users, Search, Plus, Mail, Phone, ShieldCheck, CheckCircle2, XCircle, Clock, Eye, Pencil, UserCog, Award, ChevronDown,
} from 'lucide-react';
import type { UserProfile, Task, PointEvent, AccessMap, AccessLevel, UserRole, Societa } from '../types';
import { SOCIETA, SOCIETA_LABEL, LEVELS, LEVEL_LABEL } from '../access';
import { tierFor, nextTier, erogatoOf, profileCompleteness } from '../points';
import { initials, eur } from '../utils';

type Member = UserProfile & { uid: string };
interface Props {
  members: Member[];       // team approvato (admin/manager/staff)
  pending: Member[];       // account in attesa (status pending)
  tasks?: Task[];
  pointEvents?: PointEvent[];
  myUid: string;
  canManage?: boolean;     // admin o manager (gestione accessi)
  canMakeAdmin?: boolean;  // solo admin può creare admin
  onApprove: (uid: string, role: UserRole) => void;
  onReject: (uid: string) => void;
  onChangeRole: (uid: string, role: UserRole) => void;
  onToggleActive: (uid: string, active: boolean) => void;
  onSaveAccess: (uid: string, access: AccessMap) => void;
  onEditUser: (uid: string) => void;
  onNewUser: () => void;
  onPreview?: (uid: string) => void;
}

const ROLE_LABEL: Record<string, string> = { admin: 'Amministratore', manager: 'Manager', staff: 'Staff' };
const todayISO = () => new Date().toISOString().slice(0, 10);
const roleOpts = (canAdmin: boolean): UserRole[] => (canAdmin ? ['admin', 'manager', 'staff'] : ['manager', 'staff']);

export const TeamRegistro: React.FC<Props> = ({ members, pending, tasks = [], pointEvents = [], myUid, canManage = false, canMakeAdmin = false, onApprove, onReject, onChangeRole, onToggleActive, onSaveAccess, onEditUser, onNewUser, onPreview }) => {
  const [selId, setSelId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'attivi' | 'attesa' | 'tutti'>('attivi');
  const [roleF, setRoleF] = React.useState<'all' | UserRole>('all');

  const all: (Member & { _pending?: boolean })[] = React.useMemo(() => [
    ...members.map((m) => ({ ...m, _pending: false })),
    ...pending.map((m) => ({ ...m, _pending: true })),
  ], [members, pending]);

  const list = all.filter((u) => {
    if (status === 'attivi' && (u._pending || u.active === false)) return false;
    if (status === 'attesa' && !u._pending) return false;
    if (roleF !== 'all' && u.role !== roleF) return false;
    const q = search.trim().toLowerCase();
    if (q && !(`${u.name || ''} ${u.email || ''} ${u.title || ''}`.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => {
    if (a._pending !== b._pending) return a._pending ? -1 : 1;
    const rk: any = { admin: 0, manager: 1, staff: 2 };
    return (rk[a.role] ?? 9) - (rk[b.role] ?? 9) || (a.name || '').localeCompare(b.name || '');
  });

  React.useEffect(() => { if (!list.find((u) => u.uid === selId)) setSelId(list[0]?.uid || null); }, [list, selId]);
  const sel = all.find((u) => u.uid === selId) || null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[560px]">
      {/* ===== LISTA (master) ===== */}
      <div className="lg:w-[40%] xl:w-[34%] flex flex-col bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-[#f0f0f0] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-[14px] font-extrabold text-[#161616]"><Users className="w-4.5 h-4.5" /> Team & Permessi <span className="text-[#b0b0b0] font-bold">({list.length})</span></h3>
            {canManage && <button onClick={onNewUser} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none"><Plus className="w-3.5 h-3.5" /> Nuovo</button>}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[#b0b0b0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca nome, email, ruolo…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none focus:border-[#161616]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
              {(['attivi', 'attesa', 'tutti'] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer border-none transition-all ${status === s ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'}`}>
                  {s === 'attivi' ? 'Attivi' : s === 'attesa' ? `In attesa${pending.length ? ` (${pending.length})` : ''}` : 'Tutti'}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <select value={roleF} onChange={(e) => setRoleF(e.target.value as any)} className="w-full appearance-none pl-3 pr-7 py-2 rounded-xl border border-[#e2e2e2] text-[12px] font-semibold text-[#333] bg-white outline-none focus:border-[#161616] cursor-pointer">
                <option value="all">Tutti i ruoli</option>
                {(['admin', 'manager', 'staff'] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#f3f3f3] max-h-[520px]">
          {list.length === 0 ? <div className="p-8 text-center text-[#9a9a9a] text-[13px]">Nessun membro coi filtri correnti.</div> : list.map((u) => {
            const isSel = selId === u.uid;
            const dot = u._pending ? 'bg-amber-500 animate-pulse' : u.active === false ? 'bg-gray-300' : 'bg-emerald-500';
            return (
              <div key={u.uid} onClick={() => setSelId(u.uid)} className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${isSel ? 'bg-[#fafafa] border-l-[3px] border-[#161616]' : 'hover:bg-[#fafafa]/60 border-l-[3px] border-transparent'}`}>
                <div className="relative pt-0.5">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#444] font-bold text-[12px] border border-[#ececec]">{initials(u.name || '?')}</div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[13.5px] font-bold text-[#161616] truncate">{u.name}{u.uid === myUid && <span className="text-[10px] font-bold text-[#b0b0b0]"> · tu</span>}</h4>
                    {u._pending ? <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">In attesa</span>
                      : <span className="text-[9px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">{ROLE_LABEL[u.role] || u.role}</span>}
                  </div>
                  {u.title && <p className="text-[11.5px] text-[#8a8a8a] truncate mt-0.5 font-medium">{u.title}</p>}
                  {u.email && <p className="text-[11px] text-[#a0a0a0] truncate mt-0.5">{u.email}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== DETTAGLIO (scheda) ===== */}
      <div className="flex-1 bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm flex flex-col">
        {!sel ? <div className="flex-1 flex items-center justify-center p-10 text-center text-[#9a9a9a] text-[13.5px]">Seleziona un membro dalla lista.</div>
          : <MemberDetail key={sel.uid} sel={sel} isPending={!!sel._pending} tasks={tasks} pointEvents={pointEvents} canManage={canManage} canMakeAdmin={canMakeAdmin} isMe={sel.uid === myUid}
              onApprove={onApprove} onReject={onReject} onChangeRole={onChangeRole} onToggleActive={onToggleActive} onSaveAccess={onSaveAccess} onEditUser={onEditUser} onPreview={onPreview} />}
      </div>
    </div>
  );
};

const Box: React.FC<{ title: string; children: React.ReactNode; icon?: any }> = ({ title, children, icon: Icon }) => (
  <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-[16px] p-4 flex flex-col gap-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] inline-flex items-center gap-1.5">{Icon && <Icon className="w-3.5 h-3.5" />} {title}</p>
    {children}
  </div>
);

const MemberDetail: React.FC<{ sel: Member; isPending: boolean; tasks: Task[]; pointEvents: PointEvent[]; canManage: boolean; canMakeAdmin: boolean; isMe: boolean; onApprove: (uid: string, role: UserRole) => void; onReject: (uid: string) => void; onChangeRole: (uid: string, role: UserRole) => void; onToggleActive: (uid: string, active: boolean) => void; onSaveAccess: (uid: string, access: AccessMap) => void; onEditUser: (uid: string) => void; onPreview?: (uid: string) => void }> = ({ sel, isPending, tasks, pointEvents, canManage, canMakeAdmin, isMe, onApprove, onReject, onChangeRole, onToggleActive, onSaveAccess, onEditUser, onPreview }) => {
  const [approveRole, setApproveRole] = React.useState<UserRole>('staff');
  const [access, setAccess] = React.useState<AccessMap>(sel.access || {});
  const [dirty, setDirty] = React.useState(false);
  React.useEffect(() => { setAccess(sel.access || {}); setDirty(false); }, [sel.uid]);

  // Produttività dai task
  const myTasks = tasks.filter((t: any) => t.assignee === sel.uid || (Array.isArray(t.assignees) && t.assignees.includes(sel.uid)));
  const today = todayISO();
  const open = myTasks.filter((t: any) => !t.done).length;
  const urgent = myTasks.filter((t: any) => !t.done && t.priority === 'urgente').length;
  const overdue = myTasks.filter((t: any) => !t.done && t.date && t.date < today).length;
  const completed = myTasks.filter((t: any) => t.done).length;

  // Merito & bonus + erogato (valore economico) + completezza profilo
  const pts = pointEvents.filter((e) => e.uid === sel.uid).reduce((s, e) => s + (e.points || 0), 0);
  const tier = tierFor(pts); const nxt = nextTier(pts);
  const erogato = erogatoOf(pointEvents, sel.uid);
  const prof = profileCompleteness(sel);

  const fns = Array.isArray(sel.functions) ? sel.functions : (sel.functions ? Object.keys(sel.functions as any) : []);
  const setLevel = (s: Societa, val: AccessLevel | '') => { setAccess((prev) => { const n: AccessMap = { ...prev }; if (!val) delete n[s]; else n[s] = { ...(n[s] || {}), default: val }; return n; }); setDirty(true); };
  const statusPill = isPending ? { t: 'In attesa di approvazione', c: 'bg-amber-100 text-amber-800' } : sel.active === false ? { t: 'Sospeso', c: 'bg-gray-100 text-gray-600' } : { t: 'Attivo', c: 'bg-emerald-100 text-emerald-700' };

  return (
    <>
      <div className="p-5 border-b border-[#f0f0f0] flex items-start gap-4">
        {sel.photoURL ? <img src={sel.photoURL} alt="" className="w-14 h-14 rounded-full object-cover border border-[#ececec]" /> : <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-[18px]">{initials(sel.name || '?')}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[18px] font-black text-[#161616] leading-tight truncate">{sel.name}</h3>
            <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusPill.c}`}>{statusPill.t}</span>
          </div>
          <p className="text-[12.5px] text-[#8a8a8a] mt-0.5">{ROLE_LABEL[sel.role] || sel.role}{sel.title ? ` · ${sel.title}` : ''}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onPreview && !isPending && <button onClick={() => onPreview(sel.uid)} title="Anteprima come" className="p-2 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Eye className="w-4 h-4" /></button>}
          {canManage && <button onClick={() => onEditUser(sel.uid)} title="Modifica dettagli" className="p-2 rounded-lg hover:bg-gray-100 text-[#666] cursor-pointer bg-transparent border-none"><Pencil className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Box title="Contatti" icon={Mail}>
            {sel.email && <a href={`mailto:${sel.email}`} className="text-[13px] text-[#161616] hover:underline inline-flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#b0b0b0]" /> {sel.email}</a>}
            {sel.telefono && <a href={`tel:${sel.telefono}`} className="text-[13px] text-[#161616] hover:underline inline-flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#b0b0b0]" /> {sel.telefono}</a>}
            {fns.length > 0 && <div className="mt-1"><p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Mansioni</p><div className="flex flex-wrap gap-1">{fns.map((f) => <span key={f} className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#e2e2e2] text-[#555]">{f}</span>)}</div></div>}
          </Box>
          <Box title="Merito & bonus" icon={Award}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-extrabold px-2.5 py-1 rounded-full text-white" style={{ background: tier.color }}>{tier.label}</span>
              <span className="text-[20px] font-black text-[#161616]">{pts}</span><span className="text-[11px] text-[#9a9a9a]">punti</span>
            </div>
            <p className="text-[11.5px] text-[#8a8a8a]">Bonus fascia: <b className="text-[#161616]">{tier.bonusPct}%</b>{tier.perk ? ` · ${tier.perk}` : ''}</p>
            <p className="text-[11.5px] text-[#8a8a8a]">Erogato (valore attività): <b className="text-[#161616]">{eur(erogato)}</b></p>
            {nxt && <p className="text-[11px] text-[#a0a0a0]">Ancora <b>{nxt.remaining}</b> punti per {nxt.tier.label}.</p>}
          </Box>
        </div>

        {/* Completezza profilo (incentiva banca dati aggiornata) */}
        <Box title="Completezza profilo" icon={UserCog}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${prof.pct}%`, background: prof.pct >= 100 ? '#059669' : prof.pct >= 60 ? '#b45309' : '#dc2626' }} />
            </div>
            <span className="text-[14px] font-black text-[#161616]">{prof.pct}%</span>
          </div>
          {prof.missing.length > 0 ? <p className="text-[11.5px] text-[#8a8a8a]">Mancano: {prof.missing.join(', ')}.</p> : <p className="text-[11.5px] text-emerald-600 font-semibold">Profilo completo.</p>}
        </Box>

        {/* Produttività */}
        <Box title="Produttività (task assegnati)" icon={CheckCircle2}>
          <div className="grid grid-cols-4 gap-2">
            {[['Aperti', open, '#161616'], ['Urgenti', urgent, '#dc2626'], ['Scaduti', overdue, '#ea580c'], ['Completati', completed, '#059669']].map(([l, v, c]) => (
              <div key={l as string} className="text-center bg-white border border-[#f0f0f0] rounded-xl py-2">
                <p className="text-[20px] font-black" style={{ color: c as string }}>{v as number}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">{l as string}</p>
              </div>
            ))}
          </div>
        </Box>

        {/* Accessi & permessi — direttamente in scheda */}
        {canManage ? (
          <Box title="Accessi & permessi" icon={ShieldCheck}>
            {isPending ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-[12.5px] text-[#555]">Richiesta di accesso in attesa. Approva assegnando un ruolo, oppure rifiuta.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <select value={approveRole} onChange={(e) => setApproveRole(e.target.value as UserRole)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold bg-white outline-none focus:border-[#161616] cursor-pointer">
                      {roleOpts(canMakeAdmin).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button onClick={() => onApprove(sel.uid, approveRole)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold cursor-pointer border-none"><CheckCircle2 className="w-4 h-4" /> Approva</button>
                  <button onClick={() => onReject(sel.uid)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e2e2e2] hover:border-rose-400 text-rose-600 text-[12.5px] font-bold cursor-pointer"><XCircle className="w-4 h-4" /> Rifiuta</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Ruolo</p>
                    <div className="relative">
                      <select disabled={isMe} value={sel.role} onChange={(e) => onChangeRole(sel.uid, e.target.value as UserRole)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold bg-white outline-none focus:border-[#161616] cursor-pointer disabled:opacity-60">
                        {roleOpts(canMakeAdmin || sel.role === 'admin').map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9a9a9a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase mb-1">Stato</p>
                    <button disabled={isMe} onClick={() => onToggleActive(sel.uid, !(sel.active !== false))} className={`w-full px-3 py-2 rounded-xl text-[12.5px] font-bold border cursor-pointer disabled:opacity-60 ${sel.active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-[#e2e2e2]'}`}>{sel.active !== false ? 'Attivo (clic per sospendere)' : 'Sospeso (clic per attivare)'}</button>
                  </div>
                </div>
                {/* Permessi granulari per società */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[9.5px] text-[#b0b0b0] font-bold uppercase inline-flex items-center gap-1"><UserCog className="w-3 h-3" /> Permessi per società</p>
                    {Object.keys(access).length > 0 && <button onClick={() => { setAccess({}); setDirty(true); }} className="text-[11px] font-bold text-[#b45309] hover:underline cursor-pointer bg-transparent border-none p-0">Ripristina dal ruolo</button>}
                  </div>
                  <p className="text-[11px] text-[#9a9a9a] mb-2">"Predefinito" usa i permessi del ruolo. Imposta un livello per un accesso mirato.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {SOCIETA.map((s) => (
                      <div key={s} className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-[#161616]">{SOCIETA_LABEL[s]}</span>
                        <div className="relative">
                          <select value={access[s]?.default || ''} onChange={(e) => setLevel(s, e.target.value as AccessLevel | '')} className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-[#e2e2e2] text-[11.5px] font-semibold bg-white outline-none focus:border-[#161616] cursor-pointer">
                            <option value="">Predefinito</option>
                            {LEVELS.map((lv) => <option key={lv} value={lv}>{LEVEL_LABEL[lv]}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-[#9a9a9a] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {dirty && <button onClick={() => { onSaveAccess(sel.uid, access); setDirty(false); }} className="mt-2.5 px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">Salva permessi</button>}
                </div>
              </div>
            )}
          </Box>
        ) : (
          <Box title="Accessi & permessi" icon={ShieldCheck}><p className="text-[12.5px] text-[#9a9a9a] inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> Solo admin/manager (Risorse Umane) possono gestire ruoli e permessi.</p></Box>
        )}
      </div>
    </>
  );
};

export default TeamRegistro;
