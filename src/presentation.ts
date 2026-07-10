/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generatore presentazioni di progetto. Compone una BOZZA (≈60-70%) dai dati già
 * presenti (progetto, questionario cliente, arredi) su una struttura fissa; le
 * slide di analisi hanno testo editabile. Export: anteprima/stampa HTML interna +
 * file PowerPoint .pptx reale (pptxgenjs, caricato lazy).
 */
import type { Project, ProjectBrief, Furnishing, ProjectPresentation } from './types';
import { BRIEF_QUESTIONS } from './projectBrief';

export type SlideKind = 'cover' | 'text' | 'brief' | 'materiali' | 'arredi' | 'riferimenti';

export interface SlideDef {
  id: string;
  title: string;
  kind: SlideKind;
  hint?: string;       // placeholder/suggerimento per le slide di testo
}

/** Struttura fissa (dal PDF/brief utente). L'ordine è quello di presentazione. */
export const PRES_SLIDES: SlideDef[] = [
  { id: 'cover', title: 'Copertina', kind: 'cover' },
  { id: 'inquadramento', title: 'Inquadramento territoriale', kind: 'text', hint: 'Contesto, quartiere, accessibilità, servizi vicini…' },
  { id: 'analisi', title: 'Analisi del sito', kind: 'text', hint: 'Orientamento, morfologia del lotto, viste, elementi esistenti…' },
  { id: 'esposizione', title: 'Esposizione solare', kind: 'text', hint: 'Soleggiamento nelle diverse ore/stagioni, zone in ombra…' },
  { id: 'venti', title: 'Venti', kind: 'text', hint: 'Venti dominanti, protezione, ventilazione naturale…' },
  { id: 'privacy', title: 'Privacy', kind: 'text', hint: 'Affacci, schermature, rapporti con i confinanti…' },
  { id: 'distanze', title: 'Distanze dai confini', kind: 'text', hint: 'Distanze da confini/fabbricati/strada, prescrizioni…' },
  { id: 'vincoli', title: 'Vincoli', kind: 'text', hint: 'Vincoli urbanistici, paesaggistici, idrogeologici…' },
  { id: 'brief', title: 'Le esigenze del cliente', kind: 'brief' },
  { id: 'moodboard', title: 'Moodboard & stile', kind: 'text', hint: 'Concept estetico, atmosfera, palette…' },
  { id: 'materiali', title: 'Materiali', kind: 'materiali' },
  { id: 'arredi', title: 'Arredi selezionati', kind: 'arredi' },
  { id: 'riferimenti', title: 'Immagini di riferimento', kind: 'riferimenti' },
  { id: 'conclusioni', title: 'Conclusioni', kind: 'text', hint: 'Sintesi, prossimi passi, tempistiche…' },
];

export interface ResolvedSlide {
  id: string;
  title: string;
  kind: SlideKind;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  images?: string[];
}

const isImg = (u: string) => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(u) || u.startsWith('data:image');

/** Risolve le slide includendo i dati automatici (progetto/brief/arredi) + i testi editati. */
export const buildSlides = (
  project: Project,
  brief: ProjectBrief | null | undefined,
  furnishings: Furnishing[],
  pres: ProjectPresentation | null | undefined
): ResolvedSlide[] => {
  const ans = brief?.answers || {};
  const inc = pres?.include || {};
  const sec = pres?.sections || {};
  const address = (project as any).indirizzoImmobile || (project as any).address || '';
  const clientName = (project as any).clientName || (project as any).cliente || '';

  const out: ResolvedSlide[] = [];
  for (const s of PRES_SLIDES) {
    if (inc[s.id] === false) continue; // esclusa esplicitamente
    if (s.kind === 'cover') {
      out.push({ id: s.id, title: project.name || 'Progetto', kind: 'cover', subtitle: pres?.subtitle || [clientName, address].filter(Boolean).join(' · ') || 'Presentazione di progetto' });
    } else if (s.kind === 'text') {
      // auto-seed di alcune slide dal brief se il testo non è ancora stato scritto
      let body = sec[s.id] || '';
      if (!body && s.id === 'moodboard') body = [ans.stile && `Stile: ${ans.stile}`, ans.atmosfera, ans.colori && `Colori: ${ans.colori}`].filter(Boolean).join('\n');
      if (!body && s.id === 'inquadramento' && address) body = `Immobile in ${address}.`;
      out.push({ id: s.id, title: s.title, kind: 'text', body });
    } else if (s.kind === 'brief') {
      const bullets = BRIEF_QUESTIONS
        .filter((q) => q.id !== 'riferimenti' && q.id !== 'note' && (ans[q.id] || '').toString().trim())
        .map((q) => `${q.label}: ${ans[q.id]}`);
      out.push({ id: s.id, title: s.title, kind: 'brief', bullets: bullets.length ? bullets : ['(Compila il Questionario del cliente per popolare questa slide.)'] });
    } else if (s.kind === 'materiali') {
      const bullets = [ans.materiali && `Preferiti: ${ans.materiali}`, ans.materiali_no && `Da evitare: ${ans.materiali_no}`, sec['materiali']].filter(Boolean) as string[];
      out.push({ id: s.id, title: s.title, kind: 'materiali', bullets: bullets.length ? bullets : ['(Materiali dal Questionario cliente.)'] });
    } else if (s.kind === 'arredi') {
      const fissi = furnishings.filter((f) => f.kind === 'fisso');
      const mobili = furnishings.filter((f) => f.kind !== 'fisso');
      const bullets = [
        ...fissi.map((f) => `• ${f.title}${(f as any).status === 'confermato' ? ' ✓' : ''}`),
        ...(mobili.length ? ['—'] : []),
        ...mobili.map((f) => `• ${f.title}`),
      ];
      const images = furnishings.map((f) => (f as any).image || (f as any).link || '').filter((u: string) => u && isImg(u));
      out.push({ id: s.id, title: s.title, kind: 'arredi', bullets: bullets.length ? bullets : ['(Nessun arredo selezionato: aggiungili in Arredi & Moodboard.)'], images });
    } else if (s.kind === 'riferimenti') {
      const raw = (ans.riferimenti || '').toString();
      const links = raw.split(/[\s,;\n]+/).map((x) => x.trim()).filter(Boolean);
      const images = links.filter(isImg);
      const others = links.filter((u) => !isImg(u));
      out.push({ id: s.id, title: s.title, kind: 'riferimenti', images, bullets: others });
    }
  }
  return out;
};

/** Genera e scarica il file .pptx (pptxgenjs lazy). Best-effort sulle immagini remote. */
export const exportPptx = async (slides: ResolvedSlide[], project: Project): Promise<void> => {
  const mod = await import('pptxgenjs');
  const PptxGenJS = (mod as any).default || (mod as any);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'A16x9', width: 10, height: 5.625 });
  pptx.layout = 'A16x9';
  pptx.author = 'Aulico';
  pptx.title = project.name || 'Presentazione';

  const DARK = '161616';
  const LIGHT = 'F5F5F3';
  const GRAY = '8A8A8A';

  const addImageSafe = (slide: any, url: string, opts: any) => {
    try { slide.addImage({ path: url, ...opts }); } catch { /* immagine non caricabile → ignorata */ }
  };

  slides.forEach((s) => {
    const slide = pptx.addSlide();
    if (s.kind === 'cover') {
      slide.background = { color: DARK };
      slide.addText(s.title, { x: 0.6, y: 2.0, w: 8.8, h: 1.2, fontSize: 40, bold: true, color: 'FFFFFF', fontFace: 'Arial' });
      if (s.subtitle) slide.addText(s.subtitle, { x: 0.6, y: 3.2, w: 8.8, h: 0.6, fontSize: 16, color: 'C9C9C9', fontFace: 'Arial' });
      slide.addText('Aulico · Onirico Studio', { x: 0.6, y: 5.0, w: 8.8, h: 0.4, fontSize: 11, color: GRAY });
      return;
    }
    slide.background = { color: 'FFFFFF' };
    slide.addText(s.title, { x: 0.6, y: 0.4, w: 8.8, h: 0.8, fontSize: 26, bold: true, color: DARK, fontFace: 'Arial' });
    slide.addShape('rect', { x: 0.6, y: 1.15, w: 1.2, h: 0.06, fill: { color: DARK } });

    const hasImages = (s.images || []).length > 0;
    const textW = hasImages ? 5.0 : 8.8;

    const lines: string[] = [];
    if (s.body) lines.push(...s.body.split('\n'));
    if (s.bullets) lines.push(...s.bullets);
    if (lines.length) {
      slide.addText(lines.map((l) => ({ text: l, options: { bullet: l !== '—' && !l.startsWith('•') && !/^\(/.test(l) ? { code: '2022' } : false, breakLine: true } })),
        { x: 0.6, y: 1.5, w: textW, h: 3.6, fontSize: 14, color: '333333', fontFace: 'Arial', valign: 'top', lineSpacingMultiple: 1.1 });
    } else {
      slide.addText('—', { x: 0.6, y: 1.5, w: textW, h: 3.6, fontSize: 14, color: GRAY });
    }

    // immagini (griglia semplice a destra o a piena larghezza)
    const imgs = (s.images || []).slice(0, 4);
    if (imgs.length) {
      const baseX = hasImages && lines.length ? 5.9 : 0.6;
      const gridW = hasImages && lines.length ? 3.5 : 8.8;
      const cols = imgs.length === 1 ? 1 : 2;
      const cellW = (gridW - (cols - 1) * 0.2) / cols;
      const cellH = 1.7;
      imgs.forEach((u, i) => {
        const cx = baseX + (i % cols) * (cellW + 0.2);
        const cy = 1.5 + Math.floor(i / cols) * (cellH + 0.2);
        addImageSafe(slide, u, { x: cx, y: cy, w: cellW, h: cellH, sizing: { type: 'cover', w: cellW, h: cellH } });
      });
    }
    slide.addText(project.name || '', { x: 0.6, y: 5.15, w: 8.8, h: 0.35, fontSize: 9, color: GRAY });
  });

  const safe = (project.name || 'Presentazione').replace(/[^\w\- ]+/g, '').trim() || 'Presentazione';
  await pptx.writeFile({ fileName: `${safe}.pptx` });
};
