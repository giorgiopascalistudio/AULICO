/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RenderAiView — "Render AI preliminare" di Onirico (PDF Automazioni, ultima
 * delle 4): foto del lotto/stato dei luoghi + QUESTIONARIO di stile → bozza
 * render fotorealistica via `callAiImage` (Worker Cloudflare, img2img).
 * Nessun nodo DB: il render si scarica in PNG (lo storico vive nella sessione).
 * Strumento di pre-vendita: dà al cliente un'anteprima emozionale in minuti.
 */
import React from 'react';
import {
  Sparkles, UploadCloud, Download, RefreshCw, ImageIcon, AlertTriangle, X, Wand2,
} from 'lucide-react';
import type { Project } from '../types';
import { callAiImage } from '../firebase';

const inp = 'px-3 py-2 rounded-lg border border-[#e2e2e2] text-[13px] outline-none focus:border-[#161616] bg-white';
const lbl = 'text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a]';

// Questionario (le voci compongono il prompt inglese per il modello img2img)
const TIPOLOGIE = [
  { id: 'villa', label: 'Villa moderna', p: 'modern mediterranean villa' },
  { id: 'trullo', label: 'Trullo / lamia', p: 'restored apulian trullo with stone cone roof' },
  { id: 'masseria', label: 'Masseria', p: 'restored apulian masseria farmhouse' },
  { id: 'appartamento', label: 'Appartamento', p: 'contemporary apartment building' },
  { id: 'facciata', label: 'Recupero facciata', p: 'renovated historic facade' },
];
const STILI = [
  { id: 'mediterraneo', label: 'Mediterraneo contemporaneo', p: 'contemporary mediterranean style' },
  { id: 'minimal', label: 'Minimal', p: 'minimalist clean architecture' },
  { id: 'rustico', label: 'Rustico moderno', p: 'modern rustic style' },
  { id: 'classico', label: 'Classico', p: 'classic elegant architecture' },
];
const MATERIALI = [
  { id: 'pietra', label: 'Pietra locale', p: 'local apulian stone' },
  { id: 'intonaco', label: 'Intonaco bianco', p: 'white plaster walls' },
  { id: 'legno', label: 'Legno', p: 'warm wood details' },
  { id: 'vetro', label: 'Vetrate', p: 'large glass windows' },
  { id: 'corten', label: 'Acciaio corten', p: 'corten steel accents' },
];
const ESTERNI = [
  { id: 'piscina', label: 'Piscina', p: 'infinity swimming pool' },
  { id: 'giardino', label: 'Giardino mediterraneo', p: 'mediterranean garden with olive trees' },
  { id: 'pergolato', label: 'Pergolato', p: 'wooden pergola' },
  { id: 'piazzale', label: 'Piazzale in pietra', p: 'stone paved courtyard' },
];
const MOMENTI = [
  { id: 'giorno', label: 'Giorno', p: 'bright daylight, blue sky' },
  { id: 'tramonto', label: 'Tramonto', p: 'golden hour sunset light' },
  { id: 'sera', label: 'Sera', p: 'evening blue hour with warm interior lights' },
];

/** Ridimensiona la foto a dataURL JPEG (max 1024px): il worker non vuole foto enormi. */
function fileToDataUrl(file: File, maxDim = 1024, quality = 0.85): Promise<string> {
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

interface Props {
  /** Progetti Onirico (per intitolare il download, facoltativo). */
  projects: Project[];
  color?: string;
  canEdit?: boolean;
}

export const RenderAiView: React.FC<Props> = ({ projects, color = '#161616', canEdit = false }) => {
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [tipologia, setTipologia] = React.useState('villa');
  const [stile, setStile] = React.useState('mediterraneo');
  const [materiali, setMateriali] = React.useState<Record<string, boolean>>({ pietra: true, intonaco: true });
  const [esterni, setEsterni] = React.useState<Record<string, boolean>>({});
  const [momento, setMomento] = React.useState('giorno');
  const [note, setNote] = React.useState('');
  const [creativita, setCreativita] = React.useState(55); // → strength 0.35–0.8
  const [projectId, setProjectId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [render, setRender] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<string[]>([]); // sessione, non persistito
  const [zoom, setZoom] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const workerReady = typeof window !== 'undefined' && !!(window as any).__AULICO_AI_URL__;

  const onFile = async (f: File) => {
    if (!f.type.startsWith('image/')) { setErr('Carica una foto (jpg/png).'); return; }
    setErr(null);
    try { setPhoto(await fileToDataUrl(f)); setRender(null); }
    catch { setErr('Foto non leggibile.'); }
  };

  const buildPrompt = () => {
    const t = TIPOLOGIE.find((x) => x.id === tipologia)?.p || '';
    const s = STILI.find((x) => x.id === stile)?.p || '';
    const m = MATERIALI.filter((x) => materiali[x.id]).map((x) => x.p).join(', ');
    const e = ESTERNI.filter((x) => esterni[x.id]).map((x) => x.p).join(', ');
    const mo = MOMENTI.find((x) => x.id === momento)?.p || '';
    return [
      'professional architectural exterior render redesigned from the provided photo of the site',
      t, s, m && `materials: ${m}`, e, mo,
      'photorealistic, realistic lighting and shadows, high quality, clean composition',
      note.trim().slice(0, 240),
    ].filter(Boolean).join(', ');
  };

  const generate = async () => {
    if (!photo) { setErr('Carica prima la foto del lotto / stato dei luoghi.'); return; }
    setBusy(true); setErr(null);
    try {
      const dataUrl = await callAiImage({
        imageBase64: photo,
        prompt: buildPrompt(),
        strength: 0.35 + (creativita / 100) * 0.45, // 0.35 (fedele) → 0.8 (creativo)
      });
      setRender(dataUrl);
      setHistory((h) => [dataUrl, ...h].slice(0, 8));
    } catch (e: any) {
      setErr(e?.message || 'Generazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const download = (url: string) => {
    const proj = projects.find((p) => p.id === projectId);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render-ai-${(proj?.name || 'onirico').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const toggle = (set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, id: string) =>
    set((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h2 className="text-[22px] font-black tracking-tight text-[#161616] inline-flex items-center gap-2">
          <Sparkles className="w-5.5 h-5.5 text-[#161616]" /> Render AI preliminare
        </h2>
        <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1">
          Foto del lotto + questionario → bozza render fotorealistica in pochi secondi. È un'anteprima
          emozionale di pre-vendita, non un progetto: il render vero arriva dalla progettazione.
        </p>
      </div>

      {!workerReady && (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-[12.5px] font-semibold text-amber-800">
            Worker AI non configurato (window.__AULICO_AI_URL__): la generazione non partirà. Vedi cloudflare-worker/README.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* COLONNA 1 — foto + questionario */}
        <div className="flex flex-col gap-3">
          {/* Foto lotto */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && canEdit) onFile(f); }}
            className="bg-white border-2 border-dashed border-[#d8d8d8] rounded-[20px] p-4 text-center"
          >
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Foto lotto" className="w-full max-h-[260px] object-cover rounded-[14px] cursor-zoom-in" onClick={() => setZoom(photo)} />
                {canEdit && (
                  <button onClick={() => { setPhoto(null); setRender(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer border-none"><X className="w-4 h-4" /></button>
                )}
              </div>
            ) : (
              <div className="py-6">
                <UploadCloud className="w-8 h-8 mx-auto text-[#c0c0c0] mb-2" />
                <p className="text-[13px] font-bold text-[#555]">Foto del lotto / stato dei luoghi</p>
                <p className="text-[11.5px] text-[#9a9a9a] mt-0.5">Trascina qui o</p>
                {canEdit && (
                  <button onClick={() => fileRef.current?.click()} className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer border-none">
                    <ImageIcon className="w-4 h-4" /> Scegli foto
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ''; }} />
              </div>
            )}
          </div>

          {/* Questionario */}
          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4 flex flex-col gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Questionario di stile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1"><span className={lbl}>Tipologia</span>
                <select disabled={!canEdit} value={tipologia} onChange={(e) => setTipologia(e.target.value)} className={inp}>
                  {TIPOLOGIE.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select></label>
              <label className="flex flex-col gap-1"><span className={lbl}>Stile</span>
                <select disabled={!canEdit} value={stile} onChange={(e) => setStile(e.target.value)} className={inp}>
                  {STILI.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select></label>
            </div>
            <div>
              <span className={lbl}>Materiali</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {MATERIALI.map((m) => (
                  <button key={m.id} disabled={!canEdit} onClick={() => toggle(setMateriali, m.id)}
                    className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ${materiali[m.id] ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#8a8a8a] border-[#e2e2e2] hover:border-[#c0c0c0]'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={lbl}>Esterni</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {ESTERNI.map((e) => (
                  <button key={e.id} disabled={!canEdit} onClick={() => toggle(setEsterni, e.id)}
                    className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ${esterni[e.id] ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#8a8a8a] border-[#e2e2e2] hover:border-[#c0c0c0]'}`}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1"><span className={lbl}>Luce / momento</span>
                <select disabled={!canEdit} value={momento} onChange={(e) => setMomento(e.target.value)} className={inp}>
                  {MOMENTI.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select></label>
              <label className="flex flex-col gap-1"><span className={lbl}>Pratica (per il nome file)</span>
                <select disabled={!canEdit} value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inp}>
                  <option value="">— nessuna —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></label>
            </div>
            <label className="flex flex-col gap-1"><span className={lbl}>Note libere (facoltative)</span>
              <textarea disabled={!canEdit} value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Es. tetto piano, ulivi secolari in primo piano…" className={`${inp} resize-none`} /></label>
            <label className="flex flex-col gap-1">
              <span className={lbl}>Trasformazione: {creativita < 40 ? 'fedele alla foto' : creativita > 70 ? 'molto creativa' : 'bilanciata'}</span>
              <input disabled={!canEdit} type="range" min={0} max={100} value={creativita} onChange={(e) => setCreativita(Number(e.target.value))} className="accent-[#161616] cursor-pointer" />
            </label>
            {canEdit && (
              <button onClick={generate} disabled={busy || !photo || !workerReady}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none disabled:opacity-40">
                {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {busy ? 'Genero il render…' : render ? 'Rigenera' : 'Genera il render'}
              </button>
            )}
            {err && <p className="text-[12px] font-semibold text-rose-600">{err}</p>}
          </div>
        </div>

        {/* COLONNA 2 — risultato + storico sessione */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Render generato</p>
              {render && (
                <button onClick={() => download(render)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e2e2e2] hover:border-[#161616] text-[#161616] text-[11.5px] font-bold cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Scarica PNG
                </button>
              )}
            </div>
            {render ? (
              <img src={render} alt="Render AI" className="w-full rounded-[14px] cursor-zoom-in" onClick={() => setZoom(render)} />
            ) : (
              <div className="py-14 text-center text-[#b0b0b0]">
                <Sparkles className="w-9 h-9 mx-auto mb-2 opacity-50" />
                <p className="text-[12.5px] font-semibold">{busy ? 'Generazione in corso (10–30 secondi)…' : 'Il render apparirà qui.'}</p>
              </div>
            )}
            <p className="text-[10.5px] text-[#9a9a9a] font-semibold mt-2">
              Bozza indicativa generata dall'AI: non sostituisce elaborati e render di progetto. Scaricala e
              allegala alla pratica dai Documenti, se serve condividerla.
            </p>
          </div>

          {history.length > 1 && (
            <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a] mb-2">Tentativi di questa sessione</p>
              <div className="grid grid-cols-4 gap-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => setRender(h)} className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer p-0 ${render === h ? 'border-[#161616]' : 'border-transparent hover:border-[#c0c0c0]'}`}>
                    <img src={h} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom fullscreen */}
      {zoom && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
};

export default RenderAiView;
