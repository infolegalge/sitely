import { createAnonClient } from "@/lib/supabase/server";
import { getClaimRateLimiter } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Rate limit: 10 lookups per IP per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limiter = getClaimRateLimiter();
  if (limiter) {
    const { success } = await limiter.limit(`by-ref:${ip}`);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const ref = request.nextUrl.searchParams.get("ref");

  if (!ref || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    return Response.json({ error: "Invalid ref" }, { status: 400 });
  }

  const supabase = createAnonClient();

  const { data } = await supabase
    .from("companies")
    .select("name, email, phone")
    .eq("secure_link_id", ref)
    .single();

  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
  });
}
