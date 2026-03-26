import type { Metadata } from "next";
import DemoTimelinePage from "@/components/sections/cms/DemoTimelinePage/DemoTimelinePage";

export const metadata: Metadata = {
  title: "დემოს დეტალები | CMS",
  robots: { index: false, follow: false },
};

export default async function DemoDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DemoTimelinePage demoId={id} />;
}
