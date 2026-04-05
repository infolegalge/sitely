import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getClaimRateLimiter } from "@/lib/rate-limit";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";

const claimSchema = z.object({
  demo_id: z.string().uuid("demo_id must be a valid UUID"),
  name: z.string().min(2, "სახელი მინ. 2 სიმბოლო").max(200),
  phone: z.string().min(5, "ტელეფონი სავალდებულოა").max(50),
  email: z.string().email("ელ-ფოსტა არასწორია").max(254),
  // honeypot — bots fill this, humans don't
  _h: z.string().max(0, "bot_detected").optional(),
});

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

function buildMagicLinkEmail(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8" />
  <title>შედით კაბინეტში — Sitely</title>
</head>
<body style="margin:0;padding:0;background:#06060b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060b;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#4f6ef7 0%,#8b5cf6 100%);padding:28px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.04em;">Sitely</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,.55);">გამარჯობა ${name},</p>
              <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#fff;letter-spacing:-.03em;">
                თქვენი პორტალი მზადაა!
              </h2>
              <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,.6);line-height:1.6;">
                თქვენი პერსონალური სამუშაო სივრცე შეიქმნა.<br>
                შესასვლელად დააჭირეთ ქვემოთ მოცემულ ღილაკს:
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:100px;background:#4f6ef7;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;border-radius:100px;">
                      → შესვლა კაბინეტში
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;color:rgba(255,255,255,.3);">
                ⏳ ლინკი მოქმედებს 24 საათის განმავლობაში.<br>
                კითხვების შემთხვევაში: hello@sitely.ge
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,.2);">Sitely.ge — პროფესიონალური ვებ-გვერდები ბიზნესისთვის</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  // ── Rate limiting (5 claims per IP per hour) ──────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limiter = getClaimRateLimiter();
  if (limiter) {
    const { success } = await limiter.limit(`claim:${ip}`);
    if (!success) {
      return Response.json(
        { error: "ძალიან ბევრი მოთხოვნა. სცადეთ ცოტა მოგვიანებით." },
        { status: 429 }
      );
    }
  }

  // ── Parse + validate ──────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.message === "bot_detected") {
      // Silently accept to not reveal honeypot
      return Response.json({ success: true });
    }
    return Response.json({ error: first?.message ?? "Validation error" }, { status: 422 });
  }

  const { demo_id, name, phone, email } = parsed.data;

  const supabase = createServiceRoleClient();

  // ── 1. Find demo → company ───────────────────────────────
  const { data: demo } = await supabase
    .from("demos")
    .select("id, company_id, expires_at, status, offer_draft")
    .eq("id", demo_id)
    .single();

  if (!demo) {
    return Response.json({ error: "დემო ვერ მოიძებნა." }, { status: 404 });
  }

  if (demo.expires_at && new Date(demo.expires_at) < new Date()) {
    return Response.json({ error: "დემოს ვადა ამოიწურა." }, { status: 410 });
  }

  // ── 2. Get company ───────────────────────────────────────
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, status")
    .eq("id", demo.company_id)
    .single();

  if (!company) {
    return Response.json({ error: "კომპანია ვერ მოიძებნა." }, { status: 404 });
  }

  // ── 3. Idempotency check: same email + demo_id ───────────
  const { data: existingProject } = await supabase
    .from("projects")
    .select("id")
    .eq("demo_id", demo_id)
    .eq("client_email", email.toLowerCase())
    .maybeSingle();

  if (existingProject) {
    // Re-send a new token without creating a duplicate project
    const newToken = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("onboard_tokens").insert({
      token: newToken,
      email: email.toLowerCase(),
      company_id: company.id,
      name,
      project_id: existingProject.id,
      expires_at: expires,
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge"}/auth/verify?token=${newToken}`;
    try {
      await sendEmail({
        to: email,
        subject: "შედით თქვენს კაბინეტში — Sitely",
        html: buildMagicLinkEmail(name, verifyUrl),
      });
    } catch (err) {
      console.error("[claim] resend email error:", err);
    }

    return Response.json({ success: true, email: maskEmail(email) });
  }

  // ── 4. Find or create Supabase Auth user ─────────────────
  let userId: string;

  const { data: foundUsers } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const foundUser = foundUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  ) ?? null;

  if (foundUser) {
    userId = foundUser.id;
  } else {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
      app_metadata: { role: "client" },
    });

    if (createError || !created?.user) {
      console.error("[claim] createUser error:", createError?.message);
      return Response.json({ error: "მომხმარებლის შექმნა ვერ მოხერხდა." }, { status: 500 });
    }

    userId = created.user.id;
  }

  // Ensure client role is set
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role: "client" },
  });

  // ── 5. Create project ────────────────────────────────────
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      company_id: company.id,
      demo_id: demo.id,
      client_name: name,
      client_email: email.toLowerCase(),
      client_phone: phone,
      client_user_id: userId,
      status: "lead_new",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    console.error("[claim] project insert error:", projectError?.message);
    return Response.json({ error: "პროექტის შექმნა ვერ მოხერხდა." }, { status: 500 });
  }

  // ── 5b. Auto-create proposal from offer_draft if present ──
  const offerDraft = (demo as Record<string, unknown>).offer_draft as Record<string, unknown> | null;
  if (offerDraft && typeof offerDraft === "object") {
    const snapshot = {
      price: offerDraft.price ?? 0,
      currency: offerDraft.currency ?? "GEL",
      title: offerDraft.title ?? "",
      included: Array.isArray(offerDraft.included) ? offerDraft.included : [],
      excluded: Array.isArray(offerDraft.excluded) ? offerDraft.excluded : [],
      notes: offerDraft.notes ?? "",
    };

    const { error: proposalErr } = await supabase.from("proposals").insert({
      project_id: project.id,
      package_id: typeof offerDraft.package_id === "string" ? offerDraft.package_id : null,
      snapshot,
      status: "pending",
    });

    if (proposalErr) {
      console.error("[claim] auto-proposal insert error:", proposalErr.message);
      // Non-fatal: project is created, proposal can be added later by admin
    } else {
      // Auto-advance project status to proposal_sent
      await supabase
        .from("projects")
        .update({ status: "proposal_sent" })
        .eq("id", project.id);
    }
  }

  // ── 6. Create onboard token (24h TTL) ────────────────────
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: tokenError } = await supabase.from("onboard_tokens").insert({
    token,
    email: email.toLowerCase(),
    company_id: company.id,
    name,
    project_id: project.id,
    expires_at: expiresAt,
  });

  if (tokenError) {
    console.error("[claim] token insert error:", tokenError.message);
    return Response.json({ error: "ტოკენის შექმნა ვერ მოხერხდა." }, { status: 500 });
  }

  // ── 7. Send magic link email ─────────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitely.ge";
  const verifyUrl = `${siteUrl}/auth/verify?token=${token}`;

  try {
    await sendEmail({
      to: email,
      subject: `გამარჯობა ${name}, თქვენი პორტალი მზადაა! — Sitely`,
      html: buildMagicLinkEmail(name, verifyUrl),
    });
  } catch (err) {
    console.error("[claim] sendEmail error:", err);
    // Non-fatal: token still exists, admin can resend
  }

  // ── 8. Update company status → engaged ──────────────────
  if (company.status !== "engaged" && company.status !== "converted") {
    await supabase
      .from("companies")
      .update({ status: "engaged" })
      .eq("id", company.id);
  }

  // ── 9. Mark demo as form_submitted if not already ────────
  await supabase
    .from("demos")
    .update({ status: "form_submitted" })
    .eq("id", demo.id)
    .neq("status", "form_submitted");

  // ── 10. Log demo event ───────────────────────────────────
  await supabase.from("demo_events").insert({
    demo_id: demo.id,
    event_type: "claim_submitted",
    session_id: null,
    page_url: null,
    extra: { name, phone, email: email.toLowerCase(), project_id: project.id },
  });

  return Response.json({ success: true, email: maskEmail(email) });
}
