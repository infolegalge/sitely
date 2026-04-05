import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("get_company_stats");

  if (error) {
    console.error("get_company_stats:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }

  return Response.json(data);
}
