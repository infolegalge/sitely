import type { Metadata } from "next";
import PortalLogin from "@/components/sections/portal/PortalLogin/PortalLogin";

export const metadata: Metadata = {
  title: "კაბინეტში შესვლა — Sitely",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortalLogin />;
}
