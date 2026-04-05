import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: campaigns, error } = await supabase
    .from("email_campaigns")
    .select("id, name, subject, status, total_recipients, sent_count, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ campaigns: campaigns || [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, action } = body;

  if (!id || !action) {
    return Response.json({ error: "id and action required" }, { status: 400 });
  }

  if (action !== "cancel" && action !== "pause") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const newStatus = action === "cancel" ? "cancelled" : "paused";

  const { data, error } = await supabase
    .from("email_campaigns")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("status", "sending")
    .select("id, status")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Campaign not found or not in sending state" }, { status: 404 });
  }

  return Response.json({ campaign: data });
}
