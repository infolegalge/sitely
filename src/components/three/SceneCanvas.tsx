"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useState } from "react";
import GalaxyScene from "./scenes/GalaxyScene";
import s from "./SceneCanvas.module.css";

export default function SceneCanvas() {
  const isMobile = useIsMobile();
  const [dpr, setDpr] = useState(isMobile ? 1 : 1.5);

  return (
    <div className={s.wrapper}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: isMobile ? 100 : 90, near: 0.1, far: 2000 }}
        dpr={dpr}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(Math.max(0.5, dpr - 0.25))}
          onIncline={() => setDpr(isMobile ? 1 : Math.min(1.5, dpr + 0.25))}
          flipflops={3}
          onFallback={() => setDpr(isMobile ? 0.75 : 1)}
        />
        <GalaxyScene isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
