import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const FEATURE_LABELS: Record<string, string> = {
  shop: "ონლაინ მაღაზია",
  booking: "ჯავშნების სისტემა",
  blog: "ბლოგი",
  design: "სრულიად განსხვავებული დიზაინი",
  other: "სხვა",
};

const schema = z.object({
  features: z.array(z.string().max(50)).min(1).max(10),
  budget: z.string().max(50).nullable(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (user.app_metadata?.role !== "client" && user.app_metadata?.role !== "super_admin")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const admin = createServiceRoleClient();

  // Find the client's project
  const companyId = user.app_metadata?.company_id;
  if (!companyId) {
    return Response.json({ error: "No project found" }, { status: 404 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    return Response.json({ error: "No project found" }, { status: 404 });
  }

  const { features, budget } = parsed.data;
  const featureLabels = features.map((f) => FEATURE_LABELS[f] || f).join(", ");
  const budgetText = budget ? ` | ბიუჯეტი: ${budget}` : "";

  // Save as a system message visible to admin
  await admin.from("messages").insert({
    project_id: project.id,
    sender_id: user.id,
    sender_role: "client",
    content: `📋 კასტომიზაციის მოთხოვნა:\nფუნქციონალი: ${featureLabels}${budgetText}`,
    is_system: true,
    is_internal: false,
  });

  return Response.json({ success: true });
}
