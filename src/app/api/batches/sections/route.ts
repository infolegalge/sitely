import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Fetch all section batches with demo counts
  const { data: batches, error } = await supabase
    .from("batches")
    .select("id, name, section, status, created_at")
    .not("section", "is", null)
    .order("name", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Group by section
  const sections: Record<string, { name: string; categories: { id: string; name: string; status: string; created_at: string }[] }> = {};

  for (const b of batches || []) {
    if (!b.section) continue;
    if (!sections[b.section]) {
      sections[b.section] = { name: b.section, categories: [] };
    }
    sections[b.section].categories.push({
      id: b.id,
      name: b.name,
      status: b.status,
      created_at: b.created_at,
    });
  }

  return Response.json({ data: sections });
}
