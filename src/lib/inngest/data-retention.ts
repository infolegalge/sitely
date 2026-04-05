import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Daily data retention cron — runs at 03:00 UTC.
 *
 * Step 1: Expire demos past their expiry date → mark status = 'expired'
 * Step 2: Archive old events (30+ days) → aggregate into engagement_score → delete
 * Step 3: GDPR cleanup of DNC companies (90+ days in DNC) → nullify metadata
 */
export const dataRetentionCron = inngest.createFunction(
  {
    id: "data-retention-cron",
    retries: 1,
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }) => {
    // Step 1: Expire demos past their expiry date
    const expiredCount = await step.run("expire-demos", async () => {
      const supabase = getAdminClient();

      const { data: expiredDemos } = await supabase
        .from("demos")
        .select("id, snapshot_url")
        .lt("expires_at", new Date().toISOString())
        .neq("status", "expired")
        .limit(200);

      if (!expiredDemos?.length) return 0;

      // Delete storage files for expired demos
      const storageFiles = expiredDemos
        .map((d) => d.snapshot_url)
        .filter(Boolean)
        .map((url) => {
          // Extract path from storage URL
          const match = url.match(/\/storage\/v1\/object\/public\/(.+)/);
          return match?.[1] || null;
        })
        .filter(Boolean) as string[];

      if (storageFiles.length > 0) {
        await supabase.storage
          .from("demo-snapshots")
          .remove(storageFiles);
      }

      // Mark as expired
      const ids = expiredDemos.map((d) => d.id);
      await supabase
        .from("demos")
        .update({ status: "expired" })
        .in("id", ids);

      return ids.length;
    });

    // Step 2: Archive old events (30+ days) → aggregate score → delete
    const archivedCount = await step.run("archive-old-events", async () => {
      const supabase = getAdminClient();
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get demos that have old events
      const { data: oldEvents } = await supabase
        .from("demo_events")
        .select("id, demo_id")
        .lt("created_at", cutoff)
        .limit(1000);

      if (!oldEvents?.length) return 0;

      // Group by demo_id and count for score
      const demoScores = new Map<string, number>();
      for (const ev of oldEvents) {
        if (ev.demo_id) {
          demoScores.set(ev.demo_id, (demoScores.get(ev.demo_id) || 0) + 1);
        }
      }

      // Update engagement_score for each company associated with these demos
      for (const [demoId, count] of demoScores) {
        const { data: demo } = await supabase
          .from("demos")
          .select("company_id")
          .eq("id", demoId)
          .single();

        if (demo?.company_id) {
          // Increment the engagement_score by the count of archived events
          await supabase.rpc("increment_engagement_score", {
            p_demo_id: demoId,
          });
        }
      }

      // Delete the archived events
      const eventIds = oldEvents.map((e) => e.id);
      await supabase
        .from("demo_events")
        .delete()
        .in("id", eventIds);

      return eventIds.length;
    });

    // Step 3: GDPR cleanup — DNC companies 90+ days → nullify personal data
    const gdprCount = await step.run("gdpr-cleanup", async () => {
      const supabase = getAdminClient();
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: dncCompanies } = await supabase
        .from("companies")
        .select("id")
        .eq("status", "dnc")
        .lt("updated_at", cutoff)
        .limit(200);

      if (!dncCompanies?.length) return 0;

      const ids = dncCompanies.map((c) => c.id);
      await supabase
        .from("companies")
        .update({
          email: null,
          phone: null,
          notes: null,
          metadata: null,
        })
        .in("id", ids);

      return ids.length;
    });

    return {
      expired_demos: expiredCount,
      archived_events: archivedCount,
      gdpr_cleaned: gdprCount,
    };
  },
);
