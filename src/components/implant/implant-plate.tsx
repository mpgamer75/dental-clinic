'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as G from './plate-geometry';

/**
 * The implant assembly as a scroll-driven anatomical HALF-SECTION.
 *
 * This is what phones, tablets, save-data connections and reduced-motion
 * sessions get instead of the WebGL scene — and it is a peer of it, not a
 * placeholder. three.js is never fetched on those clients, so the whole 3D
 * payload and its per-frame GPU cost simply do not exist here.
 *
 * WHY A HALF-SECTION.
 * The left half is cut on the long axis and the right half is the outside
 * surface. That is a real technical-illustration convention and it earns its
 * keep twice over: the cut half shows the fixture inside the bone, the internal
 * connection and the screw channel — the things the section exists to explain —
 * while the surface half shows the thread crests, the scalloped gingival margin
 * and the cusp form, which a pure section throws away. Doing only one of the
 * two is why medical diagrams usually look either flat or unreadable.
 *
 * WHY IT COSTS ALMOST NOTHING.
 * Every part is a static path computed once at module scope. Scroll updates
 * touch only `transform` on five groups and `opacity`/`stroke-dashoffset` on a
 * handful of leaf nodes — no new geometry, no React render. (Writing the SVG
 * `transform` attribute does dirty SVG layout in Blink rather than being
 * paint-only; measured at ~0.12 ms per update for the whole drawing, which is
 * comfortably inside a frame.)
 * There is no requestAnimationFrame loop at all: the parent already receives
 * scroll events, so this component is driven by them directly and costs exactly
 * zero when the page is still.
 */

export type PlateHandle = { apply(progress: number): void };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Phase windows are IDENTICAL to the WebGL scene's. The scrub rail and the
   phase caption in <ImplantStage> are shared by both visuals, so if the two
   disagreed about when the crown seats, the caption would be lying on one of
   them. */
const PHASE_FIXTURE = [0.06, 0.46] as const;
const PHASE_ABUTMENT = [0.42, 0.68] as const;
const PHASE_CROWN = [0.62, 0.86] as const;
const PHASE_OSSEO = [0.84, 1] as const;

/** Height each part starts at, in mm above its seated position. */
const RISE_FIXTURE = 6;
const RISE_ABUTMENT = 18;
const RISE_CROWN = 28;

interface ImplantPlateProps {
  label: string;
  /** Filled with the imperative handle on mount, nulled on unmount. */
  handleRef: MutableRefObject<PlateHandle | null>;
  reduced: boolean;
}

export function ImplantPlate({ label, handleRef, reduced }: ImplantPlateProps) {
  const fixtureRef = useRef<SVGGElement>(null);
  const abutmentRef = useRef<SVGGElement>(null);
  const crownRef = useRef<SVGGElement>(null);
  const osseoRef = useRef<SVGGElement>(null);
  const strutRefs = useRef<(SVGPathElement | null)[]>([]);
  const markerRefs = useRef<(SVGGElement | null)[]>([]);

  /* Each strut's start time, so new bone fills in from the apex upward rather
     than every strut appearing at once. Computed once — the struts themselves
     are module constants. */
  const strutStarts = useMemo(() => {
    const n = G.OSSEO_STRUT_COUNT;
    return G.OSSEO_STRUTS.map((s) => ((n - 1 - s.delay) / n) * 0.62);
  }, []);

  useEffect(() => {
    const setLift = (el: SVGGElement | null, mmAbove: number) => {
      // The `transform` ATTRIBUTE, not `style.transform`. On SVG the CSS
      // property is resolved against `transform-box`/`transform-origin`, whose
      // defaults differ between engines for nested <g>; the attribute is
      // unambiguously in user units.
      el?.setAttribute('transform', `translate(0 ${(-mmAbove * G.PX).toFixed(2)})`);
    };

    const apply = (raw: number) => {
      // Under reduced motion the plate is pinned fully assembled. It is a
      // diagram: the finished object is the informative state, so there is
      // nothing lost by not animating it.
      const p = reduced ? 1 : clamp01(raw);

      const tFixture = easeOutQuint(seg(p, ...PHASE_FIXTURE));
      const tAbutment = easeOutQuint(seg(p, ...PHASE_ABUTMENT));
      const tCrown = easeOutQuint(seg(p, ...PHASE_CROWN));
      const tOsseo = seg(p, ...PHASE_OSSEO);

      setLift(fixtureRef.current, lerp(RISE_FIXTURE, 0, tFixture));
      setLift(abutmentRef.current, lerp(RISE_ABUTMENT, 0, tAbutment));
      setLift(crownRef.current, G.CROWN_SEAT_MM + lerp(RISE_CROWN, 0, tCrown));

      // Parts that have not begun to move are not drawn. Without this the
      // exploded stack starts outside the viewBox and clips against the frame,
      // which reads as a rendering fault rather than as an assembly.
      if (abutmentRef.current) {
        abutmentRef.current.style.opacity = tAbutment > 0.001 ? '1' : '0';
      }
      if (crownRef.current) {
        crownRef.current.style.opacity = tCrown > 0.001 ? '1' : '0';
      }

      if (osseoRef.current) osseoRef.current.style.opacity = String(tOsseo);
      if (tOsseo > 0) {
        for (let i = 0; i < strutRefs.current.length; i++) {
          const el = strutRefs.current[i];
          if (!el) continue;
          const local = clamp01((tOsseo - strutStarts[i]) / 0.38);
          el.style.strokeDashoffset = String(1 - local);
        }
      }

      /* The cut face used to lighten from 1 to 0.88 across this phase. Dropped:
         an SVG <g> is not a composited layer, so animating its opacity
         repaints the entire subtree — and that group holds the bone path, the
         trabecular pattern under a non-rectangular clip, a 40-unit clipped
         cortical stroke and the gum path. Measured, it took the per-update
         style+layout cost from 0.116 ms to 0.309 ms, a 2.65× step for the last
         16% of the sequence, in exchange for a 12% opacity change nobody can
         see. The struts carry the osseointegration story on their own. */

      const markerAt = [tCrown, tAbutment, tFixture, tOsseo];
      for (let i = 0; i < markerRefs.current.length; i++) {
        const el = markerRefs.current[i];
        if (el) el.style.opacity = String(clamp01(markerAt[i] * 1.4));
      }
    };

    handleRef.current = { apply };
    /* Baseline only. This deliberately does NOT know the scroll position —
       this component has no access to it. <ImplantStage> owns the scroll value
       and re-syncs immediately after this effect (child effects run first), so
       a reload mid-section lands correctly. Under reduced motion the assembled
       state is the final answer and nothing further is needed. */
    apply(reduced ? 1 : 0);

    const ref = handleRef;
    return () => {
      ref.current = null;
    };
  }, [handleRef, reduced, strutStarts]);

  return (
    <svg
      viewBox={`0 0 ${G.VIEW_W} ${G.VIEW_H}`}
      role="img"
      aria-label={label}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* The two halves of the plate. */}
        <clipPath id="plate-cut">
          <rect x="0" y="0" width={G.CX} height={G.VIEW_H} />
        </clipPath>
        <clipPath id="plate-surface">
          <rect x={G.CX} y="0" width={G.VIEW_W - G.CX} height={G.VIEW_H} />
        </clipPath>
        <clipPath id="plate-bone-inner">
          <path d={G.BONE_PATH} />
        </clipPath>

        {/* Light comes from the upper left, on every material, always. One
            committed light direction is most of what separates a modelled
            illustration from a set of flat shapes. */}
        <linearGradient id="plate-metal-surface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="oklch(var(--plate-metal-lo))" />
          <stop offset="0.18" stopColor="oklch(var(--plate-metal))" />
          <stop offset="0.34" stopColor="oklch(var(--plate-metal-hi))" />
          <stop offset="0.52" stopColor="oklch(var(--plate-metal))" />
          <stop offset="0.78" stopColor="oklch(var(--plate-metal-lo))" />
          <stop offset="1" stopColor="oklch(var(--plate-metal))" />
        </linearGradient>
        <linearGradient id="plate-metal-cut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="oklch(var(--plate-metal-lo))" />
          <stop offset="1" stopColor="oklch(var(--plate-metal-cut))" />
        </linearGradient>

        <linearGradient id="plate-crown-surface" x1="0" y1="1" x2="0.25" y2="0">
          <stop offset="0" stopColor="oklch(var(--plate-crown-lo))" />
          <stop offset="0.45" stopColor="oklch(var(--plate-crown))" />
          <stop offset="1" stopColor="oklch(var(--plate-crown-hi))" />
        </linearGradient>
        <linearGradient id="plate-crown-cut" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="oklch(var(--plate-crown-lo))" />
          <stop offset="1" stopColor="oklch(var(--plate-crown-cut))" />
        </linearGradient>

        <linearGradient id="plate-bone-surface" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="oklch(var(--plate-bone))" />
          <stop offset="1" stopColor="oklch(var(--plate-bone-deep))" />
        </linearGradient>
        <linearGradient id="plate-bone-cutfill" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="oklch(var(--plate-bone-cut))" />
          <stop offset="1" stopColor="oklch(var(--plate-bone-deep))" />
        </linearGradient>

        <linearGradient id="plate-gum-surface" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="oklch(var(--plate-gum))" />
          <stop offset="1" stopColor="oklch(var(--plate-gum-deep))" />
        </linearGradient>
        <linearGradient id="plate-gum-cutfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(var(--plate-gum-cut))" />
          <stop offset="1" stopColor="oklch(var(--plate-gum-deep))" />
        </linearGradient>

        {/* Cancellous bone, built to measured micro-CT values for the posterior
            mandible (Kim et al. 2013, Imaging Sci Dent 43:227, 19.6 µm, n=23):

              BV/TV  18.5%   — the cut face is ~82% VOID. Erring dense is what
                               makes sectioned bone read as porous stone.
              Tb.Th  0.23 mm — strut width. At 12 units/mm that is 2.8 units.
              Tb.Sp  0.82 mm — gap, i.e. roughly 3.5× the strut width.
              DA     2.19    — strongly ANISOTROPIC. In the posterior mandible
                               the struts run transversely, buccal↔lingual,
                               perpendicular to the tooth axis. On a
                               buccolingual section that means predominantly
                               HORIZONTAL, which is why this tile is not the
                               isotropic mesh a lattice generator would give.

            Irregular on purpose: a regular grid reads as gauze and a solid fill
            with noise on it reads as clay. */}
        <pattern
          id="plate-trabecular"
          width="34"
          height="30"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(4)"
        >
          <path
            d="M-2 5 L9 3 L18 7 L27 4 L36 6 M-2 15 L7 17 L17 14 L26 16 L36 13 M-2 25 L10 27 L20 23 L29 26 L36 24 M9 3 L7 17 M18 7 L20 23 M27 4 L26 16 M17 14 L10 27"
            fill="none"
            stroke="oklch(var(--plate-cortical) / 0.62)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>

      {/* ═══ 1. The cut half of the tissue, BEHIND the hardware ═══════════════
          Drawing order is what makes the half-section work: on this side the
          bone is behind the fixture, so you see the fixture inside it. */}
      <g clipPath="url(#plate-cut)">
        <path d={G.BONE_PATH} fill="url(#plate-bone-cutfill)" />
        <g clipPath="url(#plate-bone-inner)">
          <rect
            x="0"
            y="0"
            width={G.VIEW_W}
            height={G.VIEW_H}
            fill="url(#plate-trabecular)"
          />
        </g>
        {/* Dense cortical shell over the trabecular interior.
            Crestal cortex in the dentate posterior mandible measures 1.5–1.8 mm
            (Ataman-Duruel 2023). The stroke is centred on the outline, so it is
            drawn at 2× the target and clipped back to the bone — the half that
            would sit outside is discarded, leaving ~1.65 mm of shell inside. */}
        <g clipPath="url(#plate-bone-inner)">
          <path
            d={G.BONE_CORTICAL_PATH}
            fill="none"
            stroke="oklch(var(--plate-cortical))"
            strokeWidth="40"
            strokeLinejoin="round"
            strokeLinecap="butt"
          />
        </g>
        <path d={G.GUM_PATH} fill="url(#plate-gum-cutfill)" />
      </g>

      {/* ═══ 2. The assembly ═════════════════════════════════════════════════ */}

      {/* Fixture */}
      <g ref={fixtureRef}>
        <path d={G.FIXTURE_PATH} fill="url(#plate-metal-surface)" />
        <g clipPath="url(#plate-cut)">
          <path d={G.FIXTURE_PATH} fill="url(#plate-metal-cut)" />
          {/* Internal conical connection and threaded bore. */}
          <path d={G.FIXTURE_BORE_PATH} fill="oklch(var(--plate-metal-lo) / 0.85)" />
        </g>
        <path
          d={G.FIXTURE_PATH}
          fill="none"
          stroke="oklch(var(--plate-metal-lo) / 0.75)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </g>

      {/* Abutment + screw */}
      <g ref={abutmentRef} style={{ opacity: 1 }}>
        <path d={G.ABUTMENT_PATH} fill="url(#plate-metal-surface)" />
        <g clipPath="url(#plate-cut)">
          <path d={G.ABUTMENT_PATH} fill="url(#plate-metal-cut)" />
          <path d={G.ABUTMENT_CHANNEL_PATH} fill="oklch(var(--plate-metal-lo) / 0.55)" />
          <path d={G.ABUTMENT_SCREW_PATH} fill="oklch(var(--plate-metal))" />
          <path
            d={G.ABUTMENT_SCREW_PATH}
            fill="none"
            stroke="oklch(var(--plate-metal-lo) / 0.7)"
            strokeWidth="1"
          />
        </g>
        <path
          d={G.ABUTMENT_PATH}
          fill="none"
          stroke="oklch(var(--plate-metal-lo) / 0.75)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </g>

      {/* Crown */}
      <g ref={crownRef} style={{ opacity: 1 }}>
        <path d={G.CROWN_PATH} fill="url(#plate-crown-surface)" />
        <g clipPath="url(#plate-cut)">
          <path d={G.CROWN_PATH} fill="url(#plate-crown-cut)" />
          {/* The seating socket. An implant crown is fitted to a machined
              abutment, so its underside is a prepared hollow — drawing a root
              here would be the single most obvious error on the plate. */}
          <path d={G.CROWN_SOCKET_PATH} fill="oklch(var(--plate-metal-lo) / 0.35)" />
          <path
            d={G.CROWN_SOCKET_PATH}
            fill="none"
            stroke="oklch(var(--plate-crown-lo))"
            strokeWidth="1"
          />
        </g>
        <path
          d={G.CROWN_PATH}
          fill="none"
          stroke="oklch(var(--plate-crown-lo))"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <g clipPath="url(#plate-surface)">
          <path
            d={G.CROWN_GROOVE_PATH}
            fill="none"
            stroke="oklch(var(--plate-crown-lo) / 0.9)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d={G.CROWN_RIDGE_PATH}
            fill="none"
            stroke="oklch(var(--plate-crown-lo) / 0.55)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* ═══ 3. Osseointegration ═════════════════════════════════════════════
          New bone locking into the thread valleys. The WebGL scene fades the
          bone translucent, which says "something is happening" without saying
          what; this says what. Clipped to the cut half — you could not see it
          from outside, and pretending otherwise would undo the section. */}
      <g
        ref={osseoRef}
        clipPath="url(#plate-cut)"
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        {G.OSSEO_STRUTS.map((strut, i) => (
          <path
            key={i}
            ref={(el) => {
              strutRefs.current[i] = el;
            }}
            d={strut.d}
            fill="none"
            stroke="oklch(var(--plate-cortical))"
            strokeWidth="2.1"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            style={{ strokeDashoffset: 1 }}
          />
        ))}
      </g>

      {/* ═══ 4. The surface half of the tissue, IN FRONT of the hardware ═════
          This is what hides the buried fixture on the right-hand side, which is
          the whole reason the left-hand side is worth cutting. */}
      <g clipPath="url(#plate-surface)">
        <path d={G.BONE_PATH} fill="url(#plate-bone-surface)" />
        <path
          d={G.BONE_CORTICAL_PATH}
          fill="none"
          stroke="oklch(var(--plate-cortical) / 0.55)"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d={G.GUM_PATH} fill="url(#plate-gum-surface)" />
        <path
          d={G.GUM_MARGIN_PATH_R}
          fill="none"
          stroke="oklch(var(--plate-gum) / 0.9)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {/* The free gingival margin on the cut side, so the scallop reads on both
          halves rather than only where the tissue is solid. */}
      <g clipPath="url(#plate-cut)">
        <path
          d={G.GUM_MARGIN_PATH}
          fill="none"
          stroke="oklch(var(--plate-gum) / 0.55)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>

      {/* ═══ 5. The cut plane ════════════════════════════════════════════════
          A hairline on the axis. Without it the two halves read as
          inconsistent shading rather than as a deliberate section. */}
      <line
        x1={G.CX}
        y1={G.CREST_Y - 12 * G.PX}
        x2={G.CX}
        y2={G.VIEW_H}
        stroke="oklch(var(--brass) / 0.32)"
        strokeWidth="0.9"
        strokeDasharray="5 5"
      />

      {/* ═══ 6. Annotation ═══════════════════════════════════════════════════
          Numbered to match the legend beside the figure, and hidden from
          assistive tech: the legend is the authoritative version, so announcing
          these would read the same content twice. */}
      <g aria-hidden="true">
        {G.MARKERS.map((m, i) => (
          <g
            key={i}
            ref={(el) => {
              markerRefs.current[i] = el;
            }}
            style={{ opacity: 0 }}
          >
            <line
              x1={m.tx}
              y1={m.ty}
              x2={m.x}
              y2={m.y}
              stroke="oklch(var(--brass) / 0.55)"
              strokeWidth="1"
            />
            <circle cx={m.tx} cy={m.ty} r="2.4" fill="oklch(var(--brass))" />
            <circle
              cx={m.x}
              cy={m.y}
              r="12.5"
              fill="oklch(var(--canvas))"
              stroke="oklch(var(--brass) / 0.55)"
              strokeWidth="1.1"
            />
            <text
              x={m.x}
              y={m.y + 5.2}
              textAnchor="middle"
              className="font-heading tabular"
              fontSize="15"
              fill="oklch(var(--brass-ink))"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
