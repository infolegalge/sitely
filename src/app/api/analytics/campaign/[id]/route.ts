import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { cacheGet, cacheSet, cacheKey } from "@/lib/api-cache";
import { NextRequest } from "next/server";
import { z } from "zod";

const UUIDParam = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const parsed = UUIDParam.safeParse(rawId);
  if (!parsed.success) {
    return Response.json({ error: "Invalid campaign ID" }, { status: 400 });
  }
  const id = parsed.data;

  const key = cacheKey(request);
  const cached = cacheGet(key);
  if (cached) return Response.json(cached);

  const supabase = createServiceRoleClient();

  const { data: campaign, error: campaignErr } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campaignErr || !campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Single RPC call replaces N+1 pattern (was fetching all events into memory)
  const { data: stats, error: statsErr } = await supabase.rpc("get_campaign_stats", {
    p_campaign_id: id,
  });

  if (statsErr) {
    console.error("get_campaign_stats:", statsErr);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }

  const result = { campaign, ...stats };
  cacheSet(key, result, 15_000);
  return Response.json(result);
}
