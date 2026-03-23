"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/hooks/useLenis";
import s from "./ScrollProgress.module.css";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (lenis) {
      const onScroll = () => {
        bar.style.width = `${(lenis.progress ?? 0) * 100}%`;
      };
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }

    // Fallback if Lenis not active (e.g. mobile)
    const update = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${docH > 0 ? (window.scrollY / docH) * 100 : 0}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [lenis]);

  return <div ref={barRef} className={s.bar} />;
}
