/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generatore presentazioni di progetto. Compone una bozza dai dati (progetto,
 * questionario cliente, arredi); le slide di analisi sono editabili. Anteprima
 * 16:9 + Stampa/PDF interna + Export PowerPoint .pptx reale.
 */
import React from 'react';
import { Presentation, Printer, Download, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { Project, ProjectBrief, Furnishing, ProjectPresentation } from '../types';
import { PRES_SLIDES, buildSlides, exportPptx, type ResolvedSlide } from '../presentation';
import { safeUrl } from '../utils';

interface Props {
  project: Project;
  brief?: ProjectBrief | null;
  furnishings: Furnishing[];
  presentation?: ProjectPresentation | null;
  canEdit?: boolean;
  onSave?: (pres: ProjectPresentation) => void;
}

export const PresentationBuilder: React.FC<Props> = ({ project, brief, furnishings, presentation, canEdit = true, onSave }) => {
  const [sections, setSections] = React.useState<Record<string, string>>(presentation?.sections || {});
  const [include, setInclude] = React.useState<Record<string, boolean>>(presentation?.include || {});
  const [subtitle, setSubtitle] = React.useState<string>(presentation?.subtitle || '');
  const [dirty, setDirty] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    setSections(presentation?.sections || {});
    setInclude(presentation?.include || {});
    setSubtitle(presentation?.subtitle || '');
    setDirty(false);
  }, [presentation?.pid, presentation?.updatedAt]);

  const slides: ResolvedSlide[] = buildSlides(project, brief, furnishings, { pid: project.id, sections, include, subtitle, updatedAt: 0 });

  const setSec = (id: string, v: string) => { setSections((p) => ({ ...p, [id]: v })); setDirty(true); };
  const toggle = (id: string) => { setInclude((p) => ({ ...p, [id]: p[id] === false })); setDirty(true); };

  const save = () => {
    onSave?.({ pid: project.id, sections, include, subtitle: subtitle || null, updatedAt: Date.now() });
    setDirty(false);
  };

  const doExport = async () => {
    setExporting(true);
    try { await exportPptx(slides, project); } catch (e) { /* eslint-disable no-console */ console.error(e); }
    setExporting(false);
  };

  const textSlides = PRES_SLIDES.filter((s) => s.kind === 'text');

  return (
    <div className="flex flex-col gap-5 text-left">
      <style>{`@media print { body * { visibility: hidden; } .pres-print, .pres-print * { visibility: visible; } .pres-print { position: absolute; left: 0; top: 0; width: 100%; } .pres-slide { page-break-after: always; box-shadow: none !important; border: none !important; } }`}</style>

      {/* Header + azioni */}
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <div>
          <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2"><Presentation className="w-5 h-5" /> Presentazione di progetto</h3>
          <p className="text-[12px] text-[#8a8a8a] font-medium">Bozza generata dai dati del progetto e dal questionario cliente. Modifica le analisi e esporta.</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={save} className="text-[12.5px] font-bold px-3.5 py-2 rounded-xl border border-[#e2e2e2] bg-white hover:border-black cursor-pointer">
              Salva{dirty ? ' •' : ''}
            </button>
          )}
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3.5 py-2 rounded-xl border border-[#e2e2e2] bg-white hover:border-black cursor-pointer">
            <Printer className="w-4 h-4" /> Stampa / PDF
          </button>
          <button onClick={doExport} disabled={exporting} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3.5 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white cursor-pointer border-none disabled:opacity-60">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Esporta .pptx
          </button>
        </div>
      </div>

      {/* Editor slide di analisi + toggle inclusione */}
      {canEdit && (
        <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 no-print">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mb-3">Contenuti delle slide di analisi</h4>
          <label className="flex flex-col gap-1.5 mb-3">
            <span className="text-[12px] font-bold text-[#333]">Sottotitolo copertina</span>
            <input value={subtitle} onChange={(e) => { setSubtitle(e.target.value); setDirty(true); }} placeholder="Cliente · indirizzo" className="input border border-[#e2e2e2] rounded-xl h-10 px-3 text-[14px]" />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {textSlides.map((s) => (
              <label key={s.id} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#333]">{s.title}</span>
                <textarea value={sections[s.id] || ''} onChange={(e) => setSec(s.id, e.target.value)} rows={2} placeholder={s.hint} className="input border border-[#e2e2e2] rounded-xl p-3 text-[13.5px] resize-none" />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Toggle slide */}
      <div className="flex flex-wrap gap-1.5 no-print">
        {PRES_SLIDES.map((s) => {
          const on = include[s.id] !== false;
          return (
            <button key={s.id} onClick={() => toggle(s.id)} className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1.5 rounded-full border cursor-pointer ${on ? 'bg-[#161616] text-white border-black' : 'bg-white text-[#9a9a9a] border-[#e2e2e2]'}`}>
              {on ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {s.title}
            </button>
          );
        })}
      </div>

      {/* Anteprima 16:9 */}
      <div className="pres-print flex flex-col gap-4">
        {slides.map((s, i) => (
          <div key={s.id} className="pres-slide relative w-full rounded-[18px] overflow-hidden border border-[#e2e2e2] shadow-sm bg-white" style={{ aspectRatio: '16 / 9' }}>
            {s.kind === 'cover' ? (
              <div className="absolute inset-0 bg-[#161616] text-white flex flex-col justify-center px-[6%]">
                <div className="text-[clamp(20px,4vw,44px)] font-black leading-tight">{s.title}</div>
                {s.subtitle && <div className="text-[clamp(11px,1.6vw,18px)] text-white/70 mt-2">{s.subtitle}</div>}
                <div className="absolute bottom-[5%] left-[6%] text-[clamp(8px,1.1vw,12px)] text-white/40 font-bold">Aulico · Onirico Studio</div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col px-[5%] py-[4%]">
                <div className="text-[clamp(14px,2.4vw,26px)] font-extrabold text-[#161616]">{s.title}</div>
                <div className="w-10 h-[3px] bg-[#161616] rounded-full mt-1 mb-3" />
                <div className="flex-1 flex gap-4 min-h-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {s.body && <p className="text-[clamp(10px,1.5vw,15px)] text-[#333] whitespace-pre-wrap leading-relaxed">{s.body}</p>}
                    {s.bullets && s.bullets.length > 0 && (
                      <ul className="flex flex-col gap-1 mt-1">
                        {s.bullets.map((b, bi) => (
                          <li key={bi} className="text-[clamp(9px,1.35vw,14px)] text-[#333] leading-snug">{b === '—' ? <span className="text-[#ccc]">— — —</span> : b}</li>
                        ))}
                      </ul>
                    )}
                    {!s.body && (!s.bullets || s.bullets.length === 0) && !(s.images && s.images.length) && (
                      <p className="text-[13px] italic text-[#b0b0b0]">Slide vuota — aggiungi contenuti sopra.</p>
                    )}
                  </div>
                  {s.images && s.images.length > 0 && (
                    <div className={`shrink-0 grid gap-1.5 ${s.images.length === 1 ? 'grid-cols-1 w-[42%]' : 'grid-cols-2 w-[46%]'}`}>
                      {s.images.slice(0, 4).map((u, ii) => (
                        <img key={ii} src={safeUrl(u) || ''} alt="" className="w-full h-full object-cover rounded-lg border border-[#eee]" style={{ minHeight: 0, maxHeight: '100%' }} loading="lazy" referrerPolicy="no-referrer" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[clamp(7px,0.9vw,10px)] text-[#b0b0b0] font-bold mt-1">{project.name} · {i + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
