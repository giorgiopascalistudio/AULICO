/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CinematicShowcase — pagina vetrina "cinematica" (struttura villa-omnia).
 * Un unico video continuo a tutto schermo; lo scroll (rotella) o lo swipe
 * fanno avanzare il video tra "scene" mappate su secondi precisi (di regola
 * una scena ogni ~3s), ognuna con titolo grande centrato + testo narrativo.
 *
 * Usi:
 *  - Landing pubblica di AuthFlow (config LANDING_SHOWCASE in showcaseData.ts)
 *    con i tasti "Inizia il tuo progetto" / "Sono già cliente" nel footer.
 *  - Pagina vetrina degli immobili Unico (config per-deal, nodo unicoShowcase).
 *
 * Fluidità (anche mobile): NON si fa scrubbing per-frame di `currentTime` (un
 * seek a ogni frame = lag e schermo nero su mobile). In avanti si RIPRODUCE il
 * video a velocità maggiorata fino al secondo della scena (decode lineare =
 * fluido); all'indietro un solo seek. Il primo frame si "innesca" con un
 * play/pause muto (necessario su iOS, altrimenti il video resta nero).
 *
 * I video sono SEMPRE online (URL diretto mp4): nessun upload runtime. In
 * caricamento si resta su NERO con il titolo che lampeggia (niente immagine).
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { UnicoShowcaseScene } from '../types';
import { safeUrl } from '../utils';
import { useLang } from '../i18n';

interface CinematicShowcaseProps {
  videoUrl?: string | null;          // video continuo online (mp4 diretto)
  poster?: string | null;            // immagine sfondo SOLO se non c'è video (deal Unico senza tour)
  scenes: UnicoShowcaseScene[];      // scene ordinate per time (s)
  brand: string;                     // titolo centrale (es. "ONIRICO" o titolo immobile)
  brandLogo?: string | null;         // se presente: logo (img) al posto del testo `brand` al centro
  brandSub?: string;                 // sottotitolo sotto il brand
  /** CTA mostrata al posto del testo sull'ULTIMA scena (come il prototipo). */
  discoverLabel?: string;
  onDiscover?: () => void;
  /** Contenuto fisso renderizzato in basso (es. i 2 tasti login). */
  footer?: React.ReactNode;
  /** Se presente: pulsante [ chiudi ] in alto a destra (uso overlay). */
  onClose?: () => void;
  /** Slot in alto a sinistra, sempre visibile (es. selettore lingua in landing). */
  cornerSlot?: React.ReactNode;
}

export const CinematicShowcase: React.FC<CinematicShowcaseProps> = ({
  videoUrl, poster, scenes, brand, brandLogo, brandSub, discoverLabel, onDiscover, footer, onClose, cornerSlot,
}) => {
  const { t } = useLang();
  // Scene ordinate e con fallback: senza scene la pagina resta statica.
  const SCENES = scenes.length ? [...scenes].sort((a, b) => a.time - b.time) : [{ time: 0, subtitle: brand, text: '' }];

  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [ready, setReady] = useState(false); // il video ha iniziato a riprodurre → via il velo nero
  const [showTapHint, setShowTapHint] = useState(false); // iPad: autoplay bloccato → invita a toccare

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const idxRef = useRef(0); // indice corrente leggibile dentro i listener nativi

  const src = safeUrl(videoUrl || '');
  const posterSrc = safeUrl(poster || '');
  const logoSrc = safeUrl(brandLogo || '');
  const hasVideo = !!src && !videoFailed;

  const rafRef = useRef<number | null>(null);
  const primedRef = useRef(false); // il video ha già riprodotto (decoder attivo)
  const cancelRaf = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };

  // Forza muted via JS (React non setta sempre la property → autoplay bloccato).
  const forceMuted = () => {
    const v = videoRef.current;
    if (v) { v.muted = true; v.defaultMuted = true; }
  };

  // Porta il video al secondo `target`. In AVANTI riproduce a velocità maggiorata
  // (decode lineare = fluido su PC e mobile, niente seek per-frame); all'INDIETRO
  // si ANIMA il riavvolgimento (currentTime decrescente via rAF) così il rewind è
  // VISIBILE, non un salto secco. Alla fine PAUSA: il frame resta (il decoder ha già
  // riprodotto, quindi anche su iOS il fotogramma è renderizzato, non nero). Niente loop.
  const TRANSITION_RATE = 2.6; // velocità play-forward verso la scena
  const REWIND_RATE = 2.0;     // secondi di video al secondo reale durante il rewind
  const applyTarget = (target: number, instant = false) => {
    const v = videoRef.current;
    if (!v || !v.duration || isNaN(v.duration)) return;
    cancelRaf();
    forceMuted();
    const tgt = Math.max(0, Math.min(target, v.duration - 0.05));

    // Posizionamento istantaneo (solo per l'innesco iniziale del decoder).
    if (instant) {
      try { v.currentTime = tgt; } catch { /* seek non pronto */ }
      v.pause();
      return;
    }

    // AVANTI → riproduzione lineare accelerata fino al target, poi pausa.
    if (tgt > v.currentTime + 0.05) {
      v.playbackRate = TRANSITION_RATE;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      const tick = () => {
        const vv = videoRef.current;
        if (!vv) { rafRef.current = null; return; }
        if (vv.currentTime >= tgt - 0.04 || vv.ended) {
          try { vv.currentTime = tgt; } catch { /* noop */ }
          vv.pause();
          vv.playbackRate = 1;
          rafRef.current = null;
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // INDIETRO → riavvolgimento VISIBILE e fluido su PC e mobile. Due accorgimenti:
    //  (1) si emette un nuovo seek SOLO quando il precedente è stato renderizzato
    //      (!v.seeking) → su MOBILE i fotogrammi non vengono coalescizzati/saltati;
    //  (2) il passo è proporzionale al TEMPO reale trascorso (REWIND_RATE) → su PC,
    //      dove i seek sono istantanei, la velocità resta costante e morbida invece
    //      di precipitare a scatti. rAF-based → cancelRaf lo annulla a un nuovo swipe.
    if (tgt < v.currentTime - 0.05) {
      v.pause();
      v.playbackRate = 1;
      let prev = performance.now();
      const tick = () => {
        const vv = videoRef.current;
        if (!vv) { rafRef.current = null; return; }
        if (!vv.seeking) { // il fotogramma precedente è stato mostrato
          const now = performance.now();
          const step = REWIND_RATE * Math.min(0.1, (now - prev) / 1000); // clamp anti-salto
          if (step >= 0.008) {
            prev = now;
            const next = vv.currentTime - step;
            if (next <= tgt + 0.02) {
              try { vv.currentTime = tgt; } catch { /* noop */ }
              rafRef.current = null;
              return;
            }
            try { vv.currentTime = next; } catch { /* noop */ }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Già sulla scena.
    try { v.currentTime = tgt; } catch { /* noop */ }
    v.pause();
  };

  // Cambio scena: aggiorna il testo + muovi il video alla scena.
  const changeScene = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(nextIdx, SCENES.length - 1));
    setCurrentSceneIdx(clamped);
    idxRef.current = clamped;
    lastScrollTime.current = Date.now();
    applyTarget(SCENES[clamped].time);
  };

  // L'autoplay muto serve SOLO a "primare" il decoder (su iOS un video mai
  // riprodotto resta nero). Appena parte, prendiamo il controllo: posizioniamo
  // sulla scena corrente e mettiamo in pausa → da lì comanda lo scroll.
  const handlePlaying = () => {
    setReady(true);
    if (primedRef.current) return;
    primedRef.current = true;
    applyTarget(SCENES[idxRef.current].time, true);
  };

  // Tentativo di avvio muto, ripetibile (src pronto, buffer pronto, tocco utente).
  const tryPlay = () => {
    if (primedRef.current) return;
    forceMuted();
    const v = videoRef.current;
    const p = v && v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  // Tenta il play appena il src è pronto (desktop parte qui; mobile via autoplay).
  useEffect(() => {
    if (!hasVideo) return;
    tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, hasVideo]);

  // iPad/Safari desktop-mode: l'autoplay di un video CON audio è spesso bloccato →
  // dopo un attimo, se ancora nero, mostra l'invito a toccare per avviare.
  useEffect(() => {
    if (!hasVideo || ready) { setShowTapHint(false); return; }
    const id = setTimeout(() => setShowTapHint(true), 1500);
    return () => clearTimeout(id);
  }, [hasVideo, ready]);

  // Rete di sicurezza: SOLO se l'autoplay è bloccato a freddo, il primo gesto utente
  // innesca il decoder. Una volta innescato (primedRef) NON tocca più il video → un
  // semplice click non fa più partire il play "normale".
  useEffect(() => {
    if (!hasVideo) return;
    const kick = () => {
      if (primedRef.current) { detach(); return; } // già innescato: niente play sui click
      forceMuted();
      const v = videoRef.current;
      const p = v && v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    const detach = () => {
      document.removeEventListener('touchstart', kick);
      document.removeEventListener('pointerdown', kick);
    };
    document.addEventListener('touchstart', kick, { passive: true });
    document.addEventListener('pointerdown', kick);
    return detach;
  }, [hasVideo]);

  useEffect(() => () => cancelRaf(), []);

  // Listener nativi (non-passivi) per rotella + swipe: così possiamo bloccare
  // lo scroll della pagina (pull-to-refresh incluso) → sensazione "app".
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() - lastScrollTime.current < 700) return;
      if (e.deltaY > 3) changeScene(idxRef.current + 1);
      else if (e.deltaY < -3) changeScene(idxRef.current - 1);
    };
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // blocca lo scroll nativo della pagina
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (Math.abs(deltaY) < 30) return;
      if (Date.now() - lastScrollTime.current < 700) return;
      if (deltaY < 0) { changeScene(idxRef.current + 1); touchStartY.current = e.touches[0].clientY; }
      else { changeScene(idxRef.current - 1); touchStartY.current = e.touches[0].clientY; }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SCENES.length]);

  const isLast = currentSceneIdx === SCENES.length - 1;
  const scene = SCENES[currentSceneIdx];
  const loadingText = brand || SCENES[0].subtitle;

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className="relative w-full h-dvh overflow-hidden bg-black text-stone-100 font-sans flex flex-col select-none"
    >
      <style>{`
        @keyframes cinFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .cin-fade-in { animation: cinFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes cinBlink { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        .cin-blink { animation: cinBlink 1.6s ease-in-out infinite; }
        @keyframes cinBounce { 0%,100% { transform: translateY(0); opacity: 0.55; } 50% { transform: translateY(6px); opacity: 1; } }
        .cin-bounce { animation: cinBounce 1.7s ease-in-out infinite; }
        /* Video di sfondo. Su MOBILE → object-contain (fotogramma intero, niente crop
           aggressivo su schermo verticale; le bande si fondono con lo sfondo nero); da
           tablet/desktop (sm+) → object-cover a tutto schermo. object-fit gestito via
           classi Tailwind sull'elemento (object-contain sm:object-cover). */
        .cin-video { width: 100%; height: 100%; }
      `}</style>

      {/* 1. Sfondo: video continuo (o, in assenza di video, immagine del deal) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-black">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={src}
            className="cin-video select-none object-contain sm:object-cover scale-[1.6] origin-center sm:scale-100"
            muted
            autoPlay
            playsInline
            preload="auto"
            disablePictureInPicture
            onPlaying={handlePlaying}
            onLoadedData={tryPlay}
            onCanPlay={tryPlay}
            onError={() => setVideoFailed(true)}
          />
        ) : posterSrc ? (
          <img src={posterSrc} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : null}

        {/* Vignettature alto/basso per il contrasto dei testi.
            Su mobile la sfumatura nera in basso è PIÙ ALTA (h-[90%]) → stacco più morbido. */}
        <div className="absolute top-0 left-0 w-full h-[42%] sm:h-40 bg-gradient-to-b from-black sm:from-black/80 via-black/65 sm:via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[90%] sm:h-[70%] bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none" />
      </div>

      {/* 1b. Velo NERO in caricamento: lampeggia il logo finché il video non è pronto.
             TOCCABILE: su iPad (autoplay bloccato per via dell'audio) un tocco avvia il video. */}
      {hasVideo && !ready && (
        <div
          onPointerDown={tryPlay}
          className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center px-6 gap-5 pointer-events-auto cursor-pointer"
        >
          {logoSrc ? (
            <img src={logoSrc} alt={brand} referrerPolicy="no-referrer" className="cin-blink w-[72%] max-w-[360px] sm:max-w-[460px] object-contain" />
          ) : (
            <span className="cin-blink text-center font-sans font-semibold text-white tracking-wide text-[26px] leading-tight sm:text-4xl md:text-5xl">
              {loadingText}
            </span>
          )}
          {showTapHint && (
            <span className="cin-bounce font-sans font-semibold uppercase tracking-[0.2em] text-white/70 text-[10.5px] sm:text-[11.5px]">
              {t('cin.tapToStart')}
            </span>
          )}
        </div>
      )}

      {/* 2a. Slot in alto a sinistra (es. selettore lingua nella landing). */}
      {cornerSlot && (
        <div className="absolute top-0 left-0 z-20 p-5 md:p-6 pointer-events-auto">
          {cornerSlot}
        </div>
      )}

      {/* 2. Solo il pulsante chiudi (uso overlay), in alto a destra. Niente brand qui. */}
      {onClose && (
        <header className="absolute top-0 right-0 z-20 p-5 md:p-6 pointer-events-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[10px] font-sans font-semibold tracking-[0.15em] text-stone-300 hover:text-white transition duration-300 uppercase cursor-pointer bg-white/5 hover:bg-white/15 border border-white/15 rounded-full px-3.5 py-2"
          >
            <X className="w-3 h-3" /> {t('cin.close')}
          </button>
        </header>
      )}

      {/* 3. Brand UNICO, FISSO e centrato (non cambia con le scene): logo se presente, altrimenti testo. */}
      <section className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-3">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={brand}
            referrerPolicy="no-referrer"
            className="cin-fade-in w-[82%] max-w-[420px] sm:max-w-[520px] md:max-w-[600px] object-contain select-none pointer-events-none"
          />
        ) : (
          <h2 className="cin-fade-in font-sans font-semibold text-white tracking-wide leading-[1.04] text-[42px] sm:text-6xl md:text-7xl lg:text-[88px]">
            {brand}
          </h2>
        )}
        {brandSub && (
          <p className="cin-fade-in font-sans uppercase tracking-[0.3em] text-stone-300 text-[10.5px] sm:text-[12px]">
            {brandSub}
          </p>
        )}
      </section>

      {/* 4. Barra inferiore: descrizione del settore (cambia con lo scroll) + pallini +
             (solo all'ultima scena) CTA/footer; prima, indizio di scroll. */}
      <div className="relative z-10 w-full px-6 pb-10 md:pb-12 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Descrizione settore: font del sito (sans), niente corsivo. Testo più grande
            e con ombra per restare leggibile sopra il video. */}
        <div className="text-center max-w-xl min-h-[68px] flex flex-col items-center justify-end gap-1.5 [text-shadow:0_2px_14px_rgba(0,0,0,0.85)]">
          <h3 key={`sub-${currentSceneIdx}`} className="cin-fade-in font-sans font-bold text-white tracking-wide text-[18px] sm:text-[22px] md:text-[24px]">
            {scene.subtitle}
          </h3>
          {scene.text && (
            <p key={`txt-${currentSceneIdx}`} className="cin-fade-in font-sans font-normal text-stone-100 leading-relaxed text-[13.5px] sm:text-[15px] md:text-[16px]">
              {scene.text}
            </p>
          )}
        </div>

        {SCENES.length > 1 && (
          <div className="flex items-center gap-1.5">
            {SCENES.map((s, i) => (
              <button
                key={`${s.time}-${i}`}
                onClick={() => changeScene(i)}
                aria-label={t('cin.sceneAria', { n: i + 1 })}
                className={`rounded-full transition-all duration-500 cursor-pointer ${i === currentSceneIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}

        {/* CTA "Scopri" (deal Unico) e/o tasti d'accesso (footer) SOLO alla fine; prima, indizio "scorri". */}
        {isLast ? (
          <div className="flex flex-col items-center gap-3">
            {onDiscover && (
              <button
                onClick={onDiscover}
                className="cin-fade-in flex items-center gap-2 px-7 h-12 border border-white/30 hover:border-white bg-white/10 hover:bg-white text-[13.5px] text-white hover:text-stone-950 font-sans font-bold tracking-wide rounded-full transition-all duration-500 ease-out active:scale-95 cursor-pointer"
              >
                {discoverLabel || t('cin.discoverDefault')}
              </button>
            )}
            {footer}
          </div>
        ) : (
          <div className="cin-bounce flex flex-col items-center gap-1 text-white/70 select-none">
            <span className="font-sans font-semibold uppercase tracking-[0.25em] text-[10.5px]">{t('cin.scrollHint')}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};
