/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MobileHomeHint — popup mostrato UNA volta al primo accesso da mobile con le istruzioni
 * per aggiungere Onirico alla schermata Home (iOS Safari / Android Chrome).
 * Non compare se l'app è già aperta come "installata" (standalone) o se già chiuso.
 * Il flag "già visto" è UI di dispositivo → localStorage (non sono dati di business).
 */
import React, { useEffect, useState } from 'react';
import { Share, Plus, MoreVertical, X, Home } from 'lucide-react';

const KEY = 'onirico_a2hs_dismissed';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
const isStandalone = () =>
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;

export const MobileHomeHint: React.FC = () => {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(true);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 768px)').matches || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === '1'; } catch { /* private mode */ }
    if (mobile && !isStandalone() && !dismissed) {
      setIos(isIOS());
      const t = setTimeout(() => setShow(true), 1200); // lascia caricare l'app
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]" onClick={close}>
      <div
        className="w-full max-w-[460px] bg-white rounded-t-[26px] sm:rounded-[26px] sm:mb-6 border border-[#e2e2e2] shadow-2xl p-5 pb-7 text-left animate-[riseIn_0.28s_cubic-bezier(0.16,1,0.3,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#161616] text-white flex items-center justify-center"><Home className="w-5 h-5" /></span>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#161616] leading-tight">Aggiungi Onirico alla Home</h3>
              <p className="text-[12px] text-[#8a8a8a] mt-0.5">Accedi più velocemente, come un'app.</p>
            </div>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9a9a9a] hover:bg-[#ececec] shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {ios ? (
          <ol className="flex flex-col gap-2.5 mt-2">
            <Step n={1}>Tocca l'icona <b>Condividi</b> <Share className="inline w-4 h-4 -mt-0.5 text-[#161616]" /> nella barra di Safari.</Step>
            <Step n={2}>Scorri e scegli <b>«Aggiungi a Home»</b> <Plus className="inline w-4 h-4 -mt-0.5 text-[#161616]" />.</Step>
            <Step n={3}>Conferma con <b>«Aggiungi»</b>: l'icona comparirà sulla schermata Home.</Step>
          </ol>
        ) : (
          <ol className="flex flex-col gap-2.5 mt-2">
            <Step n={1}>Tocca il menu <b>⋮</b> <MoreVertical className="inline w-4 h-4 -mt-0.5 text-[#161616]" /> in alto a destra in Chrome.</Step>
            <Step n={2}>Scegli <b>«Aggiungi a schermata Home»</b> (o «Installa app»).</Step>
            <Step n={3}>Conferma: troverai Onirico tra le tue app.</Step>
          </ol>
        )}

        <button onClick={close} className="mt-5 w-full py-3 rounded-2xl bg-[#161616] hover:bg-black text-white font-bold text-[14px] cursor-pointer border-none">Ho capito</button>
      </div>
    </div>
  );
};

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-3">
    <span className="w-6 h-6 rounded-full bg-[#f0f0f0] text-[#161616] text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
    <span className="text-[13px] text-[#3a3a3a] leading-snug min-w-0 break-words">{children}</span>
  </li>
);
