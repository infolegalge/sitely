import type { Metadata } from "next";
import BatchDetailProvider from "@/components/sections/cms/BatchDetailProvider/BatchDetailProvider";
import BatchDetailPage from "@/components/sections/cms/BatchDetailPage/BatchDetailPage";

export const metadata: Metadata = {
  title: "მარკეტინგი 3 | CMS",
  robots: { index: false, follow: false },
};

export default async function MarketingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <BatchDetailProvider batchId={id}>
      <BatchDetailPage />
    </BatchDetailProvider>
  );
}
