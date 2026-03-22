"use client";

import { createContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SceneConfig } from "@/types";
import { SCENE_CONFIGS, DEFAULT_SCENE_CONFIG } from "@/lib/constants";

export const SceneContext = createContext<SceneConfig>(DEFAULT_SCENE_CONFIG);

export default function SceneProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const config = useMemo(() => {
    // Exact match first, then check parent paths (e.g. /portfolio/slug → /portfolio)
    if (SCENE_CONFIGS[pathname]) return SCENE_CONFIGS[pathname];

    const parentPath = "/" + pathname.split("/").filter(Boolean)[0];
    return SCENE_CONFIGS[parentPath] || DEFAULT_SCENE_CONFIG;
  }, [pathname]);

  return (
    <SceneContext value={config}>
      {children}
    </SceneContext>
  );
}
