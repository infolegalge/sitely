import { inngest } from "./client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, buildDemoEmailHtml } from "@/lib/email";

export const batchSendEmails = inngest.createFunction(
  {
    id: "email-batch-send",
    concurrency: { limit: 1 },
    retries: 1,
    triggers: [{ event: "email/batch.send" }],
  },
  async ({ event, step }) => {
    const { demo_ids, campaign_id, subject } = event.data as {
      demo_ids: string[];
      campaign_id: string;
      subject: string;
    };

    const supabase = createServiceRoleClient();

    // Step 1: Fetch demos with company info
    const demos = await step.run("fetch-demos", async () => {
      const { data, error } = await supabase
        .from("demos")
        .select("id, hash, company_id, companies(id, name, email, status, last_contacted_at)")
        .in("id", demo_ids);

      if (error || !data) throw new Error("Failed to fetch demos");
      return data;
    });

    type CompanyInfo = {
      id: string;
      name: string;
      email: string | null;
      status: string;
      last_contacted_at: string | null;
    };

    let sentCount = 0;
    let skippedCount = 0;

    // Step 2: Send emails one by one with throttling
    for (let i = 0; i < demos.length; i++) {
      const demo = demos[i];
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

      await step.run(`send-email-${i}`, async () => {
        // Check if campaign was cancelled
        const { data: campaign } = await supabase
          .from("email_campaigns")
          .select("status")
          .eq("id", campaign_id)
          .single();

        if (campaign?.status === "cancelled" || campaign?.status === "paused") {
          return; // Stop sending
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge";
        const demoUrl = `${siteUrl}/demo/${demo.hash}`;
        const html = buildDemoEmailHtml({ companyName: company.name, demoUrl });
        await sendEmail({ to: company.email!, subject, html });

        // Mark demo as sent
        await supabase
          .from("demos")
          .update({ status: "sent", campaign_id })
          .eq("id", demo.id);

        // Update company status
        await supabase
          .from("companies")
          .update({
            status: "contacted",
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", demo.company_id);

        // Update campaign sent count
        await supabase
          .from("email_campaigns")
          .update({ sent_count: sentCount + 1 })
          .eq("id", campaign_id);
      });

      sentCount++;

      // Throttle: sleep ~72 seconds between emails (~50/hour)
      if (i < demos.length - 1) {
        await step.sleep("throttle-" + i, "72s");
      }
    }

    // Final campaign update
    await step.run("finalize-campaign", async () => {
      await supabase
        .from("email_campaigns")
        .update({
          status: "completed",
          sent_count: sentCount,
        })
        .eq("id", campaign_id);
    });

    return { sent: sentCount, skipped: skippedCount };
  }
);

// Bounce handler
export const handleBounce = inngest.createFunction(
  {
    id: "email-bounce-handler",
    retries: 3,
    triggers: [{ event: "email/bounce" }],
  },
  async ({ event, step }) => {
    const { email, bounce_type, demo_id, error_message } = event.data as {
      email: string;
      bounce_type: "soft" | "hard";
      demo_id: string;
      error_message?: string;
    };

    const supabase = createServiceRoleClient();

    if (bounce_type === "hard") {
      // Hard bounce: mark company as DNC, clear email
      await step.run("hard-bounce", async () => {
        await supabase
          .from("companies")
          .update({ status: "dnc", email: null })
          .eq("email", email);

        // Log to dead letter queue
        await supabase.from("dead_letter_queue").insert({
          email,
          demo_id,
          bounce_type,
          error_message: error_message || "Hard bounce",
        });
      });
    } else {
      // Soft bounce: log and retry later (max 2 retries handled by Inngest)
      await step.run("soft-bounce-log", async () => {
        await supabase.from("dead_letter_queue").insert({
          email,
          demo_id,
          bounce_type,
          error_message: error_message || "Soft bounce",
        });
      });
    }
  }
);
