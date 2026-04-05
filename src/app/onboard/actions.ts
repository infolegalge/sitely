"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { randomUUID } from "crypto";

type OnboardState = { error: string; success?: never } | { success: true; error?: never } | null;

export async function onboardAction(
  _prevState: OnboardState,
  formData: FormData,
): Promise<OnboardState> {
  const ref = (formData.get("ref") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const message = (formData.get("message") as string)?.trim() || null;

  if (!ref || !name || !email) {
    return { error: "სახელი და ელ-ფოსტა სავალდებულოა." };
  }

  // Validate ref format (UUID)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    return { error: "არასწორი ბმული." };
  }

  const supabase = createServiceRoleClient();

  // Verify company exists with this secure_link_id
  const { data: company } = await supabase
    .from("companies")
    .select("id, email")
    .eq("secure_link_id", ref)
    .single();

  if (!company) {
    return { error: "კომპანია ვერ მოიძებნა." };
  }

  // Update company contact info if changed
  const updates: Record<string, string | null> = {};
  if (email !== company.email) updates.email = email;
  if (phone) updates.phone = phone;
  if (Object.keys(updates).length > 0) {
    await supabase.from("companies").update(updates).eq("id", company.id);
  }

  // Store onboard request in demo_events for tracking
  await supabase.from("demo_events").insert({
    demo_id: null,
    event_type: "onboard_request",
    metadata: { name, email, phone, message, company_id: company.id },
    page_url: "/onboard",
    referrer: null,
    user_agent: null,
  });

  // Revoke any previous tokens for this email (old links stop working)
  await supabase
    .from("onboard_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email)
    .is("used_at", null);

  // Generate a permanent token (only revoked when a new link is requested)
  const token = randomUUID();

  const { error: tokenError } = await supabase.from("onboard_tokens").insert({
    token,
    email,
    company_id: company.id,
    name,
    expires_at: null,
  });

  if (tokenError) {
    console.error("Token creation error:", tokenError.message);
    return { error: "შეცდომა. სცადეთ თავიდან." };
  }

  // Ensure the Supabase user exists with client role
  const { data: existingUsers } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  ) ?? null;

  if (existingUser) {
    await supabase.auth.admin.updateUserById(existingUser.id, {
      app_metadata: { role: "client", company_id: company.id },
    });
  } else {
    // Create user with a random password (they'll always use magic link)
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: "client", company_id: company.id },
      user_metadata: { name },
    });
  }

  // Build verify URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge";
  const verifyUrl = `${siteUrl}/auth/verify?token=${token}`;

  // Send magic link email via Zoho SMTP
  try {
    await sendEmail({
      to: email,
      subject: "შედით თქვენს კაბინეტში — Sitely",
      html: buildMagicLinkEmail(name, verifyUrl),
    });
  } catch (err) {
    console.error("[onboard] email send error:", err);
    return { error: "ემეილის გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან." };
  }

  return { success: true };
}

function buildMagicLinkEmail(recipientName: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ka">
<head><meta charset="UTF-8" /><title>შედით კაბინეტში — Sitely</title></head>
<body style="margin:0;padding:0;background:#06060b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060b;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#4f6ef7 0%,#8b5cf6 100%);padding:28px 40px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#fff;">Sitely</span>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,.55);">გამარჯობა ${recipientName},</p>
          <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#fff;">თქვენი პორტალი მზადაა!</h2>
          <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,.6);line-height:1.6;">
            შესასვლელად დააჭირეთ ქვემოთ მოცემულ ღილაკს:
          </p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:100px;background:#4f6ef7;">
              <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:100px;">
                → შესვლა კაბინეტში
              </a>
            </td>
          </tr></table>
          <p style="margin:28px 0 0;font-size:13px;color:rgba(255,255,255,.3);">
            🔗 ეს ლინკი მუდმივია — შეინახეთ სასურველ ადგილას.<br>კითხვების შემთხვევაში: hello@sitely.ge
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.06);">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.2);">Sitely.ge — პროფესიონალური ვებ-გვერდები</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
