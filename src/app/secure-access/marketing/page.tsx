import type { Metadata } from "next";
import SectionProvider from "@/components/sections/cms/SectionProvider/SectionProvider";
import SectionPage from "@/components/sections/cms/SectionPage/SectionPage";

export const metadata: Metadata = {
  title: "მარკეტინგი 3 | CMS",
  robots: { index: false, follow: false },
};

export default function MarketingRoute() {
  return (
    <SectionProvider apiEndpoint="/api/marketing">
      <SectionPage title="მარკეტინგი 3" basePath="/secure-access/marketing" />
    </SectionProvider>
  );
}
