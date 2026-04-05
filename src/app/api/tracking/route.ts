import { createServiceRoleClient } from "@/lib/supabase/server";
import { isBot } from "@/lib/bot-filter";
import { getTrackingRateLimiter } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { z } from "zod";

/* ── Error codes for structured responses ── */
const ERR = {
  RATE_LIMITED: { code: "E429", msg: "Rate limit exceeded" },
  INVALID_JSON: { code: "E001", msg: "Invalid JSON body" },
  INVALID_PAYLOAD: { code: "E002", msg: "Payload validation failed" },
  EXTRA_TOO_LARGE: { code: "E003", msg: "Extra data exceeds 4KB" },
  SERVER_ERROR: { code: "E500", msg: "Internal server error" },
} as const;

/* ── CORS headers ── */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.TRACKING_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/* ── Engagement event weights (used for scoring) ── */
const ENGAGEMENT_WEIGHTS: Record<string, number> = {
  scroll_25: 1,
  scroll_50: 2,
  scroll_75: 3,
  scroll_100: 5,
  time_10s: 1,
  time_30s: 2,
  time_60s: 4,
  time_180s: 8,
  time_300s: 12,
  active_time_10s: 1,
  active_time_30s: 2,
  active_time_60s: 4,
  active_time_180s: 8,
  active_time_300s: 12,
  click_phone: 15,
  click_email: 15,
  click_cta: 20,
  click_sitely: 10,
  form_submit: 50,
  form_start: 3,
  section_view: 2,
  interaction_3d: 5,
  web_vital: 0,
};

const ENGAGEMENT_EVENTS = new Set(Object.keys(ENGAGEMENT_WEIGHTS));

const MAX_EXTRA_BYTES = 4096;

/* ── Validate extra field: max depth 2, max 4KB ── */
function validateExtra(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  const json = JSON.stringify(obj);
  if (json.length > MAX_EXTRA_BYTES) return false;
  // Check max nesting depth of 2
  function checkDepth(v: unknown, depth: number): boolean {
    if (depth > 2) return false;
    if (typeof v === "object" && v !== null) {
      for (const val of Object.values(v)) {
        if (!checkDepth(val, depth + 1)) return false;
      }
    }
    return true;
  }
  return checkDepth(obj, 0);
}

const EventSchema = z.object({
  event_type: z.enum([
    "page_open", "page_leave",
    "scroll_25", "scroll_50", "scroll_75", "scroll_100",
    "time_10s", "time_30s", "time_60s", "time_180s", "time_300s",
    "active_time_10s", "active_time_30s", "active_time_60s", "active_time_180s", "active_time_300s",
    "click_phone", "click_email", "click_cta", "click_sitely", "form_submit",
    "section_view", "interaction_3d",
    "form_start", "form_abandon", "rage_click",
    "web_vital", "js_error",
  ]),
  demo_id: z.union([z.string(), z.number()]).transform(String),
  hash: z.string().optional(),
  session_id: z.string().uuid().optional(),
  idempotency_key: z.string().max(128).optional(),
  page_url: z.string().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  user_agent: z.string().max(500).optional(),
  duration_ms: z.number().int().min(0).max(600000).optional(),
  scroll_depth: z.number().min(0).max(100).optional(),
  section_name: z.string().max(100).nullish(),
  interaction_type: z.string().max(50).nullish(),
  is_main_site: z.boolean().optional(),
  extra: z.record(z.string(), z.unknown()).optional().refine(
    (v) => validateExtra(v),
    { message: "Extra data exceeds 4KB or nesting depth > 2" }
  ),
});

const BatchSchema = z.object({
  events: z.array(EventSchema).min(1).max(50),
});

/* ── CORS preflight ── */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = getTrackingRateLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ip);
    if (!success) {
      return Response.json(ERR.RATE_LIMITED, { status: 429, headers: CORS_HEADERS });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(ERR.INVALID_JSON, { status: 400, headers: CORS_HEADERS });
  }

  // Determine if batch or single event (backward compatibility)
  let events: z.infer<typeof EventSchema>[];

  const raw = body as Record<string, unknown>;
  if (Array.isArray(raw.events)) {
    const parsed = BatchSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { ...ERR.INVALID_PAYLOAD, details: parsed.error.issues },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    events = parsed.data.events;
  } else {
    const parsed = EventSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { ...ERR.INVALID_PAYLOAD, details: parsed.error.issues },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    events = [parsed.data];
  }

  // Bot filtering — use request header UA (authoritative, not spoofable via event payload)
  const requestUa = request.headers.get("user-agent") || "";
  const ua = requestUa || events[0]?.user_agent || "";
  if (isBot(ua)) {
    // Silently accept but don't store — bots shouldn't know they're filtered
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const supabase = createServiceRoleClient();

  // Extract geo data from Vercel/Cloudflare headers
  const ipCountry =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;

  // Build rows for batch insert
  const rows = events.map((ev) => ({
    demo_id: ev.demo_id,
    event_type: ev.event_type,
    session_id: ev.session_id || null,
    idempotency_key: ev.idempotency_key || null,
    page_url: ev.page_url || null,
    referrer: ev.referrer || null,
    user_agent: ev.user_agent || ua,
    duration_ms: ev.duration_ms ?? null,
    scroll_depth: ev.scroll_depth ?? null,
    section_name: ev.section_name || null,
    interaction_type: ev.interaction_type || null,
    is_main_site: ev.is_main_site ?? false,
    ip_country: ipCountry,
    extra: ev.extra || null,
  }));

  // Use upsert with ignoreDuplicates to silently skip events with duplicate idempotency_key
  const { error } = await supabase
    .from("demo_events")
    .insert(rows);

  if (error) {
    // 23505 = unique_violation (duplicate idempotency_key) — silently ignore
    if (error.code === "23505") {
      // Duplicate event — expected, not an error
    } else {
      console.error("tracking insert error:", error);
      return Response.json(ERR.SERVER_ERROR, { status: 500, headers: CORS_HEADERS });
    }
  }

  // Weighted engagement scoring for qualifying events
  const demoScores = new Map<string, number>();
  for (const ev of events) {
    const weight = ENGAGEMENT_WEIGHTS[ev.event_type];
    if (weight) {
      demoScores.set(ev.demo_id, (demoScores.get(ev.demo_id) || 0) + weight);
    }
  }

  if (demoScores.size > 0) {
    for (const [demoId, score] of demoScores) {
      try {
        const { error: rpcErr } = await supabase.rpc("increment_engagement_score_weighted", {
          p_demo_id: String(demoId),
          p_score: score,
        });
        if (rpcErr) console.error("engagement score RPC error:", rpcErr);
      } catch (err) {
        console.error("engagement score RPC exception:", err);
      }
    }
  }

  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
