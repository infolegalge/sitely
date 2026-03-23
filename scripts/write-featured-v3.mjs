import { writeFileSync } from "fs";

/* ═══════════════════════════════════════════
   FeaturedWork §2 — "Cosmic Orbit" 3D Carousel
   Cards orbit in 3D space like cosmic bodies
   ═══════════════════════════════════════════ */

const CSS_PATH =
  "src/components/sections/home/FeaturedWork/FeaturedWork.module.css";
const TSX_PATH =
  "src/components/sections/home/FeaturedWork/FeaturedWork.tsx";

/* ────────────────────────────────────────── */
/*  CSS                                       */
/* ────────────────────────────────────────── */

const css = `/* ═══════════════════════════════════════════
   FeaturedWork — Homepage §2
   "Cosmic Orbit" — 3D Carousel

   Cards orbit in 3D space. Front card highlighted,
   side/back cards recede with opacity + blur.
   GSAP-driven rotation, pauses on hover.
   Cosmos bleeds through the transparent gaps.

   Breakpoints:
     max-380  → small mobile
     base     → 0-479
     480px    → larger mobile
     640px    → medium
     768px    → tablet
     1024px   → desktop
     1280px   → wide
     1440px   → cap
   ═══════════════════════════════════════════ */

@property --prism-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

/* ─── Section ─── */

.section {
  position: relative;
  z-index: 1;
  padding: 48px 14px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: visible;
}

/* ─── Header ─── */

.header {
  text-align: center;
  margin-bottom: 36px;
}

.label {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  color: var(--blue);
  margin-bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.labelLine {
  display: block;
  width: 24px;
  height: 1px;
  background: var(--blue);
  opacity: 0.5;
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.6rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--tx);
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.subtitle {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  color: var(--tx-2);
  line-height: 1.7;
  max-width: 480px;
  margin: 0 auto;
}

/* ─── 3D Stage ─── */

.stage {
  position: relative;
  width: 100%;
  height: 380px;
  perspective: 1200px;
  perspective-origin: 50% 50%;
}

/* ─── Orbit ring (the rotating 3D container) ─── */

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  transform: translate(-50%, -50%) rotateY(0deg);
}

/* ─── Card ─── */

.card {
  position: absolute;
  width: 280px;
  height: 200px;
  top: -100px;
  left: -140px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(10, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  display: block;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  transition:
    border-color 0.4s var(--ease),
    box-shadow 0.5s var(--ease);
  cursor: pointer;
}

/* When card is the active front card */
.card.active {
  border-color: rgba(79, 110, 247, 0.2);
  box-shadow:
    0 20px 60px rgba(79, 110, 247, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.4);
}

/* ── Prismatic border on hover ── */

.prismBorder {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from var(--prism-angle),
    transparent 0%,
    var(--blue) 8%,
    var(--violet) 16%,
    var(--cyan) 24%,
    transparent 32%
  );
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s var(--ease);
  animation: prismSpin 5s linear infinite;
  z-index: 10;
  pointer-events: none;
}

@keyframes prismSpin {
  to { --prism-angle: 360deg; }
}

.card:hover .prismBorder,
.card.active .prismBorder {
  opacity: 0.6;
}

/* ─── Thumbnail ─── */

.thumbnailWrap {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgba(6, 6, 11, 0.4);
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s var(--ease);
}

.card:hover .thumbnail,
.card.active .thumbnail {
  transform: scale(1.05);
}

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(12, 12, 22, 0.5) 0%,
    rgba(20, 20, 35, 0.5) 100%
  );
}

.placeholderInner {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--tx-3);
  opacity: 0.22;
  letter-spacing: -0.02em;
}

/* ─── Project number ─── */

.projectNum {
  position: absolute;
  top: 8px;
  left: 10px;
  font-family: var(--font-heading, sans-serif);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.18;
  z-index: 2;
  pointer-events: none;
}

/* ─── Thumbnail gradient ─── */

.thumbGradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70%;
  background: linear-gradient(
    to top,
    rgba(6, 6, 11, 0.95) 0%,
    rgba(6, 6, 11, 0.5) 45%,
    transparent 100%
  );
  z-index: 1;
  pointer-events: none;
}

/* ─── Card Info ─── */

.info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 12px;
  pointer-events: none;
}

.cardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.category {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.52rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--blue);
}

.year {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.52rem;
  color: rgba(255, 255, 255, 0.35);
}

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 0.88rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  margin-bottom: 3px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-family: var(--font-body, sans-serif);
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

/* ─── Glow line ─── */

.glowLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--blue), var(--violet), var(--cyan));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
  z-index: 11;
}

.card:hover .glowLine,
.card.active .glowLine {
  transform: scaleX(1);
}

/* ─── Navigation dots ─── */

.dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  cursor: pointer;
  transition:
    background 0.3s var(--ease),
    border-color 0.3s var(--ease),
    transform 0.3s var(--ease-bounce),
    box-shadow 0.3s var(--ease);
  padding: 0;
}

.dot:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.dotActive {
  background: var(--blue);
  border-color: var(--blue);
  transform: scale(1.25);
  box-shadow: 0 0 12px rgba(79, 110, 247, 0.4);
}

/* ─── Footer CTA ─── */

.footer {
  text-align: center;
  margin-top: 32px;
}

.viewAll {
  font-family: var(--font-body, sans-serif);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--tx-2);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--brd-2);
  transition: color 0.3s var(--ease), border-color 0.3s var(--ease);
}

.viewAll:hover {
  color: var(--blue);
  border-color: var(--blue);
}

.viewAllCount {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.65rem;
  color: var(--tx-3);
}

.arrow {
  display: inline-block;
  transition: transform 0.3s var(--ease);
}

.viewAll:hover .arrow {
  transform: translateX(4px);
}

/* ─── Active card label (below carousel) ─── */

.activeLabel {
  text-align: center;
  margin-top: 16px;
  min-height: 40px;
}

.activeName {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--tx);
  display: block;
  margin-bottom: 4px;
  transition: opacity 0.3s var(--ease);
}

.activeCat {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--blue);
}

/* ═══════════════════════════════════════════
   480px+
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .section {
    padding: 56px 16px;
  }

  .stage {
    height: 400px;
  }

  .card {
    width: 320px;
    height: 220px;
    top: -110px;
    left: -160px;
    border-radius: 20px;
  }

  .cardTitle {
    font-size: 0.95rem;
  }

  .category,
  .year {
    font-size: 0.56rem;
  }

  .tag {
    font-size: 0.54rem;
  }

  .activeName {
    font-size: 1.3rem;
  }
}

/* ═══════════════════════════════════════════
   640px+
   ═══════════════════════════════════════════ */

@media (min-width: 640px) {
  .stage {
    height: 440px;
  }

  .card {
    width: 380px;
    height: 260px;
    top: -130px;
    left: -190px;
  }

  .info {
    padding: 16px;
  }

  .cardTitle {
    font-size: 1rem;
  }

  .projectNum {
    font-size: 2rem;
  }
}

/* ═══════════════════════════════════════════
   768px+
   ═══════════════════════════════════════════ */

@media (min-width: 768px) {
  .section {
    padding: 72px 20px;
  }

  .header {
    margin-bottom: 44px;
  }

  .stage {
    height: 480px;
    perspective: 1400px;
  }

  .card {
    width: 440px;
    height: 300px;
    top: -150px;
    left: -220px;
    border-radius: 22px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .info {
    padding: 18px;
  }

  .cardTitle {
    font-size: 1.1rem;
    margin-bottom: 5px;
  }

  .category,
  .year {
    font-size: 0.6rem;
  }

  .tag {
    font-size: 0.58rem;
    padding: 3px 8px;
  }

  .projectNum {
    font-size: 2.4rem;
    top: 12px;
    left: 14px;
  }

  .activeName {
    font-size: 1.5rem;
  }

  .dots {
    gap: 12px;
    margin-top: 32px;
  }

  .dot {
    width: 11px;
    height: 11px;
  }
}

/* ═══════════════════════════════════════════
   1024px+
   ═══════════════════════════════════════════ */

@media (min-width: 1024px) {
  .section {
    padding: clamp(80px, 8vh, 110px) 24px;
  }

  .header {
    margin-bottom: 52px;
  }

  .stage {
    height: 520px;
    perspective: 1600px;
  }

  .card {
    width: 500px;
    height: 340px;
    top: -170px;
    left: -250px;
    background: rgba(10, 10, 18, 0.35);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .info {
    padding: 20px;
  }

  .cardTitle {
    font-size: 1.25rem;
    margin-bottom: 6px;
  }

  .category,
  .year {
    font-size: 0.62rem;
  }

  .tag {
    font-size: 0.62rem;
    padding: 3px 9px;
  }

  .projectNum {
    font-size: 3rem;
    top: 16px;
    left: 18px;
  }

  .activeName {
    font-size: 1.6rem;
  }

  .footer {
    margin-top: 36px;
  }
}

/* ═══════════════════════════════════════════
   1280px+
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .stage {
    height: 560px;
  }

  .card {
    width: 550px;
    height: 370px;
    top: -185px;
    left: -275px;
  }

  .cardTitle {
    font-size: 1.35rem;
  }

  .tag {
    font-size: 0.65rem;
    padding: 3px 10px;
  }
}

/* ═══════════════════════════════════════════
   1440px+ — Cap
   ═══════════════════════════════════════════ */

@media (min-width: 1440px) {
  .section {
    padding: 100px 0;
  }
}

/* ═══════════════════════════════════════════
   380px max — Small mobile
   ═══════════════════════════════════════════ */

@media (max-width: 380px) {
  .section {
    padding: 40px 10px;
  }

  .stage {
    height: 340px;
  }

  .card {
    width: 240px;
    height: 170px;
    top: -85px;
    left: -120px;
  }

  .cardTitle {
    font-size: 0.8rem;
  }

  .tag {
    font-size: 0.48rem;
    padding: 2px 6px;
  }

  .projectNum {
    font-size: 1.3rem;
  }

  .activeName {
    font-size: 1rem;
  }
}
`;

/* ────────────────────────────────────────── */
/*  TSX                                       */
/* ────────────────────────────────────────── */

const L = [];

L.push(`"use client";`);
L.push(``);
L.push(`import { useCallback, useEffect, useRef, useState } from "react";`);
L.push(`import Link from "next/link";`);
L.push(`import Image from "next/image";`);
L.push(`import { FEATURED_PROJECTS } from "@/lib/constants";`);
L.push(`import s from "./FeaturedWork.module.css";`);
L.push(``);
L.push(`const CARD_COUNT = FEATURED_PROJECTS.length;`);
L.push(`const ANGLE_STEP = 360 / CARD_COUNT;`);
L.push(``);
L.push(`/** Radius for the orbit — responsive via JS */`);
L.push(`function getRadius() {`);
L.push(`  if (typeof window === "undefined") return 350;`);
L.push(`  const w = window.innerWidth;`);
L.push(`  if (w < 380) return 180;`);
L.push(`  if (w < 480) return 220;`);
L.push(`  if (w < 640) return 280;`);
L.push(`  if (w < 768) return 320;`);
L.push(`  if (w < 1024) return 380;`);
L.push(`  if (w < 1280) return 440;`);
L.push(`  return 480;`);
L.push(`}`);
L.push(``);
L.push(`function pad(n: number) {`);
L.push(`  return String(n).padStart(2, "0");`);
L.push(`}`);
L.push(``);
L.push(`export default function FeaturedWork() {`);
L.push(`  const sectionRef = useRef<HTMLElement>(null);`);
L.push(`  const ringRef = useRef<HTMLDivElement>(null);`);
L.push(`  const cardEls = useRef<(HTMLAnchorElement | null)[]>([]);`);
L.push(`  const tweenRef = useRef<ReturnType<typeof import("gsap").gsap.to> | null>(null);`);
L.push(`  const angleRef = useRef({ value: 0 });`);
L.push(`  const [activeIdx, setActiveIdx] = useState(0);`);
L.push(`  const isPaused = useRef(false);`);
L.push(``);
L.push(`  /* data-rv reveal */`);
L.push(`  useEffect(() => {`);
L.push(`    const section = sectionRef.current;`);
L.push(`    if (!section) return;`);
L.push(`    const els = section.querySelectorAll<HTMLElement>("[data-rv]");`);
L.push(`    if (!els.length) return;`);
L.push(`    const observer = new IntersectionObserver(`);
L.push(`      (entries) => {`);
L.push(`        entries.forEach((entry) => {`);
L.push(`          if (entry.isIntersecting) {`);
L.push(`            entry.target.classList.add("visible");`);
L.push(`            observer.unobserve(entry.target);`);
L.push(`          }`);
L.push(`        });`);
L.push(`      },`);
L.push(`      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },`);
L.push(`    );`);
L.push(`    els.forEach((el) => observer.observe(el));`);
L.push(`    return () => observer.disconnect();`);
L.push(`  }, []);`);
L.push(``);
L.push(`  /* Place cards in orbit + start GSAP rotation */`);
L.push(`  useEffect(() => {`);
L.push(`    let gsapModule: typeof import("gsap") | null = null;`);
L.push(``);
L.push(`    async function init() {`);
L.push(`      gsapModule = await import("gsap");`);
L.push(`      const { gsap } = gsapModule;`);
L.push(``);
L.push(`      const ring = ringRef.current;`);
L.push(`      if (!ring) return;`);
L.push(``);
L.push(`      const radius = getRadius();`);
L.push(``);
L.push(`      /* Position cards around the orbit */`);
L.push(`      cardEls.current.forEach((card, i) => {`);
L.push(`        if (!card) return;`);
L.push("        card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${radius}px)`;");
L.push(`      });`);
L.push(``);
L.push(`      /* Continuous rotation tween */`);
L.push(`      angleRef.current.value = 0;`);
L.push(`      tweenRef.current = gsap.to(angleRef.current, {`);
L.push(`        value: 360,`);
L.push(`        duration: 20,`);
L.push(`        ease: "none",`);
L.push(`        repeat: -1,`);
L.push(`        onUpdate: () => {`);
L.push(`          if (!ring) return;`);
L.push("          ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;");
L.push(``);
L.push(`          /* Determine which card faces front */`);
L.push(`          const raw = (-angleRef.current.value % 360 + 360) % 360;`);
L.push(`          const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`          setActiveIdx(closest);`);
L.push(`        },`);
L.push(`      });`);
L.push(`    }`);
L.push(``);
L.push(`    init();`);
L.push(``);
L.push(`    /* Handle resize — reposition cards */`);
L.push(`    function onResize() {`);
L.push(`      const radius = getRadius();`);
L.push(`      cardEls.current.forEach((card, i) => {`);
L.push(`        if (!card) return;`);
L.push("        card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${radius}px)`;");
L.push(`      });`);
L.push(`    }`);
L.push(``);
L.push(`    window.addEventListener("resize", onResize);`);
L.push(`    return () => {`);
L.push(`      tweenRef.current?.kill();`);
L.push(`      window.removeEventListener("resize", onResize);`);
L.push(`    };`);
L.push(`  }, []);`);
L.push(``);
L.push(`  /* Pause/resume on hover */`);
L.push(`  const handleStageEnter = useCallback(() => {`);
L.push(`    isPaused.current = true;`);
L.push(`    tweenRef.current?.timeScale(0.15);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  const handleStageLeave = useCallback(() => {`);
L.push(`    isPaused.current = false;`);
L.push(`    tweenRef.current?.timeScale(1);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  /* Navigate to specific card via dots */`);
L.push(`  const goToCard = useCallback((idx: number) => {`);
L.push(`    if (!tweenRef.current) return;`);
L.push(``);
L.push(`    const targetAngle = -(idx * ANGLE_STEP);`);
L.push(`    const current = angleRef.current.value % 360;`);
L.push(`    let diff = targetAngle - current;`);
L.push(`    /* Take shortest path */`);
L.push(`    while (diff > 180) diff -= 360;`);
L.push(`    while (diff < -180) diff += 360;`);
L.push(`    const newVal = angleRef.current.value + diff;`);
L.push(``);
L.push(`    tweenRef.current.pause();`);
L.push(``);
L.push(`    import("gsap").then(({ gsap }) => {`);
L.push(`      gsap.to(angleRef.current, {`);
L.push(`        value: newVal,`);
L.push(`        duration: 0.8,`);
L.push(`        ease: "power2.inOut",`);
L.push(`        onUpdate: () => {`);
L.push(`          const ring = ringRef.current;`);
L.push(`          if (!ring) return;`);
L.push("          ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;");
L.push(`          setActiveIdx(idx);`);
L.push(`        },`);
L.push(`        onComplete: () => {`);
L.push(`          if (tweenRef.current) {`);
L.push(`            /* Reset the infinite tween from new position */`);
L.push(`            tweenRef.current.kill();`);
L.push(`            gsap.to(angleRef.current, {`);
L.push(`              value: "+=" + 360,`);
L.push(`              duration: 20,`);
L.push(`              ease: "none",`);
L.push(`              repeat: -1,`);
L.push(`              onUpdate: () => {`);
L.push(`                const ring = ringRef.current;`);
L.push(`                if (!ring) return;`);
L.push("                ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;");
L.push(`                const raw = (-angleRef.current.value % 360 + 360) % 360;`);
L.push(`                const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`                setActiveIdx(closest);`);
L.push(`              },`);
L.push(`            });`);
L.push(`            tweenRef.current = gsap.getTweensOf(angleRef.current)[0] ?? null;`);
L.push(`            if (isPaused.current) {`);
L.push(`              tweenRef.current?.timeScale(0.15);`);
L.push(`            }`);
L.push(`          }`);
L.push(`        },`);
L.push(`      });`);
L.push(`    });`);
L.push(`  }, []);`);
L.push(``);
L.push(`  /* Touch/drag rotation */`);
L.push(`  const dragData = useRef({ startX: 0, startAngle: 0, dragging: false });`);
L.push(``);
L.push(`  const onPointerDown = useCallback((e: React.PointerEvent) => {`);
L.push(`    dragData.current = {`);
L.push(`      startX: e.clientX,`);
L.push(`      startAngle: angleRef.current.value,`);
L.push(`      dragging: true,`);
L.push(`    };`);
L.push(`    tweenRef.current?.pause();`);
L.push(`    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  const onPointerMove = useCallback((e: React.PointerEvent) => {`);
L.push(`    if (!dragData.current.dragging) return;`);
L.push(`    const deltaX = e.clientX - dragData.current.startX;`);
L.push(`    const sensitivity = 0.3;`);
L.push(`    angleRef.current.value = dragData.current.startAngle + deltaX * sensitivity;`);
L.push(``);
L.push(`    const ring = ringRef.current;`);
L.push(`    if (ring) {`);
L.push("      ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;");
L.push(`    }`);
L.push(``);
L.push(`    const raw = (-angleRef.current.value % 360 + 360) % 360;`);
L.push(`    const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`    setActiveIdx(closest);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  const onPointerUp = useCallback(() => {`);
L.push(`    if (!dragData.current.dragging) return;`);
L.push(`    dragData.current.dragging = false;`);
L.push(``);
L.push(`    /* Snap to nearest card */`);
L.push(`    const raw = (-angleRef.current.value % 360 + 360) % 360;`);
L.push(`    const nearest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`    goToCard(nearest);`);
L.push(`  }, [goToCard]);`);
L.push(``);
L.push(`  return (`);
L.push(`    <section id="work" ref={sectionRef} className={s.section}>`);
L.push(`      {/* Header */}`);
L.push(`      <div className={s.header} data-rv="fade">`);
L.push(`        <p className={s.label}>`);
L.push(`          <span className={s.labelLine} aria-hidden="true" />`);
L.push(`          Selected Work`);
L.push(`          <span className={s.labelLine} aria-hidden="true" />`);
L.push(`        </p>`);
L.push(`        <h2 className={s.title}>`);
L.push(`          Projects that speak{" "}`);
L.push(`          <span className="grad-text">louder</span> than words`);
L.push(`        </h2>`);
L.push(`        <p className={s.subtitle}>`);
L.push(`          Immersive 3D experiences we\\u2019ve crafted for brands that demand extraordinary.`);
L.push(`        </p>`);
L.push(`      </div>`);
L.push(``);
L.push(`      {/* 3D Carousel Stage */}`);
L.push(`      <div`);
L.push(`        className={s.stage}`);
L.push(`        onMouseEnter={handleStageEnter}`);
L.push(`        onMouseLeave={handleStageLeave}`);
L.push(`        onPointerDown={onPointerDown}`);
L.push(`        onPointerMove={onPointerMove}`);
L.push(`        onPointerUp={onPointerUp}`);
L.push(`        onPointerCancel={onPointerUp}`);
L.push(`        style={{ touchAction: "pan-y" }}`);
L.push(`      >`);
L.push(`        <div className={s.ring} ref={ringRef}>`);
L.push(`          {FEATURED_PROJECTS.map((project, i) => (`);
L.push(`            <Link`);
L.push(`              key={project.id}`);
L.push("              href={`/portfolio/${project.slug}`}");
L.push("              className={`${s.card}${activeIdx === i ? ` ${s.active}` : \"\"}`}");
L.push(`              ref={(el) => {`);
L.push(`                cardEls.current[i] = el;`);
L.push(`              }}`);
L.push(`              onClick={(e) => {`);
L.push(`                /* If not the front card, rotate to it instead of navigating */`);
L.push(`                if (activeIdx !== i) {`);
L.push(`                  e.preventDefault();`);
L.push(`                  goToCard(i);`);
L.push(`                }`);
L.push(`              }}`);
L.push(`            >`);
L.push(`              <div className={s.prismBorder} aria-hidden="true" />`);
L.push(`              <div className={s.thumbnailWrap}>`);
L.push(`                <div className={s.placeholder}>`);
L.push(`                  <span className={s.placeholderInner}>{project.title}</span>`);
L.push(`                </div>`);
L.push(`                {project.thumbnail && (`);
L.push(`                  <Image`);
L.push(`                    src={project.thumbnail}`);
L.push(`                    alt={project.title}`);
L.push(`                    fill`);
L.push(`                    sizes="(max-width: 767px) 90vw, 550px"`);
L.push(`                    className={s.thumbnail}`);
L.push(`                    placeholder={project.blurDataURL ? "blur" : "empty"}`);
L.push(`                    blurDataURL={project.blurDataURL}`);
L.push(`                  />`);
L.push(`                )}`);
L.push(`                <span className={s.projectNum} aria-hidden="true">`);
L.push(`                  {pad(i + 1)}`);
L.push(`                </span>`);
L.push(`                <div className={s.thumbGradient} aria-hidden="true" />`);
L.push(`                <div className={s.info}>`);
L.push(`                  <div className={s.cardTop}>`);
L.push(`                    <span className={s.category}>{project.category}</span>`);
L.push(`                    <span className={s.year}>{project.year}</span>`);
L.push(`                  </div>`);
L.push(`                  <h3 className={s.cardTitle}>{project.title}</h3>`);
L.push(`                  <div className={s.tags}>`);
L.push(`                    {project.tags.map((tag) => (`);
L.push(`                      <span key={tag} className={s.tag}>`);
L.push(`                        {tag}`);
L.push(`                      </span>`);
L.push(`                    ))}`);
L.push(`                  </div>`);
L.push(`                </div>`);
L.push(`                <div className={s.glowLine} />`);
L.push(`              </div>`);
L.push(`            </Link>`);
L.push(`          ))}`);
L.push(`        </div>`);
L.push(`      </div>`);
L.push(``);
L.push(`      {/* Active project label */}`);
L.push(`      <div className={s.activeLabel}>`);
L.push(`        <span className={s.activeName}>`);
L.push(`          {FEATURED_PROJECTS[activeIdx]?.title}`);
L.push(`        </span>`);
L.push(`        <span className={s.activeCat}>`);
L.push(`          {FEATURED_PROJECTS[activeIdx]?.category}`);
L.push(`        </span>`);
L.push(`      </div>`);
L.push(``);
L.push(`      {/* Dots */}`);
L.push(`      <div className={s.dots}>`);
L.push(`        {FEATURED_PROJECTS.map((_, i) => (`);
L.push(`          <button`);
L.push(`            key={i}`);
L.push("            className={`${s.dot}${activeIdx === i ? ` ${s.dotActive}` : \"\"}`}");
L.push("            aria-label={`Go to project ${i + 1}`}");
L.push(`            onClick={() => goToCard(i)}`);
L.push(`          />`);
L.push(`        ))}`);
L.push(`      </div>`);
L.push(``);
L.push(`      {/* Footer CTA */}`);
L.push(`      <div className={s.footer} data-rv="fade" data-d="2">`);
L.push(`        <Link href="/portfolio" className={s.viewAll}>`);
L.push(`          View All Projects{" "}`);
L.push(`          <span className={s.viewAllCount}>(12+)</span>`);
L.push(`          <span className={s.arrow}>\u2192</span>`);
L.push(`        </Link>`);
L.push(`      </div>`);
L.push(`    </section>`);
L.push(`  );`);
L.push(`}`);

const tsx = L.join("\n");

/* ────────────────────────────────────────── */
/*  Write files                               */
/* ────────────────────────────────────────── */

writeFileSync(CSS_PATH, css);
console.log("CSS written");

writeFileSync(TSX_PATH, tsx);
console.log("TSX written");

console.log("Done! Cosmic Orbit carousel complete.");
