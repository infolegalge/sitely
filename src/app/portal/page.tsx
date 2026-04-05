import type { Metadata } from "next";
import PortalDashboard from "@/components/sections/portal/PortalDashboard/PortalDashboard";

export const metadata: Metadata = {
  title: "კლიენტის პორტალი — Sitely",
  description: "თქვენი პროექტის სტატუსი და დემო ვერსიები.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortalDashboard />;
}
