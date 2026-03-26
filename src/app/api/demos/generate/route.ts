import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { buildCompanyData, compileTemplate } from "@/lib/template-engine";
import { NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, company_ids, campaign_id, expires_days = 30 } = body as {
    template_id?: string;
    company_ids?: string[];
    campaign_id?: string;
    expires_days?: number;
  };

  if (!template_id || !Array.isArray(company_ids) || company_ids.length === 0) {
    return Response.json(
      { error: "template_id and company_ids[] are required" },
      { status: 400 }
    );
  }

  if (company_ids.length > 500) {
    return Response.json(
      { error: "Maximum 500 companies per batch" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // Fetch template
  const { data: template, error: tErr } = await supabase
    .from("templates")
    .select("id, html_content, fallback_images")
    .eq("id", template_id)
    .single();

  if (tErr || !template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  // Fetch companies
  const { data: companies, error: cErr } = await supabase
    .from("companies")
    .select("*")
    .in("id", company_ids);

  if (cErr || !companies) {
    return Response.json({ error: "Companies not found" }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_days);

  // Generate demos
  const demos = companies.map((company) => {
    const hash = crypto.randomBytes(12).toString("base64url");
    const companyData = buildCompanyData(company, template.fallback_images || []);
    const htmlSnapshot = compileTemplate(template.html_content, companyData);

    return {
      hash,
      company_id: company.id,
      template_id: template.id,
      campaign_id: campaign_id || null,
      status: "generated" as const,
      html_snapshot: htmlSnapshot,
      expires_at: expiresAt.toISOString(),
    };
  });

  // Batch insert
  const { data: inserted, error: iErr } = await supabase
    .from("demos")
    .insert(demos)
    .select("id, hash, company_id");

  if (iErr) {
    return Response.json({ error: iErr.message }, { status: 500 });
  }

  // Update company statuses to 'demo_generated'
  await supabase
    .from("companies")
    .update({ status: "demo_generated" })
    .in("id", company_ids);

  return Response.json({
    generated: inserted?.length || 0,
    demos: inserted?.map((d) => ({
      id: d.id,
      hash: d.hash,
      company_id: d.company_id,
      url: `/demo/${d.hash}`,
    })),
  });
}
