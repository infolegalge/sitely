"use client";

import { useEffect, useRef } from "react";
import s from "./TechMarquee.module.css";

const ROW_1 = [
  { icon: "⚛", name: "React" },
  { icon: "▲", name: "Next.js" },
  { icon: "🔷", name: "TypeScript" },
  { icon: "◈", name: "Three.js" },
  { icon: "✦", name: "GSAP" },
  { icon: "🎨", name: "Figma" },
  { icon: "⚡", name: "Node.js" },
  { icon: "🔐", name: "Supabase" },
  { icon: "💳", name: "Stripe" },
  { icon: "🏪", name: "Shopify" },
  { icon: "◉", name: "WebGL" },
  { icon: "✧", name: "Framer Motion" },
];

const ROW_2 = [
  { icon: "🎭", name: "Blender" },
  { icon: "📊", name: "D3.js" },
  { icon: "🗺", name: "Mapbox" },
  { icon: "🔮", name: "GLSL Shaders" },
  { icon: "📦", name: "Docker" },
  { icon: "🧩", name: "Sanity CMS" },
  { icon: "△", name: "Tailwind CSS" },
  { icon: "🔄", name: "GraphQL" },
  { icon: "🎯", name: "Lottie" },
  { icon: "⚙", name: "Vercel" },
  { icon: "🛡", name: "Auth.js" },
  { icon: "📈", name: "Analytics" },
];

export default function TechMarquee() {
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
      }, section);
    }

    init();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const renderPills = (items: typeof ROW_1) => {
    /* Duplicate for seamless loop */
    const doubled = [...items, ...items];
    return doubled.map((item, i) => (
      <span key={`${item.name}-${i}`} className={s.pill}>
        <span className={s.pillIcon}>{item.icon}</span>
        <span className={s.pillName}>{item.name}</span>
      </span>
    ));
  };

  return (
    <section id="p-tech" ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Our Arsenal
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Built with the <span className="grad-text">Best Tools</span>
        </h2>
      </div>

      <div className={`${s.trackRow} ${s.forward}`}>
        <div className={s.track}>{renderPills(ROW_1)}</div>
      </div>
      <div className={`${s.trackRow} ${s.reverse}`}>
        <div className={s.track}>{renderPills(ROW_2)}</div>
      </div>
    </section>
  );
}
