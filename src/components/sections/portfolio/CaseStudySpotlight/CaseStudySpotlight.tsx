"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { FEATURED_PROJECTS } from "@/lib/constants";
import s from "./CaseStudySpotlight.module.css";

/* Show the two most detailed featured projects */
const SPOTLIGHTS = FEATURED_PROJECTS.filter(
  (p) => p.challenge && p.solution && p.results,
).slice(0, 2);

export default function CaseStudySpotlight() {
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
        /* Header */
        gsap.fromTo(
          section.querySelector(`.${s.header}`),
          { opacity: 0, y: 50 },
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

        /* Case study cards */
        const studies = section.querySelectorAll(`.${s.study}`);
        studies.forEach((study, i) => {
          const isReversed = i % 2 === 1;
          gsap.fromTo(
            study,
            {
              opacity: 0,
              x: isReversed ? 60 : -60,
              rotateY: isReversed ? -12 : 12,
              scale: 0.92,
            },
            {
              opacity: 1,
              x: 0,
              rotateY: 0,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: study,
                start: "top 85%",
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
    <section id="p-cases" ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Case Studies
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Stories Behind the <span className="grad-text">Pixels</span>
        </h2>
        <p className={s.subtitle}>
          Real challenges, creative solutions, and measurable results
          from our flagship projects.
        </p>
      </div>

      {SPOTLIGHTS.map((project, i) => (
        <div
          key={project.id}
          className={`${s.study} ${i % 2 === 1 ? s.studyReverse : ""}`}
        >
          {/* Visual */}
          <div className={s.visual}>
            {project.thumbnail ? (
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                sizes="(max-width: 767px) 90vw, 50vw"
                className={s.visualImg}
              />
            ) : (
              <div className={s.visualPlaceholder}>◈</div>
            )}
            <div
              className={s.accentBar}
              style={{ "--accent": project.accentColor } as React.CSSProperties}
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className={s.content}>
            <span className={s.studyLabel}>{project.category}</span>
            <h3 className={s.studyTitle}>{project.title}</h3>
            <p className={s.studyDesc}>{project.description}</p>

            <div className={s.blocks}>
              {project.challenge && (
                <div className={s.block}>
                  <p className={s.blockLabel}>Challenge</p>
                  <p className={s.blockText}>{project.challenge}</p>
                </div>
              )}
              {project.solution && (
                <div className={s.block}>
                  <p className={s.blockLabel}>Solution</p>
                  <p className={s.blockText}>{project.solution}</p>
                </div>
              )}
            </div>

            {project.results && (
              <div className={s.metrics}>
                {project.results.map((r) => (
                  <span key={r} className={s.metric}>
                    {r}
                  </span>
                ))}
              </div>
            )}

            <div className={s.studyTags}>
              {project.tags.map((tag) => (
                <span key={tag} className={s.studyTag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
