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
    .select("id, name, description, status, template_id, section, created_at, updated_at, templates(name)")
    .eq("id", id)
    .single();

  if (bErr || !batch) {
    return Response.json({ error: "Batch not found" }, { status: 404 });
  }

  // 2. Fetch demos in this batch with company data
  const { data: demos } = await supabase
    .from("demos")
    .select("id, hash, company_id, status, view_count, first_viewed_at, last_viewed_at, companies(id, name, category, categories, source_category, email, phone, website, address, rating, reviews_count, tier, tier_label, score, sales_status, is_favorite, status, yell_id, gm_place_id, created_at)")
    .eq("batch_id", id);

  const demoList = demos || [];

  // 3. Fetch events for these demos
  const demoIds = demoList.map((d) => d.id);
  const companyIds = [...new Set(demoList.map((d) => d.company_id).filter(Boolean))] as string[];
  let events: { demo_id: string; event_type: string; scroll_depth: number | null; duration_ms: number | null; session_id: string | null; extra: Record<string, unknown> | null; created_at: string; is_main_site: boolean }[] = [];
  if (demoIds.length > 0) {
    const { data: evts } = await supabase
      .from("demo_events")
      .select("demo_id, event_type, scroll_depth, duration_ms, session_id, extra, created_at, is_main_site")
      .in("demo_id", demoIds)
      .order("created_at", { ascending: false });
    events = evts || [];
  }

  // 3b. Fetch company_lead_scores for real momentum/alltime scores
  type LeadScore = { company_id: string; momentum_score: number; alltime_score: number; total_sessions: number; total_active_s: number; visited_main_site: boolean; top_section: string | null; last_activity: string | null };
  const scoresMap = new Map<string, LeadScore>();
  if (companyIds.length > 0) {
    const { data: scores } = await supabase
      .from("company_lead_scores")
      .select("company_id, momentum_score, alltime_score, total_sessions, total_active_s, visited_main_site, top_section, last_activity")
      .in("company_id", companyIds);
    for (const s of scores || []) {
      scoresMap.set(s.company_id, s as LeadScore);
    }
  }

  // 3c. Check portal access + proposal details per company
  const portalSet = new Set<string>();
  const proposalMap = new Map<string, string>(); // company_id → proposal status
  type ProposalDetail = { status: string; snapshot: { price: number; currency: string; title: string; included: string[]; excluded: string[]; notes?: string }; payment_method: string | null; paid_at: string | null; expires_at: string | null; created_at: string };
  const proposalDetailsMap = new Map<string, ProposalDetail[]>(); // company_id → all proposals
  if (companyIds.length > 0) {
    const { data: portalRows } = await supabase
      .from("projects")
      .select("company_id, client_user_id, proposals(status, snapshot, payment_method, paid_at, expires_at, created_at)")
      .in("company_id", companyIds);
    for (const r of (portalRows || []) as { company_id: string; client_user_id: string | null; proposals: ProposalDetail[] | null }[]) {
      if (r.client_user_id) portalSet.add(r.company_id);
      const proposals = r.proposals || [];
      for (const p of proposals) {
        const existing = proposalMap.get(r.company_id);
        if (p.status === "accepted" || !existing) {
          proposalMap.set(r.company_id, p.status);
        } else if (p.status === "rejected" && existing === "pending") {
          proposalMap.set(r.company_id, p.status);
        }
      }
      if (proposals.length > 0) {
        const prev = proposalDetailsMap.get(r.company_id) || [];
        proposalDetailsMap.set(r.company_id, [...prev, ...proposals]);
      }
    }
  }

  // 3d. Fetch ALL demos for these companies (across all batches) to build send history
  type PrevSend = { demo_id: string; demo_hash: string; batch_id: string | null; batch_name: string | null; batch_section: string | null; template_name: string | null; demo_status: string; view_count: number; created_at: string };
  const prevSendsMap = new Map<string, PrevSend[]>();
  if (companyIds.length > 0) {
    const { data: allDemos } = await supabase
      .from("demos")
      .select("id, hash, company_id, batch_id, status, view_count, created_at, batches(name, section), templates(name)")
      .in("company_id", companyIds)
      .neq("batch_id", id)
      .order("created_at", { ascending: false });
    for (const d of allDemos || []) {
      if (!d.company_id) continue;
      const arr = prevSendsMap.get(d.company_id) || [];
      const batchInfo = d.batches as unknown as { name: string; section: string | null } | null;
      const tplInfo = d.templates as unknown as { name: string } | null;
      arr.push({
        demo_id: d.id,
        demo_hash: d.hash,
        batch_id: d.batch_id,
        batch_name: batchInfo?.name || null,
        batch_section: batchInfo?.section || null,
        template_name: tplInfo?.name || null,
        demo_status: d.status,
        view_count: d.view_count,
        created_at: d.created_at,
      });
      prevSendsMap.set(d.company_id, arr);
    }
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
    const c = d.companies as unknown as { id: string; name: string; category: string | null; categories: string[] | null; source_category: string | null; email: string | null; phone: string | null; website: string | null; address: string | null; rating: number | null; reviews_count: number | null; tier: string | null; tier_label: string | null; score: number | null; sales_status: string; is_favorite: boolean; status: string | null; yell_id: string | null; gm_place_id: string | null; created_at: string | null } | null;
    const evts = demoEvents.get(d.id) || [];
    const cls = scoresMap.get(d.company_id);

    const ctaTypes = new Set(["click_cta", "click_phone", "click_email"]);
    const cta_clicks = evts.filter((e) => ctaTypes.has(e.event_type)).length;
    const form_submits = evts.filter((e) => e.event_type === "form_submit").length;
    const max_scroll = Math.max(0, ...evts.map((e) => e.scroll_depth || 0));
    const pageLeaves = evts.filter((e) => e.event_type === "page_leave" && e.duration_ms);
    const avg_session_s = pageLeaves.length > 0
      ? Math.round(pageLeaves.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / pageLeaves.length / 100) / 10
      : null;
    const sessions = new Set(evts.filter((e) => e.session_id).map((e) => e.session_id)).size;
    const totalActiveS = pageLeaves.reduce((sum, e) => {
      const extra = e.extra as Record<string, unknown> | null;
      return sum + (Number(extra?.total_active_seconds) || Number(extra?.active_seconds) || 0);
    }, 0);

    return {
      company_id: c?.id || d.company_id,
      name: c?.name || "Unknown",
      category: c?.category || null,
      categories: c?.categories || null,
      source_category: c?.source_category || null,
      email: c?.email || null,
      phone: c?.phone || null,
      website: c?.website || null,
      address: c?.address || null,
      rating: c?.rating || null,
      reviews_count: c?.reviews_count || null,
      tier: c?.tier || null,
      tier_label: c?.tier_label || null,
      priority_score: c?.score || null,
      company_status: c?.status || null,
      sales_status: c?.sales_status || "uncontacted",
      is_favorite: c?.is_favorite || false,
      yell_id: c?.yell_id || null,
      gm_place_id: c?.gm_place_id || null,
      company_created_at: c?.created_at || null,
      demo_id: d.id,
      demo_hash: d.hash,
      demo_status: d.status,
      view_count: d.view_count,
      first_viewed_at: d.first_viewed_at,
      last_viewed_at: d.last_viewed_at,
      momentum_score: cls?.momentum_score ?? 0,
      alltime_score: cls?.alltime_score ?? 0,
      total_sessions: cls?.total_sessions ?? sessions,
      total_active_s: cls?.total_active_s || totalActiveS,
      last_activity: cls?.last_activity ?? d.last_viewed_at,
      visited_main_site: cls?.visited_main_site || evts.some((e) => e.is_main_site || e.event_type === "click_sitely"),
      top_section: cls?.top_section ?? null,
      cta_clicks,
      form_submits,
      max_scroll,
      avg_session_s,
      portal_accessed: portalSet.has(c?.id || d.company_id),
      proposal_status: proposalMap.get(c?.id || d.company_id) || null,
      proposals: (proposalDetailsMap.get(c?.id || d.company_id) || []).map((p) => ({
        status: p.status,
        title: p.snapshot?.title || "",
        price: p.snapshot?.price ?? 0,
        currency: p.snapshot?.currency || "GEL",
        included: p.snapshot?.included || [],
        excluded: p.snapshot?.excluded || [],
        notes: p.snapshot?.notes || null,
        payment_method: p.payment_method,
        paid_at: p.paid_at,
        expires_at: p.expires_at,
        created_at: p.created_at,
      })),
      events: evts.map((e) => ({
        event_type: e.event_type,
        scroll_depth: e.scroll_depth,
        duration_ms: e.duration_ms,
        session_id: e.session_id,
        extra: e.extra,
        created_at: e.created_at,
      })),
      send_count: 1 + (prevSendsMap.get(c?.id || d.company_id)?.length || 0),
      previous_sends: prevSendsMap.get(c?.id || d.company_id) || [],
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

  const tpl = batch.templates as unknown as { name: string } | null;

  return Response.json({
    data: {
      batch: {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        status: batch.status,
        template_id: batch.template_id,
        template_name: tpl?.name || null,
        section: batch.section || null,
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
