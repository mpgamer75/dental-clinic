
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
// import { LanguagesIcon } from 'lucide-react'; // You can use an icon if preferred

export function LanguageToggleButton() {
  const { lang, setLang } = useLanguage();

  const handleToggleLanguage = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLang(newLang); // This function is expected to handle the navigation
  };

  // The button text shows the language code it will switch TO.
  // e.g., if current language is 'es', button shows 'EN'.
  const buttonText = lang === 'es' ? 'EN' : 'ES';
  const accessibilityLabel = lang === 'es' ? 'Switch to English' : 'Cambiar a Español';

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleToggleLanguage} 
      aria-label={accessibilityLabel}
      className="w-9 h-9" // Consistent with ThemeToggleButton size
    >
      <span className="font-semibold text-sm">{buttonText}</span>
      {/* Example of using an icon instead of text: */}
      {/* <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" /> */}
      <span className="sr-only">{accessibilityLabel}</span>
    </Button>
  );
}
