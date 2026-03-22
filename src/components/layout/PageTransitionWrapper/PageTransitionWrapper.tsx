"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, useEffect, type ReactNode } from "react";
import { isAlreadyLoaded } from "@/lib/preloaderState";

// Must match the moment Preloader starts its clip-path exit (setTimeout 2000 + 400)
const PRELOADER_EXIT_AT = 2.4;

export default function PageTransitionWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isFirstMount = useRef(true);
  const [hasPreloader, setHasPreloader] = useState(false);

  useEffect(() => {
    setHasPreloader(!isAlreadyLoaded());
  }, []);

  const firstLoad = isFirstMount.current && hasPreloader;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: firstLoad ? 0 : 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: firstLoad
            ? { duration: 0, delay: PRELOADER_EXIT_AT }
            : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
        }}
        exit={{
          opacity: 0,
          y: -10,
          transition: { duration: 0.25 },
        }}
        onAnimationComplete={() => {
          isFirstMount.current = false;
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
