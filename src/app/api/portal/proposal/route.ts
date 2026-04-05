import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
  reject_reason: z.string().max(1000).optional(),
});

/** Client accepts or rejects the latest pending proposal */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "client") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();

  // Find the client's active project
  const { data: project } = await admin
    .from("projects")
    .select("id, status")
    .eq("client_user_id", user.id)
    .eq("status", "proposal_sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    return Response.json({ error: "No pending proposal found" }, { status: 404 });
  }

  // Find the latest pending proposal
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, snapshot, expires_at")
    .eq("project_id", project.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!proposal) {
    return Response.json({ error: "No pending proposal" }, { status: 404 });
  }

  // Check expiration
  if (proposal.expires_at && new Date(proposal.expires_at) < new Date()) {
    await admin
      .from("proposals")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", proposal.id);

    return Response.json({ error: "Proposal has expired" }, { status: 410 });
  }

  const { action, reject_reason } = parsed.data;

  if (action === "accept") {
    // Mark proposal as accepted (payment still needed — admin confirms later)
    await admin
      .from("proposals")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", proposal.id);

    // Update project status to waiting for payment
    await admin
      .from("projects")
      .update({ status: "proposal_accepted", updated_at: new Date().toISOString() })
      .eq("id", project.id);

    // System message visible to both sides
    await admin.from("messages").insert({
      project_id: project.id,
      sender_id: user.id,
      sender_role: "client",
      content: "✅ კლიენტმა შეთავაზება მიიღო",
      is_system: true,
      is_internal: false,
    });

    return Response.json({ success: true, action: "accepted" });
  }

  // action === "reject"
  await admin
    .from("proposals")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", proposal.id);

  // Revert project back to negotiation
  await admin
    .from("projects")
    .update({ status: "lead_negotiating", updated_at: new Date().toISOString() })
    .eq("id", project.id);

  const reasonText = reject_reason ? `\nმიზეზი: ${reject_reason}` : "";
  await admin.from("messages").insert({
    project_id: project.id,
    sender_id: user.id,
    sender_role: "client",
    content: `❌ კლიენტმა შეთავაზება უარყო${reasonText}`,
    is_system: true,
    is_internal: false,
  });

  return Response.json({ success: true, action: "rejected" });
}
