import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { z } from "zod";

const sendSchema = z.object({
  content: z.string().min(1).max(4000).optional(),
  file_url: z.string().url().optional(),
  file_name: z.string().max(255).optional(),
  file_type: z.string().max(100).optional(),
  file_size: z.number().int().positive().optional(),
}).refine((d) => d.content || d.file_url, {
  message: "content ან file_url სავალდებულოა",
});

// ─── GET: fetch messages for the authenticated client ─────────────────────────
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "client") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = user.app_metadata?.project_id as string | undefined;
  if (!projectId) {
    return Response.json({ error: "No project linked" }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // Fetch all non-internal messages
  const { data: messages, error } = await admin
    .from("messages")
    .select("id, sender_role, content, file_url, file_name, file_type, file_size, is_read, is_system, created_at")
    .eq("project_id", projectId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Mark admin messages as read by the client
  await admin
    .from("messages")
    .update({ is_read: true })
    .eq("project_id", projectId)
    .eq("sender_role", "admin")
    .eq("is_read", false)
    .eq("is_internal", false);

  return Response.json({ messages: messages ?? [] });
}

// ─── POST: client sends a message ─────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "client") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = user.app_metadata?.project_id as string | undefined;
  if (!projectId) {
    return Response.json({ error: "No project linked" }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();

  const { data: message, error } = await admin
    .from("messages")
    .insert({
      project_id: projectId,
      sender_id: user.id,
      sender_role: "client",
      content: parsed.data.content ?? null,
      file_url: parsed.data.file_url ?? null,
      file_name: parsed.data.file_name ?? null,
      file_type: parsed.data.file_type ?? null,
      file_size: parsed.data.file_size ?? null,
      is_read: false,
      is_system: false,
      is_internal: false,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Trigger delayed offline email notification to admin
  await inngest.send({
    name: "portal/message.sent",
    data: {
      message_id: message.id,
      project_id: projectId,
      sender_name: user.user_metadata?.name ?? "კლიენტი",
    },
  });

  return Response.json({ success: true, message_id: message.id });
}
