"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./ClientJourney.module.css";

const STEPS = [
  {
    num: "01",
    title: "Get In Touch",
    desc: "Reach out through our contact form, email, or phone. Tell us about your project and we\u2019ll respond within 24 hours.",
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

        /* Delivery badge */
        gsap.fromTo(
          section.querySelector(`.${s.deliveryBadge}`),
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
    return () => {
      cancelled = true;
      ctx?.revert();
    };
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
    fill.style.height = `${pct}%`;

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
    <section id="sv-journey" ref={sectionRef} className={s.section}>
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
        <span className={s.deliveryIcon} aria-hidden="true">\u26a1</span>
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
              className={`${s.dot}${activeDots[i] ? ` ${s.dotActive}` : ""}`}
              ref={(el) => { dotRefs.current[i] = el; }}
            >
              {activeDots[i] && (
                <span className={s.dotPulse} aria-hidden="true" />
              )}
            </div>

            <div className={`${s.card} ${accentCls[step.accent] ?? ""}`}>
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
