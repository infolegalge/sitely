"use client";

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
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  /* 3D tilt on hover */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
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
    <section id="sv-deep" ref={sectionRef} className={s.section}>
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
            className={`${s.card} ${ACCENT_CLS[i]}`}
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
