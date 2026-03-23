"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FEATURED_PROJECTS } from "@/lib/constants";
import s from "./FeaturedWork.module.css";

const CARD_COUNT = FEATURED_PROJECTS.length;
const ANGLE_STEP = 360 / CARD_COUNT;

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

/** Depth-based brightness: front=1.0, sides=~0.6, back=~0.28 */
function applyDepthFade(
  cards: (HTMLAnchorElement | null)[],
  ringAngle: number,
) {
  for (let j = 0; j < cards.length; j++) {
    const card = cards[j];
    if (!card) continue;
    const world = ((ringAngle + j * ANGLE_STEP) % 360 + 360) % 360;
    const facing = Math.cos((world * Math.PI) / 180);
    const t = (facing + 1) / 2;
    const brightness = 0.28 + 0.72 * t;
    card.style.filter = `brightness(${brightness.toFixed(3)})`;
  }
}

function updateRing(
  ring: HTMLDivElement | null,
  cards: (HTMLAnchorElement | null)[],
  angle: number,
  setActive: (i: number) => void,
) {
  if (!ring) return;
  ring.style.transform = `translate(-50%, -50%) rotateY(${angle}deg)`;
  applyDepthFade(cards, angle);
  const raw = (-angle % 360 + 360) % 360;
  const closest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
  setActive(closest);
}

export default function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLAnchorElement | null)[]>([]);
  const tweenRef = useRef<ReturnType<typeof import("gsap").gsap.to> | null>(null);
  const angleRef = useRef({ value: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const hasEnteredRef = useRef(false);
  const entranceDoneRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);

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

  /* Start continuous slow spin (counterclockwise) */
  const startIdleSpin = useCallback(() => {
    import("gsap").then(({ gsap }) => {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(angleRef.current, {
        value: "-=" + 360,
        duration: 28,
        ease: "none",
        repeat: -1,
        onUpdate: () =>
          updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx),
      });
    });
  }, []);

  /* Place cards + scroll entrance */
  useEffect(() => {
    const ring = ringRef.current;
    const stage = stageRef.current;
    if (!ring || !stage) return;

    const radius = getRadius();
    cardEls.current.forEach((card, i) => {
      if (!card) return;
      card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${radius}px)`;
    });
    angleRef.current.value = 0;
    applyDepthFade(cardEls.current, 0);

    /* Scroll entrance: fast spin → slow-motion deceleration */
    const entranceObs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasEnteredRef.current) return;
        hasEnteredRef.current = true;
        entranceObs.disconnect();

        import("gsap").then(({ gsap }) => {
          /* Fast entrance: 540° in 2s, power3.out = dramatic decel */
          tweenRef.current = gsap.to(angleRef.current, {
            value: -540,
            duration: 2.4,
            ease: "power3.out",
            onUpdate: () =>
              updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx),
            onComplete: () => {
              entranceDoneRef.current = true;
              startIdleSpin();
            },
          });
        });
      },
      { threshold: 0.2 },
    );
    entranceObs.observe(stage);

    function onResize() {
      const r = getRadius();
      cardEls.current.forEach((card, i) => {
        if (!card) return;
        card.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${r}px)`;
      });
    }

    window.addEventListener("resize", onResize);
    return () => {
      tweenRef.current?.kill();
      entranceObs.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [startIdleSpin]);

  /* Hover pause/resume (only after entrance, not during drag) */
  const handleStageEnter = useCallback(() => {
    isHoveringRef.current = true;
    if (!entranceDoneRef.current || isDraggingRef.current) return;
    tweenRef.current?.timeScale(0.15);
  }, []);

  const handleStageLeave = useCallback(() => {
    isHoveringRef.current = false;
    if (!entranceDoneRef.current) return;
    tweenRef.current?.timeScale(1);
  }, []);

  /* Navigate to card + restart idle after */
  const goToCard = useCallback((idx: number) => {
    const targetAngle = -(idx * ANGLE_STEP);
    const current = angleRef.current.value % 360;
    let diff = targetAngle - current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const newVal = angleRef.current.value + diff;

    tweenRef.current?.kill();

    import("gsap").then(({ gsap }) => {
      tweenRef.current = gsap.to(angleRef.current, {
        value: newVal,
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => {
          updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx);
        },
        onComplete: () => {
          isDraggingRef.current = false;
          startIdleSpin();
          if (isHoveringRef.current) {
            tweenRef.current?.timeScale(0.15);
          }
        },
      });
    });
  }, [startIdleSpin]);

  /* ── Drag with EMA velocity + momentum fling ── */
  const dragRef = useRef({
    active: false,
    startX: 0,
    startAngle: 0,
    prevX: 0,
    prevTime: 0,
    velocity: 0,
    hasMoved: false,
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    /* Kill ALL running animations immediately */
    tweenRef.current?.kill();
    tweenRef.current = null;
    isDraggingRef.current = true;

    const now = performance.now();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startAngle: angleRef.current.value,
      prevX: e.clientX,
      prevTime: now,
      velocity: 0,
      hasMoved: false,
    };
    /* Capture on the stage so we get events even outside cards */
    stageRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const now = performance.now();
    const dx = e.clientX - d.prevX;
    const dt = now - d.prevTime;
    const totalDx = e.clientX - d.startX;

    /* Mark as real drag once past threshold */
    if (Math.abs(totalDx) > 4) d.hasMoved = true;

    /* EMA velocity (degrees per ms) — ignore stale frames */
    if (dt > 0 && dt < 100) {
      const instantVel = (dx * 0.45) / dt;
      d.velocity = d.velocity * 0.6 + instantVel * 0.4;
    }
    d.prevX = e.clientX;
    d.prevTime = now;

    angleRef.current.value = d.startAngle + totalDx * 0.45;
    updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx);
  }, []);

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;

    /* If user paused before releasing, velocity is stale */
    const now = performance.now();
    if (now - d.prevTime > 80) d.velocity = 0;

    const vel = d.velocity;
    const abv = Math.abs(vel);

    /* Common: snap to angle, then resume idle + apply hover if needed */
    const snapAndResume = (finalAngle: number, dur: number, ease: string) => {
      import("gsap").then(({ gsap }) => {
        tweenRef.current = gsap.to(angleRef.current, {
          value: finalAngle,
          duration: dur,
          ease,
          onUpdate: () =>
            updateRing(ringRef.current, cardEls.current, angleRef.current.value, setActiveIdx),
          onComplete: () => {
            isDraggingRef.current = false;
            startIdleSpin();
            if (isHoveringRef.current) {
              tweenRef.current?.timeScale(0.15);
            }
          },
        });
      });
    };

    /* Fast fling: add momentum then snap */
    if (abv > 0.08) {
      const flingDeg = vel * 500;
      const targetAngle = angleRef.current.value + flingDeg;
      const raw = (-targetAngle % 360 + 360) % 360;
      const nearest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
      const snapAngle = -(nearest * ANGLE_STEP);
      const current = targetAngle % 360;
      let diff = snapAngle - current;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      snapAndResume(targetAngle + diff, Math.min(2.0, 0.5 + abv * 3), "power3.out");
    } else {
      /* Slow release: snap to nearest card */
      const raw = (-angleRef.current.value % 360 + 360) % 360;
      const nearest = Math.round(raw / ANGLE_STEP) % CARD_COUNT;
      const snapAngle = -(nearest * ANGLE_STEP);
      const current = angleRef.current.value % 360;
      let diff = snapAngle - current;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      snapAndResume(angleRef.current.value + diff, 0.7, "power2.out");
    }
  }, [startIdleSpin]);

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
        ref={stageRef}
        className={s.stage}
        onMouseEnter={handleStageEnter}
        onMouseLeave={handleStageLeave}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragStart={(e) => e.preventDefault()}
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
              draggable={false}
              onClick={(e) => {
                if (dragRef.current.hasMoved) {
                  e.preventDefault();
                  dragRef.current.hasMoved = false;
                  return;
                }
                if (activeIdx !== i) {
                  e.preventDefault();
                  goToCard(i);
                }
              }}
            >
              {/* 3D box edges — true 90° with rim lighting */}
              <div className={s.edgeLeft} aria-hidden="true" />
              <div className={s.edgeRight} aria-hidden="true" />
              <div className={s.edgeTop} aria-hidden="true" />
              <div className={s.edgeBottom} aria-hidden="true" />
              <div className={s.cardBack} aria-hidden="true" />

              {/* Front face — curvature shadow + specular */}
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
                      draggable={false}
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