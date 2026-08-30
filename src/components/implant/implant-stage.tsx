'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { ImplantPlate, type PlateHandle } from './implant-plate';

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

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Decides whether this client should get the 3D upgrade.
 *
 * Deliberately conservative: the SVG is a complete answer, so every uncertain
 * case falls back rather than risking a janky scene on a device that can't
 * carry it. Runs on the client only — the server always renders the SVG, which
 * is what makes the swap hydration-safe.
 */
function canRenderWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < 1024) return false;

  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)(2g|slow-2g|3g)$/.test(conn.effectiveType)) return false;

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem < 4) return false;

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
  /** Phase captions, in order, shown as the sequence advances. */
  phases: string[];
}

export function ImplantStage({ label, driverRef, scaleNote, phases }: ImplantStageProps) {
  const [use3d, setUse3d] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  /** Imperative handle onto the 2D plate. Null while the 3D scene is showing. */
  const plateRef = useRef<PlateHandle | null>(null);
  const reduce = useReducedMotion();

  /* The 3D upgrade waits for the viewport, not just for a capable device.
     This figure lives well below the fold, and promoting it at mount put all
     of its cost on the hydration critical path: a ~150 KB three.js chunk, a
     ~70 ms procedural geometry build (100–200 ms on mid-range hardware), a
     baked PMREM environment and a dozen shader links, all competing with LCP
     for a picture nobody has scrolled to yet. 400 px of margin is roughly a
     flick of the wheel, which is enough for the chunk to arrive and the
     geometry to build before the section is on screen.

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

  /* The window must fit INSIDE the pinned window, or the sequence keeps
     advancing after the figure has already scrolled away — which is what it
     used to do.

     Pin lasts (columnHeight − figureHeight) px. With `start start → end end`
     the progress ramp lasts (columnHeight − viewportHeight) px. So the ramp
     finishes before the pin releases exactly when viewportHeight ≥
     figureHeight + stickyTop, independent of how tall the column happens to
     be. The square desktop frame below is what buys that margin: it keeps the
     figure near 650 px, so this holds down to roughly a 750 px viewport. */
  const { scrollYProgress } = useScroll({
    target: driverRef,
    offset: ['start start', 'end end'],
  });

  // Scroll drives the assembly through a ref, and the readouts are written
  // straight to the DOM. React never re-renders during the scroll.
  //
  // The 3D scene reads `progress.current` from its own animation loop, so it
  // gets damping for free. The 2D plate has no loop by design — costing nothing
  // when the page is still is the entire point of it on a phone — so it is
  // pushed here instead. Both consume the SAME value, which is what keeps the
  // scrub rail and the phase caption honest on either visual.
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const p = Math.min(1, Math.max(0, v));
    progress.current = p;
    plateRef.current?.apply(p);

    if (railRef.current) railRef.current.style.transform = `scaleY(${p})`;

    if (captionRef.current && phases.length) {
      const i = Math.min(phases.length - 1, Math.floor(p * phases.length));
      if (captionRef.current.textContent !== phases[i]) {
        captionRef.current.textContent = phases[i];
      }
    }
  });

  /* Sync to the CURRENT scroll position once the visual has mounted.
     `useMotionValueEvent` only fires on change, so on a reload or a deep link
     into the middle of the section nothing would call `apply` until the user
     scrolled — the figure and the scrub rail would both sit at zero while the
     page was visibly halfway through the section. The plate's own effect
     cannot do this either: it runs before this one (child effects fire first),
     and it has no access to the scroll value. Depends on `use3d` so it re-runs
     at the moment the plate actually mounts. */
  useEffect(() => {
    const p = Math.min(1, Math.max(0, scrollYProgress.get()));
    progress.current = p;
    plateRef.current?.apply(p);
    if (railRef.current) railRef.current.style.transform = `scaleY(${p})`;
  }, [use3d, scrollYProgress]);

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

            Desktop is square, not the previous 5/6. At 5/6 the figure came out
            812 px tall, taller than the room a 950 px viewport leaves once the
            sticky offset is taken out, so the pin released mid-sequence. See
            the note on the scroll offset above. */}
        <div
          ref={hostRef}
          className="relative aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-square"
        >
          {use3d ? (
            <ImplantScene progress={progress} reduced={!!reduce} />
          ) : (
            <div className="h-full w-full p-5 sm:p-7">
              <ImplantPlate label={label} handleRef={plateRef} reduced={!!reduce} />
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
