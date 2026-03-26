import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // All count queries are head-only (no row transfer)
  const [totalRes, emailRes, noWebsiteRes] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .not("email", "is", null),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .or("website.is.null,website.eq."),
  ]);

  // Tier and status counts — paginate to get all rows
  const tierCounts: Record<number, number> = {};
  const statusCounts: Record<string, number> = {};
  let from = 0;
  const step = 1000;
  let done = false;

  while (!done) {
    const { data } = await supabase
      .from("companies")
      .select("tier, status")
      .range(from, from + step - 1);

    if (!data || data.length === 0) {
      done = true;
      break;
    }

    for (const row of data) {
      if (row.tier != null) tierCounts[row.tier] = (tierCounts[row.tier] || 0) + 1;
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
    }

    if (data.length < step) done = true;
    from += step;
  }

  return Response.json({
    total: totalRes.count ?? 0,
    with_email: emailRes.count ?? 0,
    without_website: noWebsiteRes.count ?? 0,
    by_tier: Object.entries(tierCounts)
      .map(([tier, count]) => ({ tier: parseInt(tier), count }))
      .sort((a, b) => a.tier - b.tier),
    by_status: Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  });
}
