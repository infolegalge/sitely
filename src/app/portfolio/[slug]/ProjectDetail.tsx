"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/types";
import { FEATURED_PROJECTS } from "@/lib/constants";
import s from "./ProjectDetail.module.css";

export default function ProjectDetail({ project }: { project: Project }) {
  const mainRef = useRef<HTMLElement>(null);

  /* Reveal-on-scroll */
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-rv]");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Next / Prev project */
  const idx = FEATURED_PROJECTS.findIndex((p) => p.id === project.id);
  const next = FEATURED_PROJECTS[(idx + 1) % FEATURED_PROJECTS.length];

  return (
    <main ref={mainRef} className={s.page}>
      {/* ─── Hero ─── */}
      <section className={s.hero}>
        <div className={s.heroBreadcrumb} data-rv="fade">
          <Link href="/portfolio" className={s.breadcrumbLink}>
            Portfolio
          </Link>
          <span className={s.breadcrumbSep}>/</span>
          <span className={s.breadcrumbCurrent}>{project.title}</span>
        </div>

        <h1 className={s.heroTitle} data-rv="fade" data-d="1">
          {project.title}
        </h1>

        <div className={s.heroMeta} data-rv="fade" data-d="2">
          <div className={s.metaItem}>
            <span className={s.metaLabel}>Client</span>
            <span className={s.metaValue}>{project.client}</span>
          </div>
          <div className={s.metaItem}>
            <span className={s.metaLabel}>Category</span>
            <span className={s.metaValue}>{project.category}</span>
          </div>
          <div className={s.metaItem}>
            <span className={s.metaLabel}>Year</span>
            <span className={s.metaValue}>{project.year}</span>
          </div>
          <div className={s.metaItem}>
            <span className={s.metaLabel}>Stack</span>
            <span className={s.metaValue}>{project.tags.join(", ")}</span>
          </div>
        </div>

        {/* Hero image */}
        <div className={s.heroImage} data-rv="scale" data-d="3">
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            sizes="(max-width: 767px) 100vw, 90vw"
            className={s.heroImg}
            priority
            placeholder={project.blurDataURL ? "blur" : "empty"}
            blurDataURL={project.blurDataURL}
          />
          <div className={s.heroGradient} />
        </div>
      </section>

      {/* ─── Overview ─── */}
      <section className={s.overview}>
        <div className={s.overviewGrid}>
          <div className={s.overviewLeft} data-rv="fade">
            <p className={s.sectionLabel}>Overview</p>
            <p className={s.descriptionText}>{project.description}</p>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={s.visitBtn}
              >
                Visit Live Site
                <span className={s.arrow}>→</span>
              </a>
            )}
          </div>

          <div className={s.overviewRight} data-rv="fade" data-d="2">
            {project.challenge && (
              <div className={s.detailBlock}>
                <h3 className={s.detailLabel}>Challenge</h3>
                <p className={s.detailText}>{project.challenge}</p>
              </div>
            )}
            {project.solution && (
              <div className={s.detailBlock}>
                <h3 className={s.detailLabel}>Solution</h3>
                <p className={s.detailText}>{project.solution}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Results ─── */}
      {project.results && project.results.length > 0 && (
        <section className={s.results}>
          <p className={s.sectionLabel} data-rv="fade">
            Key Results
          </p>
          <div className={s.resultsGrid}>
            {project.results.map((result, i) => (
              <div
                key={i}
                className={s.resultCard}
                data-rv="fade"
                data-d={String(i + 1)}
              >
                <span className={s.resultNumber}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className={s.resultText}>{result}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Tech Stack ─── */}
      <section className={s.techSection}>
        <p className={s.sectionLabel} data-rv="fade">
          Technologies
        </p>
        <div className={s.techTags} data-rv="fade" data-d="1">
          {project.tags.map((tag) => (
            <span key={tag} className={s.techTag}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Next Project ─── */}
      <section className={s.nextProject} data-rv="fade">
        <p className={s.nextLabel}>Next Project</p>
        <Link
          href={`/portfolio/${next.slug}`}
          className={s.nextLink}
        >
          <span className={s.nextTitle}>{next.title}</span>
          <span className={s.nextArrow}>→</span>
        </Link>
      </section>
    </main>
  );
}
