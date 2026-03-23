import { writeFileSync } from "fs";

/* ═══════════════════════════════════════════
   FeaturedWork §2 — "Cinematic Showcase" redesign
   Writes both CSS and TSX files
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
   "Cinematic Showcase"

   3D perspective gallery with floating glass panels.
   GSAP ScrollTrigger cinematic entrances.
   Idle floating animation, specular mouse highlight,
   prismatic hover borders. Cosmos bleeds through
   transparent glass gaps.

   Breakpoints:
     max-380  → small mobile
     base     → 0-479 stacked
     480px    → wider mobile
     768px    → 2-col + glass blur
     1024px   → 12-col bento zigzag, full 3D
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
}

/* ─── Header ─── */

.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
}

.headerLeft {
  max-width: 640px;
}

.label {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--blue);
  border-left: 2px solid var(--blue);
  padding-left: 10px;
  margin-bottom: 12px;
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.6rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--tx);
  letter-spacing: -0.02em;
}

.viewAll {
  font-family: var(--font-body, sans-serif);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--tx-2);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--brd-2);
  transition: color 0.3s var(--ease), border-color 0.3s var(--ease);
  flex-shrink: 0;
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

/* ─── Perspective Stage ─── */

.stage {
  perspective: 1200px;
}

/* ─── Grid ─── */

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  transform-style: preserve-3d;
}

/* ─── Project Card ─── */

.card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(10, 10, 18, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-decoration: none;
  display: block;
  transform-style: preserve-3d;
  will-change: transform;
  transition:
    border-color 0.4s var(--ease),
    box-shadow 0.5s var(--ease);
}

.card:active {
  transform: scale(0.98);
}

.cardA { position: relative; }
.cardB { position: relative; }
.cardC { position: relative; }
.cardD { position: relative; }

/* ── Idle float animation ── */

@keyframes floatA {
  0%, 100% { transform: translateY(0) rotateX(0); }
  50% { transform: translateY(-5px) rotateX(0.3deg); }
}

@keyframes floatB {
  0%, 100% { transform: translateY(0) rotateX(0); }
  50% { transform: translateY(-4px) rotateX(-0.2deg); }
}

@keyframes floatC {
  0%, 100% { transform: translateY(0) rotateX(0); }
  50% { transform: translateY(-6px) rotateX(0.2deg); }
}

@keyframes floatD {
  0%, 100% { transform: translateY(0) rotateX(0); }
  50% { transform: translateY(-3px) rotateX(-0.3deg); }
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

/* ── Specular highlight (follows mouse) ── */

.specular {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.06),
    transparent 60%
  );
  pointer-events: none;
  z-index: 8;
  opacity: 0;
  transition: opacity 0.4s var(--ease);
  transform: translate(-50%, -50%);
}

/* ─── Thumbnail ─── */

.thumbnailWrap {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: rgba(6, 6, 11, 0.4);
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s var(--ease), filter 0.6s var(--ease);
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
  font-size: clamp(1.1rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--tx-3);
  opacity: 0.22;
  letter-spacing: -0.02em;
}

/* ─── Project number ─── */

.projectNum {
  position: absolute;
  top: 10px;
  left: 12px;
  font-family: var(--font-heading, sans-serif);
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.15;
  z-index: 2;
  pointer-events: none;
}

/* ─── Thumbnail gradient ─── */

.thumbGradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65%;
  background: linear-gradient(
    to top,
    rgba(6, 6, 11, 0.88) 0%,
    rgba(6, 6, 11, 0.45) 40%,
    transparent 100%
  );
  z-index: 1;
  pointer-events: none;
}

/* ─── Hover overlay ─── */

.hoverOverlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 6, 11, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.4s var(--ease);
  pointer-events: none;
}

.hoverCta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 40px;
  font-family: var(--font-body, sans-serif);
  font-size: 0.75rem;
  font-weight: 500;
  color: #fff;
  letter-spacing: 0.4px;
  transform: translateY(8px) scale(0.95);
  transition: transform 0.4s var(--ease), border-color 0.3s var(--ease);
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

/* ─── Scan line ─── */

.scanLine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(79, 110, 247, 0.25),
    transparent
  );
  z-index: 9;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s var(--ease);
}

@keyframes scanDown {
  0% { top: 0; }
  100% { top: 100%; }
}

/* ─── Card Info ─── */

.info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 14px 12px;
  pointer-events: none;
}

.cardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}

.category {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.58rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--blue);
}

.year {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.4);
}

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
  line-height: 1.2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  font-family: var(--font-body, sans-serif);
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.55);
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

/* ─── Mobile CTA ─── */

.mobileCta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 24px;
  padding: 14px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(12, 12, 22, 0.4);
  font-family: var(--font-body, sans-serif);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--tx);
  text-decoration: none;
  transition: border-color 0.3s var(--ease), background 0.3s var(--ease);
}

.mobileCta:active {
  background: rgba(12, 12, 22, 0.6);
  border-color: var(--blue);
}

/* ═══════════════════════════════════════════
   480px+ — Larger mobile
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .section {
    padding: 56px 16px;
  }

  .header {
    margin-bottom: 32px;
  }

  .grid {
    gap: 22px;
  }

  .card {
    border-radius: 18px;
  }

  .info {
    padding: 16px 14px;
  }

  .cardTitle {
    font-size: 1.05rem;
  }

  .projectNum {
    font-size: 2rem;
  }

  .tag {
    font-size: 0.62rem;
    padding: 3px 9px;
  }
}

/* ═══════════════════════════════════════════
   768px+ — Tablet
   ═══════════════════════════════════════════ */

@media (min-width: 768px) {
  .section {
    padding: 72px 20px;
  }

  .header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0;
    margin-bottom: 40px;
  }

  .label {
    font-size: 0.7rem;
    margin-bottom: 16px;
  }

  .viewAll {
    font-size: 0.82rem;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .thumbnailWrap {
    aspect-ratio: 3 / 2;
  }

  .card {
    border-radius: 20px;
    background: rgba(10, 10, 18, 0.28);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .card:active {
    transform: none;
  }

  .card:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow:
      0 20px 50px rgba(79, 110, 247, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .card:hover .prismBorder {
    opacity: 0.55;
  }

  .card:hover .thumbnail {
    transform: scale(1.04);
  }

  .card:hover .glowLine {
    transform: scaleX(1);
  }

  .card:hover .hoverOverlay {
    opacity: 1;
  }

  .card:hover .hoverCta {
    transform: translateY(0) scale(1);
  }

  .card:hover .scanLine {
    opacity: 1;
    animation: scanDown 1.5s linear infinite;
  }

  .card:hover .specular {
    opacity: 1;
  }

  .info {
    padding: 18px 16px;
  }

  .category,
  .year {
    font-size: 0.62rem;
  }

  .cardTitle {
    font-size: 1.1rem;
    margin-bottom: 6px;
  }

  .projectNum {
    font-size: 2.5rem;
    top: 14px;
    left: 16px;
  }

  .tag {
    font-size: 0.65rem;
  }

  .mobileCta {
    display: none;
  }

  .thumbGradient {
    height: 70%;
    background: linear-gradient(
      to top,
      rgba(6, 6, 11, 0.92) 0%,
      rgba(6, 6, 11, 0.5) 45%,
      transparent 100%
    );
  }
}

/* ═══════════════════════════════════════════
   1024px+ — Desktop: 12-col bento + full 3D
   Row 1: cardA (7fr) | cardB (5fr)
   Row 2: cardC (5fr) | cardD (7fr)
   ═══════════════════════════════════════════ */

@media (min-width: 1024px) {
  .section {
    padding: clamp(80px, 8vh, 110px) 24px;
  }

  .header {
    margin-bottom: clamp(36px, 4vh, 56px);
  }

  .viewAll {
    font-size: 0.85rem;
  }

  .grid {
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: auto auto;
    gap: 28px;
  }

  .cardA { grid-column: 1 / 8;  grid-row: 1; animation: floatA 6s ease-in-out infinite; }
  .cardB { grid-column: 8 / 13; grid-row: 1; animation: floatB 7s ease-in-out infinite; }
  .cardC { grid-column: 1 / 6;  grid-row: 2; animation: floatC 8s ease-in-out infinite; }
  .cardD { grid-column: 6 / 13; grid-row: 2; animation: floatD 5.5s ease-in-out infinite; }

  .thumbnailWrap {
    aspect-ratio: 16 / 10;
  }

  .card {
    perspective: 800px;
    background: rgba(10, 10, 18, 0.22);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-radius: 22px;
  }

  .card:hover {
    box-shadow:
      0 24px 64px rgba(79, 110, 247, 0.12),
      0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .info {
    padding: clamp(16px, 1.5vw, 24px) clamp(14px, 1.5vw, 22px);
  }

  .cardTitle {
    font-size: clamp(1rem, 1.6vw, 1.35rem);
  }

  .projectNum {
    font-size: 3rem;
    top: 16px;
    left: 20px;
    opacity: 0.12;
  }

  .cardA .projectNum {
    font-size: 3.6rem;
  }

  .cardA .cardTitle {
    font-size: clamp(1.1rem, 1.8vw, 1.5rem);
  }

  .hoverCta {
    font-size: 0.78rem;
    padding: 10px 22px;
  }

  .specular {
    width: 280px;
    height: 280px;
  }
}

/* ═══════════════════════════════════════════
   1280px+
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .grid {
    gap: 32px;
  }

  .info {
    padding: 22px 20px;
  }

  .cardTitle {
    font-size: 1.3rem;
  }

  .cardA .cardTitle {
    font-size: 1.5rem;
  }

  .tag {
    font-size: 0.68rem;
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

  .header {
    gap: 12px;
    margin-bottom: 24px;
  }

  .title {
    font-size: 1.45rem;
  }

  .grid {
    gap: 16px;
  }

  .info {
    padding: 12px 10px;
  }

  .cardTitle {
    font-size: 0.88rem;
  }

  .projectNum {
    font-size: 1.5rem;
    top: 8px;
    left: 10px;
  }

  .tag {
    font-size: 0.55rem;
    padding: 2px 7px;
  }

  .viewAll {
    font-size: 0.72rem;
  }
}
`;

/* ────────────────────────────────────────── */
/*  TSX                                       */
/* ────────────────────────────────────────── */

const lines = [];

lines.push(`"use client";`);
lines.push(``);
lines.push(`import { useCallback, useEffect, useRef } from "react";`);
lines.push(`import Link from "next/link";`);
lines.push(`import Image from "next/image";`);
lines.push(`import { FEATURED_PROJECTS } from "@/lib/constants";`);
lines.push(`import { useIsMobile } from "@/hooks/useIsMobile";`);
lines.push(`import s from "./FeaturedWork.module.css";`);
lines.push(``);
lines.push(`/** Zero-padded index */`);
lines.push(`function pad(n: number) {`);
lines.push(`  return String(n).padStart(2, "0");`);
lines.push(`}`);
lines.push(``);
lines.push(`export default function FeaturedWork() {`);
lines.push(`  const sectionRef = useRef<HTMLElement>(null);`);
lines.push(`  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);`);
lines.push(`  const specRefs = useRef<(HTMLDivElement | null)[]>([]);`);
lines.push(`  const isMobile = useIsMobile();`);
lines.push(``);
lines.push(`  /* data-rv reveal */`);
lines.push(`  useEffect(() => {`);
lines.push(`    const section = sectionRef.current;`);
lines.push(`    if (!section) return;`);
lines.push(``);
lines.push(`    const els = section.querySelectorAll<HTMLElement>("[data-rv]");`);
lines.push(`    if (!els.length) return;`);
lines.push(``);
lines.push(`    const observer = new IntersectionObserver(`);
lines.push(`      (entries) => {`);
lines.push(`        entries.forEach((entry) => {`);
lines.push(`          if (entry.isIntersecting) {`);
lines.push(`            entry.target.classList.add("visible");`);
lines.push(`            observer.unobserve(entry.target);`);
lines.push(`          }`);
lines.push(`        });`);
lines.push(`      },`);
lines.push(`      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },`);
lines.push(`    );`);
lines.push(``);
lines.push(`    els.forEach((el) => observer.observe(el));`);
lines.push(`    return () => observer.disconnect();`);
lines.push(`  }, []);`);
lines.push(``);
lines.push(`  /* GSAP ScrollTrigger — cinematic 3D entrance + parallax */`);
lines.push(`  useEffect(() => {`);
lines.push(`    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;`);
lines.push(``);
lines.push(`    async function init() {`);
lines.push(`      const { gsap } = await import("gsap");`);
lines.push(`      const { ScrollTrigger } = await import("gsap/ScrollTrigger");`);
lines.push(`      gsap.registerPlugin(ScrollTrigger);`);
lines.push(``);
lines.push(`      const section = sectionRef.current;`);
lines.push(`      if (!section) return;`);
lines.push(``);
lines.push(`      ctx = gsap.context(() => {`);
lines.push(`        const cards = cardRefs.current.filter(Boolean) as HTMLElement[];`);
lines.push(``);
lines.push(`        /* Cinematic 3D entrance — each card from a different angle */`);
lines.push(`        const entranceConfigs = [`);
lines.push(`          { rotateY: -12, rotateX: 8, x: -60 },  /* A — from left */`);
lines.push(`          { rotateY: 10, rotateX: 5, x: 50 },    /* B — from right */`);
lines.push(`          { rotateY: 8, rotateX: -6, x: -40 },   /* C — from left */`);
lines.push(`          { rotateY: -10, rotateX: 7, x: 60 },   /* D — from right */`);
lines.push(`        ];`);
lines.push(``);
lines.push(`        cards.forEach((card, i) => {`);
lines.push(`          const cfg = entranceConfigs[i] || entranceConfigs[0];`);
lines.push(`          gsap.fromTo(`);
lines.push(`            card,`);
lines.push(`            {`);
lines.push(`              y: 80,`);
lines.push(`              x: cfg.x,`);
lines.push(`              rotateY: cfg.rotateY,`);
lines.push(`              rotateX: cfg.rotateX,`);
lines.push(`              opacity: 0,`);
lines.push(`              scale: 0.88,`);
lines.push(`            },`);
lines.push(`            {`);
lines.push(`              y: 0,`);
lines.push(`              x: 0,`);
lines.push(`              rotateY: 0,`);
lines.push(`              rotateX: 0,`);
lines.push(`              opacity: 1,`);
lines.push(`              scale: 1,`);
lines.push(`              duration: 1.1,`);
lines.push(`              ease: "power3.out",`);
lines.push(`              scrollTrigger: {`);
lines.push(`                trigger: card,`);
lines.push(`                start: "top 90%",`);
lines.push(`                end: "top 55%",`);
lines.push(`                toggleActions: "play none none none",`);
lines.push(`              },`);
lines.push(`              delay: i * 0.1,`);
lines.push(`            },`);
lines.push(`          );`);
lines.push(`        });`);
lines.push(``);
lines.push(`        /* Parallax depth — cards at different speeds */`);
lines.push(`        const depths = [-18, 12, -10, 15];`);
lines.push(`        cards.forEach((card, i) => {`);
lines.push(`          gsap.to(card, {`);
lines.push(`            y: depths[i] ?? 0,`);
lines.push(`            ease: "none",`);
lines.push(`            scrollTrigger: {`);
lines.push(`              trigger: section,`);
lines.push(`              start: "top bottom",`);
lines.push(`              end: "bottom top",`);
lines.push(`              scrub: 1.5,`);
lines.push(`            },`);
lines.push(`          });`);
lines.push(`        });`);
lines.push(`      }, section);`);
lines.push(`    }`);
lines.push(``);
lines.push(`    init();`);
lines.push(`    return () => ctx?.revert();`);
lines.push(`  }, []);`);
lines.push(``);
lines.push(`  /* Desktop: 3D tilt + specular highlight tracking */`);
lines.push(`  const handleMouseMove = useCallback(`);
lines.push(`    (e: React.MouseEvent<HTMLAnchorElement>, idx: number) => {`);
lines.push(`      const card = e.currentTarget;`);
lines.push(`      const rect = card.getBoundingClientRect();`);
lines.push(`      const x = (e.clientX - rect.left) / rect.width - 0.5;`);
lines.push(`      const y = (e.clientY - rect.top) / rect.height - 0.5;`);
lines.push(``);
lines.push("      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;");
lines.push(``);
lines.push(`      /* Move specular highlight */`);
lines.push(`      const spec = specRefs.current[idx];`);
lines.push(`      if (spec) {`);
lines.push("        spec.style.left = `${e.clientX - rect.left}px`;");
lines.push("        spec.style.top = `${e.clientY - rect.top}px`;");
lines.push(`      }`);
lines.push(`    },`);
lines.push(`    [],`);
lines.push(`  );`);
lines.push(``);
lines.push(`  const handleMouseLeave = useCallback(`);
lines.push(`    (e: React.MouseEvent<HTMLAnchorElement>) => {`);
lines.push(`      e.currentTarget.style.transform = "";`);
lines.push(`    },`);
lines.push(`    [],`);
lines.push(`  );`);
lines.push(``);
lines.push(`  const posClass = [s.cardA, s.cardB, s.cardC, s.cardD];`);
lines.push(`  const visibleProjects = isMobile`);
lines.push(`    ? FEATURED_PROJECTS.slice(0, 2)`);
lines.push(`    : FEATURED_PROJECTS;`);
lines.push(``);
lines.push(`  return (`);
lines.push(`    <section id="work" ref={sectionRef} className={s.section}>`);
lines.push(`      {/* Header */}`);
lines.push(`      <div className={s.header} data-rv="fade">`);
lines.push(`        <div className={s.headerLeft}>`);
lines.push(`          <p className={s.label}>Selected Work</p>`);
lines.push(`          <h2 className={s.title}>`);
lines.push(`            Projects that speak{" "}`);
lines.push(`            <span className="grad-text">louder</span> than words`);
lines.push(`          </h2>`);
lines.push(`        </div>`);
lines.push(`        {!isMobile && (`);
lines.push(`          <Link href="/portfolio" className={s.viewAll}>`);
lines.push(`            View All Projects{" "}`);
lines.push(`            <span className={s.viewAllCount}>(12+)</span>`);
lines.push(`            <span className={s.arrow}>\u2192</span>`);
lines.push(`          </Link>`);
lines.push(`        )}`);
lines.push(`      </div>`);
lines.push(``);
lines.push(`      {/* Perspective Stage */}`);
lines.push(`      <div className={s.stage}>`);
lines.push(`        <div className={s.grid}>`);
lines.push(`          {visibleProjects.map((project, i) => (`);
lines.push(`            <Link`);
lines.push(`              key={project.id}`);
lines.push("              href={`/portfolio/${project.slug}`}");
lines.push("              className={`${s.card} ${posClass[i] ?? \"\"}`}");
lines.push(`              data-rv="fade"`);
lines.push(`              data-d={String(i + 1)}`);
lines.push(`              ref={(el) => {`);
lines.push(`                cardRefs.current[i] = el;`);
lines.push(`              }}`);
lines.push(`              {...(!isMobile && {`);
lines.push(`                onMouseMove: (e: React.MouseEvent<HTMLAnchorElement>) =>`);
lines.push(`                  handleMouseMove(e, i),`);
lines.push(`                onMouseLeave: handleMouseLeave,`);
lines.push(`              })}`);
lines.push(`            >`);
lines.push(`              {/* Prismatic border */}`);
lines.push(`              <div className={s.prismBorder} aria-hidden="true" />`);
lines.push(``);
lines.push(`              {/* Specular highlight */}`);
lines.push(`              {!isMobile && (`);
lines.push(`                <div`);
lines.push(`                  className={s.specular}`);
lines.push(`                  aria-hidden="true"`);
lines.push(`                  ref={(el) => {`);
lines.push(`                    specRefs.current[i] = el;`);
lines.push(`                  }}`);
lines.push(`                />`);
lines.push(`              )}`);
lines.push(``);
lines.push(`              {/* Thumbnail */}`);
lines.push(`              <div className={s.thumbnailWrap}>`);
lines.push(`                <div className={s.placeholder}>`);
lines.push(`                  <span className={s.placeholderInner}>{project.title}</span>`);
lines.push(`                </div>`);
lines.push(`                {project.thumbnail && (`);
lines.push(`                  <Image`);
lines.push(`                    src={project.thumbnail}`);
lines.push(`                    alt={project.title}`);
lines.push(`                    fill`);
lines.push(`                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 58vw"`);
lines.push(`                    className={s.thumbnail}`);
lines.push(`                    placeholder={project.blurDataURL ? "blur" : "empty"}`);
lines.push(`                    blurDataURL={project.blurDataURL}`);
lines.push(`                  />`);
lines.push(`                )}`);
lines.push(``);
lines.push(`                {/* Project number */}`);
lines.push(`                <span className={s.projectNum} aria-hidden="true">`);
lines.push(`                  {pad(i + 1)}`);
lines.push(`                </span>`);
lines.push(``);
lines.push(`                {/* Gradient */}`);
lines.push(`                <div className={s.thumbGradient} aria-hidden="true" />`);
lines.push(``);
lines.push(`                {/* Info */}`);
lines.push(`                <div className={s.info}>`);
lines.push(`                  <div className={s.cardTop}>`);
lines.push(`                    <span className={s.category}>{project.category}</span>`);
lines.push(`                    <span className={s.year}>{project.year}</span>`);
lines.push(`                  </div>`);
lines.push(`                  <h3 className={s.cardTitle}>{project.title}</h3>`);
lines.push(`                  <div className={s.tags}>`);
lines.push(`                    {project.tags.map((tag) => (`);
lines.push(`                      <span key={tag} className={s.tag}>`);
lines.push(`                        {tag}`);
lines.push(`                      </span>`);
lines.push(`                    ))}`);
lines.push(`                  </div>`);
lines.push(`                </div>`);
lines.push(``);
lines.push(`                {/* Hover overlay */}`);
lines.push(`                {!isMobile && (`);
lines.push(`                  <div className={s.hoverOverlay} aria-hidden="true">`);
lines.push(`                    <span className={s.hoverCta}>`);
lines.push(`                      View Project <span className={s.arrow}>\u2192</span>`);
lines.push(`                    </span>`);
lines.push(`                  </div>`);
lines.push(`                )}`);
lines.push(``);
lines.push(`                {/* Scan line */}`);
lines.push(`                <div className={s.scanLine} aria-hidden="true" />`);
lines.push(``);
lines.push(`                {/* Glow line */}`);
lines.push(`                <div className={s.glowLine} />`);
lines.push(`              </div>`);
lines.push(`            </Link>`);
lines.push(`          ))}`);
lines.push(`        </div>`);
lines.push(`      </div>`);
lines.push(``);
lines.push(`      {/* Mobile CTA */}`);
lines.push(`      {isMobile && (`);
lines.push(`        <Link href="/portfolio" className={s.mobileCta} data-rv="fade" data-d="3">`);
lines.push(`          View All Projects{" "}`);
lines.push(`          <span className={s.viewAllCount}>(12+)</span>`);
lines.push(`          <span className={s.arrow}>\u2192</span>`);
lines.push(`        </Link>`);
lines.push(`      )}`);
lines.push(`    </section>`);
lines.push(`  );`);
lines.push(`}`);

const tsx = lines.join("\n");

/* ────────────────────────────────────────── */
/*  Write files                               */
/* ────────────────────────────────────────── */

writeFileSync(CSS_PATH, css);
console.log("CSS written →", CSS_PATH);

writeFileSync(TSX_PATH, tsx);
console.log("TSX written →", TSX_PATH);

console.log("\nDone! Cinematic Showcase FeaturedWork §2 complete.");
