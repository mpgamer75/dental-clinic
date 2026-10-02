'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, ExternalLink, X, ZoomIn } from 'lucide-react';

import type { diplomasUi } from '@/lib/data';
import type { Diploma } from '@/lib/types';
import { cn } from '@/lib/utils';

type RailCopy = (typeof diplomasUi)['es'];

/* ───────────────────────────────────────────────────────────────────────────
   Why a horizontal rail

   The nine documents used to be a 3-up grid of large cards: 2,300px of the
   desktop page and 4,722px — five and a half screens — on a phone, between the
   doctor and the rest of the argument. A credential wall is evidence a visitor
   checks, not a passage they read; a strip they can flick through keeps all
   nine one gesture away while costing one card's height.

   Why a fixed mat and `object-contain`: every file is a handheld photograph of
   paper — keystone distortion, glass glare, aspect ratios from 0.62 to 1.49.
   `object-cover` in a shared box crops each landscape certificate to a sliver
   of its middle; a uniform 4:3 mat with the document floating inside it at its
   real shape neither crops nor leaves ragged holes.
   ─────────────────────────────────────────────────────────────────────────── */

/** Theme-aware depth from `--shadow-color`, which stays dark in both themes
 *  (`--ink` flips to near-white in dark mode and would glow). */
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

interface DiplomaRailProps {
  /** Already sorted by the caller — newest first. */
  items: Diploma[];
  ui: RailCopy;
  title: string;
  description: string;
}

export function DiplomaRail({ items, ui, title, description }: DiplomaRailProps) {
  const [active, setActive] = useState<number | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const scrollerRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef(0);

  const years = items.map((d) => Number.parseInt(d.year, 10)).filter(Number.isFinite);
  const range = years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : null;

  /* Which ends of the strip are in view, from two observers on the first and
     last cards — not a scroll handler, so nothing runs while the strip moves.
     The buttons disable at the ends rather than wrapping: a strip that jumps
     from the 1998 diploma back to 2021 reads as a glitch. */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof IntersectionObserver === 'undefined') return;
    const first = scroller.firstElementChild;
    const last = scroller.lastElementChild;
    if (!first || !last) return;

    const io = new IntersectionObserver(
      (entries) => {
        setEdges((prev) => {
          let next = prev;
          for (const entry of entries) {
            const visible = entry.intersectionRatio > 0.9;
            if (entry.target === first && next.start !== visible) next = { ...next, start: visible };
            if (entry.target === last && next.end !== visible) next = { ...next, end: visible };
          }
          return next;
        });
      },
      { root: scroller, threshold: [0, 0.9, 1] },
    );
    io.observe(first);
    io.observe(last);
    return () => io.disconnect();
  }, [items.length]);

  const page = useCallback((direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.85,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, []);

  const openAt = useCallback((index: number) => {
    lastOpened.current = index;
    setActive(index);
  }, []);

  if (items.length === 0) {
    return <p className="text-ink-soft">{ui.empty}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h3 className="font-heading text-h3 font-medium text-ink">{title}</h3>
          <p className="mt-2 max-w-measure text-small leading-relaxed text-ink-soft">
            {range && (
              <span className="tabular font-medium text-brass-ink">
                {fillTokens(ui.rail, { range })}.{' '}
              </span>
            )}
            {description}
          </p>
        </div>

        {items.length > 1 && (
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <RailButton label={ui.scrollBack} disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </RailButton>
            <RailButton label={ui.scrollForward} disabled={edges.end} onClick={() => page(1)}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </RailButton>
          </div>
        )}
      </div>

      {/* The strip bleeds to the viewport edges (the shell's `--gap`) so the
          next card visibly continues off-screen — the cue that there is more —
          while `scroll-padding` keeps a snapped card aligned to the column.
          No visible scrollbar: on Windows it drew a second set of arrow
          buttons under the strip's own. Every way in is covered without it —
          the buttons on wide screens, swipe on touch, the trackpad, and Tab,
          which scrolls each card into view as it takes focus. */}
      <ul
        ref={scrollerRef}
        aria-label={ui.stripLabel}
        className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-5 pt-1 [margin-inline:calc(-1*var(--gap))] [padding-inline:var(--gap)] [scroll-padding-inline:var(--gap)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((d, i) => (
          <li key={d.id} className="w-[min(76vw,18.5rem)] shrink-0 snap-start">
            <button
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              type="button"
              onClick={() => openAt(i)}
              aria-label={fillTokens(ui.openLabel, { title: d.title, institution: d.institution, year: d.year })}
              className="group block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-canvas-sunk"
            >
              <span className="relative block rounded-xl border border-line bg-surface p-2.5 transition-[transform,border-color] duration-base ease-out-quart group-hover:-translate-y-1 group-hover:border-line-strong">
                <span className="relative block aspect-[4/3] w-full rounded-md bg-canvas-sunk p-3">
                  <span className="relative block h-full w-full" style={PAPER_LIFT}>
                    <Image
                      src={d.image}
                      /* Decorative: the button's accessible name already names
                         the document, and the text under the mat repeats it. */
                      alt=""
                      fill
                      sizes="(min-width: 640px) 280px, 70vw"
                      /* Text-bearing documents: JPEG ringing around 8pt type is
                         far more destructive than on a photograph of a room. */
                      quality={88}
                      loading="lazy"
                      className="object-contain"
                    />
                  </span>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md" style={MAT_INSET} />
                </span>
                {/* Always visible where there is no hover to reveal it. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-small font-medium text-canvas opacity-0 transition-opacity duration-base ease-out-quart group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  {ui.openHint}
                </span>
              </span>

              <span className="mt-3.5 block px-0.5">
                <span className="tabular block text-small font-semibold text-brass-ink">{d.year}</span>
                <span className="mt-1 block font-heading text-[1.06rem] font-medium leading-snug text-ink line-clamp-2">
                  {d.title}
                </span>
                <span className="mt-1 block text-small leading-snug text-ink-soft line-clamp-2">
                  {d.institution}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <CertificateLightbox
        items={items}
        ui={ui}
        index={active}
        onIndexChange={openAt}
        onClose={() => setActive(null)}
        restoreFocus={() => cardRefs.current[lastOpened.current]?.focus()}
      />
    </div>
  );
}

function RailButton({
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors duration-fast ease-out-quart hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-sunk disabled:pointer-events-none disabled:opacity-35"
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
  ui: RailCopy;
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
