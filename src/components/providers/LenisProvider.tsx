"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

export const LenisContext = createContext<Lenis | null>(null);

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafCallbackRef = useRef<((time: number) => void) | null>(null);
  const pathname = usePathname();

  const isCmsRoute =
    pathname.startsWith("/secure-access") || pathname.startsWith("/portal");

  useEffect(() => {
    // Skip Lenis on touch/mobile — native inertial scrolling is better
    if (isTouchDevice()) return;
    // Skip Lenis on CMS/portal routes — they use overflow:auto on a child div,
    // not window scroll. Lenis intercepts wheel events globally and blocks scrolling.
    if (isCmsRoute) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    // Store same reference so remove() works
    const tickerCallback = (time: number) => instance.raf(time * 1000);
    rafCallbackRef.current = tickerCallback;

    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);

    return () => {
      gsap.ticker.remove(tickerCallback);
      instance.destroy();
      setLenis(null);
      rafCallbackRef.current = null;
    };
  }, [isCmsRoute]);

  // Route change: scroll to top after exit, refresh after full transition
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    // Scroll to 0 after exit animation (250ms) — new page is at opacity 0
    const scrollTimer = setTimeout(() => {
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }, 300);

    // Refresh ScrollTrigger after full transition settles
    // (250ms exit + 400ms enter + buffer)
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 800);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(refreshTimer);
    };
  }, [pathname, lenis]);

  return (
    <LenisContext value={lenis}>
      {children}
    </LenisContext>
  );
}
