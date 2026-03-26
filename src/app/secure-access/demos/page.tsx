import type { Metadata } from "next";
import DemosPage from "@/components/sections/cms/DemosPage/DemosPage";

export const metadata: Metadata = {
  title: "დემოები | CMS",
  robots: { index: false, follow: false },
};

export default function DemosRoute() {
  return <DemosPage />;
}
