import type { Metadata } from "next";
import AnalyticsPageWrapper from "@/components/sections/cms/AnalyticsPageWrapper/AnalyticsPageWrapper";

export const metadata: Metadata = {
  title: "ანალიტიკა | CMS",
  robots: { index: false, follow: false },
};

export default function AnalyticsRoute() {
  return <AnalyticsPageWrapper />;
}
