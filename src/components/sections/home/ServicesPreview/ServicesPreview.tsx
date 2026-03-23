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

  /* GSAP ScrollTrigger — 3D entrance + parallax depth */
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
                toggleActions: "play none none reverse",
              },
              delay: i * 0.08,
            },
          );
        });

        /* Parallax depth on scroll for each card */
        cards.forEach((card, i) => {
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
    return () => ctx?.revert();
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
            className={`${s.card} ${ACCENT_CLS[i % 3]}`}
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
          Explore All Services <span className={s.arrow}>{"→"}</span>
        </Link>
      </div>
    </section>
  );
}
