import type { Metadata } from "next";
import QueuePage from "@/components/sections/cms/QueuePage/QueuePage";

export const metadata: Metadata = {
  title: "Queue — CMS",
  robots: { index: false, follow: false },
};

export default function QueueRoute() {
  return <QueuePage />;
}
