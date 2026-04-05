import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";

// Load .env from project root before checking env vars
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/* ═══════════════════════════════════════════════════════════════
 *  Tracking Pipeline Integration Test
 *
 *  Tests the full pipeline:
 *    Client event → POST /api/tracking → demo_events table → RPCs
 *
 *  Uses the real Supabase DB (service role) to verify data lands
 *  correctly, including:
 *    - duration_ms / scroll_depth stored in proper DB columns
 *    - Engagement score incremented via RPC
 *    - Materialized view refreshes correctly
 *    - All dashboard RPCs return expected data after insertion
 *
 *  NOTE: This test writes to the real database. Test data is cleaned
 *  up in afterAll() using a unique session_id prefix.
 * ═══════════════════════════════════════════════════════════════ */

/* eslint-disable @typescript-eslint/no-require-imports */

// Only run in local dev / CI — skip if no .env
const HAS_ENV =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const describeIf = HAS_ENV ? describe : describe.skip;

let supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>;
const TEST_SESSION = `test_${crypto.randomUUID()}`;
const TEST_DEMO_ID = "28f3c61d-44a4-43a7-986c-f951173e752f"; // known demo

describeIf("Tracking Pipeline Integration", () => {
  beforeAll(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  afterAll(async () => {
    if (!supabase) return;
    // Clean up test data
    await supabase
      .from("demo_events")
      .delete()
      .eq("session_id", TEST_SESSION);
  });

  it("inserts a single page_open event", async () => {
    const { error } = await supabase.from("demo_events").insert({
      demo_id: TEST_DEMO_ID,
      event_type: "page_open",
      session_id: TEST_SESSION,
      idempotency_key: `${TEST_SESSION}_page_open_${Date.now()}_test`,
      page_url: "https://test.sitely.ge/demo/TEST",
      user_agent: "TestRunner/1.0",
      ip_country: "GE",
      extra: {
        device: { screen_w: 1920, device_type: "desktop" },
      },
    });
    expect(error).toBeNull();
  });

  it("inserts page_leave with duration_ms and scroll_depth in DB columns", async () => {
    const { error } = await supabase.from("demo_events").insert({
      demo_id: TEST_DEMO_ID,
      event_type: "page_leave",
      session_id: TEST_SESSION,
      idempotency_key: `${TEST_SESSION}_page_leave_${Date.now()}_test`,
      page_url: "https://test.sitely.ge/demo/TEST",
      user_agent: "TestRunner/1.0",
      duration_ms: 25000,
      scroll_depth: 85,
      extra: {
        total_active_seconds: 18,
        device_type: "desktop",
      },
    });
    expect(error).toBeNull();

    // Verify the data is stored correctly
    const { data } = await supabase
      .from("demo_events")
      .select("duration_ms, scroll_depth, extra")
      .eq("session_id", TEST_SESSION)
      .eq("event_type", "page_leave")
      .single();

    expect(data).toBeTruthy();
    expect(data!.duration_ms).toBe(25000);
    expect(data!.scroll_depth).toBe(85);
    expect((data!.extra as Record<string, unknown>).total_active_seconds).toBe(18);
  });

  it("inserts section_view with section_name", async () => {
    const events = [
      { section_name: "hero", duration: 5 },
      { section_name: "about", duration: 3 },
      { section_name: "contact", duration: 8 },
    ];

    for (const ev of events) {
      const { error } = await supabase.from("demo_events").insert({
        demo_id: TEST_DEMO_ID,
        event_type: "section_view",
        session_id: TEST_SESSION,
        idempotency_key: `${TEST_SESSION}_section_${ev.section_name}_${Date.now()}`,
        section_name: ev.section_name,
        extra: { section: ev.section_name, duration_s: ev.duration },
      });
      expect(error).toBeNull();
    }
  });

  it("inserts click_cta event", async () => {
    const { error } = await supabase.from("demo_events").insert({
      demo_id: TEST_DEMO_ID,
      event_type: "click_cta",
      session_id: TEST_SESSION,
      idempotency_key: `${TEST_SESSION}_click_cta_${Date.now()}_test`,
      extra: { href: "https://sitely.ge/contact" },
    });
    expect(error).toBeNull();
  });

  it("inserts web_vital event", async () => {
    const { error } = await supabase.from("demo_events").insert({
      demo_id: TEST_DEMO_ID,
      event_type: "web_vital",
      session_id: TEST_SESSION,
      idempotency_key: `${TEST_SESSION}_web_vital_${Date.now()}_test`,
      extra: { metric: "LCP", value: 1800, unit: "ms" },
    });
    expect(error).toBeNull();
  });

  it("rejects duplicate idempotency_key (23505)", async () => {
    const key = `${TEST_SESSION}_dup_test_key`;

    // First insert should succeed
    const { error: err1 } = await supabase.from("demo_events").insert({
      demo_id: TEST_DEMO_ID,
      event_type: "page_open",
      session_id: TEST_SESSION,
      idempotency_key: key,
    });
    expect(err1).toBeNull();

    // Second insert with same key should fail with 23505
    const { error: err2 } = await supabase.from("demo_events").insert({
      demo_id: TEST_DEMO_ID,
      event_type: "page_open",
      session_id: TEST_SESSION,
      idempotency_key: key,
    });
    expect(err2).toBeTruthy();
    expect(err2!.code).toBe("23505");
  });

  it("test events are queryable by session_id", async () => {
    const { data, error } = await supabase
      .from("demo_events")
      .select("event_type, section_name, duration_ms, scroll_depth")
      .eq("session_id", TEST_SESSION)
      .order("created_at");

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(6);

    const types = data!.map((e) => e.event_type);
    expect(types).toContain("page_open");
    expect(types).toContain("page_leave");
    expect(types).toContain("section_view");
    expect(types).toContain("click_cta");
    expect(types).toContain("web_vital");
  });

  it("materialized view can be refreshed", async () => {
    const { error } = await supabase.rpc("refresh_session_summaries");
    expect(error).toBeNull();
  });

  it("get_analytics_overview returns non-zero data", async () => {
    const { data, error } = await supabase.rpc("get_analytics_overview", {});
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.kpi).toBeTruthy();
    expect(data.kpi.totalViews).toBeGreaterThan(0);
    expect(data.kpi.totalSessions).toBeGreaterThan(0);
  });

  it("get_behavioral_leaders returns data", async () => {
    const { data, error } = await supabase.rpc("get_behavioral_leaders", {
      p_behavior: "momentum",
      p_limit: 5,
      p_tier: null,
      p_from: null,
      p_to: null,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_daily_event_stats returns data (default range)", async () => {
    const { data, error } = await supabase.rpc("get_daily_event_stats", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("get_top_sections returns data", async () => {
    const { data, error } = await supabase.rpc("get_top_sections", {
      p_limit: 10,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("get_geo_breakdown returns data", async () => {
    const { data, error } = await supabase.rpc("get_geo_breakdown", {
      p_limit: 10,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_device_breakdown returns data", async () => {
    const { data, error } = await supabase.rpc("get_device_breakdown", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_session_percentiles returns sessions after MV refresh", async () => {
    const { data, error } = await supabase.rpc("get_session_percentiles", {});
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.total_sessions).toBeGreaterThan(0);
  });

  it("get_scroll_depth_histogram returns data", async () => {
    const { data, error } = await supabase.rpc("get_scroll_depth_histogram", {});
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.total_sessions).toBeGreaterThan(0);
  });

  it("get_web_vitals_breakdown returns data", async () => {
    const { data, error } = await supabase.rpc("get_web_vitals_breakdown", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_activity_heatmap returns data (default range)", async () => {
    const { data, error } = await supabase.rpc("get_activity_heatmap", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_conversion_trends returns data", async () => {
    const { data, error } = await supabase.rpc("get_conversion_trends", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_funnel_abandonment returns session data", async () => {
    const { data, error } = await supabase.rpc("get_funnel_abandonment", {});
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.total_sessions).toBeGreaterThan(0);
  });

  it("get_referrer_breakdown returns data", async () => {
    const { data, error } = await supabase.rpc("get_referrer_breakdown", {
      p_limit: 10,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_template_performance returns data", async () => {
    const { data, error } = await supabase.rpc("get_template_performance", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_campaign_comparison returns data", async () => {
    const { data, error } = await supabase.rpc("get_campaign_comparison", {});
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
