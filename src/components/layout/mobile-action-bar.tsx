'use client';

import Link from 'next/link';
import { Phone, CalendarCheck } from 'lucide-react';
import { contactDetails } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';

/**
 * Persistent call / book bar, phones only.
 *
 * The header's "Agendar Cita" button is `hidden sm:inline-flex`, so below
 * 640px the only way to reach the booking page was to open the hamburger menu
 * first — the clinic's entire conversion path was two taps behind a menu on
 * the devices most patients actually use. The phone number had the same
 * problem.
 *
 * Both actions are now always one tap away. The bar is hidden at `lg` and up,
 * where the header already shows them.
 */
export function MobileActionBar() {
  const { lang } = useLanguage();
  const phone = contactDetails.phone[lang];
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;

  const t =
    lang === 'es'
      ? { call: 'Llamar', book: 'Agendar cita' }
      : { call: 'Call', book: 'Book' };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-line bg-canvas/95 backdrop-blur-lg lg:hidden print:hidden"
      // Keeps the buttons clear of the iOS home indicator / Android gesture bar.
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-2 gap-2 p-2.5">
        <a
          href={telHref}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface font-medium text-ink transition-colors duration-fast active:bg-canvas-sunk"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {t.call}
        </a>
        <Link
          href={`/${lang}/agendar-cita`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-terracotta font-medium text-primary-foreground shadow-e1 transition-colors duration-fast active:bg-terracotta-hover"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          {t.book}
        </Link>
      </div>
    </div>
  );
}
