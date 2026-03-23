"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FEATURED_PROJECTS } from "@/lib/constants";
import s from "./FeaturedWork.module.css";

const CARD_COUNT = FEATURED_PROJECTS.length;
const ANGLE_STEP = 360 / CARD_COUNT;

/** Orbit radius — tighter so 3 cards visible */
function getRadius() {
  if (typeof window === "undefined") return 280;
  const w = window.innerWidth;
  if (w < 380) return 150;
  if (w < 480) return 180;
  if (w < 640) return 220;
  if (w < 768) return 260;
  if (w < 1024) return 320;
  if (w < 1280) return 380;
  return 420;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Apply depth-based brightness fading per card */
function applyDepthFade(
  cards: (HTMLAnchorElement | null)[],
  angle: number,
) {
  for (let j = 0; j < cards.length; j++) {
    const card = cards[j];
    if (!card) continue;
    const worldAngle = ((angle + j * ANGLE_STEP) % 360 + 360) % 360;
    const facing = Math.cos((worldAngle * Math.PI) / 180);
    const t = (facing + 1) / 2;
    const brightness = 0.3 + 0.7 * t;
    card.style.filter = `brightness(${brightness.toFixed(3)})`;
  }
}

export default function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLAnchorElement | null)[]>([]);
  const tweenRef = useRef<ReturnType<typeof import("gsap").gsap.to> | null>(null);
  const angleRef = useRef({ value: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const isPaused = useRef(false);

  /* data-rv reveal */
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
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Helper: restart infinite tween from current angle */
  const startInfiniteSpin = useCallback(() => {
    import("gsap").then(({ gsap }) => {
      tweenRef.current?.kill();
      const t = gsap.to(angleRef.current, {
        value: "-=" + 360,
        duration: 26,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          const ring = ringRef.current;
          if (!ring) return;
          ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;
          applyDepthFade(cardEls.current, angleRef.current.value);
          const raw = (-angleRef.current.value % 360 + 360) % 360;
          const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
          setActiveIdx(closest);
        },
      });
      tweenRef.current = t;
      if (isPaused.current) t.timeScale(0.12);
    });
  }, []);

  /* Place cards in orbit + start GSAP */
  useEffect(() => {
    async function init() {
      const { gsap } = await import("gsap");

      const ring = ringRef.current;
      if (!ring) return;

      const radius = getRadius();
      cardEls.current.forEach((card, i) => {
        if (!card) return;
        card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${radius}px)`;
      });

      angleRef.current.value = 0;
      applyDepthFade(cardEls.current, 0);

      tweenRef.current = gsap.to(angleRef.current, {
        value: -360,
        duration: 26,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          if (!ring) return;
          ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;
          applyDepthFade(cardEls.current, angleRef.current.value);
          const raw = (-angleRef.current.value % 360 + 360) % 360;
          const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
          setActiveIdx(closest);
        },
      });
    }

    init();

    function onResize() {
      const radius = getRadius();
      cardEls.current.forEach((card, i) => {
        if (!card) return;
        card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${radius}px)`;
      });
    }

    window.addEventListener("resize", onResize);
    return () => {
      tweenRef.current?.kill();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* Pause/resume on hover */
  const handleStageEnter = useCallback(() => {
    isPaused.current = true;
    tweenRef.current?.timeScale(0.12);
  }, []);

  const handleStageLeave = useCallback(() => {
    isPaused.current = false;
    tweenRef.current?.timeScale(1);
  }, []);

  /* Navigate to specific card */
  const goToCard = useCallback((idx: number) => {
    const targetAngle = -(idx * ANGLE_STEP);
    const current = angleRef.current.value % 360;
    let diff = targetAngle - current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const newVal = angleRef.current.value + diff;

    tweenRef.current?.kill();

    import("gsap").then(({ gsap }) => {
      gsap.to(angleRef.current, {
        value: newVal,
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => {
          const ring = ringRef.current;
          if (!ring) return;
          ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;
          applyDepthFade(cardEls.current, angleRef.current.value);
          setActiveIdx(idx);
        },
        onComplete: () => startInfiniteSpin(),
      });
    });
  }, [startInfiniteSpin]);

  /* Touch/drag */
  const dragData = useRef({ startX: 0, startAngle: 0, dragging: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragData.current = {
      startX: e.clientX,
      startAngle: angleRef.current.value,
      dragging: true,
    };
    tweenRef.current?.pause();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragData.current.dragging) return;
    const deltaX = e.clientX - dragData.current.startX;
    angleRef.current.value = dragData.current.startAngle + deltaX * 0.35;
    const ring = ringRef.current;
    if (ring) {
      ring.style.transform = `translate(-50%, -50%) rotateY(${angleRef.current.value}deg)`;
    }
    applyDepthFade(cardEls.current, angleRef.current.value);
    const raw = (-angleRef.current.value % 360 + 360) % 360;
    const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
    setActiveIdx(closest);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragData.current.dragging) return;
    dragData.current.dragging = false;
    const raw = (-angleRef.current.value % 360 + 360) % 360;
    const nearest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
    goToCard(nearest);
  }, [goToCard]);

  return (
    <section id="work" ref={sectionRef} className={s.section}>
      {/* Header */}
      <div className={s.header} data-rv="fade">
        <p className={s.label}>
          <span className={s.labelLine} aria-hidden="true" />
          Selected Work
          <span className={s.labelLine} aria-hidden="true" />
        </p>
        <h2 className={s.title}>
          Projects that speak{" "}
          <span className="grad-text">louder</span> than words
        </h2>
        <p className={s.subtitle}>
          Immersive 3D experiences we\u2019ve crafted for brands that demand extraordinary.
        </p>
      </div>

      {/* 3D Carousel Stage */}
      <div
        className={s.stage}
        onMouseEnter={handleStageEnter}
        onMouseLeave={handleStageLeave}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        <div className={s.ring} ref={ringRef}>
          {FEATURED_PROJECTS.map((project, i) => (
            <Link
              key={project.id}
              href={`/portfolio/${project.slug}`}
              className={`${s.card}${activeIdx === i ? ` ${s.active}` : ""}`}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              onClick={(e) => {
                if (activeIdx !== i) {
                  e.preventDefault();
                  goToCard(i);
                }
              }}
            >
              {/* 3D box edges — beveled for curvature */}
              <div className={s.edgeLeft} aria-hidden="true" />
              <div className={s.edgeRight} aria-hidden="true" />
              <div className={s.edgeTop} aria-hidden="true" />
              <div className={s.edgeBottom} aria-hidden="true" />
              <div className={s.cardBack} aria-hidden="true" />

              {/* Front face with curvature shadow + specular */}
              <div className={s.cardFront}>
                <div className={s.prismBorder} aria-hidden="true" />
                <div className={s.thumbnailWrap}>
                  <div className={s.placeholder}>
                    <span className={s.placeholderInner}>{project.title}</span>
                  </div>
                  {project.thumbnail && (
                    <Image
                      src={project.thumbnail}
                      alt={project.title}
                      fill
                      sizes="(max-width: 767px) 80vw, 460px"
                      className={s.thumbnail}
                      placeholder={project.blurDataURL ? "blur" : "empty"}
                      blurDataURL={project.blurDataURL}
                    />
                  )}
                  <span className={s.projectNum} aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <div className={s.thumbGradient} aria-hidden="true" />
                  <div className={s.info}>
                    <div className={s.cardTop}>
                      <span className={s.category}>{project.category}</span>
                      <span className={s.year}>{project.year}</span>
                    </div>
                    <h3 className={s.cardTitle}>{project.title}</h3>
                    <div className={s.tags}>
                      {project.tags.map((tag) => (
                        <span key={tag} className={s.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={s.glowLine} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active project label */}
      <div className={s.activeLabel}>
        <span className={s.activeName}>
          {FEATURED_PROJECTS[activeIdx]?.title}
        </span>
        <span className={s.activeCat}>
          {FEATURED_PROJECTS[activeIdx]?.category}
        </span>
      </div>

      {/* Dots */}
      <div className={s.dots}>
        {FEATURED_PROJECTS.map((_, i) => (
          <button
            key={i}
            className={`${s.dot}${activeIdx === i ? ` ${s.dotActive}` : ""}`}
            aria-label={`Go to project ${i + 1}`}
            onClick={() => goToCard(i)}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <div className={s.footer} data-rv="fade" data-d="2">
        <Link href="/portfolio" className={s.viewAll}>
          View All Projects{" "}
          <span className={s.viewAllCount}>(12+)</span>
          <span className={s.arrow}>→</span>
        </Link>
      </div>
    </section>
  );
}