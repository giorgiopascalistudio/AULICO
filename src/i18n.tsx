/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Layer i18n leggero (niente librerie) per il PORTALE CLIENTE + landing/login.
 *
 * - `useLang()` ritorna `{ lang, setLang, t }`.
 * - Fuori dal `LangProvider` (es. tutto il lato studio) il context vale italiano:
 *   i componenti condivisi studio+portale che usano `useLang()` restano quindi in
 *   italiano senza modifiche.
 * - Le traduzioni sono curate a mano in `src/locales/{it,en}.ts`. `en` è tipato
 *   `Record<keyof typeof it, string>` → il compilatore segnala ogni chiave mancante.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setI18nLocale } from './utils';
import { it } from './locales/it';
import { en } from './locales/en';

export type Lang = 'it' | 'en';
export type TVars = Record<string, string | number>;

const DICTS: Record<Lang, Record<string, string>> = { it, en };

function interpolate(s: string, vars?: TVars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Traduce una chiave: dict[lang] → fallback italiano → la chiave stessa. */
export function translate(lang: Lang, key: string, vars?: TVars): string {
  const dict = DICTS[lang] || DICTS.it;
  const val = dict[key] ?? DICTS.it[key] ?? key;
  return interpolate(val, vars);
}

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: TVars) => string;
}

const DEFAULT_LANG: Lang = 'it';

const LangContext = createContext<LangCtx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
});

export const useLang = (): LangCtx => useContext(LangContext);

/** Lingua iniziale dedotta dal browser (default italiano = mercato primario). */
export function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'it';
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'it';
}

interface LangProviderProps {
  /** Lingua dal profilo utente (se loggato). */
  initialLang?: Lang;
  /** Persiste la scelta (es. su users/<uid>.lang). Se assente → solo in memoria. */
  onPersist?: (l: Lang) => void;
  children: React.ReactNode;
}

export const LangProvider: React.FC<LangProviderProps> = ({ initialLang, onPersist, children }) => {
  const [lang, setLangState] = useState<Lang>(initialLang ?? detectBrowserLang());

  // Allinea quando il profilo arriva/cambia da Firebase.
  useEffect(() => {
    if (initialLang && initialLang !== lang) setLangState(initialLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLang]);

  // Locale globale per date/valuta; ripristina italiano allo smontaggio così il
  // lato studio non eredita la lingua del portale.
  useEffect(() => {
    setI18nLocale(lang);
    return () => setI18nLocale('it');
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    onPersist?.(l);
  };

  const value = useMemo<LangCtx>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

/** Pillola di selezione lingua IT / EN nello stile Onirico. */
export const LangToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex items-center rounded-full border border-[#e2e2e2] bg-white p-0.5 select-none ${className || ''}`}
    >
      {(['it', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition ${
            lang === l ? 'bg-[#161616] text-white' : 'text-[#8a8a8a] hover:text-[#161616]'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};
