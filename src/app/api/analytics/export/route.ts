import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth";
import { validateDateRange } from "@/lib/validate-date-range";
import { NextRequest } from "next/server";

const MAX_EXPORT_ROWS = 5000;

function escapeCsv(val: unknown): string {
  let s = String(val ?? "");
  // Prevent CSV formula injection: prefix dangerous chars with a single quote
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl;
  const type = url.searchParams.get("type") || "leads";
  const dateResult = validateDateRange(
    url.searchParams.get("from"),
    url.searchParams.get("to")
  );
  if (!dateResult.valid) {
    return Response.json({ error: dateResult.error }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (type === "leads") {
    const { data, error } = await supabase.rpc("get_behavioral_leaders", {
      p_behavior: "momentum",
      p_limit: 1000,
      p_tier: null,
      ...(dateResult.from && { p_from: dateResult.from }),
      ...(dateResult.to && { p_to: dateResult.to }),
    });
    if (error) {
      return Response.json({ error: "Failed" }, { status: 500 });
    }

    const headers = [
      "კომპანია", "კატეგორია", "Tier", "Momentum Score", "Alltime Score",
      "სესიები", "აქტიური დრო (წმ)", "ბოლო აქტივობა", "სტატუსი",
      "ფავორიტი", "საიტზე ვიზიტი", "ტოპ სექცია",
    ];
    const rows = (data ?? []).map((lead: Record<string, unknown>) => [
      escapeCsv(lead.name),
      escapeCsv(lead.category),
      escapeCsv(lead.tier),
      escapeCsv(lead.momentum_score),
      escapeCsv(lead.alltime_score),
      escapeCsv(lead.total_sessions),
      escapeCsv(lead.total_active_s),
      escapeCsv(lead.last_activity),
      escapeCsv(lead.sales_status),
      escapeCsv(lead.is_favorite),
      escapeCsv(lead.visited_main_site),
      escapeCsv(lead.top_section),
    ]);

    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "events") {
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "1000") || 1000, 1),
      MAX_EXPORT_ROWS
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0") || 0, 0);

    const query = supabase
      .from("demo_events")
      .select("event_type, session_id, page_url, referrer, user_agent, duration_ms, scroll_depth, section_name, interaction_type, is_main_site, ip_country, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (dateResult.from) query.gte("created_at", dateResult.from);
    if (dateResult.to) query.lte("created_at", dateResult.to);

    const { data, error } = await query;
    if (error) {
      return Response.json({ error: "Failed" }, { status: 500 });
    }

    const headers = [
      "ივენთი", "სესია", "URL", "რეფერერი", "User Agent",
      "ხანგრძლ. (ms)", "სქროლი %", "სექცია", "ინტერაქცია",
      "მთავარი საიტი", "ქვეყანა", "თარიღი",
    ];
    const rows = (data ?? []).map((ev: Record<string, unknown>) => [
      escapeCsv(ev.event_type),
      escapeCsv(ev.session_id),
      escapeCsv(ev.page_url),
      escapeCsv(ev.referrer),
      escapeCsv(ev.user_agent),
      escapeCsv(ev.duration_ms),
      escapeCsv(ev.scroll_depth),
      escapeCsv(ev.section_name),
      escapeCsv(ev.interaction_type),
      escapeCsv(ev.is_main_site),
      escapeCsv(ev.ip_country),
      escapeCsv(ev.created_at),
    ]);

    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="events-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return Response.json({ error: "Invalid type. Use 'leads' or 'events'" }, { status: 400 });
}
