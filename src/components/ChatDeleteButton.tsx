/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ChatDeleteButton — pulsante "elimina messaggio" visibile solo entro 60 secondi
 * dall'invio (finestra di ripensamento, stile "unsend"). Si nasconde da solo allo
 * scadere senza ri-renderizzare la vista che lo contiene. Mostrato solo accanto
 * ai PROPRI messaggi (il chiamante verifica `from === myUid`); la finestra dei
 * 60s è imposta anche dalle regole Firebase per cliente/partner.
 */
import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

export const CHAT_DELETE_WINDOW_MS = 60_000;

export const ChatDeleteButton: React.FC<{
  at: number;                 // timestamp invio messaggio
  onDelete: () => void;
}> = ({ at, onDelete }) => {
  const [, setTick] = useState(0);
  const left = at + CHAT_DELETE_WINDOW_MS - Date.now();

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setTick((x) => x + 1), left + 250);
    return () => clearTimeout(t);
  }, [at]);

  if (left <= 0) return null;
  return (
    <button
      onClick={onDelete}
      title="Elimina messaggio (entro 60s dall'invio)"
      className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[#b0b0b0] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
};
