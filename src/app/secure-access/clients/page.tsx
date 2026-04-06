import type { Metadata } from "next";
import SectionProvider from "@/components/sections/cms/SectionProvider/SectionProvider";
import SectionPage from "@/components/sections/cms/SectionPage/SectionPage";

export const metadata: Metadata = {
  title: "კლიენტები | CMS",
  robots: { index: false, follow: false },
};

export default function ClientsRoute() {
  return (
    <SectionProvider apiEndpoint="/api/clients">
      <SectionPage title="კლიენტები 1" basePath="/secure-access/clients" />
    </SectionProvider>
  );
}
