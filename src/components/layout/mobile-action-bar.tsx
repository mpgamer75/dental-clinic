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
/**
 * The exact vertical space this bar occupies, for whatever has to clear it.
 *
 * 2 × `p-2.5` (1.25rem) + the `h-12` controls (3rem) + the 1px top rule, plus
 * the safe-area inset the bar pads itself with. Exported rather than
 * duplicated: the footer has to reserve precisely this much, and a second
 * hand-copied number would drift the first time the buttons change size.
 */
export const MOBILE_ACTION_BAR_HEIGHT =
  'calc(4.25rem + 1px + env(safe-area-inset-bottom, 0px))';

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
      /* Opaque, and no `backdrop-blur`.
         This bar is pinned to the bottom of the viewport for the whole visit
         on the exact devices least able to afford it. A backdrop filter
         re-samples and re-blurs the content behind it on every frame that
         content moves, so on a phone it was paying for a blur pass through
         every pixel of every scroll. `bg-canvas` at full opacity also gives
         the two labels a stable ground instead of whatever photograph or
         drenched band happens to be sliding past underneath. */
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-line bg-canvas lg:hidden print:hidden"
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
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground shadow-e1 transition-colors duration-fast active:bg-primary-hover"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          {t.book}
        </Link>
      </div>
    </div>
  );
}
