import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { z } from "zod";

const NoteSchema = z.object({
  company_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

/** Strip HTML tags to prevent stored XSS */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = NoteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const sanitizedBody = stripHtml(parsed.data.body).slice(0, 2000);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({
      company_id: parsed.data.company_id,
      body: sanitizedBody,
      author: "admin",
    })
    .select("id, body, author, created_at")
    .single();

  if (error) {
    console.error("lead_notes insert:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }

  return Response.json({ note: data });
}
