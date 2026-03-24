"use client";

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

        /* Cards: 3D puzzle scatter → assemble */
        const cards = cardsRef.current.filter(Boolean);
        cards.forEach((card, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const xOffset = (col - 1) * 120;
          const yOffset = 80 + row * 30;
          const rotY = (col - 1) * 25;
          const rotX = 15 + row * 5;

          gsap.fromTo(
            card,
            {
              opacity: 0,
              x: xOffset,
              y: yOffset,
              rotateX: rotX,
              rotateY: rotY,
              scale: 0.7,
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
                trigger: section.querySelector(`.${s.grid}`),
                start: "top 88%",
                end: "top 40%",
                toggleActions: "play none none reverse",
              },
              delay: i * 0.1,
            },
          );

          /* Parallax depth */
          const depth = [4, -3, 5, -4, 3, -5][i] ?? 0;
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

        /* Footer CTA */
        gsap.fromTo(
          section.querySelector(`.${s.footer}`),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section.querySelector(`.${s.footer}`),
              start: "top 92%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }, section);
    }

    init();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  /* Desktop: 3D tilt + cursor tracking */
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
            className={`${s.card} ${ACCENT_CLS[i % 3]}`}
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
          Explore All Services <span className={s.arrow}>{"→"}</span>
        </Link>
      </div>
    </section>
  );
}
