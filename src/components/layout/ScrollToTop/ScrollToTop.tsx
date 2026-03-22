"use client";

import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useLenis } from "@/hooks/useLenis";
import s from "./ScrollToTop.module.css";

export default function ScrollToTop() {
  const progress = useScrollProgress();
  const lenis = useLenis();
  const visible = progress > 0.15;

  const handleClick = () => {
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      className={s.button}
      data-visible={String(visible)}
      onClick={handleClick}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}
