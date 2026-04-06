import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * PostHog Webhook → Supabase Bridge
 *
 * Receives PostHog webhook events and writes critical ones to `demo_events`
 * so the CMS dashboard, engagement scoring, and Inngest jobs keep working.
 *
 * PostHog sends: { event, properties, distinct_id, timestamp, ... }
 */

// Map PostHog event names → demo_events event_type
// Note: scroll_depth and active_time_milestone are handled dynamically below
const EVENT_MAP: Record<string, string> = {
  $pageview: "page_open",
  $pageleave: "page_leave",
  scroll_depth: "__scroll_dynamic__",
  section_viewed: "section_view",
  "3d_interaction": "interaction_3d",
  click_phone: "click_phone",
  click_email: "click_email",
  click_cta: "click_cta",
  click_sitely_link: "click_sitely",
  form_interaction_started: "form_start",
  form_submit: "form_submit",
  form_abandoned: "form_abandon",
  active_time_milestone: "__active_time_dynamic__",
  demo_session_summary: "page_leave",
  demo_opened_from_campaign: "page_open",
};

// Engagement score weights per event type
const SCORE_WEIGHTS: Record<string, number> = {
  page_open: 1,
  scroll_25: 1,
  scroll_50: 2,
  scroll_75: 3,
  scroll_100: 5,
  section_view: 2,
  click_cta: 20,
  click_phone: 15,
  click_email: 15,
  form_start: 3,
  form_submit: 50,
  interaction_3d: 5,
  page_leave: 0,
  form_abandon: 0,
  click_sitely: 10,
  active_time_10s: 1,
  active_time_30s: 2,
  active_time_60s: 4,
  active_time_180s: 8,
  active_time_300s: 12,
};

export async function POST(request: NextRequest) {
  // Verify the webhook is from PostHog (check shared secret)
  const webhookSecret = request.headers.get("x-posthog-webhook-secret");
  if (webhookSecret !== process.env.POSTHOG_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // PostHog HTTP Webhook sends a nested structure:
  // { event: { uuid, event, properties, timestamp, ... }, person: {...}, ... }
  // Extract the actual event data from whichever format arrives
  let eventName: string | undefined;
  let properties: Record<string, unknown> = {};
  let timestamp: string | undefined;
  let eventUuid: string | undefined;

  if (typeof body.event === "object" && body.event !== null) {
    // Standard PostHog webhook payload (nested structure)
    const eventObj = body.event as Record<string, unknown>;
    eventName = eventObj.event as string | undefined;
    timestamp = eventObj.timestamp as string | undefined;
    eventUuid = eventObj.uuid as string | undefined;

    if (typeof eventObj.properties === "string") {
      try { properties = JSON.parse(eventObj.properties); } catch { properties = {}; }
    } else {
      properties = (eventObj.properties || {}) as Record<string, unknown>;
    }
  } else {
    // Flat format (direct POST or simple template)
    eventName = body.event as string | undefined;
    timestamp = body.timestamp as string | undefined;
    eventUuid = body.uuid as string | undefined;

    if (typeof body.properties === "string") {
      try { properties = JSON.parse(body.properties); } catch { properties = {}; }
    } else {
      properties = (body.properties || {}) as Record<string, unknown>;
    }
  }

  if (!eventName) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  // Only process events we care about
  let mappedType = EVENT_MAP[eventName];
  if (!mappedType) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Dynamic mapping: scroll_depth → scroll_25/50/75/100
  if (mappedType === "__scroll_dynamic__") {
    const depth = Number(properties.depth_percent) || 0;
    if (depth >= 100) mappedType = "scroll_100";
    else if (depth >= 75) mappedType = "scroll_75";
    else if (depth >= 50) mappedType = "scroll_50";
    else if (depth >= 25) mappedType = "scroll_25";
    else return NextResponse.json({ ok: true, skipped: true });
  }

  // Dynamic mapping: active_time_milestone → active_time_10s/30s/60s/180s/300s
  if (mappedType === "__active_time_dynamic__") {
    const seconds = Number(properties.seconds) || 0;
    const validMilestones = [300, 180, 60, 30, 10];
    const milestone = validMilestones.find((m) => seconds >= m);
    if (milestone) mappedType = `active_time_${milestone}s`;
    else return NextResponse.json({ ok: true, skipped: true });
  }

  // Extract demo_id from registered properties
  const demoId = (properties.demo_id || properties.$group_0) as string | undefined;
  if (!demoId) {
    // Not a demo page event — skip (e.g. main site pageview)
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Build demo_events row
  const scrollDepth =
    properties.depth_percent != null
      ? Number(properties.depth_percent)
      : properties.max_scroll != null
        ? Number(properties.max_scroll)
        : null;

  const durationMs =
    properties.total_duration_ms != null
      ? Number(properties.total_duration_ms)
      : null;

  const sectionName =
    (properties.section_name as string) || null;

  const interactionType =
    (properties.type as string) ||
    (properties.interaction_type as string) ||
    null;

  const sessionId =
    (properties.$session_id as string) ||
    (properties.distinct_id as string) ||
    null;

  // Build extra JSONB — structure must match what dashboard SQL expects
  const extra: Record<string, unknown> = {};
  if (properties.active_seconds != null) extra.total_active_seconds = properties.active_seconds;
  if (properties.seconds != null) extra.milestone_seconds = properties.seconds;
  if (properties.time_spent_seconds != null) extra.duration_s = properties.time_spent_seconds;
  if (properties.href) extra.href = properties.href;
  if (properties.text) extra.text = properties.text;
  if (properties.field) extra.field = properties.field;

  // Device info — dashboard reads extra->'device'->>'device_type'
  const deviceType = properties.$device_type as string | undefined;
  const browser = properties.$browser as string | undefined;
  const os = properties.$os as string | undefined;
  if (deviceType || browser || os) {
    extra.device = {
      ...(deviceType ? { device_type: deviceType } : {}),
      ...(browser ? { browser } : {}),
      ...(os ? { os } : {}),
    };
  }

  // UTM params — dashboard reads extra->'utm'->>'utm_source'
  const utmSource = properties.utm_source as string | undefined;
  const utmMedium = properties.utm_medium as string | undefined;
  const utmCampaign = properties.utm_campaign as string | undefined;
  if (utmSource || utmMedium || utmCampaign) {
    extra.utm = {
      ...(utmSource ? { utm_source: utmSource } : {}),
      ...(utmMedium ? { utm_medium: utmMedium } : {}),
      ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
    };
  }

  if (properties.$current_url) extra.current_url = properties.$current_url;
  if (properties.$referrer) extra.referrer_url = properties.$referrer;

  // Idempotency: use PostHog's uuid to prevent duplicates
  const idempotencyKey =
    eventUuid ||
    (properties.$event_uuid as string) ||
    `ph_${demoId}_${eventName}_${timestamp || Date.now()}`;

  const supabase = createServiceRoleClient();

  // Detect main-site visit: if user has demo_id cookie but is browsing
  // a non-demo URL, this is a main-site visit by a demo viewer
  const currentUrl = (properties.$current_url as string) || "";
  const isMainSite = !!currentUrl && !currentUrl.includes("/demo/");

  // Insert into demo_events
  const { error: insertError } = await supabase.from("demo_events").insert({
    demo_id: demoId,
    event_type: mappedType,
    session_id: sessionId,
    idempotency_key: idempotencyKey,
    page_url: currentUrl.slice(0, 2000) || null,
    referrer: (properties.$referrer as string)?.slice(0, 2000) || null,
    user_agent: (properties.$user_agent as string)?.slice(0, 500) || null,
    duration_ms: durationMs,
    scroll_depth: scrollDepth,
    section_name: sectionName,
    interaction_type: interactionType,
    ip_country: (properties.$geoip_country_code as string) || null,
    is_main_site: isMainSite,
    extra: Object.keys(extra).length > 0 ? extra : null,
    ...(timestamp ? { created_at: timestamp } : {}),
  });

  if (insertError) {
    // Idempotency conflict is expected — not an error
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[PostHog Webhook] Insert error:", insertError);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  // Update engagement score for high-value events
  const weight = SCORE_WEIGHTS[mappedType] || 0;
  if (weight > 0) {
    await supabase.rpc("increment_engagement_score_weighted", {
      p_demo_id: demoId,
      p_score: weight,
    });
  }

  return NextResponse.json({ ok: true, event_type: mappedType });
}
