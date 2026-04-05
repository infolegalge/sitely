import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum([
    "lead_new", "lead_negotiating", "proposal_sent", "proposal_accepted",
    "active_collecting", "active_designing", "active_developing",
    "active_review", "completed", "cancelled", "lost",
  ]).optional(),
  admin_notes: z.string().max(5000).optional(),
  assigned_to: z.string().max(200).optional(),
});

async function assertAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "super_admin") return null;
  return user;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createServiceRoleClient();

  const [projectRes, messagesRes, stepsRes, filesRes] = await Promise.all([
    admin
      .from("projects")
      .select(`
        id, status, client_name, client_email, client_phone,
        admin_notes, assigned_to, demo_id, created_at, updated_at, completed_at,
        companies ( id, name, category, tier, email, phone ),
        proposals ( id, snapshot, status, payment_method, paid_at, expires_at, created_at )
      `)
      .eq("id", id)
      .single(),

    admin
      .from("messages")
      .select("id, sender_id, sender_role, content, file_url, file_name, file_type, file_size, is_read, is_system, is_internal, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: true })
      .limit(200),

    admin
      .from("project_timeline_steps")
      .select("id, step_order, title, description, status")
      .eq("project_id", id)
      .order("step_order", { ascending: true }),

    admin
      .from("project_files")
      .select("id, file_url, file_name, file_type, file_size, category, created_at, uploaded_by")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (projectRes.error || !projectRes.data) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch demo hash if demo_id exists
  let demoHash: string | null = null;
  if (projectRes.data.demo_id) {
    const { data: demo } = await admin
      .from("demos")
      .select("hash")
      .eq("id", projectRes.data.demo_id)
      .maybeSingle();
    demoHash = demo?.hash ?? null;
  }

  return Response.json({
    project: { ...projectRes.data, demo_hash: demoHash },
    messages: messagesRes.data ?? [],
    steps: stepsRes.data ?? [],
    files: filesRes.data ?? [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.admin_notes !== undefined) updates.admin_notes = parsed.data.admin_notes;
  if (parsed.data.assigned_to !== undefined) updates.assigned_to = parsed.data.assigned_to;
  if (parsed.data.status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await admin.from("projects").update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Insert system message when status changes
  if (parsed.data.status) {
    const STATUS_LABELS: Record<string, string> = {
      lead_new: "ახალი Lead",
      lead_negotiating: "მოლაპარაკება",
      proposal_sent: "Proposal გაგზავნილია",
      proposal_accepted: "თანხმობა — გადახდა მოსალოდნელია",
      active_collecting: "▶ მასალების შეგროვება",
      active_designing: "▶ დიზაინი",
      active_developing: "▶ დეველოპმენტი",
      active_review: "▶ მიმოხილვა",
      completed: "✅ დასრულებულია",
      cancelled: "❌ გაუქმებულია",
      lost: "❌ Lead დაიკარგა",
    };
    await admin.from("messages").insert({
      project_id: id,
      sender_id: user.id,
      sender_role: "admin",
      content: `სტატუსი: ${STATUS_LABELS[parsed.data.status] ?? parsed.data.status}`,
      is_system: true,
      is_internal: true,
    });

    // Auto-unlock the matching timeline step when entering an active phase
    const STATUS_TO_STEP: Record<string, number> = {
      active_collecting: 1,
      active_designing: 2,
      active_developing: 3,
      active_review: 4,
      completed: 999, // mark all completed
    };
    const targetStep = STATUS_TO_STEP[parsed.data.status];
    if (targetStep) {
      // Get existing steps
      const { data: steps } = await admin
        .from("project_timeline_steps")
        .select("id, step_order")
        .eq("project_id", id)
        .order("step_order", { ascending: true });

      if (steps && steps.length > 0) {
        if (targetStep === 999) {
          // Mark all as completed
          await admin.from("project_timeline_steps")
            .update({ status: "completed" })
            .eq("project_id", id);
        } else {
          // Mark steps before target as completed, target as active, rest locked
          for (const step of steps) {
            let newStatus: string;
            if (step.step_order < targetStep) newStatus = "completed";
            else if (step.step_order === targetStep) newStatus = "active";
            else newStatus = "locked";

            await admin.from("project_timeline_steps")
              .update({ status: newStatus })
              .eq("id", step.id);
          }
        }
      }
    }
  }

  return Response.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createServiceRoleClient();

  // 1. Fetch project to get client_user_id
  const { data: project, error: fetchErr } = await admin
    .from("projects")
    .select("id, client_user_id, company_id")
    .eq("id", id)
    .single();

  if (fetchErr || !project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // 2. Invalidate all onboard tokens for this project
  await admin
    .from("onboard_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("project_id", id);

  // 3. Remove client auth user's project_id from metadata
  //    and revoke their session so magic links stop working
  if (project.client_user_id) {
    // Check if user has other projects
    const { count } = await admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("client_user_id", project.client_user_id)
      .neq("id", id);

    if (!count || count === 0) {
      // No other projects — remove client role entirely
      await admin.auth.admin.updateUserById(project.client_user_id, {
        app_metadata: { role: null, project_id: null, company_id: null },
      });
    }
  }

  // 4. Delete project files from storage
  const { data: files } = await admin
    .from("project_files")
    .select("file_url")
    .eq("project_id", id);

  if (files && files.length > 0) {
    const paths = files
      .map((f) => {
        // Extract storage path from full URL
        const match = f.file_url?.match(/project-assets\/(.+)/);
        return match?.[1];
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await admin.storage.from("project-assets").remove(paths);
    }
  }

  // 5. Delete the project (cascades: messages, proposals, steps, files)
  const { error: deleteErr } = await admin
    .from("projects")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
