/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { loginWithGoogle } from '../firebase';

interface GoogleLoginProps {
  onError?: (msg: string) => void;
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({ onError }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      // onAuthStateChanged in App will take over from here.
    } catch (e: any) {
      const msg =
        e?.code === 'auth/popup-closed-by-user'
          ? 'Accesso annullato.'
          : 'Accesso non riuscito. Riprova.';
      setErr(msg);
      onError?.(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] p-8 flex flex-col justify-center items-center select-none font-sans">
      <div className="w-full max-w-[400px] mx-auto animate-[popIn_0.35s_ease_both]">
        <div className="text-center mb-8">
          <h1 className="font-black text-[30px] tracking-tight text-[#161616]">
            Onirico Studio <span className="text-stone-400 font-light">· OS</span>
          </h1>
          <p className="text-[13.5px] text-stone-500 mt-2.5 font-medium">
            Accedi con il tuo account Google per entrare nel gestionale.
          </p>
        </div>

        <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-7 flex flex-col gap-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 hover:border-stone-400 cursor-pointer transition-all active:scale-[0.98] w-full font-bold text-[14px] text-[#161616] disabled:opacity-60 disabled:cursor-default"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            {loading ? 'Accesso in corso…' : 'Accedi con Google'}
          </button>

          {err && (
            <p className="text-[12px] text-red-600 font-semibold text-center">{err}</p>
          )}
        </div>

        <div className="text-center mt-8 text-[11px] text-stone-400 font-bold tracking-wide uppercase">
          Onirico Studio OS · Accesso riservato 2026
        </div>
      </div>
    </div>
  );
};
