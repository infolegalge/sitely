import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const status = url.searchParams.get("status");
  const campaign_id = url.searchParams.get("campaign_id");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const per_page = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") || "50")));

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("demos")
    .select(
      "id, hash, company_id, template_id, campaign_id, status, view_count, first_viewed_at, last_viewed_at, sent_at, expires_at, created_at, companies(name, email, phone, category)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (campaign_id) query = query.eq("campaign_id", campaign_id);

  const from = (page - 1) * per_page;
  query = query.range(from, from + per_page - 1);

  const { data, count, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data, total: count, page, per_page });
}
