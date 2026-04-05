"use client";

import { Canvas } from "@react-three/fiber";
import { useState, useEffect } from "react";
import PortalScene from "@/components/three/scenes/PortalScene";
import s from "./PortalCanvas.module.css";

export default function PortalCanvas() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className={s.canvas}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 100 }}
        dpr={isMobile ? 0.75 : 1}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <PortalScene isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
