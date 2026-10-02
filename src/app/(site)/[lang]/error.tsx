'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Phone, RotateCcw } from 'lucide-react';

import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';

const COPY = {
  es: {
    title: 'Algo ha fallado al cargar esta página',
    description:
      'Suele ser pasajero: vuelva a intentarlo en un momento. Si necesita pedir una cita ahora, llámenos o escríbanos por WhatsApp.',
    retry: 'Reintentar',
    home: 'Ir al inicio',
  },
  en: {
    title: 'Something went wrong loading this page',
    description:
      'It is usually temporary: try again in a moment. If you need to book now, call us or message us on WhatsApp.',
    retry: 'Try again',
    home: 'Go to the home page',
  },
} as const;

/**
 * Route error boundary for the public site.
 *
 * A failure here is exactly when a patient most needs another way through, so
 * it offers the clinic's phone and WhatsApp next to the retry — the previous
 * version offered only "Reintentar", in destructive red.
 *
 * Logs the digest, never the error object: CLAUDE.md's "never log a raw error"
 * holds in the browser too, and in production the digest is what correlates
 * this with the server log anyway.
 */
export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const links = contactLinkLabels(lang);

  useEffect(() => {
    console.error('[%s] route error, digest %s', lang, error.digest ?? 'none');
  }, [error, lang]);

  return (
    <div className="shell py-[clamp(4rem,10vw,8rem)]">
      <div className="max-w-2xl">
        <h1 className="font-heading text-h2 font-medium text-ink">{copy.title}</h1>
        <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-soft">{copy.description}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => reset()} size="lg">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {copy.retry}
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={TEL_HREF} aria-label={links.callAria}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="tabular">{links.phone}</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={whatsappHref(lang)} aria-label={links.whatsappAria} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              {links.whatsapp}
            </a>
          </Button>
        </div>

        <Link
          href={`/${lang}`}
          className="mt-6 inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
        >
          {copy.home}
        </Link>
      </div>
    </div>
  );
}
