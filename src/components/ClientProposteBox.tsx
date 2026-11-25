/**
 * ClientProposteBox — portale cliente: le proposte delle società del gruppo
 * (clientProposte/<uid>/<id>). Il cliente risponde "Mi interessa" (diventa una richiesta
 * di preventivo per quella società) o "Non ora", con un commento facoltativo.
 */
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Proposta } from '../types';

const SOC: Record<string, string> = { studio: 'Onirico', materico: 'Materico', strategico: 'Strategico', unico: 'Unico', fantastico: 'Fantastico' };

export const ClientProposteBox: React.FC<{ items: Proposta[]; onAnswer: (id: string, accepted: boolean, comment: string) => void }> = ({ items, onAnswer }) => {
  const [comment, setComment] = React.useState<Record<string, string>>({});
  if (!items.length) return <p className="text-[13px] text-stone-500">Nessuna proposta al momento.</p>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((p) => (
        <div key={p.id} className="rounded-2xl border border-[#ececec] p-4 flex flex-col gap-2">
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-stone-500">{SOC[p.soc] || p.soc} ti propone</p>
          <p className="text-[15px] font-black text-[#161616]">{p.title}</p>
          {p.testo && <p className="text-[13px] text-[#444] whitespace-pre-line">{p.testo}</p>}
          {(p.punti || []).filter((x) => x.trim()).length > 0 && (
            <ul className="list-disc pl-5 text-[13px] text-[#444]">{(p.punti || []).filter((x) => x.trim()).map((x, i) => <li key={i}>{x}</li>)}</ul>
          )}
          {p.risposta ? (
            <p className={`text-[13px] font-bold inline-flex items-center gap-1.5 ${p.risposta.accepted ? 'text-emerald-700' : 'text-stone-500'}`}>
              {p.risposta.accepted ? <><CheckCircle2 className="w-4 h-4" /> Ti prepariamo un preventivo.</> : <><XCircle className="w-4 h-4" /> Hai risposto "non ora".</>}
            </p>
          ) : (
            <>
              <textarea rows={2} value={comment[p.id] || ''} onChange={(e) => setComment({ ...comment, [p.id]: e.target.value })} placeholder="Vuoi aggiungere qualcosa? (facoltativo)" className="input w-full px-3 py-2 text-[13.5px]" />
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => onAnswer(p.id, true, comment[p.id] || '')} className="px-4 py-2 rounded-xl bg-[#161616] text-white text-[13px] font-bold border-none cursor-pointer">Mi interessa, preparatemi un preventivo</button>
                <button onClick={() => onAnswer(p.id, false, comment[p.id] || '')} className="px-4 py-2 rounded-xl bg-white border border-[#e2e2e2] text-[#161616] text-[13px] font-bold cursor-pointer">Non ora</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
