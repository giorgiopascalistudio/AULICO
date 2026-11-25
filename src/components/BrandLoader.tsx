/**
 * BrandLoader — caricamento con l'animazione del logo (public/loader/onirico_anim.mp4,
 * generata da onirico_anim.mov: tratto scuro su #F5F5F3, lo stesso fondo dell'app).
 * `full` = schermata intera (avvio/verifica accesso); altrimenti riquadro nella pagina.
 */
import React from 'react';

const SRC = `${import.meta.env.BASE_URL}loader/onirico_anim.mp4`;

export const BrandLoader: React.FC<{ full?: boolean; label?: string }> = ({ full = false, label }) => (
  <div className={full ? 'min-h-screen bg-[#F5F5F3] flex items-center justify-center font-sans' : 'w-full flex items-center justify-center py-16'}>
    <div className="flex flex-col items-center gap-2">
      <video
        src={SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className={full ? 'w-[min(420px,80vw)] h-auto' : 'w-[240px] h-auto'}
        style={{ background: '#F5F5F3', WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at center, #000 86%, transparent 100%)', maskImage: 'radial-gradient(ellipse 50% 50% at center, #000 86%, transparent 100%)' }}
        onLoadedMetadata={(e) => { (e.currentTarget as HTMLVideoElement).playbackRate = 1.6; }}
      />
      {label && <span className="text-[11.5px] font-bold uppercase tracking-wider text-stone-400">{label}</span>}
    </div>
  </div>
);
