/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FeedbackModal — form "Segnala ad Aulico" (periodo di test): bug/malfunzionamento,
 * richiesta di implementazione, o inoltro di un box di errore (prefill.errorText).
 * Aperto da: sidebar desktop, menu "Altro" mobile, pulsante "Segnala" sui toast di
 * errore, e "Nuova segnalazione" nella sezione Sviluppo Software → Aulico.
 * Portal su body (§9-bis), z-240 (sopra Modal 220, sotto ConfirmDelete 300).
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { Bug, Lightbulb, AlertTriangle, X, Send } from 'lucide-react';
import type { DevReport } from '../types';

export interface FeedbackPrefill {
  kind?: DevReport['kind'];
  title?: string;
  errorText?: string;
}

interface Props {
  prefill: FeedbackPrefill;
  onClose: () => void;
  onSubmit: (data: { kind: DevReport['kind']; title: string; description: string; errorText?: string | null }) => void;
}

export const FeedbackModal: React.FC<Props> = ({ prefill, onClose, onSubmit }) => {
  const isError = prefill.kind === 'errore';
  const [kind, setKind] = React.useState<DevReport['kind']>(prefill.kind || 'bug');
  const [title, setTitle] = React.useState(prefill.title || '');
  const [desc, setDesc] = React.useState('');

  const canSend = !!(title.trim() || isError);
  const send = () => {
    if (!canSend) return;
    onSubmit({
      kind,
      title: title.trim() || 'Errore segnalato dall\'app',
      description: desc.trim(),
      errorText: prefill.errorText || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[240] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div
        className="w-full sm:max-w-[480px] max-h-[88vh] overflow-y-auto bg-white rounded-t-[26px] sm:rounded-[24px] p-5 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <b className="block text-[16px] tracking-tight text-[#161616]">Segnala ad Aulico</b>
            <span className="text-[11.5px] text-[#8a8a8a]">Aiutaci a migliorare il gestionale durante il test</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer bg-transparent border-none shrink-0"><X className="w-4.5 h-4.5" /></button>
        </div>

        {isError ? (
          <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-orange-700 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Errore da inoltrare
            </div>
            <pre className="text-[11.5px] text-[#7a3a12] whitespace-pre-wrap break-words font-mono m-0">{prefill.errorText}</pre>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setKind('bug')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12.5px] font-bold cursor-pointer ${kind === 'bug' ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2] text-[#333]'}`}
            >
              <Bug className="w-4 h-4" /> Bug / malfunzionamento
            </button>
            <button
              onClick={() => setKind('richiesta')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12.5px] font-bold cursor-pointer ${kind === 'richiesta' ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2] text-[#333]'}`}
            >
              <Lightbulb className="w-4 h-4" /> Richiesta / idea
            </button>
          </div>
        )}

        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mb-1">Titolo</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isError ? 'Cosa stavi facendo quando è comparso?' : kind === 'bug' ? 'Cosa non funziona?' : 'Cosa vorresti aggiungere/migliorare?'}
          className="w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[13.5px] outline-none focus:border-[#161616] bg-white mb-3"
        />

        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#8a8a8a] mb-1">Descrizione</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          placeholder="Più dettagli ci dai, prima lo sistemiamo: i passi per riprodurlo, cosa ti aspettavi, in quale sezione eri…"
          className="w-full px-3 py-2.5 rounded-xl border border-[#e2e2e2] text-[13.5px] outline-none focus:border-[#161616] bg-white mb-2 resize-y"
        />

        <p className="text-[10.5px] text-[#9a9a9a] mb-3">Con l'invio vengono allegati automaticamente la pagina corrente e il tipo di dispositivo.</p>

        <button
          onClick={send}
          disabled={!canSend}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#161616] hover:bg-black text-white text-[13.5px] font-bold cursor-pointer border-none disabled:opacity-40 disabled:cursor-default"
        >
          <Send className="w-4 h-4" /> Invia segnalazione
        </button>
      </div>
    </div>,
    document.body,
  );
};
