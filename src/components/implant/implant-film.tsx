'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play } from 'lucide-react';

import { cn } from '@/lib/utils';

/* ============================================================================
   The implant film — the homepage hero's picture, playing by itself.

   A rendered film of an implant going in (titanium fixture, then abutment,
   then crown), cut into still frames and drawn onto a 2D canvas. It used to be
   scrubbed by scroll through a pinned band three screens tall, which had two
   costs: a visitor had to scroll 300svh before reaching anything else on the
   page, and one who did not realise the picture answered to scroll saw a still
   image. It now simply plays, holds on the finished implant, and plays again.

   Why frames on a canvas and not WebGL: the real-time scene in this folder
   links five physical-material shader programs and builds its geometry on the
   main thread, which is a second of setup on a mid-range phone for a picture
   less convincing than the rendered film. Drawing a decoded frame is one GPU
   blit, on any device.

   Why it still looks smooth at 96 frames: neighbouring frames are CROSS-FADED.
   The film holds 18 frames a second and a phone gets half of that; stepping
   through them read as stutter. Blending frame n into n+1 by the fractional
   position turns the same files into continuous motion for one extra
   drawImage per tick.

   Three tiers, decided on the client:
   - desktop: 96 frames at 1600 px wide.
   - mobile:  48 frames, a 900 px centre crop of the same film — about a sixth
     of the bytes.
   - static:  reduced motion, Save-Data, a 2G connection or under 2 GB of
     memory. No frames at all: the finished implant as one picture.

   The server always renders a real <Image>, so the hero is complete before any
   script runs. Frames are fetched only after the page has loaded, so ~3 MB of
   film never competes with that image for the LCP.

   The loop does no work it cannot be seen doing: it stops when the stage is
   off screen, when the tab is hidden, and when the visitor presses pause
   (WCAG 2.2.2 — anything that moves for more than five seconds needs a way to
   stop it). During the hold on the finished implant nothing is scheduled at
   all.
   ========================================================================== */

type Tier = 'pending' | 'desktop' | 'mobile' | 'static';

const SETS = {
  desktop: { dir: '/implant/d', count: 96 },
  mobile: { dir: '/implant/m', count: 48 },
} as const;

/** The film's frame is 1112 px tall at both sizes and the implant sits in its
 *  centre 900 px. Scaling against THAT width, not the file's, makes the wide
 *  desktop frame, the cropped phone frame and the server poster all land on
 *  the same position and scale, so the hand-over between them does not jump. */
const CONTENT_ASPECT = 900 / 1112;

const framePath = (dir: string, i: number) => `${dir}/${String(i + 1).padStart(3, '0')}.webp`;

/**
 * Where each phase ends, as a fraction of the film. Read off the frames: the
 * fixture is seated by about 48%, the abutment by 60%, the crown by 80%; the
 * rest holds the finished implant. Retune against the frames, not by feel.
 */
const PHASE_ENDS = [0.48, 0.6, 0.8, 1];

/** One pass of the film. The source runs 5.2 s; stretched a little, because a
 *  visitor is reading a headline at the same time. */
const PLAY_MS = 7200;
/** How long the finished implant is left alone before the next pass. */
const HOLD_MS = 5200;
/** The finished implant dissolving back to the empty socket. */
const REWIND_MS = 900;

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

/** Coarse-to-fine: every 8th frame first, so the film can start moving on a
 *  slow connection after a dozen files, then every 4th, 2nd, and the rest. */
function loadOrder(count: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  const push = (i: number) => {
    if (!seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  push(count - 1);
  for (const stride of [8, 4, 2, 1]) {
    for (let i = 0; i < count; i += stride) push(i);
  }
  return order;
}

interface ImplantFilmProps {
  alt: string;
  pauseLabel: string;
  playLabel: string;
  phases: { label: string; note: string }[];
}

export function ImplantFilm({ alt, pauseLabel, playLabel, phases }: ImplantFilmProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  /* Read from the device rather than held as state: the server snapshot is
     'pending' (it cannot know the device) and the client reads it on
     hydration, re-reading if reduced motion is toggled mid-visit. */
  const tier = useSyncExternalStore<Tier>(subscribeMotion, pickTier, () => 'pending');
  const [phase, setPhase] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [paused, setPaused] = useState(false);
  /** The loop reads this; the state above only labels the button. */
  const pausedRef = useRef(false);
  /** Lets the button wake a loop that lives inside the effect. */
  const resumeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (tier !== 'desktop' && tier !== 'mobile') return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!stage || !canvas || !ctx) return;

    const set = SETS[tier];
    const last = set.count - 1;
    /* Read from the canvas's own token class rather than written here, so the
       fill follows --stage-ground if the film's ground is ever re-cut. */
    const ground = getComputedStyle(canvas).backgroundColor;
    const frames: (HTMLImageElement | null)[] = new Array(set.count).fill(null);

    let cancelled = false;
    let visible = false;
    let raf = 0;
    let timer = 0;
    /** 'play' runs the film, 'hold' rests on the end, 'rewind' dissolves back. */
    let mode: 'play' | 'hold' | 'rewind' = 'play';
    /** Milliseconds into the current mode. Kept across pauses. */
    let elapsed = 0;
    let lastTick = 0;
    let shownPhase = -1;
    let ready = false;

    const below = (i: number) => {
      for (let k = Math.min(last, Math.floor(i)); k >= 0; k--) if (frames[k]) return k;
      return -1;
    };
    const above = (i: number) => {
      for (let k = Math.max(0, Math.ceil(i)); k <= last; k++) if (frames[k]) return k;
      return -1;
    };

    const blit = (img: HTMLImageElement, alpha: number) => {
      const { width: w, height: h } = canvas;
      const scale = Math.max(h / img.naturalHeight, w / (img.naturalHeight * CONTENT_ASPECT));
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };

    /** Draws the film at a fractional frame position, blending the two loaded
     *  frames either side of it. */
    const paintAt = (position: number) => {
      const lo = below(position);
      const hi = above(position);
      const a = lo >= 0 ? lo : hi;
      if (a < 0) return false;
      ctx.globalAlpha = 1;
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blit(frames[a]!, 1);
      if (lo >= 0 && hi > lo) {
        const mix = (position - lo) / (hi - lo);
        if (mix > 0.01) blit(frames[hi]!, mix);
      }
      return true;
    };

    const showPhase = (p: number) => {
      const idx = PHASE_ENDS.findIndex((end) => p <= end);
      const next = idx < 0 ? PHASE_ENDS.length - 1 : idx;
      if (next !== shownPhase) {
        shownPhase = next;
        setPhase(next);
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };

    const canRun = () => ready && visible && !document.hidden && !pausedRef.current && !cancelled;

    const stop = () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      raf = 0;
      timer = 0;
    };

    const tick = (now: number) => {
      raf = 0;
      if (!canRun()) return;
      /* Real time, so a device that only manages ten frames a second still
         plays the film at its proper length rather than in slow motion — but
         capped, so one long stall is not a jump through half of it. */
      elapsed += Math.min(Math.max(now - lastTick, 0), 250);
      lastTick = now;

      if (mode === 'play') {
        const p = Math.min(1, elapsed / PLAY_MS);
        paintAt(p * last);
        showPhase(p);
        if (p >= 1) {
          mode = 'hold';
          elapsed = 0;
          /* The hold is a timer, not sixty idle frames a second. */
          timer = window.setTimeout(() => {
            timer = 0;
            mode = 'rewind';
            elapsed = 0;
            run();
          }, HOLD_MS);
          return;
        }
      } else if (mode === 'rewind') {
        const k = Math.min(1, elapsed / REWIND_MS);
        const first = frames[above(0)];
        const end = frames[below(last)];
        if (first && end) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = ground;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          blit(first, 1);
          if (k < 1) blit(end, 1 - k);
        }
        if (barRef.current) barRef.current.style.transform = `scaleX(${1 - k})`;
        if (k >= 1) {
          mode = 'play';
          elapsed = 0;
          showPhase(0);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const run = () => {
      if (raf || timer || !canRun()) return;
      if (mode === 'hold') {
        mode = 'rewind';
        elapsed = 0;
      }
      lastTick = performance.now();
      raf = requestAnimationFrame(tick);
    };
    resumeRef.current = run;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      /* The backing store never exceeds what the frames hold: a 1112 px tall
         frame stretched onto a taller canvas costs fill rate and adds no
         detail. */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const height = Math.min(box.height * dpr, 1112);
      canvas.height = Math.round(height);
      canvas.width = Math.round(height * (box.width / box.height));
      if (!ready) return;
      const position = mode === 'play' ? Math.min(1, elapsed / PLAY_MS) * last : mode === 'hold' ? last : 0;
      paintAt(position);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
      else stop();
    });
    io.observe(stage);

    const onVisibility = () => {
      if (document.hidden) stop();
      else run();
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* The film starts once the first coarse pass is in — every 8th frame —
       and sharpens as the rest arrive. Waiting for all of them would hold the
       still poster for seconds on a slow connection. */
    const order = loadOrder(set.count);
    const firstPass = new Set(order.slice(0, Math.ceil(set.count / 8) + 2));
    let firstPassLeft = firstPass.size;

    const start = () => {
      for (const i of order) {
        const img = new window.Image();
        img.decoding = 'async';
        img.src = framePath(set.dir, i);
        img
          .decode()
          .then(() => {
            if (cancelled) return;
            frames[i] = img;
          })
          .catch(() => {
            /* A missing frame is skipped; its neighbours cover the gap. */
          })
          .finally(() => {
            if (cancelled || ready || !firstPass.has(i)) return;
            firstPassLeft -= 1;
            if (firstPassLeft > 0) return;
            ready = true;
            if (paintAt(0)) setDrawn(true);
            run();
          });
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelled = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('load', start);
      resumeRef.current = () => {};
    };
  }, [tier]);

  /* Pointer tilt: the case leans a few degrees towards the cursor, which is
     what makes a flat film read as an object in a room. Fine pointers only —
     a touch has no hover and a tilt that follows a scroll gesture is noise.
     One write per frame to two custom properties; the transform itself and
     its easing live in CSS, so there is no animation loop here. */
  useEffect(() => {
    if (tier !== 'desktop') return;
    const card = cardRef.current;
    const band = stageRef.current?.closest('section');
    if (!card || !band) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      card.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
    };
    const onMove = (event: PointerEvent) => {
      const rect = band.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    band.addEventListener('pointermove', onMove, { passive: true });
    band.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      band.removeEventListener('pointermove', onMove);
      band.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tier]);

  const togglePaused = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (!next) resumeRef.current();
  };

  const isStatic = tier === 'static';
  const playing = tier === 'desktop' || tier === 'mobile';
  /* With no film, the caption describes the picture that is shown: the
     finished implant. */
  const shown = isStatic ? phases.length - 1 : phase;
  const active = phases[shown] ?? phases[0];

  return (
    <div ref={stageRef} className="hero-stage relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-[27rem]">
      {/* A static pool of light behind the case, so it sits in the band rather
          than on it. A gradient, not a blur filter or a shadow: it is painted
          once and never touched again. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[18%] -z-10"
        style={{
          backgroundImage:
            'radial-gradient(closest-side, oklch(var(--brass-lift) / 0.22), oklch(var(--brass-lift) / 0))',
        }}
      />

      <div ref={cardRef} className="hero-case relative overflow-hidden rounded-[1.75rem] bg-stage">
        <div role="img" aria-label={alt} className="relative aspect-[4/5] w-full">
          <Image
            src={isStatic ? '/implant/poster-end.webp' : '/implant/poster-start.webp'}
            alt=""
            fill
            preload
            fetchPriority="high"
            /* The box shows the centre of a wider frame, so the image is drawn
               larger than the box it is cropped by. */
            sizes="(min-width: 1024px) 880px, 150vw"
            quality={80}
            className={cn('object-cover', drawn && 'invisible')}
          />
          {/* Reduced-motion visitors get the finished implant even before
              hydration, so the empty socket never flashes for them. */}
          <Image
            src="/implant/poster-end.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 880px, 150vw"
            quality={80}
            className="hidden object-cover motion-reduce:block"
          />
          {playing && (
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={cn('absolute inset-0 h-full w-full bg-stage', !drawn && 'invisible')}
            />
          )}
        </div>

        {/* Hairline and inner highlight on top of the picture, so the case has
            an edge on a band nearly as dark as it is. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[1.75rem] border border-drench-on/15"
        />

        {/* The caption, UNDER the picture rather than over it: laid over the
            foot of the frame it covered the bone, which is the part the last
            phase is about. It changes four times a pass and is decoration on
            top of the list below it, so it is not announced — a live region
            here would interrupt a screen reader every two seconds, for ever. */}
        <div className="relative -mt-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div aria-hidden="true">
            <p className="flex items-baseline gap-3">
              <span className="tabular text-small font-semibold text-brass-lift">
                {String(shown + 1).padStart(2, '0')}
                <span className="text-drench-on/45"> / {String(phases.length).padStart(2, '0')}</span>
              </span>
              <span className="font-heading text-h4 font-semibold text-drench-on">{active.label}</span>
            </p>
            <p className="mt-1 min-h-[2.6em] max-w-[38ch] text-small leading-snug text-drench-on/75">
              {active.note}
            </p>
            <span className="relative mt-3 block h-0.5 w-full overflow-hidden rounded-full bg-drench-on/15">
              <span
                ref={barRef}
                className={cn(
                  'absolute inset-0 origin-left rounded-full bg-brass-lift',
                  isStatic ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </span>
          </div>
          <ol className="sr-only">
            {phases.map((p) => (
              <li key={p.label}>
                {p.label}: {p.note}
              </li>
            ))}
          </ol>
        </div>

        {playing && (
          <button
            type="button"
            onClick={togglePaused}
            aria-label={paused ? playLabel : pauseLabel}
            aria-pressed={paused}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-drench-on/20 bg-stage/70 text-drench-on/80 transition-colors duration-fast ease-out-quart hover:border-drench-on/45 hover:text-drench-on focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-lift focus-visible:ring-offset-2 focus-visible:ring-offset-stage"
          >
            {paused ? (
              <Play className="h-4 w-4 translate-x-px" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
