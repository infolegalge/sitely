import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const demoId = typeof body.demo_id === "string" ? body.demo_id.slice(0, 100) : "";
  const name = typeof body.name === "string" ? body.name.slice(0, 200) : "";
  const phone = typeof body.phone === "string" ? body.phone.slice(0, 50) : "";
  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "";

  if (!demoId || !name || !phone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Verify demo exists
  const { data: demo, error } = await supabase
    .from("demos")
    .select("id, company_id, hash")
    .eq("id", demoId)
    .single();

  if (error || !demo) {
    return Response.json({ error: "Demo not found" }, { status: 404 });
  }

  // Track form_submit event
  await supabase.from("demo_events").insert({
    demo_id: demoId,
    event_type: "form_submit",
    metadata: { name, phone, message },
    page_url: typeof body.page_url === "string" ? body.page_url.slice(0, 500) : null,
    referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null,
    user_agent: typeof body.user_agent === "string" ? body.user_agent.slice(0, 500) : null,
  });

  // Update demo status to form_submitted
  await supabase
    .from("demos")
    .update({ status: "form_submitted" })
    .eq("id", demoId);

  // Update company status to engaged (form submitted = high engagement)
  await supabase
    .from("companies")
    .update({ status: "engaged" })
    .eq("id", demo.company_id);

  return Response.json({ success: true }, { status: 200 });
}
