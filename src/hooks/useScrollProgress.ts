"use client";

import { useEffect, useState } from "react";
import { useLenis } from "@/hooks/useLenis";

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      const onScroll = () => {
        setProgress(lenis.progress ?? 0);
      };
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }

    // Fallback if Lenis not ready yet
    const update = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? window.scrollY / docHeight : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [lenis]);

  return progress;
}
