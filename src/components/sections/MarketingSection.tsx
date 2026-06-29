/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Aulico V2 — Strategico ▸ Marketing (operativo): Calendario Editoriale
 * multi-canale. Sezione standalone montata dal registry (`view: 'marketing'`).
 *
 * Riusa il nodo Firebase esistente `mktSocial` (tipo SocialPost) — nessun nodo
 * nuovo, nessuna regola da ripubblicare. Scope per brand/cliente via mktProjectId
 * (nodo `mktProjects`). Tab "Analisi" = riepilogo KPI sui contenuti del filtro.
 */

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, CalendarDays, BarChart3, Trash2, ExternalLink,
} from 'lucide-react';
import type { SocialPost, MktProject, SocialPlatform, SocialStatus } from '../../types';
import { safeUrl } from '../../utils';

interface MarketingSectionProps {
  posts: SocialPost[];
  projects: MktProject[];
  color: string;
  initialTab?: 'calendario' | 'analisi';
  onSavePost: (p: SocialPost) => void;
  onDeletePost: (id: string) => void;
}

const PLATFORMS: { id: SocialPlatform; label: string; color: string }[] = [
  { id: 'instagram', label: 'Instagram', color: '#d6249f' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2' },
  { id: 'tiktok', label: 'TikTok', color: '#111111' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000' },
];
const STATUSES: { id: SocialStatus; label: string; color: string }[] = [
  { id: 'idea', label: 'Idea', color: '#a8a8a8' },
  { id: 'bozza', label: 'Bozza', color: '#d97706' },
  { id: 'programmato', label: 'Programmato', color: '#2563eb' },
  { id: 'pubblicato', label: 'Pubblicato', color: '#16a34a' },
];
const platformOf = (id: SocialPlatform) => PLATFORMS.find((p) => p.id === id) || PLATFORMS[0];
const statusOf = (id: SocialStatus) => STATUSES.find((s) => s.id === id) || STATUSES[0];

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const DOW = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** Converte ms → valore input datetime-local (locale). */
const toLocalInput = (ms?: number | null) => {
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).getTime() : null);
const newId = () => `mkt-social-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const MarketingSection: React.FC<MarketingSectionProps> = ({
  posts, projects, color, initialTab = 'calendario', onSavePost, onDeletePost,
}) => {
  const [tab, setTab] = useState<'calendario' | 'analisi'>(initialTab);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [brand, setBrand] = useState<string>('all');
  const [editing, setEditing] = useState<SocialPost | null>(null);

  const filtered = useMemo(
    () => posts.filter((p) => brand === 'all' || (p.mktProjectId || '') === brand),
    [posts, brand],
  );

  // mappa giorno (ymd) → post programmati
  const byDay = useMemo(() => {
    const m: Record<string, SocialPost[]> = {};
    for (const p of filtered) {
      if (!p.scheduledAt) continue;
      const k = ymd(new Date(p.scheduledAt));
      (m[k] = m[k] || []).push(p);
    }
    return m;
  }, [filtered]);

  const undated = filtered.filter((p) => !p.scheduledAt);

  // griglia 6 settimane da lunedì
  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // lun=0
    const start = new Date(first); start.setDate(first.getDate() - startOffset);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
    const rows: Date[][] = [];
    for (let i = 0; i < 6; i++) rows.push(days.slice(i * 7, i * 7 + 7));
    return rows;
  }, [cursor]);

  const todayKey = ymd(new Date());

  const openNew = (dateKey?: string) => {
    const base = dateKey ? new Date(`${dateKey}T10:00`) : null;
    setEditing({
      id: '', platform: 'instagram', caption: '', status: 'idea',
      mktProjectId: brand === 'all' ? null : brand,
      scheduledAt: base ? base.getTime() : null,
      createdAt: Date.now(),
    } as SocialPost);
  };

  const save = () => {
    if (!editing) return;
    const p: SocialPost = { ...editing, id: editing.id || newId(), createdAt: editing.createdAt || Date.now(), updatedAt: Date.now() };
    onSavePost(p);
    setEditing(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-[30px] py-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2.5 mr-auto">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <h1 className="text-[22px] font-extrabold text-[#161616] tracking-tight">Marketing — Calendario editoriale</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-[#e2e2e2] rounded-xl p-0.5">
          {([['calendario', 'Calendario', CalendarDays], ['analisi', 'Analisi', BarChart3]] as const).map(([id, lbl, Ic]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${tab === id ? 'bg-[#161616] text-white' : 'text-[#6e6e6e] hover:bg-[#f5f5f3]'}`}
            >
              <Ic className="w-3.5 h-3.5" /> {lbl}
            </button>
          ))}
        </div>

        {/* Brand filter */}
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="bg-white border border-[#e2e2e2] rounded-xl text-[13px] font-medium px-3 py-2 cursor-pointer"
        >
          <option value="all">Tutti i brand</option>
          {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
        </select>

        <button
          onClick={() => openNew()}
          className="btn btn-primary rounded-xl py-2 px-3 flex items-center gap-1.5 cursor-pointer font-bold bg-[#1b1b1b] hover:bg-black text-white"
        >
          <Plus className="w-4 h-4" /> Nuovo contenuto
        </button>
      </div>

      {tab === 'calendario' ? (
        <>
          {/* Month nav */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="w-8 h-8 rounded-lg bg-white border border-[#e2e2e2] flex items-center justify-center cursor-pointer hover:bg-[#f5f5f3]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[15px] font-extrabold text-[#161616] min-w-[150px] text-center">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</span>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="w-8 h-8 rounded-lg bg-white border border-[#e2e2e2] flex items-center justify-center cursor-pointer hover:bg-[#f5f5f3]"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="text-[12px] font-bold text-[#6e6e6e] hover:text-[#161616] cursor-pointer ml-1">Oggi</button>
            <div className="ml-auto flex flex-wrap gap-2.5">
              {PLATFORMS.map((p) => <span key={p.id} className="flex items-center gap-1 text-[11px] text-[#6e6e6e]"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.label}</span>)}
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white border border-[#e2e2e2] rounded-[18px] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#eee]">
              {DOW.map((d) => <div key={d} className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] px-2 py-2 text-center">{d}</div>)}
            </div>
            {weeks.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7">
                {row.map((day) => {
                  const k = ymd(day);
                  const inMonth = day.getMonth() === cursor.getMonth();
                  const dayPosts = byDay[k] || [];
                  return (
                    <div
                      key={k}
                      onClick={() => openNew(k)}
                      className={`min-h-[92px] border-b border-r border-[#f0f0f0] p-1.5 cursor-pointer transition-colors hover:bg-[#fafafa] ${inMonth ? '' : 'bg-[#fbfbfb]'}`}
                    >
                      <div className={`text-[11.5px] font-bold mb-1 ${k === todayKey ? 'text-white bg-[#161616] w-5 h-5 rounded-full flex items-center justify-center' : inMonth ? 'text-[#444]' : 'text-[#c4c4c4]'}`}>{day.getDate()}</div>
                      <div className="flex flex-col gap-1">
                        {dayPosts.slice(0, 3).map((p) => {
                          const pl = platformOf(p.platform); const st = statusOf(p.status);
                          return (
                            <button
                              key={p.id}
                              onClick={(e) => { e.stopPropagation(); setEditing(p); }}
                              className="flex items-center gap-1 text-left rounded-md px-1.5 py-1 bg-[#f5f5f3] hover:bg-[#ececec] transition-colors"
                              title={p.caption}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pl.color }} />
                              <span className="text-[10.5px] font-medium text-[#161616] truncate flex-1">{p.caption || pl.label}</span>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.color }} />
                            </button>
                          );
                        })}
                        {dayPosts.length > 3 && <span className="text-[10px] text-[#8a8a8a] px-1">+{dayPosts.length - 3} altri</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bozze senza data */}
          {undated.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-2">Bozze senza data ({undated.length})</h3>
              <div className="flex flex-wrap gap-2">
                {undated.map((p) => {
                  const pl = platformOf(p.platform); const st = statusOf(p.status);
                  return (
                    <button key={p.id} onClick={() => setEditing(p)} className="flex items-center gap-1.5 bg-white border border-[#e2e2e2] rounded-xl px-2.5 py-1.5 hover:bg-[#f5f5f3] cursor-pointer">
                      <span className="w-2 h-2 rounded-full" style={{ background: pl.color }} />
                      <span className="text-[12px] font-medium text-[#161616] max-w-[180px] truncate">{p.caption || pl.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <Analisi posts={filtered} />
      )}

      {editing && (
        <PostEditor
          post={editing}
          projects={projects}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => { onDeletePost(editing.id); setEditing(null); } : undefined}
        />
      )}
    </div>
  );
};

// ---- Tab Analisi -----------------------------------------------------------
const Analisi: React.FC<{ posts: SocialPost[] }> = ({ posts }) => {
  const byStatus = STATUSES.map((s) => ({ ...s, n: posts.filter((p) => p.status === s.id).length }));
  const byPlatform = PLATFORMS.map((p) => ({ ...p, n: posts.filter((x) => x.platform === p.id).length }));
  const reach = posts.reduce((a, p) => a + (p.reach || 0), 0);
  const likes = posts.reduce((a, p) => a + (p.likes || 0), 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-3">Contenuti per stato</div>
        <div className="flex flex-col gap-2">
          {byStatus.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] text-[#161616]"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
              <b className="text-[14px]">{s.n}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-3">Contenuti per canale</div>
        <div className="flex flex-col gap-2">
          {byPlatform.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] text-[#161616]"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.label}</span>
              <b className="text-[14px]">{p.n}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#a8a8a8] mb-3">Totali (metriche manuali)</div>
        <div className="flex flex-col gap-3">
          <div><div className="text-[28px] font-extrabold tracking-tight">{posts.length}</div><div className="text-[12px] text-[#8a8a8a]">contenuti</div></div>
          <div className="flex gap-6">
            <div><div className="text-[18px] font-extrabold">{reach.toLocaleString('it-IT')}</div><div className="text-[11px] text-[#8a8a8a]">reach</div></div>
            <div><div className="text-[18px] font-extrabold">{likes.toLocaleString('it-IT')}</div><div className="text-[11px] text-[#8a8a8a]">like</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Editor post -----------------------------------------------------------
const PostEditor: React.FC<{
  post: SocialPost;
  projects: MktProject[];
  onChange: (p: SocialPost) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}> = ({ post, projects, onChange, onClose, onSave, onDelete }) => {
  const set = (patch: Partial<SocialPost>) => onChange({ ...post, ...patch });
  const link = safeUrl(post.mediaUrl || '') || safeUrl(post.link || '');
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-extrabold text-[#161616]">{post.id ? 'Modifica contenuto' : 'Nuovo contenuto'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#6e6e6e]">Brand / Cliente</span>
            <select value={post.mktProjectId || ''} onChange={(e) => set({ mktProjectId: e.target.value || null })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]">
              <option value="">— Nessuno</option>
              {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#6e6e6e]">Canale</span>
              <select value={post.platform} onChange={(e) => set({ platform: e.target.value as SocialPlatform })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]">
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#6e6e6e]">Stato</span>
              <select value={post.status} onChange={(e) => set({ status: e.target.value as SocialStatus })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]">
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#6e6e6e]">Data e ora di pubblicazione</span>
            <input type="datetime-local" value={toLocalInput(post.scheduledAt)} onChange={(e) => set({ scheduledAt: fromLocalInput(e.target.value) })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#6e6e6e]">Caption</span>
            <textarea value={post.caption} onChange={(e) => set({ caption: e.target.value })} rows={4} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px] resize-y" placeholder="Testo del post…" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-bold text-[#6e6e6e]">Hashtag</span>
            <input value={post.hashtags || ''} onChange={(e) => set({ hashtags: e.target.value })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]" placeholder="#onirico #puglia" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#6e6e6e]">Tema / Pilastro</span>
              <input value={post.pillar || ''} onChange={(e) => set({ pillar: e.target.value })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]" placeholder="es. Restauro" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#6e6e6e]">Link media</span>
              <input value={post.mediaUrl || ''} onChange={(e) => set({ mediaUrl: e.target.value })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]" placeholder="https://…" />
            </label>
          </div>

          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Apri media
            </a>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#6e6e6e]">Reach</span>
              <input type="number" value={post.reach ?? ''} onChange={(e) => set({ reach: e.target.value === '' ? null : Number(e.target.value) })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#6e6e6e]">Like</span>
              <input type="number" value={post.likes ?? ''} onChange={(e) => set({ likes: e.target.value === '' ? null : Number(e.target.value) })} className="border border-[#e2e2e2] rounded-xl px-3 py-2 text-[13px]" />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          {onDelete && (
            <button onClick={onDelete} className="flex items-center gap-1.5 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-xl px-3 py-2 cursor-pointer mr-auto">
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          )}
          <button onClick={onClose} className="text-[13px] font-bold text-[#6e6e6e] hover:bg-[#f5f5f3] rounded-xl px-4 py-2 cursor-pointer ml-auto">Annulla</button>
          <button onClick={onSave} className="text-[13px] font-bold text-white bg-[#1b1b1b] hover:bg-black rounded-xl px-4 py-2 cursor-pointer">Salva</button>
        </div>
      </div>
    </div>
  );
};
