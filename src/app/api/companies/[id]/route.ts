import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { buildCompanyData, compileTemplate } from "@/lib/template-engine";
import { after } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return Response.json({ error: "Company not found" }, { status: 404 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowedFields = ["status", "notes", "last_contacted_at"];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const validStatuses = [
    "lead",
    "locked",
    "demo_ready",
    "contacted",
    "engaged",
    "converted",
    "dnc",
  ];
  if (updates.status && !validStatuses.includes(updates.status as string)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Auto-regenerate active demos in background when company data changes
  const dataFields = ["name", "phone", "email", "address", "website", "metadata"];
  const hasDataChange = dataFields.some((f) => f in updates);
  if (hasDataChange) {
    after(async () => {
      const bgClient = createServiceRoleClient();
      // Find active (non-expired) demos for this company
      const { data: demos } = await bgClient
        .from("demos")
        .select("id, hash, template_id")
        .eq("company_id", id)
        .not("status", "eq", "expired")
        .not("template_id", "is", null);

      if (!demos || demos.length === 0) return;

      // Fetch updated company data
      const { data: company } = await bgClient
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
      if (!company) return;

      for (const demo of demos) {
        const { data: tmpl } = await bgClient
          .from("templates")
          .select("html_content, fallback_images")
          .eq("id", demo.template_id)
          .single();
        if (!tmpl) continue;

        const companyData = buildCompanyData(company, tmpl.fallback_images || []);
        const newHtml = compileTemplate(tmpl.html_content, companyData);
        await bgClient
          .from("demos")
          .update({ html_snapshot: newHtml })
          .eq("id", demo.id);
      }
    });
  }

  return Response.json(data);
}
