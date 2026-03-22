"use client";

import { Canvas } from "@react-three/fiber";
import { useIsMobile } from "@/hooks/useIsMobile";
import GalaxyScene from "./scenes/GalaxyScene";
import s from "./SceneCanvas.module.css";

export default function SceneCanvas() {
  const isMobile = useIsMobile();

  return (
    <div className={s.wrapper}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: isMobile ? 100 : 90, near: 0.1, far: 2000 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{ antialias: false, alpha: true }}
      >
        <GalaxyScene isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
