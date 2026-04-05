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

  // 1. Fetch batch info
  const { data: batch, error: bErr } = await supabase
    .from("batches")
    .select("id, name, description, status, template_id, created_at, updated_at, templates(name)")
    .eq("id", id)
    .single();

  if (bErr || !batch) {
    return Response.json({ error: "Batch not found" }, { status: 404 });
  }

  // 2. Fetch demos in this batch with company data
  const { data: demos } = await supabase
    .from("demos")
    .select("id, hash, company_id, status, view_count, first_viewed_at, last_viewed_at, companies(id, name, category, email, phone, sales_status, is_favorite)")
    .eq("batch_id", id);

  const demoList = demos || [];

  // 3. Fetch events for these demos
  const demoIds = demoList.map((d) => d.id);
  let events: { demo_id: string; event_type: string; scroll_depth: number | null; duration_ms: number | null }[] = [];
  if (demoIds.length > 0) {
    const { data: evts } = await supabase
      .from("demo_events")
      .select("demo_id, event_type, scroll_depth, duration_ms")
      .in("demo_id", demoIds);
    events = evts || [];
  }

  // 4. Build per-demo event aggregates
  const demoEvents = new Map<string, typeof events>();
  for (const e of events) {
    const arr = demoEvents.get(e.demo_id) || [];
    arr.push(e);
    demoEvents.set(e.demo_id, arr);
  }

  // 5. Build company list
  const companies = demoList.map((d) => {
    const cArr = d.companies as unknown as { id: string; name: string; category: string | null; email: string | null; phone: string | null; sales_status: string; is_favorite: boolean }[] | null;
    const c = cArr?.[0] ?? null;
    const evts = demoEvents.get(d.id) || [];

    const ctaTypes = new Set(["click_cta", "click_phone", "click_email"]);
    const cta_clicks = evts.filter((e) => ctaTypes.has(e.event_type)).length;
    const form_submits = evts.filter((e) => e.event_type === "form_submit").length;
    const max_scroll = Math.max(0, ...evts.map((e) => e.scroll_depth || 0));
    const pageLeaves = evts.filter((e) => e.event_type === "page_leave" && e.duration_ms);
    const avg_session_s = pageLeaves.length > 0
      ? Math.round(pageLeaves.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / pageLeaves.length / 100) / 10
      : null;

    return {
      company_id: c?.id || d.company_id,
      name: c?.name || "Unknown",
      category: c?.category || null,
      email: c?.email || null,
      phone: c?.phone || null,
      sales_status: c?.sales_status || "uncontacted",
      is_favorite: c?.is_favorite || false,
      demo_id: d.id,
      demo_hash: d.hash,
      demo_status: d.status,
      view_count: d.view_count,
      first_viewed_at: d.first_viewed_at,
      last_viewed_at: d.last_viewed_at,
      momentum_score: 0,
      alltime_score: 0,
      total_sessions: 0,
      total_active_s: 0,
      last_activity: d.last_viewed_at,
      visited_main_site: false,
      top_section: null,
      cta_clicks,
      form_submits,
      max_scroll,
      avg_session_s,
      portal_accessed: false,
    };
  });

  // 6. Build funnel
  const sent = demoList.length;
  const viewed = demoList.filter((d) => d.view_count > 0).length;
  const scrolled_50 = new Set(
    events.filter((e) => (e.scroll_depth || 0) >= 50).map((e) => e.demo_id)
  ).size;
  const cta_clicked = new Set(
    events
      .filter((e) => ["click_cta", "click_phone", "click_email"].includes(e.event_type))
      .map((e) => e.demo_id)
  ).size;
  const form_submitted = new Set(
    events.filter((e) => e.event_type === "form_submit").map((e) => e.demo_id)
  ).size;

  // 7. Build summary
  const viewedDemos = demoList.filter((d) => d.view_count > 0);
  const allSessions = events.filter((e) => e.event_type === "page_leave" && e.duration_ms);
  const avgSessionS = allSessions.length > 0
    ? Math.round(allSessions.reduce((s, e) => s + (e.duration_ms || 0), 0) / allSessions.length / 100) / 10
    : null;
  const allScrolls = events.filter((e) => e.scroll_depth != null).map((e) => e.scroll_depth!);
  const avgScroll = allScrolls.length > 0
    ? Math.round(allScrolls.reduce((s, v) => s + v, 0) / allScrolls.length * 10) / 10
    : null;

  const tplArr = batch.templates as unknown as { name: string }[] | null;
  const tpl = tplArr?.[0] ?? null;

  return Response.json({
    data: {
      batch: {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        status: batch.status,
        template_id: batch.template_id,
        template_name: tpl?.name || null,
        created_at: batch.created_at,
        updated_at: batch.updated_at,
      },
      summary: {
        total_demos: sent,
        total_sent: sent,
        viewed_count: viewed,
        avg_session_s: avgSessionS,
        avg_scroll_depth: avgScroll,
      },
      funnel: { sent, viewed, scrolled_50, cta_clicked, form_submitted },
      companies,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = createServiceRoleClient();

  // Unlink demos from this batch (don't delete demos)
  await supabase
    .from("demos")
    .update({ batch_id: null })
    .eq("batch_id", id);

  // Delete the batch
  const { error } = await supabase.from("batches").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
