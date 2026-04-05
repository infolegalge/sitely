import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTrackingRateLimiter } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

/**
 * Resolves a company's secure_link_id to the most recent demo_id.
 * Used by the cross-domain receiver on sitely.ge.
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = getTrackingRateLimiter();
  if (limiter) {
    const { success } = await limiter.limit(`resolve:${ip}`);
    if (!success) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || ref.length < 10) {
    return Response.json({ error: "Missing ref" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Find the company by secure_link_id
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("id")
    .eq("secure_link_id", ref)
    .maybeSingle();

  if (companyErr) {
    console.error("resolve company lookup:", companyErr);
    return Response.json({ error: "Server error" }, { status: 500 });
  }

  if (!company) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Find the latest demo for this company
  const { data: demo, error: demoErr } = await supabase
    .from("demos")
    .select("id")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (demoErr) {
    console.error("resolve demo lookup:", demoErr);
    return Response.json({ error: "Server error" }, { status: 500 });
  }

  if (!demo) {
    return Response.json({ error: "No demo found" }, { status: 404 });
  }

  return Response.json({ demo_id: demo.id });
}
