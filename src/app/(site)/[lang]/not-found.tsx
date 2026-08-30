'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

/* ============================================================================
   404
   ----------------------------------------------------------------------------
   A client component, and deliberately so. Next does not pass `params` to
   `not-found.tsx`, so the locale has to come from somewhere else — and the
   previous version read it from the `x-lang` request header that src/proxy.ts
   sets. That worked, but `headers()` is a Dynamic API, and using one anywhere
   in a segment's tree opts that whole segment out of static generation. This
   one file was keeping every marketing page server-rendered on every request.

   `usePathname()` is the same information from the client, at no cost to the
   pages around it: a 404 is not indexed, is not on the LCP path, and the
   fallback below is the correct language for the overwhelming majority of
   visitors who reach it.
   ========================================================================== */

const STRINGS = {
  es: {
    title: 'Página no encontrada',
    body: 'Lo sentimos, la página que busca no existe o ha sido movida.',
    home: 'Volver al inicio',
  },
  en: {
    title: 'Page not found',
    body: "Sorry, the page you're looking for doesn't exist or has been moved.",
    home: 'Back to home',
  },
} as const;

export default function NotFound() {
  const pathname = usePathname();
  /* Spanish is the default, so an unreadable pathname falls the right way. */
  const lang = pathname?.startsWith('/en') ? 'en' : 'es';
  const t = STRINGS[lang];

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-heading text-h1 text-primary tabular">404</p>
      <h1 className="mt-2 font-heading text-h3 text-ink">{t.title}</h1>
      <p className="mt-4 max-w-measure-tight text-body text-ink-soft">{t.body}</p>
      <Button asChild className="mt-8">
        <Link href={`/${lang}`}>{t.home}</Link>
      </Button>
    </div>
  );
}
