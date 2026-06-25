/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NewsletterButton — iscrizione/disiscrizione newsletter (nodo newsletter/<uid>).
 * Autonomo: legge/scrive via gli helper Firebase, nessuna prop handler.
 */
import React, { useEffect, useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { watchNode, writeNode } from '../firebase';

export const NewsletterButton: React.FC<{ uid: string; name?: string; email?: string }> = ({ uid, name, email }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const off = watchNode(`newsletter/${uid}`, (v: any) => setSubscribed(!!v?.subscribed), () => {});
    return () => { try { off && off(); } catch { /* noop */ } };
  }, [uid]);

  const toggle = async () => {
    setBusy(true);
    const next = !subscribed;
    try {
      await writeNode(`newsletter/${uid}`, { uid, name: name || null, email: email || null, subscribed: next, at: Date.now() });
      setSubscribed(next);
    } catch { /* opzionale: ignora errori */ }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-[22px] p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-9 h-9 rounded-full bg-[#161616] text-white flex items-center justify-center shrink-0"><Mail className="w-4 h-4" /></span>
        <div className="min-w-0">
          <b className="block text-[13.5px] text-[#161616]">Newsletter</b>
          <span className="block text-[11.5px] text-[#8a8a8a] truncate">{subscribed ? 'Sei iscritto: riceverai aggiornamenti e novità.' : 'Iscriviti per ricevere aggiornamenti e novità.'}</span>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 text-[12.5px] font-bold px-3.5 py-2 rounded-xl border cursor-pointer disabled:opacity-50 ${subscribed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#1b1b1b] text-white border-[#1b1b1b] hover:bg-black'}`}
      >
        {subscribed ? <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Iscritto</span> : 'Iscriviti'}
      </button>
    </div>
  );
};
