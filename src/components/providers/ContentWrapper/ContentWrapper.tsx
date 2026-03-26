"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import PageTransitionWrapper from "@/components/layout/PageTransitionWrapper/PageTransitionWrapper";

export default function ContentWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/secure-access")) {
    return <main id="main">{children}</main>;
  }

  return (
    <PageTransitionWrapper>
      <main id="main">{children}</main>
    </PageTransitionWrapper>
  );
}
