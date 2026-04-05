import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { validateDateRange } from "@/lib/validate-date-range";
import { cacheGet, cacheSet, cacheKey } from "@/lib/api-cache";
import { NextRequest } from "next/server";

/* Simple UA parser — no external deps needed */
function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/MSIE|Trident/i.test(ua)) return "IE";
  return "სხვა";
}

function parseOS(ua: string): string {
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  return "სხვა";
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = cacheKey(request);
  const cached = cacheGet(key);
  if (cached) return Response.json(cached);

  const url = request.nextUrl;
  const dateResult = validateDateRange(
    url.searchParams.get("from"),
    url.searchParams.get("to")
  );
  if (!dateResult.valid) {
    return Response.json({ error: dateResult.error }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("demo_events")
    .select("user_agent, session_id")
    .not("user_agent", "is", null)
    .eq("event_type", "page_open");

  if (dateResult.from) query = query.gte("created_at", dateResult.from);
  if (dateResult.to) query = query.lte("created_at", dateResult.to);

  const { data, error } = await query.limit(5000);

  if (error) {
    console.error("browser_breakdown:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  /* Aggregate by browser and OS */
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();

  for (const row of data ?? []) {
    const ua = row.user_agent ?? "";
    const browser = parseBrowser(ua);
    const os = parseOS(ua);
    browserMap.set(browser, (browserMap.get(browser) ?? 0) + 1);
    osMap.set(os, (osMap.get(os) ?? 0) + 1);
  }

  const browsers = [...browserMap.entries()]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  const os = [...osMap.entries()]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  const result = { browsers, os };
  cacheSet(key, result);
  return Response.json(result);
}
