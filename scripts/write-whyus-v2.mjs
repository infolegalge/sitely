import { writeFileSync } from "fs";

/* ═══════════════════════════════════════════
   WhyUs §5 — "Orbital Metrics" redesign
   Writes both CSS and TSX files
   ═══════════════════════════════════════════ */

const CSS_PATH =
  "src/components/sections/home/Testimonials/Testimonials.module.css";
const TSX_PATH =
  "src/components/sections/home/Testimonials/Testimonials.tsx";

/* ────────────────────────────────────────── */
/*  CSS                                       */
/* ────────────────────────────────────────── */

const css = `/* ═══════════════════════════════════════════
   WhyUs — Homepage §5
   "Orbital Metrics"

   Circular SVG progress rings around animated counters
   Feature bento grid with animated sweep borders
   GSAP ScrollTrigger staggered entrances
   Horizontal scroll-snap orbs on mobile

   Breakpoints:
     max-380  → small mobile
     base     → 0-479 stacked, orbs scroll
     480px    → larger mobile, 2-col features
     640px    → orbs all visible in row
     768px    → tablet
     1024px   → desktop
     1280px   → wide
     1440px   → cap
   ═══════════════════════════════════════════ */

@property --sweep-angle {
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

/* Subtle ambient glow behind section */
.section::before {
  content: "";
  position: absolute;
  top: 12%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(79, 110, 247, 0.025),
    transparent 70%
  );
  pointer-events: none;
  z-index: -1;
}

/* ─── Header (centered) ─── */

.header {
  text-align: center;
  margin-bottom: 40px;
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
  margin-bottom: 18px;
}

.desc {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.88rem, 1.3vw, 0.98rem);
  color: var(--tx-2);
  line-height: 1.85;
  max-width: 560px;
  margin: 0 auto;
}

/* ─── Orbital Stat Pods ─── */

.orbs {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 20px 16px;
  margin-bottom: 40px;
}

.orbs::-webkit-scrollbar {
  display: none;
}

.orb {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  scroll-snap-align: center;
  min-width: 130px;
}

/* ── Ring container ── */

.ringWrap {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 12px;
}

/* Ambient glow inside ring */
.ringWrap::after {
  content: "";
  position: absolute;
  inset: 25%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--orb-glow, rgba(79, 110, 247, 0.06)),
    transparent 70%
  );
  pointer-events: none;
}

/* SVG ring */
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

/* Ring accent glow */
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

/* ── Pulse — expanding ring ── */

.pulse {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: pulseRing 3s ease-out infinite;
  pointer-events: none;
}

@keyframes pulseRing {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* ── Counter value — centered inside ring ── */

.statVal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-heading, sans-serif);
  font-size: 1.7rem;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--tx);
  white-space: nowrap;
}

/* Orb accent classes — color value + set glow */
.orbBlue {
  --orb-glow: rgba(79, 110, 247, 0.06);
}
.orbBlue .statVal {
  color: var(--blue);
}

.orbViolet {
  --orb-glow: rgba(139, 92, 246, 0.06);
}
.orbViolet .statVal {
  color: var(--violet);
}

.orbCyan {
  --orb-glow: rgba(6, 214, 160, 0.06);
}
.orbCyan .statVal {
  color: var(--cyan);
}

.orbGold {
  --orb-glow: rgba(234, 179, 8, 0.06);
}
.orbGold .statVal {
  color: #eab308;
}

/* ── Stat label below ring ── */

.statLabel {
  font-family: var(--font-body, sans-serif);
  font-size: 0.7rem;
  color: var(--tx-3);
  letter-spacing: 0.3px;
  text-align: center;
  max-width: 110px;
}

/* ─── Feature Bento Grid ─── */

.bento {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.card {
  position: relative;
  background: rgba(12, 12, 22, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px 24px;
  overflow: hidden;
  transition:
    transform 0.4s var(--ease),
    border-color 0.4s var(--ease),
    box-shadow 0.4s var(--ease);
}

.card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.25),
    0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Animated sweep border on hover */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from var(--sweep-angle),
    transparent 0%,
    var(--card-accent, var(--blue)) 10%,
    transparent 20%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s var(--ease);
  animation: sweepBorder 4s linear infinite;
}

@keyframes sweepBorder {
  to {
    --sweep-angle: 360deg;
  }
}

.card:hover::before {
  opacity: 0.65;
}

/* Card accent properties */
.cardBlue {
  --card-accent: var(--blue);
}
.cardViolet {
  --card-accent: var(--violet);
}
.cardCyan {
  --card-accent: var(--cyan);
}
.cardGold {
  --card-accent: #eab308;
}

/* Shimmer sweep on hover */
.card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.02) 45%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.02) 55%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0.8s var(--ease);
  pointer-events: none;
}

.card:hover::after {
  transform: translateX(100%);
}

/* ── Card icon ── */

.cardIconWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 16px;
  position: relative;
}

.cardIconWrap svg {
  width: 22px;
  height: 22px;
  stroke: var(--card-accent, var(--blue));
  fill: none;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Icon ambient glow */
.cardIconWrap::after {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: 20px;
  background: radial-gradient(
    circle,
    var(--card-accent, var(--blue)),
    transparent 70%
  );
  opacity: 0.06;
  transition: opacity 0.4s var(--ease);
  pointer-events: none;
}

.card:hover .cardIconWrap::after {
  opacity: 0.14;
}

/* ── Card text ── */

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--tx);
  margin-bottom: 8px;
}

.cardText {
  font-family: var(--font-body, sans-serif);
  font-size: 0.82rem;
  color: var(--tx-2);
  line-height: 1.65;
}

/* ═══════════════════════════════════════════
   480px+ — Larger mobile
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .section {
    padding: 56px 16px;
  }

  .orbs {
    gap: 24px;
    justify-content: center;
  }

  .ringWrap {
    width: 128px;
    height: 128px;
  }

  .statVal {
    font-size: 1.8rem;
  }

  .bento {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
}

/* ═══════════════════════════════════════════
   640px+ — Orbs all visible
   ═══════════════════════════════════════════ */

@media (min-width: 640px) {
  .orbs {
    overflow-x: visible;
    scroll-snap-type: none;
    flex-wrap: nowrap;
    justify-content: center;
    gap: 28px;
    padding: 24px 0;
  }

  .orb {
    min-width: auto;
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
    margin-bottom: 48px;
  }

  .ringWrap {
    width: 140px;
    height: 140px;
  }

  .statVal {
    font-size: 2rem;
  }

  .orbs {
    gap: 36px;
    margin-bottom: 48px;
  }

  .bento {
    gap: 16px;
  }

  .card {
    padding: 32px 28px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

/* ═══════════════════════════════════════════
   1024px+ — Desktop
   ═══════════════════════════════════════════ */

@media (min-width: 1024px) {
  .section {
    padding: clamp(80px, 8vh, 110px) 24px;
  }

  .header {
    margin-bottom: 56px;
  }

  .orbs {
    gap: 56px;
    margin-bottom: 60px;
  }

  .ringWrap {
    width: 155px;
    height: 155px;
  }

  .statVal {
    font-size: 2.3rem;
  }

  .card {
    background: rgba(12, 12, 22, 0.25);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .bento {
    gap: 20px;
  }
}

/* ═══════════════════════════════════════════
   1280px+ — Wide desktop
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .orbs {
    gap: 64px;
  }

  .ringWrap {
    width: 165px;
    height: 165px;
  }

  .statVal {
    font-size: 2.5rem;
  }

  .bento {
    gap: 24px;
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

  .orb {
    min-width: 110px;
  }

  .ringWrap {
    width: 100px;
    height: 100px;
  }

  .statVal {
    font-size: 1.4rem;
  }

  .statLabel {
    font-size: 0.62rem;
  }

  .card {
    padding: 22px 18px;
    border-radius: 16px;
  }

  .cardIconWrap {
    width: 42px;
    height: 42px;
  }

  .cardTitle {
    font-size: 0.88rem;
  }

  .cardText {
    font-size: 0.78rem;
  }
}
`;

/* ────────────────────────────────────────── */
/*  TSX                                       */
/* ────────────────────────────────────────── */

const tsx = `"use client";

import { useCallback, useEffect, useRef } from "react";
import s from "./Testimonials.module.css";

/* Ring geometry — viewBox 0 0 128 128, r=58 */
const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;

/* ─── Feature data ─── */

const FEATURES = [
  {
    title: "Cutting-Edge 3D & WebGL",
    text: "Immersive experiences powered by Three.js, WebGL, and custom shaders.",
    icon: "globe",
    accent: "blue",
  },
  {
    title: "Senior-Only Team",
    text: "Every project led by 5+ year veterans. No juniors, no compromise.",
    icon: "team",
    accent: "violet",
  },
  {
    title: "Full-Stack Capability",
    text: "From database architecture to pixel-perfect frontends, all in-house.",
    icon: "stack",
    accent: "cyan",
  },
  {
    title: "Fast Turnaround",
    text: "Agile delivery with weekly milestones. Your project, always on time.",
    icon: "clock",
    accent: "gold",
  },
];

/* ─── Stat data ─── */

const STATS = [
  { end: 4.9, suffix: "", label: "Client Satisfaction", isFloat: true, accent: "blue", ringProgress: 0.98 },
  { end: 50, suffix: "+", label: "Projects Delivered", isFloat: false, accent: "violet", ringProgress: 1.0 },
  { end: 98, suffix: "%", label: "On-Time Delivery", isFloat: false, accent: "cyan", ringProgress: 0.98 },
  { end: 100, suffix: "%", label: "5\\u2605 Recommendations", isFloat: false, accent: "gold", ringProgress: 1.0 },
];

/* ─── SVG Icons ─── */

function FeatureIcon({ icon }: { icon: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "globe":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "team":
      return (
        <svg {...p}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "stack":
      return (
        <svg {...p}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Accent class maps ─── */

const ringCls: Record<string, string> = {
  blue: s.ringBlue,
  violet: s.ringViolet,
  cyan: s.ringCyan,
  gold: s.ringGold,
};

const orbCls: Record<string, string> = {
  blue: s.orbBlue,
  violet: s.orbViolet,
  cyan: s.orbCyan,
  gold: s.orbGold,
};

const cardCls: Record<string, string> = {
  blue: s.cardBlue,
  violet: s.cardViolet,
  cyan: s.cardCyan,
  gold: s.cardGold,
};

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const valRefs = useRef<(HTMLDivElement | null)[]>([]);
  const countedRef = useRef<Set<number>>(new Set());

  /* Reveal-on-scroll for header text */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const els = section.querySelectorAll<HTMLElement>("[data-rv]");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* GSAP ScrollTrigger — orb & card entrance */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        const orbEls = section.querySelectorAll(\`.\${s.orb}\`);
        if (orbEls.length) {
          gsap.fromTo(
            Array.from(orbEls),
            { scale: 0.3, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              stagger: 0.12,
              duration: 0.75,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: section.querySelector(\`.\${s.orbs}\`),
                start: "top 85%",
                toggleActions: "play none none none",
              },
            },
          );
        }

        const cardEls = section.querySelectorAll(\`.\${s.card}\`);
        if (cardEls.length) {
          gsap.fromTo(
            Array.from(cardEls),
            { y: 50, rotateX: 6, opacity: 0, scale: 0.97 },
            {
              y: 0,
              rotateX: 0,
              opacity: 1,
              scale: 1,
              stagger: 0.1,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section.querySelector(\`.\${s.bento}\`),
                start: "top 88%",
                toggleActions: "play none none none",
              },
            },
          );
        }
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
          valEl!.textContent =
            (stat.isFloat ? value.toFixed(1) : String(Math.floor(value))) +
            stat.suffix;

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
    <section id="testimonials" ref={sectionRef} className={s.section}>
      {/* Header */}
      <div className={s.header}>
        <p className={s.label} data-rv="fade">
          <span className={s.labelLine} aria-hidden="true" />
          Why Sitely
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title} data-rv="fade" data-d="1">
          Why teams choose <span className="grad-text">Sitely</span>
        </h2>
        <p className={s.desc} data-rv="fade" data-d="2">
          A premium 3D web studio where cutting-edge technology meets design
          excellence. We don&apos;t just build websites &mdash; we craft
          immersive digital experiences.
        </p>
      </div>

      {/* Orbital stat pods */}
      <div className={s.orbs}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={\`\${s.orb} \${orbCls[stat.accent] ?? ""}\`}
            ref={(el) => {
              orbRefs.current[i] = el;
            }}
          >
            <div className={s.ringWrap}>
              <svg className={s.ringSvg} viewBox="0 0 128 128">
                <circle
                  className={s.ringTrack}
                  cx="64"
                  cy="64"
                  r={RING_R}
                />
                <circle
                  className={\`\${s.ringFill} \${ringCls[stat.accent] ?? ""}\`}
                  cx="64"
                  cy="64"
                  r={RING_R}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C}
                  ref={(el) => {
                    ringRefs.current[i] = el;
                  }}
                />
              </svg>
              <div className={s.pulse} aria-hidden="true" />
              <div
                className={s.statVal}
                ref={(el) => {
                  valRefs.current[i] = el;
                }}
              >
                0
              </div>
            </div>
            <div className={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Feature bento grid */}
      <div className={s.bento}>
        {FEATURES.map((feat) => (
          <div
            key={feat.title}
            className={\`\${s.card} \${cardCls[feat.accent] ?? ""}\`}
          >
            <div className={s.cardIconWrap}>
              <FeatureIcon icon={feat.icon} />
            </div>
            <h3 className={s.cardTitle}>{feat.title}</h3>
            <p className={s.cardText}>{feat.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

/* ────────────────────────────────────────── */
/*  Write files                               */
/* ────────────────────────────────────────── */

writeFileSync(CSS_PATH, css);
console.log("✓ CSS written →", CSS_PATH);

writeFileSync(TSX_PATH, tsx);
console.log("✓ TSX written →", TSX_PATH);

console.log("\nDone! Orbital Metrics WhyUs §5 redesign complete.");
