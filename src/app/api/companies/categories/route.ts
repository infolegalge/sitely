import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Fetch all records but only the category columns — Supabase doesn't support DISTINCT
  // Use pagination to avoid the 1000 row default limit
  const allCategories = new Set<string>();
  const allSourceCategories = new Set<string>();
  let from = 0;
  const step = 1000;
  let done = false;

  while (!done) {
    const { data } = await supabase
      .from("companies")
      .select("category, source_category")
      .range(from, from + step - 1);

    if (!data || data.length === 0) {
      done = true;
      break;
    }

    for (const row of data) {
      if (row.category) allCategories.add(row.category);
      if (row.source_category) allSourceCategories.add(row.source_category);
    }

    if (data.length < step) done = true;
    from += step;
  }

  return Response.json({
    categories: [...allCategories].sort(),
    source_categories: [...allSourceCategories].sort(),
  });
}
