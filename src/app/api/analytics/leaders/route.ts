import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { validateDateRange } from "@/lib/validate-date-range";
import { cacheGet, cacheSet, cacheKey } from "@/lib/api-cache";
import { NextRequest } from "next/server";

const VALID_BEHAVIORS = new Set(["momentum", "time", "scroll", "cross_domain"]);

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = cacheKey(request);
  const cached = cacheGet(key);
  if (cached) return Response.json(cached);

  const url = request.nextUrl;
  const behavior = url.searchParams.get("behavior") || "momentum";
  if (!VALID_BEHAVIORS.has(behavior)) {
    return Response.json({ error: "Invalid behavior type" }, { status: 400 });
  }
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10") || 10, 1), 200);
  const tier = url.searchParams.get("tier");

  const dateResult = validateDateRange(
    url.searchParams.get("from"),
    url.searchParams.get("to")
  );

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("get_behavioral_leaders", {
    p_behavior: behavior,
    p_limit: limit,
    p_tier: tier ? parseInt(tier) : null,
    ...(dateResult.valid && dateResult.from && { p_from: dateResult.from }),
    ...(dateResult.valid && dateResult.to && { p_to: dateResult.to }),
  });

  if (error) {
    console.error("get_behavioral_leaders:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  const result = { leaders: data ?? [] };
  cacheSet(key, result);
  return Response.json(result);
}
