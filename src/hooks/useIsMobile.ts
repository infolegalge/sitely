"use client";

import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const isNarrow = window.innerWidth < 768;
      setIsMobile(hasCoarsePointer || isNarrow);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
