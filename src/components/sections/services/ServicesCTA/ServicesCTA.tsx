"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import s from "./ServicesCTA.module.css";

export default function ServicesCTA() {
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
        /* CTA card: 3D rotational entrance */
        gsap.fromTo(
          section.querySelector(`.${s.inner}`),
          {
            opacity: 0,
            y: 80,
            rotateX: 20,
            rotateY: -10,
            scale: 0.85,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              end: "top 40%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Buttons stagger */
        const btns = section.querySelectorAll(`.${s.btnPrimary}, .${s.btnSecondary}`);
        gsap.fromTo(
          Array.from(btns),
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.12,
            duration: 0.6,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: section.querySelector(`.${s.inner}`),
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          },
        );

        /* Gentle float on scroll */
        gsap.to(section.querySelector(`.${s.inner}`), {
          y: -15,
          rotateX: 2,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
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
      <div className={s.inner}>
        <div className={s.glow} aria-hidden="true" />
        <div className={s.holoGlow} aria-hidden="true" />
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Ready?
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Let&apos;s build something{" "}
          <span className="grad-text">extraordinary</span>
        </h2>
        <p className={s.desc}>
          Tell us about your project and get a free consultation.
          We&apos;ll respond within 24 hours.
        </p>
        <div className={s.actions}>
          <Link href="/contact" className={s.btnPrimary}>
            Start a Project
            <span className={s.btnArrow} aria-hidden="true">&rarr;</span>
          </Link>
          <Link href="/portfolio" className={s.btnSecondary}>
            View Our Work
          </Link>
        </div>
        <div className={s.scanLine} aria-hidden="true" />
      </div>
    </section>
  );
}
