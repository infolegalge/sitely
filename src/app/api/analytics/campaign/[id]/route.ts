import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: campaign, error: campaignErr } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campaignErr || !campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: demos } = await supabase
    .from("demos")
    .select("id, status, view_count, first_viewed_at")
    .eq("campaign_id", id);

  const demosList = demos ?? [];
  const totalSent = demosList.length;
  const totalViewed = demosList.filter((d) => (d.view_count ?? 0) > 0).length;

  const demoIds = demosList.map((d) => d.id);

  let eventCounts: Record<string, number> = {};
  if (demoIds.length > 0) {
    const { data: events } = await supabase
      .from("demo_events")
      .select("event_type")
      .in("demo_id", demoIds);

    for (const e of events ?? []) {
      eventCounts[e.event_type] = (eventCounts[e.event_type] ?? 0) + 1;
    }
  }

  return Response.json({
    campaign,
    stats: {
      sent: totalSent,
      viewed: totalViewed,
      scrollComplete: eventCounts["scroll_100"] ?? 0,
      ctaClicks:
        (eventCounts["click_cta"] ?? 0) +
        (eventCounts["click_phone"] ?? 0) +
        (eventCounts["click_email"] ?? 0),
      formSubmits: eventCounts["form_submit"] ?? 0,
    },
    eventCounts,
  });
}
