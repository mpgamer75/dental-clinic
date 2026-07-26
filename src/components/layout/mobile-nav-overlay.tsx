'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Languages, MapPin, Phone, X } from 'lucide-react';
import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';

import { contactDetails, generalUiStrings, navStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import type { Language } from '@/lib/types';
import { NavWordmark } from '@/components/layout/nav-wordmark';
import type { NavEntry, NavLink } from '@/components/layout/nav-model';

interface MobileNavOverlayProps {
  lang: Language;
  /** Owned by the navbar: Escape / outside-click / focus-return read it too. */
  panelRef: RefObject<HTMLDivElement>;
  primary: NavEntry[];
  secondary: NavLink[];
  activeKey: string | null;
  onClose: () => void;
  onNavigate: (key: string) => void;
}

/**
 * Entrance stagger.
 *
 * 35ms per row, 380ms per row (`--dur-slow`), last row starting at 200ms — so
 * the menu is fully settled at 580ms. Past ~600ms a menu stops feeling
 * responsive and starts feeling like it is loading.
 *
 * Only transform and opacity animate (the `fade-up` keyframe), so the whole
 * sequence stays on the compositor. The delay rides a custom property because
 * an inline `animation-delay` cannot be gated by a media query, and under
 * `prefers-reduced-motion: reduce` the `motion-safe:` variants drop out
 * entirely — no animation, no fill mode, everything simply visible.
 */
const step = (index: number): CSSProperties =>
  ({ ['--stagger']: `${index * 35}ms` }) as CSSProperties;

const ROW = 'motion-safe:animate-fade-up motion-safe:[animation-delay:var(--stagger)]';

/**
 * Full-screen menu.
 *
 * A dropdown panel repeats the header's own visual register at a smaller size,
 * which is why the old one read as a fallback rather than as a designed state.
 * This is a different register entirely: the page is replaced, the links are
 * set in the heading serif at display size, indices sit in the gutter, and the
 * practice's contact details are given as a block instead of one lonely
 * telephone row.
 *
 * Mounted only while open, so every effect here is unconditionally active.
 */
export function MobileNavOverlay({
  lang,
  panelRef,
  primary,
  secondary,
  activeKey,
  onClose,
  onNavigate,
}: MobileNavOverlayProps) {
  const { toggleLanguage } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);

  const t = navStrings[lang];
  const ui = generalUiStrings[lang];

  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;
  const phone = contactDetails.phone[lang];
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const address = contactDetails.address[lang];
  const mapLink = contactDetails.mapLink[lang];
  const schedule = contactDetails.schedule[lang];

  useBodyScrollLock(true);
  useFocusTrap(panelRef, true);

  // Focus lands on the close control: it is the first thing in the panel and
  // the one action every user needs guaranteed access to.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // `ink-soft`: `ink-faint` measures 3.58:1 on this canvas — enough for an icon,
  // not for a label. The ordinals below stay faint; they are aria-hidden
  // decoration and carry nothing the list order does not already say.
  const rowLabel = 'text-eyebrow uppercase tracking-[0.12em] text-ink-soft';
  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  return (
    <div
      ref={panelRef}
      id="mobile-nav"
      role="dialog"
      aria-modal="true"
      aria-label={t.menuTitle}
      tabIndex={-1}
      className="grain fixed inset-0 z-modal flex flex-col overflow-y-auto overscroll-contain bg-canvas motion-safe:animate-fade-in xl:hidden print:hidden"
    >
      {/* Top row — same grid, same height as the bar it replaces, so the
          wordmark does not move when the menu opens. */}
      <div className="shell shrink-0">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <NavWordmark lang={lang} href={homeHref} onClick={onClose} />

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.closeMenu}
            className={`-mr-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-soft transition-colors duration-fast hover:text-terracotta ${focusRing}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="shell flex-1 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-4">
        {/* Primary index */}
        <nav aria-label={t.primaryLabel}>
          <ul className="border-t border-line/70">
            {primary.map((item, index) => {
              const active = activeKey === item.key;
              return (
                <li key={item.key} className={`border-b border-line/70 ${ROW}`} style={step(index)}>
                  <Link
                    href={item.href}
                    data-active={active}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => {
                      onNavigate(item.key);
                      onClose();
                    }}
                    className={`group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-2 rounded-sm py-4 ${focusRing}`}
                  >
                    <span
                      aria-hidden="true"
                      className="tabular text-eyebrow text-ink-soft transition-colors duration-fast group-hover:text-brass-ink group-data-[active=true]:text-terracotta"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-heading text-[clamp(1.8rem,7.5vw,2.6rem)] font-medium leading-[1.18] tracking-[-0.015em] text-ink transition-colors duration-fast group-hover:text-terracotta group-data-[active=true]:text-terracotta">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* The ask */}
        <div className={`mt-8 ${ROW}`} style={step(6)}>
          <Link
            href={appointmentsHref}
            onClick={onClose}
            className={`inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-terracotta text-small uppercase tracking-[0.085em] text-primary-foreground shadow-e1 transition-colors duration-fast ease-out-quart hover:bg-terracotta-hover ${focusRing}`}
          >
            {ui.appointments}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Secondary index — the bands that do not earn a slot in the bar. */}
        {/* aria-labelledby, not aria-label: the same string is already visible
            below, so aria-label made screen readers announce it twice — once as
            the landmark name and once as the paragraph. */}
        <nav aria-labelledby="nav-also-on-page" className={`mt-9 ${ROW}`} style={step(7)}>
          <p id="nav-also-on-page" className={rowLabel}>
            {t.alsoOnPage}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {secondary.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`inline-flex h-11 items-center text-small text-ink-soft underline-offset-4 transition-colors duration-fast hover:text-terracotta hover:underline ${focusRing}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* The practice, in full. */}
        <div
          className={`mt-8 grid gap-x-8 gap-y-6 border-t border-line/70 pt-7 sm:grid-cols-2 ${ROW}`}
          style={step(8)}
        >
          <div>
            <p className={rowLabel}>{t.callLabel}</p>
            <a
              href={telHref}
              aria-label={t.callAria.replace('{{phone}}', phone)}
              className={`mt-1.5 inline-flex min-h-11 items-center gap-2.5 py-1 font-heading text-h4 leading-[1.18] text-ink transition-colors duration-fast hover:text-terracotta ${focusRing}`}
            >
              <Phone className="h-4 w-4 shrink-0 text-brass-ink" aria-hidden="true" />
              <span className="tabular">{phone}</span>
            </a>
          </div>

          <div>
            <p className={rowLabel}>{t.addressLabel}</p>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1.5 flex min-h-11 items-start gap-2.5 py-1.5 text-small leading-relaxed text-ink-soft transition-colors duration-fast hover:text-terracotta ${focusRing}`}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-ink" aria-hidden="true" />
              <span>
                {address}
                <span className="sr-only"> — {t.viewMap}</span>
              </span>
            </a>
          </div>

          <div>
            <p className={rowLabel}>{t.hoursLabel}</p>
            <p className="mt-1.5 flex items-start gap-2.5 whitespace-pre-line text-small leading-relaxed text-ink-soft">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brass-ink" aria-hidden="true" />
              <span>{schedule}</span>
            </p>
          </div>

          <div>
            <p className={rowLabel}>{t.languageLabel}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  onClose();
                }}
                aria-label={t.switchTo}
                className={`inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-small text-ink-soft transition-colors duration-fast hover:border-terracotta/50 hover:text-terracotta ${focusRing}`}
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                {t.switchToShort}
              </button>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
