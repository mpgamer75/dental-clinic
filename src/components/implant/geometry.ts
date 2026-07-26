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
 * Builds an indexed BufferGeometry from a (radial × axial) parametric grid.
 *
 * The seam column is DUPLICATED (cols = radial + 1) rather than wrapped by
 * index. Sharing the seam ring would force the u texture coordinate to be both
 * 0 and 1 at the same vertex, and — more visibly here — would average the
 * normals across the seam of a thread crest, producing a bright hairline down
 * the length of the screw.
 */
function gridGeometry(
  radial: number,
  axial: number,
  point: (u: number, v: number, out: THREE.Vector3) => void,
): THREE.BufferGeometry {
  const cols = radial + 1;
  const rows = axial + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const v3 = new THREE.Vector3();

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
    }
  }

  const index: number[] = [];
  for (let j = 0; j < axial; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
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

  // ~12.5 turns at 0.8 mm pitch over 10 mm. ~24 samples per pitch resolves the
  // crest without faceting; 160 radial segments keeps the section circular.
  const RADIAL = 160;
  const AXIAL = 300;

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
  const profile: [number, number][] = [
    [0, -2.55],
    [0.8, -2.55],
    [0.84, -2.3],
    [1.12, -0.3],
    [1.16, -0.05],
    [2.02, 0], // seats flush on the Ø4.1 platform
    [2.16, 0.35], // emergence flare
    [2.2, 0.9],
    [2.06, 1.9],
    [1.86, 3.1],
    [1.62, 4.4],
    [1.4, 5.6],
    [1.24, 6.5],
    [1.05, 6.95],
    [0.62, 7.0],
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
  const MD = 5.5; // mesiodistal semi-axis (~11 mm total)
  const BL = 5.25; // buccolingual semi-axis (~10.5 mm total)

  const RADIAL = 176;
  const AXIAL = 190;

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
  const CUSPS: { th: number; h: number; sigma: number }[] = [
    { th: Math.PI * 0.25, h: 1.0, sigma: 0.55 }, // mesiobuccal  — largest, flat
    { th: Math.PI * 0.78, h: 0.86, sigma: 0.55 }, // distobuccal  — flat
    { th: Math.PI * 1.02, h: 0.5, sigma: 0.3 }, // distal (5th) — smallest
    { th: Math.PI * 1.26, h: 0.8, sigma: 0.44 }, // distolingual — pointed
    { th: Math.PI * 1.75, h: 0.94, sigma: 0.44 }, // mesiolingual — pointed
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
  const grooveCut = (th: number): number => {
    const groove = (at: number, width: number, depth: number) => {
      const d = Math.abs(angDelta(th, at));
      return depth * (1 - smoothstep(0, width, d));
    };
    return (
      groove(0, 0.3, 0.72) + // mesial extent of the central groove
      groove(Math.PI * 0.9, 0.22, 0.6) + // distal extent
      groove(Math.PI * 0.5, 0.22, 0.5) + // buccal groove
      groove(Math.PI * 1.5, 0.22, 0.46) // lingual groove
    );
  };

  return gridGeometry(RADIAL, AXIAL, (u, v, out) => {
    const th = u * TAU;

    // --- vertical profile -------------------------------------------------
    // v = 0 at the cervical margin, v = 1 at the occlusal pole.
    // Height eases out so the top flattens into an occlusal table instead of
    // converging to a point.
    const yBase = BASE_H * (1 - Math.pow(1 - v, 2.1));

    // --- horizontal scale -------------------------------------------------
    // Cervical constriction → crest of contour at v ≈ 0.34 → converge to the
    // occlusal table. The final term closes the surface at both poles.
    let k: number;
    if (v < 0.34) {
      // Rise from the cervical margin to the widest point.
      k = lerp(0.82, 1.0, smoothstep(0, 0.34, v));
    } else {
      // Converge toward the occlusal table, which is ~72% of the max width.
      k = lerp(1.0, 0.72, smoothstep(0.34, 0.92, v));
    }
    // Close the poles.
    const capBottom = smoothstep(0, 0.035, v);
    const capTop = 1 - smoothstep(0.955, 1, v);
    k *= capBottom * capTop;

    const rad = superellipse(th, MD, BL, 2.7) * k;

    // --- occlusal relief --------------------------------------------------
    // Only applies near the top; peaks just inside the marginal ridge.
    const occl = smoothstep(0.6, 0.93, v) * (1 - smoothstep(0.93, 1, v) * 0.35);
    const relief = (cuspField(th) - grooveCut(th)) * occl;

    // The pole itself sits BELOW the cusp tips — that dip is the central fossa.
    const fossa = -0.55 * smoothstep(0.9, 1, v);

    const y = yBase + relief * RELIEF + fossa;

    out.set(Math.cos(th) * rad, y, Math.sin(th) * rad);
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
export const RIDGE_LENGTH = 15;
const RIDGE_BASE_Y = -8;
const RIDGE_HALF_BL = 5.6;

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

  if (s < 0.45) {
    // Cortical plate: near-vertical, with a slight outward belly.
    const k = s / 0.45;
    z = RIDGE_HALF_BL * (1 - 0.06 * Math.sin(k * Math.PI));
    y = lerp(RIDGE_BASE_Y, 1.2, k);
  } else {
    // Crest arch: converges to roughly 46% of the base width.
    const k = (s - 0.45) / 0.55;
    const e = Math.sin((k * Math.PI) / 2); // quarter-sine, flat at the top
    z = RIDGE_HALF_BL * lerp(1, 0.0, e);
    y = lerp(1.2, RIDGE_CREST_Y, Math.sin((k * Math.PI) / 2) ** 0.72);
  }

  return [z * sign, y];
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
  const N = 128;
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
    curveSegments: 1,
    steps: 40,
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
  const ALONG = 130;
  const AROUND = 150;
  const THICK = 1.45;

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
    const crestness = Math.pow(Math.sin(k * Math.PI), 2);
    const papilla = outbound
      ? 1.15 *
        Math.pow(Math.max(0, Math.cos((x / RIDGE_LENGTH) * TAU * 1.5)), 3) *
        crestness *
        endCap
      : 0;

    const outward = 1 + t / RIDGE_HALF_BL;

    out.set(x, y0 + t * 0.5 + papilla, z0 * outward);
  });
}

/**
 * Cheap, convincing contact shadow: a radial-gradient sprite on the floor.
 * Cheaper than a shadow map and, at this scale, indistinguishable.
 */
export function buildShadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(48,24,10,0.5)');
  g.addColorStop(0.42, 'rgba(48,24,10,0.24)');
  g.addColorStop(0.75, 'rgba(48,24,10,0.06)');
  g.addColorStop(1, 'rgba(48,24,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
