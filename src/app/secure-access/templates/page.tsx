import type { Metadata } from "next";
import TemplatesPage from "@/components/sections/cms/TemplatesPage/TemplatesPage";

export const metadata: Metadata = {
  title: "შაბლონები — CMS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TemplatesPage />;
}
