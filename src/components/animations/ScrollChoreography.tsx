"use client";

import React, { useEffect, useRef, Children, type ReactNode } from "react";
import s from "./ScrollChoreography.module.css";

/* ─── Section IDs in display order ─── */
const SECTION_IDS = ["hero", "work", "services", "process", "testimonials"];

/* ─── Atmosphere colors per section ─── */
const ATMO_COLORS = [
  "rgba(79, 110, 247, 0.07)",   // hero — blue
  "rgba(139, 92, 246, 0.06)",   // work — violet
  "rgba(6, 214, 160, 0.06)",    // services — cyan
  "rgba(79, 110, 247, 0.05)",   // process — blue
  "rgba(234, 179, 8, 0.05)",    // testimonials — gold
];

/* ─── Particle definitions ─── */
const PARTICLES = [
  { type: "ring", size: 120, x: "8%",  y: "15%", speed: 0.3 },
  { type: "dot",  size: 4,   x: "85%", y: "25%", speed: 0.6 },
  { type: "line", size: 40,  x: "70%", y: "40%", speed: 0.45 },
  { type: "ring", size: 80,  x: "90%", y: "55%", speed: 0.25 },
  { type: "dot",  size: 3,   x: "15%", y: "65%", speed: 0.55 },
  { type: "line", size: 50,  x: "25%", y: "80%", speed: 0.4 },
  { type: "dot",  size: 5,   x: "55%", y: "10%", speed: 0.5 },
  { type: "ring", size: 60,  x: "40%", y: "90%", speed: 0.35 },
];

interface Props {
  children: ReactNode;
}

export default function ScrollChoreography({ children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const atmoRef = useRef<HTMLDivElement>(null);
  const dividerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      ctx = gsap.context(() => {

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           1) HERO PARALLAX EXIT
           Only targets child elements, NOT the
           section itself — avoids opacity conflict
           with HeroSection's own GSAP animations.
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        const heroEl = document.getElementById("hero");
        if (heroEl) {
          const heading = heroEl.querySelector("h1");
          const allP = heroEl.querySelectorAll("p");
          const subtitle = allP.length > 1 ? allP[1] : allP[0];
          const ctaGroup = heroEl.querySelector("[class*=\"ctaGroup\"]")
            || heroEl.querySelector("[class*=\"cta\"]");
          const label = heroEl.querySelector("[class*=\"label\"]");

          /* Each layer drifts at different speed */
          const items: { el: Element; ySpeed: number; opacityEnd: number }[] = [];
          if (label) items.push({ el: label, ySpeed: -100, opacityEnd: 0 });
          if (heading) items.push({ el: heading, ySpeed: -60, opacityEnd: 0 });
          if (subtitle) items.push({ el: subtitle, ySpeed: -30, opacityEnd: 0 });
          if (ctaGroup) items.push({ el: ctaGroup, ySpeed: -15, opacityEnd: 0 });

          items.forEach(({ el, ySpeed, opacityEnd }) => {
            gsap.to(el, {
              y: ySpeed,
              opacity: opacityEnd,
              ease: "none",
              scrollTrigger: {
                trigger: heroEl,
                start: "top top",
                end: "bottom top",
                scrub: 0.6,
              },
            });
          });
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           2) INTER-SECTION GLOW DIVIDERS
           React-rendered = no race condition.
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        dividerRefs.current.forEach((divider) => {
          if (!divider) return;
          const line = divider.querySelector("." + s.dividerLine);
          const glow = divider.querySelector("." + s.dividerGlow);

          if (line) {
            gsap.fromTo(line,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: divider,
                  start: "top 85%",
                  end: "top 45%",
                  scrub: 1,
                },
              },
            );
          }

          if (glow) {
            gsap.fromTo(glow,
              { scaleX: 0, opacity: 0 },
              {
                scaleX: 1,
                opacity: 1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: divider,
                  start: "top 85%",
                  end: "top 45%",
                  scrub: 1,
                },
              },
            );
          }
        });

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           3) BACKGROUND ATMOSPHERE SHIFTS
           Color transitions on enter + enterBack
           + leave + leaveBack for full coverage.
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        const atmoInner = atmoRef.current;
        if (atmoInner) {
          SECTION_IDS.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;

            ScrollTrigger.create({
              trigger: el,
              start: "top 60%",
              end: "bottom 40%",
              onEnter: () => {
                atmoInner.style.setProperty("--atmo-color", ATMO_COLORS[i]);
              },
              onEnterBack: () => {
                atmoInner.style.setProperty("--atmo-color", ATMO_COLORS[i]);
              },
              onLeaveBack: () => {
                const prev = i > 0 ? i - 1 : 0;
                atmoInner.style.setProperty("--atmo-color", ATMO_COLORS[prev]);
              },
            });
          });
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           4) FLOATING PARALLAX PARTICLES
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        particleRefs.current.forEach((pEl, i) => {
          if (!pEl) return;
          const def = PARTICLES[i];
          if (!def) return;

          /* Fade in */
          gsap.to(pEl, {
            opacity: 1,
            duration: 2,
            delay: 1 + i * 0.3,
            ease: "power2.out",
          });

          /* Parallax drift */
          gsap.to(pEl, {
            y: () => -window.innerHeight * def.speed,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.5,
            },
          });

          /* Slow rotation for rings */
          if (def.type === "ring") {
            gsap.to(pEl, {
              rotation: 360,
              duration: 40 + i * 10,
              ease: "none",
              repeat: -1,
            });
          }
        });

      }, wrapper);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* ─── Interleave dividers between children ─── */
  const childArray = Children.toArray(children);
  const interleaved: ReactNode[] = [];
  let divIdx = 0;

  childArray.forEach((child, i) => {
    interleaved.push(child);
    if (i < childArray.length - 1) {
      const idx = divIdx++;
      interleaved.push(
        <div
          key={`divider-${idx}`}
          className={s.divider}
          aria-hidden="true"
          ref={(el) => { dividerRefs.current[idx] = el; }}
        >
          <div className={s.dividerLine} />
          <div className={s.dividerGlow} />
        </div>,
      );
    }
  });

  return (
    <>
      {/* Fixed atmosphere layer */}
      <div className={s.atmosphere}>
        <div className={s.atmosphereInner} ref={atmoRef} />
      </div>

      {/* Fixed parallax particles */}
      <div className={s.particles}>
        {PARTICLES.map((def, i) => (
          <div
            key={i}
            ref={(el) => { particleRefs.current[i] = el; }}
            className={`${s.particle} ${
              def.type === "ring"
                ? s.particleRing
                : def.type === "dot"
                  ? s.particleDot
                  : s.particleLine
            }`}
            style={{
              width: def.size,
              height: def.type === "line" ? 1 : def.size,
              left: def.x,
              top: def.y,
            }}
          />
        ))}
      </div>

      {/* Content with interleaved dividers */}
      <div ref={wrapperRef} className={s.wrapper}>
        {interleaved}
      </div>
    </>
  );
}