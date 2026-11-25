/**
 * MaintenanceScreen — modalità manutenzione (vedi src/maintenance.ts).
 * Blocca l'app per tutti tranne il proprietario: chi non è loggato vede solo
 * "in aggiornamento" + un piccolo accesso per l'amministratore; chi è loggato
 * con un altro account vede lo stesso messaggio e può uscire.
 */
import React from 'react';
import { motion } from 'motion/react';
import { Wrench, LogOut } from 'lucide-react';
import { loginWithGoogle } from '../firebase';

export const MaintenanceScreen: React.FC<{ email?: string | null; onLogout?: () => void }> = ({ email, onLogout }) => (
  <div className="min-h-screen bg-[#F5F5F3] p-8 flex flex-col justify-center items-center select-none font-sans overflow-hidden">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[440px] mx-auto text-center"
    >
      <h1 className="font-black text-[30px] tracking-tight text-[#161616]">Aulico</h1>
      <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-7 mt-6 flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: [0, -18, 14, -8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-600"
        >
          <Wrench className="w-6 h-6" />
        </motion.div>
        <b className="text-[16px] text-[#161616]">Aulico è in aggiornamento</b>
        <p className="text-[13px] text-[#6b6b6b] leading-relaxed">
          Stiamo sistemando e migliorando il gestionale. Tornerà disponibile a breve:
          i tuoi dati sono al sicuro e ritroverai tutto com'era.
        </p>
        <div className="w-full h-1.5 rounded-full bg-[#f0f0ee] overflow-hidden mt-2">
          <motion.div
            className="h-full w-1/3 rounded-full bg-[#161616]"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        {email ? (
          <>
            <p className="text-[12px] text-stone-500 font-semibold mt-2">{email}</p>
            <button onClick={onLogout} className="btn bg-gray-100 hover:bg-gray-200 border-none text-[#161616] font-bold justify-center mt-1 w-full inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Esci
            </button>
          </>
        ) : (
          <button onClick={() => { loginWithGoogle().catch(() => {}); }} className="mt-3 text-[11.5px] font-bold text-stone-500 hover:text-[#161616] bg-transparent border-none cursor-pointer">
            Accesso amministratore
          </button>
        )}
      </div>
    </motion.div>
  </div>
);
