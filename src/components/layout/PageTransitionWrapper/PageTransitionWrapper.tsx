"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, useEffect, type ReactNode, useContext } from "react";
import { isAlreadyLoaded } from "@/lib/preloaderState";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Must match the moment Preloader starts its clip-path exit (setTimeout 2000 + 400)
const PRELOADER_EXIT_AT = 2.4;

/**
 * Freeze routing context at mount-time so the exiting motion.div
 * never accidentally renders the NEW route's content.
 */
function FrozenRoute({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  if (!frozen) {
    return <>{children}</>;
  }

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

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
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: firstLoad
            ? { duration: 0, delay: PRELOADER_EXIT_AT }
            : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        }}
        exit={{
          opacity: 0,
          transition: { duration: 0.25 },
        }}
        onAnimationComplete={() => {
          isFirstMount.current = false;
        }}
      >
        <FrozenRoute>{children}</FrozenRoute>
      </motion.div>
    </AnimatePresence>
  );
}
