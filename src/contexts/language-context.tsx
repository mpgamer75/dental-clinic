"use client";

import React, { createContext, useContext, useState } from 'react';
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

  const toggleLanguage = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLang(newLang);
    
    // Update URL to reflect language change
    if (pathname) {
      const currentLangPrefix = `/${lang}`;
      const newLangPrefix = `/${newLang}`;
      
      if (pathname.startsWith(currentLangPrefix)) {
        const newPath = pathname.replace(currentLangPrefix, newLangPrefix);
        router.push(newPath);
      } else {
        // If somehow we're not on a language prefixed route, just go to the home page
        router.push(`/${newLang}`);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
