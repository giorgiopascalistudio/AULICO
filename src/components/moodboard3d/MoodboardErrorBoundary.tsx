/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Error boundary per il moodboard 3D: evita che un'eccezione nel canvas/WebGL
 * azzeri l'intera app (pagina bianca) e mostra l'errore in modo leggibile.
 */
import React from 'react';
import { createPortal } from 'react-dom';

interface Props { onClose: () => void; children: React.ReactNode; }
interface State { error: Error | null; }

export class MoodboardErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // visibile in console per il debug
    console.error('Moodboard3D crash:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return createPortal(
        <div className="fixed inset-0 z-[130] bg-[#F5F5F3] flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white border border-[#e2e2e2] rounded-[24px] p-6 shadow-2xl text-left">
            <h3 className="text-[16px] font-extrabold text-[#161616]">Il moodboard 3D ha riscontrato un errore</h3>
            <p className="text-[12.5px] text-[#8a8a8a] mt-1">Il resto dell'app è al sicuro. Dettaglio tecnico (utile per la correzione):</p>
            <pre className="mt-3 max-h-[40vh] overflow-auto text-[11px] leading-relaxed text-rose-700 bg-rose-50/60 border border-rose-100 rounded-xl p-3 whitespace-pre-wrap break-words">
{this.state.error.message}
{this.state.error.stack ? '\n\n' + this.state.error.stack.split('\n').slice(0, 6).join('\n') : ''}
            </pre>
            <div className="flex justify-end mt-4">
              <button onClick={this.props.onClose} className="px-4 py-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold cursor-pointer">Chiudi</button>
            </div>
          </div>
        </div>,
        document.body
      );
    }
    return this.props.children;
  }
}
