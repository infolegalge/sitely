import type { Metadata } from "next";
import NewTemplatePage from "@/components/sections/cms/NewTemplatePage/NewTemplatePage";

export const metadata: Metadata = {
  title: "ახალი შაბლონი — CMS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NewTemplatePage />;
}
