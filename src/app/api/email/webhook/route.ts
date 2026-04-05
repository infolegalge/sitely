import { inngest } from "@/lib/inngest/client";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Verify webhook authenticity via shared secret
  const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");

  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return new Response(null, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, bounce_type, demo_id, error_message } = body as {
    email?: string;
    bounce_type?: string;
    demo_id?: string;
    error_message?: string;
  };

  if (!email || !bounce_type || !["soft", "hard"].includes(bounce_type)) {
    return Response.json({ error: "Invalid bounce data" }, { status: 400 });
  }

  await inngest.send({
    name: "email/bounce",
    data: {
      email,
      bounce_type: bounce_type as "soft" | "hard",
      demo_id: demo_id || null,
      error_message: error_message || null,
    },
  });

  return new Response(null, { status: 204 });
}
