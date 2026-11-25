/**
 * HowToBox — riquadro "Come funziona" sopra le sezioni (testi in src/howto.ts).
 * La prima volta è aperto; "Ho capito" lo riduce a un piccolo "?" che lo riapre.
 * La preferenza è un'impostazione di interfaccia del dispositivo (localStorage), non un dato.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X } from 'lucide-react';
import { HOWTO } from '../howto';

const KEY = (id: string) => `aulico_howto_ok_${id}`;

export const HowToBox: React.FC<{ id: string; className?: string }> = ({ id, className }) => {
  const h = HOWTO[id];
  const [open, setOpen] = React.useState<boolean>(() => {
    try { return !localStorage.getItem(KEY(id)); } catch { return true; }
  });
  if (!h) return null;
  const close = () => { setOpen(false); try { localStorage.setItem(KEY(id), '1'); } catch { /* ignora */ } };

  return (
    <div className={`no-print ${className || ''}`}>
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div key="open" initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
            <div className="relative bg-white border border-[#e2e2e2] rounded-[22px] px-5 py-4 mb-4">
              <button onClick={close} aria-label="Chiudi" className="absolute top-3 right-3 p-1.5 rounded-lg text-[#767676] hover:text-[#161616] hover:bg-[#f5f5f3] bg-transparent border-none cursor-pointer"><X className="w-4 h-4" /></button>
              <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#767676] flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Come funziona</p>
              <p className="text-[15px] font-black text-[#161616] mt-0.5 pr-8">{h.title}</p>
              <ol className="mt-2.5 flex flex-col gap-2 list-none p-0 m-0">
                {h.steps.map((s, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.06 }} className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#161616] text-white text-[12px] font-black flex items-center justify-center shrink-0 mt-[1px]">{i + 1}</span>
                    <span className="text-[13px] text-[#333] leading-snug">{s}</span>
                  </motion.li>
                ))}
              </ol>
              {h.tip && <p className="text-[12px] text-[#6b6b6b] mt-2.5 leading-snug">{h.tip}</p>}
              <button onClick={close} className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#f5f5f3] hover:bg-[#ececec] text-[12px] font-bold text-[#161616] border-none cursor-pointer">Ho capito</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end -mb-1">
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold text-[#6b6b6b] hover:text-[#161616] hover:bg-white bg-transparent border-none cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5" /> Come funziona
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
