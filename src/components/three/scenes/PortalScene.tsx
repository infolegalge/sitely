"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Floating particles ─── */
function ParticleField({ count = 120 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.015;
    ref.current.rotation.x += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#4f6ef7"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Orbital ring ─── */
function OrbitalRing({ radius = 3, speed = 0.3, color = "#8b5cf6" }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
    ref.current.rotation.x = Math.PI / 3 + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.008, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

/* ─── Central glow orb ─── */
function GlowOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref} position={[0, 0, -2]}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshBasicMaterial
        color="#4f6ef7"
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}

/* ─── Floating dots on orbit ─── */
function OrbitalDot({ radius, speed, offset, color }: {
  radius: number; speed: number; offset: number; color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.y = Math.sin(t) * radius * 0.6;
    ref.current.position.z = Math.sin(t * 0.5) * 1.5 - 1;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

/* ─── Main scene export ─── */
export default function PortalScene({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <ParticleField count={isMobile ? 60 : 120} />
      <GlowOrb />
      <OrbitalRing radius={3.5} speed={0.25} color="#4f6ef7" />
      <OrbitalRing radius={4.5} speed={-0.15} color="#8b5cf6" />
      {!isMobile && <OrbitalRing radius={5.5} speed={0.1} color="#06d6a0" />}
      <OrbitalDot radius={3.5} speed={0.4} offset={0} color="#4f6ef7" />
      <OrbitalDot radius={3.5} speed={0.4} offset={Math.PI} color="#6b8aff" />
      <OrbitalDot radius={4.5} speed={-0.25} offset={1} color="#8b5cf6" />
      <OrbitalDot radius={4.5} speed={-0.25} offset={Math.PI + 1} color="#a78bfa" />
      {!isMobile && (
        <>
          <OrbitalDot radius={5.5} speed={0.18} offset={0.5} color="#06d6a0" />
          <OrbitalDot radius={5.5} speed={0.18} offset={Math.PI + 0.5} color="#34d399" />
        </>
      )}
    </>
  );
}
