import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Fetch client section batches (categories)
  const { data: batches, error } = await supabase
    .from("batches")
    .select("id, name, status, created_at")
    .eq("section", "clients")
    .order("name", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!batches || batches.length === 0) {
    return Response.json({ data: [] });
  }

  // Fetch demo stats per batch
  const batchIds = batches.map((b) => b.id);
  const { data: demos } = await supabase
    .from("demos")
    .select("id, batch_id, view_count")
    .in("batch_id", batchIds);

  const statsMap = new Map<string, { total_demos: number; viewed_count: number }>();
  for (const d of demos || []) {
    if (!d.batch_id) continue;
    const s = statsMap.get(d.batch_id) || { total_demos: 0, viewed_count: 0 };
    s.total_demos++;
    if (d.view_count > 0) s.viewed_count++;
    statsMap.set(d.batch_id, s);
  }

  const data = batches.map((b) => {
    const stats = statsMap.get(b.id) || { total_demos: 0, viewed_count: 0 };
    return {
      id: b.id,
      name: b.name,
      status: b.status,
      created_at: b.created_at,
      ...stats,
    };
  });

  return Response.json({ data });
}
