import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Fetch batches with template name
  const { data: batches, error } = await supabase
    .from("batches")
    .select("id, name, description, status, template_id, created_at, updated_at, templates(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/batches]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!batches || batches.length === 0) {
    return Response.json({ data: [] });
  }

  // Fetch demo stats per batch in one query
  const batchIds = batches.map((b) => b.id);
  const { data: demos } = await supabase
    .from("demos")
    .select("id, batch_id, status, view_count, company_id")
    .in("batch_id", batchIds);

  // Build stats per batch
  const statsMap = new Map<string, {
    total_demos: number;
    total_sent: number;
    viewed_count: number;
  }>();

  for (const d of demos || []) {
    if (!d.batch_id) continue;
    const s = statsMap.get(d.batch_id) || { total_demos: 0, total_sent: 0, viewed_count: 0 };
    s.total_demos++;
    if (d.status === "sent" || d.status === "viewed") s.total_sent++;
    if (d.view_count > 0) s.viewed_count++;
    statsMap.set(d.batch_id, s);
  }

  const data = batches.map((b) => {
    const stats = statsMap.get(b.id) || { total_demos: 0, total_sent: 0, viewed_count: 0 };
    const tplArr = b.templates as unknown as { name: string }[] | null;
    const tpl = tplArr?.[0] ?? null;
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      status: b.status,
      template_id: b.template_id,
      template_name: tpl?.name || null,
      created_at: b.created_at,
      updated_at: b.updated_at,
      ...stats,
      engaged_count: 0,
      converted_count: 0,
    };
  });

  return Response.json({ data });
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, template_id } = body as {
    name?: string;
    description?: string;
    template_id?: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  if (name.length > 200) {
    return Response.json({ error: "name must be 200 chars or less" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const row: Record<string, unknown> = {
    name: name.trim(),
  };
  if (description) row.description = description.slice(0, 2000);
  if (template_id) row.template_id = template_id;

  const { data, error } = await supabase
    .from("batches")
    .insert(row)
    .select("id, name, description, template_id, status, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, description, status } = body as {
    id?: string;
    name?: string;
    description?: string;
    status?: string;
  };

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const allowed_statuses = ["active", "completed", "archived"];
  if (status && !allowed_statuses.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${allowed_statuses.join(", ")}` },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim().slice(0, 200);
  if (description !== undefined) updates.description = description.slice(0, 2000);
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("batches")
    .update(updates)
    .eq("id", id)
    .select("id, name, description, template_id, status, created_at, updated_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}
