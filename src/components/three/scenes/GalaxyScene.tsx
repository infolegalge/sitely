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

         Planet is NEVER centered — always off-screen-center in
         beautiful asymmetric compositions. Camera orbits ~400°
         with varied distance, height, and framing offset.

         lookX/lookY push the look-target AWAY from origin,
         placing the planet in corners/edges of the frame.

         KF0: Hero        — planet far LEFT
         KF1: Work        — planet upper-RIGHT, pulling away
         KF2: FeaturedWork— planet lower-LEFT,  close fly-by
         KF3: Services    — planet far RIGHT,   distant profile
         KF4: Process     — planet upper-LEFT,  overhead sweep
         KF5: Testimonials— planet lower-RIGHT, intimate drift
         ══════════════════════════════════════════════════════════ */
      gal.position.set(0, 0, 0);
      gal.scale.setScalar(1.0);

      const scrollP = scrollRef.current;
      const mob = isMobile;

      /* ─── Keyframe definitions ─── */
      /* angleDeg, radius, height, lookX, lookY, fov */
      const KF: [number, number, number, number, number, number][] = mob
        ? [
            /*  angle   r    h    lookX  lookY  fov  */
            [    0,    28,  10,    18,    -5,   58 ],  // KF0 planet far left
            [   65,    34,  20,   -16,    -8,   54 ],  // KF1 planet upper-right, distant
            [  140,    22,   4,    14,     8,   62 ],  // KF2 planet lower-left, close
            [  210,    36,  16,   -20,    -3,   52 ],  // KF3 planet far right, distant
            [  290,    24,  26,    12,   -10,   56 ],  // KF4 planet upper-left, overhead
            [  380,    20,   6,   -14,     6,   58 ],  // KF5 planet lower-right, intimate
          ]
        : [
            [    0,    40,  15,    32,    -6,   48 ],  // KF0 planet far left (intro end)
            [   70,    52,  28,   -28,   -10,   44 ],  // KF1 planet upper-right, pulling far
            [  150,    30,   4,    24,    12,   54 ],  // KF2 planet lower-left, close fly-by
            [  220,    55,  20,   -32,    -5,   42 ],  // KF3 planet far right, cinematic wide
            [  300,    35,  35,    20,   -14,   50 ],  // KF4 planet upper-left, bird's eye
            [  400,    28,   8,   -22,     8,   46 ],  // KF5 planet lower-right, intimate drift
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
