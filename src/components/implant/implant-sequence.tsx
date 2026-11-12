'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ============================================================================
   Scroll-scrubbed implant sequence — the homepage hero.

   A rendered film of the implant going in (titanium fixture, then abutment,
   then crown), cut into still frames and drawn onto a 2D canvas as the visitor
   scrolls through a pinned band. Frames, not a <video> with currentTime:
   seeking a video on scroll stalls on every keyframe gap and stutters on iOS,
   while drawImage of an already decoded frame is one GPU blit.

   Three tiers, decided on the client:
   - desktop: 96 frames at 1600 px wide.
   - mobile:  48 frames, a 900 px square crop of the same film. Half the frames
     and about a sixth of the bytes, with the device pixel ratio capped at 2.
   - static:  reduced motion, Save-Data, a slow connection or under 2 GB of
     device memory. No pin, no frames: the finished implant as one picture.

   The server always renders the first frame as a real <Image>, so the hero is
   complete before any script runs and the LCP element is a plain image.
   Reduced motion is handled in CSS too (`motion-reduce:`), so those visitors
   never see the pinned height or the first frame flash before hydration.
   ========================================================================== */

type Tier = 'pending' | 'desktop' | 'mobile' | 'static';

/* `virtualWidth` is the width each frame would have if it were uncropped, in
   its own pixels. The phone frames are a centre crop (1440 of the film's 2560
   columns), so they are laid out as if they were the full frame. That makes
   both sets, and the server poster, land on exactly the same position and
   scale, and the hand-over from poster to canvas does not jump. */
const SETS = {
  desktop: { dir: '/implant/d', count: 96, virtualWidth: 1600 },
  mobile: { dir: '/implant/m', count: 48, virtualWidth: 1600 },
} as const;

const framePath = (dir: string, i: number) => `${dir}/${String(i + 1).padStart(3, '0')}.webp`;

/**
 * Where each phase ends, as a fraction of the pin. Read off the film itself:
 * the fixture is seated by about 48%, the abutment by 60%, the crown by 80%;
 * the last stretch holds the finished implant while the osseointegration note
 * reads. Change these only against the frames, not by feel.
 */
const PHASE_ENDS = [0.48, 0.6, 0.8, 1];

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

function pickTier(): Exclude<Tier, 'pending'> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static';
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return 'static';
  if (conn?.effectiveType && /(^|-)(2g|slow-2g)$/.test(conn.effectiveType)) return 'static';
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem < 2) return 'static';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return coarse || window.innerWidth < 1024 ? 'mobile' : 'desktop';
}

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** Loads coarse-to-fine: every 8th frame first, so a fast scroll on a slow
 *  connection still shows the assembly moving rather than a frozen first
 *  frame, then 4th, 2nd, and the rest. */
function loadOrder(count: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const stride of [8, 4, 2, 1]) {
    for (let i = 0; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(count - 1)) order.push(count - 1);
  return order;
}

/** object-fit: cover, done by hand, so the canvas frames line up exactly with
 *  the server-rendered poster underneath them. Scale is computed on the
 *  frame's uncropped width; a cropped frame is then drawn centred at that
 *  scale, and the band colour fills whatever lies beyond its edges. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  virtualWidth: number,
  ground: string,
) {
  const full = Math.max(virtualWidth, img.naturalWidth);
  const scale = Math.max(w / full, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

interface ImplantSequenceProps {
  /** Server-rendered hero copy: headline, standfirst, actions. */
  children: ReactNode;
  alt: string;
  scrollHint: string;
  phases: { label: string; note: string }[];
}

export function ImplantSequence({ children, alt, scrollHint, phases }: ImplantSequenceProps) {
  const driverRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  /* The tier is read from the device, not held as state: the server snapshot
     is 'pending' (it cannot know the device), and the client reads it on
     hydration. Re-read when reduced motion is toggled mid-visit. */
  const tier = useSyncExternalStore<Tier>(subscribeMotion, pickTier, () => 'pending');
  const [phase, setPhase] = useState(0);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (tier !== 'desktop' && tier !== 'mobile') return;
    const driver = driverRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!driver || !canvas || !ctx) return;

    const set = SETS[tier];
    /* Read from the canvas's own token class rather than written here, so the
       fill follows --drench-deep if the band colour is ever retuned. */
    const ground = getComputedStyle(canvas).backgroundColor;
    const frames: (HTMLImageElement | null)[] = new Array(set.count).fill(null);
    let wanted = 0;
    let shown = -1;
    let raf = 0;
    let visible = true;
    let cancelled = false;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      /* The backing store never exceeds what the frames hold: a 1600 px frame
         stretched onto a 3200 px canvas costs four times the fill rate and
         adds no detail. */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(Math.min(box.width * dpr, 2000));
      canvas.height = Math.round(canvas.width * (box.height / Math.max(box.width, 1)));
      shown = -1;
      paint();
    };

    /** Nearest frame that has actually arrived, searching outward. */
    const nearest = (i: number) => {
      for (let d = 0; d < set.count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const paint = () => {
      const i = nearest(wanted);
      if (i < 0 || i === shown) return;
      drawCover(ctx, frames[i]!, canvas.width, canvas.height, set.virtualWidth, ground);
      shown = i;
      setDrawn(true);
    };

    /* Progress is measured against the pin, not the viewport: the pin sticks
       below the site header, so it starts pinned at scroll 0 and its travel
       is the driver's height minus its own. */
    const progressNow = () => {
      const pin = pinRef.current;
      if (!pin) return 0;
      const rect = driver.getBoundingClientRect();
      const stickTop = parseFloat(getComputedStyle(pin).top) || 0;
      const travel = rect.height - pin.offsetHeight;
      return travel > 0 ? Math.min(1, Math.max(0, (stickTop - rect.top) / travel)) : 0;
    };

    const update = () => {
      raf = 0;
      const p = progressNow();
      wanted = Math.round(p * (set.count - 1));
      paint();
      const idx = PHASE_ENDS.findIndex((end) => p <= end);
      setPhase(idx < 0 ? PHASE_ENDS.length - 1 : idx);
      if (hintRef.current) hintRef.current.style.opacity = p > 0.03 ? '0' : '1';
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };

    const onScroll = () => {
      if (visible && !raf) raf = requestAnimationFrame(update);
    };

    /* Stop doing anything at all once the band has scrolled away. */
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(driver);

    /* Start fetching once the page has loaded, so ~3 MB of frames never
       competes with the poster for the LCP. */
    const start = () => {
      for (const i of loadOrder(set.count)) {
        const img = new window.Image();
        img.decoding = 'async';
        img.src = framePath(set.dir, i);
        img
          .decode()
          .then(() => {
            if (cancelled) return;
            frames[i] = img;
            if (Math.abs(i - wanted) <= 8) paint();
          })
          .catch(() => {
            /* A missing frame is skipped; `nearest` covers the gap. */
          });
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      cancelled = true;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('load', start);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tier]);

  const isStatic = tier === 'static';
  const active = phases[phase] ?? phases[0];

  return (
    <div
      ref={driverRef}
      /* Pin length: about two screens of travel on desktop, a little less on a
         phone, where a thumb flick covers more distance per gesture. */
      className={cn(
        'relative h-[230svh] lg:h-[300svh] motion-reduce:h-auto',
        isStatic && 'h-auto lg:h-auto',
      )}
    >
      {/* Sticks directly under the 4.5rem site header, which is itself sticky
          and takes space in the flow. Pinning at top 0 left the band 72px low
          at scroll 0, so its foot (and the phase caption) started off screen. */}
      <div
        ref={pinRef}
        className={cn(
          'sticky top-[4.5rem] flex h-[calc(100svh-4.5rem)] min-h-[560px] flex-col overflow-hidden',
        )}
      >
        {/* ── Stage ────────────────────────────────────────────────── */}
        <div
          role="img"
          aria-label={alt}
          /* On a phone the stage takes the lower part of the screen under the
             copy; on desktop it fills the right of the band. The mask feathers
             the edge that meets the copy, so a frame whose graphite drifts a
             shade from the band's never shows a seam. A static mask costs
             nothing per frame. */
          className={cn(
            /* On a phone the stage stops above the phase caption (7.5rem), so
               the caption never sits on the bone where it cannot be read. */
            'pointer-events-none absolute inset-x-0 bottom-[7.5rem] top-[44%] sm:top-[40%]',
            'lg:inset-y-0 lg:bottom-0 lg:left-[30%] lg:right-0 lg:top-0',
            '[mask-image:linear-gradient(to_bottom,transparent,black_12%,black_90%,transparent)]',
            'lg:[mask-image:linear-gradient(to_right,transparent,black_22%)]',
          )}
        >
          <Image
            src={isStatic ? '/implant/poster-end.webp' : '/implant/poster-start.webp'}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 70vw, 100vw"
            className={cn('object-cover', drawn && 'invisible')}
          />
          {/* Reduced-motion visitors get the finished implant even before
              hydration, so the first frame never flashes for them. */}
          <Image
            src="/implant/poster-end.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="hidden object-cover motion-reduce:block"
          />
          {!isStatic && (
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={cn('absolute inset-0 h-full w-full bg-drench-deep', !drawn && 'invisible')}
            />
          )}
        </div>

        {/* ── Copy and the phase legend ────────────────────────────── */}
        <div className="shell relative z-raised h-full content-between pb-6 pt-6 lg:pb-12 lg:pt-14">
          <div className="lg:col-span-5">{children}</div>

          <div
            className={cn(
              'flex flex-col gap-4 lg:col-span-6 lg:col-start-1 motion-reduce:hidden',
              isStatic && 'hidden',
            )}
          >
            {/* Phone: one line at a time, over the stage's foot. */}
            <p className="lg:hidden" aria-live="polite">
              <span className="block font-mono text-eyebrow uppercase tracking-[0.14em] text-brass-lift">
                {String(phase + 1).padStart(2, '0')} / {String(phases.length).padStart(2, '0')}
              </span>
              <span className="mt-1 block font-heading text-h4 font-semibold">{active.label}</span>
              <span className="mt-1 block max-w-[36ch] text-small text-drench-on/75">{active.note}</span>
            </p>

            {/* Desktop: all four, the current one lit. The order is real (the
                parts go in in this order), so the numbering is information. */}
            {/* Progress through the film, in the one blue on this band. A
                transform on a 1px line: nothing is repainted as it fills. */}
            <span aria-hidden="true" className="relative block h-px w-full bg-drench-on/15">
              <span
                ref={barRef}
                className="absolute inset-0 origin-left scale-x-0 bg-brass-lift"
              />
            </span>
            <ol className="-mt-4 hidden lg:grid lg:grid-cols-4">
              {phases.map((p, i) => (
                <li
                  key={p.label}
                  aria-current={i === phase ? 'step' : undefined}
                  className={cn(
                    'border-r border-drench-on/15 py-4 pr-4 transition-opacity duration-300 last:border-r-0 [&:not(:first-child)]:pl-4',
                    i === phase ? 'opacity-100' : 'opacity-45',
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-eyebrow tabular',
                      i === phase ? 'text-brass-lift' : 'text-drench-on/60',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-1 block font-heading text-small font-semibold leading-snug">
                    {p.label}
                  </span>
                  <span className="mt-1 block text-small leading-snug text-drench-on/70">
                    {p.note}
                  </span>
                </li>
              ))}
            </ol>

            <div
              ref={hintRef}
              aria-hidden="true"
              className="flex items-center gap-3 font-mono text-eyebrow uppercase tracking-[0.14em] text-drench-on/55 transition-opacity duration-300"
            >
              <span className="h-px w-8 bg-brass-lift/70" />
              {scrollHint}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
