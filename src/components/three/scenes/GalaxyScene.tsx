"use client";

import { useRef } from "react";
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
      /* ── Inside core — camera stops completely ── */
      gal.position.set(0, 0, 0);
      gal.scale.setScalar(1.0);

      // Fixed position at journey end (angle=4π, radius=endOrbit)
      const finalR = isMobile ? 30 : 40;
      const finalH = isMobile ? 12 : 15;
      dPos.current.set(
        Math.sin(Math.PI * 4.0) * finalR,
        finalH,
        Math.cos(Math.PI * 4.0) * finalR,
      );
      dTgt.current.set(isMobile ? 20 : 32, isMobile ? -4 : -6, 0);
      targetFov = isMobile ? 58 : 48;
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
