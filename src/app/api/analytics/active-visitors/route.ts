import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { cacheGet, cacheSet, cacheKey } from "@/lib/api-cache";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = cacheKey(request);
  const cached = cacheGet(key);
  if (cached) return Response.json(cached);

  const url = request.nextUrl;
  const minutes = Math.min(
    Math.max(parseInt(url.searchParams.get("minutes") || "5") || 5, 1),
    60
  );

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("get_active_visitors", {
    p_minutes: minutes,
  });

  if (error) {
    console.error("get_active_visitors:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  const result = data ?? { active_sessions: 0, active_demos: 0 };
  cacheSet(key, result, 5_000); // 5s TTL — real-time-ish data
  return Response.json(result);
}
