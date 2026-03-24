"use client";

import { useCallback, useEffect, useRef } from "react";
import s from "./ResultsProof.module.css";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

const STATS = [
  { end: 50, suffix: "+", label: "Projects Delivered", accent: "blue", ringProgress: 1.0 },
  { end: 98, suffix: "%", label: "Client Satisfaction", accent: "violet", ringProgress: 0.98 },
  { end: 2, suffix: " wk", label: "Avg. Delivery", accent: "cyan", ringProgress: 0.14 },
  { end: 100, suffix: "%", label: "5\u2605 Reviews", accent: "gold", ringProgress: 1.0 },
];

const HIGHLIGHTS = [
  { stat: "45%", label: "increase in online bookings", project: "XParagliding", accent: "blue" },
  { stat: "3\u00d7", label: "faster client-lawyer matching", project: "Legal.ge", accent: "violet" },
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
    let cancelled = false;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      if (!section || cancelled) return;

      ctx = gsap.context(() => {
        /* Header */
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
                trigger: section.querySelector(`.${s.orbs}`),
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
                trigger: section.querySelector(`.${s.highlights}`),
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
            className={`${s.orb} ${accentCls[stat.accent] ?? ""}`}
            ref={(el) => { orbRefs.current[i] = el; }}
          >
            <div className={s.ringWrap}>
              <svg className={s.ringSvg} viewBox="0 0 112 112">
                <circle className={s.ringTrack} cx="56" cy="56" r={RING_R} />
                <circle
                  className={`${s.ringFill} ${ringCls[stat.accent] ?? ""}`}
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
            className={`${s.hCard} ${accentCls[h.accent] ?? ""}`}
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
