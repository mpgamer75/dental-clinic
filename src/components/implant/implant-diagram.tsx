'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Static implant cross-section.
 *
 * This is the SSR output and the fallback for every client that shouldn't get
 * WebGL (mobile, save-data, low memory, reduced-motion, no GL context). It is
 * a complete answer on its own, not a placeholder: the WebGL scene is an
 * upgrade over this, never a prerequisite for understanding the section.
 *
 * Colours are bound to theme tokens via `currentColor` and Tailwind fill/stroke
 * utilities so it tracks light/dark without a second asset.
 */
export function ImplantDiagram({ label }: { label: string }) {
  const reduce = useReducedMotion();

  const draw = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true, margin: '0px 0px -60px 0px' },
          transition: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: -14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '0px 0px -60px 0px' },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  // Thread crests down the post.
  const threads = [168, 186, 204, 222, 240, 258, 276, 294];

  return (
    <svg
      viewBox="0 0 240 380"
      role="img"
      aria-label={label}
      className="mx-auto h-auto w-full max-w-[300px]"
    >
      {/* Bone body */}
      <rect x="26" y="140" width="188" height="212" rx="20" className="fill-canvas-sunk" />
      {/* Trabecular hint — reads as cancellous bone without being literal */}
      <g className="stroke-ink/10" strokeWidth="1.5">
        {[170, 200, 230, 260, 290, 320].map((y) => (
          <line key={y} x1="38" y1={y} x2="202" y2={y - 10} />
        ))}
      </g>

      {/* Gingiva */}
      <rect x="16" y="120" width="208" height="26" rx="10" className="fill-terracotta/35" />

      {/* Titanium post */}
      <motion.g {...rise(0)}>
        <path
          d="M96 130 H144 L136 322 Q120 340 104 322 Z"
          className="fill-petrol"
        />
        {threads.map((y, i) => (
          <line
            key={y}
            x1={100 + i * 0.4}
            y1={y}
            x2={140 - i * 0.4}
            y2={y - 9}
            className="stroke-canvas/45"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        ))}
      </motion.g>

      {/* Abutment */}
      <motion.path
        {...rise(0.16)}
        d="M100 96 H140 L134 128 H106 Z"
        className="fill-petrol/75"
      />

      {/* Crown */}
      <motion.path
        {...draw(0.3)}
        d="M78 92 Q72 40 120 32 Q168 40 162 92 Q142 104 120 104 Q98 104 78 92 Z"
        className="fill-surface stroke-terracotta"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Occlusal fissure */}
      <motion.path
        {...draw(0.7)}
        d="M92 62 Q108 74 120 62 Q132 74 148 62"
        className="stroke-terracotta/40"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Numbered markers, matching the legend order */}
      {[
        { x: 190, y: 62 },
        { x: 190, y: 112 },
        { x: 190, y: 240 },
        { x: 50, y: 300 },
      ].map((m, i) => (
        <motion.g key={i} {...rise(0.5 + i * 0.09)}>
          <circle cx={m.x} cy={m.y} r="14" className="fill-terracotta" />
          <text
            x={m.x}
            y={m.y + 5}
            textAnchor="middle"
            className="fill-surface"
            fontSize="15"
            fontWeight="700"
          >
            {i + 1}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
