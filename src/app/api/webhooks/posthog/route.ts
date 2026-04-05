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
const EVENT_MAP: Record<string, string> = {
  $pageview: "page_open",
  $pageleave: "page_leave",
  scroll_depth: "scroll_depth",
  section_viewed: "section_view",
  "3d_interaction": "interaction_3d",
  click_phone: "click_phone",
  click_email: "click_email",
  click_cta: "click_cta",
  click_sitely_link: "click_sitely",
  form_interaction_started: "form_start",
  form_abandoned: "form_abandon",
  active_time_milestone: "active_time",
  demo_session_summary: "page_leave",
  demo_opened_from_campaign: "page_open",
};

// Engagement score weights per event type
const SCORE_WEIGHTS: Record<string, number> = {
  page_open: 1,
  scroll_depth: 1,
  section_view: 1,
  click_cta: 5,
  click_phone: 10,
  click_email: 8,
  form_start: 3,
  interaction_3d: 2,
  page_leave: 0,
  form_abandon: 0,
  click_sitely: 2,
  active_time: 1,
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
  const mappedType = EVENT_MAP[eventName];
  if (!mappedType) {
    return NextResponse.json({ ok: true, skipped: true });
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

  // Build extra JSONB — include useful PostHog properties
  const extra: Record<string, unknown> = {};
  if (properties.active_seconds != null) extra.active_seconds = properties.active_seconds;
  if (properties.seconds != null) extra.milestone_seconds = properties.seconds;
  if (properties.time_spent_seconds != null) extra.time_spent_seconds = properties.time_spent_seconds;
  if (properties.href) extra.href = properties.href;
  if (properties.text) extra.text = properties.text;
  if (properties.field) extra.field = properties.field;
  if (properties.$browser) extra.browser = properties.$browser;
  if (properties.$os) extra.os = properties.$os;
  if (properties.$device_type) extra.device_type = properties.$device_type;
  if (properties.$current_url) extra.current_url = properties.$current_url;
  if (properties.$referrer) extra.referrer_url = properties.$referrer;
  if (properties.utm_source) extra.utm_source = properties.utm_source;
  if (properties.utm_medium) extra.utm_medium = properties.utm_medium;
  if (properties.utm_campaign) extra.utm_campaign = properties.utm_campaign;

  // Idempotency: use PostHog's uuid to prevent duplicates
  const idempotencyKey =
    eventUuid ||
    (properties.$event_uuid as string) ||
    `ph_${demoId}_${eventName}_${timestamp || Date.now()}`;

  const supabase = createServiceRoleClient();

  // Insert into demo_events
  const { error: insertError } = await supabase.from("demo_events").insert({
    demo_id: demoId,
    event_type: mappedType,
    session_id: sessionId,
    idempotency_key: idempotencyKey,
    page_url: (properties.$current_url as string)?.slice(0, 2000) || null,
    referrer: (properties.$referrer as string)?.slice(0, 2000) || null,
    user_agent: (properties.$user_agent as string)?.slice(0, 500) || null,
    duration_ms: durationMs,
    scroll_depth: scrollDepth,
    section_name: sectionName,
    interaction_type: interactionType,
    ip_country: (properties.$geoip_country_code as string) || null,
    is_main_site: false,
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
