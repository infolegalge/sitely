"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Config ─── */
const GALAXY_COUNT = 28;
const SUN_COUNT = 14;
const TOTAL = GALAXY_COUNT + SUN_COUNT;
const SHELL_RADIUS = 450; // between camera orbit (~40) and distant stars (600)

/* ─── Shaders ─── */
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aType;   // 0 = galaxy, 1 = sun
  attribute vec3 aColor;
  attribute float aPhase;  // random 0-1, used for tilt/rotation
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vType;
  varying float vAlpha;
  varying float vPhase;

  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float twinkle = 0.85 + 0.15 * sin(uTime * 0.8 + aPhase * 6.28);

    float baseSize = aType > 0.5 ? aSize * 0.6 : aSize;
    gl_PointSize = baseSize * (800.0 / -mvPos.z) * twinkle;
    gl_PointSize = clamp(gl_PointSize, 3.0, 60.0);

    vColor = aColor;
    vType = aType;
    vAlpha = uOpacity * twinkle;
    vPhase = aPhase;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vType;
  varying float vAlpha;
  varying float vPhase;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;

    if (vType < 0.5) {
      /* ── Galaxy: elliptical disk + spiral arm hints ── */

      // Per-galaxy tilt angle from vPhase
      float tilt = vPhase * 3.14159;
      float ca = cos(tilt);
      float sa = sin(tilt);
      vec2 ruv = vec2(uv.x * ca - uv.y * sa, uv.x * sa + uv.y * ca);

      // Flatten into ellipse (disk seen at angle)
      float flatten = 0.35 + vPhase * 0.3; // 0.35–0.65 axis ratio
      ruv.y /= flatten;

      float d = length(ruv);
      if (d > 0.5) discard;

      // Bright core
      float core = exp(-d * 12.0) * 1.0;

      // Disk falloff — exponential profile like real galaxies
      float disk = exp(-d * 4.0) * 0.35;

      // Spiral arm hints — angular brightness variation
      float angle = atan(ruv.y, ruv.x);
      float spiral = sin(angle * 2.0 + d * 18.0 - uTime * 0.15 + vPhase * 6.28);
      spiral = spiral * 0.5 + 0.5; // 0-1
      float armBright = spiral * exp(-d * 5.0) * 0.25;

      float glow = core + disk + armBright;

      // Slight color variation — core warmer, edges bluer
      vec3 col = mix(vColor * 1.2, vColor * vec3(0.7, 0.8, 1.3), d * 2.0);

      gl_FragColor = vec4(col, glow * vAlpha);

    } else {
      /* ── Star/Sun: sharp core + 4-ray diffraction spikes ── */
      float d = length(uv);
      if (d > 0.5) discard;

      // Bright pinpoint core
      float core = exp(-d * 20.0) * 1.0;

      // Soft glow halo
      float halo = exp(-d * 5.0) * 0.3;

      // 4-ray diffraction spikes
      float angle = atan(uv.y, uv.x);
      float spike = pow(abs(cos(angle * 2.0 + vPhase * 3.14159)), 32.0);
      spike *= exp(-d * 6.0) * 0.5;

      float glow = core + halo + spike;
      gl_FragColor = vec4(vColor, glow * vAlpha);
    }
  }
`;

interface DistantGalaxiesProps {
  opacityRef?: { current: number };
  isMobile?: boolean;
}

export default function DistantGalaxies({ opacityRef, isMobile }: DistantGalaxiesProps) {
  const total = isMobile ? Math.floor(TOTAL * 0.6) : TOTAL;
  const galaxyN = isMobile ? Math.floor(GALAXY_COUNT * 0.6) : GALAXY_COUNT;
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const types = new Float32Array(total);
    const colors = new Float32Array(total * 3);
    const phases = new Float32Array(total);

    /* Galaxy color palette: soft pastels seen from afar */
    const galaxyColors = [
      [0.6, 0.65, 1.0],   // blue-white spiral
      [1.0, 0.75, 0.5],   // warm gold elliptical
      [0.7, 0.5, 1.0],    // violet dwarf
      [0.5, 0.9, 1.0],    // cyan barred spiral
      [1.0, 0.6, 0.7],    // rose irregular
      [0.85, 0.85, 1.0],  // silver lenticular
    ];

    /* Sun colors: warm stellar types */
    const sunColors = [
      [1.0, 0.95, 0.8],   // white-yellow (F-type)
      [1.0, 0.8, 0.5],    // orange (K-type)
      [1.0, 0.6, 0.3],    // red-orange (M-type)
      [0.8, 0.85, 1.0],   // blue-white (A-type)
      [1.0, 0.9, 0.7],    // yellow (G-type / Sol)
    ];

    for (let i = 0; i < total; i++) {
      const isGalaxy = i < galaxyN;

      // Distribute on a shell with slight randomness — avoid clustering near poles
      const theta = Math.random() * Math.PI * 2;
      // Bias toward equatorial band (horizon) for cinematic feel
      const phiBase = Math.PI * 0.5; // equator
      const phiSpread = Math.PI * 0.35; // ±63° from equator
      const phi = phiBase + (Math.random() - 0.5) * 2 * phiSpread;

      const r = SHELL_RADIUS * (0.85 + Math.random() * 0.3);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i * 3 + 2] = Math.cos(phi) * r;

      if (isGalaxy) {
        sizes[i] = 12 + Math.random() * 18; // larger soft blobs
        types[i] = 0;
        const c = galaxyColors[Math.floor(Math.random() * galaxyColors.length)];
        colors[i * 3] = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
      } else {
        sizes[i] = 6 + Math.random() * 10; // smaller bright points
        types[i] = 1;
        const c = sunColors[Math.floor(Math.random() * sunColors.length)];
        colors[i * 3] = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
      }

      phases[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aType", new THREE.BufferAttribute(types, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, galaxyN]);

  useFrame((state) => {
    if (!matRef.current) return;
    const elapsed = state.clock.elapsedTime;
    matRef.current.uniforms.uTime.value = elapsed;
    if (opacityRef) {
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <points frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0 },
        }}
      />
    </points>
  );
}
