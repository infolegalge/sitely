import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// Client-side file upload — uses user's session to enforce ownership
// The service role is used only to do the actual bucket upload after
// server-side ownership verification (avoids needing storage JWTs on the client).
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "client") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = user.app_metadata?.project_id as string | undefined;
  if (!projectId) {
    return Response.json({ error: "No project linked to this account" }, { status: 400 });
  }

  // Validate project_id is a UUID
  const uuidParse = z.string().uuid().safeParse(projectId);
  if (!uuidParse.success) {
    return Response.json({ error: "Invalid project" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "file სავალდებულოა" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "ფაილი მაქსიმუმ 10MB" }, { status: 413 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "ფაილის ტიპი დაუშვებელია" }, { status: 415 });
  }

  const admin = createServiceRoleClient();

  // Verify the project actually belongs to this user (defence in depth beyond RLS)
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("client_user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
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

  // Generate a signed URL (bucket is private — signed URLs expire in 7 days)
  const { data: signed, error: signedError } = await admin.storage
    .from("project-assets")
    .createSignedUrl(path, 365 * 24 * 60 * 60); // 365 days

  if (signedError || !signed) {
    return Response.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  // Register file in project_files table for CMS visibility
  await admin.from("project_files").insert({
    project_id: projectId,
    uploaded_by: user.id,
    file_url: signed.signedUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    category: inferCategory(file.type, file.name),
  });

  return Response.json({
    success: true,
    file_url: signed.signedUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    path,
  });
}

function inferCategory(mimeType: string, name: string): string {
  if (mimeType.startsWith("image/")) {
    if (/logo/i.test(name)) return "logo";
    return "photo";
  }
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("word") || mimeType.includes("excel")) return "document";
  return "general";
}
