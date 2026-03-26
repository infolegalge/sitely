import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "super_admin") {
    return null;
  }

  return user;
}
