"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import HyperspaceEffect from "../objects/HyperspaceEffect";
import SpiralGalaxy from "../objects/SpiralGalaxy";
import GalacticCore from "../objects/GalacticCore";
import DistantStars from "../objects/DistantStars";

/* ─── Timeline ─── */
const T = {
  APPEAR: 1.5,          // hyperspace ends, journey begins
  JOURNEY_END: 6.0,     // spiral complete, at core
};

/* ─── Helpers ─── */
function ss(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function GalaxyScene({ isMobile = false }: { isMobile?: boolean }) {
  const galaxyRef = useRef<THREE.Group>(null);
  const startRef = useRef(-1);
  const galaxyBrightness = useRef(1);
  const starsOpacity = useRef(0);

  const sPos = useRef(new THREE.Vector3(0, 0, 0));
  const sTgt = useRef(new THREE.Vector3(0, 0, -1));
  const sFov = useRef(90);
  const dPos = useRef(new THREE.Vector3());
  const dTgt = useRef(new THREE.Vector3());
  const scrollRef = useRef(0);

  /* ─── Scroll listener for post-journey orbit ─── */
  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = docH > 0 ? window.scrollY / docH : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((state, delta) => {
    if (startRef.current < 0) startRef.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startRef.current;
    const cam = state.camera as THREE.PerspectiveCamera;
    const gal = galaxyRef.current;
    if (!gal) return;

    const dt = Math.min(delta, 0.1);
    let targetFov = 60;

    if (t < T.APPEAR) {
      /* ── Hyperspace — camera at origin, galaxy invisible ── */
      gal.position.set(0, 0, -800);
      gal.scale.setScalar(0);
      dPos.current.set(0, 0, 0);
      dTgt.current.set(0, 0, -1);
      targetFov = 90;
      galaxyBrightness.current = 1;
      starsOpacity.current = 0;

    } else if (t < T.JOURNEY_END) {
      /* ══════════════════════════════════════════════════════
         ONE continuous parametric curve — no phase boundaries.
         
         Raw p: 0→1 linear across the journey.
         Warped q: fast in the middle (grand tour), 
                   slow at end (arrival at planetary system).
         ══════════════════════════════════════════════════════ */
      const pRaw = (t - T.APPEAR) / (T.JOURNEY_END - T.APPEAR);

      // Warp: speed up early/mid, decelerate strongly at end.
      // q accelerates through 0–0.7 of p, then eases into 1.
      // Using a shaped power curve: fast cruise, gentle arrival.
      const q = pRaw < 0.55
        ? pRaw * (1.0 / 0.55) * 0.85                          // 0→0.85 (fast cruise)
        : 0.85 + (1 - Math.pow(1 - (pRaw - 0.55) / 0.45, 2.5)) * 0.15; // 0.85→1 (slow arrival)

      // ── Galaxy flies in during first ~20% of q ──
      const galP = ss(0, 0.2, q);
      gal.position.z = mix(-600, 0, galP);
      gal.scale.setScalar(mix(0.01, 1.0, galP));

      // ── Continuous spiral angle — 2 full orbits for grand tour ──
      const angle = q * Math.PI * 4.0;

      // ── Radius: 0 → 300 (wide, feel the scale) → 40 (core) ──
      const outward = 1 - Math.pow(1 - Math.min(q * 3.0, 1.0), 3);
      const maxOrbit = isMobile ? 200 : 300;
      const endOrbit = isMobile ? 30 : 40;
      const orbitR = mix(maxOrbit, endOrbit, q * q);
      const radius = orbitR * outward;

      // ── Height: sweeping oscillation — above, edge, below, above ──
      const heightRise = 1 - Math.pow(1 - Math.min(q * 2.0, 1.0), 2);
      const maxH = isMobile ? 50 : 80;
      const endH = isMobile ? 12 : 15;
      const heightBase = mix(maxH, endH, q) * heightRise;
      const oscAmp = isMobile ? 30 : 50;
      const heightOsc = Math.sin(angle * 0.5) * mix(oscAmp, 0, q * q) * heightRise;
      const height = heightBase + heightOsc;

      dPos.current.set(
        Math.sin(angle) * radius,
        height,
        Math.cos(angle) * radius,
      );

      // Look target: galaxy (moving) early → offset right+up (sun centered-right on screen)
      const lookZ = gal.position.z * (1 - ss(0.15, 0.4, q));
      const offsetX = ss(0.7, 1.0, q) * (isMobile ? 20 : 32);
      const offsetY = ss(0.7, 1.0, q) * (isMobile ? -4 : -6);
      dTgt.current.set(offsetX, offsetY, lookZ);

      const endFov = isMobile ? 58 : 48;
      targetFov = mix(isMobile ? 100 : 90, endFov, ss(0, 0.5, q));

      // Galaxy fades out in last 20% of q, distant stars fade in
      galaxyBrightness.current = 1 - ss(0.8, 0.95, q);
      starsOpacity.current = ss(0.85, 1.0, q);

    } else {
      /* ══════════════════════════════════════════════════════════
         CINEMATIC KEYFRAME CAMERA PATH

         6 handcrafted compositions — one per page section.
         Each keyframe defines a unique angle, distance, height,
         and screen-framing of the Sitely planet.

         Camera orbits ~330° total with varied compositions:
         KF0: Hero        — planet LEFT,   wide establishing
         KF1: Transition  — planet CENTER, sweeping mid-orbit
         KF2: FeaturedWork— planet TOP,    dramatic low upshot
         KF3: Services    — planet RIGHT,  elegant profile
         KF4: Process     — planet BELOW,  elevated bird's eye
         KF5: Testimonials— planet CENTER, intimate close-up
         ══════════════════════════════════════════════════════════ */
      gal.position.set(0, 0, 0);
      gal.scale.setScalar(1.0);

      const scrollP = scrollRef.current;
      const mob = isMobile;

      /* ─── Keyframe definitions ─── */
      /* angleDeg, radius, height, lookX, lookY, fov */
      const KF: [number, number, number, number, number, number][] = mob
        ? [
            /*  angle   r    h   lookX lookY  fov  */
            [    0,    28,  10,   20,   -4,   58 ],  // KF0 Hero — planet left
            [   50,    26,  14,    6,   -1,   55 ],  // KF1 sweep center-left
            [  110,    24,   2,    0,    7,   60 ],  // KF2 low upshot
            [  180,    30,  12,  -14,   -3,   54 ],  // KF3 planet right
            [  250,    22,  22,    3,   -8,   58 ],  // KF4 bird's eye
            [  330,    18,   6,    1,    1,   50 ],  // KF5 intimate
          ]
        : [
            [    0,    40,  15,   32,   -6,   48 ],  // KF0 Hero — intro end
            [   50,    38,  22,   10,   -2,   46 ],  // KF1 sweep center-left
            [  110,    35,   3,    0,   10,   52 ],  // KF2 dramatic low upshot
            [  185,    42,  18,  -20,   -4,   45 ],  // KF3 elegant profile right
            [  255,    32,  30,    5,  -12,   50 ],  // KF4 elevated bird's eye
            [  335,    28,  10,    2,    1,   42 ],  // KF5 intimate close-up
          ];

      const N = KF.length - 1; // 5 segments

      /* Find which two keyframes we're between */
      const raw = scrollP * N;
      const idx = Math.min(Math.floor(raw), N - 1);
      const frac = raw - idx;

      /* Smoothstep for buttery easing between keyframes */
      const sf = frac * frac * (3 - 2 * frac);

      const a = KF[idx];
      const b = KF[idx + 1];

      /* Interpolate all 6 channels */
      const angleDeg = mix(a[0], b[0], sf);
      const radius   = mix(a[1], b[1], sf);
      const height   = mix(a[2], b[2], sf);
      const lookX    = mix(a[3], b[3], sf);
      const lookY    = mix(a[4], b[4], sf);
      targetFov      = mix(a[5], b[5], sf);

      const angleRad = (angleDeg * Math.PI) / 180;

      dPos.current.set(
        Math.sin(angleRad) * radius,
        height,
        Math.cos(angleRad) * radius,
      );

      dTgt.current.set(lookX, lookY, 0);

      galaxyBrightness.current = 0;
      starsOpacity.current = 1;
    }

    // Soft exponential smoothing — absorbs all remaining micro-jumps
    const alpha = 1 - Math.exp(-2.5 * dt);
    sPos.current.lerp(dPos.current, alpha);
    sTgt.current.lerp(dTgt.current, alpha);
    sFov.current += (targetFov - sFov.current) * alpha;

    cam.position.copy(sPos.current);
    cam.lookAt(sTgt.current);
    cam.fov = sFov.current;
    cam.updateProjectionMatrix();
  });

  return (
    <>
      <HyperspaceEffect isMobile={isMobile} />
      <DistantStars opacityRef={starsOpacity} isMobile={isMobile} />
      <group ref={galaxyRef} rotation={[-0.12, 0, 0.05]}>
        <SpiralGalaxy brightnessRef={galaxyBrightness} isMobile={isMobile} />
        <GalacticCore isMobile={isMobile} />
      </group>
    </>
  );
}
