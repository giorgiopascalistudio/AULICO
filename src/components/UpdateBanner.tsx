/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Avviso "nuova versione online": confronta il build id in esecuzione
 * (__BUILD_ID__, iniettato da vite.config) con version.json pubblicato accanto
 * a index.html. Ogni deploy su Pages cambia version.json → compare il pulsante
 * "Aggiorna" che ricarica con cache-busting (?v=...). Risolve il problema
 * ricorrente della cache di GitHub Pages sul telefono (l'utente restava sulla
 * versione vecchia senza saperlo). Check all'avvio, ogni 4 minuti e quando
 * l'app torna in primo piano.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw } from 'lucide-react';

declare const __BUILD_ID__: string;

export const UpdateBanner: React.FC = () => {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (typeof __BUILD_ID__ === 'undefined') return; // ambienti senza define
    let stop = false;
    const check = async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return; // dev server / file assente: nessun banner
        const v = await r.json();
        if (!stop && v && v.id && v.id !== __BUILD_ID__) setReady(true);
      } catch { /* offline: riprova al prossimo giro */ }
    };
    check();
    const iv = setInterval(check, 4 * 60 * 1000);
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  if (!ready) return null;

  const refresh = () => {
    // Query param nuovo = index.html rivalidato anche se in cache (routing a hash: innocuo).
    const u = new URL(window.location.href);
    u.searchParams.set('v', String(Date.now()));
    window.location.replace(u.toString());
  };

  return createPortal(
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+92px)] md:bottom-24 z-[210]">
      <button
        onClick={refresh}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#161616] text-white text-[13px] font-bold shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] border border-[#2c2c2c] cursor-pointer active:scale-95 transition-transform"
      >
        <RefreshCw className="w-4 h-4" /> Nuova versione — Aggiorna
      </button>
    </div>,
    document.body,
  );
};
