'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
   drawImage per paint.

   Why every frame is CUT TO SIZE before it is drawn. The first version kept
   the 96 files as <img> elements and drew them straight to the canvas, scaled
   down, twice a tick, at the display's refresh rate. Decoded, a 1600 x 1112
   frame is 7 MB and the set is 680 MB — far past any browser's decoded-image
   budget, so frames were thrown away and decoded again while the film ran,
   and each draw resampled 1.8 million pixels to fill a box a quarter of that.
   That was the "lag" the clinic reported. Each file is now turned ONCE into
   an ImageBitmap cropped to the part the case shows and resized to the
   canvas's own pixels, off the main thread; the full-size decode is dropped
   as soon as the bitmap exists. A paint is then two unscaled copies of a
   bitmap the size of the canvas, and the whole film is held in a fraction of
   the memory.

   Why 30 paints a second and not the display's rate: the film itself moves
   13 frames a second, so a 120 Hz screen was blending and uploading nine
   near-identical pictures for every real one.

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

/** `width`/`height` are the files' pixel size. Stated rather than read from
 *  a decoded frame, because the crop is asked for BEFORE the decode — that is
 *  what lets the browser never hold a full-size frame. Keep them in step with
 *  the ffmpeg commands in CLAUDE.md. */
const SETS = {
  desktop: { dir: '/implant/d', count: 96, width: 1600, height: 1112 },
  mobile: { dir: '/implant/m', count: 48, width: 900, height: 1112 },
} as const;

/** The film's frame is 1112 px tall at both sizes and the implant sits in its
 *  centre 900 px. Scaling against THAT width, not the file's, makes the wide
 *  desktop frame, the cropped phone frame and the server poster all land on
 *  the same position and scale, so the hand-over between them does not jump. */
const CONTENT_ASPECT = 900 / 1112;

/** The canvas — and so every cut frame — is never taller than this many
 *  device pixels. It is the film's memory bill: at 640 x 800 a frame is 2 MB,
 *  so 96 of them are ~200 MB on a high-density desktop and 48 are ~100 MB on a
 *  phone (a 1x laptop needs 432 x 540, ~90 MB). The source holds 1112 rows,
 *  but the film is a soft-lit render in motion: the last 300 buy very little
 *  on a 2x screen and were half the memory. Raise it only with a memory
 *  profile open. */
const MAX_BACKING_HEIGHT = 800;
/** The same cap on a device that reports 4 GB or less. */
const MAX_BACKING_HEIGHT_LOW_MEMORY = 640;

/** Minimum gap between paints: 30 a second on a 60, 90, 120 or 144 Hz screen
 *  (a little under 33 ms, so a tick arriving a hair early still counts). */
const PAINT_INTERVAL_MS = 30;

/** Files in flight at once. The network is the slow part on a phone. */
const FETCH_LANES = 6;
/** Frames being decoded and resized at once. All 96 used to be decoded in one
 *  burst the moment the page loaded, which saturated the browser's decode
 *  threads — the same pool that rasterises the page — for the first second
 *  or two of the visit. */
const DECODE_LANES = 2;

/** A cut frame. An <img> only where `createImageBitmap` does not exist
 *  (Safari 14 and older), drawn with the crop on every paint as before. */
type Frame = ImageBitmap | HTMLImageElement;

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
  /** Rendered inside the tilting case, in front of the film: the hero's
   *  floating facts. Server-rendered by the caller. */
  children?: ReactNode;
}

export function ImplantFilm({ alt, pauseLabel, playLabel, phases, children }: ImplantFilmProps) {
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
    const frames: (Frame | null)[] = new Array(set.count).fill(null);
    /** The files as fetched (3.6 MB for the whole desktop set), kept so a
     *  resize can cut the frames again without going back to the network. */
    const blobs: (Blob | null)[] = new Array(set.count).fill(null);
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const maxHeight =
      typeof memory === 'number' && memory <= 4 ? MAX_BACKING_HEIGHT_LOW_MEMORY : MAX_BACKING_HEIGHT;

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

    /** The part of a source frame a `w` x `h` canvas shows: the frame scaled
     *  to cover the canvas against its CONTENT width, centred. In whole
     *  pixels, because that is what `createImageBitmap` takes. */
    const cropFor = (w: number, h: number) => {
      const scale = Math.max(h / set.height, w / (set.height * CONTENT_ASPECT));
      const sw = Math.min(set.width, Math.round(w / scale));
      const sh = Math.min(set.height, Math.round(h / scale));
      return { sx: Math.round((set.width - sw) / 2), sy: Math.round((set.height - sh) / 2), sw, sh };
    };

    /** A cut frame is the canvas's size, so this is a straight copy. It is
     *  still given the canvas's size as the destination: for the moment after
     *  a resize, frames cut for the old size stretch to fit rather than leave
     *  a gap, until they are cut again. */
    const blit = (frame: Frame, alpha: number) => {
      const { width: w, height: h } = canvas;
      ctx.globalAlpha = alpha;
      if (frame instanceof HTMLImageElement) {
        const { sx, sy, sw, sh } = cropFor(w, h);
        ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, w, h);
      } else {
        ctx.drawImage(frame, 0, 0, w, h);
      }
    };

    /** Draws the film at a fractional frame position, blending the two loaded
     *  frames either side of it. No ground is filled first: the canvas is
     *  opaque and the first frame covers every pixel of it. */
    const paintAt = (position: number) => {
      const lo = below(position);
      const hi = above(position);
      const a = lo >= 0 ? lo : hi;
      if (a < 0) return false;
      const mix = lo >= 0 && hi > lo ? (position - lo) / (hi - lo) : 0;
      /* At either end of a blend one frame is all there is to see; drawing
         the other under or over it is a wasted copy. */
      if (mix > 0.99) {
        blit(frames[hi]!, 1);
      } else {
        blit(frames[a]!, 1);
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
      /* The callback still runs at the display's rate — that is the only
         clock that stops by itself in a background tab — but it paints 30
         times a second. A tick that arrives sooner does nothing at all. */
      if (now - lastTick < PAINT_INTERVAL_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
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

    /** Sizes the canvas's backing store to its box. True if it changed —
     *  which also CLEARS the canvas, so the caller must paint again.
     *
     *  `clientWidth`, not `getBoundingClientRect()`: the canvas sits in the
     *  tilting case, and a bounding box is measured after the 3D transform,
     *  so it came back a few percent small whenever the case was leaning. */
    const measure = () => {
      const boxWidth = canvas.clientWidth;
      const boxHeight = canvas.clientHeight;
      if (!boxWidth || !boxHeight) return false;
      const height = Math.round(Math.min(boxHeight * (window.devicePixelRatio || 1), maxHeight));
      const width = Math.round(height * (boxWidth / boxHeight));
      if (width === canvas.width && height === canvas.height) return false;
      canvas.width = width;
      canvas.height = height;
      return true;
    };
    /* Before the first frame is cut, so it is cut for the real box. If the
       box cannot be measured yet the canvas gets the case's 4:5 at the size
       it has on a 1x desktop; the observer below corrects it. */
    if (!measure()) {
      canvas.width = 432;
      canvas.height = 540;
    }

    const repaint = () => {
      if (!ready) return;
      paintAt(mode === 'play' ? Math.min(1, elapsed / PLAY_MS) * last : mode === 'hold' ? last : 0);
    };

    /** Shares the decode lanes between the first load and a re-cut. */
    let decoding = 0;
    const queue: (() => void)[] = [];
    const takeLane = () =>
      new Promise<void>((resolve) => {
        if (decoding < DECODE_LANES) {
          decoding += 1;
          resolve();
        } else {
          queue.push(resolve);
        }
      });
    const freeLane = () => {
      const next = queue.shift();
      if (next) next();
      else decoding -= 1;
    };

    /** Once the film is moving, the rest of the frames are cut in the gaps
     *  between its paints rather than against them. Bounded, so a busy page
     *  delays the sharpening by a couple of seconds at most, not for ever. */
    const breathe = () =>
      new Promise<void>((resolve) => {
        if (!ready) resolve();
        else if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => resolve(), { timeout: 50 });
        } else window.setTimeout(resolve, 16);
      });

    /** For engines whose `createImageBitmap` ignores the resize options. */
    let scratch: HTMLCanvasElement | null = null;

    /** One file to one bitmap of exactly `w` x `h`: decoded, cropped and
     *  resized in a single step, on the browser's own thread, so a full-size
     *  frame never reaches the page's memory or its main thread. */
    const cut = async (blob: Blob, w: number, h: number): Promise<ImageBitmap> => {
      const { sx, sy, sw, sh } = cropFor(w, h);
      let bitmap: ImageBitmap;
      let cropped = true;
      try {
        bitmap = await createImageBitmap(blob, sx, sy, sw, sh, {
          resizeWidth: w,
          resizeHeight: h,
          resizeQuality: 'high',
        });
      } catch {
        /* An engine that rejects the options dictionary outright. */
        bitmap = await createImageBitmap(blob);
        cropped = false;
      }
      if (bitmap.width === w && bitmap.height === h) return bitmap;
      /* The options were ignored and the bitmap is still source-sized. Resize
         it through a canvas, once, and keep only the result — holding 96
         uncut bitmaps is the memory problem this function exists to end. */
      scratch ??= document.createElement('canvas');
      scratch.width = w;
      scratch.height = h;
      const pen = scratch.getContext('2d', { alpha: false });
      if (!pen) return bitmap;
      if (cropped) pen.drawImage(bitmap, 0, 0, w, h);
      else pen.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
      bitmap.close();
      /* The copy is taken as the call is made, so the shared scratch canvas
         is free for the other lane before this promise settles. */
      return createImageBitmap(scratch);
    };

    const release = (frame: Frame | null) => {
      if (frame && !(frame instanceof HTMLImageElement)) frame.close();
    };

    /** Cuts frame `i` from its file for the canvas's current size and swaps
     *  it in, closing the one it replaces. */
    const place = async (i: number) => {
      const blob = blobs[i];
      if (!blob) return;
      await takeLane();
      try {
        await breathe();
        if (cancelled) return;
        const bitmap = await cut(blob, canvas.width, canvas.height);
        if (cancelled) {
          bitmap.close();
          return;
        }
        release(frames[i]);
        frames[i] = bitmap;
      } finally {
        freeLane();
      }
    };

    /** A frame cut for a size the canvas no longer has. */
    const stale = (frame: Frame | null) =>
      !!frame &&
      !(frame instanceof HTMLImageElement) &&
      (frame.width !== canvas.width || frame.height !== canvas.height);

    /* Declared here because a re-cut walks the frames in loading order. */
    const order = loadOrder(set.count);

    let recutTimer = 0;
    let recutRun = 0;
    const resize = () => {
      if (!measure()) return;
      repaint();
      /* Dragging a window edge resizes the case on every frame; cutting 96
         bitmaps for each width passed through would be the old cost again.
         Until the size settles the existing frames are stretched. */
      window.clearTimeout(recutTimer);
      recutTimer = window.setTimeout(async () => {
        const run = ++recutRun;
        for (const i of order) {
          if (cancelled || run !== recutRun) return;
          if (stale(frames[i])) await place(i).catch(() => {});
        }
        if (!cancelled && run === recutRun) repaint();
      }, 250);
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
    const firstPass = new Set(order.slice(0, Math.ceil(set.count / 8) + 2));
    let firstPassLeft = firstPass.size;

    const settle = (i: number) => {
      if (cancelled || ready || !firstPass.has(i)) return;
      firstPassLeft -= 1;
      if (firstPassLeft > 0) return;
      ready = true;
      if (paintAt(0)) setDrawn(true);
      run();
    };

    /** Safari 14 and older: no `createImageBitmap`. The frame stays an <img>
     *  and is cropped and scaled on every paint, as the film first did. */
    const loadAsImage = async (i: number) => {
      const img = new window.Image();
      img.decoding = 'async';
      img.src = framePath(set.dir, i);
      await img.decode();
      if (!cancelled) frames[i] = img;
    };

    const loadAsBitmap = async (i: number) => {
      const response = await fetch(framePath(set.dir, i));
      if (!response.ok) throw new Error(`frame ${i + 1}: ${response.status}`);
      const blob = await response.blob();
      if (cancelled) return;
      blobs[i] = blob;
      await place(i);
    };

    const load = typeof createImageBitmap === 'function' ? loadAsBitmap : loadAsImage;
    let nextInOrder = 0;
    const lane = async () => {
      while (!cancelled && nextInOrder < order.length) {
        const i = order[nextInOrder++];
        try {
          await load(i);
        } catch {
          /* A missing frame is skipped; its neighbours cover the gap. */
        }
        settle(i);
      }
    };
    const start = () => {
      for (let n = 0; n < FETCH_LANES; n++) void lane();
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelled = true;
      stop();
      window.clearTimeout(recutTimer);
      /* Bitmaps are not memory the collector hurries for: closed here, the
         film's memory is returned the moment the tier changes or the page is
         left, not whenever the next collection happens to run. */
      frames.forEach(release);
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
    const spot = band.querySelector<HTMLElement>('.hero-spot');

    let frame = 0;
    let over = false;
    let x = 0;
    let y = 0;
    /** Pointer position in the band's own pixels, for the spotlight. */
    let px = 0;
    let py = 0;
    const apply = () => {
      frame = 0;
      card.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
      /* The spotlight (`.hero-spot`, in hero.tsx) reads these as a TRANSLATE,
         not as a gradient position: moving a layer is composited, re-drawing
         a gradient across a band this size every frame is not. They are
         written on the spotlight itself, not on the band: a custom property
         inherits, so setting it on the band re-resolved the style of every
         element in the hero on every pointer frame. */
      spot?.style.setProperty('--spot-x', `${px.toFixed(1)}px`);
      spot?.style.setProperty('--spot-y', `${py.toFixed(1)}px`);
    };
    const onMove = (event: PointerEvent) => {
      const rect = band.getBoundingClientRect();
      px = event.clientX - rect.left;
      py = event.clientY - rect.top;
      x = (px / rect.width) * 2 - 1;
      y = (py / rect.height) * 2 - 1;
      /* Once per entry, not once per move: an attribute write on the band
         is a style invalidation of the band whether or not the value changed. */
      if (!over) {
        over = true;
        band.setAttribute('data-pointer', '');
      }
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      over = false;
      band.removeAttribute('data-pointer');
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

  /* The band's decorative loops (the aurora, the light on the case's border,
     the floating facts) are CSS, and CSS has no idea whether anyone can see
     them. This tells it: `data-offscreen` while the band is scrolled away,
     so nothing animates for a visitor reading the footer. Every tier, the
     static one included — those loops are not the film. */
  useEffect(() => {
    const band = stageRef.current?.closest('section');
    if (!band || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      band.toggleAttribute('data-offscreen', !entry.isIntersecting);
    });
    io.observe(band);
    return () => {
      io.disconnect();
      band.removeAttribute('data-offscreen');
    };
  }, []);

  const togglePaused = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    /* The pause control stops EVERYTHING that moves in the band, not only the
       film: a visitor who asked for stillness and still had lights drifting
       behind the headline has not been given it (WCAG 2.2.2). */
    stageRef.current?.closest('section')?.toggleAttribute('data-paused', next);
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

      {/* The tilting element. NOT clipped: `overflow: hidden` flattens a 3D
          context, and the facts floating in front of the case would be
          pressed back into it. The clipping lives on the body inside. */}
      <div ref={cardRef} className="hero-case relative">
        {/* The border is a light travelling round the case: a conic gradient
            far larger than the case, rotating behind a body that covers all
            of it but a hairline. One transform, on one layer. */}
        <div className="hero-beam relative overflow-hidden rounded-[1.75rem] p-[1.5px]">
        <div className="relative overflow-hidden rounded-[calc(1.75rem-1.5px)] bg-stage">
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

        {children}
      </div>
    </div>
  );
}
