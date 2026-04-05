import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { validateDateRange } from "@/lib/validate-date-range";
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
  const dateResult = validateDateRange(
    url.searchParams.get("from"),
    url.searchParams.get("to")
  );
  if (!dateResult.valid) {
    return Response.json({ error: dateResult.error }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("get_top_sections", {
    ...(dateResult.from && { p_from: dateResult.from }),
    ...(dateResult.to && { p_to: dateResult.to }),
    p_limit: 15,
  });

  if (error) {
    console.error("get_top_sections:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  const result = { sections: data ?? [] };
  cacheSet(key, result);
  return Response.json(result);
}
