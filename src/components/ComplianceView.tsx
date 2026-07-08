/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ComplianceView — "Adempimenti societari" per società (nodo compliance/<societa>).
 * Checklist dei documenti/obblighi (Albo, PEC, Polizza, DURC…): si spunta la
 * presenza di ogni voce, si può indicare una scadenza e allegare documenti
 * (link a Drive/cloud, oppure scansione/foto inline se piccola). Le voci base
 * sono precaricate per società (COMPLIANCE_SEED); se ne possono aggiungere altre.
 */
import React from 'react';
import { Check, Paperclip, Link2, Upload, Trash2, Plus, X, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import type { Societa, ComplianceRecord, ComplianceItemState, ComplianceAttachment } from '../types';
import { safeUrl } from '../utils';

/** Voci base per società (foglio "Onirico" — adempimenti). id stabili. */
export const COMPLIANCE_SEED: Record<Societa, { id: string; label: string }[]> = {
  studio: [
    { id: 'albo', label: "Iscrizione all'Albo" },
    { id: 'polizza', label: 'Polizza professionale' },
    { id: 'inarcassa', label: 'Inarcassa' },
    { id: 'firma', label: 'Firma digitale' },
    { id: 'pec', label: 'PEC' },
    { id: 'commercialista', label: 'Commercialista di riferimento' },
    { id: 'cespiti', label: 'Registro cespiti' },
  ],
  materico: [
    { id: 'durc', label: 'DURC' },
    { id: 'cassa-edile', label: 'Cassa Edile' },
    { id: 'inail', label: 'INAIL' },
    { id: 'inps', label: 'INPS' },
    { id: 'polizza', label: 'Polizza assicurativa' },
    { id: 'sicurezza', label: 'Sicurezza (DVR / DUVRI)' },
    { id: 'patentino', label: 'Patentino / patente a crediti' },
    { id: 'commercialista', label: 'Commercialista di riferimento' },
    { id: 'firma', label: 'Firma digitale' },
    { id: 'cespiti', label: 'Registro cespiti' },
  ],
  unico: [
    { id: 'camera-commercio', label: 'Iscrizione Camera di Commercio' },
    { id: 'pec', label: 'PEC' },
    { id: 'polizza', label: 'Polizza' },
    { id: 'commercialista', label: 'Commercialista di riferimento' },
  ],
  strategico: [
    { id: 'pec', label: 'PEC' },
    { id: 'polizza', label: 'Polizza' },
    { id: 'firma', label: 'Firma digitale' },
    { id: 'dip-dvr', label: 'Dipendenti — DVR' },
    { id: 'dip-visite', label: 'Dipendenti — Visite mediche' },
  ],
  fantastico: [
    { id: 'camera-commercio', label: 'Iscrizione Camera di Commercio' },
    { id: 'pec', label: 'PEC' },
    { id: 'polizza', label: 'Polizza' },
    { id: 'commercialista', label: 'Commercialista di riferimento' },
  ],
  holding: [],
};

const MAX_FILE = 700 * 1024; // 700 KB: scansioni/foto piccole inline; per PDF grandi usa il link

const emptyItem = (): ComplianceItemState => ({ present: false, note: null, expiry: null, attachments: [] });
const daysTo = (iso?: string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00').getTime();
  if (isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
};

interface Props {
  soc: Societa;
  socLabel: string;
  color: string;
  record?: ComplianceRecord;
  canEdit: boolean;
  onSave: (soc: Societa, record: ComplianceRecord) => void;
}

export const ComplianceView: React.FC<Props> = ({ soc, socLabel, color, record, canEdit, onSave }) => {
  const seed = COMPLIANCE_SEED[soc] || [];
  const items = record?.items || {};

  // Voci custom = quelle salvate con customLabel non in seed.
  const seedIds = new Set(seed.map((s) => s.id));
  const customEntries = Object.entries(items)
    .filter(([id, st]) => !seedIds.has(id) && st.customLabel)
    .map(([id, st]) => ({ id, label: st.customLabel as string }));
  const rows = [...seed, ...customEntries];

  const [openId, setOpenId] = React.useState<string | null>(null);
  const [newLabel, setNewLabel] = React.useState('');
  const [linkDraft, setLinkDraft] = React.useState('');

  const persist = (nextItems: Record<string, ComplianceItemState>) => {
    onSave(soc, { items: nextItems, updatedAt: Date.now(), by: null });
  };
  const patch = (id: string, changes: Partial<ComplianceItemState>, extra?: { customLabel?: string }) => {
    if (!canEdit) return;
    const cur = items[id] || emptyItem();
    const next = { ...items, [id]: { ...cur, ...changes, ...(extra?.customLabel ? { customLabel: extra.customLabel } : {}) } };
    persist(next);
  };
  const removeItem = (id: string) => {
    if (!canEdit) return;
    const next = { ...items }; delete next[id]; persist(next);
    if (openId === id) setOpenId(null);
  };
  const addCustom = () => {
    const label = newLabel.trim();
    if (!label || !canEdit) return;
    const id = `c-${Date.now()}-${Math.floor(Math.random() * 900)}`;
    persist({ ...items, [id]: { ...emptyItem(), customLabel: label } });
    setNewLabel('');
    setOpenId(id);
  };

  const addLink = (id: string) => {
    const url = linkDraft.trim();
    if (!url || !canEdit) return;
    const cur = items[id] || emptyItem();
    const att: ComplianceAttachment = { id: `a-${Date.now()}`, name: url.replace(/^https?:\/\//, '').slice(0, 40), kind: 'link', url };
    patch(id, { attachments: [...(cur.attachments || []), att] });
    setLinkDraft('');
  };
  const addFile = (id: string, file: File) => {
    if (!canEdit) return;
    const ok = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!ok) { alert('Solo immagini o PDF. Per altri formati incolla il link (Drive/cloud).'); return; }
    if (file.size > MAX_FILE) { alert('File troppo grande (max 700 KB inline). Caricalo su Drive e incolla il link.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const cur = items[id] || emptyItem();
      const att: ComplianceAttachment = { id: `a-${Date.now()}`, name: file.name.slice(0, 48), kind: 'file', url: String(reader.result), mime: file.type };
      patch(id, { attachments: [...(cur.attachments || []), att] });
    };
    reader.readAsDataURL(file);
  };
  const removeAtt = (id: string, attId: string) => {
    const cur = items[id] || emptyItem();
    patch(id, { attachments: (cur.attachments || []).filter((a) => a.id !== attId) });
  };

  const total = rows.length;
  const present = rows.filter((r) => items[r.id]?.present).length;
  const expiring = rows.filter((r) => { const d = daysTo(items[r.id]?.expiry); return d !== null && d <= 30; }).length;

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#161616]">Adempimenti societari</h2>
          <p className="text-[12.5px] text-[#8a8a8a] mt-0.5">Documenti e obblighi di {socLabel}: spunta la presenza e allega i documenti.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full border text-[12px] font-bold" style={{ borderColor: `${color}44`, color, background: `${color}0f` }}>
            {present}/{total} presenti
          </span>
          {expiring > 0 && (
            <span className="px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[12px] font-bold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {expiring} in scadenza
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const st = items[r.id] || emptyItem();
          const expanded = openId === r.id;
          const dTo = daysTo(st.expiry);
          const attN = (st.attachments || []).length;
          return (
            <div key={r.id} className={`bg-white border rounded-[18px] overflow-hidden ${st.present ? 'border-[#e2e2e2]' : 'border-[#ececec]'}`}>
              <div className="flex items-center gap-3 p-3.5">
                <button
                  onClick={() => patch(r.id, { present: !st.present })}
                  disabled={!canEdit}
                  className={`w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${st.present ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#d5d5d5] bg-white'} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  title={st.present ? 'Presente' : 'Segna come presente'}
                >
                  {st.present && <Check className="w-3.5 h-3.5" />}
                </button>

                <button onClick={() => setOpenId(expanded ? null : r.id)} className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer p-0">
                  <b className={`block text-[13.5px] font-bold truncate ${st.present ? 'text-[#161616]' : 'text-[#555]'}`}>{r.label}</b>
                  <span className="block text-[11px] text-[#9a9a9a] truncate mt-0.5">
                    {attN > 0 ? `${attN} allegat${attN === 1 ? 'o' : 'i'}` : 'nessun allegato'}
                    {st.expiry ? ` · scade ${st.expiry}` : ''}
                    {st.note ? ` · ${st.note}` : ''}
                  </span>
                </button>

                {dTo !== null && dTo <= 30 && (
                  <span className={`px-2 py-1 rounded-full text-[10.5px] font-extrabold shrink-0 ${dTo < 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                    {dTo < 0 ? 'scaduto' : `${dTo} gg`}
                  </span>
                )}
                {attN > 0 && <Paperclip className="w-4 h-4 text-[#b0b0b0] shrink-0" />}
              </div>

              {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[#f2f2f0] flex flex-col gap-3">
                  {/* Allegati */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    {(st.attachments || []).map((a) => (
                      <div key={a.id} className="flex items-center gap-2 bg-[#f7f6f4] border border-[#ececec] rounded-xl px-3 py-2">
                        {a.kind === 'file' && a.mime?.startsWith('image/') ? (
                          <img src={a.url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-[#8a8a8a] shrink-0" />
                        )}
                        <a
                          href={a.kind === 'file' ? a.url : (safeUrl(a.url) || '#')}
                          target="_blank" rel="noreferrer"
                          {...(a.kind === 'file' ? { download: a.name } : {})}
                          className="flex-1 min-w-0 text-[12.5px] font-bold text-[#161616] truncate hover:underline inline-flex items-center gap-1.5"
                        >
                          {a.name} <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                        </a>
                        {canEdit && (
                          <button onClick={() => removeAtt(r.id, a.id)} className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer bg-transparent border-none shrink-0"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                    {(st.attachments || []).length === 0 && <span className="text-[12px] text-[#a8a8a8]">Nessun documento allegato.</span>}
                  </div>

                  {canEdit && (
                    <>
                      {/* Aggiungi allegato: file o link */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e2e2] bg-white text-[12px] font-bold text-[#333] cursor-pointer hover:border-black">
                          <Upload className="w-3.5 h-3.5" /> Carica file
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(r.id, f); e.currentTarget.value = ''; }} />
                        </label>
                        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                          <Link2 className="w-4 h-4 text-[#9a9a9a] shrink-0" />
                          <input
                            value={openId === r.id ? linkDraft : ''}
                            onChange={(e) => setLinkDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addLink(r.id)}
                            placeholder="Incolla link (Drive/cloud) e Invio"
                            className="flex-1 px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none focus:border-black bg-white"
                          />
                          <button onClick={() => addLink(r.id)} className="px-3 py-2 rounded-xl bg-[#161616] text-white text-[12px] font-bold cursor-pointer border-none">Aggiungi</button>
                        </div>
                      </div>

                      {/* Scadenza + nota + rimuovi voce */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-[11px] font-bold text-[#8a8a8a]">Scadenza</label>
                        <input
                          type="date"
                          value={st.expiry || ''}
                          onChange={(e) => patch(r.id, { expiry: e.target.value || null })}
                          className="px-2.5 py-1.5 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none focus:border-black bg-white"
                        />
                        <input
                          value={st.note || ''}
                          onChange={(e) => patch(r.id, { note: e.target.value || null })}
                          placeholder="Nota (es. n° polizza, ente…)"
                          className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-xl border border-[#e2e2e2] text-[12.5px] outline-none focus:border-black bg-white"
                        />
                        {!seedIds.has(r.id) && (
                          <button onClick={() => removeItem(r.id)} className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer bg-white" title="Rimuovi voce"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Aggiungi voce custom */}
      {canEdit && (
        <div className="flex items-center gap-2 bg-white border border-[#e2e2e2] rounded-[18px] p-3">
          <Plus className="w-4 h-4 text-[#9a9a9a] shrink-0" />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Aggiungi un adempimento…"
            className="flex-1 px-2.5 py-2 rounded-xl border border-[#e2e2e2] text-[13px] outline-none focus:border-black bg-white"
          />
          <button onClick={addCustom} disabled={!newLabel.trim()} className="px-3.5 py-2 rounded-xl bg-[#161616] text-white text-[12.5px] font-bold cursor-pointer border-none disabled:opacity-40">Aggiungi</button>
        </div>
      )}

      {!canEdit && <p className="text-[12px] text-[#9a9a9a]">Sola consultazione: non hai il permesso di operare su questa sezione.</p>}
    </div>
  );
};
