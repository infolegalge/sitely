import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { sendEmail, buildDemoEmailHtml } from "@/lib/email";
import { NextRequest } from "next/server";

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

  const demoIds = Array.isArray(body.demo_ids) ? body.demo_ids : [];
  const subject =
    typeof body.subject === "string"
      ? body.subject.slice(0, 300)
      : "თქვენი ახალი საიტი მზადაა!";

  if (demoIds.length === 0) {
    return Response.json({ error: "No demo_ids provided" }, { status: 400 });
  }
  if (demoIds.length > 200) {
    return Response.json({ error: "Max 200 emails per batch" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Create campaign
  let campaignId = typeof body.campaign_id === "string" ? body.campaign_id : null;

  if (!campaignId) {
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .insert({
        name: `ბეჩი — ${new Date().toLocaleDateString("ka-GE")}`,
        subject,
        status: "sending",
        total_recipients: demoIds.length,
        sent_count: 0,
      })
      .select("id")
      .single();

    if (campaign) campaignId = campaign.id;
  }

  if (!campaignId) {
    return Response.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  // Fetch demos with company info
  const { data: demos, error: fetchError } = await supabase
    .from("demos")
    .select("id, hash, company_id, companies(id, name, email, status, last_contacted_at)")
    .in("id", demoIds);

  if (fetchError || !demos) {
    return Response.json({ error: "Failed to fetch demos" }, { status: 500 });
  }

  type CompanyInfo = {
    id: string;
    name: string;
    email: string | null;
    status: string;
    last_contacted_at: string | null;
  };

  let sentCount = 0;
  let skippedCount = 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge";

  for (const demo of demos) {
    const company = (
      Array.isArray(demo.companies) ? demo.companies[0] : demo.companies
    ) as CompanyInfo | null;

    if (!company?.email) {
      skippedCount++;
      continue;
    }

    // Anti-spam: skip if contacted within last 30 days
    if (company.last_contacted_at) {
      const lastContact = new Date(company.last_contacted_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (lastContact > thirtyDaysAgo) {
        skippedCount++;
        continue;
      }
    }

    // Skip DNC companies
    if (company.status === "dnc") {
      skippedCount++;
      continue;
    }

    // Check if campaign was cancelled
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();

    if (campaign?.status === "cancelled" || campaign?.status === "paused") {
      break;
    }

    try {
      const demoUrl = `${siteUrl}/demo/${demo.hash}`;
      const html = buildDemoEmailHtml({ companyName: company.name, demoUrl });
      await sendEmail({ to: company.email, subject, html });

      // Mark demo as sent
      await supabase
        .from("demos")
        .update({ status: "sent", campaign_id: campaignId })
        .eq("id", demo.id);

      // Update company status
      await supabase
        .from("companies")
        .update({
          status: "contacted",
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", demo.company_id);

      sentCount++;

      // Update campaign sent count
      await supabase
        .from("email_campaigns")
        .update({ sent_count: sentCount })
        .eq("id", campaignId);
    } catch {
      skippedCount++;
    }
  }

  // Finalize campaign
  await supabase
    .from("email_campaigns")
    .update({ status: "completed", sent_count: sentCount })
    .eq("id", campaignId);

  return Response.json({
    campaign_id: campaignId,
    sent: sentCount,
    skipped: skippedCount,
    message: `${sentCount} emails sent, ${skippedCount} skipped`,
  });
}
