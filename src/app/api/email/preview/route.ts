import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { buildCompanyData, compileTemplate } from "@/lib/template-engine";

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const templateId = typeof body.template_id === "string" ? body.template_id : "";
  const companyId = typeof body.company_id === "string" ? body.company_id : "";

  if (!templateId || !companyId) {
    return Response.json({ error: "template_id and company_id required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const [templateRes, companyRes] = await Promise.all([
    supabase.from("templates").select("html_content, fallback_images").eq("id", templateId).single(),
    supabase.from("companies").select("*").eq("id", companyId).single(),
  ]);

  if (!templateRes.data) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }
  if (!companyRes.data) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  const companyData = buildCompanyData(companyRes.data, templateRes.data.fallback_images || []);
  const html = compileTemplate(templateRes.data.html_content, companyData);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
