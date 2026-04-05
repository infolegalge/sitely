import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  snapshot: z.object({
    price: z.number().min(0),
    currency: z.string().default("GEL"),
    title: z.string().min(1).max(300),
    included: z.array(z.string()).default([]),
    excluded: z.array(z.string()).default([]),
  }),
  package_id: z.string().uuid().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  // Mark as paid manually (no payment gateway yet)
  mark_paid: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: projectId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();

  // Verify project exists
  const { data: project } = await admin
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .single();

  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const { snapshot, package_id, expires_at, mark_paid } = parsed.data;

  if (mark_paid) {
    // Admin manually confirms payment — expire pending proposals, accept latest
    await admin
      .from("proposals")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("status", "pending");

    // Find the most recent proposal to accept
    const { data: latest } = await admin
      .from("proposals")
      .select("id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      await admin
        .from("proposals")
        .update({
          status: "accepted",
          payment_method: "bank_transfer",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", latest.id);
    }

    // Move project to production
    await admin.from("projects").update({
      status: "active_collecting",
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);

    // System message
    await admin.from("messages").insert({
      project_id: projectId,
      sender_id: user.id,
      sender_role: "admin",
      content: "🎉 გადახდა დადასტურებულია! ვიწყებთ მუშაობას.",
      is_system: true,
      is_internal: false,
    });

    return Response.json({ success: true, action: "paid" });
  }

  // Expire any existing pending proposals
  await admin
    .from("proposals")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("status", "pending");

  // Create new proposal
  const { data: proposal, error } = await admin
    .from("proposals")
    .insert({
      project_id: projectId,
      package_id: package_id ?? null,
      snapshot,
      status: "pending",
      expires_at: expires_at ?? null,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Move project to proposal_sent
  await admin.from("projects").update({
    status: "proposal_sent",
    updated_at: new Date().toISOString(),
  }).eq("id", projectId);

  // System message
  await admin.from("messages").insert({
    project_id: projectId,
    sender_id: user.id,
    sender_role: "admin",
    content: `📋 შეთავაზება გამოგზავნილია: ${snapshot.title} — ${snapshot.price} ${snapshot.currency === "GEL" ? "₾" : snapshot.currency}`,
    is_system: true,
    is_internal: false,
  });

  return Response.json({ success: true, proposal_id: proposal.id });
}
