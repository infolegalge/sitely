import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();

  const { data: projects, error } = await admin
    .from("projects")
    .select(`
      id, status, client_name, client_email, client_phone,
      created_at, updated_at,
      companies ( id, name, category, tier ),
      proposals ( id, status, snapshot )
    `)
    .not("status", "in", '("cancelled","lost")')
    .order("updated_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Attach unread message counts (admin unread = client messages not yet read by admin)
  const projectIds = (projects ?? []).map((p) => p.id);
  let unreadCounts: Record<string, number> = {};

  if (projectIds.length > 0) {
    const { data: unread } = await admin
      .from("messages")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("sender_role", "client")
      .eq("is_read", false);

    for (const row of unread ?? []) {
      unreadCounts[row.project_id] = (unreadCounts[row.project_id] ?? 0) + 1;
    }
  }

  const result = (projects ?? []).map((p) => ({
    ...p,
    unread_count: unreadCounts[p.id] ?? 0,
  }));

  return Response.json({ projects: result });
}
