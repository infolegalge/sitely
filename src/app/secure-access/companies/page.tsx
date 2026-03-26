import type { Metadata } from "next";
import CompaniesPage from "@/components/sections/cms/CompaniesPage/CompaniesPage";

export const metadata: Metadata = {
  title: "კომპანიები — CMS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CompaniesPage />;
}
