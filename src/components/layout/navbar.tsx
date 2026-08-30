'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, Phone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { contactDetails, generalUiStrings, navStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { cn } from '@/lib/utils';
import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { useStickySentinel } from '@/hooks/use-sticky-sentinel';
import { getPrimaryNav, getSecondaryNav } from '@/components/layout/nav-model';
import { MobileNavOverlay } from '@/components/layout/mobile-nav-overlay';
import { NavWordmark } from '@/components/layout/nav-wordmark';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Site header.
 *
 * Three weight tiers, not nine peers. The bar previously set the wordmark, six
 * links, a telephone number, two toggles and a call to action at effectively
 * one visual weight in one flat row, which is why it read as scaffolding:
 *
 *   1. the wordmark, alone at full ink weight;
 *   2. the destinations — tracked uppercase, ink-soft, and the only things in
 *      the bar that can be *active*;
 *   3. the utilities — telephone, theme, language — fenced off behind a
 *      hairline, because none of them is a place you can go. They are demoted
 *      by size, case and position rather than by colour: `ink-faint` measures
 *      3.58:1 here, which is legal for the toggle's glyphs and illegal for
 *      anything with words in it, so only the glyphs take it.
 *
 * The call to action sits outside that ramp on colour rather than on weight: an
 * outlined primary control that fills on hover, which stays the loudest
 * element without becoming a solid slab parked in the corner of every page.
 *
 * Two behaviours carry the rest of it — the bar changes shape once it leaves
 * the top of the page, and exactly one link is lit for wherever the reader
 * currently is. Both are IntersectionObserver-driven; there is no scroll
 * handler anywhere in this component.
 */
export function Navbar() {
  const { lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const ui = generalUiStrings[lang];
  const t = navStrings[lang];

  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;
  const phone = contactDetails.phone[lang];
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;

  const primary = useMemo(() => getPrimaryNav(lang), [lang]);
  const secondary = useMemo(() => getSecondaryNav(lang), [lang]);

  const { ref: sentinelRef, stuck } = useStickySentinel<HTMLDivElement>();
  const { activeKey: spyKey, pin } = useScrollSpy(primary, pathname ?? '');

  // Nothing is active while the hero is on screen: the reader is at the top of
  // the page, not inside a section. `stuck` is the cheapest honest signal for
  // that, and it doubles as the reset when the spy is holding a stale value
  // after scrolling back up out of the first section.
  const activeKey = stuck ? spyKey : null;

  // `aria-current="page"` is reserved for a real route match. In-page anchors
  // get `aria-current="true"` — the reader is *at* that content, but it is not
  // a separate page and announcing it as one is a lie.
  const onHome = pathname === homeHref;
  const onBooking = pathname === appointmentsHref;

  const callLabel = t.callAria.replace('{{phone}}', phone);

  // Close the panel on Escape and on any outside click, and return focus to the
  // toggle so keyboard users aren't stranded.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // Close the panel when the route changes (e.g. an anchor link was followed).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ...and when the viewport grows into the desktop bar, where the overlay is
  // display:none. Leaving it "open" would keep the body scroll-locked against
  // a menu nobody can see.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(min-width: 1280px)');
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [open]);

  return (
    <>
      {/* Scroll-state sentinel. Zero height, so it costs no layout; the header
          is "stuck" precisely when this has left the top of the viewport. */}
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none h-0" />

      {/* The <header> element reserves the flow space and never changes size.
          A sticky box still occupies its original space in the document, so
          changing the element's own size on scroll pulled 17px out of the page
          and every section under it lurched upward at the moment it stuck
          (measured: document height 13707 → 13690). Everything that reacts to
          the scroll state is the absolutely positioned child below, which is
          out of flow and so costs the layout nothing. Pointer events are handed
          to that child so the strip of empty header left beside it cannot
          swallow clicks on the page. */}
      <header
        data-stuck={stuck}
        className="group/header pointer-events-none sticky top-0 z-header h-[4.5rem] w-full print:hidden"
      >
        <div
          className={cn(
            'pointer-events-auto absolute inset-x-0 top-0',
            // Exactly two properties move: the bar's ground and its bottom
            // rule. A header that changes more than that on scroll is
            // performing rather than responding — and the two it used to add
            // were both expensive.
            //
            // The bar also shrank from 4.5rem to 3.5rem on a `transition-
            // [height]`. Height is a layout property: every frame of that
            // 220ms transition relaid out the bar's contents, and because the
            // sticky header sits above a ~13,700px document the browser had to
            // resolve the whole thing again each time.
            //
            // The ground was `bg-canvas/85` behind `backdrop-blur-xl`, which
            // is worse than it looks. A backdrop filter re-samples and re-blurs
            // whatever is behind the element every frame it changes — and this
            // element is stuck to the top of a page whose entire content
            // scrolls underneath it, so "every frame it changes" means the rest
            // of the session. Opaque canvas costs one paint, reads more
            // legibly over the hero photograph, and stops the header being a
            // containing block for fixed descendants into the bargain.
            'border-b border-transparent bg-transparent',
            'group-data-[stuck=true]/header:border-line/60 group-data-[stuck=true]/header:bg-canvas',
            'motion-safe:transition-[background-color,border-color] motion-safe:duration-base motion-safe:ease-out-quart',
          )}
        >
          {/* The page's own grid, not a container that happens to sit above it:
              the wordmark lands on the left rule every section starts from and
              the call to action on the right rule they end on.

              No `w-full` — Tailwind's utilities layer is emitted after the
              components layer, so it would beat `.shell`'s own
              `width: min(100% - gap*2, --shell-max)` and run the header edge to
              edge while the page below it kept its gutters. */}
          <div className="shell">
            {/* One fixed height, at every scroll position. See the note on the
                band above for why the shrink went. */}
            <div className="flex h-[4.5rem] items-center justify-between gap-3">
              {/* ── Tier 1: the masthead ─────────────────────────────── */}
              <NavWordmark lang={lang} href={homeHref} current={onHome} withTagline />

              {/* ── Tier 2: destinations ─────────────────────────────── */}
              <nav
                aria-label={t.primaryLabel}
                className="hidden min-w-0 flex-1 items-center justify-center xl:flex"
              >
                {primary.map((item) => {
                  const active = activeKey === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      data-active={active}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => pin(item.key)}
                      className={cn(
                        'group/link relative inline-flex h-11 shrink-0 items-center rounded-sm px-3.5',
                        'text-small uppercase tracking-[0.085em] text-ink-soft',
                        'transition-colors duration-fast ease-out-quart hover:text-ink data-[active=true]:text-ink',
                        FOCUS_RING,
                      )}
                    >
                      {/* The affordance is a drawn rule, not a filled rectangle.
                        It grows from the left on enter and retracts to the
                        right on exit — the origin flip is what makes it read as
                        one continuous stroke passing through rather than a box
                        appearing. The active item holds the same rule in
                        the primary, so hover and state speak one language. */}
                      <span
                        className={cn(
                          'relative after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px',
                          'after:origin-right after:scale-x-0 after:bg-current',
                          'after:transition-transform after:duration-base after:ease-out-quart',
                          'group-hover/link:after:origin-left group-hover/link:after:scale-x-100',
                          'group-focus-visible/link:after:origin-left group-focus-visible/link:after:scale-x-100',
                          'group-data-[active=true]/link:after:origin-left group-data-[active=true]/link:after:scale-x-100',
                          'group-data-[active=true]/link:after:bg-primary',
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex shrink-0 items-center gap-0.5">
                {/* ── Tier 3: utilities, behind the fence ────────────── */}
                <span aria-hidden="true" className="mr-2 hidden h-5 w-px bg-line xl:block" />

                <a
                  href={telHref}
                  aria-label={callLabel}
                  className={cn(
                    'hidden h-11 items-center gap-2 rounded-lg px-2.5 lg:inline-flex',
                    'text-small text-ink-soft transition-colors duration-fast hover:text-primary',
                    FOCUS_RING,
                  )}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  <span className="tabular hidden 2xl:inline">{phone}</span>
                </a>

                {/* The shared toggle paints its glyphs brass — right as a lone
                  accent, wrong inside a cluster that is meant to recede. The
                  descendant selectors below outrank the utility class on the
                  icon itself (0,1,1 over 0,1,0), which also lets the ghost
                  button's grey hover fill give way to a colour-only hover.

                  This is the one place `ink-faint` is used: measured 3.58:1 on
                  canvas, which clears the 3:1 that a non-text graphic needs and
                  falls short of the 4.5:1 that any label would. */}
                <span className="hidden md:block [&_button:hover]:bg-transparent [&_button:hover_svg]:text-primary [&_svg]:text-ink-faint">
                  <ThemeToggleButton />
                </span>

                <button
                  type="button"
                  onClick={toggleLanguage}
                  aria-label={t.switchTo}
                  title={t.switchTo}
                  className={cn(
                    'hidden h-11 w-11 items-center justify-center rounded-lg md:inline-flex',
                    'text-eyebrow uppercase text-ink-soft transition-colors duration-fast hover:text-primary',
                    FOCUS_RING,
                  )}
                >
                  {lang === 'es' ? 'EN' : 'ES'}
                </button>

                {/* ── The ask ────────────────────────────────────────── */}
                <Link
                  href={appointmentsHref}
                  aria-current={onBooking ? 'page' : undefined}
                  className={cn(
                    /* Visible at EVERY width. It used to be `hidden sm:inline-flex`,
                       which was survivable only because a fixed bottom bar carried
                       the same action on phones. That bar is gone, and without this
                       change the booking path on a 390px screen would be two taps
                       behind the hamburger on every page that has no hero — the
                       booking page itself, the privacy page, all six implant pages.
                       Narrower padding below `sm` so it still fits beside the
                       wordmark and the menu button. */
                    'group/cta ml-2 inline-flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 sm:px-4',
                    'border border-primary/45 text-small uppercase tracking-[0.085em] text-primary',
                    // Colour only. The hover used to raise an `e1` shadow as
                    // well, which put box-shadow in the transition list — a
                    // repaint of a blurred spread on every frame, on the one
                    // element that is on screen for the entire visit. An
                    // outlined control filling solid is already the loudest
                    // hover on the page; it does not also need to lift.
                    'transition-[color,background-color,border-color] duration-base ease-out-quart',
                    'hover:border-primary hover:bg-primary hover:text-primary-foreground',
                    FOCUS_RING,
                  )}
                >
                  {/* Two labels, one control. The full label is ~13 characters of
                      wide-tracked uppercase; beside the wordmark and the menu
                      button at 390px it pushed the clinic name into an ellipsis.
                      English is worse — "Schedule Appointment" is 20. Rendering
                      both and toggling with a breakpoint keeps a single link in
                      the accessibility tree, where swapping the whole element
                      would duplicate it. */}
                  <span className="sm:hidden">{ui.appointmentsShort}</span>
                  <span className="hidden sm:inline">{ui.appointments}</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-base ease-out-quart group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <button
                  ref={toggleRef}
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-label={open ? t.closeMenu : t.openMenu}
                  aria-expanded={open}
                  /* No aria-controls: the overlay is mounted only while open,
                     so the IDREF dangled on every page load. aria-expanded
                     alone is valid here. */
                  className={cn(
                    '-mr-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg xl:hidden',
                    'text-ink-soft transition-colors duration-fast hover:text-primary',
                    FOCUS_RING,
                  )}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Rendered outside <header> on purpose. The header is `sticky` with a
          real `z-index`, so it establishes its own stacking context: an
          overlay nested inside it is sealed into that context and cannot paint
          above anything later in the document, however high its own z-index
          goes. (Until this bar's blur was removed it was also a containing
          block for fixed descendants, which clipped the full-screen panel to
          the height of the header — one hazard fewer, same conclusion.) */}
      {open && (
        <MobileNavOverlay
          lang={lang}
          panelRef={panelRef}
          primary={primary}
          secondary={secondary}
          activeKey={activeKey}
          onClose={() => {
            setOpen(false);
            toggleRef.current?.focus();
          }}
          onNavigate={pin}
        />
      )}
    </>
  );
}
