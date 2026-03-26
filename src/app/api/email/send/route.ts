import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
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

  const campaignId = typeof body.campaign_id === "string" ? body.campaign_id : null;
  const demoIds = Array.isArray(body.demo_ids) ? body.demo_ids : [];

  if (demoIds.length === 0) {
    return Response.json({ error: "No demo_ids provided" }, { status: 400 });
  }
  if (demoIds.length > 200) {
    return Response.json({ error: "Max 200 emails per batch" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Fetch demos with company info
  const { data: demos, error } = await supabase
    .from("demos")
    .select("id, hash, company_id, companies(name, email)")
    .in("id", demoIds);

  if (error || !demos) {
    return Response.json({ error: "Failed to fetch demos" }, { status: 500 });
  }

  // Filter only demos with company email
  type CompanyInfo = { name: string; email: string | null };
  const sendable = demos.filter((d) => {
    const co = Array.isArray(d.companies) ? d.companies[0] : d.companies;
    return co && (co as CompanyInfo).email;
  });

  // TODO: Wire up actual email provider (Resend / Gmail API / SMTP)
  // For now, just mark them as sent and create campaign record
  const results = {
    total: sendable.length,
    sent: 0,
    failed: 0,
    skipped: demos.length - sendable.length,
    errors: [] as string[],
  };

  // Create campaign if not provided
  let activeCampaignId = campaignId;
  if (!activeCampaignId) {
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .insert({
        name: `ბეჩი — ${new Date().toLocaleDateString("ka-GE")}`,
        subject: typeof body.subject === "string" ? body.subject.slice(0, 300) : "თქვენი ახალი საიტი მზადაა!",
        status: "sent",
        total_recipients: sendable.length,
        sent_count: 0,
      })
      .select("id")
      .single();

    if (campaign) activeCampaignId = campaign.id;
  }

  // Mark demos as sent and associate with campaign
  for (const demo of sendable) {
    // TODO: Send actual email here
    // const email = (demo.companies as { email: string }).email;
    // const demoUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/demo/${demo.hash}`;
    // await sendEmail({ to: email, subject: "...", html: "..." });

    await supabase
      .from("demos")
      .update({
        status: "sent",
        ...(activeCampaignId ? { campaign_id: activeCampaignId } : {}),
      })
      .eq("id", demo.id);

    await supabase
      .from("companies")
      .update({ status: "demo_sent" })
      .eq("id", demo.company_id);

    results.sent++;
  }

  // Update campaign sent count
  if (activeCampaignId) {
    await supabase
      .from("email_campaigns")
      .update({ sent_count: results.sent })
      .eq("id", activeCampaignId);
  }

  return Response.json(results);
}
