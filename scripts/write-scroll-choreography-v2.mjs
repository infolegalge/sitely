/**
 * write-scroll-choreography-v2.mjs
 * 
 * COMPLETE REWRITE — fixes ALL animation conflicts:
 *
 * Root causes fixed:
 * 1. No dual ScrollTrigger on same element+property
 * 2. No section-level opacity (preserves data-rv system)
 * 3. No section animations for components with internal ScrollTrigger
 * 4. Dividers rendered as React children (no DOM injection race)
 * 5. ServicesPreview card toggleActions fixed to reverse
 * 6. Testimonials card toggleActions fixed to reverse
 * 7. Hero parallax targets children only, not section element
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const base = process.cwd();
const ANIM_DIR = join(base, "src/components/animations");
const cssPath = join(ANIM_DIR, "ScrollChoreography.module.css");
const tsxPath = join(ANIM_DIR, "ScrollChoreography.tsx");
const pagePath = join(base, "src/app/page.tsx");
const servicesPath = join(base, "src/components/sections/home/ServicesPreview/ServicesPreview.tsx");
const testimonialsPath = join(base, "src/components/sections/home/Testimonials/Testimonials.tsx");

mkdirSync(ANIM_DIR, { recursive: true });

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. CSS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const css = `/* ═══════════════════════════════════════════
   ScrollChoreography v2 — "Cinematic Sections"

   Conflict-free scroll-driven system:
   1. Hero parallax exit (children only)
   2. Background atmosphere hue shifts
   3. Inter-section glow dividers (React-rendered)
   4. Floating parallax particles
   
   DOES NOT animate section opacity/transform
   to avoid conflicts with internal component
   animations (data-rv, ServicesPreview ScrollTrigger,
   Testimonials ScrollTrigger, FeaturedWork spin).
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
  transition: background 1.4s ease;
}

/* ─── Inter-Section Glow Dividers ─── */

.divider {
  position: relative;
  height: 1px;
  z-index: 2;
  overflow: visible;
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

.particleRing {
  border: 1px solid rgba(79, 110, 247, 0.08);
  background: transparent;
}

.particleDot {
  background: rgba(139, 92, 246, 0.15);
}

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

writeFileSync(cssPath, css);
console.log("CSS written ->", cssPath);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. TSX — ScrollChoreography
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const L = [];
const p = (s) => L.push(s);

p(`"use client";`);
p(``);
p(`import React, { useEffect, useRef, Children, type ReactNode } from "react";`);
p(`import s from "./ScrollChoreography.module.css";`);
p(``);
p(`/* ─── Section IDs in display order ─── */`);
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
p(`           Only targets child elements, NOT the`);
p(`           section itself — avoids opacity conflict`);
p(`           with HeroSection's own GSAP animations.`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        const heroEl = document.getElementById("hero");`);
p(`        if (heroEl) {`);
p(`          const heading = heroEl.querySelector("h1");`);
p(`          const allP = heroEl.querySelectorAll("p");`);
p(`          const subtitle = allP.length > 1 ? allP[1] : allP[0];`);
p(`          const ctaGroup = heroEl.querySelector("[class*=\\"ctaGroup\\"]")`);
p(`            || heroEl.querySelector("[class*=\\"cta\\"]");`);
p(`          const label = heroEl.querySelector("[class*=\\"label\\"]");`);
p(``);
p(`          /* Each layer drifts at different speed */`);
p(`          const items: { el: Element; ySpeed: number; opacityEnd: number }[] = [];`);
p(`          if (label) items.push({ el: label, ySpeed: -100, opacityEnd: 0 });`);
p(`          if (heading) items.push({ el: heading, ySpeed: -60, opacityEnd: 0 });`);
p(`          if (subtitle) items.push({ el: subtitle, ySpeed: -30, opacityEnd: 0 });`);
p(`          if (ctaGroup) items.push({ el: ctaGroup, ySpeed: -15, opacityEnd: 0 });`);
p(``);
p(`          items.forEach(({ el, ySpeed, opacityEnd }) => {`);
p(`            gsap.to(el, {`);
p(`              y: ySpeed,`);
p(`              opacity: opacityEnd,`);
p(`              ease: "none",`);
p(`              scrollTrigger: {`);
p(`                trigger: heroEl,`);
p(`                start: "top top",`);
p(`                end: "bottom top",`);
p(`                scrub: 0.6,`);
p(`              },`);
p(`            });`);
p(`          });`);
p(`        }`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           2) INTER-SECTION GLOW DIVIDERS`);
p(`           React-rendered = no race condition.`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        dividerRefs.current.forEach((divider) => {`);
p(`          if (!divider) return;`);
p(`          const line = divider.querySelector("." + s.dividerLine);`);
p(`          const glow = divider.querySelector("." + s.dividerGlow);`);
p(``);
p(`          if (line) {`);
p(`            gsap.fromTo(line,`);
p(`              { scaleX: 0 },`);
p(`              {`);
p(`                scaleX: 1,`);
p(`                ease: "power2.out",`);
p(`                scrollTrigger: {`);
p(`                  trigger: divider,`);
p(`                  start: "top 85%",`);
p(`                  end: "top 45%",`);
p(`                  scrub: 1,`);
p(`                },`);
p(`              },`);
p(`            );`);
p(`          }`);
p(``);
p(`          if (glow) {`);
p(`            gsap.fromTo(glow,`);
p(`              { scaleX: 0, opacity: 0 },`);
p(`              {`);
p(`                scaleX: 1,`);
p(`                opacity: 1,`);
p(`                ease: "power2.out",`);
p(`                scrollTrigger: {`);
p(`                  trigger: divider,`);
p(`                  start: "top 85%",`);
p(`                  end: "top 45%",`);
p(`                  scrub: 1,`);
p(`                },`);
p(`              },`);
p(`            );`);
p(`          }`);
p(`        });`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           3) BACKGROUND ATMOSPHERE SHIFTS`);
p(`           Color transitions on enter + enterBack`);
p(`           + leave + leaveBack for full coverage.`);
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
p(`              onLeaveBack: () => {`);
p(`                const prev = i > 0 ? i - 1 : 0;`);
p(`                atmoInner.style.setProperty("--atmo-color", ATMO_COLORS[prev]);`);
p(`              },`);
p(`            });`);
p(`          });`);
p(`        }`);
p(``);
p(`        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
p(`           4) FLOATING PARALLAX PARTICLES`);
p(`           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
p(`        particleRefs.current.forEach((pEl, i) => {`);
p(`          if (!pEl) return;`);
p(`          const def = PARTICLES[i];`);
p(`          if (!def) return;`);
p(``);
p(`          /* Fade in */`);
p(`          gsap.to(pEl, {`);
p(`            opacity: 1,`);
p(`            duration: 2,`);
p(`            delay: 1 + i * 0.3,`);
p(`            ease: "power2.out",`);
p(`          });`);
p(``);
p(`          /* Parallax drift */`);
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
p(`    return () => ctx?.revert();`);
p(`  }, []);`);
p(``);
p(`  /* ─── Interleave dividers between children ─── */`);
p(`  const childArray = Children.toArray(children);`);
p(`  const interleaved: ReactNode[] = [];`);
p(`  let divIdx = 0;`);
p(``);
p(`  childArray.forEach((child, i) => {`);
p(`    interleaved.push(child);`);
p(`    if (i < childArray.length - 1) {`);
p(`      const idx = divIdx++;`);
p(`      interleaved.push(`);
p(`        <div`);
p(`          key={\`divider-\${idx}\`}`);
p(`          className={s.divider}`);
p(`          aria-hidden="true"`);
p(`          ref={(el) => { dividerRefs.current[idx] = el; }}`);
p(`        >`);
p(`          <div className={s.dividerLine} />`);
p(`          <div className={s.dividerGlow} />`);
p(`        </div>,`);
p(`      );`);
p(`    }`);
p(`  });`);
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
p(`      {/* Content with interleaved dividers */}`);
p(`      <div ref={wrapperRef} className={s.wrapper}>`);
p(`        {interleaved}`);
p(`      </div>`);
p(`    </>`);
p(`  );`);
p(`}`);

writeFileSync(tsxPath, L.join("\n"));
console.log("TSX written ->", tsxPath);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. page.tsx
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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

writeFileSync(pagePath, pageTsx);
console.log("page.tsx written ->", pagePath);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4. FIX ServicesPreview.tsx — toggleActions
   
   Bug: "play none none none" means cards never
   reverse on scroll-back → stuck visible even
   when user scrolls up past them.
   
   Fix: "play none none reverse" → smooth reverse.
   Also: reduce parallax y values to avoid jitter.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { readFileSync } from "fs";

let servSrc = readFileSync(servicesPath, "utf8");

// Fix card entrance toggleActions
servSrc = servSrc.replace(
  /toggleActions:\s*"play none none none"/g,
  'toggleActions: "play none none reverse"'
);

// Fix parallax y depths — reduce from ±15/10/8 to ±6/4/3
// The original has: const depth = i % 3 === 1 ? -15 : i % 3 === 2 ? 10 : -8;
servSrc = servSrc.replace(
  /const depth = i % 3 === 1 \? -15 : i % 3 === 2 \? 10 : -8;/,
  'const depth = i % 3 === 1 ? -6 : i % 3 === 2 ? 4 : -3;'
);

// Fix parallax scrub from 1.2 to 2 (smoother, less aggressive)
servSrc = servSrc.replace(
  /scrub:\s*1\.2,/,
  'scrub: 2.5,'
);

writeFileSync(servicesPath, servSrc);
console.log("ServicesPreview.tsx patched ->", servicesPath);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   5. FIX Testimonials.tsx — toggleActions
   
   Bug: "play none none none" means orb/card
   animations never reverse → jarring on scroll-back.
   
   Fix: "play none none reverse" → smooth reverse.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let testSrc = readFileSync(testimonialsPath, "utf8");

// Fix ALL toggleActions in the file
testSrc = testSrc.replace(
  /toggleActions:\s*"play none none none"/g,
  'toggleActions: "play none none reverse"'
);

writeFileSync(testimonialsPath, testSrc);
console.log("Testimonials.tsx patched ->", testimonialsPath);

console.log("\n✅ All files written. Scroll choreography v2 — conflict-free.");
