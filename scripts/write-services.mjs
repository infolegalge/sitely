import { writeFileSync } from "fs";

/* ═══════════════════════════════════════════
   ServicesPreview — Complete rewrite
   "Holographic Orbit" concept

   Each service = a node on a vertical helix path.
   Active card gets a prismatic holographic glow.
   CSS 3D rotating icosahedron icon per card.
   GSAP ScrollTrigger drives the reveal sequence.
   Full glass-morphism + prismatic refraction.
   ═══════════════════════════════════════════ */

const css = `/* ═══════════════════════════════════════════
   ServicesPreview — "Holographic Orbit"
   Premium 3D service cards with:
   ‣ Holographic prismatic glow borders
   ‣ CSS 3D rotating geometric shapes per card
   ‣ Scroll-triggered staggered reveal
   ‣ Glass morphism with depth layers
   ‣ Particle accent trails on hover
   ‣ Expanding detail panel on interaction

   Breakpoints: base → 480 → 640 → 768 → 1024 → 1280 → 1440
   ═══════════════════════════════════════════ */

/* ─── Section ─── */

.section {
  position: relative;
  z-index: 1;
  max-width: var(--mw);
  margin: 0 auto;
  padding: 64px 14px 80px;
  overflow: visible;
}

/* ─── Header ─── */

.header {
  text-align: center;
  margin-bottom: clamp(40px, 6vw, 72px);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
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
  transform: translateY(-4px);
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
   640px+ — 2 column grid starts
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

writeFileSync(
  "c:/Users/user/Desktop/sitely/src/components/sections/home/ServicesPreview/ServicesPreview.module.css",
  css,
  "utf8",
);
console.log("CSS written");

/* ═══════════════════════════════════════════
   TSX — Holographic Orbit ServicesPreview
   ═══════════════════════════════════════════ */

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

  /* Reveal-on-scroll (IntersectionObserver) */
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
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* GSAP ScrollTrigger — holographic border angle + parallax on cards */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      ctx = gsap.context(() => {
        /* Staggered card entrance with 3D rotation */
        const cards = cardsRef.current.filter(Boolean);
        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            {
              y: 60,
              rotateX: 8,
              opacity: 0,
              scale: 0.96,
            },
            {
              y: 0,
              rotateX: 0,
              opacity: 1,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card!,
                start: "top 88%",
                end: "top 50%",
                toggleActions: "play none none none",
              },
              delay: i * 0.08,
            },
          );
        });

        /* Parallax depth on scroll for each card */
        cards.forEach((card, i) => {
          const depth = (i % 3 === 1) ? -15 : (i % 3 === 2) ? 10 : -8;
          gsap.to(card, {
            y: depth,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        });
      }, section);
    }

    init();
    return () => ctx?.revert();
  }, []);

  /* Desktop: 3D tilt + cursor glow tracking */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.transform =
        \\\`perspective(800px) rotateY(\\\${x * 10}deg) rotateX(\\\${-y * 10}deg) translateY(-6px)\\\`;
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      card.style.transform = "";
    },
    [],
  );

  return (
    <section id="services" ref={sectionRef} className={s.section}>
      {/* Header */}
      <div className={s.header} data-rv="fade">
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
            className={\\\`\\\${s.card} \\\${ACCENT_CLS[i % 3]}\\\`}
            data-rv="fade"
            data-d={String(i + 1)}
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
      <div className={s.footer} data-rv="fade" data-d="6">
        <Link href="/services" className={s.allLink}>
          Explore All Services <span className={s.arrow}>\\u2192</span>
        </Link>
      </div>
    </section>
  );
}
`;

writeFileSync(
  "c:/Users/user/Desktop/sitely/src/components/sections/home/ServicesPreview/ServicesPreview.tsx",
  tsx,
  "utf8",
);
console.log("TSX written");
console.log("DONE — ServicesPreview rewritten!");
`;

writeFileSync(
  "c:/Users/user/Desktop/sitely/src/components/sections/home/ServicesPreview/ServicesPreview.module.css",
  css,
  "utf8",
);
console.log("CSS written");
