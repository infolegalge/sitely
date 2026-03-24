/**
 * write-services-3d.mjs
 * Rewrites all /services page components with rich 3D GSAP animations.
 * Puzzle-piece assembly on scroll, perspective transforms, holographic effects.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = join(process.cwd(), "src/components/sections/services");

function write(dir, name, ext, content) {
  const folder = join(BASE, dir);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, `${name}.${ext}`), content, "utf-8");
  console.log(`  ✓ ${dir}/${name}.${ext}`);
}

/* ════════════════════════════════════════════════════════════════════
   §1  ServicesHero — 3D Split-word entrance + floating badges
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useEffect, useRef } from "react";
import s from "./ServicesHero.module.css";

export default function ServicesHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        /* Label slide in */
        tl.fromTo(
          section.querySelector(\`.\${s.label}\`),
          { opacity: 0, y: 30, rotateX: 40 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.8 },
          0.1,
        );

        /* Title words fly in from different depths */
        const words = section.querySelectorAll(\`.\${s.word}\`);
        words.forEach((word, i) => {
          const fromLeft = i % 2 === 0;
          tl.fromTo(
            word,
            {
              opacity: 0,
              x: fromLeft ? -60 : 60,
              y: 40,
              rotateY: fromLeft ? 25 : -25,
              rotateX: 15,
              scale: 0.85,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.9,
            },
            0.15 + i * 0.08,
          );
        });

        /* Subtitle fade up */
        tl.fromTo(
          section.querySelector(\`.\${s.subtitle}\`),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          0.5,
        );

        /* Badges scatter in like puzzle pieces */
        const badges = section.querySelectorAll(\`.\${s.badge}\`);
        badges.forEach((badge, i) => {
          const angle = (i - 1.5) * 30;
          tl.fromTo(
            badge,
            {
              opacity: 0,
              scale: 0.4,
              y: 50,
              x: (i - 1.5) * 40,
              rotation: angle,
            },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0,
              rotation: 0,
              duration: 0.6,
              ease: "back.out(1.7)",
            },
            0.65 + i * 0.06,
          );
        });

        /* Parallax drift on scroll */
        gsap.to(section.querySelector(\`.\${s.inner}\`), {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section ref={sectionRef} className={s.section}>
      <div className={s.glow} aria-hidden="true" />
      <div className={s.inner}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Our Services
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h1 className={s.title}>
          <span className={s.word}>What </span>
          <span className={s.word}>We </span>
          <span className={\`\${s.word} grad-text\`}>Build</span>
        </h1>
        <p className={s.subtitle}>
          Premium digital experiences that convert visitors into customers.
          From strategy to launch — we handle everything.
        </p>
        <div className={s.badges}>
          <span className={s.badge}>3D &amp; WebGL</span>
          <span className={s.badge}>E-Commerce</span>
          <span className={s.badge}>Performance</span>
          <span className={s.badge}>Custom Design</span>
        </div>
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   ServicesHero — /services §1
   3D split-word entrance + floating badges
   ═══════════════════════════════════════════ */

.section {
  position: relative;
  z-index: 1;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(100px, 18vh, 160px) 24px clamp(60px, 10vh, 100px);
  overflow: hidden;
  perspective: 1200px;
}

.glow {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 140%;
  height: 80%;
  translate: -50% 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--blue-s), var(--violet-s) 40%, transparent 70%);
  opacity: 0.5;
  pointer-events: none;
}

.inner {
  max-width: 720px;
  margin: 0 auto;
  transform-style: preserve-3d;
}

.label {
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--blue);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  will-change: transform, opacity;
}

.labelLine {
  display: inline-block;
  width: 20px;
  height: 1px;
  background: var(--blue);
  opacity: 0.5;
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--tx);
  margin-bottom: 18px;
  perspective: 800px;
}

.word {
  display: inline-block;
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

.subtitle {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.95rem, 1.5vw, 1.15rem);
  line-height: 1.7;
  color: var(--tx-2);
  max-width: 560px;
  margin: 0 auto 28px;
  will-change: transform, opacity;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.badge {
  font-family: var(--font-code, monospace);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--tx-2);
  padding: 6px 14px;
  border: 1px solid var(--brd-2);
  border-radius: 20px;
  background: var(--surf);
  backdrop-filter: blur(8px);
  will-change: transform, opacity;
  transition: border-color 0.3s var(--ease), color 0.3s var(--ease);
}

.badge:hover {
  border-color: var(--blue);
  color: var(--blue);
}
`;

  write("ServicesHero", "ServicesHero", "tsx", tsx);
  write("ServicesHero", "ServicesHero.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §2  IndustryShowcase — 3D perspective grid, staggered puzzle
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useCallback, useEffect, useRef } from "react";
import s from "./IndustryShowcase.module.css";

const INDUSTRIES = [
  {
    icon: "hotel",
    title: "Hotels & Hospitality",
    desc: "Booking engines, virtual tours, and luxury brand experiences that increase direct reservations and reduce OTA dependency.",
    accent: "blue",
  },
  {
    icon: "restaurant",
    title: "Restaurants & Food",
    desc: "Online menus, reservation systems, and delivery platforms that keep tables full and orders flowing.",
    accent: "violet",
  },
  {
    icon: "tourism",
    title: "Tourism & Travel",
    desc: "Immersive destination showcases, tour booking platforms, and multilingual experiences for international audiences.",
    accent: "cyan",
  },
  {
    icon: "ecommerce",
    title: "E-Commerce & Retail",
    desc: "High-converting online stores with smart product discovery, seamless checkout, and inventory management.",
    accent: "gold",
  },
  {
    icon: "health",
    title: "Healthcare & Wellness",
    desc: "Patient portals, appointment booking, and medical platforms that build trust through clean, accessible design.",
    accent: "blue",
  },
  {
    icon: "corporate",
    title: "Corporate & Startups",
    desc: "Brand websites, SaaS dashboards, and investor-ready platforms that establish credibility and drive growth.",
    accent: "violet",
  },
];

/* ─── SVG Icons ─── */

function IndustryIcon({ icon }: { icon: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "hotel":
      return (
        <svg {...p}>
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9h1" />
          <path d="M9 13h1" />
          <path d="M9 17h1" />
        </svg>
      );
    case "restaurant":
      return (
        <svg {...p}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
        </svg>
      );
    case "tourism":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      );
    case "ecommerce":
      return (
        <svg {...p}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case "health":
      return (
        <svg {...p}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "corporate":
      return (
        <svg {...p}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    default:
      return null;
  }
}

const accentCls: Record<string, string> = {
  blue: s.accentBlue,
  violet: s.accentViolet,
  cyan: s.accentCyan,
  gold: s.accentGold,
};

export default function IndustryShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  /* GSAP ScrollTrigger — 3D puzzle entrance */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Header entrance */
        gsap.fromTo(
          section.querySelector(\`.\${s.header}\`),
          { opacity: 0, y: 50, rotateX: 10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Cards: 3D puzzle scatter → assemble */
        const cards = cardsRef.current.filter(Boolean);
        cards.forEach((card, i) => {
          /* Each card comes from a different 3D position */
          const col = i % 3;
          const row = Math.floor(i / 3);
          const xOffset = (col - 1) * 120;
          const yOffset = 80 + row * 30;
          const rotY = (col - 1) * 25;
          const rotX = 15 + row * 5;

          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: xOffset,
              y: yOffset,
              rotateX: rotX,
              rotateY: rotY,
              scale: 0.7,
              transformOrigin: "50% 50%",
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section.querySelector(\`.\${s.grid}\`),
                start: "top 88%",
                end: "top 40%",
                toggleActions: "play none none reverse",
              },
              delay: i * 0.1,
            },
          );

          /* Gentle parallax depth */
          const depth = [4, -3, 5, -4, 3, -5][i] ?? 0;
          gsap.to(card, {
            y: depth,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 2,
            },
          });
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* 3D tilt on hover */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = \`perspective(800px) rotateY(\${x * 12}deg) rotateX(\${-y * 12}deg) translateY(-6px)\`;
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "";
    },
    [],
  );

  return (
    <section ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Industries
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Built for <span className="grad-text">your industry</span>
        </h2>
        <p className={s.subtitle}>
          We understand the unique challenges of your business.
          Every solution is tailored to your industry&apos;s needs.
        </p>
      </div>

      <div className={s.grid}>
        {INDUSTRIES.map((ind, i) => (
          <div
            key={ind.title}
            className={\`\${s.card} \${accentCls[ind.accent] ?? ""}\`}
            ref={(el) => { cardsRef.current[i] = el; }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className={s.holoGlow} aria-hidden="true" />
            <div className={s.cardInner}>
              <div className={s.iconWrap}>
                <IndustryIcon icon={ind.icon} />
              </div>
              <h3 className={s.cardTitle}>{ind.title}</h3>
              <p className={s.cardDesc}>{ind.desc}</p>
              <div className={s.scanLine} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   IndustryShowcase — /services §2
   3D puzzle-piece grid assembly
   ═══════════════════════════════════════════ */

.section {
  position: relative;
  z-index: 1;
  padding: 60px 24px 80px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: hidden;
  perspective: 1200px;
}

.header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
  will-change: transform, opacity;
}

.label {
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--blue);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.labelLine {
  display: inline-block;
  width: 20px;
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
  margin-bottom: 14px;
}

.subtitle {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  line-height: 1.7;
  color: var(--tx-2);
}

/* ─── Grid ─── */

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  transform-style: preserve-3d;
}

@media (min-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

/* ─── Card ─── */

.card {
  position: relative;
  border-radius: 18px;
  padding: 1.5px;
  background: var(--brd);
  cursor: default;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.5s var(--ease), box-shadow 0.5s var(--ease);
}

.card:hover {
  box-shadow:
    0 20px 50px rgba(79, 110, 247, 0.08),
    0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Holographic border */
.holoGlow {
  position: absolute;
  inset: -1px;
  border-radius: 19px;
  background: conic-gradient(
    from var(--holo-angle, 0deg),
    var(--blue) 0%,
    var(--cyan) 25%,
    var(--violet) 50%,
    var(--blue) 75%,
    var(--cyan) 100%
  );
  opacity: 0;
  z-index: 0;
  transition: opacity 0.5s var(--ease);
  filter: blur(0.5px);
}

.card:hover .holoGlow {
  opacity: 1;
  animation: holoSpin 4s linear infinite;
}

@keyframes holoSpin {
  to { --holo-angle: 360deg; }
}

@property --holo-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.cardInner {
  position: relative;
  z-index: 1;
  border-radius: 16.5px;
  padding: 28px 24px;
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

/* Shimmer sweep */
.cardInner::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(79, 110, 247, 0.04) 50%,
    rgba(139, 92, 246, 0.06) 55%,
    rgba(6, 214, 160, 0.04) 60%,
    transparent 70%
  );
  transition: left 0.8s var(--ease);
  pointer-events: none;
}

.card:hover .cardInner::after {
  left: 120%;
}

/* ─── Icon ─── */

.iconWrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(8px);
  transition: border-color 0.4s var(--ease);
}

.card:hover .iconWrap { border-color: rgba(255,255,255,0.15); }

.iconWrap svg { width: 20px; height: 20px; }

.accentBlue .iconWrap { color: var(--blue); background: var(--blue-s); }
.accentViolet .iconWrap { color: var(--violet); background: var(--violet-s); }
.accentCyan .iconWrap { color: var(--cyan); background: var(--cyan-s); }
.accentGold .iconWrap { color: #facc15; background: rgba(250, 204, 21, 0.07); }

/* ─── Text ─── */

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--tx);
  margin-bottom: 8px;
  transition: color 0.3s var(--ease);
}

.accentBlue:hover .cardTitle { color: var(--blue-l); }
.accentViolet:hover .cardTitle { color: var(--violet); }
.accentCyan:hover .cardTitle { color: var(--cyan); }
.accentGold:hover .cardTitle { color: #facc15; }

.cardDesc {
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  line-height: 1.65;
  color: var(--tx-2);
}

/* Scan line */
.scanLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--blue) 20%, var(--cyan) 50%, var(--violet) 80%, transparent 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
}

.card:hover .scanLine { transform: scaleX(1); }
`;

  write("IndustryShowcase", "IndustryShowcase", "tsx", tsx);
  write("IndustryShowcase", "IndustryShowcase.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §3  ServiceDeepDive — Holographic orbit cards (like ServicesPreview)
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useCallback, useEffect, useRef } from "react";
import { SERVICES } from "@/lib/constants";
import s from "./ServiceDeepDive.module.css";

const ACCENT_CLS = [s.accentBlue, s.accentViolet, s.accentCyan, s.accentGold, s.accentBlue, s.accentViolet] as const;

export default function ServiceDeepDive() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  /* GSAP ScrollTrigger — 3D staggered reveal */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Header */
        gsap.fromTo(
          section.querySelector(\`.\${s.header}\`),
          { opacity: 0, y: 50, rotateX: 10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Cards fly in from alternating sides with 3D rotation */
        const cards = cardsRef.current.filter(Boolean);
        cards.forEach((card, i) => {
          const fromRight = i % 2 === 1;
          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: fromRight ? 80 : -80,
              y: 60,
              rotateY: fromRight ? -20 : 20,
              rotateX: 12,
              scale: 0.85,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card!,
                start: "top 90%",
                end: "top 55%",
                toggleActions: "play none none reverse",
              },
              delay: (i % 3) * 0.08,
            },
          );

          /* Parallax depth */
          const depth = i % 3 === 1 ? -6 : i % 3 === 2 ? 4 : -3;
          gsap.to(card, {
            y: depth,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 2.5,
            },
          });
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* 3D tilt on hover */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = \`perspective(800px) rotateY(\${x * 10}deg) rotateX(\${-y * 10}deg) translateY(-6px)\`;
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "";
    },
    [],
  );

  return (
    <section ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Services
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Everything you need,{" "}
          <span className="grad-text">in one place</span>
        </h2>
        <p className={s.subtitle}>
          End-to-end digital services — from the first pixel to the final deployment.
        </p>
      </div>

      <div className={s.grid}>
        {SERVICES.map((svc, i) => (
          <div
            key={svc.id}
            className={\`\${s.card} \${ACCENT_CLS[i]}\`}
            ref={(el) => { cardsRef.current[i] = el; }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className={s.holoGlow} aria-hidden="true" />
            <div className={s.cardInner}>
              <span className={s.num} aria-hidden="true">{svc.number}</span>
              <div className={s.shape}>
                <div className={s.shapeGlow} aria-hidden="true" />
                <div className={s.geo}>
                  <span className={s.geoIcon}>{svc.icon}</span>
                </div>
              </div>
              <div className={s.content}>
                <h3 className={s.cardTitle}>{svc.title}</h3>
                <p className={s.cardDesc}>{svc.description}</p>
                <div className={s.tags}>
                  {svc.tags.map((tag) => (
                    <span key={tag} className={s.tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={s.scanLine} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   ServiceDeepDive — /services §3
   Holographic orbit service cards
   ═══════════════════════════════════════════ */

.section {
  position: relative;
  z-index: 1;
  padding: 60px 24px 80px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: hidden;
  perspective: 1200px;
}

.header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
  will-change: transform, opacity;
}

.label {
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--violet);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.labelLine {
  display: inline-block;
  width: 20px;
  height: 1px;
  background: var(--violet);
  opacity: 0.5;
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.6rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--tx);
  letter-spacing: -0.02em;
  margin-bottom: 14px;
}

.subtitle {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  line-height: 1.7;
  color: var(--tx-2);
}

/* ─── Grid ─── */

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  transform-style: preserve-3d;
}

@media (min-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

/* ─── Card ─── */

.card {
  position: relative;
  border-radius: 22px;
  padding: 1.5px;
  background: var(--brd);
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.5s var(--ease), box-shadow 0.5s var(--ease);
}

.card:hover {
  box-shadow:
    0 24px 64px rgba(79, 110, 247, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Holographic border */
.holoGlow {
  position: absolute;
  inset: -1px;
  border-radius: 23px;
  background: conic-gradient(
    from var(--holo-angle, 0deg),
    var(--blue) 0%,
    var(--cyan) 25%,
    var(--violet) 50%,
    var(--blue) 75%,
    var(--cyan) 100%
  );
  opacity: 0;
  z-index: 0;
  transition: opacity 0.6s var(--ease);
  filter: blur(0.5px);
}

.card:hover .holoGlow {
  opacity: 1;
  animation: holoSpin 4s linear infinite;
}

@keyframes holoSpin {
  to { --holo-angle: 360deg; }
}

@property --holo-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.cardInner {
  position: relative;
  z-index: 1;
  border-radius: 20.5px;
  padding: 28px 24px 24px;
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(24px);
  overflow: hidden;
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 18px;
  align-items: start;
  min-height: 160px;
}

/* Shimmer */
.cardInner::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(79, 110, 247, 0.04) 50%,
    rgba(139, 92, 246, 0.06) 55%,
    rgba(6, 214, 160, 0.04) 60%,
    transparent 70%
  );
  transition: left 0.8s var(--ease);
  pointer-events: none;
}

.card:hover .cardInner::after { left: 120%; }

/* Number watermark */
.num {
  position: absolute;
  top: 10px;
  right: 16px;
  font-family: var(--font-heading, sans-serif);
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  color: var(--tx);
  opacity: 0.04;
  pointer-events: none;
}

/* ─── 3D Shape ─── */

.shape {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 200px;
  flex-shrink: 0;
}

.shapeGlow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  filter: blur(14px);
  opacity: 0.25;
  transition: opacity 0.5s var(--ease);
}

.card:hover .shapeGlow { opacity: 0.5; }

.geo {
  position: relative;
  z-index: 1;
  width: 40px;
  height: 40px;
  transform-style: preserve-3d;
  animation: geoFloat 8s ease-in-out infinite;
}

.card:hover .geo {
  animation: geoSpin 3s linear infinite, geoFloat 8s ease-in-out infinite;
}

@keyframes geoFloat {
  0%, 100% { transform: translateY(0) rotateX(15deg) rotateY(20deg); }
  50% { transform: translateY(-4px) rotateX(20deg) rotateY(25deg); }
}

@keyframes geoSpin {
  to { transform: rotateX(375deg) rotateY(380deg); }
}

.geoIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  font-size: 1.2rem;
  transition: border-color 0.4s var(--ease);
}

.card:hover .geoIcon { border-color: rgba(255,255,255,0.15); }

/* Accent colors */
.accentBlue .shapeGlow { background: var(--blue); }
.accentBlue .geoIcon { background: var(--blue-s); color: var(--blue); }
.accentViolet .shapeGlow { background: var(--violet); }
.accentViolet .geoIcon { background: var(--violet-s); color: var(--violet); }
.accentCyan .shapeGlow { background: var(--cyan); }
.accentCyan .geoIcon { background: var(--cyan-s); color: var(--cyan); }
.accentGold .shapeGlow { background: #facc15; }
.accentGold .geoIcon { background: rgba(250, 204, 21, 0.07); color: #facc15; }

/* ─── Content ─── */

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--tx);
  line-height: 1.2;
  transition: color 0.3s var(--ease);
}

.accentBlue:hover .cardTitle { color: var(--blue-l); }
.accentViolet:hover .cardTitle { color: var(--violet); }
.accentCyan:hover .cardTitle { color: var(--cyan); }
.accentGold:hover .cardTitle { color: #facc15; }

.cardDesc {
  font-family: var(--font-body, sans-serif);
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--tx-2);
  margin-top: 4px;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  font-family: var(--font-code, monospace);
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--tx-3);
  padding: 4px 10px;
  border-radius: 100px;
  border: 1px solid var(--brd);
  background: rgba(255, 255, 255, 0.015);
  transition: border-color 0.3s var(--ease), color 0.3s var(--ease);
}

.card:hover .tag {
  border-color: var(--brd-2);
  color: var(--tx-2);
}

/* Scan line */
.scanLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue) 20%, var(--cyan) 50%, var(--violet) 80%, transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
  z-index: 2;
  grid-column: 1 / -1;
}

.card:hover .scanLine { transform: scaleX(1); }

/* ─── Responsive ─── */

@media (min-width: 640px) {
  .cardInner {
    grid-template-columns: 1fr;
    min-height: 200px;
  }
  .shape { width: 48px; height: 48px; }
}

@media (min-width: 960px) {
  .cardInner { min-height: 220px; }
}
`;

  write("ServiceDeepDive", "ServiceDeepDive", "tsx", tsx);
  write("ServiceDeepDive", "ServiceDeepDive.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §4  ClientJourney — 3D timeline with scroll-fill & puzzle cards
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./ClientJourney.module.css";

const STEPS = [
  {
    num: "01",
    title: "Get In Touch",
    desc: "Reach out through our contact form, email, or phone. Tell us about your project and we\\u2019ll respond within 24 hours.",
    icon: "mail",
    accent: "blue",
  },
  {
    num: "02",
    title: "Discovery Call",
    desc: "We send you a detailed questionnaire and schedule a call. Together we define the type of website, goals, audience, and scope.",
    icon: "phone",
    accent: "violet",
  },
  {
    num: "03",
    title: "Strategy & Proposal",
    desc: "We build a complete action strategy, calculate costs, and send you a detailed plan with clear deliverables and timeline.",
    icon: "strategy",
    accent: "cyan",
  },
  {
    num: "04",
    title: "Agreement & Kickoff",
    desc: "Once approved, we sign a collaboration agreement and officially kick off the project. You get a dedicated project timeline.",
    icon: "handshake",
    accent: "gold",
  },
  {
    num: "05",
    title: "Delivery",
    desc: "Your project is delivered within the agreed deadline. Most projects are completed within just 2 weeks.",
    icon: "rocket",
    accent: "blue",
  },
];

/* ─── SVG Icons ─── */

function StepIcon({ icon }: { icon: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "mail":
      return (
        <svg {...p}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "phone":
      return (
        <svg {...p}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "strategy":
      return (
        <svg {...p}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...p}>
          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...p}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    default:
      return null;
  }
}

const accentCls: Record<string, string> = {
  blue: s.accentBlue,
  violet: s.accentViolet,
  cyan: s.accentCyan,
  gold: s.accentGold,
};

export default function ClientJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackFillRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeDots, setActiveDots] = useState<boolean[]>(
    () => new Array(STEPS.length).fill(false),
  );

  /* GSAP ScrollTrigger — 3D card entrance */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Header */
        gsap.fromTo(
          section.querySelector(\`.\${s.header}\`),
          { opacity: 0, y: 50, rotateX: 10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Delivery badge */
        gsap.fromTo(
          section.querySelector(\`.\${s.deliveryBadge}\`),
          { opacity: 0, scale: 0.5, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.7,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Cards: alternating 3D entrance */
        const cards = cardRefs.current.filter(Boolean);
        cards.forEach((card, i) => {
          const fromRight = i % 2 === 1;
          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: fromRight ? 100 : -100,
              y: 40,
              rotateY: fromRight ? -30 : 30,
              rotateX: 10,
              scale: 0.8,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card!,
                start: "top 90%",
                end: "top 55%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* Scroll-driven timeline fill + active dots */
  const updateTimeline = useCallback(() => {
    const timeline = timelineRef.current;
    const fill = trackFillRef.current;
    if (!timeline || !fill) return;

    const rect = timeline.getBoundingClientRect();
    const viewportMid = window.innerHeight * 0.55;
    const totalHeight = rect.height;
    const scrolledPast = viewportMid - rect.top;
    const pct = Math.max(0, Math.min(100, (scrolledPast / totalHeight) * 100));
    fill.style.height = \`\${pct}%\`;

    const next: boolean[] = [];
    dotRefs.current.forEach((dot) => {
      if (!dot) { next.push(false); return; }
      const dotRect = dot.getBoundingClientRect();
      next.push(dotRect.top < viewportMid);
    });

    setActiveDots((prev) => {
      if (prev.every((v, i) => v === next[i])) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateTimeline();
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateTimeline();
    return () => window.removeEventListener("scroll", onScroll);
  }, [updateTimeline]);

  return (
    <section ref={sectionRef} className={s.section}>
      {/* Header */}
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Your Journey
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          From first contact to{" "}
          <span className="grad-text">launch</span>
        </h2>
        <p className={s.subtitle}>
          A simple, transparent process. No surprises — just clear
          communication and fast delivery.
        </p>
      </div>

      {/* Delivery badge */}
      <div className={s.deliveryBadge}>
        <span className={s.deliveryIcon} aria-hidden="true">\\u26a1</span>
        <span className={s.deliveryText}>
          Average delivery: <strong>2 weeks</strong>
        </span>
      </div>

      {/* Timeline */}
      <div className={s.timeline} ref={timelineRef}>
        <div className={s.track} aria-hidden="true">
          <div className={s.trackFill} ref={trackFillRef} />
        </div>

        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className={s.step}
            ref={(el) => { cardRefs.current[i] = el; }}
          >
            <div
              className={\`\${s.dot}\${activeDots[i] ? \` \${s.dotActive}\` : ""}\`}
              ref={(el) => { dotRefs.current[i] = el; }}
            >
              {activeDots[i] && (
                <span className={s.dotPulse} aria-hidden="true" />
              )}
            </div>

            <div className={\`\${s.card} \${accentCls[step.accent] ?? ""}\`}>
              <div className={s.cardGlow} aria-hidden="true" />
              <span className={s.stepNum} aria-hidden="true">
                {step.num}
              </span>
              <div className={s.iconWrap}>
                <StepIcon icon={step.icon} />
              </div>
              <p className={s.stepLabel}>Step {step.num}</p>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepDesc}>{step.desc}</p>

              {step.num === "05" && (
                <div className={s.speedBadge}>
                  <span className={s.speedDot} aria-hidden="true" />
                  Typically 2 weeks
                </div>
              )}
              <div className={s.scanLine} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   ClientJourney — /services §4
   3D timeline with scroll-fill + puzzle cards
   ═══════════════════════════════════════════ */

.section {
  position: relative;
  z-index: 1;
  padding: 60px 14px 80px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: hidden;
  perspective: 1200px;
}

/* ─── Header ─── */

.header {
  text-align: center;
  margin-bottom: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  will-change: transform, opacity;
}

.label {
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--cyan);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.labelLine {
  display: inline-block;
  width: 20px;
  height: 1px;
  background: var(--cyan);
  opacity: 0.5;
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.6rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--tx);
  letter-spacing: -0.02em;
  margin-bottom: 14px;
}

.subtitle {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  line-height: 1.7;
  color: var(--tx-2);
}

/* ─── Delivery Badge ─── */

.deliveryBadge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 40px;
  padding: 10px 22px;
  border-radius: 24px;
  border: 1px solid var(--cyan-g);
  background: rgba(6, 214, 160, 0.06);
  width: fit-content;
  will-change: transform, opacity;
}

.deliveryIcon { font-size: 1rem; }

.deliveryText {
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  color: var(--tx-2);
}

.deliveryText strong {
  color: var(--cyan);
  font-weight: 600;
}

/* ─── Timeline container ─── */

.timeline {
  position: relative;
  max-width: 780px;
  margin: 0 auto;
  padding-left: 42px;
  transform-style: preserve-3d;
}

/* ─── Track ─── */

.track {
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--brd);
  border-radius: 2px;
}

.trackFill {
  width: 100%;
  height: 0%;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--blue), var(--violet), var(--cyan));
  transition: height 0.05s linear;
}

/* ─── Step ─── */

.step {
  position: relative;
  margin-bottom: 32px;
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

.step:last-child { margin-bottom: 0; }

/* ─── Dot ─── */

.dot {
  position: absolute;
  left: -36px;
  top: 28px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--brd-2);
  background: var(--bg);
  z-index: 2;
  transition: border-color 0.4s var(--ease), background 0.4s var(--ease);
}

.dotActive {
  border-color: var(--blue);
  background: var(--blue);
}

.dotPulse {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: var(--blue-g);
  animation: jPulse 2s ease-out infinite;
}

@keyframes jPulse {
  0% { opacity: 0.6; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(2); }
}

/* ─── Card ─── */

.card {
  position: relative;
  padding: 24px 22px;
  border-radius: 16px;
  border: 1px solid var(--brd);
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(16px);
  overflow: hidden;
  transition: border-color 0.35s var(--ease), box-shadow 0.35s var(--ease);
}

.card:hover {
  border-color: var(--brd-2);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

.cardGlow {
  position: absolute;
  top: -40%;
  left: 50%;
  width: 120%;
  height: 80%;
  translate: -50% 0;
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s var(--ease);
}

.card:hover .cardGlow { opacity: 1; }

.accentBlue .cardGlow { background: radial-gradient(ellipse, var(--blue-s), transparent 70%); }
.accentViolet .cardGlow { background: radial-gradient(ellipse, var(--violet-s), transparent 70%); }
.accentCyan .cardGlow { background: radial-gradient(ellipse, var(--cyan-s), transparent 70%); }
.accentGold .cardGlow { background: radial-gradient(ellipse, rgba(250, 204, 21, 0.07), transparent 70%); }

/* Scan line */
.scanLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue) 20%, var(--cyan) 50%, var(--violet) 80%, transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
}

.card:hover .scanLine { transform: scaleX(1); }

.stepNum {
  position: absolute;
  top: 10px;
  right: 16px;
  font-family: var(--font-heading, sans-serif);
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  color: var(--tx);
  opacity: 0.04;
  pointer-events: none;
}

/* ─── Icon ─── */

.iconWrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(8px);
}

.iconWrap svg { width: 20px; height: 20px; }

.accentBlue .iconWrap { color: var(--blue); background: var(--blue-s); }
.accentViolet .iconWrap { color: var(--violet); background: var(--violet-s); }
.accentCyan .iconWrap { color: var(--cyan); background: var(--cyan-s); }
.accentGold .iconWrap { color: #facc15; background: rgba(250, 204, 21, 0.07); }

/* ─── Text ─── */

.stepLabel {
  font-family: var(--font-code, monospace);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--tx-3);
  margin-bottom: 4px;
}

.stepTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--tx);
  margin-bottom: 8px;
}

.stepDesc {
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  line-height: 1.65;
  color: var(--tx-2);
}

/* ─── Speed Badge (step 05) ─── */

.speedBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 5px 12px;
  border-radius: 14px;
  border: 1px solid var(--cyan-g);
  background: rgba(6, 214, 160, 0.06);
  font-family: var(--font-code, monospace);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--cyan);
}

.speedDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cyan);
  animation: jPulse 2s ease-out infinite;
}

/* ─── Desktop: alternating zigzag ─── */

@media (min-width: 768px) {
  .timeline {
    padding-left: 0;
    max-width: 720px;
  }

  .track {
    left: 50%;
    translate: -50% 0;
  }

  .step {
    display: flex;
    align-items: flex-start;
  }

  .step:nth-child(odd) {
    justify-content: flex-start;
    padding-right: calc(50% + 28px);
  }

  .step:nth-child(even) {
    justify-content: flex-end;
    padding-left: calc(50% + 28px);
  }

  .dot {
    left: 50%;
    translate: -50% 0;
  }
}
`;

  write("ClientJourney", "ClientJourney", "tsx", tsx);
  write("ClientJourney", "ClientJourney.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §5  ResultsProof — 3D orbital counters + highlight cards
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useCallback, useEffect, useRef } from "react";
import s from "./ResultsProof.module.css";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

const STATS = [
  { end: 50, suffix: "+", label: "Projects Delivered", accent: "blue", ringProgress: 1.0 },
  { end: 98, suffix: "%", label: "Client Satisfaction", accent: "violet", ringProgress: 0.98 },
  { end: 2, suffix: " wk", label: "Avg. Delivery", accent: "cyan", ringProgress: 0.14 },
  { end: 100, suffix: "%", label: "5\\u2605 Reviews", accent: "gold", ringProgress: 1.0 },
];

const HIGHLIGHTS = [
  { stat: "45%", label: "increase in online bookings", project: "XParagliding", accent: "blue" },
  { stat: "3\\u00d7", label: "faster client-lawyer matching", project: "Legal.ge", accent: "violet" },
  { stat: "34%", label: "higher engagement rate", project: "Springs Estate", accent: "cyan" },
  { stat: "40K+", label: "unique visitors in first week", project: "Darknode", accent: "gold" },
];

const accentCls: Record<string, string> = {
  blue: s.accentBlue,
  violet: s.accentViolet,
  cyan: s.accentCyan,
  gold: s.accentGold,
};

const ringCls: Record<string, string> = {
  blue: s.ringBlue,
  violet: s.ringViolet,
  cyan: s.ringCyan,
  gold: s.ringGold,
};

export default function ResultsProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const valRefs = useRef<(HTMLDivElement | null)[]>([]);
  const countedRef = useRef<Set<number>>(new Set());
  const hCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* GSAP ScrollTrigger — 3D entrance for orbs + cards */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Header */
        gsap.fromTo(
          section.querySelector(\`.\${s.header}\`),
          { opacity: 0, y: 50, rotateX: 10 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Orbs: scale + rotation entrance */
        const orbEls = orbRefs.current.filter(Boolean);
        orbEls.forEach((orb, i) => {
          gsap.fromTo(
            orb,
            {
              scale: 0.3,
              opacity: 0,
              rotateY: (i - 1.5) * 30,
              y: 40,
            },
            {
              scale: 1,
              opacity: 1,
              rotateY: 0,
              y: 0,
              duration: 0.75,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: section.querySelector(\`.\${s.orbs}\`),
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
              delay: i * 0.12,
            },
          );
        });

        /* Highlight cards: 3D scatter assemble */
        const hCards = hCardRefs.current.filter(Boolean);
        hCards.forEach((card, i) => {
          const xOff = (i - 1.5) * 80;
          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: xOff,
              y: 60,
              rotateX: 15,
              rotateY: (i - 1.5) * 15,
              scale: 0.8,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section.querySelector(\`.\${s.highlights}\`),
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
              delay: i * 0.1,
            },
          );
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* Counter + ring animation on intersect */
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = orbRefs.current.indexOf(entry.target as HTMLDivElement);
        if (idx === -1 || countedRef.current.has(idx)) return;
        countedRef.current.add(idx);

        const stat = STATS[idx];
        const valEl = valRefs.current[idx];
        const ringEl = ringRefs.current[idx];
        if (!valEl) return;

        let start: number | null = null;
        const duration = 1800;

        function step(ts: number) {
          if (start === null) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);

          const value = stat.end * eased;
          valEl!.textContent = String(Math.floor(value)) + stat.suffix;

          if (ringEl) {
            const offset = RING_C * (1 - stat.ringProgress * eased);
            ringEl.style.strokeDashoffset = String(offset);
          }

          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
      });
    },
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.3,
    });
    orbRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <section ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Results
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Numbers that <span className="grad-text">speak</span>
        </h2>
      </div>

      {/* Orbital stat pods */}
      <div className={s.orbs}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={\`\${s.orb} \${accentCls[stat.accent] ?? ""}\`}
            ref={(el) => { orbRefs.current[i] = el; }}
          >
            <div className={s.ringWrap}>
              <svg className={s.ringSvg} viewBox="0 0 112 112">
                <circle className={s.ringTrack} cx="56" cy="56" r={RING_R} />
                <circle
                  className={\`\${s.ringFill} \${ringCls[stat.accent] ?? ""}\`}
                  cx="56"
                  cy="56"
                  r={RING_R}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C}
                  ref={(el) => { ringRefs.current[i] = el; }}
                />
              </svg>
              <div className={s.pulse} aria-hidden="true" />
              <div
                className={s.statVal}
                ref={(el) => { valRefs.current[i] = el; }}
              >
                0
              </div>
            </div>
            <div className={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Case-study highlights */}
      <div className={s.highlights}>
        {HIGHLIGHTS.map((h, i) => (
          <div
            key={h.project}
            className={\`\${s.hCard} \${accentCls[h.accent] ?? ""}\`}
            ref={(el) => { hCardRefs.current[i] = el; }}
          >
            <span className={s.hStat}>{h.stat}</span>
            <span className={s.hLabel}>{h.label}</span>
            <span className={s.hProject}>{h.project}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   ResultsProof — /services §5
   3D orbital counters + highlight cards
   ═══════════════════════════════════════════ */

.section {
  position: relative;
  z-index: 1;
  padding: 60px 24px 80px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: hidden;
  perspective: 1200px;
}

/* Ambient glow */
.section::before {
  content: "";
  position: absolute;
  top: 12%;
  left: 50%;
  transform: translateX(-50%);
  width: min(600px, 100%);
  height: 600px;
  background: radial-gradient(circle, rgba(79, 110, 247, 0.025), transparent 70%);
  pointer-events: none;
  z-index: -1;
}

.header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
  will-change: transform, opacity;
}

.label {
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--blue);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.labelLine {
  display: inline-block;
  width: 20px;
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
}

/* ─── Orbital Stat Pods ─── */

.orbs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  justify-items: center;
  padding: 20px 0;
  margin-bottom: 48px;
  transform-style: preserve-3d;
}

@media (min-width: 640px) {
  .orbs { grid-template-columns: repeat(4, 1fr); }
}

.orb {
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

.ringWrap {
  position: relative;
  width: 90px;
  height: 90px;
  margin-bottom: 10px;
}

.ringWrap::after {
  content: "";
  position: absolute;
  inset: 25%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--orb-glow, rgba(79, 110, 247, 0.06)), transparent 70%);
  pointer-events: none;
}

.ringSvg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ringTrack {
  fill: none;
  stroke: rgba(255, 255, 255, 0.04);
  stroke-width: 2.5;
}

.ringFill {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}

.ringBlue {
  stroke: var(--blue);
  filter: drop-shadow(0 0 8px rgba(79, 110, 247, 0.35));
}
.ringViolet {
  stroke: var(--violet);
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.35));
}
.ringCyan {
  stroke: var(--cyan);
  filter: drop-shadow(0 0 8px rgba(6, 214, 160, 0.35));
}
.ringGold {
  stroke: #eab308;
  filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.35));
}

.pulse {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: pulseRing 3s ease-out infinite;
  pointer-events: none;
}

@keyframes pulseRing {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.4); opacity: 0; }
}

.statVal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-heading, sans-serif);
  font-size: 1.3rem;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--tx);
  white-space: nowrap;
}

.accentBlue { --orb-glow: rgba(79, 110, 247, 0.06); }
.accentBlue .statVal { color: var(--blue); }
.accentViolet { --orb-glow: rgba(139, 92, 246, 0.06); }
.accentViolet .statVal { color: var(--violet); }
.accentCyan { --orb-glow: rgba(6, 214, 160, 0.06); }
.accentCyan .statVal { color: var(--cyan); }
.accentGold { --orb-glow: rgba(234, 179, 8, 0.06); }
.accentGold .statVal { color: #facc15; }

.statLabel {
  font-family: var(--font-body, sans-serif);
  font-size: 0.78rem;
  color: var(--tx-3);
  text-align: center;
}

/* ─── Highlights ─── */

.highlights {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  transform-style: preserve-3d;
}

@media (min-width: 600px) {
  .highlights { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .highlights { grid-template-columns: repeat(4, 1fr); }
}

.hCard {
  padding: 22px 18px;
  border-radius: 14px;
  border: 1px solid var(--brd);
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(16px);
  transition: border-color 0.35s var(--ease), transform 0.35s var(--ease), box-shadow 0.35s var(--ease);
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

.hCard:hover {
  border-color: var(--brd-2);
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.hStat {
  display: block;
  font-family: var(--font-heading, sans-serif);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.accentBlue .hStat { color: var(--blue); }
.accentViolet .hStat { color: var(--violet); }
.accentCyan .hStat { color: var(--cyan); }
.accentGold .hStat { color: #facc15; }

.hLabel {
  display: block;
  font-family: var(--font-body, sans-serif);
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--tx-2);
  margin-bottom: 8px;
}

.hProject {
  display: inline-block;
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--tx-3);
  padding: 3px 10px;
  border: 1px solid var(--brd);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}
`;

  write("ResultsProof", "ResultsProof", "tsx", tsx);
  write("ResultsProof", "ResultsProof.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §6  ServicesCTA — 3D floating card entrance
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import s from "./ServicesCTA.module.css";

export default function ServicesCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* CTA card: 3D rotational entrance */
        gsap.fromTo(
          section.querySelector(\`.\${s.inner}\`),
          {
            opacity: 0,
            y: 80,
            rotateX: 20,
            rotateY: -10,
            scale: 0.85,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              end: "top 40%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Buttons stagger */
        const btns = section.querySelectorAll(\`.\${s.btnPrimary}, .\${s.btnSecondary}\`);
        gsap.fromTo(
          Array.from(btns),
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.12,
            duration: 0.6,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: section.querySelector(\`.\${s.inner}\`),
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Gentle float on scroll */
        gsap.to(section.querySelector(\`.\${s.inner}\`), {
          y: -15,
          rotateX: 2,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section ref={sectionRef} className={s.section}>
      <div className={s.inner}>
        <div className={s.glow} aria-hidden="true" />
        <div className={s.holoGlow} aria-hidden="true" />
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Ready?
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Let&apos;s build something{" "}
          <span className="grad-text">extraordinary</span>
        </h2>
        <p className={s.desc}>
          Tell us about your project and get a free consultation.
          We&apos;ll respond within 24 hours.
        </p>
        <div className={s.actions}>
          <Link href="/contact" className={s.btnPrimary}>
            Start a Project
            <span className={s.btnArrow} aria-hidden="true">&rarr;</span>
          </Link>
          <Link href="/portfolio" className={s.btnSecondary}>
            View Our Work
          </Link>
        </div>
        <div className={s.scanLine} aria-hidden="true" />
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   ServicesCTA — /services §6
   3D floating card with holographic border
   ═══════════════════════════════════════════ */

.section {
  position: relative;
  z-index: 1;
  padding: 80px 24px 100px;
  overflow: hidden;
  perspective: 1200px;
}

.inner {
  position: relative;
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
  padding: 56px 32px;
  border-radius: 22px;
  border: 1px solid var(--brd);
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(20px);
  overflow: hidden;
  transform-style: preserve-3d;
  will-change: transform, opacity;
  transition: box-shadow 0.4s var(--ease);
}

.inner:hover {
  box-shadow: 0 24px 64px rgba(79, 110, 247, 0.08), 0 8px 24px rgba(0, 0, 0, 0.3);
}

.glow {
  position: absolute;
  top: -60%;
  left: 50%;
  width: 140%;
  height: 100%;
  translate: -50% 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--blue-s), var(--violet-s) 40%, transparent 70%);
  opacity: 0.7;
  pointer-events: none;
}

/* Holographic border */
.holoGlow {
  position: absolute;
  inset: -1px;
  border-radius: 23px;
  background: conic-gradient(
    from var(--holo-angle, 0deg),
    var(--blue) 0%,
    var(--cyan) 25%,
    var(--violet) 50%,
    var(--blue) 75%,
    var(--cyan) 100%
  );
  opacity: 0;
  z-index: -1;
  transition: opacity 0.5s var(--ease);
  filter: blur(0.5px);
}

.inner:hover .holoGlow {
  opacity: 0.5;
  animation: holoSpin 4s linear infinite;
}

@keyframes holoSpin {
  to { --holo-angle: 360deg; }
}

@property --holo-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

/* Scan line */
.scanLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue) 20%, var(--cyan) 50%, var(--violet) 80%, transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
}

.inner:hover .scanLine { transform: scaleX(1); }

.label {
  font-family: var(--font-code, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--blue);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.labelLine {
  display: inline-block;
  width: 20px;
  height: 1px;
  background: var(--blue);
  opacity: 0.5;
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.6rem, 4.5vw, 2.8rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--tx);
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.desc {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.85rem, 1.3vw, 1rem);
  line-height: 1.7;
  color: var(--tx-2);
  max-width: 440px;
  margin: 0 auto 28px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}

.btnPrimary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  color: #fff;
  font-family: var(--font-body, sans-serif);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  will-change: transform;
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease);
}

.btnPrimary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--blue-g);
}

.btnArrow {
  transition: transform 0.3s var(--ease);
}

.btnPrimary:hover .btnArrow {
  transform: translateX(4px);
}

.btnSecondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  border: 1px solid var(--brd-2);
  background: transparent;
  color: var(--tx-2);
  font-family: var(--font-body, sans-serif);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  will-change: transform;
  transition: border-color 0.3s var(--ease), color 0.3s var(--ease);
}

.btnSecondary:hover {
  border-color: var(--brd-3);
  color: var(--tx);
}
`;

  write("ServicesCTA", "ServicesCTA", "tsx", tsx);
  write("ServicesCTA", "ServicesCTA.module", "css", css);
}

console.log("\n✅ All 6 /services sections upgraded with 3D animations!");
