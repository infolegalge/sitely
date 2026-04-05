import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  content: z.string().max(5000).optional(),
  is_internal: z.boolean().default(false),
  // file fields (uploaded separately to Storage, URL passed here)
  file_url: z.string().url().optional(),
  file_name: z.string().max(500).optional(),
  file_type: z.string().max(100).optional(),
  file_size: z.number().int().positive().optional(),
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

  const { content, is_internal, file_url, file_name, file_type, file_size } = parsed.data;
  if (!content && !file_url) {
    return Response.json({ error: "content ან file_url სავალდებულოა" }, { status: 422 });
  }

  const admin = createServiceRoleClient();

  // Verify project exists
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      project_id: projectId,
      sender_id: user.id,
      sender_role: "admin",
      content: content ?? null,
      file_url: file_url ?? null,
      file_name: file_name ?? null,
      file_type: file_type ?? null,
      file_size: file_size ?? null,
      is_internal: is_internal,
      is_system: false,
      is_read: false,
    })
    .select("id, sender_role, content, file_url, file_name, file_type, is_internal, is_system, created_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // If file was attached and not internal, also register in project_files
  if (file_url && file_name && file_type && file_size && !is_internal) {
    const ext = file_name.split(".").pop()?.toLowerCase() ?? "";
    const category =
      ["png", "svg"].includes(ext) ? "logo" :
      ["jpg", "jpeg", "webp", "gif"].includes(ext) ? "photo" :
      ["pdf"].includes(ext) ? "document" : "general";

    await admin.from("project_files").insert({
      project_id: projectId,
      uploaded_by: user.id,
      file_url,
      file_name,
      file_type,
      file_size,
      category,
      message_id: msg.id,
    });
  }

  return Response.json({ success: true, message: msg });
}
