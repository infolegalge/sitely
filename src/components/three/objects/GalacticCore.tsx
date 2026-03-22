"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createLogoTextures } from "./logoTextures";

/* ═══════════════════════════════════════════════════════
   GalacticCore — 3D Branding Planet

   • Orange cosmic dust nebula with crystal sparkles
   • 3 armillary orbital rings (tilted, rotating, with flares)
   • "SITELY" text in warm orange, billboard
   • Central warm glow
   ═══════════════════════════════════════════════════════ */

/* ─── Cosmic Dust Shader (crystal sparkle particles) ─── */
const dustVert = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  varying float vPhase;
  varying float vDist;
  uniform float uTime;

  void main() {
    vPhase = aPhase;
    vec3 p = position;
    vDist = length(p);

    // Gentle swirl motion
    float angle = uTime * 0.15 + aPhase;
    float c = cos(angle * 0.3);
    float s = sin(angle * 0.3);
    p.xz = mat2(c, -s, s, c) * p.xz;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float sparkle = 0.7 + 0.3 * sin(uTime * 4.0 + aPhase * 20.0);
    gl_PointSize = aSize * sparkle * (180.0 / -mv.z);
  }
`;

const dustFrag = /* glsl */ `
  varying float vPhase;
  varying float vDist;
  uniform float uTime;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    float g = 1.0 - smoothstep(0.0, 0.5, d);
    g *= g;

    float flash = pow(max(0.0, sin(uTime * 6.0 + vPhase * 30.0)), 16.0) * 0.6;

    float t = clamp(vDist / 12.0, 0.0, 1.0);
    vec3 inner = vec3(1.0, 0.85, 0.5);
    vec3 mid   = vec3(1.0, 0.55, 0.15);
    vec3 outer = vec3(0.9, 0.35, 0.08);
    vec3 col = mix(inner, mix(mid, outer, t), t);

    col += vec3(1.0, 0.95, 0.85) * flash;

    float alpha = g * (0.5 + flash) * (1.0 - t * 0.4);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ─── Armillary Ring Shader (orbital rings with travelling flare) ─── */
const armVert = /* glsl */ `
  attribute float aAngle;
  varying float vAngle;
  uniform float uRadius;

  void main() {
    vAngle = aAngle;
    float r = uRadius;
    vec3 p = vec3(cos(aAngle) * r, 0.0, sin(aAngle) * r);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 2.5 * (150.0 / -mv.z);
  }
`;

const armFrag = /* glsl */ `
  varying float vAngle;
  uniform float uTime;
  uniform float uFlareSpeed;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float g = 1.0 - smoothstep(0.0, 0.45, d);

    // Travelling flare — bright spot orbiting the ring
    float flarePos = mod(uTime * uFlareSpeed, 6.2832);
    float dist = abs(mod(vAngle - flarePos + 3.1416, 6.2832) - 3.1416);
    float flare = exp(-dist * 3.0);

    // Warm gold base, bright flare
    vec3 base = vec3(1.0, 0.65, 0.2);
    vec3 bright = vec3(1.0, 0.92, 0.7);
    vec3 col = mix(base, bright, flare);

    float alpha = g * (0.12 + flare * 0.88);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ─── Core Glow + Light Rays Shader ─── */
const glowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;

  // Pseudo-random hash
  float hash(float n) { return fract(sin(n) * 43758.5453); }

  // Smooth noise
  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
  }

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);
    float angle = atan(c.y, c.x);

    float core = exp(-d * 12.0);
    float inner = exp(-d * 5.0) * 0.55;
    float outer = exp(-d * 2.2) * 0.2;
    float pulse = 1.0 + 0.08 * sin(uTime * 1.5);

    // Realistic volumetric rays — varied lengths, organic noise
    float rays = 0.0;

    // Primary rays — 4 major, different lengths
    float majorAngles[4];
    majorAngles[0] = 0.4;
    majorAngles[1] = 1.85;
    majorAngles[2] = 3.5;
    majorAngles[3] = 5.1;
    float majorLen[4];
    majorLen[0] = 1.8;
    majorLen[1] = 2.5;
    majorLen[2] = 1.5;
    majorLen[3] = 2.2;

    for (int i = 0; i < 4; i++) {
      float a = angle - majorAngles[i] - uTime * 0.02;
      float width = 0.04 + 0.02 * noise(float(i) * 7.0 + uTime * 0.5);
      float ray = exp(-abs(a) / width) + exp(-abs(a - 6.2832) / width) + exp(-abs(a + 6.2832) / width);
      float falloff = exp(-d * majorLen[i]);
      float flicker = 0.7 + 0.3 * noise(float(i) * 13.0 + uTime * 2.0);
      rays += ray * falloff * 0.25 * flicker;
    }

    // Secondary thinner rays — subtle fill
    for (int i = 0; i < 8; i++) {
      float baseA = float(i) * 0.785 + 0.3;
      float a = angle - baseA - uTime * 0.015;
      float width = 0.015 + 0.01 * noise(float(i) * 3.7 + uTime * 0.8);
      float ray = exp(-abs(a) / width) + exp(-abs(a - 6.2832) / width) + exp(-abs(a + 6.2832) / width);
      float falloff = exp(-d * (2.5 + noise(float(i) * 5.0) * 1.5));
      float flicker = 0.5 + 0.5 * noise(float(i) * 11.0 + uTime * 1.5);
      rays += ray * falloff * 0.08 * flicker;
    }

    // Diffraction spikes (very thin, long, cross pattern)
    float spike1 = exp(-abs(sin(angle - 0.3 - uTime * 0.01)) / 0.008) * exp(-d * 1.0) * 0.12;
    float spike2 = exp(-abs(sin(angle + 1.27 - uTime * 0.01)) / 0.008) * exp(-d * 1.2) * 0.10;
    rays += spike1 + spike2;

    // Color: warm core rays, cooler distant rays
    vec3 white  = vec3(1.0, 0.95, 0.85);
    vec3 orange = vec3(1.0, 0.6, 0.2);
    vec3 deep   = vec3(0.8, 0.3, 0.05);
    vec3 rayWarm = vec3(1.0, 0.82, 0.45);
    vec3 rayCool = vec3(1.0, 0.7, 0.35);
    vec3 rayCol = mix(rayWarm, rayCool, smoothstep(0.05, 0.3, d));

    vec3 col = white * core + orange * inner + deep * outer + rayCol * rays;
    float a2 = (core + inner + outer + rays) * pulse;

    gl_FragColor = vec4(col, clamp(a2, 0.0, 1.0));
  }
`;

/* ─── Text Shimmer Shader ─── */
const textVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const textFrag = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uTime;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.01) discard;

    // Travelling shimmer wave across text
    float shimmer = sin(vUv.x * 12.0 - uTime * 3.0) * 0.5 + 0.5;
    shimmer = pow(shimmer, 4.0) * 0.4;

    // Breathing glow
    float breath = 1.0 + 0.15 * sin(uTime * 2.0);

    vec3 col = tex.rgb * breath + vec3(1.0, 0.9, 0.7) * shimmer * tex.a;
    float alpha = tex.a * breath;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/* ─── Orbit Line Shader (clean thin orbit rings) ─── */
const orbitLineVert = /* glsl */ `
  attribute float aAngle;
  uniform float uRadius;

  void main() {
    vec3 p = vec3(cos(aAngle) * uRadius, 0.0, sin(aAngle) * uRadius);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const orbitLineFrag = /* glsl */ `
  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 0.18);
  }
`;

/* ─── Realistic Planet Shader ─── */
const planetVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const planetFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uTime;

  // Simple 3D noise for surface detail
  float hash3(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(
      mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
      f.z);
    return n;
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Light direction: from the sun (origin)
    vec3 lightDir = normalize(-vWorldPos);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 n = normalize(vNormal);

    // Diffuse lighting
    float NdL = max(dot(n, lightDir), 0.0);
    float diffuse = NdL * 0.8 + 0.15; // ambient floor

    // Surface detail via noise
    vec3 noiseCoord = n * 3.0 + vec3(0.0, uTime * 0.02, 0.0);
    float surface = fbm(noiseCoord);
    vec3 surfCol = mix(uColor * 0.6, uColor2, surface);

    // Specular highlight
    vec3 halfV = normalize(lightDir + viewDir);
    float spec = pow(max(dot(n, halfV), 0.0), 32.0) * 0.4;

    // Atmosphere rim (fresnel)
    float fresnel = 1.0 - max(dot(n, viewDir), 0.0);
    float rim = pow(fresnel, 3.0) * 0.7;
    vec3 rimCol = mix(uColor, vec3(1.0), 0.5);

    // Terminator soft shadow
    float terminator = smoothstep(-0.05, 0.2, NdL);

    vec3 col = surfCol * diffuse * terminator + vec3(1.0) * spec * terminator + rimCol * rim;

    // Night side subtle ambient
    float nightAmbient = (1.0 - terminator) * 0.03;
    col += uColor * nightAmbient;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─── Planet Atmosphere Glow Shader ─── */
// (removed — fresnel rim on planet shader is sufficient)

/* ─── HTML5 Logo Shader (orbiting billboard) ─── */
const html5Vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const html5Frag = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uTime;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.02) discard;

    // Subtle breathing pulse
    float breath = 1.0 + 0.08 * sin(uTime * 2.0);

    // Soft outer glow around logo edges
    float edgeDist = smoothstep(0.02, 0.15, tex.a);
    vec3 glowCol = vec3(1.0, 0.5, 0.15);
    vec3 col = mix(glowCol * 0.6, tex.rgb, edgeDist) * breath;

    // Travelling shimmer highlight
    float shimmer = pow(max(0.0, sin(vUv.x * 6.0 + vUv.y * 3.0 - uTime * 2.5)), 8.0) * 0.25;
    col += vec3(1.0, 0.9, 0.7) * shimmer * tex.a;

    float alpha = tex.a * breath;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/* ─── Constants ─── */
const ORBIT_RADII = [10, 18, 28, 40, 54, 70, 88];
const ORBIT_SPEEDS = [0.5, 0.35, 0.22, 0.15, 0.1, 0.07, 0.05];
const DUST_COUNT = 400;
const ARM_RING_PTS = 200;

// Armillary ring configs: radius, tilt, rotation speed, flare speed
const ARM_RINGS = [
  { radius: 3.2, tiltX: 70, tiltZ: 20,  speed: 0.35, flare: 1.8 },
  { radius: 3.8, tiltX: 30, tiltZ: -50, speed: -0.25, flare: 2.2 },
  { radius: 4.4, tiltX: -20, tiltZ: 65, speed: 0.18, flare: 1.5 },
];
const DEG = Math.PI / 180;

/* ─── Logo planet configuration ─── */
const LOGO_CONFIGS = [
  // orbit 0
  { name: "html5", orbit: 0, phase: 0, size: 2.4 },
  // orbit 1
  { name: "css3", orbit: 1, phase: 0, size: 2.8 },
  { name: "sass", orbit: 1, phase: Math.PI, size: 2.2 },
  // orbit 2
  { name: "js", orbit: 2, phase: 0, size: 2.6 },
  { name: "ts", orbit: 2, phase: Math.PI, size: 2.6 },
  // orbit 3
  { name: "react", orbit: 3, phase: 0, size: 3.0 },
  { name: "vue", orbit: 3, phase: (2 * Math.PI) / 3, size: 2.6 },
  { name: "angular", orbit: 3, phase: (4 * Math.PI) / 3, size: 2.6 },
  // orbit 4
  { name: "nodejs", orbit: 4, phase: 0, size: 2.8 },
  { name: "nextjs", orbit: 4, phase: (2 * Math.PI) / 3, size: 2.6 },
  { name: "svelte", orbit: 4, phase: (4 * Math.PI) / 3, size: 2.4 },
  // orbit 5
  { name: "python", orbit: 5, phase: 0, size: 2.6 },
  { name: "tailwind", orbit: 5, phase: (2 * Math.PI) / 3, size: 2.4 },
  { name: "php", orbit: 5, phase: (4 * Math.PI) / 3, size: 2.4 },
  // orbit 6
  { name: "mongodb", orbit: 6, phase: 0, size: 2.4 },
  { name: "docker", orbit: 6, phase: (2 * Math.PI) / 3, size: 2.4 },
  { name: "git", orbit: 6, phase: (4 * Math.PI) / 3, size: 2.2 },
];

/* ─── Horizon Galaxy Glow Shader ─── */
const horizonGlowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const horizonGlowFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);

    // Horizontal band glow (galactic plane)
    float band = exp(-c.y * c.y * 800.0) * exp(-d * d * 4.0);

    // Diffuse outer halo
    float halo = exp(-d * d * 2.5) * 0.05;

    // Subtle color variation
    float pulse = 1.0 + 0.03 * sin(uTime * 0.5);
    vec3 warm = vec3(0.3, 0.15, 0.45);
    vec3 cool = vec3(0.1, 0.06, 0.25);
    vec3 col = mix(cool, warm, band) * pulse;

    float alpha = (band * 0.15 + halo) * pulse;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

interface GalacticCoreProps {
  isMobile?: boolean;
}

export default function GalacticCore({ isMobile }: GalacticCoreProps) {
  const orbitScale = isMobile ? 0.7 : 1;
  const orbitRadii = ORBIT_RADII.map(r => r * orbitScale);
  const activeLogos = isMobile
    ? LOGO_CONFIGS.filter(c => c.orbit <= 4)
    : LOGO_CONFIGS;
  const dustCount = isMobile ? 200 : DUST_COUNT;
  const ringPts = isMobile ? 100 : ARM_RING_PTS;
  const groupRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.ShaderMaterial>(null);
  const textMatRef = useRef<THREE.ShaderMaterial>(null);
  const dustMatRef = useRef<THREE.ShaderMaterial>(null);
  const armMatRefs = useRef<THREE.ShaderMaterial[]>([]);
  const armGroupRefs = useRef<THREE.Group[]>([]);
  const logoRefs = useRef<THREE.Mesh[]>([]);
  const logoMatRefs = useRef<THREE.ShaderMaterial[]>([]);
  const horizonMatRef = useRef<THREE.ShaderMaterial>(null);
  const textRef = useRef<THREE.Mesh>(null);

  // Text texture — gold gradient + multi-layer glow
  const textTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 1024, 256);

    // Outer glow layer (large, soft)
    ctx.shadowColor = "rgba(255, 120, 0, 0.6)";
    ctx.shadowBlur = 40;
    ctx.font = "900 100px 'Arial Black', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "8px";
    ctx.fillStyle = "rgba(255, 140, 30, 0.3)";
    ctx.fillText("SITELY", 512, 128);

    // Mid glow
    ctx.shadowColor = "rgba(255, 180, 60, 0.8)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "rgba(255, 160, 40, 0.5)";
    ctx.fillText("SITELY", 512, 128);

    // Gold gradient text
    const grad = ctx.createLinearGradient(300, 80, 720, 176);
    grad.addColorStop(0, "#fff8e0");    // bright cream top
    grad.addColorStop(0.3, "#ffd060");  // warm gold
    grad.addColorStop(0.6, "#ff9020");  // deep orange
    grad.addColorStop(1, "#ffcc66");    // back to gold
    ctx.shadowColor = "rgba(255, 200, 80, 1.0)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = grad;
    ctx.fillText("SITELY", 512, 128);

    // Bright center stroke for definition
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 240, 200, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeText("SITELY", 512, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // All logo textures — generated from logoTextures.ts
  const logoTextures = useMemo(() => createLogoTextures(), []);

  // Cosmic dust geometry
  const dustGeo = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);
    const phases = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      const r = Math.pow(Math.random(), 0.8) * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.35;
      pos[i * 3] = Math.cos(theta) * Math.cos(phi) * r;
      pos[i * 3 + 1] = Math.sin(phi) * r * 0.3;
      pos[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r;
      sizes[i] = 1.0 + Math.random() * 3.0;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return geo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dustCount]);

  // Armillary ring geometry (shared)
  const armRingGeo = useMemo(() => {
    const angles = new Float32Array(ringPts);
    const pos = new Float32Array(ringPts * 3);
    for (let i = 0; i < ringPts; i++) {
      angles[i] = (i / ringPts) * Math.PI * 2;
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    return geo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringPts]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (glowMatRef.current) glowMatRef.current.uniforms.uTime.value = t;
    if (textMatRef.current) textMatRef.current.uniforms.uTime.value = t;
    if (dustMatRef.current) dustMatRef.current.uniforms.uTime.value = t;
    if (horizonMatRef.current) horizonMatRef.current.uniforms.uTime.value = t;

    // Animate all logo planets — orbit, bob, face camera, breathe
    activeLogos.forEach((cfg, i) => {
      const mesh = logoRefs.current[i];
      const mat = logoMatRefs.current[i];
      if (!mesh) return;
      if (mat) mat.uniforms.uTime.value = t;

      // Orbital position
      const angle = t * ORBIT_SPEEDS[cfg.orbit] + cfg.phase;
      const r = orbitRadii[cfg.orbit];
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      // 3D bobbing on Y axis
      const bob = Math.sin(t * 0.8 + i * 1.3) * 0.5;
      mesh.position.set(x, bob, z);

      // Billboard — face camera
      mesh.lookAt(state.camera.position);

      // 3D breathe animation — subtle scale pulse
      const breathe = 1.0 + Math.sin(t * 0.6 + i * 0.8) * 0.06;
      mesh.scale.setScalar(breathe);
    });

    // Rotate armillary rings + update shader time
    ARM_RINGS.forEach((cfg, i) => {
      const mat = armMatRefs.current[i];
      const grp = armGroupRefs.current[i];
      if (mat) mat.uniforms.uTime.value = t;
      if (grp) {
        grp.rotation.set(
          cfg.tiltX * DEG,
          t * cfg.speed,
          cfg.tiltZ * DEG,
        );
      }
    });

    // Billboard text
    if (textRef.current) {
      textRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Horizon galaxy glow (far background) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[isMobile ? 140 : 200, isMobile ? 140 : 200]} />
        <shaderMaterial
          ref={horizonMatRef}
          vertexShader={horizonGlowVert}
          fragmentShader={horizonGlowFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={{ uTime: { value: 0 } }}
        />
      </mesh>

      {/* Central warm glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <shaderMaterial
          ref={glowMatRef}
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={{ uTime: { value: 0 } }}
        />
      </mesh>

      {/* Crystal cosmic dust nebula */}
      <points>
        <primitive object={dustGeo} attach="geometry" />
        <shaderMaterial
          ref={dustMatRef}
          vertexShader={dustVert}
          fragmentShader={dustFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uTime: { value: 0 } }}
        />
      </points>

      {/* Armillary orbital rings */}
      {ARM_RINGS.map((cfg, i) => (
        <group
          key={`arm-${i}`}
          ref={(el) => { if (el) armGroupRefs.current[i] = el; }}
        >
          <points>
            <primitive object={armRingGeo} attach="geometry" />
            <shaderMaterial
              ref={(el) => { if (el) armMatRefs.current[i] = el; }}
              vertexShader={armVert}
              fragmentShader={armFrag}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              uniforms={{
                uTime: { value: 0 },
                uRadius: { value: cfg.radius },
                uFlareSpeed: { value: cfg.flare },
              }}
            />
          </points>
        </group>
      ))}

      {/* SITELY text — gold gradient + shimmer, billboard */}
      <mesh ref={textRef} position={[0, 0.1, 0]}>
        <planeGeometry args={[10, 2.5]} />
        <shaderMaterial
          ref={textMatRef}
          vertexShader={textVert}
          fragmentShader={textFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={{
            uMap: { value: textTexture },
            uTime: { value: 0 },
          }}
        />
      </mesh>

      {/* Logo planets — orbiting billboards */}
      {activeLogos.map((cfg, i) => (
        <mesh
          key={cfg.name}
          ref={(el) => { if (el) logoRefs.current[i] = el; }}
        >
          <planeGeometry args={[cfg.size, cfg.size]} />
          <shaderMaterial
            ref={(el) => { if (el) logoMatRefs.current[i] = el; }}
            vertexShader={html5Vert}
            fragmentShader={html5Frag}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            uniforms={{
              uMap: { value: logoTextures[cfg.name] },
              uTime: { value: 0 },
            }}
          />
        </mesh>
      ))}
    </group>
  );
}
