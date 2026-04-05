import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  const companyId = user.app_metadata?.company_id;

  if ((role !== "client" && role !== "super_admin") || !companyId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service role for data queries — RLS on companies doesn't allow client reads
  const db = createServiceRoleClient();

  // Fetch company info
  const { data: company } = await db
    .from("companies")
    .select("id, name, email, phone, status, category, created_at")
    .eq("id", companyId)
    .single();

  if (!company) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  // Fetch demos for this company
  const { data: demos } = await db
    .from("demos")
    .select("id, hash, status, created_at, expires_at, view_count, templates(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(20);

  const formattedDemos = (demos || []).map((d) => ({
    id: d.id,
    hash: d.hash,
    status: d.status,
    created_at: d.created_at,
    expires_at: d.expires_at,
    view_count: d.view_count,
    template_name: (d.templates as { name?: string } | null)?.name || null,
  }));

  return Response.json({ company, demos: formattedDemos });
}
