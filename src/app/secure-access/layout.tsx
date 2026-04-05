import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CmsShell from "@/components/sections/auth/CmsShell/CmsShell";
import QueryProvider from "@/components/providers/QueryProvider/QueryProvider";

export default async function SecureAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page doesn't need the CMS shell
  if (!user) {
    return <>{children}</>;
  }

  // Verify super_admin role via app_metadata (server-controlled, not user-editable)
  if (user.app_metadata?.role !== "super_admin") {
    await supabase.auth.signOut();
    redirect("/secure-access/login");
  }

  return (
    <QueryProvider>
      <CmsShell email={user.email ?? ""}>{children}</CmsShell>
    </QueryProvider>
  );
}
