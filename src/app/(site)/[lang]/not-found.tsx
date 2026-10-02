'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Phone } from 'lucide-react';

import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Button } from '@/components/ui/button';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';

/* ============================================================================
   404
   ----------------------------------------------------------------------------
   A client component, and deliberately so. Next does not pass `params` to
   `not-found.tsx`, so the locale has to come from somewhere else — and the
   previous version read it from the `x-lang` request header that src/proxy.ts
   sets. That worked, but `headers()` is a Dynamic API, and using one anywhere
   in a segment's tree opts that whole segment out of static generation.

   `usePathname()` is the same information from the client, at no cost to the
   pages around it: a 404 is not indexed and is not on the LCP path.

   It offers the three ways forward a patient who followed a dead link is most
   likely to want — book, read about implants, or just call — rather than only
   "back to the start".
   ========================================================================== */

const STRINGS = {
  es: {
    title: 'Página no encontrada',
    body: 'La página que busca no existe o ha cambiado de dirección. Estas le pueden servir:',
    home: 'Ir al inicio',
    book: 'Agendar una cita',
    guide: 'Guía de implantes dentales',
  },
  en: {
    title: 'Page not found',
    body: "The page you're looking for doesn't exist or has moved. These may help:",
    home: 'Go to the home page',
    book: 'Book an appointment',
    guide: 'Dental implant guide',
  },
} as const;

export default function NotFound() {
  const pathname = usePathname();
  /* Spanish is the default, so an unreadable pathname falls the right way. */
  const lang = pathname?.startsWith('/en') ? 'en' : 'es';
  const t = STRINGS[lang];
  const links = contactLinkLabels(lang);

  return (
    <div className="shell py-[clamp(4rem,10vw,8rem)]">
      <div className="max-w-2xl">
        <p className="font-heading text-h1 text-primary tabular">404</p>
        <h1 className="mt-2 font-heading text-h3 text-ink">{t.title}</h1>
        <p className="mt-4 max-w-measure text-body text-ink-soft">{t.body}</p>

        <ul className="mt-8 divide-y divide-line border-y border-line">
          {[
            { href: `/${lang}/agendar-cita`, label: t.book },
            { href: `/${lang}/implantes-dentales`, label: t.guide },
            { href: `/${lang}`, label: t.home },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex min-h-14 items-center justify-between gap-4 font-medium text-ink transition-colors duration-fast hover:text-primary"
              >
                {link.label}
                <ArrowRight
                  className="h-4 w-4 text-brass-ink transition-transform duration-base ease-out-quart group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={TEL_HREF} aria-label={links.callAria}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="tabular">{links.phone}</span>
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={whatsappHref(lang)} aria-label={links.whatsappAria} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              {links.whatsapp}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
