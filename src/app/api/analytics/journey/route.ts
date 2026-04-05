import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const companyId = url.searchParams.get("company_id");
  if (!companyId) {
    return Response.json({ error: "Missing company_id" }, { status: 400 });
  }

  const limit = Math.min(parseInt(url.searchParams.get("limit") || "500"), 1000);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);
  const notesLimit = Math.min(parseInt(url.searchParams.get("notes_limit") || "100"), 500);
  const notesOffset = Math.max(parseInt(url.searchParams.get("notes_offset") || "0"), 0);

  const supabase = createServiceRoleClient();
  const [journeyRes, notesRes] = await Promise.all([
    supabase.rpc("get_lead_journey", {
      p_company_id: companyId,
      p_limit: limit,
      p_offset: offset,
    }),
    supabase.rpc("get_lead_notes", {
      p_company_id: companyId,
      p_limit: notesLimit,
      p_offset: notesOffset,
    }),
  ]);

  if (journeyRes.error) {
    console.error("get_lead_journey:", journeyRes.error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  if (notesRes.error) {
    console.error("get_lead_notes:", notesRes.error);
  }

  return Response.json({
    journey: journeyRes.data ?? [],
    notes: notesRes.data ?? [],
  });
}
