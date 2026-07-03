/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EditorialCalendar — Calendario editoriale come "anteprima di pubblicazione".
 * Hub marketing di Aulico/Strategico: gestisce i canali di TUTTE le società
 * (Onirico/Materico/Unico/Strategico/Fantastico) + clienti terzi. Ogni giorno
 * mostra le anteprime dei contenuti da pubblicare (immagine/video/carosello).
 * Inserimento media: drag&drop / file dal dispositivo (immagini inline) + link;
 * import dai documenti di una pratica SOLO se il cliente ha dato il consenso
 * (i progetti importabili arrivano già filtrati via `importProjects`).
 */
import React from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X, Trash2, Image as ImageIcon,
  Video, Layers, UploadCloud, Link2, FolderInput, Hash, ArrowLeft, ArrowRight,
} from 'lucide-react';
import type { EditorialPost, EditorialMedia, EditorialStatus } from '../types';
import { safeUrl } from '../utils';

export interface EditorialChannel { key: string; label: string; color?: string }
export interface EditorialImportProject {
  id: string;
  name: string;
  docs: { id: string; name: string; url?: string | null; type?: string | null }[];
}
interface Props {
  posts: EditorialPost[];
  channels: EditorialChannel[];
  color?: string;
  canEdit?: boolean;
  initialChannel?: string;              // 'Tutti' oppure la key di un canale
  importProjects?: EditorialImportProject[];
  onSave?: (p: EditorialPost) => void;
  onDelete?: (id: string) => void;
}

const STATUS: { id: EditorialStatus; label: string; color: string }[] = [
  { id: 'idea', label: 'Idea', color: '#6b7280' },
  { id: 'bozza', label: 'Bozza', color: '#b45309' },
  { id: 'programmato', label: 'Programmato', color: '#4338ca' },
  { id: 'pubblicato', label: 'Pubblicato', color: '#059669' },
];
const statusOf = (s?: EditorialStatus) => STATUS.find((x) => x.id === (s || 'idea')) || STATUS[0];
const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube'];
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const mkid = () => `ed-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => iso(new Date());

/** src sicura per <img>: consente solo data:image/… e http/https. */
const imgSrc = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  return safeUrl(url) || '';
};

/** Ridimensiona un'immagine a dataURL leggera (anteprima inline, no storage). */
function imageFileToDataUrl(file: File, maxDim = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no ctx')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load')); };
    img.src = url;
  });
}

/** Costruisce media (solo immagini inline) da una lista di file. Video/altro → ignorati (usa link). */
async function filesToMedia(files: File[]): Promise<{ media: EditorialMedia[]; skipped: number }> {
  const media: EditorialMedia[] = [];
  let skipped = 0;
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      try { media.push({ id: mkid(), type: 'image', url: await imageFileToDataUrl(f), name: f.name, source: 'upload' }); }
      catch { skipped++; }
    } else skipped++;
  }
  return { media, skipped };
}

export const EditorialCalendar: React.FC<Props> = ({
  posts, channels, color = '#b45309', canEdit = false, initialChannel = 'Tutti', importProjects = [], onSave, onDelete,
}) => {
  const [channel, setChannel] = React.useState<string>(initialChannel);
  React.useEffect(() => setChannel(initialChannel), [initialChannel]);
  const [cursor, setCursor] = React.useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [editing, setEditing] = React.useState<EditorialPost | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);

  const visible = React.useMemo(
    () => posts.filter((p) => channel === 'Tutti' || p.channel === channel),
    [posts, channel],
  );
  const byDay = React.useMemo(() => {
    const m: Record<string, EditorialPost[]> = {};
    visible.forEach((p) => { (m[p.dateISO] ||= []).push(p); });
    Object.values(m).forEach((arr) => arr.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')));
    return m;
  }, [visible]);

  // Griglia mese (6 settimane, lunedì-first)
  const cells = React.useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // 0=Lun
    const start = new Date(first); start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  const blank = (dateISO: string, media: EditorialMedia[] = []): EditorialPost => ({
    id: mkid(),
    channel: channel !== 'Tutti' ? channel : (channels[0]?.label || 'Onirico'),
    dateISO, time: null, topic: '', platform: 'Instagram', caption: '', hashtags: '', notes: '',
    status: 'idea', media, createdAt: Date.now(),
  });

  const monthLabel = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  const tISO = todayISO();

  const onDropDay = async (e: React.DragEvent, dateISO: string) => {
    if (!canEdit) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      const { media } = await filesToMedia(files);
      setEditing(blank(dateISO, media));
      return;
    }
    if (dragId) {
      const p = posts.find((x) => x.id === dragId);
      if (p && p.dateISO !== dateISO) onSave?.({ ...p, dateISO, updatedAt: Date.now() });
      setDragId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
            <CalendarDays className="w-5.5 h-5.5" style={{ color }} /> Calendario editoriale
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">
            Anteprima di pubblicazione per canale · trascina immagini o post tra i giorni.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#e2e2e2] text-[12.5px] font-bold outline-none focus:border-[#161616] bg-white cursor-pointer"
          >
            <option value="Tutti">Tutti i canali</option>
            {channels.map((c) => <option key={c.key} value={c.label}>{c.label}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setEditing(blank(tISO))} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
              <Plus className="w-4 h-4" /> Nuovo contenuto
            </button>
          )}
        </div>
      </div>

      {/* Barra mese */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="w-9 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] flex items-center justify-center cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="ml-1 px-3 h-9 rounded-xl border border-[#e2e2e2] bg-white hover:bg-[#f5f5f3] text-[12px] font-bold cursor-pointer">Oggi</button>
        </div>
        <span className="text-[16px] font-black text-[#161616] capitalize">{monthLabel}</span>
        <span className="text-[11.5px] text-[#9a9a9a] font-semibold">{visible.length} contenuti</span>
      </div>

      {/* Griglia calendario */}
      <div className="rounded-[20px] border border-[#e6e6e6] overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-[#f7f6f4] border-b border-[#eee]">
          {WEEKDAYS.map((w) => <div key={w} className="px-2 py-2 text-[10.5px] font-extrabold uppercase tracking-wider text-[#9a9a9a] text-center">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const dISO = iso(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = dISO === tISO;
            const dayPosts = byDay[dISO] || [];
            return (
              <div
                key={i}
                onDragOver={(e) => { if (canEdit) e.preventDefault(); }}
                onDrop={(e) => onDropDay(e, dISO)}
                onClick={() => canEdit && setEditing(blank(dISO))}
                className={`min-h-[104px] border-b border-r border-[#f0f0f0] p-1.5 flex flex-col gap-1 ${inMonth ? 'bg-white' : 'bg-[#fafafa]'} ${canEdit ? 'cursor-pointer hover:bg-[#faf9f7]' : ''} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#161616] text-white' : inMonth ? 'text-[#555]' : 'text-[#c0c0c0]'}`}>{d.getDate()}</span>
                  {dayPosts.length > 0 && <span className="text-[9.5px] font-bold text-[#b0b0b0]">{dayPosts.length}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <PostChip key={p.id} post={p} canEdit={canEdit} onOpen={(e) => { e.stopPropagation(); setEditing(p); }} onDragStart={() => setDragId(p.id)} />
                  ))}
                  {dayPosts.length > 3 && <span className="text-[10px] text-[#9a9a9a] font-semibold pl-1">+{dayPosts.length - 3} altri</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda stati */}
      <div className="flex items-center gap-3 flex-wrap">
        {STATUS.map((s) => <span key={s.id} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8a8a8a]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>)}
      </div>

      {editing && (
        <PostEditor
          key={editing.id}
          post={editing}
          channels={channels}
          canEdit={canEdit}
          importProjects={importProjects}
          onClose={() => setEditing(null)}
          onSave={(p) => { onSave?.(p); setEditing(null); }}
          onDelete={onDelete ? (id) => { onDelete(id); setEditing(null); } : undefined}
        />
      )}
    </div>
  );
};

/** Mini-card di un contenuto dentro la cella-giorno. */
const PostChip: React.FC<{ post: EditorialPost; canEdit: boolean; onOpen: (e: React.MouseEvent) => void; onDragStart: () => void }> = ({ post, canEdit, onOpen, onDragStart }) => {
  const st = statusOf(post.status);
  const media = post.media || [];
  const cover = media.find((m) => m.type === 'image');
  const hasVideo = media.some((m) => m.type === 'video');
  return (
    <div
      draggable={canEdit}
      onDragStart={onDragStart}
      onClick={onOpen}
      className="group relative rounded-lg overflow-hidden border border-[#e8e8e8] bg-white hover:border-[#cfcfcf] shadow-3xs cursor-pointer"
      title={post.topic || post.caption || 'Contenuto'}
    >
      <div className="flex items-stretch">
        <span className="w-1 shrink-0" style={{ background: st.color }} />
        {cover ? (
          <div className="relative w-9 h-9 shrink-0 bg-[#f0f0f0]">
            <img src={imgSrc(cover.url)} alt="" className="w-full h-full object-cover" />
            {media.length > 1 && <span className="absolute top-0.5 right-0.5 bg-black/70 text-white text-[8px] font-bold px-1 rounded inline-flex items-center gap-0.5"><Layers className="w-2 h-2" />{media.length}</span>}
          </div>
        ) : (
          <div className="w-9 h-9 shrink-0 bg-[#f5f5f3] flex items-center justify-center text-[#c0c0c0]">
            {hasVideo ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          </div>
        )}
        <div className="min-w-0 flex-1 px-1.5 py-1">
          <b className="block text-[10.5px] leading-tight text-[#161616] truncate">{post.topic || post.caption || 'Senza titolo'}</b>
          <span className="block text-[9px] text-[#9a9a9a] truncate">{[post.platform, post.time].filter(Boolean).join(' · ') || st.label}</span>
        </div>
      </div>
    </div>
  );
};

/** Editor del contenuto + gestore media (upload/link/import da pratica). */
const PostEditor: React.FC<{
  post: EditorialPost;
  channels: EditorialChannel[];
  canEdit: boolean;
  importProjects: EditorialImportProject[];
  onClose: () => void;
  onSave: (p: EditorialPost) => void;
  onDelete?: (id: string) => void;
}> = ({ post, channels, canEdit, importProjects, onClose, onSave, onDelete }) => {
  const [d, setD] = React.useState<EditorialPost>({ ...post, media: post.media || [] });
  const [importing, setImporting] = React.useState(false);
  const [linkVal, setLinkVal] = React.useState('');
  const [dropActive, setDropActive] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const set = (c: Partial<EditorialPost>) => setD((p) => ({ ...p, ...c }));
  const inp = 'w-full px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white disabled:bg-[#f7f7f5]';
  const media = d.media || [];
  const isCarousel = media.length > 1;

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    const { media: nm } = await filesToMedia(files);
    if (nm.length) set({ media: [...media, ...nm] });
  };
  const addLink = () => {
    const u = linkVal.trim();
    if (!u || !safeUrl(u)) return;
    const isVid = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(u) || /youtu|vimeo|tiktok/i.test(u);
    set({ media: [...media, { id: mkid(), type: isVid ? 'video' : 'image', url: u, source: 'link' }] });
    setLinkVal('');
  };
  const addFromDoc = (projId: string, doc: { id: string; name: string; url?: string | null; type?: string | null }) => {
    const u = doc.url || '';
    if (!u || !safeUrl(u)) return;
    const isVid = (doc.type || '').startsWith('video') || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(u);
    set({ media: [...media, { id: mkid(), type: isVid ? 'video' : 'image', url: u, name: doc.name, source: 'project', projectId: projId }] });
  };
  const removeMedia = (id: string) => set({ media: media.filter((m) => m.id !== id) });
  const moveMedia = (id: string, dir: -1 | 1) => {
    const i = media.findIndex((m) => m.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= media.length) return;
    const arr = media.slice();[arr[i], arr[j]] = [arr[j], arr[i]]; set({ media: arr });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-extrabold text-[#161616] inline-flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5" /> {post.topic || post.caption ? 'Modifica contenuto' : 'Nuovo contenuto'}
            {isCarousel && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 inline-flex items-center gap-1"><Layers className="w-3 h-3" /> Carosello · {media.length}</span>}
          </h3>
          <div className="flex items-center gap-1">
            {canEdit && (post.topic || post.caption) && onDelete && <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-4 h-4" /></button>}
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* MEDIA — anteprima pubblicazione */}
        <div
          onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDropActive(true); } }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(e) => { e.preventDefault(); setDropActive(false); if (canEdit) addFiles(Array.from(e.dataTransfer.files || [])); }}
          className={`rounded-[16px] border-2 border-dashed p-3 mb-3 transition-colors ${dropActive ? 'border-[#161616] bg-[#f5f5f3]' : 'border-[#e2e2e2] bg-[#fafafa]'}`}
        >
          {media.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2">
              {media.map((m, idx) => (
                <div key={m.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[#e6e6e6] bg-[#f0f0f0]">
                  {m.type === 'image' && imgSrc(m.url) ? (
                    <img src={imgSrc(m.url)} alt={m.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#9a9a9a] gap-1"><Video className="w-5 h-5" /><span className="text-[8px] px-1 text-center truncate w-full">{m.name || 'video'}</span></div>
                  )}
                  <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{idx + 1}</span>
                  {m.source === 'project' && <span className="absolute bottom-0.5 left-0.5 bg-emerald-600 text-white text-[7px] font-bold px-1 rounded">pratica</span>}
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={() => moveMedia(m.id, -1)} className="w-6 h-6 rounded bg-white/90 text-[#161616] flex items-center justify-center cursor-pointer border-none"><ArrowLeft className="w-3 h-3" /></button>
                      <button onClick={() => removeMedia(m.id)} className="w-6 h-6 rounded bg-white/90 text-rose-600 flex items-center justify-center cursor-pointer border-none"><Trash2 className="w-3 h-3" /></button>
                      <button onClick={() => moveMedia(m.id, 1)} className="w-6 h-6 rounded bg-white/90 text-[#161616] flex items-center justify-center cursor-pointer border-none"><ArrowRight className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-[#9a9a9a]"><UploadCloud className="w-7 h-7 mx-auto mb-1 opacity-50" /><p className="text-[12px] font-semibold">Trascina qui immagini o usa i pulsanti sotto</p><p className="text-[10.5px]">Più immagini = carosello · i video vanno aggiunti via link</p></div>
          )}
          {canEdit && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-[11.5px] font-bold cursor-pointer border-none"><UploadCloud className="w-3.5 h-3.5" /> Dal dispositivo</button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.currentTarget.value = ''; }} />
              <div className="inline-flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-lg px-1.5 py-1">
                <Link2 className="w-3.5 h-3.5 text-[#9a9a9a]" />
                <input value={linkVal} onChange={(e) => setLinkVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLink()} placeholder="Link immagine/video…" className="text-[11.5px] outline-none w-[150px]" />
                <button onClick={addLink} className="text-[11px] font-bold text-[#161616] px-1.5 cursor-pointer bg-transparent border-none">Aggiungi</button>
              </div>
              {importProjects.length > 0 && (
                <button onClick={() => setImporting((v) => !v)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[11.5px] font-bold cursor-pointer"><FolderInput className="w-3.5 h-3.5" /> Da pratica</button>
              )}
            </div>
          )}

          {/* Import da documenti pratica (consent-gated a monte) */}
          {importing && canEdit && (
            <div className="mt-2 rounded-xl border border-[#e6e6e6] bg-white p-2 max-h-[220px] overflow-y-auto">
              <p className="text-[10.5px] text-[#9a9a9a] font-semibold px-1 pb-1">Solo pratiche con consenso marketing del cliente.</p>
              {importProjects.map((pr) => (
                <div key={pr.id} className="mb-1.5">
                  <div className="text-[11.5px] font-bold text-[#161616] px-1">{pr.name}</div>
                  {pr.docs.length === 0 ? <p className="text-[10.5px] text-[#b0b0b0] px-1">Nessun documento.</p> : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-1">
                      {pr.docs.map((doc) => {
                        const isImg = !(doc.type || '').startsWith('video') && !!imgSrc(doc.url);
                        return (
                          <button key={doc.id} onClick={() => addFromDoc(pr.id, doc)} title={doc.name} className="aspect-square rounded-lg border border-[#e6e6e6] overflow-hidden bg-[#f0f0f0] hover:border-[#161616] cursor-pointer p-0">
                            {isImg ? <img src={imgSrc(doc.url)} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[#9a9a9a]"><ImageIcon className="w-4 h-4" /></span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CAMPI */}
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Canale</span>
            <input list="ed-channels" disabled={!canEdit} value={d.channel} onChange={(e) => set({ channel: e.target.value })} className={inp} placeholder="Società o cliente" />
            <datalist id="ed-channels">{channels.map((c) => <option key={c.key} value={c.label} />)}</datalist>
          </label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Piattaforma</span>
            <select disabled={!canEdit} value={d.platform || ''} onChange={(e) => set({ platform: e.target.value || null })} className={inp}><option value="">—</option>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Data</span>
            <input disabled={!canEdit} type="date" value={d.dateISO} onChange={(e) => set({ dateISO: e.target.value })} className={inp} /></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Ora</span>
            <input disabled={!canEdit} type="time" value={d.time || ''} onChange={(e) => set({ time: e.target.value || null })} className={inp} /></label>
          <label className="flex flex-col gap-1 col-span-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Argomento</span>
            <input disabled={!canEdit} value={d.topic || ''} onChange={(e) => set({ topic: e.target.value || null })} placeholder="Es. Trullo restaurato, dettaglio…" className={inp} /></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Stato</span>
            <select disabled={!canEdit} value={d.status} onChange={(e) => set({ status: e.target.value as EditorialStatus })} className={inp}>{STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] inline-flex items-center gap-1"><Hash className="w-3 h-3" /> Hashtag</span>
            <input disabled={!canEdit} value={d.hashtags || ''} onChange={(e) => set({ hashtags: e.target.value || null })} placeholder="#onirico #puglia" className={inp} /></label>
          <label className="flex flex-col gap-1 col-span-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Caption</span>
            <textarea disabled={!canEdit} value={d.caption || ''} onChange={(e) => set({ caption: e.target.value || null })} rows={3} className={`${inp} resize-none`} /></label>
          <label className="flex flex-col gap-1 col-span-2"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]">Note operative</span>
            <input disabled={!canEdit} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value || null })} className={inp} /></label>
        </div>

        {canEdit && (
          <button onClick={() => onSave({ ...d, topic: (d.topic || '').trim() || null, updatedAt: Date.now() })} className="mt-4 w-full px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">Salva contenuto</button>
        )}
      </div>
    </div>
  );
};

export default EditorialCalendar;
