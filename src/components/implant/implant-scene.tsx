'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

/**
 * Scroll-driven dental implant assembly, in vanilla three.js.
 *
 * WHY NOT react-three-fiber:
 * R3F drives three.js through `react-reconciler`, which is pinned to a
 * specific React internals shape. Next 15 serves React 19 internals to client
 * components (`__CLIENT_INTERNALS_…`) while R3F v8's reconciler reads React
 * 18's (`__SECRET_INTERNALS_…`), so the canvas threw
 * "Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')"
 * and took the whole route down with it. Moving to R3F v9 requires React 19,
 * which in turn forces react-day-picker v8 → v9 — a breaking rewrite of the
 * appointment calendar. Trading the booking flow's stability for a decorative
 * hero is a bad deal, so the reconciler is simply not in the picture.
 *
 * Everything below is procedural: no .glb, no texture, no HDR file. The
 * environment map is rendered on-GPU from emissive planes via PMREMGenerator,
 * which is what gives the titanium something to reflect without a network
 * fetch that the CSP would (correctly) block.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth 0→1 ramp over [a,b]. */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frame-rate independent exponential approach. */
const damp = (cur: number, target: number, lambda: number, dt: number) =>
  lerp(cur, target, 1 - Math.exp(-lambda * dt));

/* ── geometry ─────────────────────────────────────────────────────────────── */

/**
 * Threaded titanium post. A lathe whose radius carries a sawtooth ripple, which
 * reads as thread crests at this scale for a fraction of a real helix's cost.
 */
function buildPost(): THREE.BufferGeometry {
  const H = 2.05;
  const STEPS = 300;
  const THREADS = 11;
  const pts: THREE.Vector2[] = [];

  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.sin(a) * 0.17, (1 - Math.cos(a)) * 0.17));
  }

  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const y = 0.17 + t * (H - 0.17);
    const base = lerp(0.17, 0.315, Math.pow(t, 0.72));
    // Threads fade out near the machined platform.
    const fade = 1 - THREE.MathUtils.smoothstep(t, 0.82, 0.97);
    const saw = 1 - Math.abs(((t * THREADS) % 1) * 2 - 1);
    pts.push(new THREE.Vector2(base + saw * 0.05 * fade, y));
  }

  pts.push(new THREE.Vector2(0.315, H + 0.05));
  pts.push(new THREE.Vector2(0.27, H + 0.11));
  pts.push(new THREE.Vector2(0, H + 0.11));

  const g = new THREE.LatheGeometry(pts, 96);
  g.computeVertexNormals();
  return g;
}

/** Tapered abutment with a seating collar. */
function buildAbutment(): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.26, 0],
      [0.3, 0.07],
      [0.29, 0.2],
      [0.24, 0.42],
      [0.2, 0.72],
      [0.17, 0.95],
      [0.13, 1.05],
      [0, 1.08],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    80,
  );
  g.computeVertexNormals();
  return g;
}

/**
 * Molar crown: a sphere displaced into an occlusal table — four cusps from a
 * cos(4θ) term, a central fissure, and a cervical taper to seat the abutment.
 */
function buildCrown(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 96, 72);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.z, v.x);
    const yN = v.y;

    let rx = 0.62;
    const cervical = THREE.MathUtils.smoothstep(yN, -1, -0.25);
    rx *= lerp(0.72, 1, cervical);

    const occlusal = THREE.MathUtils.smoothstep(yN, 0.1, 1);
    const cusps = Math.cos(theta * 4) * 0.055 * occlusal;
    const fissure = -Math.pow(Math.max(0, yN), 6) * 0.16;

    v.x *= rx;
    v.z *= rx;
    v.y = v.y * 0.5 + cusps + fissure;

    const bulge = 1 + 0.05 * Math.sin((yN + 1) * Math.PI * 0.5);
    v.x *= bulge;
    v.z *= bulge;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Box with bevelled edges, standing in for drei's RoundedBox. */
function buildRoundedBox(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const iw = w - r * 2;
  const ih = h - r * 2;
  shape.moveTo(x, -h / 2);
  shape.lineTo(x + iw, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, y);
  shape.lineTo(w / 2, y + ih);
  shape.quadraticCurveTo(w / 2, h / 2, x + iw, h / 2);
  shape.lineTo(x, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, y + ih);
  shape.lineTo(-w / 2, y);
  shape.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: d - r,
    bevelEnabled: true,
    bevelThickness: r * 0.8,
    bevelSize: r * 0.6,
    bevelSegments: 4,
    curveSegments: 12,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

/** Soft radial blob used as a cheap contact shadow. */
function buildShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(43,20,9,0.55)');
  grad.addColorStop(0.55, 'rgba(43,20,9,0.22)');
  grad.addColorStop(1, 'rgba(43,20,9,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/**
 * Studio environment, rendered on-GPU from emissive planes. Equivalent to
 * drei's <Environment><Lightformer/></Environment>, minus the reconciler.
 */
function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#241c17');

  const panel = (color: string, intensity: number, pos: [number, number, number], scale: [number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(scale[0], scale[1]),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };

  panel('#ffd9a8', 3.4, [-4, 5, 3], [8, 8]); // warm brass key
  panel('#9ecbe8', 1.5, [5, 1.5, 2], [6, 6]); // cool petrol fill
  panel('#ffffff', 1.1, [0, 7, -2], [10, 4]); // top bounce
  panel('#c08a4e', 0.7, [0, -4, 2], [8, 3]); // warm floor bounce

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0.04);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.35, 11.8);
    camera.lookAt(0, 0, 0);

    const envMap = buildEnvironment(renderer);
    scene.environment = envMap;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffe6c4, 1.5);
    key.position.set(-4, 6, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa8d0ea, 0.5);
    fill.position.set(5, 2, 3);
    scene.add(fill);

    /* --- objects ---
       At rest (progress 0) the parts sit in an EXPLODED stack so the section
       reads as a dental implant the moment it appears; scrolling assembles and
       seats them. An earlier version started the parts above the frame, so
       until you scrolled the canvas showed nothing but a beige block.
       Three-quarter yaw keeps the bone from reading as a flat box. */
    const root = new THREE.Group();
    root.position.y = -3.25;
    root.rotation.y = -0.55;
    scene.add(root);

    // Bone kept deliberately shallow: at 2.35 tall it dominated the frame and
    // read as a plain beige box rather than a bed for the implant.
    const boneGeo = buildRoundedBox(3.0, 1.9, 1.7, 0.16);
    const boneMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8dcc8,
      roughness: 0.92,
      metalness: 0,
      clearcoat: 0.06,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xb99b74),
      // `transparent` is set ONCE, here. Flipping it at runtime requires a
      // shader recompile (material.needsUpdate = true); without that the bone
      // silently stayed opaque and the osseointegration reveal never happened.
      // Declaring it up front and animating only `opacity` avoids the recompile
      // entirely.
      transparent: true,
      opacity: 1,
    });
    const bone = new THREE.Mesh(boneGeo, boneMat);
    bone.position.set(0, 0.85, -0.3);
    root.add(bone);

    const gumGeo = buildRoundedBox(3.06, 0.28, 1.76, 0.12);
    const gum = new THREE.Mesh(
      gumGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xb9705d,
        roughness: 0.62,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.5,
        sheen: 0.6,
        sheenColor: new THREE.Color(0xe0a08c),
      }),
    );
    gum.position.set(0, 1.9, -0.3);
    root.add(gum);

    const titanium = new THREE.MeshStandardMaterial({
      color: 0xc9ccd1,
      metalness: 1,
      roughness: 0.29,
      envMapIntensity: 1.15,
    });

    // Post + abutment + crown live in ONE group.
    //
    // They were previously animated as three independently exploding parts.
    // That was fragile to frame — the exploded stack was taller than the
    // viewport, so the section opened on a beige block with the implant
    // off-screen — and it read as parts falling in from nowhere. A single
    // complete implant threading down into the jaw is legible from the first
    // frame and leaves only one thing to keep framed.
    const implant = new THREE.Group();
    root.add(implant);

    const postGeo = buildPost();
    const postGroup = new THREE.Group();
    postGroup.add(new THREE.Mesh(postGeo, titanium));
    implant.add(postGroup);

    const abutGeo = buildAbutment();
    const abutGroup = new THREE.Group();
    abutGroup.add(
      new THREE.Mesh(
        abutGeo,
        new THREE.MeshStandardMaterial({
          color: 0xd5d2cb,
          metalness: 1,
          roughness: 0.36,
          envMapIntensity: 1.1,
        }),
      ),
    );
    abutGroup.position.y = 2.16;
    implant.add(abutGroup);

    const crownGeo = buildCrown();
    const crownGroup = new THREE.Group();
    crownGroup.add(
      new THREE.Mesh(
        crownGeo,
        // Feldspathic ceramic: high clearcoat, faint transmission, warm body.
        new THREE.MeshPhysicalMaterial({
          color: 0xf6f1e8,
          roughness: 0.22,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          transmission: 0.18,
          thickness: 0.6,
          ior: 1.54,
          sheen: 0.5,
          sheenColor: new THREE.Color(0xffe9d2),
          envMapIntensity: 1.3,
        }),
      ),
    );
    crownGroup.position.y = 3.42;
    implant.add(crownGroup);

    const shadowTex = buildShadowTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 11),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.52;
    scene.add(shadow);

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

    /* --- only run while on screen --- */
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

      shown = damp(shown, progress.current, 4.5, dt);
      const p = shown;

      // The complete implant descends and threads into the jaw.
      const tSeat = easeOutQuint(seg(p, 0.05, 0.72));
      implant.position.y = lerp(1.9, 0, tSeat);
      implant.rotation.y = (1 - tSeat) * Math.PI * 4;

      // Bone turns translucent to reveal osseointegration. `transparent` is
      // already true on the material, so only opacity moves here.
      const tBone = seg(p, 0.72, 1);
      boneMat.opacity = lerp(1, 0.34, tBone);

      // The group rises and the camera eases in as the implant seats, keeping
      // the subject framed from hovering to fully placed.
      const tFrame = easeOutQuint(seg(p, 0, 0.85));
      root.position.y = lerp(-3.14, -2.19, tFrame);
      camera.position.z = lerp(10.6, 7.8, tFrame);
      camera.lookAt(0, 0, 0);

      // Ambient presentation orbit; held still under reduced motion.
      const idle = reduced ? 0 : Math.sin(clock.elapsedTime * 0.18) * 0.12;
      root.rotation.y = -0.55 + idle + p * 0.5;
      root.rotation.x = -0.04 + p * 0.06;

      renderer.render(scene, camera);
    };
    tick();

    /* --- teardown: three.js does not garbage collect GPU resources --- */
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
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
