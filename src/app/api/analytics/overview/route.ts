import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const [demosRes, eventsRes] = await Promise.all([
    supabase
      .from("demos")
      .select("status, view_count", { count: "exact" }),
    supabase
      .from("demo_events")
      .select("event_type"),
  ]);

  const demos = demosRes.data ?? [];
  const events = eventsRes.data ?? [];

  const totalSent = demos.length;
  const totalViewed = demos.filter((d) => (d.view_count ?? 0) > 0).length;

  const eventCounts: Record<string, number> = {};
  for (const e of events) {
    eventCounts[e.event_type] = (eventCounts[e.event_type] ?? 0) + 1;
  }

  const scrollComplete = eventCounts["scroll_100"] ?? 0;
  const ctaClicks =
    (eventCounts["click_cta"] ?? 0) +
    (eventCounts["click_phone"] ?? 0) +
    (eventCounts["click_email"] ?? 0);
  const formSubmits = eventCounts["form_submit"] ?? 0;

  return Response.json({
    funnel: {
      sent: totalSent,
      viewed: totalViewed,
      scrolled: scrollComplete,
      cta: ctaClicks,
      converted: formSubmits,
    },
    eventCounts,
  });
}
