/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NewsletterButton — consenso newsletter (nodo newsletter/<uid>) con la stessa
 * spunta della privacy in registrazione. Autonomo: legge/scrive via gli helper
 * Firebase, nessuna prop handler.
 *  - variant 'banner' (default): mostra un banner SOLO se non si è iscritti;
 *    una volta spuntato (iscritto) sparisce.
 *  - variant 'inline' (profilo): resta sempre visibile, la spunta riflette lo
 *    stato e permette di iscriversi/disiscriversi.
 */
import React, { useEffect, useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { watchNode, writeNode } from '../firebase';

export const NewsletterButton: React.FC<{
  uid: string;
  name?: string;
  email?: string;
  variant?: 'banner' | 'inline';
}> = ({ uid, name, email, variant = 'banner' }) => {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const off = watchNode(`newsletter/${uid}`, (v: any) => setSubscribed(!!v?.subscribed), () => setSubscribed(false));
    return () => { try { off && off(); } catch { /* noop */ } };
  }, [uid]);

  const setSub = async (next: boolean) => {
    setBusy(true);
    try {
      await writeNode(`newsletter/${uid}`, { uid, name: name || null, email: email || null, subscribed: next, at: Date.now() });
      setSubscribed(next);
    } catch { /* opzionale */ }
    finally { setBusy(false); }
  };

  // Stato non ancora noto → niente flash
  if (subscribed === null) return null;

  // BANNER: appare solo se NON iscritto; la spunta lo conferma e lo fa sparire.
  if (variant === 'banner') {
    if (subscribed) return null;
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-[22px] p-4 flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-[#161616] text-white flex items-center justify-center shrink-0"><Mail className="w-4 h-4" /></span>
        <div className="min-w-0 flex-1">
          <b className="block text-[13.5px] text-[#161616]">Resta aggiornato</b>
          <span className="block text-[11.5px] text-[#8a8a8a]">Iscriviti alla newsletter per ricevere aggiornamenti e novità sul tuo progetto.</span>
          <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer select-none">
            <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${busy ? 'opacity-50' : ''} border-stone-300 bg-white`}>
              {/* non spuntato finché non iscritto */}
            </span>
            <input type="checkbox" checked={false} disabled={busy} onChange={() => setSub(true)} className="hidden" />
            <span className="text-[12.5px] text-[#161616] font-bold">Iscrivimi alla newsletter</span>
          </label>
        </div>
      </div>
    );
  }

  // INLINE (profilo): spunta sempre visibile, riflette lo stato e si può cambiare.
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${subscribed ? 'bg-[#1b1b1b] border-[#1b1b1b]' : 'border-stone-300 bg-white'} ${busy ? 'opacity-50' : ''}`}>
        {subscribed && <Check className="w-3.5 h-3.5 text-white" />}
      </span>
      <input type="checkbox" checked={subscribed} disabled={busy} onChange={(e) => setSub(e.target.checked)} className="hidden" />
      <span className="text-[12.5px] text-[#555]">Iscrizione alla <b className="text-[#161616]">newsletter</b></span>
    </label>
  );
};
