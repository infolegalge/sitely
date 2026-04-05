import { inngest } from "./client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

// Called when a client sends a message.
// Waits 10 minutes, then emails the admin if no one has read the message yet.
export const notifyAdminOnClientMessage = inngest.createFunction(
  {
    id: "portal-notify-admin-client-message",
    retries: 2,
    triggers: [{ event: "portal/message.sent" }],
  },
  async ({ event, step }) => {
    const { message_id, project_id, sender_name } = event.data as {
      message_id: string;
      project_id: string;
      sender_name: string;
    };

    // Wait 10 minutes before checking — gives admin time to see the message naturally
    await step.sleep("wait-before-notify", "10m");

    // Check if the message is still unread
    const isUnread = await step.run("check-unread", async () => {
      const admin = createServiceRoleClient();
      const { data } = await admin
        .from("messages")
        .select("id, is_read")
        .eq("id", message_id)
        .single();
      return data?.is_read === false;
    });

    if (!isUnread) return { skipped: true, reason: "already_read" };

    // Fetch project + company to build the email
    const projectData = await step.run("fetch-project", async () => {
      const admin = createServiceRoleClient();
      const { data } = await admin
        .from("projects")
        .select("id, client_name, client_email, companies(name)")
        .eq("id", project_id)
        .single();
      return data;
    });

    if (!projectData) return { skipped: true, reason: "project_not_found" };

    const companyName = Array.isArray(projectData.companies)
      ? projectData.companies[0]?.name
      : (projectData.companies as { name: string } | null)?.name ?? "კლიენტი";

    // Fetch the admin email(s) from auth users with super_admin role
    const adminEmail = await step.run("fetch-admin-email", async () => {
      const admin = createServiceRoleClient();
      const { data } = await admin.auth.admin.listUsers({ perPage: 100 });
      const admins = (data?.users ?? []).filter(
        (u) => u.app_metadata?.role === "super_admin" && u.email
      );
      return admins[0]?.email ?? null;
    });

    if (!adminEmail) return { skipped: true, reason: "no_admin_email" };

    // Send the notification email
    await step.run("send-email", async () => {
      const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://sitely.ge"}/secure-access/projects`;

      const html = buildAdminNotificationEmail({
        senderName: sender_name,
        companyName,
        portalUrl,
      });

      await sendEmail({
        to: adminEmail,
        subject: `💬 ${companyName} — ახალი შეტყობინება (10 წუთი)`,
        html,
      });
    });

    return { success: true, notified: adminEmail };
  }
);

function buildAdminNotificationEmail({
  senderName,
  companyName,
  portalUrl,
}: {
  senderName: string;
  companyName: string;
  portalUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8" />
  <title>ახალი შეტყობინება — Sitely CMS</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#111827;padding:24px 32px;">
              <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-.03em;">Sitely CMS</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">შეტყობინება</p>
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">
                💬 ${companyName}-ისგან ახალი შეტყობინება
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                <strong>${senderName}</strong> (${companyName}) გამოგზავნა შეტყობინება და 10 წუთი გავიდა პასუხის გარეშე.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111827;border-radius:8px;">
                    <a href="${portalUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
                      → CMS-ში ნახვა
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
                ეს email გამოიგზავნა ავტომატურად, რადგან შეტყობინება 10 წუთის შემდეგ დაუკითხავი დარჩა.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
