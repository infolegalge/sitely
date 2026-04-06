import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  if (role !== "client") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch the client's project (most recent active one)
  const { data: project } = await supabase
    .from("projects")
    .select("id, company_id, demo_id, client_name, client_email, status, admin_notes, created_at, updated_at")
    .eq("client_user_id", user.id)
    .not("status", "in", '("cancelled","lost")')
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    return Response.json({ project: null, proposal: null, steps: [] });
  }

  // Fetch the latest proposal for this project
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, snapshot, status, payment_method, paid_at, expires_at, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Auto-expire proposal if past expires_at
  let activeProposal = proposal;
  if (proposal && proposal.status === "pending" && proposal.expires_at) {
    if (new Date(proposal.expires_at) < new Date()) {
      const admin = createServiceRoleClient();
      await admin
        .from("proposals")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", proposal.id);
      activeProposal = { ...proposal, status: "expired" };
    }
  }

  // Fetch timeline steps
  const { data: steps } = await supabase
    .from("project_timeline_steps")
    .select("id, step_order, title, description, status")
    .eq("project_id", project.id)
    .order("step_order", { ascending: true });

  // Fetch demo hash for the "view your demo" link
  let demoHash: string | null = null;
  if (project.demo_id) {
    const { data: demo } = await supabase
      .from("demos")
      .select("hash")
      .eq("id", project.demo_id)
      .maybeSingle();
    demoHash = demo?.hash ?? null;
  }

  // Check if client has sent a customize request (system message)
  const { count: customizeCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id)
    .eq("is_system", true)
    .eq("sender_role", "client");

  return Response.json({
    project: { ...project, demo_hash: demoHash },
    proposal: activeProposal ?? null,
    steps: steps ?? [],
    hasCustomizeRequest: (customizeCount ?? 0) > 0,
  });
}
