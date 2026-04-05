import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Hourly refresh of mv_session_summaries materialized view.
 * Ensures dashboard KPIs use up-to-date aggregated session data.
 */
export const refreshSessionSummaries = inngest.createFunction(
  {
    id: "refresh-session-summaries",
    retries: 2,
    triggers: [{ cron: "15 * * * *" }], // Every hour at :15
  },
  async ({ step }) => {
    const refreshed = await step.run("refresh-mv", async () => {
      const supabase = getAdminClient();
      const { error } = await supabase.rpc("refresh_session_summaries");
      if (error) throw new Error(`MV refresh failed: ${error.message}`);
      return true;
    });

    return { refreshed };
  },
);
