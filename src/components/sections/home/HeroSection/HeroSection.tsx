"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { isAlreadyLoaded } from "@/lib/preloaderState";
import {
  playFullSequence,
} from "./heroSounds";
import s from "./HeroSection.module.css";

/* ─── Constants ─── */

const LINE_1 = "We Build Websites in Three";
const ACCENT_TEXT = "Dimensions";

// Must match Preloader timing
const PRELOADER_EXIT_AT = 2.2;


/* ─── Helpers ─── */

/** Deterministic "random" from index (avoids SSR mismatch) */
function seededRandom(index: number, seed: number): number {
  const x = Math.sin(index * 9301 + seed * 49297) * 49297;
  return x - Math.floor(x);
}

/** Map seed to range min..max */
function seededRange(index: number, seed: number, min: number, max: number) {
  return min + seededRandom(index, seed) * (max - min);
}

/* ─── Component ─── */

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const accentWrapRef = useRef<HTMLSpanElement>(null);
  const accentInnerRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const animDoneRef = useRef(false);
  const evaporateTimersRef = useRef<number[]>([]);

  // Collect char refs from the heading line
  const line1CharsRef = useRef<(HTMLSpanElement | null)[]>([]);
  // Collect char refs from the accent ("Dimensions")
  const accentCharsRef = useRef<(HTMLSpanElement | null)[]>([]);

  /** Ref callback factory */
  const setLine1Ref = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      line1CharsRef.current[index] = el;
    },
    [],
  );

  const setAccentRef = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      accentCharsRef.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    
    const isFirstVisit = !isAlreadyLoaded();
    const baseDelay = isFirstVisit ? PRELOADER_EXIT_AT : 0.15;
    const isMobile = window.innerWidth < 768;

    const l1Chars = line1CharsRef.current.filter(Boolean) as HTMLSpanElement[];
    const acChars = accentCharsRef.current.filter(Boolean) as HTMLSpanElement[];
    const allChars = [...l1Chars, ...acChars];

    const ctx = gsap.context(() => {
      if (isFirstVisit) {
        /* ===================================
           FIRST VISIT — "Shattered Glass Big Bang Reverse"
           =================================== */

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const spreadX = isMobile ? vw * 0.5 : vw * 0.6;
        const spreadY = isMobile ? vh * 0.4 : vh * 0.5;
        const spreadZ = isMobile ? 400 : 800;

        // Collect ALL hero elements that participate in the explosion
        const extraShards: HTMLElement[] = [];
        if (labelRef.current) extraShards.push(labelRef.current);
        if (subtitleRef.current) extraShards.push(subtitleRef.current);
        if (ctaRef.current) {
          extraShards.push(...(Array.from(ctaRef.current.children) as HTMLElement[]));
        }
        const allShards = [...allChars, ...extraShards];

        gsap.set(flashRef.current, { opacity: 0, scale: 0.3 });

        // ---- Scatter EVERYTHING into chaos ----
        allShards.forEach((shard, i) => {
          const isCharEl = i < allChars.length;
          if (isCharEl) shard.setAttribute("data-glass", "true");

          const spread = isCharEl ? 1 : 0.55;

          if (isMobile) {
            // Mobile: 2D-only scatter — no Z-axis, no rotationX/Y
            gsap.set(shard, {
              x: seededRange(i, 1, -spreadX * spread, spreadX * spread),
              y: seededRange(i, 2, -spreadY * spread, spreadY * spread),
              rotationZ: seededRange(i, 6, -60, 60),
              scale: seededRange(i, 7, 0.5, isCharEl ? 1.8 : 1.3),
              opacity: 0,
            });
          } else {
            gsap.set(shard, {
              x: seededRange(i, 1, -spreadX * spread, spreadX * spread),
              y: seededRange(i, 2, -spreadY * spread, spreadY * spread),
              z: seededRange(i, 3, -spreadZ * spread, spreadZ * spread),
              rotationX: seededRange(i, 4, -180, 180),
              rotationY: seededRange(i, 5, -180, 180),
              rotationZ: seededRange(i, 6, -90, 90),
              scale: seededRange(i, 7, 0.3, isCharEl ? 2.5 : 1.6),
              opacity: 0,
            });
          }
        });

        // "Dimensions" gradient off initially
        if (accentInnerRef.current) {
          accentInnerRef.current.setAttribute("data-ignited", "false");
        }

        // ---- BUILD TIMELINE ----
        const tl = gsap.timeline({ delay: baseDelay });

        // Launch entire soundscape at timeline start (all phases pre-scheduled)
        tl.add(() => playFullSequence(), 0);

        // Phase 0: Light flash
        tl.to(flashRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        })
        .to(flashRef.current, {
          opacity: 0,
          scale: 1.5,
          duration: 1.2,
          ease: "power2.in",
        }, "+=0.05");

        // Phase 1 + 2 SIMULTANEOUS: fade in WHILE assembling
        tl.to(allShards, {
          opacity: 1,
          duration: 0.4,
          stagger: { each: 0.008, from: "random" },
          ease: "none",
        }, 0);

        if (isMobile) {
          // Mobile: 2D assembly — no Z-axis resets
          tl.to(allShards, {
            x: 0,
            y: 0,
            rotationZ: 0,
            scale: 1,
            duration: 2.2,
            stagger: { each: 0.015, from: "random" },
            ease: "expo.out",
          }, 0);
        } else {
          tl.to(allShards, {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1,
            duration: 2.6,
            stagger: { each: 0.012, from: "random" },
            ease: "expo.out",
          }, 0);
        }

        // Phase 3: Cracks GROW (desktop only — expensive per-element filter tweens)
        if (!isMobile) {
          tl.add(() => {
            allChars.forEach((char) => {
              const crack = char.querySelector(`.${s.crack}`) as HTMLElement;
              if (crack) {
                gsap.to(crack, {
                  opacity: 1,
                  scale: 1.3,
                  duration: 1.0,
                  ease: "power2.in",
                });
              }
            });
          }, 3.0);
        }

        // Phase 4: Shards + Cracks EVAPORATE (desktop only — uses per-element filter:blur)
        if (!isMobile) {
          tl.add(() => {
            allChars.forEach((char, i) => {
              const shard = char.querySelector(`.${s.shard}`) as HTMLElement;
              const crack = char.querySelector(`.${s.crack}`) as HTMLElement;

              const stagger = seededRange(i, 99, 0, 0.5);
              const driftX = seededRange(i, 13, -15, 15);
              const riseY = seededRange(i, 10, -60, -160);
              const twistZ = seededRange(i, 11, -30, 30);

              // Dust particle CSS animation
              const timerId = window.setTimeout(() => {
                char.setAttribute("data-evaporate", "true");
              }, stagger * 1000);
              evaporateTimersRef.current.push(timerId);

              // Shard: rises + stretches + blurs + fades
              if (shard) {
                gsap.to(shard, {
                  y: riseY,
                  x: driftX,
                  rotationZ: twistZ,
                  scaleX: 0.6,
                  scaleY: 1.8,
                  opacity: 0,
                  filter: "blur(8px)",
                  duration: 1.4,
                  delay: stagger,
                  ease: "power1.in",
                });
              }

              // Crack: shatters apart
              if (crack) {
                gsap.to(crack, {
                  y: riseY * 0.6,
                  x: -driftX,
                  scaleX: 1.5,
                  scaleY: 0.4,
                  rotationZ: -twistZ * 1.5,
                  opacity: 0,
                  filter: "blur(6px)",
                  duration: 1.0,
                  delay: stagger + 0.1,
                  ease: "power2.in",
                });
              }
            });
          }, 4.0);
        } else {
          // Mobile: simple fade-out of shards/cracks without per-element blur
          tl.add(() => {
            allChars.forEach((char) => {
              const shard = char.querySelector(`.${s.shard}`) as HTMLElement;
              const crack = char.querySelector(`.${s.crack}`) as HTMLElement;
              if (shard) gsap.to(shard, { opacity: 0, duration: 0.6, ease: "power1.in" });
              if (crack) gsap.to(crack, { opacity: 0, duration: 0.4, ease: "power1.in" });
            });
          }, 2.8);
        }

        // Phase 5: Clean up
        const cleanupTime = isMobile ? 3.8 : 5.8;
        tl.add(() => {
          allChars.forEach((char) => {
            char.setAttribute("data-glass", "false");
            char.setAttribute("data-frost", "false");
            char.setAttribute("data-evaporate", "false");
          });
        }, cleanupTime);

        // Phase 6: "Dimensions" gradient ignites
        tl.add(() => {
          if (accentInnerRef.current) {
            accentInnerRef.current.textContent = ACCENT_TEXT;
            accentInnerRef.current.setAttribute("data-ignited", "true");
          }
          animDoneRef.current = true;
        }, cleanupTime + 0.1);
      } else {
        /* ===================================
           RETURN VISIT — ServicesHero-style entrance
           =================================== */
        const section = sectionRef.current;
        if (!section) return;

        if (accentInnerRef.current) {
          accentInnerRef.current.setAttribute("data-ignited", "true");
        }

        const tl = gsap.timeline({ delay: baseDelay, defaults: { ease: "power3.out" } });

        /* Label slide in with rotateX */
        if (labelRef.current) {
          gsap.set(labelRef.current, { opacity: 0, y: 30, rotateX: 40 });
          tl.to(labelRef.current, { opacity: 1, y: 0, rotateX: 0, duration: 0.8 }, 0.1);
        }

        /* Title words fly in from alternating depths */
        const wordEls = section.querySelectorAll(`.${s.word}`);
        const totalWords = wordEls.length;
        wordEls.forEach((word, i) => {
          const fromLeft = i % 2 === 0;
          gsap.set(word, {
            opacity: 0,
            x: fromLeft ? -60 : 60,
            y: 40,
            rotateY: fromLeft ? 25 : -25,
            rotateX: 15,
            scale: 0.85,
          });
          tl.to(word, {
            opacity: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.9,
          }, 0.15 + i * 0.08);
        });

        /* "Dimensions" accent flies in same style as last word */
        if (accentWrapRef.current) {
          const accentIdx = totalWords;
          const fromLeft = accentIdx % 2 === 0;
          gsap.set(accentWrapRef.current, {
            opacity: 0,
            x: fromLeft ? -60 : 60,
            y: 40,
            rotateY: fromLeft ? 25 : -25,
            rotateX: 15,
            scale: 0.85,
          });
          tl.to(accentWrapRef.current, {
            opacity: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.9,
          }, 0.15 + accentIdx * 0.08);
        }

        /* Subtitle fade up */
        if (subtitleRef.current) {
          gsap.set(subtitleRef.current, { opacity: 0, y: 30 });
          tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0.5);
        }

        /* CTA buttons scatter in like puzzle pieces */
        if (ctaRef.current) {
          const buttons = Array.from(ctaRef.current.children) as HTMLElement[];
          buttons.forEach((btn, i) => {
            const angle = (i - 0.5) * 30;
            gsap.set(btn, {
              opacity: 0,
              scale: 0.4,
              y: 50,
              x: (i - 0.5) * 40,
              rotation: angle,
            });
            tl.to(btn, {
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0,
              rotation: 0,
              duration: 0.6,
              ease: "back.out(1.7)",
            }, 0.65 + i * 0.06);
          });
        }
      }
    }, sectionRef);

    return () => {
      evaporateTimersRef.current.forEach((id) => window.clearTimeout(id));
      evaporateTimersRef.current = [];
      ctx.revert();
    };
  }, []);

  /* ─── Render helpers ─── */

  function renderWordChars(
    word: string,
    startIndex: number,
    isAccent: boolean,
  ) {
    return word.split("").map((ch, ci) => {
      const globalIdx = startIndex + ci;
      const refSetter = isAccent
        ? setAccentRef(ci)
        : setLine1Ref(globalIdx);
      const charClass = isAccent
        ? `${s.char} ${s.charAccent}`
        : s.char;

      return (
        <span key={`${ch}-${globalIdx}`} ref={refSetter} className={charClass}>
          <span className={s.shard} aria-hidden="true" />
          <span className={s.crack} aria-hidden="true" />
          {ch}
        </span>
      );
    });
  }

  const words = LINE_1.split(" ");
  let charIndex = 0;

  return (
    <div id="hero" ref={sectionRef} className={s.section}>
      {/* Explosion light flash */}
      <div ref={flashRef} className={s.flash} aria-hidden="true" />

      <span ref={labelRef} className={s.label}>
        WEB DEVELOPMENT STUDIO
      </span>

      <h1 ref={headingRef} className={s.heading}>
        {words.map((word, wi) => {
          const startIdx = charIndex;
          charIndex += word.length + 1;
          return (
            <span key={word + wi}>
              {wi > 0 && " "}
              <span className={s.word}>
                {renderWordChars(word, startIdx, false)}
              </span>
            </span>
          );
        })}{" "}
        <span ref={accentWrapRef} className={s.accent}>
          <span ref={accentInnerRef} className={s.accentInner} data-ignited="false">
            {renderWordChars(ACCENT_TEXT, 0, true)}
          </span>
        </span>
      </h1>

      <p ref={subtitleRef} className={s.subtitle}>
        3D visuals. Smooth animations. Immersive pages.
      </p>

      <div ref={ctaRef} className={s.ctaGroup}>
        <Link href="/portfolio" className={`grad-primary ${s.ctaPrimary}`}>
          See Our Work
        </Link>
        <Link href="/contact" className={s.ctaSecondary}>
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
