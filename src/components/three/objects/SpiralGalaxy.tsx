"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Particle Counts ─── */
const ARMS = 2;
const CORE_GLOW = 30;

/* ─── Galaxy Shape ─── */
const RADIUS = 150;
const WIND = 3.0;
const ARM_W = 12;
const DISK_H = 3;
const BULGE_R = 25;
const BULGE_HT = 10;

/* ─── Colors — richer palette ─── */
const C_CORE   = new THREE.Color("#fffaf0");
const C_INNER  = new THREE.Color("#e0c0ff");  // soft lavender
const C_ARM    = new THREE.Color("#6b8cff");  // blue
const C_OUTER  = new THREE.Color("#3a5ce4");  // deep blue
const C_PINK   = new THREE.Color("#ff5c8a");  // hot pink nebula
const C_CYAN   = new THREE.Color("#00e5ff");  // cyan star-forming
const C_TEAL   = new THREE.Color("#06d6a0");  // teal
const C_AMBER  = new THREE.Color("#ffb347");  // warm amber
const C_VIOLET = new THREE.Color("#b06cff");  // rich violet
const C_GOLD   = new THREE.Color("#ffd700");  // golden core stars
const C_HALO   = new THREE.Color("#7888b8");
const C_ROSE   = new THREE.Color("#ff6b9d");  // dusty rose

/* ─── Data generation ─── */
function generate(mobile: boolean) {
  const PER_ARM = mobile ? 800 : 1500;
  const BULGE = mobile ? 600 : 1200;
  const HALO = mobile ? 200 : 350;
  const DUST = mobile ? 400 : 800;
  const NEBULA = mobile ? 200 : 400;
  const TOTAL = ARMS * PER_ARM + BULGE + CORE_GLOW + HALO + DUST + NEBULA;

  const pos = new Float32Array(TOTAL * 3);
  const col = new Float32Array(TOTAL * 3);
  const siz = new Float32Array(TOTAL);
  const rnd = new Float32Array(TOTAL);
  const tc = new THREE.Color();
  let i = 0;

  const put = (x: number, y: number, z: number, c: THREE.Color, s: number) => {
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
    siz[i] = s;
    rnd[i] = Math.random() * Math.PI * 2;
    i++;
  };

  // --- Spiral Arms (multi-color) ---
  for (let a = 0; a < ARMS; a++) {
    const off = (a / ARMS) * Math.PI * 2;
    for (let j = 0; j < PER_ARM; j++) {
      const t = Math.pow(Math.random(), 0.7);
      const r = t * RADIUS + 2;
      const th = off + WIND * t + (Math.random() - 0.5) * 0.3;
      const scatter = (Math.random() - 0.5) * ARM_W * (0.5 + t);
      const perp = th + Math.PI / 2;
      const x = Math.cos(th) * r + Math.cos(perp) * scatter;
      const z = Math.sin(th) * r + Math.sin(perp) * scatter;
      const y = (Math.random() - 0.5) * DISK_H * Math.exp(-t * 1.5);

      const ct = r / RADIUS;
      // Base gradient: core → lavender → blue → deep blue
      if (ct < 0.1) tc.lerpColors(C_CORE, C_GOLD, ct / 0.1);
      else if (ct < 0.2) tc.lerpColors(C_GOLD, C_INNER, (ct - 0.1) / 0.1);
      else if (ct < 0.5) tc.lerpColors(C_INNER, C_ARM, (ct - 0.2) / 0.3);
      else tc.lerpColors(C_ARM, C_OUTER, (ct - 0.5) / 0.5);

      // Random color variations in the arms
      const roll = Math.random();
      if (ct > 0.15 && ct < 0.6 && roll < 0.08)
        tc.lerp(C_PINK, 0.5 + Math.random() * 0.4);
      else if (ct > 0.2 && ct < 0.7 && roll < 0.14)
        tc.lerp(C_CYAN, 0.3 + Math.random() * 0.4);
      else if (ct > 0.1 && ct < 0.4 && roll < 0.18)
        tc.lerp(C_VIOLET, 0.3 + Math.random() * 0.3);
      else if (ct > 0.3 && ct < 0.8 && roll < 0.22)
        tc.lerp(C_TEAL, 0.2 + Math.random() * 0.3);

      put(x, y, z, tc, 0.3 + Math.random() * 1.5 * (1 - ct * 0.5));
    }
  }

  // --- Central Bulge (warm golden core) ---
  for (let j = 0; j < BULGE; j++) {
    const r = Math.pow(Math.random(), 2.5) * BULGE_R;
    const th = Math.random() * Math.PI * 2;
    const ph = (Math.random() - 0.5) * Math.PI * 0.8;
    const x = Math.cos(th) * Math.cos(ph) * r;
    const y = Math.sin(ph) * r * (BULGE_HT / BULGE_R);
    const z = Math.sin(th) * Math.cos(ph) * r;
    const ct = r / BULGE_R;
    // Warm gradient: white → gold → lavender
    if (ct < 0.4) tc.lerpColors(C_CORE, C_GOLD, ct / 0.4);
    else tc.lerpColors(C_GOLD, C_INNER, (ct - 0.4) / 0.6);
    // Occasional amber/violet pop
    if (Math.random() < 0.06) tc.lerp(C_AMBER, 0.4);
    if (Math.random() < 0.04) tc.lerp(C_VIOLET, 0.3);
    put(x, y, z, tc, 0.5 + Math.random() * 2.0 * (1 - ct));
  }

  // --- Core Glow (large soft particles) ---
  for (let j = 0; j < CORE_GLOW; j++) {
    const x = (Math.random() - 0.5) * 4;
    const y = (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 4;
    tc.copy(C_CORE);
    if (Math.random() < 0.3) tc.lerp(C_GOLD, 0.3);
    put(x, y, z, tc, 4.0 + Math.random() * 8.0);
  }

  // --- Halo ---
  for (let j = 0; j < HALO; j++) {
    const r = (0.2 + Math.random() * 1.3) * RADIUS;
    const th = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * DISK_H * 5;
    tc.copy(C_HALO);
    if (Math.random() < 0.15) tc.lerp(C_VIOLET, 0.2);
    put(Math.cos(th) * r, y, Math.sin(th) * r, tc, 0.2 + Math.random() * 0.5);
  }

  // --- Dust (warm pink/rose patches in arms) ---
  for (let j = 0; j < DUST; j++) {
    const t = 0.15 + Math.random() * 0.55;
    const r = t * RADIUS;
    const arm = Math.floor(Math.random() * ARMS);
    const off = (arm / ARMS) * Math.PI * 2;
    const th = off + WIND * t + (Math.random() - 0.5) * 0.5;
    const scatter = (Math.random() - 0.5) * ARM_W * 2;
    const perp = th + Math.PI / 2;
    const x = Math.cos(th) * r + Math.cos(perp) * scatter;
    const z = Math.sin(th) * r + Math.sin(perp) * scatter;
    const y = (Math.random() - 0.5) * DISK_H * 1.5;
    // Varied dust: rose, pink, amber, violet
    const pick = Math.random();
    if (pick < 0.3) tc.copy(C_ROSE);
    else if (pick < 0.55) tc.copy(C_PINK);
    else if (pick < 0.75) tc.copy(C_AMBER);
    else tc.copy(C_VIOLET);
    tc.multiplyScalar(0.35 + Math.random() * 0.65);
    put(x, y, z, tc, 1.5 + Math.random() * 4.0);
  }

  // --- Nebula patches (large, colorful, glowing clouds) ---
  for (let j = 0; j < NEBULA; j++) {
    const t = 0.1 + Math.random() * 0.7;
    const r = t * RADIUS;
    const arm = Math.floor(Math.random() * ARMS);
    const off = (arm / ARMS) * Math.PI * 2;
    const th = off + WIND * t + (Math.random() - 0.5) * 0.8;
    const scatter = (Math.random() - 0.5) * ARM_W * 2.5;
    const perp = th + Math.PI / 2;
    const x = Math.cos(th) * r + Math.cos(perp) * scatter;
    const z = Math.sin(th) * r + Math.sin(perp) * scatter;
    const y = (Math.random() - 0.5) * DISK_H * 2.0;
    // Vibrant nebula colors
    const pick = Math.random();
    if (pick < 0.2) tc.copy(C_CYAN);
    else if (pick < 0.38) tc.copy(C_TEAL);
    else if (pick < 0.55) tc.copy(C_VIOLET);
    else if (pick < 0.72) tc.copy(C_PINK);
    else if (pick < 0.86) tc.copy(C_ROSE);
    else tc.copy(C_AMBER);
    tc.multiplyScalar(0.25 + Math.random() * 0.55);
    put(x, y, z, tc, 4.0 + Math.random() * 8.0);
  }

  return { positions: pos, colors: col, sizes: siz, randoms: rnd };
}

/* ─── Shaders ─── */
const vert = /* glsl */ `
  attribute float aSize;
  attribute float aRandom;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uBrightness;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Slow galactic rotation
    float a = uTime * 0.015;
    float ca = cos(a), sa = sin(a);
    vec3 p = position;
    p.xz = vec2(ca * p.x - sa * p.z, sa * p.x + ca * p.z);

    // Subtle twinkle
    float twinkle = 0.75 + 0.25 * sin(uTime * 1.5 + aRandom * 6.28);

    vColor = aColor;
    vAlpha = twinkle * uBrightness;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * (250.0 / -mv.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 50.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float g = 1.0 - smoothstep(0.0, 0.5, d);
    g = pow(g, 1.5);
    gl_FragColor = vec4(vColor, g * vAlpha);
  }
`;

interface SpiralGalaxyProps {
  brightnessRef?: { current: number };
  isMobile?: boolean;
}

export default function SpiralGalaxy({ brightnessRef, isMobile }: SpiralGalaxyProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const data = useMemo(() => generate(!!isMobile), [isMobile]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(data.sizes, 1));
    g.setAttribute("aRandom", new THREE.BufferAttribute(data.randoms, 1));
    return g;
  }, [data]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      if (brightnessRef) {
        matRef.current.uniforms.uBrightness.value = brightnessRef.current;
      }
    }
  });

  return (
    <points frustumCulled={false}>
      <primitive object={geo} attach="geometry" />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uBrightness: { value: 1.0 },
        }}
      />
    </points>
  );
}
