"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function HideOnCms({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/secure-access") || pathname.startsWith("/portal")) return null;
  return <>{children}</>;
}
