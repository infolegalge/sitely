import { writeFileSync } from "fs";

const CSS_PATH =
  "src/components/sections/home/FeaturedWork/FeaturedWork.module.css";
const TSX_PATH =
  "src/components/sections/home/FeaturedWork/FeaturedWork.tsx";

/* ────────────────────────────────────────── */
/*  CSS                                       */
/* ────────────────────────────────────────── */

const css = `/* ═══════════════════════════════════════════
   FeaturedWork — Homepage §2
   "Cosmic Orbit" v6 — Definitive 3D Carousel

   TRUE 3D box cards with visible thickness:
   - 90° edge panels (proper box geometry)
   - Rim-lit edges for visibility against dark bg
   - Dramatic depth values (20-40px)
   - Depth-based brightness fading
   - Curvature inset shadows + specular

   Interactions:
   - Scroll entrance: fast spin → slow-motion decel
   - Desktop drag with velocity + momentum fling
   - Touch drag with inertia
   - Dot navigation with snap

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
  height: 300px;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
}

.stage:active {
  cursor: grabbing;
}

/* ─── Orbit ring ─── */

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  transform: translate(-50%, -50%) rotateY(0deg);
}

/* ─── Card shell — TRUE 3D box ─── */

.card {
  --depth: 20px;
  position: absolute;
  width: 220px;
  height: 155px;
  top: calc(-155px / 2);
  left: calc(-220px / 2);
  transform-style: preserve-3d;
  text-decoration: none;
  display: block;
  cursor: pointer;
  transition: filter 0.1s linear;
}

/* ── Front face ── */

.cardFront {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(10, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform: translateZ(var(--depth));
  backface-visibility: hidden;
}

.card.active .cardFront {
  border-color: rgba(79, 110, 247, 0.3);
  box-shadow:
    0 20px 60px rgba(79, 110, 247, 0.18),
    0 8px 24px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(79, 110, 247, 0.08);
}

/* ── Curvature shadow — darkens edges for convex curve feel ── */

.cardFront::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.1) 6%,
    transparent 16%,
    transparent 84%,
    rgba(0, 0, 0, 0.1) 94%,
    rgba(0, 0, 0, 0.35) 100%
  );
  pointer-events: none;
  z-index: 15;
}

/* ── Specular highlight — convex center reflection ── */

.cardFront::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    transparent 20%,
    rgba(255, 255, 255, 0.02) 35%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.02) 65%,
    transparent 80%
  );
  opacity: 0;
  transition: opacity 0.5s var(--ease);
  pointer-events: none;
  z-index: 16;
}

.card.active .cardFront::after {
  opacity: 1;
}

/* ── Side edge — left (true 90° box edge) ── */

.edgeLeft {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--depth) * 2);
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(32, 32, 55, 0.95) 0%,
    rgba(20, 20, 38, 0.95) 30%,
    rgba(14, 14, 26, 0.95) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transform-origin: left center;
  transform: rotateY(-90deg);
  backface-visibility: hidden;
}

/* ── Rim light on left edge ── */

.edgeLeft::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(79, 110, 247, 0.15) 0%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(79, 110, 247, 0.05) 100%
  );
}

/* ── Side edge — right (true 90°) ── */

.edgeRight {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(var(--depth) * 2);
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(26, 26, 48, 0.92) 0%,
    rgba(16, 16, 32, 0.95) 30%,
    rgba(10, 10, 20, 0.98) 100%
  );
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  transform-origin: right center;
  transform: rotateY(90deg);
  backface-visibility: hidden;
}

/* ── Rim light on right edge ── */

.edgeRight::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(79, 110, 247, 0.1) 0%,
    rgba(139, 92, 246, 0.08) 50%,
    rgba(79, 110, 247, 0.04) 100%
  );
}

/* ── Side edge — top ── */

.edgeTop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(var(--depth) * 2);
  background: linear-gradient(
    90deg,
    rgba(28, 28, 50, 0.88) 0%,
    rgba(36, 36, 58, 0.92) 50%,
    rgba(28, 28, 50, 0.88) 100%
  );
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transform-origin: top center;
  transform: rotateX(90deg);
  backface-visibility: hidden;
}

/* ── Top edge rim light ── */

.edgeTop::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 10%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 90%
  );
}

/* ── Side edge — bottom ── */

.edgeBottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: calc(var(--depth) * 2);
  background: linear-gradient(
    90deg,
    rgba(12, 12, 24, 0.95) 0%,
    rgba(10, 10, 20, 0.98) 50%,
    rgba(12, 12, 24, 0.95) 100%
  );
  border-left: 1px solid rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.02);
  transform-origin: bottom center;
  transform: rotateX(-90deg);
  backface-visibility: hidden;
}

.card.active .edgeBottom {
  background: linear-gradient(
    90deg,
    rgba(79, 110, 247, 0.12) 0%,
    rgba(139, 92, 246, 0.15) 35%,
    rgba(6, 214, 160, 0.12) 100%
  );
}

/* ── Back face ── */

.cardBack {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: rgba(6, 6, 11, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.03);
  transform: translateZ(calc(var(--depth) * -1)) rotateY(180deg);
  backface-visibility: hidden;
}

/* ── Prismatic border ── */

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

.card.active .prismBorder {
  opacity: 0.7;
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
  font-size: 1rem;
  font-weight: 700;
  color: var(--tx-3);
  opacity: 0.18;
  letter-spacing: -0.02em;
}

/* ─── Project number ─── */

.projectNum {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: var(--font-heading, sans-serif);
  font-size: 1.3rem;
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
  padding: 10px;
  pointer-events: none;
}

.cardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.category {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.48rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--blue);
}

.year {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.35);
}

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  margin-bottom: 3px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.tag {
  font-family: var(--font-body, sans-serif);
  font-size: 0.44rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 6px;
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

.card.active .glowLine {
  transform: scaleX(1);
}

/* ─── Navigation dots ─── */

.dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
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

/* ─── Active label ─── */

.activeLabel {
  text-align: center;
  margin-top: 14px;
  min-height: 40px;
}

.activeName {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--tx);
  display: block;
  margin-bottom: 4px;
  transition: opacity 0.3s ease;
}

.activeCat {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.58rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--blue);
  transition: opacity 0.3s ease;
}

/* ─── Footer CTA ─── */

.footer {
  text-align: center;
  margin-top: 28px;
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

/* ═══════════════════════════════════════════
   480px+
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .section {
    padding: 56px 16px;
  }

  .stage {
    height: 340px;
  }

  .card {
    --depth: 24px;
    width: 260px;
    height: 180px;
    top: calc(-180px / 2);
    left: calc(-260px / 2);
  }

  .cardFront {
    border-radius: 16px;
  }

  .cardTitle {
    font-size: 0.85rem;
  }

  .category,
  .year {
    font-size: 0.52rem;
  }

  .tag {
    font-size: 0.48rem;
  }

  .activeName {
    font-size: 1.2rem;
  }
}

/* ═══════════════════════════════════════════
   640px+
   ═══════════════════════════════════════════ */

@media (min-width: 640px) {
  .stage {
    height: 360px;
    perspective: 1100px;
  }

  .card {
    --depth: 28px;
    width: 300px;
    height: 205px;
    top: calc(-205px / 2);
    left: calc(-300px / 2);
  }

  .info {
    padding: 12px;
  }

  .cardTitle {
    font-size: 0.92rem;
  }

  .projectNum {
    font-size: 1.6rem;
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
    height: 400px;
    perspective: 1200px;
  }

  .card {
    --depth: 32px;
    width: 360px;
    height: 245px;
    top: calc(-245px / 2);
    left: calc(-360px / 2);
  }

  .cardFront {
    border-radius: 18px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .info {
    padding: 14px;
  }

  .cardTitle {
    font-size: 1rem;
    margin-bottom: 4px;
  }

  .category,
  .year {
    font-size: 0.56rem;
  }

  .tag {
    font-size: 0.52rem;
    padding: 2px 7px;
  }

  .projectNum {
    font-size: 2rem;
    top: 10px;
    left: 12px;
  }

  .activeName {
    font-size: 1.4rem;
  }

  .dots {
    gap: 12px;
    margin-top: 28px;
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
    height: 440px;
    perspective: 1400px;
  }

  .card {
    --depth: 36px;
    width: 420px;
    height: 280px;
    top: calc(-280px / 2);
    left: calc(-420px / 2);
  }

  .cardFront {
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: 20px;
  }

  .info {
    padding: 16px;
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
    font-size: 0.56rem;
    padding: 3px 8px;
  }

  .projectNum {
    font-size: 2.5rem;
    top: 12px;
    left: 14px;
  }

  .activeName {
    font-size: 1.5rem;
  }

  .footer {
    margin-top: 32px;
  }
}

/* ═══════════════════════════════════════════
   1280px+
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .stage {
    height: 480px;
    perspective: 1600px;
  }

  .card {
    --depth: 40px;
    width: 460px;
    height: 310px;
    top: calc(-310px / 2);
    left: calc(-460px / 2);
  }

  .cardTitle {
    font-size: 1.2rem;
  }

  .tag {
    font-size: 0.6rem;
    padding: 3px 9px;
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
    height: 260px;
  }

  .card {
    --depth: 14px;
    width: 190px;
    height: 135px;
    top: calc(-135px / 2);
    left: calc(-190px / 2);
  }

  .cardTitle {
    font-size: 0.7rem;
  }

  .tag {
    font-size: 0.4rem;
    padding: 1px 5px;
  }

  .projectNum {
    font-size: 1.1rem;
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
L.push(`function getRadius() {`);
L.push(`  if (typeof window === "undefined") return 280;`);
L.push(`  const w = window.innerWidth;`);
L.push(`  if (w < 380) return 150;`);
L.push(`  if (w < 480) return 180;`);
L.push(`  if (w < 640) return 220;`);
L.push(`  if (w < 768) return 260;`);
L.push(`  if (w < 1024) return 320;`);
L.push(`  if (w < 1280) return 380;`);
L.push(`  return 420;`);
L.push(`}`);
L.push(``);
L.push(`function pad(n: number) {`);
L.push(`  return String(n).padStart(2, "0");`);
L.push(`}`);
L.push(``);
L.push(`/** Depth-based brightness: front=1.0, sides=~0.6, back=~0.28 */`);
L.push(`function applyDepthFade(`);
L.push(`  cards: (HTMLAnchorElement | null)[],`);
L.push(`  ringAngle: number,`);
L.push(`) {`);
L.push(`  for (let j = 0; j < cards.length; j++) {`);
L.push(`    const card = cards[j];`);
L.push(`    if (!card) continue;`);
L.push(`    const world = ((ringAngle + j * ANGLE_STEP) % 360 + 360) % 360;`);
L.push(`    const facing = Math.cos((world * Math.PI) / 180);`);
L.push(`    const t = (facing + 1) / 2;`);
L.push(`    const brightness = 0.28 + 0.72 * t;`);
L.push(`    card.style.filter = \`brightness(\${brightness.toFixed(3)})\`;`);
L.push(`  }`);
L.push(`}`);
L.push(``);
L.push(`function updateRing(`);
L.push(`  ring: HTMLDivElement | null,`);
L.push(`  cards: (HTMLAnchorElement | null)[],`);
L.push(`  angle: number,`);
L.push(`  setActive: (i: number) => void,`);
L.push(`) {`);
L.push(`  if (!ring) return;`);
L.push("  ring.style.transform = `translate(-50%, -50%) rotateY(${angle}deg)`;");
L.push(`  applyDepthFade(cards, angle);`);
L.push(`  const raw = (-angle % 360 + 360) % 360;`);
L.push(`  const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`  setActive(closest);`);
L.push(`}`);
L.push(``);
L.push(`export default function FeaturedWork() {`);
L.push(`  const sectionRef = useRef<HTMLElement>(null);`);
L.push(`  const stageRef = useRef<HTMLDivElement>(null);`);
L.push(`  const ringRef = useRef<HTMLDivElement>(null);`);
L.push(`  const cardEls = useRef<(HTMLAnchorElement | null)[]>([]);`);
L.push(`  const tweenRef = useRef<ReturnType<typeof import("gsap").gsap.to> | null>(null);`);
L.push(`  const angleRef = useRef({ value: 0 });`);
L.push(`  const [activeIdx, setActiveIdx] = useState(0);`);
L.push(`  const hasEnteredRef = useRef(false);`);
L.push(`  const entranceDoneRef = useRef(false);`);
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
L.push(`  /* Start continuous slow spin (counterclockwise) */`);
L.push(`  const startIdleSpin = useCallback(() => {`);
L.push(`    import("gsap").then(({ gsap }) => {`);
L.push(`      tweenRef.current?.kill();`);
L.push(`      tweenRef.current = gsap.to(angleRef.current, {`);
L.push(`        value: "-=" + 360,`);
L.push(`        duration: 28,`);
L.push(`        ease: "none",`);
L.push(`        repeat: -1,`);
L.push(`        onUpdate: () =>`);
L.push(`          updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx),`);
L.push(`      });`);
L.push(`    });`);
L.push(`  }, []);`);
L.push(``);
L.push(`  /* Place cards + scroll entrance */`);
L.push(`  useEffect(() => {`);
L.push(`    const ring = ringRef.current;`);
L.push(`    const stage = stageRef.current;`);
L.push(`    if (!ring || !stage) return;`);
L.push(``);
L.push(`    const radius = getRadius();`);
L.push(`    cardEls.current.forEach((card, i) => {`);
L.push(`      if (!card) return;`);
L.push("      card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${radius}px)`;");
L.push(`    });`);
L.push(`    angleRef.current.value = 0;`);
L.push(`    applyDepthFade(cardEls.current, 0);`);
L.push(``);
L.push(`    /* Scroll entrance: fast spin → slow-motion deceleration */`);
L.push(`    const entranceObs = new IntersectionObserver(`);
L.push(`      (entries) => {`);
L.push(`        if (!entries[0]?.isIntersecting || hasEnteredRef.current) return;`);
L.push(`        hasEnteredRef.current = true;`);
L.push(`        entranceObs.disconnect();`);
L.push(``);
L.push(`        import("gsap").then(({ gsap }) => {`);
L.push(`          /* Fast entrance: 540° in 2s, power3.out = dramatic decel */`);
L.push(`          tweenRef.current = gsap.to(angleRef.current, {`);
L.push(`            value: -540,`);
L.push(`            duration: 2.4,`);
L.push(`            ease: "power3.out",`);
L.push(`            onUpdate: () =>`);
L.push(`              updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx),`);
L.push(`            onComplete: () => {`);
L.push(`              entranceDoneRef.current = true;`);
L.push(`              startIdleSpin();`);
L.push(`            },`);
L.push(`          });`);
L.push(`        });`);
L.push(`      },`);
L.push(`      { threshold: 0.2 },`);
L.push(`    );`);
L.push(`    entranceObs.observe(stage);`);
L.push(``);
L.push(`    function onResize() {`);
L.push(`      const r = getRadius();`);
L.push(`      cardEls.current.forEach((card, i) => {`);
L.push(`        if (!card) return;`);
L.push("        card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${r}px)`;");
L.push(`      });`);
L.push(`    }`);
L.push(``);
L.push(`    window.addEventListener("resize", onResize);`);
L.push(`    return () => {`);
L.push(`      tweenRef.current?.kill();`);
L.push(`      entranceObs.disconnect();`);
L.push(`      window.removeEventListener("resize", onResize);`);
L.push(`    };`);
L.push(`  }, [startIdleSpin]);`);
L.push(``);
L.push(`  /* Hover pause/resume (only after entrance) */`);
L.push(`  const handleStageEnter = useCallback(() => {`);
L.push(`    if (!entranceDoneRef.current) return;`);
L.push(`    tweenRef.current?.timeScale(0.1);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  const handleStageLeave = useCallback(() => {`);
L.push(`    if (!entranceDoneRef.current) return;`);
L.push(`    tweenRef.current?.timeScale(1);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  /* Navigate to card + restart idle after */`);
L.push(`  const goToCard = useCallback((idx: number) => {`);
L.push(`    const targetAngle = -(idx * ANGLE_STEP);`);
L.push(`    const current = angleRef.current.value % 360;`);
L.push(`    let diff = targetAngle - current;`);
L.push(`    while (diff > 180) diff -= 360;`);
L.push(`    while (diff < -180) diff += 360;`);
L.push(`    const newVal = angleRef.current.value + diff;`);
L.push(``);
L.push(`    tweenRef.current?.kill();`);
L.push(``);
L.push(`    import("gsap").then(({ gsap }) => {`);
L.push(`      gsap.to(angleRef.current, {`);
L.push(`        value: newVal,`);
L.push(`        duration: 0.9,`);
L.push(`        ease: "power2.inOut",`);
L.push(`        onUpdate: () => {`);
L.push(`          updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx);`);
L.push(`          setActiveIdx(idx);`);
L.push(`        },`);
L.push(`        onComplete: () => startIdleSpin(),`);
L.push(`      });`);
L.push(`    });`);
L.push(`  }, [startIdleSpin]);`);
L.push(``);
L.push(`  /* ── Drag with velocity tracking + momentum fling ── */`);
L.push(`  const dragRef = useRef({`);
L.push(`    active: false,`);
L.push(`    startX: 0,`);
L.push(`    startAngle: 0,`);
L.push(`    prevX: 0,`);
L.push(`    prevTime: 0,`);
L.push(`    velocity: 0,`);
L.push(`  });`);
L.push(``);
L.push(`  const onPointerDown = useCallback((e: React.PointerEvent) => {`);
L.push(`    tweenRef.current?.kill();`);
L.push(`    const now = performance.now();`);
L.push(`    dragRef.current = {`);
L.push(`      active: true,`);
L.push(`      startX: e.clientX,`);
L.push(`      startAngle: angleRef.current.value,`);
L.push(`      prevX: e.clientX,`);
L.push(`      prevTime: now,`);
L.push(`      velocity: 0,`);
L.push(`    };`);
L.push(`    /* Capture on the stage, not a child element */`);
L.push(`    stageRef.current?.setPointerCapture(e.pointerId);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  const onPointerMove = useCallback((e: React.PointerEvent) => {`);
L.push(`    const d = dragRef.current;`);
L.push(`    if (!d.active) return;`);
L.push(`    const now = performance.now();`);
L.push(`    const dt = now - d.prevTime;`);
L.push(`    const dx = e.clientX - d.prevX;`);
L.push(``);
L.push(`    /* Track velocity (degrees per ms) */`);
L.push(`    if (dt > 0) {`);
L.push(`      d.velocity = (dx * 0.35) / dt;`);
L.push(`    }`);
L.push(`    d.prevX = e.clientX;`);
L.push(`    d.prevTime = now;`);
L.push(``);
L.push(`    const totalDx = e.clientX - d.startX;`);
L.push(`    angleRef.current.value = d.startAngle + totalDx * 0.35;`);
L.push(`    updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx);`);
L.push(`  }, []);`);
L.push(``);
L.push(`  const onPointerUp = useCallback(() => {`);
L.push(`    const d = dragRef.current;`);
L.push(`    if (!d.active) return;`);
L.push(`    d.active = false;`);
L.push(``);
L.push(`    const vel = d.velocity;`);
L.push(`    const abv = Math.abs(vel);`);
L.push(``);
L.push(`    /* Fast fling: add momentum then snap */`);
L.push(`    if (abv > 0.15) {`);
L.push(`      const flingDeg = vel * 400;`);
L.push(`      const targetAngle = angleRef.current.value + flingDeg;`);
L.push(`      const raw = (-targetAngle % 360 + 360) % 360;`);
L.push(`      const nearest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`      const snapAngle = -(nearest * ANGLE_STEP);`);
L.push(`      const current = targetAngle % 360;`);
L.push(`      let diff = snapAngle - current;`);
L.push(`      while (diff > 180) diff -= 360;`);
L.push(`      while (diff < -180) diff += 360;`);
L.push(`      const finalAngle = targetAngle + diff;`);
L.push(``);
L.push(`      import("gsap").then(({ gsap }) => {`);
L.push(`        tweenRef.current = gsap.to(angleRef.current, {`);
L.push(`          value: finalAngle,`);
L.push(`          duration: Math.min(1.8, 0.6 + abv * 2),`);
L.push(`          ease: "power3.out",`);
L.push(`          onUpdate: () =>`);
L.push(`            updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx),`);
L.push(`          onComplete: () => startIdleSpin(),`);
L.push(`        });`);
L.push(`      });`);
L.push(`    } else {`);
L.push(`      /* Slow drag release: just snap to nearest */`);
L.push(`      const raw = (-angleRef.current.value % 360 + 360) % 360;`);
L.push(`      const nearest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;`);
L.push(`      goToCard(nearest);`);
L.push(`    }`);
L.push(`  }, [goToCard, startIdleSpin]);`);
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
L.push(`        ref={stageRef}`);
L.push(`        className={s.stage}`);
L.push(`        onMouseEnter={handleStageEnter}`);
L.push(`        onMouseLeave={handleStageLeave}`);
L.push(`        onPointerDown={onPointerDown}`);
L.push(`        onPointerMove={onPointerMove}`);
L.push(`        onPointerUp={onPointerUp}`);
L.push(`        onPointerCancel={onPointerUp}`);
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
L.push(`                if (activeIdx !== i) {`);
L.push(`                  e.preventDefault();`);
L.push(`                  goToCard(i);`);
L.push(`                }`);
L.push(`              }}`);
L.push(`            >`);
L.push(`              {/* 3D box edges — true 90° with rim lighting */}`);
L.push(`              <div className={s.edgeLeft} aria-hidden="true" />`);
L.push(`              <div className={s.edgeRight} aria-hidden="true" />`);
L.push(`              <div className={s.edgeTop} aria-hidden="true" />`);
L.push(`              <div className={s.edgeBottom} aria-hidden="true" />`);
L.push(`              <div className={s.cardBack} aria-hidden="true" />`);
L.push(``);
L.push(`              {/* Front face — curvature shadow + specular */}`);
L.push(`              <div className={s.cardFront}>`);
L.push(`                <div className={s.prismBorder} aria-hidden="true" />`);
L.push(`                <div className={s.thumbnailWrap}>`);
L.push(`                  <div className={s.placeholder}>`);
L.push(`                    <span className={s.placeholderInner}>{project.title}</span>`);
L.push(`                  </div>`);
L.push(`                  {project.thumbnail && (`);
L.push(`                    <Image`);
L.push(`                      src={project.thumbnail}`);
L.push(`                      alt={project.title}`);
L.push(`                      fill`);
L.push(`                      sizes="(max-width: 767px) 80vw, 460px"`);
L.push(`                      className={s.thumbnail}`);
L.push(`                      placeholder={project.blurDataURL ? "blur" : "empty"}`);
L.push(`                      blurDataURL={project.blurDataURL}`);
L.push(`                    />`);
L.push(`                  )}`);
L.push(`                  <span className={s.projectNum} aria-hidden="true">`);
L.push(`                    {pad(i + 1)}`);
L.push(`                  </span>`);
L.push(`                  <div className={s.thumbGradient} aria-hidden="true" />`);
L.push(`                  <div className={s.info}>`);
L.push(`                    <div className={s.cardTop}>`);
L.push(`                      <span className={s.category}>{project.category}</span>`);
L.push(`                      <span className={s.year}>{project.year}</span>`);
L.push(`                    </div>`);
L.push(`                    <h3 className={s.cardTitle}>{project.title}</h3>`);
L.push(`                    <div className={s.tags}>`);
L.push(`                      {project.tags.map((tag) => (`);
L.push(`                        <span key={tag} className={s.tag}>`);
L.push(`                          {tag}`);
L.push(`                        </span>`);
L.push(`                      ))}`);
L.push(`                    </div>`);
L.push(`                  </div>`);
L.push(`                  <div className={s.glowLine} />`);
L.push(`                </div>`);
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

writeFileSync(CSS_PATH, css);
console.log("CSS written ->", CSS_PATH);

writeFileSync(TSX_PATH, tsx);
console.log("TSX written ->", TSX_PATH);

console.log("\\nDone! v6 — True 3D box + fling + scroll entrance.");
