import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("get_hot_leads", { p_limit: limit });

  if (error) {
    console.error("get_hot_leads:", error);
    return Response.json({ error: "Failed to fetch hot leads" }, { status: 500 });
  }

  return Response.json({ leads: data ?? [] });
}
