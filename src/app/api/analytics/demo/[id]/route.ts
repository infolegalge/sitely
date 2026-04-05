import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { z } from "zod";

const UUIDParam = z.string().uuid();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const parsed = UUIDParam.safeParse(rawId);
  if (!parsed.success) {
    return Response.json({ error: "Invalid demo ID" }, { status: 400 });
  }
  const id = parsed.data;
  const supabase = createServiceRoleClient();

  const { data: demo, error: demoErr } = await supabase
    .from("demos")
    .select("id, hash, status, view_count, first_viewed_at, last_viewed_at, created_at, expires_at, company_id, template_id, campaign_id")
    .eq("id", id)
    .single();

  if (demoErr || !demo) {
    return Response.json({ error: "Demo not found" }, { status: 404 });
  }

  const [companyRes, eventsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("name, email, phone, category")
      .eq("id", demo.company_id)
      .single(),
    supabase
      .from("demo_events")
      .select("id, event_type, metadata, created_at")
      .eq("demo_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return Response.json({
    demo,
    company: companyRes.data,
    events: eventsRes.data ?? [],
  });
}
