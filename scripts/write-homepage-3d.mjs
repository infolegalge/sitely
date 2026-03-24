/**
 * write-homepage-3d.mjs
 * Upgrades ServicesPreview, ProcessSection, and Testimonials with
 * 3D GSAP ScrollTrigger animations matching the /services page style:
 * - Puzzle-piece scatter assembly on scroll
 * - Holographic conic-gradient borders
 * - Perspective transforms, parallax depth
 * - Shimmer sweep + scan lines
 * - Headers animated via GSAP (not data-rv)
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = join(process.cwd(), "src/components/sections/home");

function write(dir, name, ext, content) {
  const folder = join(BASE, dir);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, `${name}.${ext}`), content, "utf-8");
  console.log(`  ✓ ${dir}/${name}.${ext}`);
}

/* ════════════════════════════════════════════════════════════════════
   §3  ServicesPreview — "What We Do" — Upgraded 3D puzzle entrance
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { SERVICES } from "@/lib/constants";
import s from "./ServicesPreview.module.css";

/* ─── Accent cycling ─── */
const ACCENT_CLS = [s.accentBlue, s.accentViolet, s.accentCyan] as const;

/* ─── SVG Icon renderer ─── */
function ServiceIcon({ idx }: { idx: number }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (idx) {
    case 0: // Web Design & UX
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="4" rx="1.5" />
          <rect x="3" y="14" width="7" height="4" rx="1.5" />
          <rect x="14" y="11" width="7" height="10" rx="1.5" />
        </svg>
      );
    case 1: // Web Development
      return (
        <svg {...p}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 2: // 3D & WebGL
      return (
        <svg {...p}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 3: // E-Commerce
      return (
        <svg {...p}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      );
    case 4: // Motion & Animation
      return (
        <svg {...p}>
          <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
          <path d="M2 6c2-4 4-4 6 0s4 4 6 0 4-4 6 0" opacity="0.35" />
          <path d="M2 18c2-4 4-4 6 0s4 4 6 0 4-4 6 0" opacity="0.35" />
        </svg>
      );
    case 5: // SEO & Performance
      return (
        <svg {...p}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ServicesPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  /* GSAP ScrollTrigger — 3D puzzle entrance + parallax depth */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Header entrance via GSAP */
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

        /* Cards: 3D puzzle-piece scatter → assemble */
        const cards = cardsRef.current.filter(Boolean);
        cards.forEach((card, i) => {
          /* Each card comes from a unique 3D position */
          const col = i % 3;
          const row = Math.floor(i / 3);
          const xOffset = (col - 1) * 100;
          const yOffset = 70 + row * 25;
          const rotY = (col - 1) * 20;
          const rotX = 12 + row * 4;

          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: xOffset,
              y: yOffset,
              rotateX: rotX,
              rotateY: rotY,
              scale: 0.75,
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
              delay: i * 0.08,
            },
          );

          /* Parallax depth on scroll */
          const depth = [4, -6, 5, -4, 3, -5][i] ?? 0;
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

        /* Footer CTA entrance */
        gsap.fromTo(
          section.querySelector(\`.\${s.footer}\`),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section.querySelector(\`.\${s.footer}\`),
              start: "top 92%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* Desktop: 3D tilt + cursor tracking */
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
    <section id="services" ref={sectionRef} className={s.section}>
      {/* Header */}
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} />
          What We Do
          <span className={s.labelLineR} />
        </p>
        <h2 className={s.title}>
          Everything your brand needs to{" "}
          <span className="grad-text">thrive</span> online
        </h2>
        <p className={s.subtitle}>
          From concept to launch — strategy, design, and engineering under one
          roof. Six disciplines, one team, zero compromises.
        </p>
      </div>

      {/* Cards Grid */}
      <div className={s.grid}>
        {SERVICES.map((service, i) => (
          <div
            key={service.id}
            className={\`\${s.card} \${ACCENT_CLS[i % 3]}\`}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Holographic border glow */}
            <div className={s.holoGlow} aria-hidden="true" />

            {/* Card inner */}
            <div className={s.cardInner}>
              {/* 3D Shape with icon */}
              <div className={s.shape}>
                <div className={s.shapeGlow} aria-hidden="true" />
                <div className={s.geo}>
                  <div className={s.geoIcon}>
                    <ServiceIcon idx={i} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={s.content}>
                <div className={s.cardTop}>
                  <span className={s.number}>{service.number}</span>
                </div>
                <h3 className={s.cardTitle}>{service.title}</h3>
                <p className={s.cardDesc}>{service.description}</p>
                <div className={s.tags}>
                  {service.tags.map((tag) => (
                    <span key={tag} className={s.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Holographic scan line */}
              <div className={s.scanLine} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className={s.footer}>
        <Link href="/services" className={s.allLink}>
          Explore All Services <span className={s.arrow}>{"\\u2192"}</span>
        </Link>
      </div>
    </section>
  );
}
`;

  // CSS: Add perspective to section, keep everything else the same
  // The existing CSS is already great — just need to add perspective + preserve-3d
  const css = `/* ═══════════════════════════════════════════
   ServicesPreview — "Holographic Orbit"
   Premium 3D service cards with:
   - Holographic prismatic glow borders
   - CSS 3D rotating geometric shapes per card
   - Scroll-triggered GSAP 3D puzzle entrance
   - Glass morphism with depth layers
   - Expanding shimmer sweep on hover
   - Scan line + parallax depth

   Breakpoints: base > 480 > 640 > 768 > 1024 > 1280 > 1440
   ═══════════════════════════════════════════ */

/* ─── Section ─── */

.section {
  position: relative;
  z-index: 1;
  max-width: var(--mw);
  margin: 0 auto;
  padding: 64px 14px 80px;
  overflow: hidden;
  perspective: 1200px;
}

/* ─── Header ─── */

.header {
  text-align: center;
  margin-bottom: clamp(40px, 6vw, 72px);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  will-change: transform, opacity;
}

.label {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--cyan);
  margin-bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.labelLine {
  display: inline-block;
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan));
}

.labelLineR {
  display: inline-block;
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, var(--cyan), transparent);
}

.title {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.8rem, 5vw, 3.4rem);
  font-weight: 700;
  line-height: 1.08;
  color: var(--tx);
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}

.subtitle {
  font-family: var(--font-body, sans-serif);
  font-size: clamp(0.88rem, 1.4vw, 1.05rem);
  line-height: 1.7;
  color: var(--tx-2);
  max-width: 52ch;
  margin: 0 auto;
}

/* ─── Grid ─── */

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  transform-style: preserve-3d;
}

/* ─── Card ─── */

.card {
  position: relative;
  border-radius: 24px;
  padding: 1.5px;
  background: var(--brd);
  cursor: pointer;
  transition: transform 0.5s var(--ease), box-shadow 0.5s var(--ease);
  transform-style: preserve-3d;
  will-change: transform;
}

.card:hover {
  box-shadow:
    0 24px 64px rgba(79, 110, 247, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Holographic border glow */
.holoGlow {
  position: absolute;
  inset: -1px;
  border-radius: 25px;
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

/* ─── Card Inner / Glass ─── */

.cardInner {
  position: relative;
  z-index: 1;
  border-radius: 22.5px;
  padding: 28px 24px;
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  overflow: hidden;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 20px;
  align-items: start;
  min-height: 140px;
}

/* Shimmer sweep on hover */
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
  z-index: 0;
}

.card:hover .cardInner::after {
  left: 120%;
}

/* ─── 3D Shape container ─── */

.shape {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 200px;
  flex-shrink: 0;
}

/* Ambient glow behind shape */
.shapeGlow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  filter: blur(14px);
  opacity: 0.25;
  transition: opacity 0.5s var(--ease);
  z-index: 0;
}

.card:hover .shapeGlow {
  opacity: 0.5;
}

/* 3D rotating geometry */
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

/* SVG icon inside the geometry */
.geoIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.4s var(--ease);
}

.card:hover .geoIcon {
  border-color: rgba(255,255,255,0.15);
}

/* Color accents */
.accentBlue .shapeGlow { background: var(--blue); }
.accentBlue .geoIcon { background: var(--blue-s); color: var(--blue); }

.accentViolet .shapeGlow { background: var(--violet); }
.accentViolet .geoIcon { background: var(--violet-s); color: var(--violet); }

.accentCyan .shapeGlow { background: var(--cyan); }
.accentCyan .geoIcon { background: var(--cyan-s); color: var(--cyan); }

/* ─── Card content ─── */

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cardTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.number {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--tx-3);
  opacity: 0.6;
}

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--tx);
  line-height: 1.2;
  letter-spacing: -0.01em;
  transition: color 0.3s var(--ease);
}

.cardDesc {
  font-family: var(--font-body, sans-serif);
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--tx-2);
  max-width: 50ch;
  margin-top: 2px;
}

/* ─── Tags ─── */

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--tx-3);
  padding: 4px 10px;
  border-radius: 100px;
  border: 1px solid var(--brd);
  background: rgba(255, 255, 255, 0.015);
  transition: border-color 0.3s var(--ease), color 0.3s var(--ease),
    background 0.3s var(--ease);
}

.card:hover .tag {
  border-color: var(--brd-2);
  color: var(--tx-2);
  background: rgba(255, 255, 255, 0.03);
}

/* ─── Accent hover tint on title ─── */

.accentBlue:hover .cardTitle { color: var(--blue-l); }
.accentViolet:hover .cardTitle { color: var(--violet); }
.accentCyan:hover .cardTitle { color: var(--cyan); }

/* ─── Scan line (holographic detail) ─── */

.scanLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--blue) 20%,
    var(--cyan) 50%,
    var(--violet) 80%,
    transparent 100%
  );
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
  z-index: 2;
}

.card:hover .scanLine {
  transform: scaleX(1);
}

/* ─── Footer ─── */

.footer {
  margin-top: clamp(36px, 5vw, 56px);
  text-align: center;
  will-change: transform, opacity;
}

.allLink {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  border-radius: 50px;
  border: 1px solid var(--brd-2);
  background: rgba(8, 8, 16, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--tx);
  text-decoration: none;
  transition:
    border-color 0.4s var(--ease),
    color 0.4s var(--ease),
    background 0.4s var(--ease),
    box-shadow 0.4s var(--ease),
    transform 0.4s var(--ease);
}

.allLink:hover {
  border-color: var(--cyan);
  color: var(--cyan);
  background: rgba(6, 214, 160, 0.06);
  box-shadow: 0 4px 24px rgba(6, 214, 160, 0.12);
  transform: translateY(-2px);
}

.arrow {
  transition: transform 0.3s var(--ease);
}

.allLink:hover .arrow {
  transform: translateX(4px);
}

/* ═══════════════════════════════════════════
   480px+ — Slightly larger cards
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .cardInner {
    padding: 32px 28px;
    grid-template-columns: 60px 1fr;
    gap: 22px;
  }

  .shape {
    width: 60px;
    height: 60px;
  }

  .geo {
    width: 44px;
    height: 44px;
  }

  .geoIcon {
    width: 44px;
    height: 44px;
  }

  .cardTitle {
    font-size: 1.15rem;
  }
}

/* ═══════════════════════════════════════════
   640px+ — 2 column grid
   ═══════════════════════════════════════════ */

@media (min-width: 640px) {
  .section {
    padding: 72px 20px 88px;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .cardInner {
    grid-template-columns: 1fr;
    padding: 28px 24px;
    min-height: 240px;
  }

  .shape {
    width: 52px;
    height: 52px;
  }

  .geo {
    width: 38px;
    height: 38px;
  }

  .geoIcon {
    width: 38px;
    height: 38px;
  }

  .cardTitle {
    font-size: 1.1rem;
  }

  .cardDesc {
    font-size: 0.8rem;
  }
}

/* ═══════════════════════════════════════════
   768px+ — Tablet polish
   ═══════════════════════════════════════════ */

@media (min-width: 768px) {
  .grid {
    gap: 22px;
  }

  .cardInner {
    padding: 30px 26px;
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
  }

  .card {
    border-radius: 26px;
  }

  .holoGlow {
    border-radius: 27px;
  }

  .cardInner {
    border-radius: 24.5px;
  }
}

/* ═══════════════════════════════════════════
   1024px+ — 3-column bento grid
   ═══════════════════════════════════════════ */

@media (min-width: 1024px) {
  .section {
    padding: clamp(80px, 9vh, 120px) 24px;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .card {
    border-radius: 28px;
  }

  .holoGlow {
    border-radius: 29px;
  }

  .cardInner {
    border-radius: 26.5px;
    padding: 32px 28px;
    min-height: 280px;
  }

  .shape {
    width: 56px;
    height: 56px;
  }

  .geo {
    width: 42px;
    height: 42px;
  }

  .geoIcon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }

  .cardTitle {
    font-size: 1.15rem;
  }

  .cardDesc {
    font-size: 0.82rem;
  }

  .tag {
    font-size: 0.56rem;
  }
}

/* ═══════════════════════════════════════════
   1280px+ — Wide desktop
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .grid {
    gap: 28px;
  }

  .cardInner {
    padding: 36px 32px;
    min-height: 300px;
  }

  .shape {
    width: 60px;
    height: 60px;
  }

  .geo {
    width: 46px;
    height: 46px;
  }

  .geoIcon {
    width: 46px;
    height: 46px;
  }

  .cardTitle {
    font-size: 1.25rem;
  }

  .tag {
    font-size: 0.58rem;
    padding: 4px 12px;
  }
}

/* ═══════════════════════════════════════════
   1440px+ — Ultrawide
   ═══════════════════════════════════════════ */

@media (min-width: 1440px) {
  .section {
    max-width: 1360px;
  }

  .grid {
    gap: 32px;
  }

  .cardInner {
    padding: 40px 36px;
    min-height: 310px;
  }

  .cardTitle {
    font-size: 1.3rem;
  }

  .cardDesc {
    font-size: 0.85rem;
  }
}
`;

  write("ServicesPreview", "ServicesPreview", "tsx", tsx);
  write("ServicesPreview", "ServicesPreview.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §4  ProcessSection — "How We Work" — Full 3D GSAP upgrade
   ════════════════════════════════════════════════════════════════════ */
{
  const tsx = `"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./ProcessSection.module.css";

/* ─── Step data ─── */

interface Step {
  num: string;
  title: string;
  desc: string;
  tags: string[];
  accent: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Discovery & Strategy",
    desc: "We dive deep into your vision, audience, and goals. Research-driven workshops define the roadmap — no guesswork, just data and clarity.",
    tags: ["Research", "Workshops", "Audit", "Strategy"],
    accent: "blue",
  },
  {
    num: "02",
    title: "Design & Prototype",
    desc: "Wireframes evolve into high-fidelity designs. Interactive prototypes let you feel the experience before a single line of code is written.",
    tags: ["Figma", "UI/UX", "Prototyping", "Design System"],
    accent: "violet",
  },
  {
    num: "03",
    title: "Develop & Animate",
    desc: "Clean, performant code brings your vision to life. 3D scenes, smooth animations, and pixel-perfect responsive implementation.",
    tags: ["React", "Three.js", "GSAP", "TypeScript"],
    accent: "cyan",
  },
  {
    num: "04",
    title: "Launch & Optimize",
    desc: "Rigorous QA, performance tuning, and a seamless deployment. Post-launch analytics ensure your site keeps performing at its best.",
    tags: ["Testing", "SEO", "Analytics", "Performance"],
    accent: "gold",
  },
];

/* ─── SVG Icons per step ─── */

function StepIcon({ accent }: { accent: string }) {
  const common = {
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (accent) {
    case "blue":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      );
    case "violet":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      );
    case "cyan":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );
    case "gold":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return null;
  }
}

/* Accent class mapping */
const accentClass: Record<string, string> = {
  blue: s.accentBlue,
  violet: s.accentViolet,
  cyan: s.accentCyan,
  gold: s.accentGold,
};

export default function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackFillRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeDots, setActiveDots] = useState<boolean[]>(
    () => new Array(STEPS.length).fill(false),
  );

  /* GSAP ScrollTrigger — 3D header + card entrance */
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

        /* Cards: alternating 3D puzzle entrance */
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
      if (!dot) {
        next.push(false);
        return;
      }
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
    <section id="process" ref={sectionRef} className={s.section}>
      {/* Header */}
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} />
          How We Work
          <span className={s.labelLine} />
        </p>
        <h2 className={s.title}>
          From idea to <span className="grad-text">launch</span>
        </h2>
        <p className={s.subtitle}>
          A clear, collaborative process designed to deliver results —
          no surprises, just progress.
        </p>
      </div>

      {/* Timeline */}
      <div className={s.timeline} ref={timelineRef}>
        {/* Vertical track */}
        <div className={s.track} aria-hidden="true">
          <div className={s.trackFill} ref={trackFillRef} />
        </div>

        {/* Steps */}
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className={s.step}
            ref={(el) => { cardRefs.current[i] = el; }}
          >
            {/* Dot */}
            <div
              className={\`\${s.dot}\${activeDots[i] ? \` \${s.dotActive}\` : ""}\`}
              ref={(el) => { dotRefs.current[i] = el; }}
            >
              {activeDots[i] && (
                <span className={s.dotPulse} aria-hidden="true" />
              )}
            </div>

            {/* Card */}
            <div className={\`\${s.card} \${accentClass[step.accent] ?? ""}\`}>
              <div className={s.holoGlow} aria-hidden="true" />
              <div className={s.cardBody}>
                <div className={s.cardGlow} aria-hidden="true" />
                <span className={s.stepNum} aria-hidden="true">
                  {step.num}
                </span>

                <div className={s.iconWrap}>
                  <StepIcon accent={step.accent} />
                </div>

                <p className={s.stepLabel}>Step {step.num}</p>
                <h3 className={s.stepTitle}>{step.title}</h3>
                <p className={s.stepDesc}>{step.desc}</p>

                <div className={s.tags}>
                  {step.tags.map((tag) => (
                    <span key={tag} className={s.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={s.scanLine} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

  const css = `/* ═══════════════════════════════════════════
   ProcessSection — Homepage §4
   "How We Work" — 3D Timeline with puzzle assembly

   Features:
   - GSAP ScrollTrigger 3D alternating card entrance
   - Animated gradient center line (scroll-fill)
   - Glass card panels with holographic borders
   - Shimmer sweep + scan lines
   - Pulse dot at each step
   - Alternating zigzag on desktop

   Breakpoints: base > 480 > 768 > 1024 > 1280 > 1440
   ═══════════════════════════════════════════ */

/* ─── Section ─── */

.section {
  position: relative;
  z-index: 1;
  padding: 48px 14px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: hidden;
  perspective: 1200px;
}

/* ─── Header ─── */

.header {
  text-align: center;
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  will-change: transform, opacity;
}

.label {
  font-family: var(--font-jetbrains-mono), monospace;
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

/* ─── Timeline container ─── */

.timeline {
  position: relative;
  max-width: 780px;
  margin: 0 auto;
  padding-left: 28px;
  transform-style: preserve-3d;
}

/* ─── Timeline track ─── */

.track {
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.trackFill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: linear-gradient(to bottom, var(--blue), var(--violet), var(--cyan));
  border-radius: 2px;
  transition: height 0.15s linear;
}

.trackFill::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 12px var(--cyan), 0 0 24px rgba(6, 214, 160, 0.3);
  opacity: 0.9;
}

/* ─── Step ─── */

.step {
  position: relative;
  padding-bottom: 40px;
  padding-left: 32px;
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

.step:last-child {
  padding-bottom: 0;
}

/* ─── Dot ─── */

.dot {
  position: absolute;
  left: -28px;
  top: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 12, 22, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition:
    border-color 0.5s var(--ease),
    background 0.5s var(--ease),
    box-shadow 0.5s var(--ease);
}

.dot::after {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.5s var(--ease);
}

.dotActive {
  border-color: var(--blue);
  background: rgba(12, 12, 22, 0.9);
  box-shadow: 0 0 12px rgba(79, 110, 247, 0.3), 0 0 24px rgba(79, 110, 247, 0.1);
}

.dotActive::after {
  background: var(--blue);
}

.dotPulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid var(--blue);
  opacity: 0;
  animation: dotPulse 2.5s ease-out infinite;
}

@keyframes dotPulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ─── Card (holographic outer) ─── */

.card {
  position: relative;
  border-radius: 20px;
  padding: 1.5px;
  background: var(--brd);
  transition: box-shadow 0.5s var(--ease);
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
  border-radius: 21px;
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

/* Card body / Glass inner */
.cardBody {
  position: relative;
  z-index: 1;
  padding: 24px 20px;
  border-radius: 18.5px;
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
}

/* Shimmer sweep */
.cardBody::after {
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

.card:hover .cardBody::after { left: 120%; }

/* Glow line at top */
.cardGlow {
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue), var(--violet), transparent);
  opacity: 0;
  transition: opacity 0.5s var(--ease);
}

.card:hover .cardGlow { opacity: 0.6; }

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

/* ─── Step number ─── */

.stepNum {
  font-family: var(--font-heading, sans-serif);
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1;
  position: absolute;
  top: 16px;
  right: 16px;
  color: #fff;
  opacity: 0.04;
  pointer-events: none;
  user-select: none;
}

/* ─── Icon ─── */

.iconWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  transition: transform 0.4s var(--ease), border-color 0.4s var(--ease);
}

.card:hover .iconWrap {
  transform: translateY(-2px) scale(1.06);
  border-color: rgba(255,255,255,0.15);
}

.accentBlue .iconWrap {
  background: var(--blue-s);
  color: var(--blue);
}

.accentViolet .iconWrap {
  background: var(--violet-s);
  color: var(--violet);
}

.accentCyan .iconWrap {
  background: var(--cyan-s);
  color: var(--cyan);
}

.accentGold .iconWrap {
  background: rgba(234, 179, 8, 0.08);
  color: #eab308;
}

/* ─── Content ─── */

.stepLabel {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--tx-3);
  margin-bottom: 6px;
}

.stepTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  font-weight: 600;
  color: var(--tx);
  margin-bottom: 8px;
  line-height: 1.2;
  transition: color 0.3s var(--ease);
}

.accentBlue:hover .stepTitle { color: var(--blue-l); }
.accentViolet:hover .stepTitle { color: var(--violet); }
.accentCyan:hover .stepTitle { color: var(--cyan); }
.accentGold:hover .stepTitle { color: #facc15; }

.stepDesc {
  font-family: var(--font-body, sans-serif);
  font-size: 0.84rem;
  line-height: 1.7;
  color: var(--tx-2);
  margin-bottom: 14px;
}

/* ─── Tags ─── */

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--tx-3);
  padding: 3px 8px;
  border-radius: 100px;
  border: 1px solid var(--brd);
  background: rgba(255, 255, 255, 0.015);
  transition: border-color 0.3s var(--ease), color 0.3s var(--ease);
}

.card:hover .tag {
  border-color: var(--brd-2);
  color: var(--tx-2);
}

/* ═══════════════════════════════════════════
   480px+
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .section { padding: 56px 16px; }
  .header { margin-bottom: 48px; }
  .timeline { padding-left: 34px; }
  .track { left: 10px; }
  .dot { left: -34px; width: 22px; height: 22px; }
  .step { padding-left: 36px; padding-bottom: 48px; }
  .cardBody { padding: 24px; border-radius: 20px; }
  .card { border-radius: 22px; }
  .holoGlow { border-radius: 23px; }
  .iconWrap { width: 46px; height: 46px; }
  .stepNum { font-size: 2.8rem; }
  .tag { font-size: 0.58rem; padding: 3px 9px; }
}

/* ═══════════════════════════════════════════
   768px+ — Alternating zigzag
   ═══════════════════════════════════════════ */

@media (min-width: 768px) {
  .section { padding: 72px 20px; }
  .header { margin-bottom: 56px; }
  .timeline { padding-left: 0; }
  .track { left: 50%; transform: translateX(-50%); }

  .step {
    padding-left: 0;
    padding-bottom: 56px;
    width: 45%;
  }

  .step:nth-child(odd) { margin-left: 55%; text-align: left; }
  .step:nth-child(even) { margin-left: 0; text-align: right; }

  .dot { left: auto; }
  .step:nth-child(odd) .dot { left: -42px; }
  .step:nth-child(even) .dot { right: -42px; left: auto; }

  .cardBody {
    padding: 28px;
    backdrop-filter: blur(20px);
  }

  .step:nth-child(even) .stepNum { right: auto; left: 16px; }
  .step:nth-child(even) .iconWrap { margin-left: auto; }
  .step:nth-child(even) .tags { justify-content: flex-end; }

  .iconWrap { width: 48px; height: 48px; border-radius: 14px; }
  .stepTitle { font-size: 1.2rem; }
  .stepDesc { font-size: 0.88rem; }
  .tag { font-size: 0.6rem; }
}

/* ═══════════════════════════════════════════
   1024px+
   ═══════════════════════════════════════════ */

@media (min-width: 1024px) {
  .section { padding: clamp(80px, 8vh, 110px) 24px; }
  .header { margin-bottom: clamp(48px, 5vh, 72px); }
  .step { padding-bottom: clamp(48px, 5vh, 72px); }

  .card:hover {
    box-shadow:
      0 20px 56px rgba(79, 110, 247, 0.08),
      0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .cardBody { padding: 32px; }
  .stepTitle { font-size: clamp(1.15rem, 1.5vw, 1.35rem); }
  .stepDesc { font-size: 0.9rem; max-width: 38ch; }
  .step:nth-child(even) .stepDesc { margin-left: auto; }
  .stepNum { font-size: 3.4rem; }
}

/* ═══════════════════════════════════════════
   1280px+
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .cardBody { padding: 36px; }
  .stepNum { font-size: 3.8rem; }
  .tag { font-size: 0.62rem; padding: 4px 10px; }
}

/* ═══════════════════════════════════════════
   1440px+
   ═══════════════════════════════════════════ */

@media (min-width: 1440px) {
  .section { padding: 100px 0; }
}

/* ═══════════════════════════════════════════
   380px max — Small mobile
   ═══════════════════════════════════════════ */

@media (max-width: 380px) {
  .section { padding: 40px 10px; }
  .header { margin-bottom: 32px; }
  .timeline { padding-left: 24px; }
  .track { left: 6px; }
  .dot { left: -24px; width: 18px; height: 18px; }
  .step { padding-left: 28px; padding-bottom: 32px; }
  .cardBody { padding: 16px; border-radius: 14px; }
  .card { border-radius: 16px; }
  .holoGlow { border-radius: 17px; }
  .stepTitle { font-size: 0.95rem; }
  .stepNum { font-size: 2rem; }
  .tag { font-size: 0.52rem; }
}
`;

  write("ProcessSection", "ProcessSection", "tsx", tsx);
  write("ProcessSection", "ProcessSection.module", "css", css);
}

/* ════════════════════════════════════════════════════════════════════
   §5  Testimonials — "Why Sitely" — 3D scatter + holographic cards
   ════════════════════════════════════════════════════════════════════ */
{
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
  { end: 100, suffix: "%", label: "On-Time Delivery", isFloat: false, accent: "cyan", ringProgress: 1.0 },
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* GSAP ScrollTrigger — 3D header, orbs, cards */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Header entrance via GSAP */
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

        /* Orbs: 3D scale + rotateY entrance */
        const orbEls = orbRefs.current.filter(Boolean);
        orbEls.forEach((orb, i) => {
          gsap.fromTo(
            orb,
            {
              scale: 0.3,
              opacity: 0,
              rotateY: (i - 1.5) * 25,
              y: 30,
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

        /* Feature cards: 3D puzzle scatter → assemble */
        const cards = cardRefs.current.filter(Boolean);
        cards.forEach((card, i) => {
          const xOff = (i - 1.5) * 80;
          const rotY = (i - 1.5) * 15;
          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: xOff,
              y: 50,
              rotateX: 12,
              rotateY: rotY,
              scale: 0.8,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section.querySelector(\`.\${s.bento}\`),
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
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Why Sitely
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Why teams choose <span className="grad-text">Sitely</span>
        </h2>
        <p className={s.desc}>
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
            ref={(el) => { orbRefs.current[i] = el; }}
          >
            <div className={s.ringWrap}>
              <svg className={s.ringSvg} viewBox="0 0 128 128">
                <circle className={s.ringTrack} cx="64" cy="64" r={RING_R} />
                <circle
                  className={\`\${s.ringFill} \${ringCls[stat.accent] ?? ""}\`}
                  cx="64"
                  cy="64"
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

      {/* Feature bento grid */}
      <div className={s.bento}>
        {FEATURES.map((feat, i) => (
          <div
            key={feat.title}
            className={\`\${s.card} \${cardCls[feat.accent] ?? ""}\`}
            ref={(el) => { cardRefs.current[i] = el; }}
          >
            <div className={s.holoGlow} aria-hidden="true" />
            <div className={s.cardBody}>
              <div className={s.cardIconWrap}>
                <FeatureIcon icon={feat.icon} />
              </div>
              <h3 className={s.cardTitle}>{feat.title}</h3>
              <p className={s.cardText}>{feat.text}</p>
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
   WhyUs — Homepage §5
   "Orbital Metrics" — 3D puzzle assembly

   Circular SVG progress rings around animated counters
   Feature bento grid with holographic borders
   GSAP ScrollTrigger 3D staggered entrances

   Breakpoints: max-380 > base > 480 > 640 > 768 > 1024 > 1280 > 1440
   ═══════════════════════════════════════════ */

@property --sweep-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@property --holo-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

/* ─── Section ─── */

.section {
  position: relative;
  z-index: 1;
  padding: 48px 14px;
  max-width: var(--mw);
  margin: 0 auto;
  overflow: hidden;
  perspective: 1200px;
}

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

/* ─── Header ─── */

.header {
  text-align: center;
  margin-bottom: 40px;
  will-change: transform, opacity;
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  justify-items: center;
  padding: 20px 0;
  margin-bottom: 40px;
  transform-style: preserve-3d;
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

.orbBlue { --orb-glow: rgba(79, 110, 247, 0.06); }
.orbBlue .statVal { color: var(--blue); }
.orbViolet { --orb-glow: rgba(139, 92, 246, 0.06); }
.orbViolet .statVal { color: var(--violet); }
.orbCyan { --orb-glow: rgba(6, 214, 160, 0.06); }
.orbCyan .statVal { color: var(--cyan); }
.orbGold { --orb-glow: rgba(234, 179, 8, 0.06); }
.orbGold .statVal { color: #eab308; }

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
  transform-style: preserve-3d;
}

/* Card — holographic outer wrapper */
.card {
  position: relative;
  border-radius: 22px;
  padding: 1.5px;
  background: var(--brd);
  will-change: transform, opacity;
  transform-style: preserve-3d;
  transition: transform 0.4s var(--ease), box-shadow 0.4s var(--ease);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 20px 50px rgba(79, 110, 247, 0.08),
    0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Holographic border */
.holoGlow {
  position: absolute;
  inset: -1px;
  border-radius: 23px;
  background: conic-gradient(
    from var(--holo-angle, 0deg),
    var(--card-accent, var(--blue)) 0%,
    var(--cyan) 25%,
    var(--violet) 50%,
    var(--card-accent, var(--blue)) 75%,
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

/* Card body / Glass inner */
.cardBody {
  position: relative;
  z-index: 1;
  border-radius: 20.5px;
  padding: 28px 24px;
  background: rgba(8, 8, 16, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
}

/* Shimmer sweep */
.cardBody::after {
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

.card:hover .cardBody::after { left: 120%; }

/* Scan line */
.scanLine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--card-accent, var(--blue)) 20%, var(--cyan) 50%, var(--violet) 80%, transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease);
}

.card:hover .scanLine { transform: scaleX(1); }

/* Card accent properties */
.cardBlue { --card-accent: var(--blue); }
.cardViolet { --card-accent: var(--violet); }
.cardCyan { --card-accent: var(--cyan); }
.cardGold { --card-accent: #eab308; }

/* ── Card icon ── */

.cardIconWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 16px;
  position: relative;
  transition: border-color 0.4s var(--ease);
}

.card:hover .cardIconWrap { border-color: rgba(255,255,255,0.15); }

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
  background: radial-gradient(circle, var(--card-accent, var(--blue)), transparent 70%);
  opacity: 0.06;
  transition: opacity 0.4s var(--ease);
  pointer-events: none;
}

.card:hover .cardIconWrap::after { opacity: 0.14; }

/* ── Card text ── */

.cardTitle {
  font-family: var(--font-heading, sans-serif);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--tx);
  margin-bottom: 8px;
  transition: color 0.3s var(--ease);
}

.cardBlue:hover .cardTitle { color: var(--blue-l); }
.cardViolet:hover .cardTitle { color: var(--violet); }
.cardCyan:hover .cardTitle { color: var(--cyan); }
.cardGold:hover .cardTitle { color: #facc15; }

.cardText {
  font-family: var(--font-body, sans-serif);
  font-size: 0.82rem;
  color: var(--tx-2);
  line-height: 1.65;
}

/* ═══════════════════════════════════════════
   480px+
   ═══════════════════════════════════════════ */

@media (min-width: 480px) {
  .section { padding: 56px 16px; }
  .orbs { gap: 24px; }
  .ringWrap { width: 110px; height: 110px; }
  .statVal { font-size: 1.6rem; }
  .bento { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}

/* ═══════════════════════════════════════════
   640px+
   ═══════════════════════════════════════════ */

@media (min-width: 640px) {
  .orbs { grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 24px 0; }
  .ringWrap { width: 120px; height: 120px; }
  .statVal { font-size: 1.7rem; }
}

/* ═══════════════════════════════════════════
   768px+
   ═══════════════════════════════════════════ */

@media (min-width: 768px) {
  .section { padding: 72px 20px; }
  .header { margin-bottom: 48px; }
  .ringWrap { width: 140px; height: 140px; }
  .statVal { font-size: 2rem; }
  .orbs { gap: 36px; margin-bottom: 48px; }
  .bento { gap: 16px; }
  .cardBody { padding: 32px 28px; }
}

/* ═══════════════════════════════════════════
   1024px+
   ═══════════════════════════════════════════ */

@media (min-width: 1024px) {
  .section { padding: clamp(80px, 8vh, 110px) 24px; }
  .header { margin-bottom: 56px; }
  .orbs { gap: 56px; margin-bottom: 60px; }
  .ringWrap { width: 155px; height: 155px; }
  .statVal { font-size: 2.3rem; }
  .bento { gap: 20px; }
}

/* ═══════════════════════════════════════════
   1280px+
   ═══════════════════════════════════════════ */

@media (min-width: 1280px) {
  .orbs { gap: 64px; }
  .ringWrap { width: 165px; height: 165px; }
  .statVal { font-size: 2.5rem; }
  .bento { gap: 24px; }
}

/* ═══════════════════════════════════════════
   1440px+
   ═══════════════════════════════════════════ */

@media (min-width: 1440px) {
  .section { padding: 100px 0; }
}

/* ═══════════════════════════════════════════
   380px max
   ═══════════════════════════════════════════ */

@media (max-width: 380px) {
  .section { padding: 40px 10px; }
  .orbs { gap: 10px; }
  .ringWrap { width: 72px; height: 72px; }
  .statVal { font-size: 1.1rem; }
  .statLabel { font-size: 0.62rem; }
  .cardBody { padding: 22px 18px; }
  .card { border-radius: 18px; }
  .holoGlow { border-radius: 19px; }
  .cardBody { border-radius: 16.5px; }
  .cardIconWrap { width: 42px; height: 42px; }
  .cardTitle { font-size: 0.88rem; }
  .cardText { font-size: 0.78rem; }
}
`;

  write("Testimonials", "Testimonials", "tsx", tsx);
  write("Testimonials", "Testimonials.module", "css", css);
}

console.log("\n✅ Homepage §3-§5 upgraded with 3D puzzle animations!");
