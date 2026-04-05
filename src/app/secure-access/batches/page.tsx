import type { Metadata } from "next";
import BatchesProvider from "@/components/sections/cms/BatchesProvider/BatchesProvider";
import BatchesPage from "@/components/sections/cms/BatchesPage/BatchesPage";

export const metadata: Metadata = {
  title: "ბაჩები | CMS",
  robots: { index: false, follow: false },
};

export default function BatchesRoute() {
  return (
    <BatchesProvider>
      <BatchesPage />
    </BatchesProvider>
  );
}
