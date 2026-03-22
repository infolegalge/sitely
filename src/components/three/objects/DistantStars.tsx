"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 600;
const RADIUS = 600;

interface DistantStarsProps {
  opacityRef?: { current: number };
  isMobile?: boolean;
}

export default function DistantStars({ opacityRef, isMobile }: DistantStarsProps) {
  const count = isMobile ? 350 : COUNT;
  const matRef = useRef<THREE.PointsMaterial>(null);

  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Uniform sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * RADIUS;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * RADIUS;
      pos[i * 3 + 2] = Math.cos(phi) * RADIUS;

      // White to soft blue tint
      const warm = 0.5 + Math.random() * 0.5;
      col[i * 3] = 0.7 + warm * 0.3;
      col[i * 3 + 1] = 0.75 + warm * 0.25;
      col[i * 3 + 2] = 0.85 + Math.random() * 0.15;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useFrame(() => {
    if (matRef.current && opacityRef) {
      matRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <points frustumCulled={false}>
      <primitive object={geo} attach="geometry" />
      <pointsMaterial
        ref={matRef}
        size={1.5}
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={false}
      />
    </points>
  );
}
