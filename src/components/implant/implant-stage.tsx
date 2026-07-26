'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
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

  // Respect the OS motion preference.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  // Pointer/size gate: the scene is composed for a desktop-scale viewport.
  if (window.innerWidth < 1024) return false;

  // Data-saver and slow connections.
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)(2g|slow-2g|3g)$/.test(conn.effectiveType)) return false;

  // Low-memory devices.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem < 4) return false;

  // Actual WebGL capability — feature-detect, don't assume.
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

export function ImplantStage({ label }: { label: string }) {
  const [use3d, setUse3d] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    setUse3d(canRenderWebGL());
  }, []);

  // Scroll drives the assembly through a ref, so the canvas re-renders via
  // useFrame only — React never re-renders during scroll.
  const { scrollYProgress } = useScroll({
    target: hostRef,
    offset: ['start end', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Map the middle of the travel to the full assembly so the sequence
    // completes while the piece is actually on screen.
    progress.current = Math.min(1, Math.max(0, (v - 0.12) / 0.62));
  });

  return (
    <div
      ref={hostRef}
      className="relative aspect-[4/5] w-full max-w-[30rem] sm:aspect-square"
    >
      {use3d ? (
        <>
          <ImplantScene progress={progress} reduced={!!reduce} />
          {/* The canvas is decorative once the legend below carries the same
              information in text; keep an accessible name available anyway. */}
          <span className="sr-only">{label}</span>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImplantDiagram label={label} />
        </div>
      )}
    </div>
  );
}
