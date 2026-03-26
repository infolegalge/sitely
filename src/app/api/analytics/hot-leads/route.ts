import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

  const supabase = createServiceRoleClient();

  // Get all demos with view data
  const { data: demos } = await supabase
    .from("demos")
    .select("id, company_id, view_count, first_viewed_at, last_viewed_at, status")
    .gt("view_count", 0);

  if (!demos || demos.length === 0) {
    return Response.json({ leads: [] });
  }

  // Get events grouped by demo
  const demoIds = demos.map((d) => d.id);
  const { data: events } = await supabase
    .from("demo_events")
    .select("demo_id, event_type")
    .in("demo_id", demoIds);

  // Calculate engagement scores
  const eventsByDemo: Record<string, Record<string, number>> = {};
  for (const e of events ?? []) {
    if (!eventsByDemo[e.demo_id]) eventsByDemo[e.demo_id] = {};
    eventsByDemo[e.demo_id][e.event_type] =
      (eventsByDemo[e.demo_id][e.event_type] ?? 0) + 1;
  }

  const scored = demos.map((demo) => {
    const ec = eventsByDemo[demo.id] ?? {};
    const score =
      (demo.view_count ?? 0) * 1 +
      (ec["scroll_100"] ?? 0) * 3 +
      (ec["time_60s"] ?? 0) * 2 +
      (ec["click_cta"] ?? 0) * 10 +
      (ec["form_submit"] ?? 0) * 20;

    return {
      demo_id: demo.id,
      company_id: demo.company_id,
      view_count: demo.view_count,
      first_viewed_at: demo.first_viewed_at,
      last_viewed_at: demo.last_viewed_at,
      status: demo.status,
      score,
      events: ec,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topLeads = scored.slice(0, limit);

  // Fetch company info
  const companyIds = [...new Set(topLeads.map((l) => l.company_id))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, email, phone, category")
    .in("id", companyIds);

  const companyMap = new Map(
    (companies ?? []).map((c) => [c.id, c])
  );

  const leads = topLeads.map((l) => ({
    ...l,
    company: companyMap.get(l.company_id) ?? null,
  }));

  return Response.json({ leads });
}
