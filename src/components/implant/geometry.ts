import * as THREE from 'three';

/**
 * Procedural geometry for the implant assembly.
 *
 * Everything here is modelled in REAL MILLIMETRES against published implant and
 * dental-anatomy dimensions, then scaled once at the scene level. Working in
 * true units is what keeps the proportions honest: a fixture that is visibly
 * the wrong length next to its crown reads as wrong to any dentist, and this is
 * a dental surgeon's own website.
 *
 * Reference dimensions used:
 *   Fixture   Ø4.1 mm platform, Ø3.4 mm apical core, 11.5 mm long,
 *             0.8 mm thread pitch, ~0.35 mm thread depth, 1.3 mm machined collar.
 *   Abutment  conical emergence, ~7 mm from platform to crown margin.
 *   Crown     mandibular first molar: ~11 mm mesiodistal, ~10.5 mm buccolingual,
 *             ~7.5 mm crown height, four principal cusps + distal.
 */

/* ── small math helpers ───────────────────────────────────────────────────── */

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hermite smoothstep between two edges. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Superellipse radius at angle `th` for semi-axes a, b and exponent n.
 * n = 2 is an ellipse; higher n squares the corners off. Molar cross-sections
 * are rounded rectangles, not circles, which is most of why a plain sphere
 * never reads as a tooth.
 */
function superellipse(th: number, a: number, b: number, n: number): number {
  const c = Math.abs(Math.cos(th) / a);
  const s = Math.abs(Math.sin(th) / b);
  return Math.pow(Math.pow(c, n) + Math.pow(s, n), -1 / n);
}

/** Shortest signed angular distance between two angles. */
function angDelta(a: number, b: number): number {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/**
 * Averages the normals of the two coincident seam columns.
 *
 * Duplicating the seam (see {@link gridGeometry}) buys a second texture
 * coordinate, but it costs the seam its shading, and the original comment here
 * had the sign of that backwards. `computeVertexNormals` only ever sees the
 * faces on ONE side of each copy — column 0 collects the quads to its right,
 * column `radial` the quads to its left — so two vertices sitting at the same
 * point to within a float ulp come out carrying different normals. Measured on
 * the fixture that was a 7.7° median and 29° peak discontinuity running the
 * full length of a `metalness: 1` part, which under an environment map is
 * precisely the bright hairline the duplication was meant to prevent.
 *
 * Averaging the two copies gives each of them the normal a shared vertex would
 * have had, and gives up nothing: u stays 0 on one and 1 on the other.
 *
 * One case where this is a VISIBLE change rather than only a fix: the gingiva
 * closes its cross-section at a zero-thickness feather edge, and that fold
 * turns the normal through 143°. It occurs twice — once at the lingual margin,
 * on a column the grid SHARES, and once at the buccal margin, on this seam. So
 * the two identical folds were shading differently, crisp on one side of the
 * mouth and soft on the other, purely as an accident of index topology. They
 * now match. Which of the two is prettier is a separate argument; having them
 * disagree was never defensible.
 *
 * Guarded on the columns actually being coincident, so an open surface — a
 * sector rather than a full revolution — is left alone rather than having its
 * two free edges silently welded.
 */
function weldSeamNormals(
  g: THREE.BufferGeometry,
  cols: number,
  rows: number,
  radial: number,
): void {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  // Everything here is modelled in real millimetres, so a tenth of a micron is
  // far below anything the surface could legitimately vary by.
  const EPS = 1e-4;

  for (let j = 0; j < rows; j++) {
    const a = j * cols;
    const b = a + radial;
    if (
      Math.abs(pos.getX(a) - pos.getX(b)) > EPS ||
      Math.abs(pos.getY(a) - pos.getY(b)) > EPS ||
      Math.abs(pos.getZ(a) - pos.getZ(b)) > EPS
    ) {
      return;
    }
  }

  const n = new THREE.Vector3();
  for (let j = 0; j < rows; j++) {
    const a = j * cols;
    const b = a + radial;
    n.set(
      nrm.getX(a) + nrm.getX(b),
      nrm.getY(a) + nrm.getY(b),
      nrm.getZ(a) + nrm.getZ(b),
    ).normalize();
    nrm.setXYZ(a, n.x, n.y, n.z);
    nrm.setXYZ(b, n.x, n.y, n.z);
  }
}

/**
 * Builds an indexed BufferGeometry from a (radial × axial) parametric grid.
 *
 * The seam column is DUPLICATED (cols = radial + 1) rather than wrapped by
 * index, because sharing the seam ring would force the u texture coordinate to
 * be both 0 and 1 at the same vertex — and both roughness maps are sampled
 * through uv. The shading cost that duplication would otherwise incur is paid
 * back by {@link weldSeamNormals} at the end.
 */
function gridGeometry(
  radial: number,
  axial: number,
  point: (u: number, v: number, out: THREE.Vector3) => void,
  /**
   * Optional per-vertex tint, MULTIPLIED against the material colour.
   *
   * This is how the crown gets its cervical→occlusal layering and the gingiva
   * its vascular depth without a texture, a second material or a custom shader.
   * A zirconia crown that is one flat colour top to bottom is the difference
   * between "tooth" and "white plastic blob", and baking it into the vertices
   * costs literally nothing at render time — no sampler, no fetch, no branch.
   */
  tint?: (u: number, v: number, pos: THREE.Vector3, out: THREE.Color) => void,
): THREE.BufferGeometry {
  const cols = radial + 1;
  const rows = axial + 1;
  const verts = cols * rows;
  const positions = new Float32Array(verts * 3);
  const uvs = new Float32Array(verts * 2);
  const colors = tint ? new Float32Array(verts * 3) : null;
  const v3 = new THREE.Vector3();
  const col = new THREE.Color();

  for (let j = 0; j < rows; j++) {
    const v = j / axial;
    for (let i = 0; i < cols; i++) {
      const u = i / radial;
      point(u, v, v3);
      const k = (j * cols + i) * 3;
      positions[k] = v3.x;
      positions[k + 1] = v3.y;
      positions[k + 2] = v3.z;
      const k2 = (j * cols + i) * 2;
      uvs[k2] = u;
      uvs[k2 + 1] = v;
      if (colors && tint) {
        col.setRGB(1, 1, 1);
        tint(u, v, v3, col);
        colors[k] = col.r;
        colors[k + 1] = col.g;
        colors[k + 2] = col.b;
      }
    }
  }

  /* The index is SIZED UP FRONT, not grown.
     Two triangles per cell is known before the loop starts, and the fixture,
     crown and gingiva between them need ~284,000 indices. Handed to a plain
     array those are 284,000 boxed doubles, a backing store reallocated all the
     way up, and then a full second copy when `setIndex` converts it — which it
     does, into exactly the typed array chosen here. The GPU never saw the
     difference; the main thread did, at the worst possible moment.
     (Uint16 is not an optimisation, it is what `setIndex` would have picked:
     every grid built here stays well under 65,536 vertices. The branch exists
     so a future finer grid degrades instead of silently wrapping.) */
  const index =
    verts > 65535
      ? new Uint32Array(radial * axial * 6)
      : new Uint16Array(radial * axial * 6);
  let n = 0;
  for (let j = 0; j < axial; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      index[n] = a;
      index[n + 1] = c;
      index[n + 2] = b;
      index[n + 3] = b;
      index[n + 4] = c;
      index[n + 5] = d;
      n += 6;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  if (colors) g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeVertexNormals();
  weldSeamNormals(g, cols, rows, radial);
  return g;
}

/* ── implant fixture ──────────────────────────────────────────────────────── */

/**
 * Straumann Bone Level geometry: Ø4.1 mm endosteal, 10 mm long, 0.8 mm pitch,
 * single-start. Chosen because it is the canonical posterior bone-level case
 * and its 12-and-a-bit thread turns are the count a dentist expects to count.
 */
export const FIXTURE_LENGTH = 10;
export const FIXTURE_PLATFORM_R = 2.05;

/**
 * Threaded titanium fixture with a TRUE single-start helical thread.
 *
 * This is the part the previous build got structurally wrong. It used
 * `LatheGeometry` with a sawtooth radius, which produces STACKED RINGS — a
 * series of concentric ridges, not a screw. A lathe revolves one profile about
 * an axis, so by construction every point at a given height has the same
 * radius; a helix requires radius to depend on angle as well as height, which
 * a lathe cannot express at all.
 *
 * The surface here is a helicoid: the thread phase is
 *
 *     phase = (y − pitch · θ/2π) / pitch
 *
 * so following the crest around one full turn advances it exactly one pitch
 * along the axis. That is the definition of a screw thread, and it costs no
 * more than the lathe did.
 */
export function buildFixture(): THREE.BufferGeometry {
  const L = FIXTURE_LENGTH;
  const PITCH = 0.8;
  const DEPTH = 0.4;
  const COLLAR = 1.3; // machined, unthreaded coronal collar
  const R_PLATFORM = FIXTURE_PLATFORM_R;
  // The core and the thread envelope taper at DIFFERENT rates — the core harder
  // than the envelope. That is what gives a modern tapered fixture its wedge
  // with a proud thread crest, instead of the plain cone a single taper gives.
  const R_CORE_TOP = R_PLATFORM - DEPTH; // 1.65
  const R_CORE_APEX = 0.95; // Ø1.9 apical body
  // The apex is a flat/lightly domed disc the width of the apical core, NOT a
  // point. A needle-sharp apex is mechanically wrong and reads as a wood screw.
  const APEX_FLAT_R = 0.95;
  const APEX_DOME = 0.45;

  // ~12.5 turns at 0.8 mm pitch over 10 mm.
  //
  // Sized against the SCREEN, not against the maths. This object renders about
  // 300–500 px tall; at the previous 160 × 300 it was ~96,000 triangles, i.e.
  // one triangle per pixel of height. GPUs rasterise in 2×2 quads, so triangles
  // that small waste most of their fragment shading, and past roughly 2 px per
  // edge extra tessellation stops improving the silhouette at all.
  //
  // 168 axial rows is still 13.4 samples per pitch, which resolves the thread
  // crest (18% of a pitch, so ~2.4 samples across it) without rounding it into
  // a wave. 112 radial keeps a Ø4 mm section visually circular. Result: ~37,600
  // triangles, a 61% cut for no visible change.
  const RADIAL = 112;
  const AXIAL = 168;

  // Where the thread runs out, and where the core flares into the platform.
  // These must NOT overlap: if the core is already flaring while the thread is
  // still at full depth, the two add and the fixture bulges to Ø4.40 just below
  // the collar — wider than its own platform, which is not a shape any implant
  // has. Thread out by 9.75 mm, flare from 9.75 to 10.2 mm.
  const THREAD_OUT_START = L - COLLAR - 0.8; // 9.40
  const THREAD_OUT_END = L - COLLAR - 0.45; // 9.75
  const FLARE_START = THREAD_OUT_END; // 9.75

  /** Unthreaded core radius as a function of height above the apex. */
  const coreRadius = (y: number): number => {
    if (y >= L - COLLAR) return R_PLATFORM;
    const taper = lerp(R_CORE_APEX, R_CORE_TOP, smoothstep(APEX_DOME, L - COLLAR, y));
    const flare = smoothstep(FLARE_START, L - COLLAR, y);
    const body = lerp(taper, R_PLATFORM, flare);
    if (y >= APEX_DOME) return body;
    // Lightly domed apex, reaching Ø1.9 almost immediately so it reads as the
    // flat/gently-domed face a real fixture has rather than a wood-screw point.
    // The exponent still closes the surface at y = 0, so there is no open end.
    const t = y / APEX_DOME;
    return APEX_FLAT_R * Math.pow(t, 0.28);
  };

  /**
   * Thread cross-section, t ∈ [0,1) within one pitch.
   * Asymmetric buttress: a shallow leading flank and a steeper trailing flank,
   * with a small rounded crest. Symmetric V-threads read as a bolt from the
   * hardware store; implant threads are asymmetric because they are cut to
   * resist pull-out.
   */
  const threadProfile = (t: number): number => {
    if (t < 0.34) return smoothstep(0, 0.34, t) * 0.94; // leading flank
    if (t < 0.52) return lerp(0.94, 1, smoothstep(0.34, 0.44, t)); // crest
    return 1 - smoothstep(0.52, 0.94, t); // trailing flank, steeper
  };

  /**
   * TWO apical cutting flutes, 180° apart, running up through the apical ~3 mm
   * (about three thread turns). Straumann specifies two on Ø3.5–5.0 fixtures
   * and four only on the 5.5 and 6.5 mm bodies. They are the detail that most
   * reads as "surgical instrument" rather than "bolt".
   */
  const fluteCut = (y: number, th: number): number => {
    const top = 3.0;
    if (y > top) return 0;
    const a = th + y * 0.18; // flutes spiral slightly coronally
    const lobe = Math.cos(a * 2);
    const width = smoothstep(0.6, 0.99, lobe);
    const fade = 1 - smoothstep(top - 1.4, top, y);
    const apexFade = smoothstep(APEX_DOME * 0.6, APEX_DOME * 2.4, y);
    return width * fade * apexFade;
  };

  /**
   * Microthreads in the coronal collar: ~7 fine retention grooves at 0.25 mm
   * pitch and 0.1 mm depth. Small, but it is the difference between a collar
   * that looks machined and one that looks like an untextured cylinder.
   */
  const microThread = (y: number): number => {
    const base = L - COLLAR;
    if (y < base || y > L - 0.18) return 0;
    const t = ((y - base) / 0.25) % 1;
    const ring = 1 - Math.abs(t * 2 - 1);
    return ring * 0.1 * (1 - smoothstep(L - 0.5, L - 0.18, y));
  };

  return gridGeometry(RADIAL, AXIAL, (u, v, out) => {
    const th = u * TAU;
    const y = v * L;

    const core = coreRadius(y);

    // Threads run from just above the apex to where the core starts to flare.
    const threadFade =
      smoothstep(0.45, 1.5, y) * (1 - smoothstep(THREAD_OUT_START, THREAD_OUT_END, y));

    let r = core;
    if (threadFade > 0) {
      const phase = (y - (th / TAU) * PITCH) / PITCH;
      const t = phase - Math.floor(phase);
      r += DEPTH * threadProfile(t) * threadFade;
    }

    r -= microThread(y);
    r -= fluteCut(y, th) * 0.45;

    out.set(Math.cos(th) * r, y, Math.sin(th) * r);
  });
}

/**
 * NEVER call computeVertexNormals() on a LatheGeometry.
 *
 * LatheGeometry already computes exact analytic normals per meridian
 * (three/src/geometries/LatheGeometry.js). computeVertexNormals() throws those
 * away and replaces them with face-averaged ones, which do not agree across the
 * u-seam where the lathe closes — the result is a visible vertical crease down
 * the length of every turned part. The previous scene did exactly this on both
 * the post and the abutment, and it is a large part of why the metal read as
 * cheap. This helper exists so the mistake is hard to repeat.
 */
function lathe(profile: [number, number][], segments: number): THREE.BufferGeometry {
  return new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

/**
 * Flat annular cap closing the top of the fixture, with the conical internal
 * connection bore. Modelled because the platform is visible in the exploded
 * state, and an open-ended tube shows its backfaces there.
 */
export function buildFixturePlatform(): THREE.BufferGeometry {
  const R = FIXTURE_PLATFORM_R;
  const BORE = 1.15;
  const DEPTH = 2.6;

  return lathe(
    [
      [R, 0],
      [BORE + 0.16, 0],
      // 11° internal cone descending into the fixture.
      [BORE, -0.28],
      [BORE * 0.78, -DEPTH * 0.72],
      [BORE * 0.72, -DEPTH],
      [0, -DEPTH],
    ],
    96,
  );
}

/* ── abutment ─────────────────────────────────────────────────────────────── */

export const ABUTMENT_HEIGHT = 7.0;

/**
 * Transmucosal abutment: conical seat, emergence profile flaring through the
 * gingiva, then a tapered preparation for the crown to seat onto.
 */
export function buildAbutment(): THREE.BufferGeometry {
  /* Emergence profile, rebuilt.
     The old profile peaked at r = 2.20 (Ø4.4) barely 1 mm off the platform and
     then TAPERED for the rest of its height — a narrow post. The crown, whose
     cervix is Ø9, therefore perched on it with a ~3 mm overhang all the way
     round: a full-circumference ridge lap, and the single most obviously wrong
     thing in the assembly to anyone who fits these for a living.

     The governing relation is D(z) = 4.1 + 2·z·tan(EA). Reaching a Ø7.5 finish
     line 3 mm above the platform is a ~29° emergence angle, which is inside the
     ≤30° the peri-implantitis literature associates with healthy tissue.

     Two details that are deliberate, not incidental: the first 0.4 mm is
     CYLINDRICAL (a component at or below the crest should clear the marginal
     bone before it starts to flare), and the flare is CONCAVE rather than
     convex — measured recession is 46.7% for convex profiles against 13.3% for
     concave. Above the finish line at y = 3.0 the profile steps in to form the
     preparation the crown seats over. */
  const profile: [number, number][] = [
    [0, -2.55],
    [0.8, -2.55],
    [0.84, -2.3],
    [1.12, -0.3],
    [1.16, -0.05],
    [2.05, 0], // seats flush on the Ø4.1 platform
    [2.08, 0.4], // cylindrical through the crestal zone
    [2.3, 1.0],
    [2.62, 1.8],
    [2.95, 2.5],
    [3.05, 3.0], // finish line — the crown margin lands here
    [2.55, 3.5], // step in: preparation for the crown
    [2.25, 4.4],
    [1.95, 5.4],
    [1.62, 6.3],
    [1.25, 6.85],
    [0.7, 7.0],
    [0, 7.0],
  ];

  return lathe(profile, 112);
}

/** The abutment screw, visible only in the exploded state. */
export function buildAbutmentScrew(): THREE.BufferGeometry {
  return lathe(
    [
      [0, 0],
      [0.78, 0],
      [0.78, 0.42],
      [0.5, 0.55],
      [0.5, 3.4],
      [0.62, 3.4],
      [0.62, 5.6],
      [0.42, 5.9],
      [0, 5.95],
    ],
    64,
  );
}

/* ── crown ────────────────────────────────────────────────────────────────── */

export const CROWN_HEIGHT = 7.6;

/**
 * Mandibular first molar crown.
 *
 * Built as a closed parametric surface rather than a displaced sphere. Three
 * things do the work that a sphere cannot:
 *
 *  1. A SUPERELLIPSE cross-section (n ≈ 2.7). Molars are rounded rectangles in
 *     section; a circular section is the single strongest "this is a blob"
 *     signal.
 *  2. A crest-of-contour bulge about a third of the way up, with a genuine
 *     cervical constriction below it, so the crown has a waist where it meets
 *     the abutment.
 *  3. An occlusal field of four principal cusps plus a smaller distal cusp,
 *     separated by developmental grooves and dropping into a central fossa.
 *
 * Cusp heights are deliberately unequal — a perfectly symmetric occlusal table
 * looks manufactured, which is the opposite of what a crown is trying to be.
 */
export function buildCrown(): THREE.BufferGeometry {
  // CROWN_HEIGHT is the finished total, cusp tip to cervical margin. The
  // lateral surface only carries part of it — the cusps add the rest — so the
  // base sweep stops short and the relief makes up the difference. Driving the
  // base sweep to the full height instead put the cusp tips at ~9 mm, a molar
  // half again as tall as any real one.
  const BASE_H = 6.5;
  const RELIEF = 1.05;

  /* Semi-axes are ASYMMETRIC. Wheeler: "the mesial and distal sides converge
     lingually" and the crown "converges toward the distal". A symmetric
     superellipse cannot express either, and the occlusal outline of a lower
     first molar is a pentagon, not a rounded rectangle.
     θ = 0 mesial (+x), π/2 buccal (+z), π distal, 3π/2 lingual. */
  const A_MESIAL = 5.8;
  const A_DISTAL = 5.2; // 11.0 mm total MD — Wheeler Table 12-1
  const B_BUCCAL = 5.5;
  const B_LINGUAL = 5.0; // 10.5 mm total BL

  /* Cervical constriction is anisotropic too: Wheeler's cervix is 9.0 mm in
     BOTH directions, so the ratio differs by axis — 9.0/11.0 mesiodistally
     against 9.0/10.5 buccolingually. The previous single 0.82 made the crown
     0.39 mm too narrow across the cheek-to-tongue axis. */
  const K_CERV_MD = 9.0 / 11.0; // 0.818
  const K_CERV_BL = 9.0 / 10.5; // 0.857

  // See the note on the fixture's tessellation: sized against the pixels this
  // renders into, not against the parametric detail available. 128 × 132 is
  // ~33,800 triangles for a crown ~120 px tall.
  const RADIAL = 128;
  const AXIAL = 132;

  // Cusp centres, in radians about the crown's vertical axis, with relative
  // height and angular spread. Mesiobuccal is the tallest on a lower molar.
  // Angles: 0 = mesial, π/2 = buccal, π = distal, 3π/2 = lingual.
  //
  // Heights follow the real size order — mesiobuccal largest, then
  // mesiolingual, distobuccal, distolingual, with the distal cusp smallest.
  // Sigma encodes cusp SHAPE, which is a separate property from size: lingual
  // cusps are pointed (ridges meeting at ~100°), buccal cusps are flatter and
  // lower. A perfectly symmetric occlusal table looks manufactured, which is
  // the opposite of what a crown is trying to be.
  /* SIZE and HEIGHT are different properties, and conflating them was an
     outright error here. Wheeler is explicit on both:
       width  (mesiodistal on the table):  MB ≥ DB > ML > DL > D
       height (occlusal elevation):        ML > DL > MB > DB > D
     — "the lingual cusps are pointed, and the cusp ridges are high enough to
     hide the two buccal cusps from view", and the mesiolingual tip is "somewhat
     higher" than the distolingual.

     So the MESIOLINGUAL cusp is the tallest on a mandibular first molar, not
     the mesiobuccal. `h` drives relief height and `sigma` drives angular width,
     so the old table had the tallest cusp on the wrong side of the tooth.

     Angles are derived from the pentagonal occlusal outline (three buccal
     cusps, two lingual) and cross-checked against the groove rays below — no
     published angular dataset for molar cusps exists. */
  const CUSPS: { th: number; h: number; sigma: number }[] = [
    { th: Math.PI * 0.306, h: 0.78, sigma: 0.56 }, // mesiobuccal  — widest
    { th: Math.PI * 0.667, h: 0.72, sigma: 0.52 }, // distobuccal
    { th: Math.PI * 0.917, h: 0.45, sigma: 0.3 }, // distal (hypoconulid)
    { th: Math.PI * 1.278, h: 0.92, sigma: 0.42 }, // distolingual — pointed
    { th: Math.PI * 1.694, h: 1.0, sigma: 0.46 }, // mesiolingual — TALLEST
  ];

  /** Occlusal relief at azimuth `th`, normalised roughly to [0,1]. */
  const cuspField = (th: number): number => {
    let h = 0;
    for (const c of CUSPS) {
      const d = angDelta(th, c.th);
      h += c.h * Math.exp(-(d * d) / (2 * c.sigma * c.sigma));
    }
    return h;
  };

  /**
   * Developmental grooves. The central groove runs mesiodistally; the buccal
   * and lingual grooves branch off it. Subtracting narrow troughs is what makes
   * the occlusal table read as chewing surface rather than a lumpy dome.
   */
  /**
   * Developmental grooves — FIVE rays, not four, in the Y5 (Dryopithecus)
   * pattern that 65–82% of mandibular first molars have.
   *
   * Two things were wrong before. First, the distobuccal groove was simply
   * missing, and the groove that stood at 0.9π sat almost exactly where the
   * distal cusp tip belongs (0.917π) — so the fifth cusp was being planed flat
   * by its own neighbouring groove, which is most of why the occlusal table
   * read as lumpy rather than cusped.
   *
   * Second, depth was a function of azimuth ALONE and was applied at full
   * strength right out to the rim, so the deepest ray sawed straight through
   * the mesial marginal ridge — a continuous raised ridge on any real molar,
   * and one of the strongest "this is a tooth" cues there is. The two arms of
   * the central groove now die out in the triangular fossae, while only the
   * mesiobuccal, distobuccal and lingual grooves are allowed to cross the
   * margin onto the axial surface, which is what they do in life.
   */
  const grooveCut = (th: number, v: number): number => {
    const groove = (at: number, width: number, depth: number) => {
      const d = Math.abs(angDelta(th, at));
      return depth * (1 - smoothstep(0, width, d));
    };
    // Confined to the central table: dies before it reaches the marginal ridge.
    const inner = smoothstep(0.86, 0.965, v);
    // Runs over the rim and down the axial surface.
    const crossing = smoothstep(0.7, 0.9, v);

    const central =
      groove(0, 0.26, 0.62) + // central groove, mesial arm
      groove(Math.PI * 1.094, 0.22, 0.55); // central groove, distal arm
    const radial =
      groove(Math.PI * 0.489, 0.22, 0.58) + // mesiobuccal
      groove(Math.PI * 0.789, 0.2, 0.52) + // distobuccal — was missing
      groove(Math.PI * 1.483, 0.18, 0.42); // lingual, and it is short

    return central * inner + radial * crossing;
  };

  return gridGeometry(RADIAL, AXIAL, (u, v, out) => {
    const th = u * TAU;

    // --- vertical profile -------------------------------------------------
    // v = 0 at the cervical margin, v = 1 at the occlusal pole.
    // Height eases out so the top flattens into an occlusal table instead of
    // converging to a point.
    const yBase = BASE_H * (1 - Math.pow(1 - v, 2.1));

    // --- horizontal scale -------------------------------------------------
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);

    /* Crest of contour, per azimuth.
       Every tooth in the mouth carries its facial height of contour in the
       cervical third EXCEPT the mandibular molars, which carry it at the
       junction of the cervical and middle thirds — v ≈ 0.33. Posterior teeth
       carry the LINGUAL height of contour in the middle third, v ≈ 0.52. A
       single crest for all azimuths put the lingual bulge 0.18 too low. */
    const lingual = Math.max(0, -sinT);
    const crestV = lerp(0.33, 0.52, lingual);

    /* Cervical constriction and occlusal convergence, both per azimuth. */
    const kCerv = lerp(K_CERV_MD, K_CERV_BL, sinT * sinT);
    /* The occlusal table is strongly anisotropic: the marginal ridges sit near
       the full mesiodistal width while both axial walls converge hard
       buccolingually, giving ~9.0 mm MD against ~6.3 mm BL. The previous
       isotropic 0.72 made a table that was far too wide across the cheek axis,
       which flattens the cusps into a plateau. */
    const kTable = lerp(0.82, 0.6, sinT * sinT);

    let k: number;
    if (v < crestV) {
      k = lerp(kCerv, 1.0, smoothstep(0, crestV, v));
    } else {
      k = lerp(1.0, kTable, smoothstep(crestV, 0.92, v));
    }

    /* Emergence profile.
       The crown used to open to nearly full cervical width within 0.035 of the
       pole, so it sat on the abutment as a ~3 mm shelf all the way round — a
       full-circumference ridge lap, and the single most obviously wrong thing
       about the assembly to anyone who fits these for a living. It now runs
       down to a narrow collar that meets the abutment, with a CONCAVE profile
       (exponent > 1, so it leaves the collar slowly and flares late), which is
       both what the contemporary literature recommends and what removes the
       shelf. */
    // 0.64 is not arbitrary: the crown's widest cervical radius is ~4.74 mm, so
    // 0.64 puts its margin at ~3.05 mm — exactly the abutment's finish line, so
    // the two meet edge to edge instead of the crown overhanging it.
    const emergence = lerp(0.64, 1, Math.pow(smoothstep(0, 0.3, v), 1.3));
    const capBottom = smoothstep(0, 0.012, v);
    const capTop = 1 - smoothstep(0.955, 1, v);
    k *= emergence * capBottom * capTop;

    // Asymmetric semi-axes: converges distally and lingually.
    const a = cosT >= 0 ? A_MESIAL : A_DISTAL;
    const b = sinT >= 0 ? B_BUCCAL : B_LINGUAL;
    const rad = superellipse(th, a, b, 2.7) * k;

    // --- occlusal relief --------------------------------------------------
    // Only applies near the top; peaks just inside the marginal ridge.
    const occl = smoothstep(0.6, 0.93, v) * (1 - smoothstep(0.93, 1, v) * 0.35);
    const relief = cuspField(th) * occl - grooveCut(th, v);

    // The pole itself sits BELOW the cusp tips — that dip is the central fossa.
    const fossa = -0.55 * smoothstep(0.9, 1, v);

    const y = yBase + relief * RELIEF + fossa;

    out.set(Math.cos(th) * rad, y, Math.sin(th) * rad);
  },
  /**
   * Multilayer shade gradient, baked per vertex.
   *
   * A real crown is not one colour. The cervical third is warmer, more
   * saturated and more opaque — it sits against the gingiva and has to carry
   * the root shade; the occlusal third is greyer, cooler and more translucent,
   * because that is where enamel would be. Ceramists build this deliberately,
   * and its absence is most of why a rendered crown reads as a plastic blob.
   *
   * These multiply the material colour, so they stay close to 1 — this is a
   * shade modulation, not a paint job.
   */
  (u, v, _pos, out) => {
    const th = u * TAU;
    // Cervical warmth fades out by the crest of contour; occlusal cool comes
    // in over the top third.
    const cervical = 1 - smoothstep(0.02, 0.42, v);
    const occlusal = smoothstep(0.58, 0.96, v);

    let r = 1 + cervical * 0.035 - occlusal * 0.045;
    let g = 1 - cervical * 0.012 - occlusal * 0.03;
    let b = 1 - cervical * 0.075 - occlusal * 0.004;

    // Fissures pick up a little extrinsic stain — the faint brown line every
    // real molar has in its grooves. Only on the occlusal table, only where a
    // groove actually is.
    const stain = Math.min(1, grooveCut(th, v) / 0.62) * smoothstep(0.72, 0.95, v);
    r -= stain * 0.06;
    g -= stain * 0.085;
    b -= stain * 0.105;

    out.setRGB(r, g, b);
  });
}

/* ── bone and gingiva ─────────────────────────────────────────────────────── */

/* ── ridge cross-section, shared by bone and gingiva ──────────────────────── */

export const RIDGE_CREST_Y = 5.9;
/**
 * Mesiodistal extent of the section, and half its buccolingual width.
 *
 * Kept deliberately short. A 22 × 15 mm block viewed from three-quarters reads
 * as a block no matter how well the arch is modelled — the arch is only legible
 * near the cut ends. 15 mm long by 11.2 mm wide is both anatomically right for
 * a posterior mandible and short enough that the ridge profile stays readable.
 */
export const RIDGE_LENGTH = 20;
/**
 * The section runs off the bottom of frame on purpose.
 *
 * At −8 the block had a visible floor, and a slab with a floor and a peaked top
 * reads as a house — which is exactly what it looked like. Real mandibular body
 * height at the molar is 26–28 mm; taking the base well below the framing says
 * "this is a section of something larger" instead of "this is a small object",
 * for no extra triangles that are ever on screen.
 */
const RIDGE_BASE_Y = -13;
const RIDGE_HALF_BL = 5.6;
/** Basal bone is wider than the crest: ~12.6 mm vs ~11.3 mm at M1 (Zhang 2021,
 *  Alqutaibi 2024). The plates were previously parallel, which is most of why
 *  the silhouette read as extruded rather than anatomical. */
const RIDGE_BASE_FLARE = 1.14;

/**
 * Buccolingual cross-section of the alveolar ridge, as (z, y).
 *
 * `t` runs 0 → 1 from the buccal base, up the buccal plate, over the crest, and
 * down the lingual plate to the lingual base.
 *
 * This is the shape the previous build got wrong. It swept a superellipse of
 * revolution, which can only ever produce a block — and a beige block with a
 * pink lid reads as a butter dish, not a jaw. A ridge is an ARCH SWEPT ALONG
 * THE JAW: near-vertical cortical plates that converge into a rounded crest,
 * roughly half as wide at the top as at the base.
 */
function ridgeSection(t: number): [number, number] {
  // Symmetric about t = 0.5. Work on the buccal half and mirror.
  const s = t <= 0.5 ? t * 2 : (1 - t) * 2; // 0 at base, 1 at crest
  const sign = t <= 0.5 ? -1 : 1;

  let z: number;
  let y: number;

  const SHOULDER_Y = 1.2;

  if (s < 0.45) {
    // Cortical plate, tapering inward as it rises: basal bone measures ~12.6 mm
    // against ~11.3 mm at the crest. The plates used to be parallel, which is
    // what made the silhouette read as extruded rather than anatomical.
    const k = s / 0.45;
    z = RIDGE_HALF_BL * lerp(RIDGE_BASE_FLARE, 1, smoothstep(0, 1, k));
    y = lerp(RIDGE_BASE_Y, SHOULDER_Y, k);
  } else {
    // Crest arch as a SUPERELLIPSE (n = 2.6) — a rounded plateau, not a peak.
    // The previous quarter-sine drove the width linearly to zero, producing a
    // knife-edge ridge; combined with straight plates and a flat floor, the
    // whole block read as a house with a pitched roof. A real posterior crest
    // is a flat-topped arch a good 6–8 mm across.
    const k = (s - 0.45) / 0.55;
    const th = (k * Math.PI) / 2;
    // n = 2.2, only slightly flattened from a true ellipse. At 2.6 the top went
    // so flat that the block came back as a rectangular slab — the opposite
    // failure from the knife edge it replaced. A posterior crest is a dome with
    // a softened top, not a table.
    const e = 2 / 2.2;
    z = RIDGE_HALF_BL * Math.pow(Math.cos(th), e);
    y = SHOULDER_Y + (RIDGE_CREST_Y - SHOULDER_Y) * Math.pow(Math.sin(th), e);
  }

  return [z * sign, y];
}

/**
 * Outward unit normal of the ridge section at parameter `t`, as (nz, ny).
 *
 * Finite-differenced rather than derived analytically: `ridgeSection` is
 * piecewise, so a closed-form derivative would need a second definition to be
 * kept in sync with it — and the two silently disagreeing at the piece boundary
 * is exactly the sort of bug that shows up as a crease and takes an hour to
 * find. The sign is resolved by pushing away from the section's interior.
 */
function ridgeNormal(t: number): [number, number] {
  const h = 0.002;
  const [z0, y0] = ridgeSection(Math.max(0, t - h));
  const [z1, y1] = ridgeSection(Math.min(1, t + h));
  const dz = z1 - z0;
  const dy = y1 - y0;
  const len = Math.hypot(dz, dy) || 1;
  // Rotate the tangent a quarter turn, then orient it outward.
  let nz = dy / len;
  let ny = -dz / len;
  const [pz, py] = ridgeSection(t);
  if (nz * pz + ny * (py - 1.2) < 0) {
    nz = -nz;
    ny = -ny;
  }
  return [nz, ny];
}

/**
 * A section of alveolar ridge: cortical plates converging into a crest, swept
 * mesiodistally, with a stable surface irregularity so it reads as bone rather
 * than as a machined part.
 */
export function buildBoneRidge(): THREE.BufferGeometry {
  /** Stable pseudo-noise — bone is not extruded plastic. */
  const bump = (x: number, z: number, y: number): number =>
    0.19 * Math.sin(x * 0.85 + 0.4) * Math.cos(z * 1.05) +
    0.11 * Math.sin(x * 2.15 - 1.1) * Math.sin(z * 1.85 + 0.6) +
    0.06 * Math.cos(x * 4.3 + 2.0) * Math.cos(y * 1.3);

  // EXTRUDED, not swept as an open grid.
  //
  // The swept version was an open shell: no bottom, no end caps. Rendered
  // DoubleSide you could see straight into it, and at three-quarters it read as
  // a draped sheet rather than a block of bone. ExtrudeGeometry closes the
  // profile and caps both ends for free, which is exactly what a SECTION of
  // ridge needs — flat cut faces at the mesial and distal ends.
  /* Tessellation, and what `steps` actually buys.
     It is tempting to read this as a constant cross-section extruded along a
     straight axis and conclude that `steps` is free to collapse. It is not,
     for two reasons that only show up downstream: the displacement pass below
     is a function of x, so `steps` is what samples the surface noise ALONG the
     jaw; and ExtrudeGeometry emits non-indexed triangles, so the
     computeVertexNormals at the end leaves this mesh flat shaded and every
     step boundary is a facet edge you can see.

     128 × 40 was 12,122 triangles in 36,366 non-indexed vertices — 1.16 MB,
     the largest buffer in the scene by a wide margin, and 11% of every frame's
     triangles in both the main and the shadow pass. 88 × 30 is 6,582 triangles
     in 632 KB, for a 1.44× facet around the section and 1.33× along the jaw,
     neither of which resolves at the ~20 px/mm this renders at.

     Cutting `steps` to 14, as was proposed, is where it stops being free: at
     1.43 mm spacing the 2.15 and 4.3 rad/mm octaves of `bump` both fall below
     Nyquist, the grain collapses into a slow beat, and the ridge goes back to
     reading as the moulded plastic the noise exists to avoid. */
  const N = 88;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const [z, y] = ridgeSection(i / N);
    pts.push(new THREE.Vector2(z, y));
  }
  const shape = new THREE.Shape(pts); // auto-closes across the base

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: RIDGE_LENGTH,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.18,
    bevelSegments: 3,
    // Inert for a Shape built from straight segments — Path.getPoints gives a
    // LineCurve exactly one division regardless — but left as the record of
    // what the profile is meant to be if it ever gains a curve.
    curveSegments: 1,
    steps: 30,
  });

  // Shape space is (z_anat, y_anat) extruded along +z. Rotate so the extrusion
  // runs mesiodistally, then centre it.
  g.rotateY(-Math.PI / 2);
  g.translate(RIDGE_LENGTH / 2, 0, 0);

  // Surface irregularity, faded out near the cut ends (which must stay flat —
  // they are a section) and near the crest (which must stay clean for the
  // osteotomy).
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const endFade = smoothstep(0, 1.1, RIDGE_LENGTH / 2 - Math.abs(x));
    const crestFade = 1 - smoothstep(RIDGE_CREST_Y - 3.2, RIDGE_CREST_Y, y);
    const n = bump(x, z, y) * endFade * crestFade;
    pos.setXYZ(i, x, y + n * 0.4, z + n);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/**
 * Gingival collar following the ridge crest, with interdental papillae.
 *
 * A flat slab of pink reads as plasticine. Two things make it read as gum: it
 * FOLLOWS the crest arch instead of capping it as a disc, and its margin is
 * scalloped — papillae rise between adjacent teeth and dip over each root.
 */
export function buildGingiva(): THREE.BufferGeometry {
  const ALONG = 104;
  const AROUND = 112;
  const THICK = 1.45;

  /** Radius of the peri-implant cuff, and how far the tissue funnels down into
   *  it. The abutment is Ø4.4 at its widest, so the cuff has to start outside
   *  that or the tissue simply intersects the metal. */
  const CUFF_R = 2.45;
  const CUFF_FALLOFF = 2.1;
  const SULCUS_DEPTH = 1.9;

  // u traces a CLOSED cross-section: the outer mucosal surface on the way out,
  // then back along the bone on the way in. A single open sheet has no
  // thickness, so wherever the cutaway plane crosses it you see a zero-width
  // edge and the gingiva reads as pink cellophane laid over the ridge.
  return gridGeometry(AROUND, ALONG, (u, v, out) => {
    const loop = u * 2;
    const outbound = loop <= 1;
    const k = outbound ? loop : 2 - loop;

    // Cover t ∈ [0.26, 0.74] of the ridge section — the crest and about 3 mm
    // down each plate, which is where attached gingiva actually is. Covering
    // the FULL section left a surface coincident with the bone down to the
    // base (z-fighting); covering [0.20, 0.80] draped ~6 mm down the plates and
    // hid the ridge arch behind a pink plate.
    const [z0, y0] = ridgeSection(0.26 + k * 0.48);
    const x = (v - 0.5) * RIDGE_LENGTH;

    // Feather the margin to nothing so the shell closes onto the bone instead
    // of ending in a visible lip, and pinch the thickness to zero at the two
    // cut ends so the shell is CLOSED there too — otherwise the outbound and
    // return surfaces leave an open mouth at x = ±L/2.
    const endCap = smoothstep(0, 0.05, v) * (1 - smoothstep(0.95, 1, v));
    const t = outbound ? THICK * Math.pow(Math.sin(k * Math.PI), 0.6) * endCap : 0;

    // Papillae: mean interproximal soft tissue sits ~3.85 mm above the crest,
    // so the scallop is a real anatomical feature, not decoration.
    //
    // The `+ PI` phase shift is load-bearing and was missing. Without it the
    // cosine peaks at x = 0 — which is exactly where the implant emerges — so
    // the tissue reared up into a mound at the one place it has to dip, and the
    // abutment came through the top of a hillock. Papillae belong BETWEEN
    // teeth; the margin dips over each emergence. Shifted, the peaks land at
    // x = ±5 mm (the adjacent contact points) and x = 0 is a trough.
    const crestness = Math.pow(Math.sin(k * Math.PI), 2);
    // Amplitude raised from 1.15. Measured papilla height above the
    // interproximal crest is 3.85 ± 1.04 mm implant-to-tooth and 5.1 ± 0.6
    // tooth-to-tooth, so 1.15 was three to four times too short and the
    // scallop barely registered. Held at 2.4 rather than the full measured
    // figure because every published dataset is ANTERIOR — the osseous scallop
    // flattens progressively toward the back of the mouth, and no
    // molar-specific measurement exists.
    const papilla = outbound
      ? 2.4 *
        // Two cycles over 20 mm — a 10 mm period, which is one molar-to-molar
        // contact spacing, so the papillae land where adjacent teeth would be.
        Math.pow(Math.max(0, Math.cos((x / RIDGE_LENGTH) * TAU * 2 + Math.PI)), 3) *
        crestness *
        endCap
      : 0;

    /* Thickness is applied along the SECTION NORMAL, not split into y and z.
       The previous version displaced by `t * 0.5` vertically and scaled z by
       `1 + t / halfWidth` — but at the crest z0 is ~0, so the horizontal term
       vanished and the tissue ended up 0.72 mm thick exactly where it should be
       thickest. Mucosa over a crest measures 1.4–1.6 mm; it was rendering at
       half that, which is why it read as a torn ribbon rather than as tissue. */
    const [nz, ny] = ridgeNormal(0.26 + k * 0.48);
    const z = z0 + nz * t;

    /* Supracrestal height.
       The free gingival margin does not sit ON the bone crest — it sits about
       3 mm above it (Gargiulo 1961: 3.05 mm buccal, 2.65 lingual, and
       peri-implant mucosa runs roughly 1 mm taller again because its
       junctional epithelium is twice as deep). Modelled here rather than as a
       mesh offset so only the OUTER surface rises and the inner surface stays
       on the bone — which is what gives the tissue real thickness instead of
       making it a rigid shell held above the ridge. */
    const supracrestal = outbound ? 2.0 * crestness * endCap : 0;

    // Peri-implant cuff. Soft tissue does not butt flat against an abutment —
    // it funnels down into a sulcus around it. Without this the abutment simply
    // intersected the gingival surface along a hard line, which is the single
    // most artificial-looking junction in the whole assembly.
    const axial = Math.hypot(x, z);
    const cuff = 1 - smoothstep(CUFF_R, CUFF_R + CUFF_FALLOFF, axial);
    const sulcus = SULCUS_DEPTH * cuff * cuff * crestness * endCap;

    out.set(x, y0 + ny * t + supracrestal + papilla - sulcus, z);
  },
  /**
   * Vascular depth, baked per vertex — a free stand-in for subsurface
   * scattering.
   *
   * Gingiva is thin and richly perfused, so it goes DARKER and more saturated
   * where it is thick or shadowed (deep in the sulcus, down the plates) and
   * paler where it thins to an edge (the free margin, the papilla tips), which
   * is where light actually passes through it. A single flat pink is why most
   * dental illustration tissue reads as plasticine.
   */
  (u, v, pos, out) => {
    const loop = u * 2;
    const outbound = loop <= 1;
    const k = outbound ? loop : 2 - loop;
    const thinness = Math.pow(Math.sin(k * Math.PI), 0.6);

    // Deep in the cuff the tissue is in its own shadow and reads arterial.
    const axial = Math.hypot(pos.x, pos.z);
    const cuff = 1 - smoothstep(CUFF_R, CUFF_R + CUFF_FALLOFF, axial);

    const pale = Math.pow(thinness, 2.2) * 0.16;
    const deep = (1 - thinness) * 0.22 + cuff * 0.2;

    out.setRGB(
      1 + pale * 0.55 - deep * 0.24,
      1 + pale * 0.3 - deep * 0.5,
      1 + pale * 0.26 - deep * 0.52,
    );
  });
}

/**
 * Circumferential tool-mark roughness for turned and blasted parts.
 *
 * A single scalar roughness is the most reliable "this is CG" tell there is:
 * real surfaces vary, and that variation is what breaks up a reflection into
 * something the eye reads as material rather than as shading. Every part here
 * was previously one flat number.
 *
 * The texture is one pixel wide. Both the lathe and the parametric grid run `u`
 * AROUND the axis and `v` ALONG it, so a map that varies only in v produces
 * bands that circle the part — which is exactly what a lathe tool leaves, and
 * what acid-etching leaves on a blasted fixture. Sampling it across u would
 * give vertical streaks, which is the wrong machining process entirely.
 *
 * Generated on a canvas, so there is no network request for the CSP to block.
 *
 * @param min   roughness multiplier in the smoothest bands
 * @param tiles how many times to repeat along the axis — higher is finer marks
 */
export function buildTurnedRoughness(min: number, tiles: number): THREE.CanvasTexture {
  const H = 512;
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(1, H);

  // Three octaves of value noise. Deterministic — a hash of the row index, not
  // Math.random(), so the same build always produces the same surface.
  const hash = (n: number) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return lerp(hash(i), hash(i + 1), s);
  };

  for (let y = 0; y < H; y++) {
    const t = (y / H) * 40;
    const n = noise(t) * 0.55 + noise(t * 2.7 + 11) * 0.3 + noise(t * 6.3 + 29) * 0.15;
    const value = lerp(min, 1, n);
    const byte = Math.round(clamp01(value) * 255);
    const k = y * 4;
    img.data[k] = byte;
    img.data[k + 1] = byte;
    img.data[k + 2] = byte;
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, tiles);
  // A roughness map is DATA, not colour — tagging it sRGB would apply a
  // transfer function to a physical quantity and quietly skew every highlight.
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

