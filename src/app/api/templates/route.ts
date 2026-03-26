import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("templates")
    .select("id, name, description, industry, thumbnail_url, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { name, description, industry, thumbnail_url, html_content, fallback_images } = body;

  if (!name || !industry || !html_content) {
    return Response.json(
      { error: "name, industry, and html_content are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("templates")
    .insert({
      name,
      description: description || null,
      industry,
      thumbnail_url: thumbnail_url || null,
      html_content,
      fallback_images: fallback_images || [],
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
