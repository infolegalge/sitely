import type { Metadata } from "next";
import GeneratePage from "@/components/sections/cms/GeneratePage/GeneratePage";

export const metadata: Metadata = {
  title: "დემოების გენერაცია — CMS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GeneratePage />;
}
