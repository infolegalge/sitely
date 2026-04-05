import { inngest } from "./client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildCompanyData, compileTemplate } from "@/lib/template-engine";
import crypto from "crypto";

export const batchGenerateDemos = inngest.createFunction(
  {
    id: "demo-batch-generate",
    concurrency: { limit: 1 },
    retries: 2,
    triggers: [{ event: "demo/batch.generate" }],
  },
  async ({ event, step }) => {
    const { template_id, company_ids, campaign_id, expires_days } =
      event.data as {
        template_id: string;
        company_ids: string[];
        campaign_id: string | null;
        expires_days: number;
      };

    const supabase = createServiceRoleClient();

    // Step 1: Fetch template
    const template = await step.run("fetch-template", async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, html_content, fallback_images")
        .eq("id", template_id)
        .single();

      if (error || !data) throw new Error(`Template ${template_id} not found`);
      return data;
    });

    // Step 2: Process companies in batches of 50
    const batchSize = 50;
    let totalGenerated = 0;

    for (let i = 0; i < company_ids.length; i += batchSize) {
      const batchIds = company_ids.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize);

      const generated = await step.run(
        `generate-batch-${batchIndex}`,
        async () => {
          const { data: companies, error } = await supabase
            .from("companies")
            .select("*")
            .in("id", batchIds);

          if (error || !companies) return 0;

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expires_days);

          const demos = companies.map((company) => {
            const hash = crypto.randomBytes(12).toString("base64url");
            const companyData = buildCompanyData(
              company,
              template.fallback_images || []
            );
            const htmlSnapshot = compileTemplate(
              template.html_content,
              companyData
            );

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

          const { error: insertErr } = await supabase
            .from("demos")
            .insert(demos);

          if (insertErr) throw new Error(insertErr.message);

          // Update company statuses
          await supabase
            .from("companies")
            .update({ status: "demo_ready" })
            .in(
              "id",
              companies.map((c) => c.id)
            );

          // Update campaign progress if exists
          if (campaign_id) {
            await supabase.rpc("increment_campaign_count", {
              p_campaign_id: campaign_id,
              p_increment: companies.length,
            });
          }

          return companies.length;
        }
      );

      totalGenerated += generated;
    }

    return { generated: totalGenerated };
  }
);
