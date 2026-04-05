import type { Metadata } from "next";
import ProjectsPage from "@/components/sections/cms/ProjectsPage/ProjectsPage";

export const metadata: Metadata = {
  title: "პროექტები — CMS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProjectsPage />;
}
