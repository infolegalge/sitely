import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { company_id, action } = body;

  if (!company_id || typeof company_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(company_id)) {
    return Response.json({ error: "Invalid company_id" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (action === "toggle_favorite") {
    const { data, error } = await supabase.rpc("toggle_favorite", {
      p_company_id: company_id,
    });
    if (error) {
      return Response.json({ error: "Failed" }, { status: 500 });
    }
    return Response.json({ is_favorite: data });
  }

  if (action === "update_status") {
    const { sales_status, next_followup_at } = body;
    if (!sales_status) {
      return Response.json({ error: "Missing sales_status" }, { status: 400 });
    }
    const { error } = await supabase.rpc("update_sales_status", {
      p_company_id: company_id,
      p_sales_status: sales_status,
      p_next_followup: next_followup_at || null,
    });
    if (error) {
      return Response.json({ error: "Failed" }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
