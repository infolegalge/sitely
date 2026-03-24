"use client";

import { useEffect, useRef } from "react";
import s from "./PortfolioHero.module.css";

const STATS = [
  "57+ Projects",
  "10 Industries",
  "100% Delivery",
  "4.9★ Rating",
];

export default function PortfolioHero() {
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
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        /* Label slide in */
        tl.fromTo(
          section.querySelector(`.${s.label}`),
          { opacity: 0, y: 30, rotateX: 40 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.8 },
          0.1,
        );

        /* Title words fly in from different depths */
        const words = section.querySelectorAll(`.${s.word}`);
        words.forEach((word, i) => {
          const fromLeft = i % 2 === 0;
          tl.fromTo(
            word,
            {
              opacity: 0,
              x: fromLeft ? -60 : 60,
              y: 40,
              rotateY: fromLeft ? 25 : -25,
              rotateX: 15,
              scale: 0.85,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.9,
            },
            0.15 + i * 0.08,
          );
        });

        /* Subtitle fade up */
        tl.fromTo(
          section.querySelector(`.${s.subtitle}`),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          0.5,
        );

        /* Badges scatter in like puzzle pieces */
        const badges = section.querySelectorAll(`.${s.badge}`);
        badges.forEach((badge, i) => {
          const angle = (i - 1.5) * 30;
          tl.fromTo(
            badge,
            {
              opacity: 0,
              scale: 0.4,
              y: 50,
              x: (i - 1.5) * 40,
              rotation: angle,
            },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0,
              rotation: 0,
              duration: 0.6,
              ease: "back.out(1.7)",
            },
            0.65 + i * 0.06,
          );
        });

        /* Parallax drift on scroll */
        gsap.to(section.querySelector(`.${s.inner}`), {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
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
      <div className={s.glow} aria-hidden="true" />
      <div className={s.inner}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Our Portfolio
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h1 className={s.title}>
          <span className={s.word}>Projects </span>
          <span className={s.word}>in </span>
          <span className={`${s.word} grad-text`}>Motion</span>
        </h1>
        <p className={s.subtitle}>
          Every project is a digital experience — crafted with precision,
          animated with purpose, and built to convert.
        </p>
        <div className={s.badges}>
          {STATS.map((stat) => (
            <span key={stat} className={s.badge}>
              {stat}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
