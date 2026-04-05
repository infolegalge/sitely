import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { inngest } from "@/lib/inngest/client";
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

  // Dispatch to Inngest for background processing (avoids Vercel timeout)
  await inngest.send({
    name: "email/batch.send",
    data: { demo_ids: demoIds, campaign_id: campaignId, subject },
  });

  return Response.json({
    campaign_id: campaignId,
    queued: demoIds.length,
    message: `${demoIds.length} emails queued for sending`,
  });
}
