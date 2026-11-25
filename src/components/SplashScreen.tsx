/**
 * SplashScreen — all'apertura dell'app l'animazione del logo viene SEMPRE completata
 * (richiesta utente: anche se il caricamento è più corto), poi sfuma e lascia l'app.
 * Se il caricamento dura di più, sotto continua il BrandLoader a ciclo (stessa
 * dimensione e posizione, quindi il passaggio non si nota).
 * Paracadute: se il video non parte (errore o autoplay bloccato) si chiude comunque.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SRC = `${import.meta.env.BASE_URL}loader/onirico_anim.mp4`;
const RATE = 1.6;            // stessa velocità del BrandLoader
const MAX_MS = 9000;         // paracadute: 8 s di video / 1.6 + margine

export const SplashScreen: React.FC = () => {
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    const t = window.setTimeout(() => setShow(false), MAX_MS);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="fixed inset-0 z-[500] bg-[#F5F5F3] flex items-center justify-center"
          aria-hidden="true"
        >
          <video
            src={SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="w-[min(420px,80vw)] h-auto"
            style={{ mixBlendMode: 'multiply' }} /* video su fondo bianco: col 'moltiplica' il bianco sparisce nel fondo della pagina */
            onLoadedMetadata={(e) => { (e.currentTarget as HTMLVideoElement).playbackRate = RATE; }}
            onEnded={() => setShow(false)}
            onError={() => setShow(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
