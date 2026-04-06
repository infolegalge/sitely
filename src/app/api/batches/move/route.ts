import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { demo_ids, section, category } = body as {
    demo_ids?: string[];
    section?: string;
    category?: string;
  };

  if (!demo_ids || !Array.isArray(demo_ids) || demo_ids.length === 0) {
    return Response.json({ error: "demo_ids is required" }, { status: 400 });
  }

  if (!section || typeof section !== "string") {
    return Response.json({ error: "section is required" }, { status: 400 });
  }

  if (!category || typeof category !== "string" || category.trim().length === 0) {
    return Response.json({ error: "category is required" }, { status: 400 });
  }

  const allowedSections = ["clients", "offers", "marketing"];
  if (!allowedSections.includes(section)) {
    return Response.json({ error: "Invalid section" }, { status: 400 });
  }

  if (category.length > 200) {
    return Response.json({ error: "category must be 200 chars or less" }, { status: 400 });
  }

  // Validate demo_ids are UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const id of demo_ids) {
    if (!uuidRegex.test(id)) {
      return Response.json({ error: "Invalid demo_id format" }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();
  const trimmedCategory = category.trim();

  // Find or create the target batch for this section + category
  const { data: existing } = await supabase
    .from("batches")
    .select("id")
    .eq("section", section)
    .eq("name", trimmedCategory)
    .single();

  let targetBatchId: string;

  if (existing) {
    targetBatchId = existing.id;
  } else {
    const { data: newBatch, error: createErr } = await supabase
      .from("batches")
      .insert({ name: trimmedCategory, section, status: "active" })
      .select("id")
      .single();

    if (createErr || !newBatch) {
      return Response.json({ error: "Failed to create category batch" }, { status: 500 });
    }
    targetBatchId = newBatch.id;
  }

  // Move demos to target batch
  const { error: moveErr, count } = await supabase
    .from("demos")
    .update({ batch_id: targetBatchId })
    .in("id", demo_ids);

  if (moveErr) {
    return Response.json({ error: moveErr.message }, { status: 500 });
  }

  return Response.json({
    data: {
      moved: count ?? demo_ids.length,
      target_batch_id: targetBatchId,
      category: trimmedCategory,
      section,
    },
  });
}
