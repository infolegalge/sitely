import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const FEATURE_LABELS: Record<string, string> = {
  shop: "პროდუქტების გაყიდვა (ონლაინ მაღაზია)",
  booking: "ჯავშნების მიღება",
  blog: "სიახლეები / ბლოგი",
  cms: "კონტენტის თავად მართვა",
  multilang: "მრავალენოვანი საიტი",
  chat: "ონლაინ ჩატი",
  design: "სრულად ახალი დიზაინი",
  other: "სხვა",
};

const TIMELINE_LABELS: Record<string, string> = {
  standard: "სტანდარტული (2-4 კვირა)",
  urgent: "სასწრაფო (1-2 კვირა)",
  flexible: "მოქნილი",
};

const CALL_TIME_LABELS: Record<string, string> = {
  morning: "დილა (10:00-13:00)",
  afternoon: "შუადღე (13:00-17:00)",
  evening: "საღამო (17:00-20:00)",
};

const schema = z.object({
  features: z.array(z.string().max(50)).min(1).max(10),
  otherText: z.string().max(200).nullable(),
  budget: z.string().max(50).nullable(),
  timeline: z.string().max(50).nullable(),
  phone: z.string().max(20).nullable(),
  callTime: z.string().max(50).nullable(),
  note: z.string().max(500).nullable(),
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

  const { features, otherText, budget, timeline, phone, callTime, note } = parsed.data;
  const featureLabels = features.map((f) => FEATURE_LABELS[f] || f).join(", ");
  const otherLine = otherText ? `\n  სხვა დეტალი: ${otherText}` : "";
  const budgetLine = budget
    ? `\nბიუჯეტი: ${budget === "unsure" ? "ჯერ არ არის დარწმუნებული" : budget}`
    : "";
  const timelineLine = timeline ? `\nვადა: ${TIMELINE_LABELS[timeline] || timeline}` : "";
  const phoneLine = phone ? `\nტელეფონი: ${phone}` : "";
  const callTimeLine = callTime
    ? `\nდარეკვის დრო: ${CALL_TIME_LABELS[callTime] || callTime}`
    : "";
  const noteLine = note ? `\nკომენტარი: ${note}` : "";

  const content = [
    `კასტომიზაციის მოთხოვნა:`,
    `ფუნქციონალი: ${featureLabels}${otherLine}`,
    budgetLine,
    timelineLine,
    phoneLine,
    callTimeLine,
    noteLine,
  ]
    .filter(Boolean)
    .join("\n");

  // Save as a system message visible to admin
  await admin.from("messages").insert({
    project_id: project.id,
    sender_id: user.id,
    sender_role: "client",
    content,
    is_system: true,
    is_internal: false,
  });

  return Response.json({ success: true });
}
