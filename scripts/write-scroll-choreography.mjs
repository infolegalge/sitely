/**
 * write-scroll-choreography.mjs
 * Generates ScrollChoreography component + CSS + updates page.tsx
 *
 * "Cinematic Sections" — Scroll-driven choreography system:
 *
 * 1) Hero parallax exit — heading/subtitle/CTA drift at different speeds
 * 2) Section 3D entrances — each section scrubs in with rotateX + translateY
 * 3) Inter-section glow dividers — sweep left→right on scroll
 * 4) Background atmosphere gradient — hue shifts per section
 * 5) Floating parallax particles — orbit lines at different depths
 */

import { writeFileSync } from "fs";
import { join } from "path";

const base = process.cwd();
const DIR = join(base, "src/components/animations");
const cssPath = join(DIR, "ScrollChoreography.module.css");
const tsxPath = join(DIR, "ScrollChoreography.tsx");
const pagePath = join(base, "src/app/page.tsx");

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CSS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const css = `/* ═══════════════════════════════════════════
   ScrollChoreography — "Cinematic Sections"

   Full-page scroll-driven animation system:
   1. Hero parallax exit
   2. Section 3D entrances (scrub)
   3. Inter-section glow dividers
   4. Background atmosphere hue shifts
   5. Floating parallax orbit lines
   ═══════════════════════════════════════════ */

/* ─── Wrapper ─── */

.wrapper {
  position: relative;
  z-index: 1;
  overflow: visible;
}

/* ─── Background Atmosphere Layer ─── */

.atmosphere {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.35;
  transition: opacity 0.4s ease;
  will-change: opacity;
}

.atmosphereInner {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 60% at 50% 0%,
    var(--atmo-color, rgba(79, 110, 247, 0.06)) 0%,
    transparent 70%
  );
  transition: background 1.2s ease;
}

/* ─── Inter-Section Glow Dividers ─── */

.divider {
  position: relative;
  height: 1px;
  margin: 0;
  overflow: visible;
  z-index: 2;
}

.dividerLine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--blue) 15%,
    var(--violet) 50%,
    var(--cyan) 85%,
    transparent 100%
  );
  transform: scaleX(0);
  transform-origin: left;
  will-change: transform;
}

.dividerGlow {
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  height: 40px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(79, 110, 247, 0.08) 15%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(6, 214, 160, 0.08) 85%,
    transparent 100%
  );
  transform: scaleX(0);
  transform-origin: left;
  opacity: 0;
  will-change: transform, opacity;
}

/* ─── Floating Parallax Particles ─── */

.particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
}

/* Orbit ring particles */
.particleRing {
  border: 1px solid rgba(79, 110, 247, 0.08);
  background: transparent;
}

/* Dot particles */
.particleDot {
  background: rgba(139, 92, 246, 0.15);
}

/* Line particles */
.particleLine {
  width: 40px !important;
  height: 1px !important;
  border-radius: 0 !important;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(6, 214, 160, 0.12),
    transparent
  );
}

/* ═══════════════════════════════════════════
   Reduced motion
   ═══════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  .atmosphere,
  .particles {
    display: none;
  }

  .dividerLine,
  .dividerGlow {
    transform: scaleX(1);
    opacity: 0.3;
  }
}
`;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TSX
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const lines = [];
const p = (s) => lines.push(s);

p(`"use client";`);
p(``);
p(`import { useEffect, useRef, type ReactNode } from "react";`);
p(`import s from "./ScrollChoreography.module.css";`);
p(``);
p(`/* ─── Section IDs in order ─── */`);
p(`const SECTION_IDS = ["hero", "work", "services", "process", "testimonials"];`);
p(``);
p(`/* ─── Atmosphere colors per section ─── */`);
p(`const ATMO_COLORS = [`);
p(`  "rgba(79, 110, 247, 0.07)",   // hero — blue`);
p(`  "rgba(139, 92, 246, 0.06)",   // work — violet`);
p(`  "rgba(6, 214, 160, 0.06)",    // services — cyan`);
p(`  "rgba(79, 110, 247, 0.05)",   // process — blue`);
p(`  "rgba(234, 179, 8, 0.05)",    // testimonials — gold`);
p(`];`);
p(``);
p(`/* ─── Particle definitions ─── */`);
p(`const PARTICLES = [`);
p(`  { type: "ring", size: 120, x: "8%",  y: "15%", speed: 0.3 },`);
p(`  { type: "dot",  size: 4,   x: "85%", y: "25%", speed: 0.6 },`);
p(`  { type: "line", size: 40,  x: "70%", y: "40%", speed: 0.45 },`);
p(`  { type: "ring", size: 80,  x: "90%", y: "55%", speed: 0.25 },`);
p(`  { type: "dot",  size: 3,   x: "15%", y: "65%", speed: 0.55 },`);
p(`  { type: "line", size: 50,  x: "25%", y: "80%", speed: 0.4 },`);
p(`  { type: "dot",  size: 5,   x: "55%", y: "10%", speed: 0.5 },`);
p(`  { type: "ring", size: 60,  x: "40%", y: "90%", speed: 0.35 },`);
p(`];`);
p(``);
p(`interface Props {`);
p(`  children: ReactNode;`);
p(`}`);
p(``);
p(`export default function ScrollChoreography({ children }: Props) {`);
p(`  const wrapperRef = useRef<HTMLDivElement>(null);`);
p(`  const atmoRef = useRef<HTMLDivElement>(null);`);
p(`  const dividerRefs = useRef<(HTMLDivElement | null)[]>([]);`);
p(`  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);`);
p(``);
p(`  useEffect(() => {`);
p(`    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;`);
p(``);
p(`    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;`);
p(``);
p(`    async function init() {`);
p(`      const { gsap } = await import("gsap");`);
p(`      const { ScrollTrigger } = await import("gsap/ScrollTrigger");`);
p(`      gsap.registerPlugin(ScrollTrigger);`);
p(``);
p(`      const wrapper = wrapperRef.current;`);
p(`      if (!wrapper) return;`);
p(``);
p(`      ctx = gsap.context(() => {`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           1) HERO PARALLAX EXIT`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        const heroEl = document.getElementById("hero");`);
p(`        if (heroEl) {`);
p(`          /* Find hero children for independent parallax speeds */`);
p(`          const heading = heroEl.querySelector("h1");`);
p(`          const subtitle = heroEl.querySelector("p:not([class])") || heroEl.querySelectorAll("p")[1];`);
p(`          const ctaGroup = heroEl.querySelector("[class*='ctaGroup']") || heroEl.querySelector("[class*='cta']");`);
p(`          const label = heroEl.querySelector("[class*='label']");`);
p(``);
p(`          /* Parallax: each layer drifts at different rate */`);
p(`          const paralaxItems: { el: Element; speed: number }[] = [];`);
p(`          if (label) paralaxItems.push({ el: label, speed: -120 });`);
p(`          if (heading) paralaxItems.push({ el: heading, speed: -80 });`);
p(`          if (subtitle) paralaxItems.push({ el: subtitle, speed: -40 });`);
p(`          if (ctaGroup) paralaxItems.push({ el: ctaGroup, speed: -20 });`);
p(``);
p(`          paralaxItems.forEach(({ el, speed }) => {`);
p(`            gsap.to(el, {`);
p(`              y: speed,`);
p(`              ease: "none",`);
p(`              scrollTrigger: {`);
p(`                trigger: heroEl,`);
p(`                start: "top top",`);
p(`                end: "bottom top",`);
p(`                scrub: 0.8,`);
p(`              },`);
p(`            });`);
p(`          });`);
p(``);
p(`          /* Overall hero fade + scale on exit */`);
p(`          gsap.to(heroEl, {`);
p(`            opacity: 0,`);
p(`            scale: 0.95,`);
p(`            ease: "none",`);
p(`            scrollTrigger: {`);
p(`              trigger: heroEl,`);
p(`              start: "60% top",`);
p(`              end: "bottom top",`);
p(`              scrub: 0.6,`);
p(`            },`);
p(`          });`);
p(`        }`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           2) SECTION 3D ENTRANCES`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        /* Skip hero (index 0) — animate sections 1-4 */`);
p(`        SECTION_IDS.slice(1).forEach((id) => {`);
p(`          const el = document.getElementById(id);`);
p(`          if (!el) return;`);
p(``);
p(`          gsap.fromTo(`);
p(`            el,`);
p(`            {`);
p(`              y: 60,`);
p(`              rotateX: 2,`);
p(`              opacity: 0,`);
p(`              transformOrigin: "50% 100%",`);
p(`              transformPerspective: 1200,`);
p(`            },`);
p(`            {`);
p(`              y: 0,`);
p(`              rotateX: 0,`);
p(`              opacity: 1,`);
p(`              ease: "none",`);
p(`              scrollTrigger: {`);
p(`                trigger: el,`);
p(`                start: "top 95%",`);
p(`                end: "top 55%",`);
p(`                scrub: 0.8,`);
p(`              },`);
p(`            },`);
p(`          );`);
p(``);
p(`          /* Subtle exit — scale down + fade as section leaves */`);
p(`          gsap.to(el, {`);
p(`            scale: 0.97,`);
p(`            opacity: 0.3,`);
p(`            ease: "none",`);
p(`            scrollTrigger: {`);
p(`              trigger: el,`);
p(`              start: "70% top",`);
p(`              end: "bottom top",`);
p(`              scrub: 0.6,`);
p(`            },`);
p(`          });`);
p(`        });`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           3) INTER-SECTION GLOW DIVIDERS`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        dividerRefs.current.forEach((divider) => {`);
p(`          if (!divider) return;`);
p(`          const line = divider.querySelector("[class*='dividerLine']");`);
p(`          const glow = divider.querySelector("[class*='dividerGlow']");`);
p(``);
p(`          if (line) {`);
p(`            gsap.to(line, {`);
p(`              scaleX: 1,`);
p(`              ease: "power2.out",`);
p(`              scrollTrigger: {`);
p(`                trigger: divider,`);
p(`                start: "top 80%",`);
p(`                end: "top 40%",`);
p(`                scrub: 1,`);
p(`              },`);
p(`            });`);
p(`          }`);
p(``);
p(`          if (glow) {`);
p(`            gsap.to(glow, {`);
p(`              scaleX: 1,`);
p(`              opacity: 1,`);
p(`              ease: "power2.out",`);
p(`              scrollTrigger: {`);
p(`                trigger: divider,`);
p(`                start: "top 80%",`);
p(`                end: "top 40%",`);
p(`                scrub: 1,`);
p(`              },`);
p(`            });`);
p(`          }`);
p(`        });`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           4) BACKGROUND ATMOSPHERE SHIFTS`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        const atmoInner = atmoRef.current;`);
p(`        if (atmoInner) {`);
p(`          SECTION_IDS.forEach((id, i) => {`);
p(`            const el = document.getElementById(id);`);
p(`            if (!el) return;`);
p(``);
p(`            ScrollTrigger.create({`);
p(`              trigger: el,`);
p(`              start: "top 60%",`);
p(`              end: "bottom 40%",`);
p(`              onEnter: () => {`);
p(`                atmoInner.style.setProperty("--atmo-color", ATMO_COLORS[i]);`);
p(`              },`);
p(`              onEnterBack: () => {`);
p(`                atmoInner.style.setProperty("--atmo-color", ATMO_COLORS[i]);`);
p(`              },`);
p(`            });`);
p(`          });`);
p(`        }`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           5) FLOATING PARALLAX PARTICLES`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        particleRefs.current.forEach((pEl, i) => {`);
p(`          if (!pEl) return;`);
p(`          const def = PARTICLES[i];`);
p(`          if (!def) return;`);
p(``);
p(`          /* Fade in on first scroll */`);
p(`          gsap.to(pEl, {`);
p(`            opacity: 1,`);
p(`            duration: 2,`);
p(`            delay: i * 0.3,`);
p(`            ease: "power2.out",`);
p(`          });`);
p(``);
p(`          /* Parallax drift — each particle moves at its own speed */`);
p(`          gsap.to(pEl, {`);
p(`            y: () => -window.innerHeight * def.speed,`);
p(`            ease: "none",`);
p(`            scrollTrigger: {`);
p(`              trigger: document.documentElement,`);
p(`              start: "top top",`);
p(`              end: "bottom bottom",`);
p(`              scrub: 1.5,`);
p(`            },`);
p(`          });`);
p(``);
p(`          /* Slow rotation for rings */`);
p(`          if (def.type === "ring") {`);
p(`            gsap.to(pEl, {`);
p(`              rotation: 360,`);
p(`              duration: 40 + i * 10,`);
p(`              ease: "none",`);
p(`              repeat: -1,`);
p(`            });`);
p(`          }`);
p(`        });`);
p(``);
p(`      }, wrapper);`);
p(`    }`);
p(``);
p(`    init();`);
p(``);
p(`    return () => {`);
p(`      ctx?.revert();`);
p(`    };`);
p(`  }, []);`);
p(``);
p(`  /* ─── Divider IDs (placed between sections): 4 dividers ─── */`);
p(`  const dividerCount = SECTION_IDS.length - 1;`);
p(``);
p(`  return (`);
p(`    <>`);
p(`      {/* Fixed atmosphere layer */}`);
p(`      <div className={s.atmosphere}>`);
p(`        <div className={s.atmosphereInner} ref={atmoRef} />`);
p(`      </div>`);
p(``);
p(`      {/* Fixed parallax particles */}`);
p(`      <div className={s.particles}>`);
p(`        {PARTICLES.map((def, i) => (`);
p(`          <div`);
p(`            key={i}`);
p(`            ref={(el) => { particleRefs.current[i] = el; }}`);
p(`            className={\`\${s.particle} \${`);
p(`              def.type === "ring"`);
p(`                ? s.particleRing`);
p(`                : def.type === "dot"`);
p(`                  ? s.particleDot`);
p(`                  : s.particleLine`);
p(`            }\`}`);
p(`            style={{`);
p(`              width: def.size,`);
p(`              height: def.type === "line" ? 1 : def.size,`);
p(`              left: def.x,`);
p(`              top: def.y,`);
p(`            }}`);
p(`          />`);
p(`        ))}`);
p(`      </div>`);
p(``);
p(`      {/* Main content wrapper */}`);
p(`      <div ref={wrapperRef} className={s.wrapper}>`);
p(`        {children}`);
p(`      </div>`);
p(``);
p(`      {/* Glow dividers — injected via portal-like approach */}`);
p(`      <DividerInjector count={dividerCount} refs={dividerRefs} />`);
p(`    </>`);
p(`  );`);
p(`}`);
p(``);
p(`/* ─── Divider Injector: inserts glow dividers between sections ─── */`);
p(``);
p(`function DividerInjector({`);
p(`  count,`);
p(`  refs,`);
p(`}: {`);
p(`  count: number;`);
p(`  refs: React.RefObject<(HTMLDivElement | null)[]>;`);
p(`}) {`);
p(`  const mountedRef = useRef(false);`);
p(``);
p(`  useEffect(() => {`);
p(`    if (mountedRef.current) return;`);
p(`    mountedRef.current = true;`);
p(``);
p(`    /* Find each section boundary and insert dividers */`);
p(`    for (let i = 0; i < count; i++) {`);
p(`      const currentId = SECTION_IDS[i];`);
p(`      const currentEl = document.getElementById(currentId);`);
p(`      if (!currentEl) continue;`);
p(``);
p(`      const divider = document.createElement("div");`);
p(`      divider.className = "${""}" + "divider";`);
p(`      divider.setAttribute("aria-hidden", "true");`);
p(`      divider.style.position = "relative";`);
p(`      divider.style.height = "1px";`);
p(`      divider.style.zIndex = "2";`);
p(``);
p(`      const line = document.createElement("div");`);
p(`      line.style.position = "absolute";`);
p(`      line.style.top = "0";`);
p(`      line.style.left = "0";`);
p(`      line.style.width = "100%";`);
p(`      line.style.height = "1px";`);
p(`      line.style.background = "linear-gradient(90deg, transparent 0%, #4f6ef7 15%, #8b5cf6 50%, #06d6a0 85%, transparent 100%)";`);
p(`      line.style.transform = "scaleX(0)";`);
p(`      line.style.transformOrigin = "left";`);
p(`      line.style.willChange = "transform";`);
p(`      line.className = "dividerLine";`);
p(``);
p(`      const glow = document.createElement("div");`);
p(`      glow.style.position = "absolute";`);
p(`      glow.style.top = "-20px";`);
p(`      glow.style.left = "0";`);
p(`      glow.style.width = "100%";`);
p(`      glow.style.height = "40px";`);
p(`      glow.style.background = "linear-gradient(90deg, transparent 0%, rgba(79,110,247,0.08) 15%, rgba(139,92,246,0.1) 50%, rgba(6,214,160,0.08) 85%, transparent 100%)";`);
p(`      glow.style.transform = "scaleX(0)";`);
p(`      glow.style.transformOrigin = "left";`);
p(`      glow.style.opacity = "0";`);
p(`      glow.style.willChange = "transform, opacity";`);
p(`      glow.className = "dividerGlow";`);
p(``);
p(`      divider.appendChild(line);`);
p(`      divider.appendChild(glow);`);
p(`      currentEl.after(divider);`);
p(``);
p(`      if (refs.current) refs.current[i] = divider;`);
p(`    }`);
p(`  }, [count, refs]);`);
p(``);
p(`  return null;`);
p(`}`);

const tsx = lines.join("\n");

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   page.tsx update
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const pageTsx = `import HeroSection from "@/components/sections/home/HeroSection/HeroSection";
import FeaturedWork from "@/components/sections/home/FeaturedWork/FeaturedWork";
import ServicesPreview from "@/components/sections/home/ServicesPreview/ServicesPreview";
import ProcessSection from "@/components/sections/home/ProcessSection/ProcessSection";
import Testimonials from "@/components/sections/home/Testimonials/Testimonials";
import ScrollChoreography from "@/components/animations/ScrollChoreography";

export default function Home() {
  return (
    <ScrollChoreography>
      <HeroSection />
      <FeaturedWork />
      <ServicesPreview />
      <ProcessSection />
      <Testimonials />
    </ScrollChoreography>
  );
}
`;

/* ━━ Write ━━ */
import { mkdirSync } from "fs";
mkdirSync(DIR, { recursive: true });

writeFileSync(cssPath, css);
console.log("CSS written ->", cssPath);

writeFileSync(tsxPath, tsx);
console.log("TSX written ->", tsxPath);

writeFileSync(pagePath, pageTsx);
console.log("page.tsx written ->", pagePath);

console.log("\nDone! Cinematic Sections scroll choreography generated.");
