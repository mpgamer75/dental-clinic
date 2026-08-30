'use client';

import Image from 'next/image';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, ExternalLink, X, ZoomIn } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { diplomasUi } from '@/lib/data';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { cn } from '@/lib/utils';
import type { Diploma } from '@/lib/types';

/* ───────────────────────────────────────────────────────────────────────────
   Why a fixed-height mat and `object-contain`

   The nine files are not scans. Every one is a handheld phone photograph of a
   physical document — keystone distortion, wall and desk visible at the edges,
   glass glare on the 1998 diploma, and an aspect-ratio spread from 0.62 to
   1.49 that is a product of where the photographer stood, not of the paper.

   That rules out the two layouts a gallery normally reaches for. Masonry (or a
   justified-row algorithm) would let the camera framing dictate the page's
   rhythm, so the tallest accident of framing would get the most visual weight.
   `object-cover` in a shared box — what this section did before — crops every
   landscape certificate to a sliver of its middle, which is precisely why
   nothing was readable.

   A uniform mat plus `object-contain` is the only option that neither crops
   nor leaves ragged holes: the mat is the constant, the document floats inside
   it at whatever shape it really is. 4:3 is the compromise that costs the
   least — five of the nine are landscape, and a square mat would waste a third
   of the width of the widest one.
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * Warm, theme-aware depth.
 *
 * These use `--shadow-color` (an HSL triple that flips with the theme) rather
 * than `--ink`. `--ink` is near-black in light mode but near-WHITE in dark
 * mode, so an ink-based shadow turns into a glowing halo the moment the theme
 * changes. `--shadow-color` stays dark in both.
 */
const MAT_INSET: CSSProperties = {
  boxShadow:
    'inset 0 1px 3px hsl(var(--shadow-color) / 0.20), inset 0 0 0 1px hsl(var(--shadow-color) / 0.07)',
};

/**
 * Drop-shadow, not box-shadow: `filter: drop-shadow()` follows the painted
 * pixels, so a contained image gets a shadow on its real edges instead of on
 * the letterboxed container it happens to sit in. That is what makes the
 * certificate read as a sheet resting on a mount rather than a floating JPEG.
 */
const PAPER_LIFT: CSSProperties = {
  filter:
    'drop-shadow(0 1px 1px hsl(var(--shadow-color) / 0.24)) drop-shadow(0 7px 14px hsl(var(--shadow-color) / 0.17))',
};

/** `{{token}}` substitution, matching the `{{clinicName}}` convention. */
function fillTokens(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    key in vars ? String(vars[key]) : '',
  );
}

const NAV_BUTTON =
  'flex h-11 w-11 items-center justify-center rounded-full border border-drench-on/45 text-drench-on transition-colors duration-fast ease-out-quart hover:bg-drench-on/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-drench-deep';

interface CertificateGalleryProps {
  /** Already sorted by the caller — this component never reorders. */
  items: Diploma[];
  className?: string;
}

export function CertificateGallery({ items, className }: CertificateGalleryProps) {
  const { lang } = useLanguage();
  const t = diplomasUi[lang];
  const [active, setActive] = useState<number | null>(null);

  /**
   * Focus restoration, by hand — and it is not optional.
   *
   * Radix's modal content ends with
   * `onCloseAutoFocus: preventDefault(); triggerRef.current?.focus()`. That
   * ref is only populated by `<Dialog.Trigger>`, and there is no Trigger here:
   * one Root serves all nine cards so that prev/next can walk between them.
   * Left alone, closing therefore dropped focus onto <body> — verified — and a
   * keyboard visitor lost their place in a nine-card grid every time.
   *
   * Restoring to `lastOpened` rather than to whichever card was clicked also
   * means that arrowing from the 2021 diploma to the 1998 one and closing
   * returns focus to the card actually being read.
   */
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef(0);

  const openAt = useCallback((index: number) => {
    lastOpened.current = index;
    setActive(index);
  }, []);

  return (
    <>
      <RevealGroup
        className={cn(
          /* 3-up from `lg` so nine credentials land as exactly three full rows.
             Below that the column count drops rather than the mat shrinking to
             a thumbnail nobody can read. */
          'grid gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-9 lg:gap-y-14',
          className,
        )}
      >
        {items.map((d, i) => (
          <RevealItem key={d.id}>
            <article className="flex h-full flex-col">
              <button
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                type="button"
                onClick={() => openAt(i)}
                /* The adjacent caption already names this document, so an
                   explicit label is what carries it to assistive tech — and
                   `aria-label` overrides any content inside the button, which
                   is half the reason the image below is alt="". */
                aria-label={fillTokens(t.openLabel, {
                  title: d.title,
                  institution: d.institution,
                  year: d.year,
                })}
                /* An explicit property list, not a bare `transition`.
                   Tailwind's unqualified `transition` covers colour, opacity,
                   transform, `box-shadow`, `filter` AND `backdrop-filter` — so
                   this card was declaring a transition on two of the most
                   expensive properties in CSS, on nine cards at once, on the
                   off-chance one of them changed. Only the lift and the border
                   move, so only they are named. */
                className="group relative block w-full rounded-xl border border-line bg-surface shadow-e1 transition-[transform,border-color] duration-base ease-out-quart hover:-translate-y-1 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
              >
                {/* The raised elevation, as a cross-faded layer.
                    The card lifts from `e1` to `e3` on hover, and a card that
                    rises without its shadow deepening reads as broken. But a
                    box-shadow transition re-renders a large blurred spread on
                    every frame, which is exactly what must not happen nine
                    times over. Two static shadows and an opacity cross-fade
                    give the identical result on the compositor. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-0 shadow-e3 transition-opacity duration-base ease-out-quart group-hover:opacity-100 group-focus-visible:opacity-100"
                />

                {/* The card's padding lives here rather than on the button, so
                    that the elevation layer above can use `inset-0` and land on
                    the card's real edge instead of inside its padding. */}
                <span className="relative block p-2.5 sm:p-3">
                  {/* The mount: recessed, one step darker than the frame around
                      it, so a white certificate has something to sit against. */}
                  <span className="relative block aspect-[4/3] w-full rounded-md bg-canvas-sunk p-3 sm:p-4">
                    <span className="relative block h-full w-full" style={PAPER_LIFT}>
                      <Image
                        src={d.image}
                        /* Decorative, deliberately.
                           The document's title, institution and year sit directly
                           beneath it in real text, and the button that wraps this
                           image carries an explicit accessible name naming the
                           same three things. A descriptive alt here would be
                           announced nowhere (aria-label wins) or announced twice.
                           The text is the accessible content; this is its
                           illustration. */
                        alt=""
                        fill
                        /* The shell caps at --shell-max (94rem = 1598px at this
                           project's 17px root), so a 3-up column is
                           (1598 - 2*gap)/3 ≈ 507px, and the image box ≈ 447px
                           after the card's padding. An earlier 400px here was
                           derived from a `wide` track that does not exist and
                           under-requested by ~12% on wide displays. */
                        sizes="(min-width: 1712px) 460px, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 88vw"
                        /* 88, not 60. These are text-bearing documents; JPEG
                           ringing round 8pt serif type is far more destructive
                           than it is on a photograph of a room. */
                        quality={88}
                        loading="lazy"
                        className="object-contain"
                      />
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-md"
                      style={MAT_INSET}
                    />
                  </span>

                  {/* Hover affordance. Kept permanently visible where there is
                      no hover to detect, so the tap target announces itself on
                      a phone too. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-small font-medium text-canvas opacity-0 shadow-e2 transition-opacity duration-base ease-out-quart group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <ZoomIn className="h-4 w-4" />
                    {t.openHint}
                  </span>
                </span>
              </button>

              <div className="mt-5 flex-1">
                <p className="tabular text-small font-semibold text-brass-ink">{d.year}</p>
                <h3 className="mt-1.5 font-heading text-h4 text-ink">{d.title}</h3>
                <p className="mt-2 text-small leading-normal text-ink-soft">{d.institution}</p>
                {/* The description is also the dialog's accessible description,
                    but the dialog is not mounted until it is opened — so
                    rendering it only there removed nine bilingual strings from
                    the server HTML entirely. On a credentials section that is a
                    content and SEO loss, not a tidy-up.

                    ink-soft, not ink-faint: ink-faint measures 3.57:1 on the
                    card surface at this size, under the 4.5 body minimum. */}
                {d.description && (
                  <p className="mt-2.5 max-w-measure text-small leading-relaxed text-ink-soft">
                    {d.description}
                  </p>
                )}
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>

      <CertificateLightbox
        items={items}
        index={active}
        onIndexChange={openAt}
        onClose={() => setActive(null)}
        restoreFocus={() => cardRefs.current[lastOpened.current]?.focus()}
      />
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Lightbox

   Built on the Radix Dialog the project already ships. That is not a shortcut:
   focus trapping, focus restoration to the trigger, Escape, `aria-modal`,
   inert-ing the rest of the page and scroll locking are all things a hand-
   rolled overlay gets wrong, and they arrive here for no additional bytes.

   It uses the primitive rather than `@/components/ui/dialog`'s `DialogContent`
   because that wrapper is a centred `max-w-lg` card with a 16px close icon —
   the wrong shape and an under-44px target for a full-bleed document reader.

   The overlay is fully OPAQUE. A translucent scrim over the bright plaster
   canvas lifted the composite background enough to drop brass-on-scrim to
   4.34:1; opaque, it measures 4.85:1 in light mode and 8.07:1 in dark.

   No click-to-dismiss on the backdrop: with `object-contain` the letterboxed
   dead space belongs to the <img> box, so "click beside the document" and
   "click the document" are indistinguishable, and someone leaning in to read
   the fine print would close the thing they were reading. Escape and a 44px
   close control cover it unambiguously.
   ─────────────────────────────────────────────────────────────────────────── */

interface CertificateLightboxProps {
  items: Diploma[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Where focus goes on close. See the note in CertificateGallery. */
  restoreFocus: () => void;
}

function CertificateLightbox({
  items,
  index,
  onIndexChange,
  onClose,
  restoreFocus,
}: CertificateLightboxProps) {
  const { lang } = useLanguage();
  const t = diplomasUi[lang];

  const total = items.length;
  const item = index === null ? null : (items[index] ?? null);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (index === null || total === 0) return;
      onIndexChange((index + direction + total) % total);
    },
    [index, total, onIndexChange],
  );

  const counter =
    index === null ? '' : fillTokens(t.counter, { index: index + 1, total });

  return (
    <DialogPrimitive.Root
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-drench-deep data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
          /* Arrow keys bubble here from whatever inside currently holds focus,
             so one handler covers the whole dialog. */
          onKeyDown={(event) => {
            if (total < 2) return;
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              step(1);
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              step(-1);
            }
          }}
          className="fixed inset-0 z-modal flex flex-col text-drench-on focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          {item && (
            <>
              <div className="flex shrink-0 items-center justify-between gap-4 px-4 pt-3 sm:px-6 sm:pt-4">
                <p className="tabular text-small text-drench-on/75">{counter}</p>
                <DialogPrimitive.Close
                  className={cn(NAV_BUTTON, 'border-transparent hover:bg-drench-on/15')}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">{t.close}</span>
                </DialogPrimitive.Close>
              </div>

              <div className="relative min-h-0 flex-1 px-4 py-4 sm:px-8">
                <div className="relative h-full w-full">
                  <Image
                    /* Remount per certificate so the browser never paints the
                       previous document scaled into the new one's box. */
                    key={item.id}
                    src={item.image}
                    /* Same reasoning as the card: the dialog's own title,
                       institution and year are right below, and they are what
                       a screen reader is meant to receive. */
                    alt=""
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1280px) 88vw, 1200px"
                    /* Highest quality on the page — this is the view whose
                       entire job is legible fine print. */
                    quality={92}
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-drench-on/20 px-4 pb-5 pt-4 sm:px-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
                  <div className="min-w-0 max-w-measure">
                    <p className="tabular text-small font-medium text-brass">
                      {item.year} · {item.institution}
                    </p>
                    <DialogPrimitive.Title className="mt-1 font-heading text-h4 text-drench-on">
                      {item.title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="mt-2 text-small leading-normal text-drench-on/75">
                      {item.description}
                    </DialogPrimitive.Description>
                    {/* The escape hatch for anyone who still cannot read a
                        line of it: the untouched original, where the browser's
                        own pinch-zoom takes over. */}
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-h-[44px] items-center gap-2 text-small font-medium text-brass underline underline-offset-4 transition-colors duration-fast hover:text-drench-on focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-drench-deep"
                    >
                      {t.fullSize}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>

                  {total > 1 && (
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => step(-1)}
                          aria-label={t.prev}
                          className={NAV_BUTTON}
                        >
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => step(1)}
                          aria-label={t.next}
                          className={NAV_BUTTON}
                        >
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="hidden text-small text-drench-on/75 sm:block">
                        {t.keyboardHint}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stepping through certificates changes content the dialog has
                  already announced, so say so. */}
              <p role="status" aria-live="polite" className="sr-only">
                {counter} — {item.title}
              </p>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
