import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getClaimRateLimiter } from "@/lib/rate-limit";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("ელ-ფოსტა არასწორია").max(254),
});

function buildResetEmail(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ka">
<head><meta charset="UTF-8"/><title>პაროლის აღდგენა — Sitely</title></head>
<body style="margin:0;padding:0;background:#06060b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060b;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#4f6ef7 0%,#8b5cf6 100%);padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.04em;">Sitely</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">პაროლის აღდგენა</h2>
            <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,.6);line-height:1.6;">
              დააჭირეთ ღილაკს ახალი პაროლის დასაყენებლად:
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:100px;background:#4f6ef7;">
                  <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:100px;">
                    → ახალი პაროლის დაყენება
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:rgba(255,255,255,.3);">
              თუ თქვენ არ მოგითხოვიათ პაროლის აღდგენა, უგულებელყავით ეს შეტყობინება.<br>
              კითხვების შემთხვევაში: hello@sitely.ge
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limiter = getClaimRateLimiter();
  if (limiter) {
    const { success } = await limiter.limit(`reset:${ip}`);
    if (!success) {
      return Response.json(
        { error: "ძალიან ბევრი მოთხოვნა. სცადეთ ცოტა მოგვიანებით." },
        { status: 429 },
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 422 },
    );
  }

  const { email } = parsed.data;
  const supabase = createServiceRoleClient();

  // Check if a project/company exists for this email
  const { data: proj } = await supabase
    .from("projects")
    .select("company_id, id, client_name")
    .eq("client_email", email.toLowerCase())
    .not("status", "in", '("cancelled","lost")')
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Always respond with success to prevent email enumeration
  if (!proj?.company_id) {
    return Response.json({ success: true });
  }

  // Revoke all previous tokens for this email
  await supabase
    .from("onboard_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email.toLowerCase())
    .is("used_at", null);

  const token = randomUUID();

  const { error: insertError } = await supabase.from("onboard_tokens").insert({
    token,
    email: email.toLowerCase(),
    company_id: proj.company_id,
    name: proj.client_name || "",
    project_id: proj.id,
    expires_at: null,
  });

  if (insertError) {
    console.error("[reset-request] token insert failed:", insertError.message);
    return Response.json(
      { error: "შეცდომა. სცადეთ თავიდან." },
      { status: 500 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge";
  const verifyUrl = `${siteUrl}/auth/verify?token=${token}&mode=reset`;

  try {
    await sendEmail({
      to: email,
      subject: "პაროლის აღდგენა — Sitely",
      html: buildResetEmail(verifyUrl),
    });
  } catch (err) {
    console.error("[reset-request] sendEmail error:", err);
  }

  return Response.json({ success: true });
}
