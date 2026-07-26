'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

export function BackToTop() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const label = lang === 'es' ? 'Volver arriba' : 'Back to top';

  useEffect(() => {
    const toggleVisibility = () => {
      // Afficher le bouton après 400px de scroll
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      /*
       * Removed from the tab order and the accessibility tree while hidden.
       *
       * The button was only visually hidden (opacity 0 + pointer-events-none),
       * so it stayed focusable: a keyboard user tabbing through the page hit an
       * invisible control announced as "Volver arriba". Opacity is not a
       * focus-management tool.
       *
       * (`inert` would express this in one attribute, but it is not in React
       * 18's prop types — it landed in React 19.)
       */
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible || undefined}
      disabled={!isVisible}
      className={cn(
        // Desktop only: on phones the MobileActionBar owns this corner.
        'fixed bottom-8 right-8 z-sticky hidden h-12 w-12 rounded-full shadow-e3 lg:flex',
        'bg-terracotta text-primary-foreground hover:bg-terracotta-hover',
        'transition-[opacity,transform,background-color] duration-base ease-out-quart',
        'hover:shadow-e4',
        'group',
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
      aria-label={label}
      title={label}
    >
      <ArrowUp
        className="h-5 w-5 transition-transform duration-base group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </Button>
  );
}

