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
  buildShadowTexture,
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

/* ── environment ──────────────────────────────────────────────────────────── */

/**
 * Studio environment rendered on-GPU from emissive panels — the equivalent of
 * drei's <Environment><Lightformer/></Environment>, minus the reconciler.
 * Large soft sources are what make product renders read as expensive; a bare
 * DirectionalLight gives a hard specular dot and nothing to reflect.
 */
function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
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
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0.03);
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return target.texture;
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

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    const envMap = buildEnvironment(renderer);
    scene.environment = envMap;

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
    const matFixture = new THREE.MeshPhysicalMaterial({
      color: 0xc1baaf,
      metalness: 1,
      roughness: 0.48,
      envMapIntensity: 1.05,
    });

    const matMachined = new THREE.MeshPhysicalMaterial({
      color: 0xc9c3ba,
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 1.15,
    });

    // Zirconia crown. Cervical third more opaque, warmer and more saturated;
    // occlusal third more translucent and greyer — that gradient is how a real
    // multilayer crown is engineered, and it is the difference between "tooth"
    // and "white plastic blob".
    const matCrown = new THREE.MeshPhysicalMaterial({
      color: 0xf3ece0,
      metalness: 0,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.09,
      transmission: 0.34,
      thickness: 2.2,
      ior: 1.62,
      attenuationDistance: 6,
      attenuationColor: new THREE.Color(0xd9c39c),
      sheen: 0.5,
      sheenColor: new THREE.Color(0xfff0dc),
      sheenRoughness: 0.6,
      specularIntensity: 1,
      envMapIntensity: 1.25,
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
      // `transparent` is set ONCE, here. Flipping it at runtime needs a shader
      // recompile (material.needsUpdate = true); without that the bone silently
      // stays opaque and the osseointegration reveal never happens.
      transparent: true,
      opacity: 1,
    });

    // Gingiva measures CIE L*52.9 a*23.3 b*14.9 ≈ #AC6E66 — a desaturated
    // brick-rose, markedly less pink than the candy colour used in most dental
    // illustration. Vascular tissue, so it wants strong subsurface warmth.
    const matGum = new THREE.MeshPhysicalMaterial({
      color: 0xac6e66,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.42,
      sheen: 0.7,
      sheenColor: new THREE.Color(0xe09a8c),
      transmission: 0.04,
      thickness: 1.4,
      attenuationColor: new THREE.Color(0x8e3b34),
      attenuationDistance: 2.4,
      side: THREE.DoubleSide,
      clippingPlanes: [boneClip],
      transparent: true,
      opacity: 1,
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
    gum.position.y = CREST;
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

    // Contact shadow. Cheaper than a second shadow map and, at this scale,
    // indistinguishable.
    const shadowTex = buildShadowTexture();
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 64),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.85,
      }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -9.4;
    root.add(contact);

    /* --- seated positions (progress = 1) --- */
    const SEAT_FIXTURE = -FIXTURE_LENGTH; // platform lands on y = 0 (the crest)
    const SEAT_ABUT = 0;
    const SEAT_CROWN = 4.2;

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
    };
    const onPointerLeave = () => {
      hovering = false;
      pointer.x = 0;
      pointer.y = 0;
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
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* --- run only while on screen --- */
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(host);

    /* --- loop --- */
    const clock = new THREE.Clock();
    let shown = 0;

    const tick = () => {
      if (disposed) return;
      raf = requestAnimationFrame(tick);

      const dt = Math.min(clock.getDelta(), 1 / 30);
      if (!visible) return; // keep the delta consumed, skip the work

      shown = damp(shown, progress.current, 5, dt);
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

      /* Phase 4 — bone turns translucent to show osseointegration.
         `transparent` is already true on the material, so only opacity moves. */
      const tBone = seg(p, 0.84, 1);
      // Only a partial fade. Dropping the bone to 0.4 made the whole frame
      // read as washed-out ghosting rather than as a material becoming
      // translucent, and it took the gingiva's solidity with it.
      matBone.opacity = lerp(1, 0.72, tBone);
      matGum.opacity = lerp(1, 0.94, tBone);

      /* The cutaway opens as the fixture goes in, then closes again once it is
         seated, so the finished result is seen whole rather than sliced. */
      const cut = easeInOut(seg(p, 0.1, 0.42)) * (1 - easeInOut(seg(p, 0.86, 1)));
      boneClip.constant = lerp(12, 0.6, cut);

      /* Framing: ease the camera in as the assembly completes. */
      // Wide at rest so the exploded stack is fully in frame from the first
      // paint, closing in as the parts seat. Parts previously started at
      // y = 16/30/44 — entirely outside the frustum — so for most of the scroll
      // the canvas showed an empty box with a bone in it.
      const tFrame = easeOutQuint(seg(p, 0, 0.9));
      const dist = lerp(104, 62, tFrame);
      const height = lerp(10, 3, tFrame);
      const focus = lerp(8, 0.5, tFrame);

      /* Pointer parallax, damped. lambda 3 gives about a 300ms settle — slow
         enough to feel weighted, fast enough not to lag behind the cursor. */
      const targetX = hovering ? pointer.x * 0.32 : 0;
      const targetY = hovering ? pointer.y * 0.16 : 0;
      orbit.x = damp(orbit.x, targetX, 3, dt);
      orbit.y = damp(orbit.y, targetY, 3, dt);

      /* Ambient presentation drift, held still under reduced motion. */
      const idle = reduced ? 0 : Math.sin(clock.elapsedTime * 0.16) * 0.09;
      // Three-quarter view. The ridge runs along X, so a near-frontal yaw
      // shows only its length and it reads as a block; swinging round lets the
      // cut end — and therefore the arch — be seen.
      const yaw = -1.0 + idle + p * 0.32 + orbit.x;
      const pitch = 0.06 + orbit.y * 0.5;

      camera.position.set(
        Math.sin(yaw) * dist,
        height + pitch * 26,
        Math.cos(yaw) * dist,
      );
      camera.lookAt(0, focus, 0);

      renderer.render(scene, camera);
    };
    tick();

    /* --- teardown: three.js does not garbage collect GPU resources --- */
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
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
      shadowTex.dispose();
      envMap.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress, reduced]);

  return <div ref={hostRef} className="h-full w-full" aria-hidden="true" />;
}
