import type { Metadata } from "next";
import { Suspense } from "react";
import OnboardForm from "@/components/sections/portal/OnboardForm/OnboardForm";

export const metadata: Metadata = {
  title: "მოითხოვეთ ვებსაიტი — Sitely",
  description: "შეავსეთ ფორმა და მიიღეთ წვდომა თქვენს პორტალზე.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <OnboardForm />
    </Suspense>
  );
}
