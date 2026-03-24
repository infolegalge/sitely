"use client";

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
  { end: 100, suffix: "%", label: "5\u2605 Recommendations", isFloat: false, accent: "gold", ringProgress: 1.0 },
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

  /* GSAP ScrollTrigger — 3D puzzle entrance for header, orbs & cards */
  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined;
    let cancelled = false;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section || cancelled) return;

      ctx = gsap.context(() => {
        /* Header entrance */
        gsap.fromTo(
          section.querySelector(`.${s.header}`),
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

        /* Orbs: 3D scatter assemble with rotation */
        const orbEls = section.querySelectorAll(`.${s.orb}`);
        if (orbEls.length) {
          Array.from(orbEls).forEach((orb, i) => {
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
                  trigger: section.querySelector(`.${s.orbs}`),
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                },
                delay: i * 0.12,
              },
            );
          });
        }

        /* Cards: 3D puzzle scatter from different positions */
        const cardEls = section.querySelectorAll(`.${s.card}`);
        if (cardEls.length) {
          Array.from(cardEls).forEach((card, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const xOffset = (col - 0.5) * 120;
            const rotY = (col - 0.5) * 20;

            gsap.fromTo(
              card,
              {
                opacity: 0,
                x: xOffset,
                y: 60 + row * 20,
                rotateX: 12,
                rotateY: rotY,
                scale: 0.75,
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
                  trigger: section.querySelector(`.${s.bento}`),
                  start: "top 88%",
                  end: "top 40%",
                  toggleActions: "play none none reverse",
                },
                delay: i * 0.1,
              },
            );

            /* Parallax depth */
            const depth = [4, -3, -4, 5][i] ?? 0;
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
        }
      }, section);
    }

    init();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
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
            className={`${s.orb} ${orbCls[stat.accent] ?? ""}`}
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
                  className={`${s.ringFill} ${ringCls[stat.accent] ?? ""}`}
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
            className={`${s.card} ${cardCls[feat.accent] ?? ""}`}
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
