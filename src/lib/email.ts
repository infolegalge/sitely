import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtppro.zoho.eu",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  return transporter.sendMail({
    from: `"Sitely" <${process.env.SMTP_USER || "hello@sitely.ge"}>`,
    to,
    subject,
    html,
  });
}

export function buildDemoEmailHtml({
  companyName,
  demoUrl,
  customText,
}: {
  companyName: string;
  demoUrl: string;
  customText?: string;
}) {
  const bodyText = customText
    ? escapeHtml(customText).replace(/\n/g, "<br/>")
    : `ჩვენ შევქმენით პერსონალიზებული 3D ვებ-საიტის დემო სპეციალურად თქვენი ბიზნესისთვის. 
                საიტი მოიცავს თქვენს ინფორმაციას, სურათებს და თანამედროვე 3D დიზაინს.`;

  return `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>თქვენი ახალი საიტი მზადაა</title>
</head>
<body style="margin:0; padding:0; background-color:#06060b; font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#06060b; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0d0d1a; border-radius:16px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f6ef7 0%, #8b5cf6 100%); padding:32px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:1px;">
                SITELY
              </h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">
                3D ვებ დიზაინი
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px; color:#eaeaff; font-size:22px; font-weight:600;">
                გამარჯობა, ${escapeHtml(companyName)}! 👋
              </h2>
              
              <p style="margin:0 0 20px; color:#a0a0c0; font-size:16px; line-height:1.7;">
                ${bodyText}
              </p>

              <p style="margin:0 0 32px; color:#a0a0c0; font-size:16px; line-height:1.7;">
                დააჭირეთ ქვემოთ მოცემულ ღილაკს თქვენი საიტის სანახავად:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(demoUrl)}" 
                       style="display:inline-block; padding:16px 48px; background:linear-gradient(135deg, #4f6ef7 0%, #8b5cf6 100%); color:#ffffff; font-size:18px; font-weight:600; text-decoration:none; border-radius:12px; letter-spacing:0.5px;">
                      ნახეთ თქვენი საიტი →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0; color:#666680; font-size:13px; line-height:1.6; text-align:center;">
                ლინკი აქტიურია 30 დღის განმავლობაში
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #1a1a2e;"></div>
            </td>
          </tr>

          <!-- What's included -->
          <tr>
            <td style="padding:32px 40px;">
              <h3 style="margin:0 0 16px; color:#eaeaff; font-size:16px; font-weight:600;">
                რა შედის დემოში:
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0; color:#a0a0c0; font-size:14px;">✓ &nbsp; 3D ანიმაციები და თანამედროვე დიზაინი</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#a0a0c0; font-size:14px;">✓ &nbsp; თქვენი კომპანიის ინფორმაცია</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#a0a0c0; font-size:14px;">✓ &nbsp; მობილურზე ადაპტირებული</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#a0a0c0; font-size:14px;">✓ &nbsp; თქვენი სურათები და რევიუები</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#080812; padding:24px 40px; text-align:center;">
              <p style="margin:0 0 8px; color:#666680; font-size:13px;">
                თუ დაგაინტერესათ, დაგვიკავშირდით:
              </p>
              <p style="margin:0 0 16px; color:#8b5cf6; font-size:14px; font-weight:500;">
                hello@sitely.ge
              </p>
              <p style="margin:0; color:#444460; font-size:11px; line-height:1.5;">
                © ${new Date().getFullYear()} Sitely — 3D ვებ დიზაინი<br/>
                ეს მეილი გაიგზავნა ${escapeHtml(companyName)}-სთვის, რადგან თქვენი ბიზნესისთვის შევქმენით საიტის დემო.<br/>
                თუ არ გსურთ მსგავსი მეილების მიღება, გთხოვთ მოგვწეროთ hello@sitely.ge
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
