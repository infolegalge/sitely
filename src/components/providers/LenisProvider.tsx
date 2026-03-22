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

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafCallbackRef = useRef<((time: number) => void) | null>(null);
  const pathname = usePathname();

  useEffect(() => {
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
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      ScrollTrigger.refresh();
    }
  }, [pathname, lenis]);

  return (
    <LenisContext value={lenis}>
      {children}
    </LenisContext>
  );
}
