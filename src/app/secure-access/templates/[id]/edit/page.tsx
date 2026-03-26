import type { Metadata } from "next";
import EditTemplatePage from "@/components/sections/cms/EditTemplatePage/EditTemplatePage";

export const metadata: Metadata = {
  title: "შაბლონის რედაქტირება — CMS",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EditTemplatePage templateId={id} />;
}
