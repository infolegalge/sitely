import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  steps: z.array(z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(1000).nullish(),
    status: z.enum(["locked", "active", "completed"]).default("locked"),
  })).min(1).max(20),
});

const patchSchema = z.object({
  status: z.enum(["locked", "active", "completed"]),
});

async function assertAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "super_admin") return null;
  return user;
}

// POST — replace all steps for a project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();

  // Verify project exists
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  // Delete existing steps and replace
  await admin.from("project_timeline_steps").delete().eq("project_id", projectId);

  const rows = parsed.data.steps.map((step, i) => ({
    project_id: projectId,
    step_order: i + 1,
    title: step.title,
    description: step.description ?? null,
    status: step.status,
  }));

  const { error } = await admin.from("project_timeline_steps").insert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}

// PATCH — update a single step status (via sub-route pattern using searchParams)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const url = new URL(request.url);
  const stepId = url.searchParams.get("step_id");
  if (!stepId) return Response.json({ error: "step_id required" }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("project_timeline_steps")
    .update({ status: parsed.data.status })
    .eq("id", stepId)
    .eq("project_id", projectId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
