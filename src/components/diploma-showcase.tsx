'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, ExternalLink, X, ZoomIn } from 'lucide-react';

import LogoLoop from '@/components/reactbits/logo-loop';
import type { diplomasUi } from '@/lib/data';
import type { Diploma } from '@/lib/types';
import { cn } from '@/lib/utils';

type ShowcaseCopy = (typeof diplomasUi)['es'];

/* ───────────────────────────────────────────────────────────────────────────
   The diploma showcase

   Nine documents, twenty-three years. They have been shown two ways before:
   a 3-up grid of large cards (2,300px of desktop page, five and a half screens
   on a phone) and then a flat strip of thumbnails that solved the length and
   made the documents look like an afterthought — the same weight as a row of
   partner logos.

   This is a deck. One certificate faces the visitor at full size while its
   neighbours turn away into depth on either side, so the row reads as "one
   document at a time, and there are more" instead of "nine small pictures".
   Underneath it a row of years is both the index and the control: it shows
   where in the record the centred document sits, and pressing a year brings
   that document forward.

   How the depth is drawn: each card's rotation is a CSS animation on its own
   inline VIEW TIMELINE (`.coverflow-item`, in globals.css) — its progress is
   the card's position across the strip, scrubbed by the compositor as the
   strip scrolls. No scroll handler, no per-frame script, nothing to hydrate.
   Where view timelines are unsupported, or under reduced motion, the rule
   does not apply and the deck is an ordinary flat, snapping strip.

   Why a fixed mat and `object-contain`: every file is a handheld photograph of
   paper — keystone distortion, glass glare, aspect ratios from 0.62 to 1.49.
   `object-cover` in a shared box crops each landscape certificate to a sliver
   of its middle; a uniform mat with the document floating inside it at its
   real shape neither crops nor leaves ragged holes.

   It sits on a blue band: paper is the lightest thing on the page, and against
   the pale grounds it used to sit on it had no edge.
   ─────────────────────────────────────────────────────────────────────────── */

/** Depth inside the mat, from `--shadow-color`, which stays dark in both
 *  themes (`--ink` flips to near-white in dark mode and would glow). */
const MAT_INSET: CSSProperties = {
  boxShadow:
    'inset 0 1px 3px hsl(var(--shadow-color) / 0.20), inset 0 0 0 1px hsl(var(--shadow-color) / 0.07)',
};

/** `drop-shadow` follows the painted pixels, so a contained document gets a
 *  shadow on its real edges rather than on its letterboxed box. Static — it is
 *  never transitioned, so it costs one paint. */
const PAPER_LIFT: CSSProperties = {
  filter:
    'drop-shadow(0 1px 1px hsl(var(--shadow-color) / 0.24)) drop-shadow(0 6px 12px hsl(var(--shadow-color) / 0.16))',
};

function fillTokens(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    key in vars ? String(vars[key]) : '',
  );
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const FOCUS_ON_BAND =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-lift focus-visible:ring-offset-2 focus-visible:ring-offset-drench';

interface DiplomaShowcaseProps {
  /** Already sorted by the caller — newest first. */
  items: Diploma[];
  ui: ShowcaseCopy;
  title: string;
  description: string;
}

export function DiplomaShowcase({ items, ui, title, description }: DiplomaShowcaseProps) {
  const [opened, setOpened] = useState<number | null>(null);
  /** The card on the strip's centre line. */
  const [centred, setCentred] = useState(0);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef(0);

  const years = items.map((d) => Number.parseInt(d.year, 10)).filter(Number.isFinite);
  const range = years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : null;

  /* Which card is centred, from one observer whose root is the strip narrowed
     to a sliver down its middle: a card "intersects" exactly while it crosses
     the centre line. Not a scroll handler — the callback runs once per card
     change, not once per frame, so setting state from it is safe. */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isFinite(index)) setCentred(index);
        }
      },
      { root: scroller, rootMargin: '0px -49% 0px -49%', threshold: 0 },
    );
    for (const child of Array.from(scroller.children)) io.observe(child);
    return () => io.disconnect();
  }, [items.length]);

  const bringForward = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    const target = scroller?.children[index] as HTMLElement | undefined;
    if (!scroller || !target) return;
    /* Scrolls the STRIP, not the page: `scrollIntoView` would also move the
       document vertically if the deck were partly off screen, yanking the page
       under someone who only pressed a year.

       `offsetLeft` is only a position WITHIN the strip because the strip is
       `relative`, which makes it the cards' offsetParent. Without that the
       offset is measured from an ancestor outside the scroller and shrinks as
       the strip scrolls — the buttons then worked from the first card and
       went nowhere from any other. */
    scroller.scrollTo({
      left: target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  const openAt = useCallback((index: number) => {
    lastOpened.current = index;
    setOpened(index);
  }, []);

  if (items.length === 0) {
    return <p className="text-drench-on/80">{ui.empty}</p>;
  }

  const total = items.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="reveal min-w-0">
          {range && (
            <p className="tabular mb-3 text-small font-medium text-brass-lift">{fillTokens(ui.rail, { range })}</p>
          )}
          <h2 className="font-heading text-h2 font-semibold text-drench-on">{title}</h2>
          <p className="mt-4 max-w-measure leading-relaxed text-drench-on/80">{description}</p>
        </div>

        {total > 1 && (
          <div className="flex shrink-0 items-center gap-4">
            {/* Decorative duplicate of the year row's current state. */}
            <p aria-hidden="true" className="tabular font-heading text-h4 font-semibold text-drench-on">
              {String(centred + 1).padStart(2, '0')}
              <span className="text-drench-on/45"> / {String(total).padStart(2, '0')}</span>
            </p>
            <div className="flex items-center gap-2">
              <DeckButton label={ui.scrollBack} disabled={centred === 0} onClick={() => bringForward(centred - 1)}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </DeckButton>
              <DeckButton
                label={ui.scrollForward}
                disabled={centred === total - 1}
                onClick={() => bringForward(centred + 1)}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </DeckButton>
            </div>
          </div>
        )}
      </div>

      {/* Twenty-three years of training as one moving line, before the
          documents themselves. Text, not logos: drawing an institution's mark
          from memory would be a forgery of it. Hidden from assistive tech —
          the deck below states every one of these facts — and the loop stops
          off screen, on hover and under reduced motion. */}
      {total > 2 && (
        <div aria-hidden="true" className="mt-10 border-y border-drench-on/15 py-3.5">
          <LogoLoop
            logos={[...items].reverse().map((d) => ({
              node: (
                <span className="flex items-baseline gap-3 whitespace-nowrap text-small text-drench-on/75">
                  <span className="tabular font-semibold text-brass-lift">{d.year}</span>
                  <span>{d.institution}</span>
                </span>
              ),
            }))}
            speed={32}
            gap={56}
            logoHeight={24}
            pauseOnHover
            fadeOut
            draggable={false}
            /* No entrance: the upstream intro holds every item at opacity 0
               until the row has been on screen for a second, which reads as
               an empty band to anyone scrolling past at speed. */
            intro={false}
          />
        </div>
      )}

      {/* The deck. It bleeds to the viewport edges, and its inline padding is
          half the strip minus half a card, so the FIRST and LAST cards can
          reach the centre line too. No visible scrollbar: every way in is
          covered without it — the buttons, the year row, swipe, the trackpad,
          and Tab, which brings each card to the centre as it takes focus. */}
      <ul
        ref={scrollerRef}
        aria-label={ui.stripLabel}
        className="coverflow relative mt-10 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain py-6 [margin-inline:calc(-1*var(--gap))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((d, i) => (
          <li key={d.id} data-index={i} className="coverflow-slot shrink-0 snap-center">
            <div className="coverflow-item">
              <button
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                type="button"
                onClick={() => openAt(i)}
                onFocus={() => bringForward(i)}
                aria-label={fillTokens(ui.openLabel, { title: d.title, institution: d.institution, year: d.year })}
                className={cn('group block w-full rounded-2xl text-left', FOCUS_ON_BAND, 'focus-visible:ring-offset-4')}
              >
                {/* The frame and its mat. Both use tokens that are LIGHT in
                    both themes (`brass`, `drench-on`): a mat that followed
                    the theme turned near-black in dark mode, behind paper. */}
                <span className="relative block rounded-2xl bg-brass p-3 shadow-e4 transition-transform duration-slow ease-out-quint group-hover:-translate-y-1.5 sm:p-4">
                  <span className="relative block aspect-[4/3] w-full rounded-lg bg-drench-on p-3 sm:p-4">
                    <span className="relative block h-full w-full" style={PAPER_LIFT}>
                      <Image
                        src={d.image}
                        /* Decorative: the button's accessible name already
                           names the document, and the caption repeats it. */
                        alt=""
                        fill
                        sizes="(min-width: 640px) 440px, 78vw"
                        /* Text-bearing documents: JPEG ringing around 8pt type
                           is far more destructive than on a photo of a room. */
                        quality={88}
                        loading="lazy"
                        className="object-contain"
                      />
                    </span>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg" style={MAT_INSET} />
                  </span>
                  {/* Always visible where there is no hover to reveal it. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-6 right-6 inline-flex items-center gap-1.5 rounded-full bg-drench-deep px-2.5 py-1 text-small font-medium text-drench-on opacity-0 transition-opacity duration-base ease-out-quart group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    {ui.openHint}
                  </span>
                </span>

                <span className="mt-5 block px-1 text-center">
                  <span className="tabular block text-small font-semibold text-brass-lift">{d.year}</span>
                  <span className="mt-1 block font-heading text-h4 font-semibold leading-snug text-drench-on line-clamp-2">
                    {d.title}
                  </span>
                  <span className="mt-1 block text-small leading-snug text-drench-on/75 line-clamp-2">
                    {d.institution}
                  </span>
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* The years: an index of the record and the way around it. Buttons, in
          the same order as the deck, each named by its document. */}
      {total > 1 && (
        <div className="relative mt-4">
          <span aria-hidden="true" className="absolute inset-x-0 top-[1.375rem] h-px bg-drench-on/20" />
          <ol className="relative flex flex-wrap justify-between gap-x-1 gap-y-2">
            {items.map((d, i) => {
              const current = i === centred;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => bringForward(i)}
                    aria-current={current ? 'true' : undefined}
                    aria-label={`${d.year} — ${d.title}`}
                    className={cn(
                      'tabular flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-small font-semibold transition-colors duration-base ease-out-quart',
                      FOCUS_ON_BAND,
                      current
                        ? 'border-brass bg-brass text-brass-on'
                        : 'border-drench-on/25 bg-drench text-drench-on/75 hover:border-drench-on/55 hover:text-drench-on',
                    )}
                  >
                    {d.year}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <CertificateLightbox
        items={items}
        ui={ui}
        index={opened}
        onIndexChange={openAt}
        onClose={() => setOpened(null)}
        restoreFocus={() => cardRefs.current[lastOpened.current]?.focus({ preventScroll: true })}
      />
    </div>
  );
}

function DeckButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full border border-drench-on/35 text-drench-on transition-colors duration-fast ease-out-quart hover:border-drench-on/70 hover:bg-drench-on/10 disabled:pointer-events-none disabled:opacity-35',
        FOCUS_ON_BAND,
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Lightbox

   Built on the Radix Dialog primitive: focus trapping, Escape, aria-modal,
   inerting the page and scroll locking are what a hand-rolled overlay gets
   wrong. The primitive rather than `ui/dialog`, whose centred max-w-lg card and
   16px close icon are the wrong shape for a full-bleed document reader.

   One Root serves all nine cards so prev/next can walk between them — which
   means no <Dialog.Trigger>, so Radix cannot restore focus by itself and
   `restoreFocus` returns it to the card actually being read.

   The overlay is OPAQUE: a translucent scrim over the pale canvas dropped
   brass-on-scrim to 4.34:1. No click-to-dismiss on the backdrop either — with
   `object-contain` the letterboxed space belongs to the image, so someone
   leaning in to read the fine print would close it. Escape and a 44px close
   control cover it.
   ─────────────────────────────────────────────────────────────────────────── */

const NAV_BUTTON =
  'flex h-11 w-11 items-center justify-center rounded-full border border-drench-on/45 text-drench-on transition-colors duration-fast ease-out-quart hover:bg-drench-on/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-drench-deep';

interface CertificateLightboxProps {
  items: Diploma[];
  ui: ShowcaseCopy;
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  restoreFocus: () => void;
}

function CertificateLightbox({ items, ui, index, onIndexChange, onClose, restoreFocus }: CertificateLightboxProps) {
  const total = items.length;
  const item = index === null ? null : (items[index] ?? null);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (index === null || total === 0) return;
      onIndexChange((index + direction + total) % total);
    },
    [index, total, onIndexChange],
  );

  const counter = index === null ? '' : fillTokens(ui.counter, { index: index + 1, total });

  return (
    <DialogPrimitive.Root open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-drench-deep data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
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
                <DialogPrimitive.Close className={cn(NAV_BUTTON, 'border-transparent')}>
                  <X className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">{ui.close}</span>
                </DialogPrimitive.Close>
              </div>

              <div className="relative min-h-0 flex-1 px-4 py-4 sm:px-8">
                <div className="relative h-full w-full">
                  <Image
                    key={item.id}
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1280px) 88vw, 1200px"
                    quality={92}
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-drench-on/20 px-4 pb-5 pt-4 sm:px-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
                  <div className="min-w-0 max-w-measure">
                    <p className="tabular text-small font-medium text-brass-lift">
                      {item.year} · {item.institution}
                    </p>
                    <DialogPrimitive.Title className="mt-1 font-heading text-h4 text-drench-on">
                      {item.title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="mt-2 text-small leading-normal text-drench-on/75">
                      {item.description}
                    </DialogPrimitive.Description>
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-h-[44px] items-center gap-2 text-small font-medium text-brass-lift underline underline-offset-4 transition-colors duration-fast hover:text-drench-on focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-drench-deep"
                    >
                      {ui.fullSize}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>

                  {total > 1 && (
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => step(-1)} aria-label={ui.prev} className={NAV_BUTTON}>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => step(1)} aria-label={ui.next} className={NAV_BUTTON}>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="hidden text-small text-drench-on/75 sm:block">{ui.keyboardHint}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stepping changes content the dialog already announced. */}
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
