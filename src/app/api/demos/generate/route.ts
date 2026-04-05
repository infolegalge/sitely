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
  const {
    template_id,
    company_ids,
    campaign_id,
    expires_days = 30,
    offer_draft,
    custom_email_text,
    batch_name,
    batch_id: existing_batch_id,
  } = body as {
    template_id?: string;
    company_ids?: string[];
    campaign_id?: string;
    expires_days?: number;
    offer_draft?: Record<string, unknown>;
    custom_email_text?: string;
    batch_name?: string;
    batch_id?: string;
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

  if (cErr || !companies || companies.length === 0) {
    return Response.json({ error: "Companies not found" }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_days);

  // ── Resolve or create batch ──
  let batchId: string | null = existing_batch_id || null;

  if (!batchId && batch_name) {
    const { data: newBatch, error: batchErr } = await supabase
      .from("batches")
      .insert({
        name: batch_name.trim().slice(0, 200),
        template_id: template.id,
      })
      .select("id")
      .single();

    if (batchErr) {
      return Response.json({ error: `Batch creation failed: ${batchErr.message}` }, { status: 500 });
    }
    batchId = newBatch.id;
  }

  // Generate demos synchronously
  const demosToInsert = companies.map((company) => {
    const hash = crypto.randomBytes(12).toString("base64url");
    const companyData = buildCompanyData(company, template.fallback_images || []);
    const htmlSnapshot = compileTemplate(template.html_content, companyData);

    const row: Record<string, unknown> = {
      hash,
      company_id: company.id,
      template_id: template.id,
      campaign_id: campaign_id || null,
      batch_id: batchId,
      status: "generated" as const,
      html_snapshot: htmlSnapshot,
      expires_at: expiresAt.toISOString(),
    };
    if (offer_draft) row.offer_draft = offer_draft;
    if (custom_email_text?.trim()) row.custom_email_text = custom_email_text.slice(0, 5000);
    return row;
  });

  const { data: inserted, error: insertErr } = await supabase
    .from("demos")
    .insert(demosToInsert)
    .select("id, hash");

  if (insertErr) {
    return Response.json({ error: insertErr.message }, { status: 500 });
  }

  // Update company statuses to demo_ready
  await supabase
    .from("companies")
    .update({ status: "demo_ready" })
    .in("id", companies.map((c) => c.id));

  const demos = (inserted || []).map((d) => ({
    id: d.id,
    url: `/demo/${d.hash}`,
  }));

  return Response.json({
    queued: false,
    count: demos.length,
    demos,
    batch_id: batchId,
    message: `${demos.length} demos generated`,
  });
}
