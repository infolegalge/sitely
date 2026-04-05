import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use app_metadata (server-controlled) instead of user_metadata (user-editable)
  if (!user || user.app_metadata?.role !== "super_admin") {
    return null;
  }

  return user;
}

export async function verifyClient() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = user.app_metadata?.role;
  if (role !== "client" && role !== "super_admin") return null;

  return user;
}
