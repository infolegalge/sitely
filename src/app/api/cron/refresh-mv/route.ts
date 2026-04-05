import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("refresh_session_summaries");

  if (error) {
    console.error("MV refresh failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, refreshed_at: new Date().toISOString() });
}
