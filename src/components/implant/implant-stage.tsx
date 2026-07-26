'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { ImplantDiagram } from './implant-diagram';

/**
 * WebGL chunk. Loaded only after {@link canRenderWebGL} says yes, so the
 * three.js payload never lands on a phone, a save-data connection, or a
 * reduced-motion session — and never blocks first paint on any device.
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
  driverRef: RefObject<HTMLElement>;
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
  const reduce = useReducedMotion();

  useEffect(() => {
    setUse3d(canRenderWebGL());
  }, []);

  const { scrollYProgress } = useScroll({
    target: driverRef,
    offset: ['start center', 'end end'],
  });

  // Scroll drives the assembly through a ref, and the readouts are written
  // straight to the DOM. React never re-renders during the scroll.
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const p = Math.min(1, Math.max(0, v));
    progress.current = p;

    if (railRef.current) railRef.current.style.transform = `scaleY(${p})`;

    if (captionRef.current && phases.length) {
      const i = Math.min(phases.length - 1, Math.floor(p * phases.length));
      if (captionRef.current.textContent !== phases[i]) {
        captionRef.current.textContent = phases[i];
      }
    }
  });

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

        <div
          ref={hostRef}
          className="relative aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-[5/6]"
        >
          {use3d ? (
            <ImplantScene progress={progress} reduced={!!reduce} />
          ) : (
            // The SVG is authored at max-w-[300px], which is right inline but
            // leaves it stranded in the middle of a ~750px vitrine. Let it take
            // the case's height instead so the fallback fills the same frame
            // the 3D scene does.
            <div className="flex h-full w-full items-center justify-center p-8 [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-none">
              <ImplantDiagram label={label} />
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
        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-line/70 bg-canvas/80 px-2.5 py-1 text-[0.72rem] text-ink-soft tabular backdrop-blur-sm">
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
