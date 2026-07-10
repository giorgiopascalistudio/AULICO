/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SocietyChat — chat di gruppo interna di UNA società (nodo societyChat/<soc>).
 * Una stanza per società, visibile a chi ha accesso alla società (niente 1:1).
 * Riusa ChatDeleteButton per l'unsend entro 60s; admin/manager può togliere
 * qualsiasi messaggio (imposto anche dalle regole).
 */
import React from 'react';
import { Send, Users } from 'lucide-react';
import type { SocietyChatMessage } from '../types';
import { initials } from '../utils';
import { ChatDeleteButton } from './ChatDeleteButton';

const fmtTime = (at: number) => new Date(at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
const dayKey = (at: number) => new Date(at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

interface Props {
  socLabel: string;
  color: string;
  messages: SocietyChatMessage[];
  myUid: string;
  canWrite: boolean;
  isBoss: boolean;
  onSend: (text: string) => void;
  onDelete: (id: string) => void;
}

export const SocietyChat: React.FC<Props> = ({ socLabel, color, messages, myUid, canWrite, isBoss, onSend, onDelete }) => {
  const [draft, setDraft] = React.useState('');
  const endRef = React.useRef<HTMLDivElement>(null);

  const ordered = [...messages].sort((a, b) => a.at - b.at);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [ordered.length]);

  const send = () => {
    const t = draft.trim();
    if (!t || !canWrite) return;
    onSend(t);
    setDraft('');
  };

  // Raggruppa per giorno per il separatore.
  let lastDay = '';

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[440px] bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden text-left">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f0f0f0] shrink-0">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#f5f5f3] text-[#161616]"><Users className="w-4.5 h-4.5" /></span>
        <div className="min-w-0">
          <b className="block text-[14.5px] font-extrabold text-[#161616] leading-tight truncate">Chat di {socLabel}</b>
          <span className="text-[11px] text-[#8a8a8a]">Chat di gruppo del team — {ordered.length} messagg{ordered.length === 1 ? 'io' : 'i'}</span>
        </div>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5 bg-[#fbfbfa]">
        {ordered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-[#9a9a9a] px-6">
            <Users className="w-10 h-10 opacity-30 mb-3" />
            <b className="text-[#161616] text-[14px] font-semibold mb-1">Ancora nessun messaggio</b>
            <p className="text-[12.5px] max-w-[320px]">Scrivi il primo messaggio: lo vede tutto il team che ha accesso a {socLabel}.</p>
          </div>
        ) : (
          ordered.map((m) => {
            const mine = m.from === myUid;
            const dk = dayKey(m.at);
            const showDay = dk !== lastDay;
            lastDay = dk;
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div className="self-center my-1.5 px-3 py-0.5 rounded-full bg-[#efefec] text-[10.5px] font-bold text-[#8a8a8a] capitalize">{dk}</div>
                )}
                <div className={`flex items-end gap-2 max-w-[86%] ${mine ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  {!mine && (
                    <span className="w-7 h-7 rounded-full bg-[#e6e6e4] text-[#555] text-[10px] font-bold flex items-center justify-center shrink-0" title={m.fromName}>{initials(m.fromName)}</span>
                  )}
                  <div className={`group relative rounded-2xl px-3 py-2 ${mine ? 'bg-[#161616] text-white rounded-br-md' : 'bg-white border border-[#ececec] text-[#161616] rounded-bl-md'}`}>
                    {!mine && <span className="block text-[10.5px] font-extrabold mb-0.5 text-[#6b6b6b]">{m.fromName}</span>}
                    <span className="text-[13px] leading-snug whitespace-pre-wrap break-words">{m.text}</span>
                    <span className={`block text-[9.5px] mt-0.5 text-right ${mine ? 'text-white/55' : 'text-[#b0b0b0]'}`}>{fmtTime(m.at)}</span>
                  </div>
                  {(mine || isBoss) && (
                    mine
                      ? <ChatDeleteButton at={m.at} onDelete={() => onDelete(m.id)} />
                      : <button onClick={() => onDelete(m.id)} title="Elimina messaggio (moderazione)" className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[#c4c4c4] hover:text-rose-600 hover:bg-rose-50 shrink-0"><span className="text-[14px] leading-none">×</span></button>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {canWrite ? (
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#f0f0f0] shrink-0">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Scrivi un messaggio al team…"
            className="flex-1 resize-none px-3.5 py-2.5 rounded-2xl border border-[#e2e2e2] text-[13.5px] outline-none focus:border-[#161616] bg-white max-h-28"
          />
          <button onClick={send} disabled={!draft.trim()} className="w-10 h-10 rounded-full bg-[#161616] hover:bg-black text-white flex items-center justify-center cursor-pointer border-none disabled:opacity-40 shrink-0"><Send className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-[#f0f0f0] text-[12px] text-[#9a9a9a] text-center shrink-0">Sola lettura.</div>
      )}
    </div>
  );
};
