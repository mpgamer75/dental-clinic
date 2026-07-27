/**
 * Path geometry for the 2D implant plate.
 *
 * Built in REAL MILLIMETRES against the same reference dimensions as the WebGL
 * model in ./geometry.ts, then projected to SVG user units once. Keeping both
 * visuals on the same numbers is the point: the phone and the desktop are
 * showing the same object, so they must not disagree about its proportions.
 *
 * Everything here is computed at MODULE SCOPE — these are constants, evaluated
 * once per page load, never per render and never per frame.
 */

/* ── projection ───────────────────────────────────────────────────────────── */

/** SVG user units per millimetre. */
export const PX = 12;
/** Centre of the plate, in user units. */
export const CX = 168;
/** The alveolar crest — the datum everything is measured from — in user units. */
export const CY = 240;

export const VIEW_W = 336;
export const VIEW_H = 456;

/** mm → user units, horizontally (0 = the long axis of the implant). */
const X = (mm: number) => CX + mm * PX;
/** mm → user units, vertically (0 = the bone crest, positive = coronal). */
const Y = (mm: number) => CY - mm * PX;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rounds to 0.01u. SVG path strings are ~40% shorter without the float noise,
 *  and these ship in the HTML on every request. */
const r2 = (n: number) => Math.round(n * 100) / 100;

type Pt = [number, number];

/** Polyline of mm-space points → an SVG path, closed. */
function toPath(points: Pt[], close = true): string {
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const [mx, my] = points[i];
    d += `${i === 0 ? 'M' : 'L'}${r2(X(mx))} ${r2(Y(my))}`;
  }
  return close ? `${d}Z` : d;
}

/**
 * Mirrors a right-hand outline into a closed symmetric silhouette.
 *
 * Every part here is a solid of revolution (or near enough), so only the right
 * profile is authored and the left is its reflection. Authoring both halves by
 * hand is how silhouettes end up subtly asymmetric.
 */
function mirrored(right: Pt[]): string {
  const left: Pt[] = right.map(([mx, my]) => [-mx, my] as Pt).reverse();
  return toPath([...right, ...left]);
}

/* ── fixture ──────────────────────────────────────────────────────────────── */

export const FIXTURE_LENGTH_MM = 10;
const PITCH = 0.8;
const THREAD_DEPTH = 0.4;
const COLLAR = 1.3;
const R_PLATFORM = 2.05;
const R_CORE_TOP = 1.65;
const R_CORE_APEX = 0.95;
const APEX_ZONE = 0.55;

/** Unthreaded core half-width at depth `d` below the platform. */
function fixtureCore(d: number): number {
  if (d <= COLLAR) return R_PLATFORM;
  const t = clamp01((d - COLLAR) / (FIXTURE_LENGTH_MM - APEX_ZONE - COLLAR));
  return lerp(R_CORE_TOP, R_CORE_APEX, t);
}

/**
 * Fixture silhouette, y measured DOWN from the platform (so the mm y-values are
 * negative — the platform seats on the crest at y = 0).
 *
 * The thread is drawn as explicit teeth rather than sampled from a sawtooth
 * function: at 12 units/mm a 0.4 mm thread is under 5 units deep, and sampling
 * rounds the crests off into a wavy edge instead of the crisp asymmetric
 * buttress a real fixture has.
 */
function fixtureOutline(): Pt[] {
  const pts: Pt[] = [];
  pts.push([R_PLATFORM, 0]);
  pts.push([R_PLATFORM, -COLLAR]);

  const lastThread = FIXTURE_LENGTH_MM - APEX_ZONE - 0.35;
  for (let d = COLLAR; d < lastThread; d += PITCH) {
    // Buttress: a shallow leading flank rising to the crest, then a steep
    // trailing flank. Symmetric V-teeth read as a hardware-store bolt.
    const dRoot = d;
    const dRise = Math.min(d + PITCH * 0.42, lastThread);
    const dCrest = Math.min(d + PITCH * 0.58, lastThread);
    pts.push([fixtureCore(dRoot), -dRoot]);
    pts.push([fixtureCore(dRise) + THREAD_DEPTH, -dRise]);
    pts.push([fixtureCore(dCrest) + THREAD_DEPTH, -dCrest]);
  }

  // Apex: a lightly domed disc the width of the apical core, NOT a point. A
  // needle apex is mechanically wrong and reads as a wood screw.
  pts.push([fixtureCore(lastThread), -lastThread]);
  pts.push([R_CORE_APEX, -(FIXTURE_LENGTH_MM - APEX_ZONE)]);
  pts.push([R_CORE_APEX * 0.82, -(FIXTURE_LENGTH_MM - 0.18)]);
  pts.push([R_CORE_APEX * 0.42, -FIXTURE_LENGTH_MM]);
  pts.push([0, -FIXTURE_LENGTH_MM]);
  return pts;
}

export const FIXTURE_PATH = mirrored(fixtureOutline());

/**
 * The internal conical connection, seen on the cut half: an 11° cone descending
 * from the platform into an internal hex, then the threaded bore the abutment
 * screw engages. This is the detail that reads as "engineered component"
 * rather than "peg".
 */
export const FIXTURE_BORE_PATH = mirrored([
  [1.15, 0],
  [1.02, -0.42],
  [0.86, -2.6],
  [0.86, -4.9],
  [0.62, -5.15],
  [0.62, -7.4],
  [0, -7.75],
]);

/* ── abutment ─────────────────────────────────────────────────────────────── */

export const ABUTMENT_HEIGHT_MM = 7;

/**
 * Transmucosal abutment: seats flush on the Ø4.1 platform, flares through the
 * emergence zone, then tapers to a preparation the crown seats onto.
 */
export const ABUTMENT_PATH = mirrored([
  [2.02, 0],
  [2.17, 0.36],
  [2.2, 0.92],
  [2.06, 1.9],
  [1.86, 3.1],
  [1.62, 4.4],
  [1.4, 5.6],
  [1.24, 6.5],
  [1.02, 6.94],
  [0.6, 7.0],
  [0, 7.0],
]);

/** Screw channel through the abutment, plus the screw head seated in it. */
export const ABUTMENT_CHANNEL_PATH = mirrored([
  [0.72, 6.98],
  [0.72, 2.1],
  [0.86, 1.6],
  [0.86, 0],
  [0, 0],
]);

export const ABUTMENT_SCREW_PATH = mirrored([
  [0.78, 1.55],
  [0.78, 1.1],
  [0.5, 0.9],
  [0.5, -4.2],
  [0.62, -4.4],
  [0.62, -7.1],
  [0.4, -7.35],
  [0, -7.4],
]);

/* ── crown ────────────────────────────────────────────────────────────────── */

export const CROWN_SEAT_MM = 4.2;
export const CROWN_HEIGHT_MM = 7.6;

/**
 * Mandibular first molar, buccal aspect.
 *
 * y here is measured from the crown's own cervical margin, so the group only
 * has to be translated to CROWN_SEAT_MM to sit on the abutment.
 *
 * Three things stop this reading as a lozenge: a genuine cervical constriction
 * below the crest of contour, a crest of contour about a third of the way up
 * (the widest point of the crown is NOT at the occlusal table), and an occlusal
 * table with unequal cusps either side of a central fossa.
 */
const CROWN_RIGHT: Pt[] = [
  [4.55, 0], // cervical margin, constricted
  [5.16, 0.7],
  [5.48, 1.75], // crest of contour — the widest point
  [5.44, 2.9],
  [5.22, 4.2],
  [4.86, 5.5],
  [4.5, 6.35], // distal marginal ridge turns over
  [4.06, 6.92],
  [3.34, 7.26],
  [2.62, 7.5], // distobuccal cusp tip
  [2.06, 7.24],
  [1.5, 6.86], // developmental groove drops into the fossa
  [0.86, 6.68],
  [0.28, 6.74],
  [0, 6.9],
];

/**
 * Cusps are deliberately unequal: on a lower first molar the mesiobuccal is the
 * largest and the distal the smallest. A symmetric occlusal table looks
 * manufactured, which is the opposite of what a crown is trying to be.
 */
const CROWN_LEFT: Pt[] = [
  [-0.34, 6.78],
  [-1.04, 6.72],
  [-1.72, 6.98],
  [-2.34, 7.42],
  [-2.96, 7.6], // mesiobuccal cusp tip — tallest
  [-3.62, 7.34],
  [-4.22, 6.88],
  [-4.66, 6.22],
  [-5.02, 5.4],
  [-5.32, 4.15],
  [-5.5, 2.85],
  [-5.5, 1.7],
  [-5.14, 0.66],
  [-4.55, 0],
];

export const CROWN_PATH = toPath([...CROWN_RIGHT, ...CROWN_LEFT]);

/**
 * The seating hollow: an implant crown is cemented or screwed onto a machined
 * abutment, so its underside is a prepared socket, not a root. Drawing a root
 * here would be the single most obvious anatomical error on the plate.
 */
export const CROWN_SOCKET_PATH = mirrored([
  [1.28, 0],
  [1.44, 0.55],
  [1.6, 1.6],
  [1.78, 2.35],
  [1.86, 2.75],
  [0, 2.85],
]);

/**
 * Buccal developmental groove.
 *
 * This is a BUCCAL aspect, so the occlusal fissure pattern is not what you
 * would see — the groove that is visible from the cheek side is the one running
 * down between the two buccal cusps, fading out before the crest of contour.
 * Drawing the occlusal table's Y-pattern here would be the kind of error a
 * dentist spots immediately.
 *
 * Authored in the crown's own space (y = 0 at the cervical margin), like
 * CROWN_PATH — the group transform puts it on the abutment.
 */
export const CROWN_GROOVE_PATH = [
  `M${r2(X(-0.24))} ${r2(Y(6.72))}`,
  `C${r2(X(-0.36))} ${r2(Y(5.9))} ${r2(X(-0.5))} ${r2(Y(5.2))} ${r2(X(-0.44))} ${r2(Y(4.35))}`,
].join('');

/** Marginal ridge shadow on the distal shoulder — one stroke, but it is what
 *  stops the occlusal third reading as a flat card edge. */
export const CROWN_RIDGE_PATH = [
  `M${r2(X(2.62))} ${r2(Y(7.42))}`,
  `Q${r2(X(3.5))} ${r2(Y(7.16))} ${r2(X(4.12))} ${r2(Y(6.78))}`,
].join('');

/* ── alveolar ridge ───────────────────────────────────────────────────────── */

const RIDGE_HALF_BL = 5.6;
const RIDGE_BASE = -18;

/**
 * Buccolingual section of the posterior mandible.
 *
 * The plates are near-vertical and converge into a rounded crest roughly half
 * the width of the base — a ridge is an ARCH, and the previous flat-topped
 * block was the single thing that made the graphic read as a diagram of a
 * butter dish rather than a jaw. It bleeds off both edges of the plate on
 * purpose: this is a section of something larger, not a floating specimen.
 */
export const BONE_PATH = toPath([
  [-14, RIDGE_BASE],
  [-14, -1.6],
  [-9.4, -1.2],
  [-7.3, -0.35],
  [-RIDGE_HALF_BL, 1.1],
  [-4.1, 3.4],
  [-2.5, 4.9],
  [0, 5.35],
  [2.5, 4.88],
  [4.1, 3.35],
  [RIDGE_HALF_BL, 1.05],
  [7.3, -0.4],
  [9.4, -1.25],
  [14, -1.65],
  [14, RIDGE_BASE],
]);

/**
 * The cortical shell. Dense outer plate over a trabecular interior is the whole
 * visual signature of a bone section — a solid fill with noise on it is what
 * made the previous version read as clay.
 */
export const BONE_CORTICAL_PATH = toPath(
  [
    [-14, -1.6],
    [-9.4, -1.2],
    [-7.3, -0.35],
    [-RIDGE_HALF_BL, 1.1],
    [-4.1, 3.4],
    [-2.5, 4.9],
    [0, 5.35],
    [2.5, 4.88],
    [4.1, 3.35],
    [RIDGE_HALF_BL, 1.05],
    [7.3, -0.4],
    [9.4, -1.25],
    [14, -1.65],
  ],
  false,
);

/* ── gingiva ──────────────────────────────────────────────────────────────── */

/**
 * Gingival collar over the crest.
 *
 * The margin is SCALLOPED — it rises interproximally and dips over the
 * emergence — and it sweeps up onto the abutment rather than butting into it,
 * because peri-implant mucosa forms a cuff. A flat pink slab with a hole in it
 * is the thing that reads as plasticine.
 */
export const GUM_PATH = toPath([
  [-14, -1.05],
  [-10.6, -0.5],
  [-8.2, 0.35],
  [-6.4, 1.55],
  [-4.9, 3.15],
  [-3.6, 4.65],
  [-2.75, 5.72], // interdental papilla, riding up
  [-2.2, 6.35],
  [-1.62, 6.05], // dips into the sulcus around the abutment
  [-1.35, 5.05],
  [1.35, 5.05],
  [1.62, 6.05],
  [2.2, 6.35],
  [2.75, 5.72],
  [3.6, 4.65],
  [4.9, 3.15],
  [6.4, 1.55],
  [8.2, 0.35],
  [10.6, -0.5],
  [14, -1.05],
  [14, -1.65],
  [9.4, -1.25],
  [7.3, -0.4],
  [RIDGE_HALF_BL, 1.05],
  [4.1, 3.35],
  [2.5, 4.88],
  [0, 5.35],
  [-2.5, 4.9],
  [-4.1, 3.4],
  [-RIDGE_HALF_BL, 1.1],
  [-7.3, -0.35],
  [-9.4, -1.2],
  [-14, -1.6],
]);

/** The free gingival margin — a stroke, so it can carry its own rim light. */
export const GUM_MARGIN_PATH = toPath(
  [
    [-14, -1.05],
    [-10.6, -0.5],
    [-8.2, 0.35],
    [-6.4, 1.55],
    [-4.9, 3.15],
    [-3.6, 4.65],
    [-2.75, 5.72],
    [-2.2, 6.35],
    [-1.62, 6.05],
    [-1.35, 5.05],
  ],
  false,
);

export const GUM_MARGIN_PATH_R = toPath(
  [
    [1.35, 5.05],
    [1.62, 6.05],
    [2.2, 6.35],
    [2.75, 5.72],
    [3.6, 4.65],
    [4.9, 3.15],
    [6.4, 1.55],
    [8.2, 0.35],
    [10.6, -0.5],
    [14, -1.05],
  ],
  false,
);

/* ── osseointegration ─────────────────────────────────────────────────────── */

/**
 * Bone-to-implant contact, drawn as short struts bridging the thread valleys.
 *
 * Fading the whole bone to translucent — what the WebGL scene does — says
 * "something is happening" but not *what*. Showing new bone actually locking
 * into the threads is the fact the section exists to convey, and it is the one
 * thing a patient asks about.
 */
export const OSSEO_STRUTS: { d: string; delay: number }[] = (() => {
  const out: { d: string; delay: number }[] = [];
  const lastThread = FIXTURE_LENGTH_MM - APEX_ZONE - 0.35;
  let i = 0;
  for (let d = COLLAR + PITCH * 0.5; d < lastThread; d += PITCH) {
    const core = fixtureCore(d);
    const reach = core + THREAD_DEPTH + 0.62;
    // Alternating lengths, and a slight vertical stagger, so the struts read as
    // biology rather than as a comb.
    const wobble = (i % 3) * 0.11;
    for (const sign of [1, -1]) {
      out.push({
        d: toPath(
          [
            [sign * (core + 0.06), -d],
            [sign * (reach - wobble), -(d + 0.24)],
          ],
          false,
        ),
        delay: i,
      });
    }
    i++;
  }
  return out;
})();

export const OSSEO_STRUT_COUNT = Math.max(1, ...OSSEO_STRUTS.map((s) => s.delay + 1));

/* ── annotation anchors ───────────────────────────────────────────────────── */

/**
 * Where each numbered marker sits, and where its leader line touches the part.
 * Order matches the legend in `implantEducation.parts`: crown, abutment,
 * fixture, osseointegration.
 */
export const MARKERS: { x: number; y: number; tx: number; ty: number }[] = [
  { x: X(10.4), y: Y(10.6), tx: X(4.6), ty: Y(9.6) }, // crown
  { x: X(10.4), y: Y(5.2), tx: X(2.1), ty: Y(6.1) }, // abutment
  { x: X(10.4), y: Y(-4.4), tx: X(2.3), ty: Y(-4.4) }, // fixture
  { x: X(-10.4), y: Y(-8.2), tx: X(-3.1), ty: Y(-7.4) }, // osseointegration
];

/** Datum line for the scale annotation, at the crest. */
export const CREST_Y = Y(0);
