import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CmsDashboard from "@/components/sections/auth/CmsDashboard/CmsDashboard";

export const metadata: Metadata = {
  title: "CMS Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/secure-access/login");
  }

  const nick = user.user_metadata?.nick ?? "Admin";

  return <CmsDashboard nick={nick} />;
}
