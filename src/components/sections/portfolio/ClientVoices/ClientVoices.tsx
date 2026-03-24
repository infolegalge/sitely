"use client";

import { useEffect, useRef } from "react";
import s from "./ClientVoices.module.css";

/* ── testimonials linked to portfolio projects ── */
const TESTIMONIALS = [
  {
    quote:
      "They delivered a 3D shopping experience that doubled our average session time. The WebGL product viewer alone increased conversions by 34%.",
    name: "Marcus Reinhardt",
    role: "CTO",
    company: "LuxeHaven",
    initials: "MR",
    stars: 5,
  },
  {
    quote:
      "Our booking platform feels like a premium travel magazine now. The immersive destination previews generated a 120% increase in direct bookings within two months.",
    name: "Eva Lindström",
    role: "Digital Director",
    company: "Arctic Drift Expeditions",
    initials: "EL",
    stars: 5,
  },
  {
    quote:
      "Sitely rebuilt our entire SaaS dashboard from scratch — real-time analytics, smooth transitions, flawless on every device. Our churn dropped 18% after launch.",
    name: "Daniel Kowalski",
    role: "Co-Founder",
    company: "PulseMetrics",
    initials: "DK",
    stars: 5,
  },
  {
    quote:
      "The 3D property tours completely transformed how clients explore listings. We closed 42% more deals in the first quarter after launch.",
    name: "Isabelle Moreau",
    role: "Head of Digital",
    company: "Vantage Estates",
    initials: "IM",
    stars: 5,
  },
];

export default function ClientVoices() {
  const sectionRef = useRef<HTMLElement>(null);

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
        /* header fade-up */
        gsap.fromTo(
          section.querySelector(`.${s.header}`),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* cards scatter-in */
        const cards = section.querySelectorAll(`.${s.card}`);
        cards.forEach((card, i) => {
          const angle = ((i - 1.5) / 1.5) * 25;
          gsap.fromTo(
            card,
            {
              opacity: 0,
              y: 80 + Math.random() * 30,
              rotateZ: angle,
              scale: 0.88,
            },
            {
              opacity: 1,
              y: 0,
              rotateZ: 0,
              scale: 1,
              duration: 0.7,
              ease: "back.out(1.4)",
              delay: i * 0.12,
              scrollTrigger: {
                trigger: section,
                start: "top 80%",
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

  return (
    <section ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Client Voices
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          What They <span className="grad-text">Say About Us</span>
        </h2>
        <p className={s.subtitle}>
          Real feedback from teams around the world whose visions we brought to
          life.
        </p>
      </div>

      <div className={s.grid}>
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className={s.card}>
            <div className={s.holoGlow} aria-hidden="true" />
            <div className={s.cardInner}>
              <div className={s.stars} aria-label={`${t.stars} stars`}>
                {Array.from({ length: t.stars }, (_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <p className={s.quote}>&ldquo;{t.quote}&rdquo;</p>

              <div className={s.author}>
                <div className={s.avatar}>{t.initials}</div>
                <div className={s.authorInfo}>
                  <span className={s.authorName}>{t.name}</span>
                  <span className={s.authorMeta}>
                    {t.role} · {t.company}
                  </span>
                </div>
              </div>
            </div>
            <span className={s.scanLine} aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  );
}
