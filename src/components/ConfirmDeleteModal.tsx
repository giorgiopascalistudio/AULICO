/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ConfirmDeleteModal — doppia conferma per ogni eliminazione.
 * Primo click su "Elimina" arma il pulsante; il secondo click ("Conferma eliminazione")
 * esegue davvero l'azione. Gli elementi eliminati finiscono nel Cestino per 60 giorni
 * (salvo `permanent`, usato dal Cestino stesso per l'eliminazione definitiva).
 */
import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export interface ConfirmDeleteRequest {
  title: string;
  message?: string | null;
  onConfirm: () => void;
  /** true = niente cestino, eliminazione definitiva (testo più severo). */
  permanent?: boolean;
}

interface ConfirmDeleteModalProps {
  request: ConfirmDeleteRequest;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ request, onClose }) => {
  const [armed, setArmed] = useState(false);

  // Reset dello stato "armato" quando cambia la richiesta
  useEffect(() => { setArmed(false); }, [request]);

  const confirm = () => {
    if (!armed) { setArmed(true); return; }
    request.onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-[26px] sm:rounded-[26px] w-full sm:max-w-sm p-6 shadow-2xl text-left animate-[riseIn_0.2s_ease_both]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${armed ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'}`}>
            {armed ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-[15.5px] font-extrabold text-[#161616] leading-snug">{request.title}</h4>
            <p className="text-[12.5px] text-[#8a8a8a] font-medium mt-1.5 leading-relaxed">
              {request.message
                || (request.permanent
                  ? 'L\'elemento verrà eliminato definitivamente. Questa azione non è reversibile.'
                  : 'L\'elemento verrà spostato nel Cestino e conservato per 60 giorni prima dell\'eliminazione definitiva.')}
            </p>
            {armed && (
              <p className="text-[12px] text-rose-700 font-bold mt-2.5 animate-[riseIn_0.18s_ease_both]">
                {request.permanent ? 'Sei sicuro? Premi di nuovo per eliminare per sempre.' : 'Sei sicuro? Premi di nuovo per confermare.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-[#e2e2e2] rounded-full py-2.5 text-[12.5px] font-bold text-[#6b6b6b] hover:bg-[#f5f5f5] bg-white cursor-pointer transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={confirm}
            className={`flex-1 rounded-full py-2.5 text-[12.5px] font-bold text-white border-none cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              armed ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#1b1b1b] hover:bg-black'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {armed ? (request.permanent ? 'Conferma definitiva' : 'Conferma eliminazione') : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
};
