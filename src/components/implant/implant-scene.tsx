'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  buildFixture,
  buildFixturePlatform,
  buildAbutment,
  buildAbutmentScrew,
  buildCrown,
  buildBoneRidge,
  buildGingiva,
  buildTurnedRoughness,
  FIXTURE_LENGTH,
} from './geometry';

/**
 * Scroll-driven dental implant assembly, in vanilla three.js.
 *
 * WHY NOT react-three-fiber:
 * R3F drives three.js through `react-reconciler`, which is pinned to a specific
 * React internals shape. Next 15 serves React 19 internals to client components
 * (`__CLIENT_INTERNALS_…`) while R3F v8's reconciler reads React 18's
 * (`__SECRET_INTERNALS_…`), so the canvas threw "Cannot read properties of
 * undefined (reading 'ReactCurrentBatchConfig')" and took the whole route down.
 * Moving to R3F v9 requires React 19, which forces react-day-picker v8 → v9 — a
 * breaking rewrite of the appointment calendar. Trading the booking flow's
 * stability for a decorative hero is a bad deal.
 *
 * Everything is procedural: no .glb, no texture, no HDR fetch. The environment
 * is rendered on-GPU from emissive panels via PMREMGenerator, which is what
 * gives the titanium something to reflect without a network request the CSP
 * would (correctly) block.
 *
 * The model is in REAL MILLIMETRES (see ./geometry) and scaled once here.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 0→1 ramp over [a,b]. */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent exponential approach.
 *
 * `lerp(cur, target, 0.1)` per frame is the usual shortcut and it is wrong: it
 * converges twice as fast at 120fps as at 60fps, so the scene literally feels
 * different on different monitors. Folding dt into the exponent fixes that.
 */
const damp = (cur: number, target: number, lambda: number, dt: number) =>
  lerp(cur, target, 1 - Math.exp(-lambda * dt));

/**
 * Collapses an exponential approach onto its target once the remainder has
 * stopped mattering.
 *
 * `damp` never actually arrives — it halves the gap forever — so a loop that
 * asks "has anything moved?" by comparing against the target is asking a
 * question whose answer is permanently yes, and the idle gate in tick() can
 * never fire. Snapping inside a threshold that is already far under a pixel
 * (1e-3 of the progress ramp; 0.06° of orbit) is what makes "nothing is
 * moving" an expressible state at all, and it lets that test be an exact
 * comparison rather than another epsilon to keep in sync.
 */
const settle = (v: number, target: number) =>
  Math.abs(v - target) < 1e-3 ? target : v;

/**
 * Resolves a CSS custom property to a THREE.Color.
 *
 * The design tokens hold bare `L C H` triples consumed as `oklch(var(--x))`,
 * and THREE.Color.setStyle parses hex/rgb/hsl/named colours but NOT oklch —
 * still true as of r0.185, which is where this was last checked. So the
 * browser is asked to do the conversion.
 *
 * The obvious version of this — read `getComputedStyle(probe).color` and hand
 * the string to `setStyle` — SILENTLY DOES NOTHING. Per CSS Color 4 §15 a
 * non-legacy colour function serialises in its own colour space, so that
 * getter returns the string `"oklch(0.9455 0.0075 62)"`, never `"rgb(…)"`.
 * The guard fell through, the fallback was returned every time, and the fog
 * sat on a hardcoded beige that was wrong in light mode and badly wrong in
 * dark. It failed quietly and looked like it worked, which is the worst shape
 * a bug can have.
 *
 * A 2D canvas context, unlike THREE.Color, DOES accept `oklch()` on
 * `fillStyle`. So the conversion goes through a 1×1 rasterisation, which is
 * exact and needs no colour-space maths here.
 */
function resolveToken(token: string, fallback: number): THREE.Color {
  const color = new THREE.Color(fallback);
  // `setProperty`, not `cssText`: cssText parses a whole declaration list, so
  // a token that ever became dynamic could inject further declarations. The
  // pattern guard makes that unrepresentable rather than merely unlikely.
  if (!/^--[a-z0-9-]+$/.test(token)) return color;

  const probe = document.createElement('span');
  try {
    probe.style.setProperty('position', 'absolute');
    probe.style.setProperty('visibility', 'hidden');
    probe.style.setProperty('color', `oklch(var(${token}))`);
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;

    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = resolved;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
    }
  } catch {
    /* keep the fallback */
  } finally {
    probe.remove();
  }
  return color;
}

/* ── environment ──────────────────────────────────────────────────────────── */

/**
 * Studio environment rendered on-GPU from emissive panels — the equivalent of
 * drei's <Environment><Lightformer/></Environment>, minus the reconciler.
 * Large soft sources are what make product renders read as expensive; a bare
 * DirectionalLight gives a hard specular dot and nothing to reflect.
 */
function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const scene = new THREE.Scene();
  // Mid warm-grey, not near-black. A dark environment background gives polished
  // metal nothing to reflect except darkness, so the machined abutment came out
  // looking like brown glass rather than titanium. Everything a mirror-finish
  // part shows you is the room, so the room has to have something in it.
  scene.background = new THREE.Color(0x6d6257);

  const panel = (
    color: number,
    intensity: number,
    pos: [number, number, number],
    scale: [number, number],
  ) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(scale[0], scale[1]),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };

  // Large, bright, and wrapped around the subject. A mirror-finish part shows
  // you nothing but the room, so an under-lit room makes polished titanium read
  // as brown glass — which is exactly what the machined abutment was doing.
  panel(0xfff0d8, 5.2, [-6, 7, 5], [14, 14]); // warm brass key
  panel(0xd6e8f6, 2.8, [7, 3, 4], [11, 13]); // cool fill, opposite side
  panel(0xffffff, 2.4, [0, 10, -1], [16, 8]); // broad top softbox
  panel(0xd8a86a, 1.2, [0, -6, 4], [12, 6]); // warm floor bounce
  panel(0xffffff, 1.8, [-1, 2, -9], [12, 12]); // rim from behind
  panel(0xffffff, 1.1, [0, 2, 11], [12, 12]); // frontal fill, kills dead black

  const pmrem = new THREE.PMREMGenerator(renderer);
  // Deliberately NOT compileEquirectangularShader(). That pre-links the
  // equirect→cubeUV program and draws a full-screen quad with it to force the
  // link through; this environment comes from `fromScene`, which never touches
  // that path. It was a program link and a draw call for a shader the scene
  // has no way to reach.
  const target = pmrem.fromScene(scene, 0.03);
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });

  /* Returns the RENDER TARGET, not `target.texture`.
     Handing back only the texture leaked the cubeUV framebuffer on every
     unmount, and — worse — made the cleanup look correct while doing nothing:
     `PMREMGenerator.dispose()` frees its blur materials and ping-pong target
     but NOT the target it just returned, and calling `.dispose()` on that
     target's texture is a no-op, because WebGLTextures.deallocateTexture
     early-returns unless `__webglInit` is set, which only happens for textures
     that went through initTexture — render-target textures never do. Only
     `renderTarget.dispose()` reaches deallocateRenderTarget. */
  return target;
}

/* ── component ────────────────────────────────────────────────────────────── */

export default function ImplantScene({
  progress,
  reduced = false,
}: {
  progress: MutableRefObject<number>;
  reduced?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    /* Set whenever something that affects the image changes. The loop renders
       only when it is true — see the note in tick(). */
    let dirty = true;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    // DPR 2 on a ~620×744 vitrine is ~1.85 M fragments, every one of them
    // running a physical shader with clearcoat, sheen and a cubeUV environment
    // lookup. Capping at 1.75 takes roughly a quarter off that and is
    // invisible at arm's length on a display this content is never the focus
    // of. (The cap used to be justified by the crown's transmission doubling
    // the fragment count; that pass is gone — see the crown material — and the
    // cap is kept on its own merit.)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearAlpha(0);
    // AgX, not ACESFilmic. ACES crushes saturation toward a milky grey, which
    // is exactly the "cheap render" look — it is a film-emulation curve doing
    // work this scene never asked for. AgX keeps the warm brass and terracotta
    // of the environment intact while still rolling off highlights.
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    /* The shadow map is redrawn only when the assembly actually moves.
       The single caster is a DirectionalLight with a fixed position and a
       fixed orthographic frustum, so its depth pass does not depend on the
       camera at all — yet on autoUpdate every frame re-rendered a
       bit-identical 87,354-triangle pass into the same 1024² target. That is
       most of the cost of a pointer-parallax frame, where the camera swings
       but nothing in the scene has changed. The loop below raises
       `needsUpdate` on the frames that do change something (the parts
       descending, and the cutaway plane sweeping open, which the bone and gum
       materials now honour in the depth pass). */
    renderer.shadowMap.autoUpdate = false;
    // Cutaway: everything is clipped against a plane so the viewer can see the
    // fixture INSIDE the bone. Without this the implant descends into an opaque
    // block and the entire point of the graphic is hidden — which is precisely
    // what was wrong with the previous version.
    renderer.localClippingEnabled = true;

    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: '100%',
      height: '100%',
      display: 'block',
      touchAction: 'pan-y',
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

    // Atmosphere, so the object is IN the vitrine rather than pasted onto it.
    // The canvas is transparent over a warm radial wash painted by
    // <ImplantStage>; without depth cueing the assembly floated in front of
    // that wash with no relationship to it. Fog matched to the panel colour
    // lets the far end of the ridge fall away into the case — and it buys the
    // depth that a DOF pass would, for one line instead of a depth prepass and
    // a full-screen gather.
    const fog = new THREE.Fog(resolveToken('--canvas', 0xe8ddcd), 62, 145);
    scene.fog = fog;

    // The theme toggle swaps a class on <html>, which changes what --canvas
    // resolves to. Without this the fog would keep the colour of whichever
    // theme happened to be active when the canvas mounted.
    const themeObserver = new MutationObserver(() => {
      fog.color.copy(resolveToken('--canvas', 0xe8ddcd));
      dirty = true;
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const envTarget = buildEnvironment(renderer);
    scene.environment = envTarget.texture;

    scene.add(new THREE.AmbientLight(0xfff2e2, 0.28));

    const key = new THREE.DirectionalLight(0xffeacc, 2.1);
    key.position.set(-26, 40, 30);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 140;
    const s = 26;
    key.shadow.camera.left = -s;
    key.shadow.camera.right = s;
    key.shadow.camera.top = s;
    key.shadow.camera.bottom = -s;
    // Shadow acne on a surface with 0.1mm microthread relief needs normalBias,
    // not just bias — plain bias peter-pans the contact shadow instead.
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.35;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xbcd8ee, 0.55);
    fill.position.set(34, 12, 20);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(6, 14, -34);
    scene.add(rim);

    /* --- materials ---
       Titanium is #c1baaf — WARM and desaturated (Filament's measured value).
       The previous 0xc9ccd1 is a cool blue-grey, i.e. chrome, which is a large
       part of why the post read as a hardware-store bolt.

       The roughness CONTRAST between parts is doing real work: the fixture is
       blasted/acid-etched (matte, Sa ~1.4–2.1µm) at 0.48, the abutment and
       screw are machined and polished at 0.13. Adjacent parts finished
       differently is a product-photography tell that costs nothing. */
    /* Roughness MAPS, not scalars.
       A single roughness number is the most reliable "this is CG" tell there
       is — a real surface varies, and that variation is what breaks a
       reflection into something the eye reads as metal. Both maps vary only
       along the axis, so the bands circle the part: lathe tool marks on the
       machined components, a coarser blasted/etched texture on the fixture.
       Roughness is set to the TOP of each range because the map multiplies. */
    const roughMachined = buildTurnedRoughness(0.42, 3.5);
    const roughFixture = buildTurnedRoughness(0.74, 2.2);

    const matFixture = new THREE.MeshPhysicalMaterial({
      color: 0xc1baaf,
      metalness: 1,
      roughness: 0.58,
      roughnessMap: roughFixture,
      envMapIntensity: 1.05,
    });

    const matMachined = new THREE.MeshPhysicalMaterial({
      color: 0xc9c3ba,
      metalness: 1,
      roughness: 0.3,
      roughnessMap: roughMachined,
      envMapIntensity: 1.15,
    });

    // Zirconia crown. Cervical third more opaque, warmer and more saturated;
    // occlusal third more translucent and greyer — that gradient is how a real
    // multilayer crown is engineered, and it is the difference between "tooth"
    // and "white plastic blob".
    /* NO TRANSMISSION, and this is the most consequential judgement in the
       file, so here is the whole of it.

       `transmission: 0.34` cost a viewport-sized HalfFloat render target with
       4× MSAA (~39 MB of VRAM), a SECOND full pass over every opaque object in
       the scene, an MSAA resolve and a half-float mipmap chain — every frame,
       for one object about 120 px tall. Measured against the frame's triangle
       budget that pass alone was 78,842 of 278,830 triangles.

       What it actually bought: the crown is seen against the vitrine's own
       background over most of its silhouette and against opaque bone below the
       margin, so there was almost nothing behind it to refract. The visible
       residue was a slight warm desaturation from `attenuationColor` and a
       softening of the cusp ridges — both of which the clearcoat, the sheen
       lobe and the baked cervical→occlusal vertex colours were already
       carrying. `thickness`, `attenuationDistance` and `attenuationColor` are
       gone with it: three only reads them under USE_TRANSMISSION, so leaving
       them would have been configuration that looks load-bearing and is inert.

       Traded back, without touching a single hue:
         roughness      0.18 → 0.14  tighter specular; the wet-enamel gloss now
                                     has to come entirely from the reflection
                                     lobes, so it has to be a sharper lobe
         envMapIntensity 1.25 → 1.5  the crown shows the studio room where it
                                     used to show what was behind it
         sheen           0.50 → 0.62 } the soft edge glow transmitted light gave
         sheenRoughness  0.60 → 0.50 } at the thin cusp ridges and the collar

       `ior: 1.62` stays and is NOT inert without transmission: MeshPhysical
       always defines IOR, so it still drives the dielectric F0 (0.056 against
       the 0.04 default), which is the specular strength that reads as enamel
       rather than as paint. */
    const matCrown = new THREE.MeshPhysicalMaterial({
      color: 0xf3ece0,
      // The cervical→occlusal layering is baked into the geometry's vertex
      // colours (see buildCrown). This comment used to describe a gradient the
      // code never actually produced — the material was one flat colour top to
      // bottom, which is the difference between "tooth" and "white blob".
      vertexColors: true,
      metalness: 0,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.09,
      ior: 1.62,
      sheen: 0.62,
      sheenColor: new THREE.Color(0xfff0dc),
      sheenRoughness: 0.5,
      specularIntensity: 1,
      envMapIntensity: 1.5,
    });

    const boneClip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.2);

    const matBone = new THREE.MeshPhysicalMaterial({
      color: 0xcbb894,
      roughness: 0.92,
      metalness: 0,
      clearcoat: 0.05,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xc0a37c),
      side: THREE.DoubleSide, // the cut face must render, not show through
      clippingPlanes: [boneClip],
      /* Clipping planes are ignored by the shadow pass unless this is set, so
         without it the half of the ridge that has been cut away goes on
         casting a shadow — a hard band of shade thrown across the crest by a
         wall of bone the viewer can see is not there. The bug is invisible
         while the cutaway is shut and appears as the plane sweeps open, which
         is exactly the moment the graphic is asking to be trusted. */
      clipShadows: true,
      // OPAQUE, deliberately.
      //
      // This used to fade to 0.72 for the osseointegration phase. With
      // DoubleSide that meant every interior backface showed through every
      // exterior face and the ridge turned into a block of frosted glass —
      // which is what made the whole graphic read as moulded plastic. The
      // reveal is now carried by the cutaway staying OPEN at the end instead:
      // an opaque cut face showing the fixture threaded into bone says
      // "integrated" far more clearly than translucency ever did, and it drops
      // both tissue meshes out of the transparent render pass.
    });

    // Gingiva, measured by spectroradiometer (Ho et al., Sci Rep 2015;5:18498,
    // n=238): healthy attached gingiva overall is CIE L*52.9 a*23.3 b*14.9 ≈
    // #AC6E66 — a desaturated brick-rose, markedly less pink than the candy
    // colour most dental illustration reaches for.
    //
    // This uses that paper's HISPANIC subgroup instead — L*53.8 a*24.1 b*15.1
    // ≈ #B07068 — because ethnicity significantly affects both L* and a*
    // (p<0.05) and this is a clinic in Santiago de los Caballeros. It is a
    // small shift, and it is the better-justified default for who is actually
    // looking at the page.
    const matGum = new THREE.MeshPhysicalMaterial({
      color: 0xb07068,
      // Vascular depth is baked per vertex (see buildGingiva): darker and more
      // saturated where the tissue is thick or shadowed, paler where it thins
      // to an edge. That is a free stand-in for subsurface scattering, and it
      // is what stops a flat pink reading as plasticine.
      vertexColors: true,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.42,
      // Sheen's retro-reflective lobe is what gives skin and tissue their
      // velvety rim. It is doing the work `transmission: 0.04` pretended to:
      // at 0.04 the refraction was invisible, but it still put this material
      // into the transmissive queue and compiled the whole USE_TRANSMISSION
      // path for it — a second full scene render per frame, for nothing.
      sheen: 0.85,
      sheenColor: new THREE.Color(0xe09a8c),
      sheenRoughness: 0.55,
      side: THREE.DoubleSide,
      // Clipped on the SAME plane as the bone. Leaving the mucosa whole over a
      // sectioned ridge made the collar overhang a block that had been cut away
      // beneath it, so the tissue read as a hat hovering in mid air. The reason
      // this looked like a torn flap on an earlier pass was not the clipping —
      // it was that the tissue had no real thickness at the crest, so the cut
      // exposed a zero-width edge. With thickness applied along the section
      // normal the cut face is a proper band of tissue, which is exactly what a
      // dental atlas shows.
      clippingPlanes: [boneClip],
      // Carried for the same reason as the bone's. Inert while this mesh only
      // receives shadows — but the pairing of `clippingPlanes` with a silently
      // unclipped depth pass is a trap worth closing at the definition rather
      // than remembering to close on the day someone sets castShadow here.
      clipShadows: true,
    });

    /* --- assembly ---
       Anatomy stack, in millimetres, crest of the ridge at y = 0:
         fixture platform seats at the crest
         abutment rises 0 → 7 from the platform
         crown cervical margin seats 4.2 up the abutment prep  */
    const CREST = 5.87; // bone ridge crest in its own local space
    const root = new THREE.Group();
    scene.add(root);

    const tissue = new THREE.Group();
    tissue.position.y = -CREST;
    root.add(tissue);

    const boneGeo = buildBoneRidge();
    const bone = new THREE.Mesh(boneGeo, matBone);
    bone.receiveShadow = true;
    bone.castShadow = true;
    tissue.add(bone);

    const gumGeo = buildGingiva();
    const gum = new THREE.Mesh(gumGeo, matGum);
    // NOT `CREST`. The gingiva is traced from the same `ridgeSection` as the
    // bone, so the two geometries are already in one coordinate system and the
    // mesh needs no offset at all — lifting it by the crest height floated the
    // tissue a clear 5.9 mm above the ridge, as a pink saddle hovering in mid
    // air over a beige block. Supracrestal height is a property of the tissue,
    // and it is modelled inside buildGingiva where it belongs.
    gum.receiveShadow = true;
    tissue.add(gum);

    // Fixture group: local y = 0 at the apex, y = FIXTURE_LENGTH at the platform.
    const fixture = new THREE.Group();
    const fixtureGeo = buildFixture();
    const fixtureMesh = new THREE.Mesh(fixtureGeo, matFixture);
    fixtureMesh.castShadow = true;
    fixture.add(fixtureMesh);
    const platGeo = buildFixturePlatform();
    const plat = new THREE.Mesh(platGeo, matMachined);
    plat.position.y = FIXTURE_LENGTH;
    fixture.add(plat);
    root.add(fixture);

    const abutment = new THREE.Group();
    const abutGeo = buildAbutment();
    const abutMesh = new THREE.Mesh(abutGeo, matMachined);
    abutMesh.castShadow = true;
    abutment.add(abutMesh);
    const screwGeo = buildAbutmentScrew();
    const screw = new THREE.Mesh(screwGeo, matMachined);
    screw.position.y = -2.4;
    abutment.add(screw);
    root.add(abutment);

    const crown = new THREE.Group();
    const crownGeo = buildCrown();
    const crownMesh = new THREE.Mesh(crownGeo, matCrown);
    crownMesh.castShadow = true;
    crown.add(crownMesh);
    root.add(crown);

    /* No fake floor shadow.
       There used to be a radial-gradient sprite on a plane at y = −9.4 standing
       in for contact shading. Two things killed it: the ridge now runs down to
       −13 and off the bottom of frame, so the plane sat INSIDE the bone; and it
       was static, pinned at a fixed height while three parts descended past it,
       so it never actually indicated contact with anything. The key light
       already casts a real shadow onto the bone, which is the cue that matters
       — and this removes a transparent, depth-write-disabled draw from every
       frame. */

    /* --- seated positions (progress = 1) --- */
    const SEAT_FIXTURE = -FIXTURE_LENGTH; // platform lands on y = 0 (the crest)
    const SEAT_ABUT = 0;
    // The abutment's finish line, not an arbitrary height up the prep. Lowered
    // from 4.2: at that height the crown margin met a 1.62 mm-radius post with
    // its own margin at 3 mm, which is what produced the overhang.
    const SEAT_CROWN = 3.0;

    /* --- pointer --- */
    // Target orbit driven by the pointer, damped so the object feels weighted
    // rather than glued to the cursor. Kept small: this is a medical diagram,
    // not a turntable.
    const pointer = { x: 0, y: 0 };
    const orbit = { x: 0, y: 0 };
    let hovering = false;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // never hijack a touch scroll
      const r = host.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      hovering = true;
      dirty = true;
    };
    const onPointerLeave = () => {
      hovering = false;
      pointer.x = 0;
      pointer.y = 0;
      dirty = true;
    };
    if (!reduced) {
      host.addEventListener('pointermove', onPointerMove, { passive: true });
      host.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }

    /* --- sizing --- */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* --- run only while on screen --- */
    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        // Coming back on screen after a resize or theme change must repaint
        // even if nothing is moving.
        if (visible) dirty = true;
      },
      /* A margin, so the first frame is drawn just BEFORE the vitrine reaches
         the viewport. <ImplantStage> only mounts this component within 400 px
         of the fold; with a zero margin here the scene would then sit idle
         until the frame the section is already visible, and the visitor would
         catch one frame of empty case. */
      { rootMargin: '200px' },
    );
    io.observe(host);

    /* --- loop --- */
    const clock = new THREE.Clock();
    let shown = 0;

    const tick = () => {
      if (disposed) return;
      raf = requestAnimationFrame(tick);

      const dt = Math.min(clock.getDelta(), 1 / 30);
      if (!visible) return; // keep the delta consumed, skip the work

      const pTarget = progress.current;
      /* Pointer parallax targets. The damping below at lambda 3 gives about a
         300 ms settle — slow enough to feel weighted, fast enough not to lag
         behind the cursor. Kept small: this is a medical diagram, not a
         turntable. */
      const targetX = hovering ? pointer.x * 0.32 : 0;
      const targetY = hovering ? pointer.y * 0.16 : 0;

      /* Render only when the image would actually differ.

         Everything that can move here is an exponential approach to a target,
         so "is anything moving?" is exactly "is anything still off its
         target?" — asked BEFORE this frame's damping step, so the frame that
         lands on the target is still drawn, and answered by exact comparison
         because `settle` guarantees a value is either on its target or a
         visible distance from it.

         This gate used to be unreachable, and the comment that stood here
         admitted as much without drawing the conclusion. An ambient yaw drift
         faded in whenever the scroll went quiet and `driftGain > 1e-3` was one
         of the terms, so the condition held forever: the scene re-rendered
         278,830 triangles at 60 fps for as long as the section stayed on
         screen, while the visitor read the legend beside it. The drift is gone
         (see the yaw below) and resting now costs nothing at all — no draw, no
         shadow pass, no matrix update, just this comparison. */
      const assemblyMoving = shown !== pTarget;
      const moving = assemblyMoving || orbit.x !== targetX || orbit.y !== targetY;
      if (!moving && !dirty) return;
      dirty = false;

      /* The shadow map is camera-independent (one fixed DirectionalLight), so
         it only goes stale when the parts move or the cutaway plane sweeps.
         A pointer-parallax frame re-uses the depth buffer it already has. */
      if (assemblyMoving) renderer.shadowMap.needsUpdate = true;

      shown = settle(damp(shown, pTarget, 5, dt), pTarget);
      orbit.x = settle(damp(orbit.x, targetX, 3, dt), targetX);
      orbit.y = settle(damp(orbit.y, targetY, 3, dt), targetY);

      const p = shown;

      /* Phase 1 — the fixture threads down into the osteotomy.
         It rotates as it descends, which is what a screw does; the rotation is
         cut to ~3 turns rather than the 12.5 the real pitch implies, because
         12.5 turns at scroll speed reads as a blur. */
      const tFix = easeOutQuint(seg(p, 0.06, 0.46));
      fixture.position.y = lerp(6, SEAT_FIXTURE, tFix);
      fixture.rotation.y = (1 - tFix) * Math.PI * 6;

      /* Phase 2 — the abutment drops onto the platform. */
      const tAbut = easeOutQuint(seg(p, 0.42, 0.68));
      abutment.position.y = lerp(18, SEAT_ABUT, tAbut);
      abutment.visible = tAbut > 0.001;

      /* Phase 3 — the crown seats. */
      const tCrown = easeOutQuint(seg(p, 0.62, 0.86));
      crown.position.y = lerp(28, SEAT_CROWN, tCrown);
      crown.visible = tCrown > 0.001;

      /* The cutaway opens as the fixture goes in and STAYS open.
         It used to close again over the last 14% "so the finished result is
         seen whole" — but closing it hides the fixture inside opaque bone at
         exactly the moment the caption says "osseointegration", which is the
         one thing the section exists to show. Phase 4 now widens the opening
         slightly instead, so the finished, integrated assembly is what the
         viewer is left looking at. */
      // Stops just past the long axis, so the fixture is seen whole in section
      // rather than halved. Taking it further (to −0.5) cut away the near side
      // of everything and left the assembly looking like a fragment.
      const cut = easeInOut(seg(p, 0.1, 0.42));
      boneClip.constant = lerp(12, 0.9, cut);

      /* Framing: ease the camera in as the assembly completes. */
      // Wide at rest so the exploded stack is fully in frame from the first
      // paint, closing in as the parts seat. Parts previously started at
      // y = 16/30/44 — entirely outside the frustum — so for most of the scroll
      // the canvas showed an empty box with a bone in it.
      const tFrame = easeOutQuint(seg(p, 0, 0.9));
      const dist = lerp(104, 62, tFrame);
      const height = lerp(10, 3, tFrame);
      const focus = lerp(8, 0.5, tFrame);

      /* Fog has to track the camera, not sit at fixed depths.
         Static near/far were catastrophic here: at the opening distance of 104
         the subject sat halfway between near 62 and far 145, so the ENTIRE
         object rendered about 50% blended into the background colour and the
         whole frame looked washed out. Anchoring the band to `dist` means it
         only ever separates the near and far sides of a ~30 mm subject, which
         is all it was ever meant to do. */
      fog.near = dist - 14;
      fog.far = dist + 88;

      /* No ambient presentation drift.

         There used to be a ±5° yaw oscillation on a 39 s period, faded in once
         the scroll had been quiet for 0.8 s. It was the only thing moving in
         the resting state, and that made it the single most expensive line in
         the file: it held the render gate above permanently open, so a fully
         assembled implant that the visitor had stopped interacting with was
         still redrawing 278,830 triangles and a bit-identical 1024² shadow
         pass sixty times a second, to swing the camera by well under a degree
         per second. Nothing replaces it, deliberately — the resting frame is a
         finished implant seen in section, which is the informative state, and
         the pointer parallax below still answers any movement the visitor
         actually makes. */
      // Three-quarter view. The ridge runs along X, so a near-frontal yaw
      // shows only its length and it reads as a block; swinging round lets the
      // cut end — and therefore the arch — be seen.
      const yaw = -1.0 + p * 0.32 + orbit.x;
      const pitch = 0.06 + orbit.y * 0.5;

      camera.position.set(
        Math.sin(yaw) * dist,
        height + pitch * 26,
        Math.cos(yaw) * dist,
      );
      camera.lookAt(0, focus, 0);

      renderer.render(scene, camera);
    };

    /* Link the programs BEFORE the first frame rather than during it.

       Five physical materials, each with clearcoat, sheen, a cubeUV
       environment lookup, fog and — on the tissue — clipping planes, is a lot
       of generated GLSL. Compiled lazily they all land inside the first
       `render`, as a synchronous stall of tens of milliseconds arriving at
       exactly the moment the section scrolls into view. `compileAsync` hands
       them to the driver up front and, where KHR_parallel_shader_compile
       exists, resolves only once they report ready, so the first frame is a
       draw and nothing else.

       It walks with `scene.traverse`, not traverseVisible, so it finds the
       parts regardless of the `visible` flags tick() is about to set. It does
       NOT reach the shadow pass's depth variants — those are built by
       WebGLShadowMap and there is no public lever for them — so the first
       frame still pays for four of those. That is a quarter of the stall
       rather than all of it.

       The catch is not defensive padding: `compile` runs outside the promise,
       so if it throws there is no promise to reject and the loop would simply
       never be started — turning a slow first frame into a blank canvas
       forever. */
    const start = () => {
      if (disposed) return;
      // Nothing has drawn yet, so the shadow map does not exist. autoUpdate is
      // off, so the first pass has to be asked for explicitly.
      renderer.shadowMap.needsUpdate = true;
      tick();
    };
    try {
      renderer.compileAsync(scene, camera).then(start, start);
    } catch {
      start();
    }

    /* --- teardown: three.js does not garbage collect GPU resources --- */
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      roughMachined.dispose();
      roughFixture.dispose();
      envTarget.dispose();
      // `scene.traverse` above only disposes meshes, so lights are skipped —
      // and a 1024² shadow map is a real allocation. LightShadow.dispose()
      // frees both `map` and `mapPass`.
      key.shadow.dispose();
      renderer.dispose();
      /* `renderer.dispose()` releases three's own caches and nothing else — it
         never touches the WebGL context, and several of the things that hang
         off one (the drawing buffer, the default framebuffer, the compiled
         program objects the driver still holds) are unreachable from here, so
         there is no handle to dispose. Browsers cap live contexts at around 16
         and silently kill the oldest on overflow, so a visitor who toggles the
         language a dozen times — every toggle rewrites the path and remounts
         this tree — would otherwise take down some other canvas on the page.
         Dropping the context is the only lever that actually returns any of
         it, and it is safe here: the element is going away.
         (This used to be justified by the crown's transmission render target,
         which no longer exists. The lever is still the right one.) */
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [progress, reduced]);

  return <div ref={hostRef} className="h-full w-full" aria-hidden="true" />;
}
