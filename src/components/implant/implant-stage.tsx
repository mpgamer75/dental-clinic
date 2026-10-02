'use client';

import dynamic from 'next/dynamic';
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import { ImplantPlate, type PlateHandle } from './implant-plate';
import { phaseIndexAt } from './phases';

/**
 * WebGL chunk. Loaded only once the figure is within 400 px of the viewport
 * AND {@link canRenderWebGL} says yes, so the three.js payload never lands on
 * a phone, a save-data connection, or a reduced-motion session — and never
 * blocks first paint on any device.
 */
const ImplantScene = dynamic(() => import('./implant-scene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Decides whether this client should get the 3D upgrade.
 *
 * Deliberately conservative: the SVG is a complete answer, so every uncertain
 * case falls back rather than risking a janky scene on a device that can't
 * carry it. Runs on the client only — the server always renders the SVG, which
 * is what makes the swap hydration-safe.
 *
 * DEVICE signals only. This used to read `navigator.connection.effectiveType`
 * as well, which is not a property of the device at all: it is Chrome's running
 * estimate of recent round-trip times. After one slow stretch it reported "3g"
 * on a 32 GB desktop with a discrete GPU, and that visitor got the phone
 * fallback. The network cost is already handled — three.js is fetched only near
 * the section — so the question here is only whether the machine can draw it.
 * `saveData` stays: it is an explicit choice the visitor made.
 */
function canRenderWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < 1024) return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
  /* Scene setup is procedural geometry built on the main thread; on a
     dual-core machine that is the scroll stuttering, whatever the GPU is. */
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false;

  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return false;
    // Software rasterisers (SwiftShader/llvmpipe) are not worth the battery.
    const dbg = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const r = String(
        (gl as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '',
      ).toLowerCase();
      if (/swiftshader|llvmpipe|software/.test(r)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Scroll progress of `driverRef` through the viewport: 0 when its top reaches
 * the top of the viewport, 1 when its bottom reaches the bottom.
 *
 * The semantics of Framer Motion's `useScroll({ target, offset: ['start
 * start', 'end end'] })`, which this replaces. Framer Motion was in the bundle
 * for this one value — useScroll, useMotionValueEvent and useReducedMotion in
 * this file and nowhere else — and on a throttled phone its scroll measurement
 * cost an 86 ms script task plus a 76 ms style recalculation during load.
 *
 * What it costs instead:
 *   - one passive `scroll` listener, coalesced to one read per frame, and
 *     attached only while the driver is within half a viewport of the screen;
 *   - no layout read per scroll: the driver's document offset and height are
 *     measured once and re-measured only when the driver or the document
 *     resizes (lazy images above it, fonts swapping, an accordion opening) —
 *     so a scroll is arithmetic on `scrollY` and nothing else;
 *   - no React render: `onProgress` writes to refs and the DOM directly.
 */
function useDriverProgress(
  driverRef: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
) {
  const emit = useEffectEvent(onProgress);

  useEffect(() => {
    const driver = driverRef.current;
    if (!driver) return;

    let top = 0;
    let height = 0;
    let viewport = window.innerHeight;
    let frame = 0;
    let listening = false;

    const measure = () => {
      const rect = driver.getBoundingClientRect();
      top = rect.top + window.scrollY;
      height = rect.height;
      viewport = window.innerHeight;
    };

    const compute = () => {
      frame = 0;
      const range = height - viewport;
      // A driver no taller than the viewport has no travel: it is either not
      // reached yet or fully passed.
      const raw = range > 0 ? (window.scrollY - top) / range : window.scrollY >= top ? 1 : 0;
      emit(Math.min(1, Math.max(0, raw)));
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(compute);
    };

    const remeasure = () => {
      measure();
      schedule();
    };

    const attach = () => {
      if (listening) return;
      listening = true;
      window.addEventListener('scroll', schedule, { passive: true });
    };
    const detach = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener('scroll', schedule);
    };

    /* Synchronous first read, so a reload or deep link into the middle of the
       section lands on the right frame instead of sitting at zero until the
       first scroll event. This runs after the plate's own effect (child
       effects fire first), so the plate is already listening. */
    measure();
    compute();

    const resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(driver);
    resizeObserver.observe(document.documentElement);
    window.addEventListener('resize', remeasure, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          measure();
          attach();
        } else {
          detach();
        }
        // One last read on the way out, so a fast fling past the section still
        // leaves the figure, the rail and the caption at 0 or 1 rather than
        // wherever the last coalesced frame happened to catch them.
        schedule();
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(driver);

    return () => {
      detach();
      io.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', remeasure);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [driverRef]);
}

/**
 * `prefers-reduced-motion`, read after mount.
 *
 * Not during render: the server has no media queries, so a value read while
 * rendering makes the server HTML and the client's first pass disagree, and
 * the reduced-motion visitor is the one who loses. Starting at `false` and
 * narrowing to the truth in an effect is the discipline reveal.tsx and the
 * carousel already follow.
 */
function useReducedMotionPreference() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduce;
}

interface ImplantStageProps {
  label: string;
  /**
   * The element whose scroll drives the assembly. This is the TALL section
   * column, not the canvas host — driving from the canvas gave the whole
   * sequence roughly one viewport of travel, so it completed in a blink and
   * read as "not working". Driving from the column gives it the column's full
   * height while the canvas stays pinned in view.
   */
  driverRef: RefObject<HTMLElement | null>;
  /** e.g. "Ø 4,1 × 10 mm" — the real fixture dimensions. */
  scaleNote: string;
  /**
   * Phase captions, in ASSEMBLY order — fixture, abutment, crown, bone — the
   * order of `implantEducation.parts`. Four entries follow the figure's own
   * phase windows (./phases); any other count is split evenly.
   */
  phases: string[];
  /**
   * Called with the index into `phases` of the part the figure is showing:
   * once when the stage mounts (with wherever the page already is), and then
   * only when the index CHANGES — never per frame, so it is safe to set state
   * from. The caption under the figure shows `phases[index]` at the same time.
   */
  onPhaseChange?: (index: number) => void;
}

export function ImplantStage({
  label,
  driverRef,
  scaleNote,
  phases,
  onPhaseChange,
}: ImplantStageProps) {
  const [use3d, setUse3d] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  /** The phase last reported; -1 until the first read, so it always fires once. */
  const phaseRef = useRef(-1);
  /** Imperative handle onto the 2D plate. Null while the 3D scene is showing. */
  const plateRef = useRef<PlateHandle | null>(null);
  const reduce = useReducedMotionPreference();

  /* The 3D upgrade waits for the viewport, not just for a capable device.
     This figure lives well below the fold, and promoting it at mount put all
     of its cost on the hydration critical path: a ~150 KB three.js chunk, a
     procedural geometry build, a baked PMREM environment and a dozen shader
     links, all competing with LCP for a picture nobody has scrolled to yet.
     400 px of margin is roughly a flick of the wheel, which is enough for the
     chunk to arrive before the section is on screen; the scene then builds
     itself one step per task (see implant-scene.tsx).

     The capability probe runs here rather than at mount for the same reason:
     it allocates a throwaway WebGL context to sniff the renderer string, and
     that is not something to do while the page is still hydrating. Evaluating
     it late is also strictly more accurate — `innerWidth` is read after any
     orientation change or window resize the visitor made on the way down. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const promote = () => {
      if (canRenderWebGL()) setUse3d(true);
    };

    if (typeof IntersectionObserver === 'undefined') {
      promote();
      return;
    }

    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        promote();
      },
      { rootMargin: '400px' },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  /* Window: the progress ramp must fit INSIDE the pinned window, or the
     sequence keeps advancing after the figure has already scrolled away —
     which is what it used to do.

     Pin lasts (columnHeight − figureHeight) px. With `start start → end end`
     the progress ramp lasts (columnHeight − viewportHeight) px. So the ramp
     finishes before the pin releases exactly when viewportHeight ≥
     figureHeight + stickyTop, independent of how tall the column happens to
     be. The square desktop frame below is what buys that margin: it keeps the
     figure near 650 px, so this holds down to roughly a 750 px viewport.

     Scroll drives the assembly through refs, and the readouts are written
     straight to the DOM; React never re-renders during the scroll. The 3D
     scene reads `progress.current` from its own animation loop, so it gets
     damping for free. The 2D plate has no loop by design — costing nothing
     when the page is still is the entire point of it on a phone — so it is
     pushed here instead. Both consume the SAME value, which is what keeps the
     scrub rail, the caption and the legend honest on either visual. */
  useDriverProgress(driverRef, (raw) => {
    const p = Math.min(1, Math.max(0, raw));
    progress.current = p;
    plateRef.current?.apply(p);

    if (railRef.current) railRef.current.style.transform = `scaleY(${p})`;

    const phase = phaseIndexAt(p, phases.length);
    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      if (captionRef.current && phases[phase] !== undefined) {
        captionRef.current.textContent = phases[phase];
      }
      onPhaseChange?.(phase);
    }
  });

  /* The plate as soon as the scene is unwanted: at mount, under reduced motion
     (the scene never animates there, so it is cost without benefit), and when
     the scene reports that WebGL could not be set up or was lost. */
  const showScene = use3d && !reduce;

  return (
    <figure className="m-0">
      {/* The vitrine.

          The previous build rendered a transparent canvas straight onto the
          page background, so on a real GPU the object floated with a hard
          rectangular clip at the canvas edge and no sense of being anywhere.
          This is a lit case: warm surface, hairline frame, a soft interior
          wash, and instrumentation down the right edge. */}
      <div className="relative overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-e2">
        {/* Interior light wash — sits behind the canvas, gives the object a
            room to be in rather than a flat fill. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_85%_at_28%_18%,oklch(var(--surface-raised))_0%,oklch(var(--canvas))_46%,oklch(var(--canvas-sunk))_100%)]"
        />
        {/* Faint floor line, so the object reads as standing on something. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/[0.055] to-transparent"
        />

        {/* The plate's own drawing is 336×456 (0.74), so the mobile box is
            kept near that ratio — a 4/3 box would fit the height and strand
            ~40% of the frame as empty margin either side.

            Height-capped below `lg`, because the figure is PINNED there and
            everything it does not cover is the reading slot for the legend
            scrolling past it. At its natural 4/5 the frame took ~55–60% of an
            844 px phone and left the legend a ~250 px strip to be read
            through. Capped at 42svh the box simply gets wider than its ratio;
            the plate is drawn with `meet`, so it stays whole and centred. The
            `sm` cap is for landscape phones, where an uncapped 4/3 frame is
            taller than the screen it is pinned to.

            Desktop is square, not the previous 5/6. At 5/6 the figure came out
            812 px tall, taller than the room a 950 px viewport leaves once the
            sticky offset is taken out, so the pin released mid-sequence. See
            the note on the scroll window above. */}
        <div
          ref={hostRef}
          className="relative aspect-[4/5] max-h-[42svh] w-full sm:aspect-[4/3] sm:max-h-[56svh] lg:aspect-square lg:max-h-none"
        >
          {showScene ? (
            <ImplantScene progress={progress} reduced={reduce} onUnavailable={() => setUse3d(false)} />
          ) : (
            <div className="h-full w-full p-4 sm:p-7">
              <ImplantPlate label={label} handleRef={plateRef} reduced={reduce} />
            </div>
          )}
        </div>

        {/* Scrub rail. Doubles as the affordance that says "this responds to
            scroll" — without it the sequence looks broken rather than idle. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 right-4 w-px bg-line"
        >
          <span
            ref={railRef}
            className="absolute inset-0 origin-top scale-y-0 bg-brass"
          />
        </div>

        {/* Scale annotation. A labelled dimension reads as more credible than
            an unlabelled render, and it is true: these are the real numbers the
            geometry is built to. */}
        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-line/70 bg-canvas px-2.5 py-1 text-small text-ink-soft tabular">
          {scaleNote}
        </span>
      </div>

      <figcaption className="mt-3 flex items-baseline gap-2 text-small text-ink-soft">
        <span aria-hidden="true" className="h-px w-6 shrink-0 bg-brass" />
        {/* The live phase label is decorative duplication of the numbered
            legend beside it, so it is hidden from assistive tech rather than
            announced on every scroll tick. */}
        <span ref={captionRef} aria-hidden="true">
          {phases[0] ?? ''}
        </span>
        <span className="sr-only">{label}</span>
      </figcaption>
    </figure>
  );
}
