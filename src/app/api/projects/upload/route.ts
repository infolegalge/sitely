import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  project_id: z.string().uuid(),
});

// Admin uploads a file to project-assets bucket on behalf of a project
// Body: multipart/form-data with field "file"
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("project_id") as string | null;

  if (!file || !projectId) {
    return Response.json({ error: "file და project_id სავალდებულოა" }, { status: 400 });
  }

  const validation = schema.safeParse({ project_id: projectId });
  if (!validation.success) {
    return Response.json({ error: "Invalid project_id" }, { status: 422 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "ფაილი მაქსიმუმ 10MB" }, { status: 413 });
  }

  const admin = createServiceRoleClient();

  // Verify project exists
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${projectId}/${Date.now()}_${sanitizedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from("project-assets")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("project-assets")
    .getPublicUrl(path);

  return Response.json({
    success: true,
    file_url: urlData.publicUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    path,
  });
}
