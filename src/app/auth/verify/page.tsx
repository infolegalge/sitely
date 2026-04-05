import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyLanding from "@/components/sections/portal/VerifyLanding/VerifyLanding";

export const metadata: Metadata = {
  title: "შესვლა — Sitely",
  description: "გააქტიურეთ თქვენი სესია.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <VerifyLanding />
    </Suspense>
  );
}
