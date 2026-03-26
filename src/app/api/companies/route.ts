import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  const tier = url.searchParams.get("tier");
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const sourceCategory = url.searchParams.get("source_category");
  const hasEmail = url.searchParams.get("has_email");
  const hasWebsite = url.searchParams.get("has_website");
  const ratingMin = url.searchParams.get("rating_min");
  const ratingMax = url.searchParams.get("rating_max");
  const scoreMin = url.searchParams.get("score_min");
  const scoreMax = url.searchParams.get("score_max");
  const q = url.searchParams.get("q");
  const sort = url.searchParams.get("sort") || "score";
  const order = url.searchParams.get("order") || "desc";

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("companies")
    .select(
      "id, yell_id, name, slug, tier, tier_label, score, email, phone, website, address, category, categories, source_category, rating, reviews_count, status, gm_place_id, created_at, updated_at",
      { count: "exact" }
    );

  // Full-Text Search
  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "simple",
    });
  }

  // Filters
  if (tier) query = query.eq("tier", parseInt(tier));
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (sourceCategory) query = query.eq("source_category", sourceCategory);

  if (hasEmail === "true") query = query.not("email", "is", null);
  if (hasEmail === "false") query = query.is("email", null);

  if (hasWebsite === "true") query = query.not("website", "is", null).neq("website", "");
  if (hasWebsite === "false") query = query.or("website.is.null,website.eq.");

  if (ratingMin) query = query.gte("rating", parseFloat(ratingMin));
  if (ratingMax) query = query.lte("rating", parseFloat(ratingMax));
  if (scoreMin) query = query.gte("score", parseInt(scoreMin));
  if (scoreMax) query = query.lte("score", parseInt(scoreMax));

  // Sorting
  const ascending = order === "asc";
  const validSorts = ["name", "tier", "score", "rating", "reviews_count", "status", "created_at", "updated_at"];
  const sortColumn = validSorts.includes(sort) ? sort : "score";
  query = query.order(sortColumn, { ascending, nullsFirst: false });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
