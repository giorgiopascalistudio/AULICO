/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RecruitingView — Strategico · Risorse Umane · RECRUITING (docs RISORSE-UMANE/
 * RECRUITING): 1) ANNUNCI di lavoro (testo completo, stato, stampa); 2) CANDIDATI
 * con pipeline (candidatura → colloquio → prova → inserito/scartato), CV e note;
 * 3) PIANI DI INSERIMENTO a 6 mesi (template GURU JOBS: accoglienza/starter kit,
 * ruolo-obiettivi-PFV, formazione/affiancamenti tutor, feedback). Nodo `recruiting/<id>`.
 */
import React from 'react';
import { UserPlus, Plus, X, Trash2, Printer, FileText, Users, GraduationCap, ExternalLink } from 'lucide-react';
import { safeUrl } from '../utils';

export type RecruitKind = 'annuncio' | 'candidato' | 'inserimento';
export interface RecruitItem {
  id: string;
  kind: RecruitKind;
  title: string;                 // annuncio: titolo ruolo · candidato: nome · inserimento: nome risorsa
  ruolo?: string | null;         // mansione
  sede?: string | null;
  body?: string | null;          // annuncio: testo completo
  status?: string | null;        // annuncio: bozza|pubblicato|chiuso · candidato: stage
  email?: string | null;
  phone?: string | null;
  cvUrl?: string | null;
  note?: string | null;
  annuncioId?: string | null;    // candidato → annuncio
  tutor?: string | null;         // inserimento
  startDate?: string | null;
  piano?: Record<string, string>; // inserimento: sezioni del template
  createdAt: number;
  updatedAt?: number;
}

export const STAGES = ['candidatura', 'colloquio', 'prova', 'inserito', 'scartato'] as const;
const STAGE_COLOR: Record<string, string> = { candidatura: '#6b7280', colloquio: '#b45309', prova: '#4338ca', inserito: '#059669', scartato: '#dc2626' };
const PIANO_SECTIONS: { key: string; label: string; hint: string }[] = [
  { key: 'accoglienza', label: '1 · Accoglienza e cultura aziendale', hint: 'Come sarà accolto? Quali valori trasmettergli? Starter kit.' },
  { key: 'ruolo', label: '2 · Ruolo, obiettivi e responsabilità', hint: 'Obiettivi, PFV, statistiche su cui sarà misurato, mansionario.' },
  { key: 'formazione', label: '3 · Formazione e affiancamenti', hint: 'Che formazione riceverà? Chi è il tutor di riferimento?' },
  { key: 'feedback', label: '4 · Feedback e modalità', hint: 'Quando e come i momenti di feedback? Chi se ne occupa?' },
  { key: 'verifiche', label: '5 · Verifiche e milestone (6 mesi)', hint: 'Tappe di verifica a 1/3/6 mesi e criteri di conferma.' },
];

interface Props {
  items: RecruitItem[];
  color?: string;
  canEdit?: boolean;
  onSave?: (i: RecruitItem) => void;
  onDelete?: (id: string) => void;
}
const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';

export const RecruitingView: React.FC<Props> = ({ items, color = '#b45309', canEdit = false, onSave, onDelete }) => {
  const [tab, setTab] = React.useState<RecruitKind>('annuncio');
  const [editing, setEditing] = React.useState<RecruitItem | null>(null);
  const of = (k: RecruitKind) => items.filter((i) => i.kind === k).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  const blank = (kind: RecruitKind): RecruitItem => ({ id: `rc-${Date.now().toString(36)}`, kind, title: '', status: kind === 'annuncio' ? 'bozza' : kind === 'candidato' ? 'candidatura' : null, piano: {}, createdAt: Date.now() });
  const TABS = [
    { id: 'annuncio' as const, label: 'Annunci di lavoro', icon: FileText, count: of('annuncio').length },
    { id: 'candidato' as const, label: 'Candidati', icon: Users, count: of('candidato').filter((c) => c.status !== 'inserito' && c.status !== 'scartato').length },
    { id: 'inserimento' as const, label: 'Piani di inserimento', icon: GraduationCap, count: of('inserimento').length },
  ];
  const NEW_LABEL: Record<RecruitKind, string> = { annuncio: 'Nuovo annuncio', candidato: 'Nuovo candidato', inserimento: 'Nuovo piano' };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2"><UserPlus className="w-5.5 h-5.5" style={{ color }} /> Recruiting</h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">Annunci, pipeline candidati e piani di inserimento a 6 mesi — l'onboarding del gruppo, gestito da Strategico.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="pillbar inline-flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
            {TABS.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full cursor-pointer border-none ${tab === id ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] bg-transparent'}`}><Icon className="w-3.5 h-3.5" /> {label}{count ? ` (${count})` : ''}</button>
            ))}
          </div>
          {canEdit && <button onClick={() => setEditing(blank(tab))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none"><Plus className="w-4 h-4" /> {NEW_LABEL[tab]}</button>}
        </div>
      </div>

      {/* ANNUNCI */}
      {tab === 'annuncio' && (
        of('annuncio').length === 0 ? <Empty msg="Nessun annuncio. Crea il primo (es. Responsabile Amministrativo Contabile)." /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {of('annuncio').map((a) => (
              <button key={a.id} onClick={() => setEditing(a)} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm hover:border-[#161616] cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-[14px] text-[#161616]">{a.title || 'Annuncio'}</b>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${a.status === 'pubblicato' ? 'bg-emerald-50 text-emerald-700' : a.status === 'chiuso' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>{a.status || 'bozza'}</span>
                </div>
                <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">{a.sede || 'Ostuni (BR)'} · {of('candidato').filter((c) => c.annuncioId === a.id).length} candidati</p>
                {a.body && <p className="text-[12px] text-[#555] mt-1.5 line-clamp-3">{a.body}</p>}
              </button>
            ))}
          </div>
        )
      )}

      {/* CANDIDATI — pipeline */}
      {tab === 'candidato' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((st) => {
            const col = of('candidato').filter((c) => (c.status || 'candidatura') === st);
            return (
              <div key={st} className="min-w-[230px] w-[230px] shrink-0 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 px-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STAGE_COLOR[st] }} /><span className="text-[12px] font-extrabold text-[#161616] capitalize">{st}</span><span className="text-[#b0b0b0] font-bold text-[11px]">({col.length})</span></div>
                <div className="flex flex-col gap-2 bg-[#f6f6f4] border border-[#eee] rounded-[16px] p-2 min-h-[120px]">
                  {col.map((c) => (
                    <div key={c.id} onClick={() => setEditing(c)} className="bg-white border border-[#e6e6e6] rounded-[12px] p-2.5 shadow-sm cursor-pointer hover:border-[#cfcfcf]">
                      <b className="text-[12.5px] text-[#161616] block leading-tight">{c.title || 'Candidato'}</b>
                      <span className="text-[10.5px] text-[#9a9a9a]">{c.ruolo || '—'}</span>
                      {canEdit && st !== 'inserito' && st !== 'scartato' && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {STAGES.filter((s) => s !== st).slice(0, 4).map((s) => (
                            <button key={s} onClick={() => onSave?.({ ...c, status: s, updatedAt: Date.now() })} title={`→ ${s}`} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer border-none text-white capitalize" style={{ background: STAGE_COLOR[s] }}>{s[0].toUpperCase()}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {col.length === 0 && <p className="text-[11px] text-[#b0b0b0] text-center py-4">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PIANI DI INSERIMENTO */}
      {tab === 'inserimento' && (
        of('inserimento').length === 0 ? <Empty msg="Nessun piano di inserimento. Il template a 6 mesi (GURU JOBS) è precaricato nel nuovo piano." /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {of('inserimento').map((p) => {
              const filled = PIANO_SECTIONS.filter((s) => (p.piano?.[s.key] || '').trim()).length;
              return (
                <button key={p.id} onClick={() => setEditing(p)} className="text-left bg-white border border-[#e2e2e2] rounded-[20px] p-4 shadow-sm hover:border-[#161616] cursor-pointer">
                  <b className="text-[14px] text-[#161616]">{p.title || 'Risorsa'}</b>
                  <p className="text-[11.5px] text-[#8a8a8a] mt-0.5">{[p.ruolo, p.tutor ? `tutor ${p.tutor}` : null, p.startDate ? `dal ${new Date(p.startDate).toLocaleDateString('it-IT')}` : null].filter(Boolean).join(' · ') || '—'}</p>
                  <div className="mt-2 h-2 rounded-full bg-[#f0f0f0] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(filled / PIANO_SECTIONS.length) * 100}%`, background: color }} /></div>
                  <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-1">{filled}/{PIANO_SECTIONS.length} sezioni compilate</p>
                </button>
              );
            })}
          </div>
        )
      )}

      {editing && <RecruitEditor item={editing} annunci={of('annuncio')} canEdit={canEdit} color={color} onClose={() => setEditing(null)} onSave={(i) => { onSave?.(i); setEditing(null); }} onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined} />}
    </div>
  );
};

const Empty: React.FC<{ msg: string }> = ({ msg }) => <p className="text-[13px] text-[#9a9a9a] bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center">{msg}</p>;

const RecruitEditor: React.FC<{ item: RecruitItem; annunci: RecruitItem[]; canEdit: boolean; color: string; onClose: () => void; onSave: (i: RecruitItem) => void; onDelete?: (id: string) => void }> = ({ item, annunci, canEdit, color, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<RecruitItem>({ ...item, piano: { ...(item.piano || {}) } });
  const set = (c: Partial<RecruitItem>) => setD((p) => ({ ...p, ...c }));
  const K = d.kind;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-2xl my-4 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 no-print">
          <h3 className="text-[16px] font-extrabold text-[#161616]">{item.title ? 'Modifica' : 'Nuovo'} · {K === 'annuncio' ? 'Annuncio' : K === 'candidato' ? 'Candidato' : 'Piano di inserimento (6 mesi)'}</h3>
          <div className="flex items-center gap-1">
            {(K === 'annuncio' || K === 'inserimento') && <button onClick={() => window.print()} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#555] cursor-pointer bg-transparent border-none" title="Stampa"><Printer className="w-4 h-4" /></button>}
            {canEdit && item.title && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="print-area flex flex-col gap-3">
          <label className="flex flex-col gap-1"><span className={lbl}>{K === 'annuncio' ? 'Titolo ruolo' : K === 'candidato' ? 'Nome e cognome' : 'Nome risorsa'}</span>
            <input disabled={!canEdit} value={d.title} onChange={(e) => set({ title: e.target.value })} className={inp} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className={lbl}>Mansione/ruolo</span><input disabled={!canEdit} value={d.ruolo || ''} onChange={(e) => set({ ruolo: e.target.value || null })} className={inp} /></label>
            {K === 'annuncio' && <label className="flex flex-col gap-1"><span className={lbl}>Sede</span><input disabled={!canEdit} value={d.sede || ''} onChange={(e) => set({ sede: e.target.value || null })} placeholder="Ostuni (BR)" className={inp} /></label>}
            {K === 'annuncio' && <label className="flex flex-col gap-1"><span className={lbl}>Stato</span>
              <select disabled={!canEdit} value={d.status || 'bozza'} onChange={(e) => set({ status: e.target.value })} className={inp}>{['bozza', 'pubblicato', 'chiuso'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>}
            {K === 'candidato' && <label className="flex flex-col gap-1"><span className={lbl}>Fase</span>
              <select disabled={!canEdit} value={d.status || 'candidatura'} onChange={(e) => set({ status: e.target.value })} className={inp}>{STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>}
            {K === 'candidato' && <label className="flex flex-col gap-1"><span className={lbl}>Annuncio di riferimento</span>
              <select disabled={!canEdit} value={d.annuncioId || ''} onChange={(e) => set({ annuncioId: e.target.value || null })} className={inp}><option value="">—</option>{annunci.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>}
            {K === 'candidato' && <label className="flex flex-col gap-1"><span className={lbl}>Email</span><input disabled={!canEdit} value={d.email || ''} onChange={(e) => set({ email: e.target.value || null })} className={inp} /></label>}
            {K === 'candidato' && <label className="flex flex-col gap-1"><span className={lbl}>Telefono</span><input disabled={!canEdit} value={d.phone || ''} onChange={(e) => set({ phone: e.target.value || null })} className={inp} /></label>}
            {K === 'inserimento' && <label className="flex flex-col gap-1"><span className={lbl}>Tutor / riferimento</span><input disabled={!canEdit} value={d.tutor || ''} onChange={(e) => set({ tutor: e.target.value || null })} className={inp} /></label>}
            {K === 'inserimento' && <label className="flex flex-col gap-1"><span className={lbl}>Data inserimento</span><input disabled={!canEdit} type="date" value={d.startDate || ''} onChange={(e) => set({ startDate: e.target.value || null })} className={inp} /></label>}
          </div>
          {K === 'candidato' && (
            <label className="flex flex-col gap-1"><span className={lbl}>CV (link)</span>
              <div className="flex items-center gap-1.5">
                <input disabled={!canEdit} value={d.cvUrl || ''} onChange={(e) => set({ cvUrl: e.target.value || null })} placeholder="https://…" className={inp} />
                {d.cvUrl && safeUrl(d.cvUrl) && <a href={safeUrl(d.cvUrl)!} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-[#e2e2e2] hover:border-[#161616] text-[#555] shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </div></label>
          )}
          {K === 'annuncio' && (
            <label className="flex flex-col gap-1"><span className={lbl}>Testo dell'annuncio</span>
              <textarea disabled={!canEdit} value={d.body || ''} onChange={(e) => set({ body: e.target.value || null })} rows={10} placeholder={'Hai esperienza in…?\nSei una persona…?\nPotresti essere la persona giusta per noi.\n\nOnirico è…\nSiamo alla ricerca di…\nAttività principali: …\nChe cosa ti offriamo: …\nRichiediamo: …\nInviaci il tuo CV a: …'} className={`${inp} resize-y`} /></label>
          )}
          {K === 'inserimento' && PIANO_SECTIONS.map((s) => (
            <label key={s.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color }}>{s.label}</span>
              <textarea disabled={!canEdit} value={d.piano?.[s.key] || ''} onChange={(e) => set({ piano: { ...(d.piano || {}), [s.key]: e.target.value } })} rows={3} placeholder={s.hint} className={`${inp} resize-y`} />
            </label>
          ))}
          <label className="flex flex-col gap-1 no-print"><span className={lbl}>Note</span>
            <textarea disabled={!canEdit} value={d.note || ''} onChange={(e) => set({ note: e.target.value || null })} rows={2} className={`${inp} resize-none`} /></label>
          {canEdit && <button onClick={() => onSave({ ...d, title: d.title.trim() || 'Senza titolo', updatedAt: Date.now() })} className="no-print px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva</button>}
        </div>
      </div>
    </div>
  );
};

export default RecruitingView;
