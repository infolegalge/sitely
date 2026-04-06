import type { Metadata } from "next";
import SectionProvider from "@/components/sections/cms/SectionProvider/SectionProvider";
import SectionPage from "@/components/sections/cms/SectionPage/SectionPage";

export const metadata: Metadata = {
  title: "შეთავაზება 2 | CMS",
  robots: { index: false, follow: false },
};

export default function OffersRoute() {
  return (
    <SectionProvider apiEndpoint="/api/offers">
      <SectionPage title="შეთავაზება 2" basePath="/secure-access/offers" />
    </SectionProvider>
  );
}
