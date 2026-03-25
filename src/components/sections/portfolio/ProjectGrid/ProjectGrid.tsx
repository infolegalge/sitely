"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PORTFOLIO_PROJECTS,
  PORTFOLIO_CATEGORIES,
  type PortfolioCategory,
} from "@/lib/portfolio-projects";
import { FEATURED_PROJECTS } from "@/lib/constants";
import type { Project } from "@/types";
import s from "./ProjectGrid.module.css";

const ALL_PROJECTS: Project[] = [...FEATURED_PROJECTS, ...PORTFOLIO_PROJECTS];

const PAGE_SIZE = 12;

export default function ProjectGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<PortfolioCategory>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered =
    active === "All"
      ? ALL_PROJECTS
      : ALL_PROJECTS.filter((p) => p.category === active);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  /* ─── 3D hover tilt ─── */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`;
    },
    [],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.transform = "";
    },
    [],
  );

  /* ─── GSAP entrance ─── */
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

        /* Cards: 3D scatter → assemble */
        const cards = section.querySelectorAll(`.${s.card}`);
        cards.forEach((card, i) => {
          const fromLeft = i % 3 === 0;
          const fromRight = i % 3 === 2;
          gsap.fromTo(
            card,
            {
              opacity: 0,
              y: 60 + (i % 5) * 15,
              x: fromLeft ? -40 : fromRight ? 40 : 0,
              rotateY: fromLeft ? 15 : fromRight ? -15 : 0,
              rotateX: 8,
              scale: 0.88,
            },
            {
              opacity: 1,
              y: 0,
              x: 0,
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
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
  }, [active]);

  return (
    <section id="p-projects" ref={sectionRef} className={s.section}>
      <div className={s.header}>
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Explore Projects
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Built for <span className="grad-text">Every Industry</span>
        </h2>
        <p className={s.subtitle}>
          From startups to enterprises — explore {ALL_PROJECTS.length}+ projects
          across {PORTFOLIO_CATEGORIES.length - 1} industries.
        </p>
      </div>

      {/* Filter bar */}
      <div className={s.filters}>
        {PORTFOLIO_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${s.filterBtn} ${active === cat ? s.filterBtnActive : ""}`}
            onClick={() => { setActive(cat); setVisibleCount(PAGE_SIZE); }}
          >
            {cat}
            {cat !== "All" && (
              <> ({ALL_PROJECTS.filter((p) => p.category === cat).length})</>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div ref={gridRef} className={s.grid}>
        {filtered.length === 0 && (
          <div className={s.empty}>No projects in this category yet.</div>
        )}
        {visible.map((project) => (
          <Link
            key={project.id}
            href={`/portfolio/${project.slug}`}
            className={s.card}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div className={s.holoGlow} aria-hidden="true" />
            <div className={s.cardInner}>
              <div className={s.thumbWrap}>
                {project.thumbnail ? (
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    sizes="(max-width: 599px) 90vw, (max-width: 999px) 45vw, 30vw"
                    className={s.thumbImg}
                    placeholder={project.blurDataURL ? "blur" : "empty"}
                    blurDataURL={project.blurDataURL}
                  />
                ) : (
                  <div className={s.thumbPlaceholder}>◈</div>
                )}
              </div>
              <div className={s.cardBody}>
                <div className={s.cardMeta}>
                  <span className={s.cardCategory}>{project.category}</span>
                  <span className={s.cardDot} aria-hidden="true" />
                  <span className={s.cardYear}>{project.year}</span>
                </div>
                <h3 className={s.cardTitle}>{project.title}</h3>
                {project.description && (
                  <p className={s.cardDesc}>{project.description}</p>
                )}
                <div className={s.cardTags}>
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={s.cardTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className={s.scanLine} aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>

      {/* Load more */}
      {filtered.length > 0 && (
        <div className={s.loadMoreWrap}>
          <p className={s.showingCount}>
            Showing {visible.length} of {filtered.length} projects
          </p>
          {hasMore && (
            <button
              className={s.loadMoreBtn}
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load More Projects
            </button>
          )}
        </div>
      )}
    </section>
  );
}
