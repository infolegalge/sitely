import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const VALID_EVENTS = new Set([
  "page_open",
  "page_leave",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "time_10s",
  "time_30s",
  "time_60s",
  "time_180s",
  "time_300s",
  "click_phone",
  "click_email",
  "click_cta",
  "click_sitely",
  "form_submit",
]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    demo_id,
    event_type,
    session_id,
    page_url,
    referrer,
    user_agent,
    duration_ms,
    scroll_depth,
    extra,
  } = body as {
    demo_id?: string;
    hash?: string;
    event_type?: string;
    session_id?: string;
    page_url?: string;
    referrer?: string;
    user_agent?: string;
    duration_ms?: number;
    scroll_depth?: number;
    extra?: Record<string, unknown>;
  };

  if (!demo_id || !event_type || !VALID_EVENTS.has(event_type)) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("demo_events").insert({
    demo_id,
    event_type,
    session_id: session_id || null,
    page_url: typeof page_url === "string" ? page_url.slice(0, 2000) : null,
    referrer: typeof referrer === "string" ? referrer.slice(0, 2000) : null,
    user_agent: typeof user_agent === "string" ? user_agent.slice(0, 500) : null,
    duration_ms: typeof duration_ms === "number" ? duration_ms : null,
    scroll_depth: typeof scroll_depth === "number" ? scroll_depth : null,
    extra: extra && typeof extra === "object" ? extra : null,
  });

  if (error) {
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
