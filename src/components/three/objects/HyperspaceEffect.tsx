"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isAlreadyLoaded } from "@/lib/preloaderState";

/* ─── Config ─── */
const FIELD_DEPTH = 1500;
const FIELD_RADIUS = 100;
const WARP_SPEED = 500;

/* ─── Timing (camera FOV handled by GalaxyScene) ─── */
const DECEL_START = 0.3;    // start slowing
const DECEL_END = 0.7;      // fully stopped
const FADE_START = 0.5;     // start fading
const FADE_END = 1.0;       // fully invisible

/* ─── Vertex Shader ─── */
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uSpeedMult;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vStreak;
  varying vec2 vScreenDir;

  void main() {
    vec3 pos = position;

    // Move stars toward camera (+z)
    float travel = aSpeed * uTime * ${WARP_SPEED.toFixed(1)};
    float depth = ${FIELD_DEPTH.toFixed(1)};
    pos.z = -mod(-pos.z - travel, depth);

    float speed01 = clamp(uSpeedMult, 0.0, 1.0);
    vStreak = speed01;

    // Depth fading
    float nearFade = smoothstep(0.0, -50.0, pos.z);
    float farFade = smoothstep(-depth, -depth + 300.0, pos.z);
    vAlpha = nearFade * farFade * uOpacity;

    // Project to clip space
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Screen-space direction from center (for radial streaking)
    vec2 ndc = gl_Position.xy / gl_Position.w;
    float edgeDist = length(ndc);
    vScreenDir = normalize(ndc + 0.001); // direction from center

    // Size: bigger at warp, scaled by edge distance for tunnel feel
    float edgeBoost = 1.0 + edgeDist * 2.0;
    float streakBoost = 1.0 + speed01 * 6.0;
    gl_PointSize = aSize * streakBoost * edgeBoost * (250.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 80.0);
  }
`;

/* ─── Fragment Shader — radial streak from screen center ─── */
const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vStreak;
  varying vec2 vScreenDir;
  uniform vec3 uColorWarm;
  uniform vec3 uColorCool;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;

    // Rotate UV so streak aligns with radial direction from screen center
    float angle = atan(vScreenDir.y, vScreenDir.x);
    float ca = cos(-angle);
    float sa = sin(-angle);
    vec2 rotUV = vec2(
      uv.x * ca - uv.y * sa,
      uv.x * sa + uv.y * ca
    );

    // Stretch along radial direction at high speed
    float streakLen = 1.0 + vStreak * 12.0;
    rotUV.x *= streakLen;

    float d = length(rotUV);
    if (d > 0.5) discard;

    // Core glow
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.3);

    // Bright core, warm tint on edges at warp speed
    vec3 color = mix(uColorCool, uColorWarm, vStreak * 0.6 + d * 0.4);

    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

interface HyperspaceEffectProps {
  isMobile?: boolean;
}

export default function HyperspaceEffect({ isMobile }: HyperspaceEffectProps) {
  const STAR_COUNT = isMobile ? 750 : 1500;
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTimeRef = useRef<number>(-1);

  // Generate star field
  const { positions, sizes, speeds } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    const sp = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = (0.3 + Math.pow(Math.random(), 0.4) * 0.7) * FIELD_RADIUS;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = -(Math.random() * FIELD_DEPTH);

      sz[i] = 0.6 + Math.random() * 2.0;
      sp[i] = 0.5 + Math.random() * 1.0;
    }
    return { positions: pos, sizes: sz, speeds: sp };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STAR_COUNT]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;

    if (startTimeRef.current < 0) {
      if (!isAlreadyLoaded()) return;
      startTimeRef.current = state.clock.elapsedTime;
      if (meshRef.current) meshRef.current.visible = true;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;

    // Speed: full → decelerate → stop
    let speedMult: number;
    if (elapsed < DECEL_START) {
      speedMult = 1.0;
    } else if (elapsed < DECEL_END) {
      const t = (elapsed - DECEL_START) / (DECEL_END - DECEL_START);
      speedMult = 1.0 - t * t * (3 - 2 * t);
    } else {
      speedMult = 0.0;
    }

    // Opacity: full → fade out
    let opacity: number;
    if (elapsed < FADE_START) {
      opacity = 1.0;
    } else if (elapsed < FADE_END) {
      const t = (elapsed - FADE_START) / (FADE_END - FADE_START);
      opacity = 1.0 - t * t;
    } else {
      opacity = 0.0;
    }

    mat.uniforms.uTime.value = elapsed;
    mat.uniforms.uSpeedMult.value = speedMult;
    mat.uniforms.uOpacity.value = opacity;

    // Hide after fully faded
    if (elapsed > FADE_END + 0.5 && meshRef.current) {
      meshRef.current.visible = false;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return geo;
  }, [positions, sizes, speeds]);

  return (
    <points ref={meshRef} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uSpeedMult: { value: 1.0 },
          uOpacity: { value: 1.0 },
          uColorWarm: { value: new THREE.Color("#fef3c7") },
          uColorCool: { value: new THREE.Color("#e0e7ff") },
        }}
      />
    </points>
  );
}
