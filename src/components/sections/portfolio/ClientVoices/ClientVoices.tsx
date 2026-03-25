"use client";

import { useEffect, useRef } from "react";
import { PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import s from "./ClientVoices.module.css";

/* ── pick 4 diverse testimonials from real projects ── */
const VOICE_SLUGS = ["bellroy", "linear", "getaway-house", "ritual"] as const;
const TESTIMONIALS = VOICE_SLUGS.map((slug) => {
  const p = PORTFOLIO_PROJECTS.find((pr) => pr.slug === slug)!;
  const t = p.testimonial!;
  const initials = t.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return {
    quote: t.quote,
    name: t.author,
    role: t.role.split(",")[0].trim(),
    company: p.client,
    initials,
    stars: 5 as const,
  };
});

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
    <section id="p-voices" ref={sectionRef} className={s.section}>
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
