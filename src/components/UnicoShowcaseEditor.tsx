/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UnicoShowcaseEditor — modale "Allestisci pagina vetrina" di un'operazione
 * Unico. Configura la pagina cinematica (struttura villa-omnia) vista dai
 * clienti: copertina, video continuo ONLINE (Firebase Storage), descrizione,
 * punti di forza e scene (secondo del video + titolo + testo).
 * Salva in `UnicoDeal.showcase`; la pubblicazione scrive lo snapshot sul
 * nodo `unicoShowcase` (vedi saveUnicoDeals in App).
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, Film, Eye, Clapperboard, Image as ImageIcon, Link2 } from 'lucide-react';
import type { UnicoDeal, UnicoShowcaseConfig, UnicoShowcaseScene } from '../types';
import { CinematicShowcase } from './CinematicShowcase';
import { safeUrl } from '../utils';

const IN = 'w-full h-10 px-3 text-[14px] border border-[#e2e2e2] rounded-lg bg-white outline-none focus:border-[#161616]';

interface Props {
  deal: UnicoDeal;
  onClose: () => void;
  /** Salva la config vetrina (+ flag pubblicazione) sul deal. */
  onSave: (showcase: UnicoShowcaseConfig, published: boolean) => void;
}

export const UnicoShowcaseEditor: React.FC<Props> = ({ deal, onClose, onSave }) => {
  const init = deal.showcase || {};
  const [image, setImage] = useState(init.image || '');
  const [videoUrl, setVideoUrl] = useState(init.videoUrl || '');
  const [summary, setSummary] = useState(init.summary || '');
  const [highlights, setHighlights] = useState((init.highlights || []).join('\n'));
  const [scenes, setScenes] = useState<UnicoShowcaseScene[]>(
    init.scenes?.length ? init.scenes : [{ time: 0, subtitle: 'Scena 01 • ', text: '' }]
  );
  const [published, setPublished] = useState(!!deal.published);
  const [preview, setPreview] = useState(false);

  const setScene = (i: number, patch: Partial<UnicoShowcaseScene>) =>
    setScenes((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addScene = () =>
    setScenes((prev) => [
      ...prev,
      { time: (prev[prev.length - 1]?.time ?? 0) + 3, subtitle: `Scena ${String(prev.length + 1).padStart(2, '0')} • `, text: '' },
    ]);
  const removeScene = (i: number) => setScenes((prev) => prev.filter((_, idx) => idx !== i));

  const buildConfig = (): UnicoShowcaseConfig => ({
    image: image.trim() || null,
    videoUrl: videoUrl.trim() || null,
    summary: summary.trim() || null,
    highlights: highlights.split('\n').map((h) => h.trim()).filter(Boolean),
    scenes: scenes
      .filter((s) => s.subtitle.trim() || s.text.trim())
      .map((s) => ({ time: Number(s.time) || 0, subtitle: s.subtitle.trim(), text: s.text.trim() }))
      .sort((a, b) => a.time - b.time),
  });

  // Anteprima a tutto schermo della pagina cinematica con la config corrente.
  if (preview) {
    const cfg = buildConfig();
    return (
      <div className="fixed inset-0 z-[300]">
        <CinematicShowcase
          videoUrl={cfg.videoUrl}
          poster={cfg.image}
          scenes={cfg.scenes || []}
          brand={(deal.title || 'Operazione Unico').toUpperCase()}
          brandSub={deal.location || 'Puglia'}
          onClose={() => setPreview(false)}
          footer={
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-stone-500 border border-white/15 rounded-full px-3.5 py-2">
              Anteprima vetrina
            </span>
          }
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-[720px] max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338ca] flex items-center justify-center"><Clapperboard className="w-4 h-4" /></span>
            <div>
              <b className="block text-[15px] tracking-tight leading-none">Pagina vetrina</b>
              <span className="text-[11.5px] text-stone-400">{deal.title || 'Operazione Unico'}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Media */}
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldEl label="Copertina (URL immagine)" icon={<ImageIcon className="w-3.5 h-3.5" />}>
              <input className={IN} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…/copertina.jpg" />
              {image.trim() && (
                <img src={safeUrl(image) || undefined} alt="" referrerPolicy="no-referrer" className="mt-2 h-24 w-full object-cover rounded-xl border border-[#ececec]" />
              )}
            </FieldEl>
            <FieldEl label="Video continuo (URL online)" icon={<Film className="w-3.5 h-3.5" />}>
              <input className={IN} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://firebasestorage.googleapis.com/…/video.mp4" />
              <span className="text-[11px] text-stone-400 mt-1.5 leading-snug flex items-start gap-1">
                <Link2 className="w-3 h-3 mt-0.5 shrink-0" />
                Carica il video su Firebase Storage e incolla qui l'URL di download. Un unico mp4 continuo: le scene puntano ai suoi secondi.
              </span>
            </FieldEl>
          </div>

          <FieldEl label="Descrizione breve (card e dettaglio)">
            <textarea className={`${IN} h-auto py-2 min-h-[56px]`} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Es. Antica masseria in pietra trasformata in boutique hotel…" />
          </FieldEl>

          <FieldEl label="Punti di forza (uno per riga)">
            <textarea className={`${IN} h-auto py-2 min-h-[80px]`} value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder={'8 suite più ristorante e piscina\nRestauro conservativo delle volte a stella'} />
          </FieldEl>

          {/* Scene */}
          <div className="border-t border-[#ececec] pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Scene del video</span>
              <button onClick={addScene} className="flex items-center gap-1 text-[12px] font-bold text-[#4338ca] hover:text-[#3730a3] cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Aggiungi scena
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {scenes.map((s, i) => (
                <div key={i} className="bg-[#fafafa] border border-[#ececec] rounded-xl p-3 grid grid-cols-[72px_1fr_32px] gap-2 items-start">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Sec.</label>
                    <input type="number" min={0} step={1} className={`${IN} h-9 px-2 text-[13px]`} value={s.time}
                      onChange={(e) => setScene(i, { time: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input className={`${IN} h-9 text-[13px]`} value={s.subtitle} onChange={(e) => setScene(i, { subtitle: e.target.value })} placeholder="Titolo scena (es. Scena 01 • L'Ingresso)" />
                    <input className={`${IN} h-9 text-[13px]`} value={s.text} onChange={(e) => setScene(i, { text: e.target.value })} placeholder="Testo narrativo della scena…" />
                  </div>
                  <button onClick={() => removeScene(i)} className="w-8 h-8 mt-5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {scenes.length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessuna scena: la pagina mostrerà solo titolo e video.</span>}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none border-t border-[#ececec] pt-4">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-[#4338ca]" />
            <span className="text-[12.5px] text-stone-600">Pubblica nella vetrina Unico (visibile ai clienti del portale)</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-[#ececec] sticky bottom-0 bg-white">
          <button onClick={() => setPreview(true)} className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[#e2e2e2] hover:border-stone-400 bg-white text-[#161616] font-bold text-[13px] cursor-pointer">
            <Eye className="w-4 h-4" /> Anteprima
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#161616] font-bold text-[13px] border-none cursor-pointer">Annulla</button>
            <button onClick={() => onSave(buildConfig(), published)} className="h-10 px-5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5">
              <Clapperboard className="w-4 h-4" /> Salva vetrina
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FieldEl: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-bold text-[#555] flex items-center gap-1.5">{icon}{label}</label>
    {children}
  </div>
);
