import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { batchGenerateDemos } from "@/lib/inngest/demo-generate";
import { batchSendEmails, handleBounce } from "@/lib/inngest/email-send";
import { dataRetentionCron } from "@/lib/inngest/data-retention";
import { refreshSessionSummaries } from "@/lib/inngest/refresh-mv";
import { notifyAdminOnClientMessage } from "@/lib/inngest/portal-notify";
import { anomalyDetectionCron } from "@/lib/inngest/anomaly-detection";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [batchGenerateDemos, batchSendEmails, handleBounce, dataRetentionCron, refreshSessionSummaries, notifyAdminOnClientMessage, anomalyDetectionCron],
});
