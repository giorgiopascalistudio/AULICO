/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Rete di sicurezza: cattura gli errori di render di React e mostra un messaggio
 * leggibile a schermo invece della "pagina bianca". Permette anche di copiare il
 * dettaglio tecnico per la diagnosi e di ricaricare l'app.
 */
interface State {
  error: Error | null;
  info: string | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log in console per chi apre gli strumenti sviluppatore.
    console.error('[Aulico] Errore di render catturato:', error, info);
    this.setState({ info: info.componentStack || null });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    const detail = `${error.name}: ${error.message}\n\n${error.stack || ''}\n\n${info || ''}`;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 720, width: '100%', background: '#fff', border: '1px solid #e2e2e2', borderRadius: 24, padding: 28, textAlign: 'left' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#161616', margin: '0 0 8px' }}>Si è verificato un errore</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', margin: '0 0 16px', lineHeight: 1.5 }}>
            L'app ha incontrato un problema durante il caricamento. Copia il dettaglio qui sotto e invialo allo sviluppatore.
          </p>
          <pre style={{ fontSize: 12, color: '#9f1239', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 14, overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {detail}
          </pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => { try { navigator.clipboard.writeText(detail); } catch { /* noop */ } }}
              style={{ background: '#fff', border: '1px solid #e2e2e2', color: '#161616', fontWeight: 700, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}
            >
              Copia il dettaglio
            </button>
            <button
              onClick={() => { window.location.reload(); }}
              style={{ background: '#1b1b1b', border: 'none', color: '#fff', fontWeight: 700, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}
            >
              Ricarica
            </button>
          </div>
        </div>
      </div>
    );
  }
}
