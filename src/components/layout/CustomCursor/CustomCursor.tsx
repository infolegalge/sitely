"use client";

import { useEffect, useRef, useState } from "react";
import s from "./CustomCursor.module.css";

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const hovered = useRef(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || window.innerWidth < 768) return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-cur]")) {
        hovered.current = true;
      }
    };

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [data-cur]")) {
        hovered.current = false;
      }
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    let raf: number;
    const animate = () => {
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.08;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.08;
      dotPos.current.x += (mouse.current.x - dotPos.current.x) * 0.22;
      dotPos.current.y += (mouse.current.y - dotPos.current.y) * 0.22;

      if (ringRef.current) {
        const size = hovered.current ? 60 : 40;
        ringRef.current.style.transform = `translate(${ringPos.current.x - size / 2}px, ${ringPos.current.y - size / 2}px)`;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotPos.current.x - 2}px, ${dotPos.current.y - 2}px)`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <div ref={ringRef} className={s.ring} aria-hidden="true" />
      <div ref={dotRef} className={s.dot} aria-hidden="true" />
    </>
  );
}
