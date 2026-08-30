"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Language } from '@/lib/types';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLanguage: () => void;
};

const defaultContext: LanguageContextType = {
  lang: 'es',
  setLang: () => {},
  toggleLanguage: () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export const LanguageProvider = ({ 
  children, 
  initialLanguage = 'es' 
}: LanguageProviderProps) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const router = useRouter();
  const pathname = usePathname();

  // Keep context state in sync when the locale changes by navigation rather
  // than by the toggle (back/forward, a direct /en link, a redirect).
  useEffect(() => {
    setLang(initialLanguage);
  }, [initialLanguage]);

  // Keep <html lang> honest.
  //
  // The root layout sets it from the [lang] route param, but a layout does NOT
  // re-render on a client-side navigation between /es and /en — App Router
  // layouts persist across route changes. So after the toggle the document
  // still claimed lang="es" while displaying English, which misleads screen
  // readers (wrong pronunciation rules) and translation tooling.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const toggleLanguage = () => {
    const newLang: Language = lang === 'es' ? 'en' : 'es';
    setLang(newLang);

    if (!pathname) return;

    // Swap ONLY the leading locale segment.
    //
    // `pathname.replace('/es', '/en')` replaced the first occurrence anywhere
    // in the string, so a path that happened to contain the locale later on
    // was silently corrupted. Anchoring to the start makes that impossible.
    const rest = pathname.startsWith(`/${lang}`) ? pathname.slice(`/${lang}`.length) : '';
    const nextPath = `/${newLang}${rest}`;

    // Preserve the query string and the hash. The previous implementation
    // dropped both, so switching language on `/es/agendar-cita?utm_source=…`
    // lost the campaign attribution, and switching on `/es#contacto` bounced
    // the visitor back to the top of the page instead of holding their place.
    // Read from `location` rather than `useSearchParams()`.
    //
    // The hook was the only thing in this provider that read request state
    // during render, and doing so opts the whole subtree out of static
    // generation unless it is wrapped in Suspense — which, since this provider
    // wraps every page, meant either a blank first paint or no prerendering at
    // all. Both are a heavy price for a value that is only ever needed inside
    // this click handler, where `location` is available and authoritative.
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const hash = typeof window !== 'undefined' ? window.location.hash : '';

    router.push(`${nextPath}${search}${hash}`);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
