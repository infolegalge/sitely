import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Anomaly Detection — runs every 6 hours.
 * Compares the last 6 hours of traffic against the 7-day average
 * for the same time window. Alerts on significant spikes or drops.
 */
export const anomalyDetectionCron = inngest.createFunction(
  {
    id: "anomaly-detection",
    retries: 1,
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step }) => {
    const supabase = getAdminClient();

    const { current, avg, ratio } = await step.run("compare-traffic", async () => {
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

      // Current window: last 6 hours
      const { count: currentCount } = await supabase
        .from("demo_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sixHoursAgo.toISOString())
        .lt("created_at", now.toISOString());

      // Historical average: same 6-hour window over the past 7 days
      const historicalCounts: number[] = [];
      for (let d = 1; d <= 7; d++) {
        const dayStart = new Date(sixHoursAgo.getTime() - d * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
        const { count } = await supabase
          .from("demo_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString())
          .lt("created_at", dayEnd.toISOString());
        if (count !== null) historicalCounts.push(count);
      }

      const current = currentCount ?? 0;
      const avg = historicalCounts.length >= 3
        ? historicalCounts.reduce((a, b) => a + b, 0) / historicalCounts.length
        : -1;
      const ratio = avg > 0 ? current / avg : 1;

      return { current, avg, ratio };
    });

    if (avg < 10) {
      return { skipped: true, reason: "Not enough traffic for anomaly detection" };
    }

    const alerts: string[] = [];

    if (ratio >= 3) {
      alerts.push(`📈 ტრაფიკის სპაიკი: ${current} ივენთი ბოლო 6 საათში (საშუალო: ${Math.round(avg)}). ${Math.round(ratio)}x ნორმალურზე მეტი.`);
    }

    if (ratio <= 0.2 && avg >= 20) {
      alerts.push(`📉 ტრაფიკის ვარდნა: ${current} ივენთი ბოლო 6 საათში (საშუალო: ${Math.round(avg)}). ${Math.round((1 - ratio) * 100)}% ნაკლები.`);
    }

    if (current === 0 && avg >= 30) {
      alerts.push(`🚨 ტრაფიკი = 0 ბოლო 6 საათში! საშუალო იყო ${Math.round(avg)}. შეამოწმეთ ტრეკინგის სკრიპტი.`);
    }

    if (alerts.length === 0) {
      return { checked: true, current, avg: Math.round(avg), ratio: Math.round(ratio * 100) / 100 };
    }

    await step.run("send-alert-email", async () => {
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER;
      if (!adminEmail) throw new Error("No admin email configured");

      await sendEmail({
        to: adminEmail,
        subject: `⚡ Sitely ანომალია — ${alerts.length} გაფრთხილება`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#4f6ef7;margin:0 0 16px">Sitely — ანომალიის გაფრთხილება</h2>
            <p style="color:#666;font-size:14px">${new Date().toLocaleString("ka-GE")}</p>
            ${alerts.map((a) => `<div style="padding:12px;margin:8px 0;background:#f8f9fa;border-left:4px solid #4f6ef7;border-radius:4px;font-size:14px">${a}</div>`).join("")}
            <p style="color:#999;font-size:12px;margin-top:24px">
              მიმდინარე: ${current} ივენთი · საშუალო: ${Math.round(avg)} ივენთი · რეიშიო: ${Math.round(ratio * 100)}%
            </p>
          </div>
        `,
      });
    });

    return { alerts, current, avg: Math.round(avg) };
  },
);
