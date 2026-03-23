"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/hooks/useLenis";
import s from "./ScrollToTop.module.css";

export default function ScrollToTop() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const update = (progress: number) => {
      btn.setAttribute("data-visible", String(progress > 0.15));
    };

    if (lenis) {
      const onScroll = () => update(lenis.progress ?? 0);
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }

    // Fallback (mobile — no Lenis)
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      update(docH > 0 ? window.scrollY / docH : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lenis]);

  const handleClick = () => {
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      ref={btnRef}
      className={s.button}
      data-visible="false"
      onClick={handleClick}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}
