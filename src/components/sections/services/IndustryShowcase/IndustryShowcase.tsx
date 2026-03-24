"use client";

import { useCallback, useEffect, useRef } from "react";
import s from "./IndustryShowcase.module.css";

const INDUSTRIES = [
  {
    icon: "hotel",
    title: "Hotels & Hospitality",
    desc: "Booking engines, virtual tours, and luxury brand experiences that increase direct reservations and reduce OTA dependency.",
    accent: "blue",
  },
  {
    icon: "restaurant",
    title: "Restaurants & Food",
    desc: "Online menus, reservation systems, and delivery platforms that keep tables full and orders flowing.",
    accent: "violet",
  },
  {
    icon: "tourism",
    title: "Tourism & Travel",
    desc: "Immersive destination showcases, tour booking platforms, and multilingual experiences for international audiences.",
    accent: "cyan",
  },
  {
    icon: "ecommerce",
    title: "E-Commerce & Retail",
    desc: "High-converting online stores with smart product discovery, seamless checkout, and inventory management.",
    accent: "gold",
  },
  {
    icon: "health",
    title: "Healthcare & Wellness",
    desc: "Patient portals, appointment booking, and medical platforms that build trust through clean, accessible design.",
    accent: "blue",
  },
  {
    icon: "corporate",
    title: "Corporate & Startups",
    desc: "Brand websites, SaaS dashboards, and investor-ready platforms that establish credibility and drive growth.",
    accent: "violet",
  },
];

/* ─── SVG Icons ─── */

function IndustryIcon({ icon }: { icon: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "hotel":
      return (
        <svg {...p}>
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9h1" />
          <path d="M9 13h1" />
          <path d="M9 17h1" />
        </svg>
      );
    case "restaurant":
      return (
        <svg {...p}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
        </svg>
      );
    case "tourism":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      );
    case "ecommerce":
      return (
        <svg {...p}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case "health":
      return (
        <svg {...p}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "corporate":
      return (
        <svg {...p}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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

export default function IndustryShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  /* GSAP ScrollTrigger — 3D puzzle entrance */
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
          /* Each card comes from a different 3D position */
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

          /* Gentle parallax depth */
          const depth = [4, -3, 5, -4, 3, -5][i] ?? 0;
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
      card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px)`;
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
    <section ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Industries
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Built for <span className="grad-text">your industry</span>
        </h2>
        <p className={s.subtitle}>
          We understand the unique challenges of your business.
          Every solution is tailored to your industry&apos;s needs.
        </p>
      </div>

      <div className={s.grid}>
        {INDUSTRIES.map((ind, i) => (
          <div
            key={ind.title}
            className={`${s.card} ${accentCls[ind.accent] ?? ""}`}
            ref={(el) => { cardsRef.current[i] = el; }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className={s.holoGlow} aria-hidden="true" />
            <div className={s.cardInner}>
              <div className={s.iconWrap}>
                <IndustryIcon icon={ind.icon} />
              </div>
              <h3 className={s.cardTitle}>{ind.title}</h3>
              <p className={s.cardDesc}>{ind.desc}</p>
              <div className={s.scanLine} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
