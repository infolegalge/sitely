"use client";

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
  const common = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

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
  const [activeDots, setActiveDots] = useState<boolean[]>(
    () => new Array(STEPS.length).fill(false),
  );

  /* Reveal-on-scroll using the global data-rv system */
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

  /* Scroll-driven timeline fill + active dots */
  const updateTimeline = useCallback(() => {
    const timeline = timelineRef.current;
    const fill = trackFillRef.current;
    if (!timeline || !fill) return;

    const rect = timeline.getBoundingClientRect();
    const viewportMid = window.innerHeight * 0.55;

    // Calculate fill percentage
    const totalHeight = rect.height;
    const scrolledPast = viewportMid - rect.top;
    const pct = Math.max(0, Math.min(100, (scrolledPast / totalHeight) * 100));
    fill.style.height = `${pct}%`;

    // Check each dot
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
      // Only update if changed
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
      <div className={s.header} data-rv="fade">
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
            data-rv="fade"
            data-d={String(i + 1)}
          >
            {/* Dot */}
            <div
              className={`${s.dot}${activeDots[i] ? ` ${s.dotActive}` : ""}`}
              ref={(el) => { dotRefs.current[i] = el; }}
            >
              {activeDots[i] && (
                <span className={s.dotPulse} aria-hidden="true" />
              )}
            </div>

            {/* Card */}
            <div className={s.card}>
              <div className={s.cardGlow} aria-hidden="true" />
              <span className={s.stepNum} aria-hidden="true">
                {step.num}
              </span>

              <div className={`${s.iconWrap} ${accentClass[step.accent] ?? ""}`}>
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
