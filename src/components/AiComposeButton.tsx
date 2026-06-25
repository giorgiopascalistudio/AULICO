/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AiComposeButton — pulsantino "✨" per il composer di una chat.
 * Se c'è una bozza la riscrive in modo professionale; se è vuota suggerisce una
 * risposta (con contesto opzionale). Usa `callAi` (Worker Groq, gratis).
 */
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { callAi } from '../firebase';

export const AiComposeButton: React.FC<{
  text: string;
  context?: string;
  onResult: (text: string) => void;
  title?: string;
}> = ({ text, context, onResult, title }) => {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const has = text.trim().length > 0;
      const prompt = has
        ? `Riscrivi in modo professionale, chiaro e cortese questo messaggio, mantenendo lingua e significato senza aggiungere informazioni inventate:\n"""${text.slice(0, 2000)}"""`
        : `Suggerisci un messaggio professionale e cortese in una chat tra studio e cliente.${context ? ` Contesto recente:\n${context.slice(0, 2000)}` : ''}\nScrivi solo il messaggio, in italiano.`;
      const out = await callAi({
        prompt,
        system: 'Sei un assistente che scrive messaggi professionali per uno studio di architettura/ingegneria (gruppo Aulico). Rispondi SOLO con il testo del messaggio, senza virgolette né preamboli.',
        maxTokens: 300,
      });
      if (out && out.trim()) onResult(out.trim());
    } catch {
      /* AI opzionale: in caso di errore non blocca la chat */
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      title={title || 'Migliora / suggerisci con AI'}
      className="h-[38px] w-[38px] rounded-xl flex items-center justify-center cursor-pointer border border-[#e2e2e2] bg-white hover:bg-[#fafafa] text-[#b45309] disabled:opacity-50 shrink-0"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
    </button>
  );
};
