import { describe, it, expect } from "vitest";
import { z } from "zod";

/* ─────────────────────────────────────────────────────────────────
 *  Re-create the Zod schemas from /api/tracking/route.ts
 *  so we can unit-test validation without importing Next.js internals.
 * ───────────────────────────────────────────────────────────────── */

const MAX_EXTRA_BYTES = 4096;

function validateExtra(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  const json = JSON.stringify(obj);
  if (json.length > MAX_EXTRA_BYTES) return false;
  function checkDepth(v: unknown, depth: number): boolean {
    if (depth > 2) return false;
    if (typeof v === "object" && v !== null) {
      for (const val of Object.values(v as Record<string, unknown>)) {
        if (!checkDepth(val, depth + 1)) return false;
      }
    }
    return true;
  }
  return checkDepth(obj, 0);
}

const EventSchema = z.object({
  event_type: z.enum([
    "page_open", "page_leave",
    "scroll_25", "scroll_50", "scroll_75", "scroll_100",
    "time_10s", "time_30s", "time_60s", "time_180s", "time_300s",
    "active_time_10s", "active_time_30s", "active_time_60s", "active_time_180s", "active_time_300s",
    "click_phone", "click_email", "click_cta", "click_sitely", "form_submit",
    "section_view", "interaction_3d",
    "form_start", "form_abandon", "rage_click",
    "web_vital", "js_error",
  ]),
  demo_id: z.union([z.string(), z.number()]).transform(String),
  hash: z.string().optional(),
  session_id: z.string().uuid().optional(),
  idempotency_key: z.string().max(128).optional(),
  page_url: z.string().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  user_agent: z.string().max(500).optional(),
  duration_ms: z.number().int().min(0).max(600000).optional(),
  scroll_depth: z.number().min(0).max(100).optional(),
  section_name: z.string().max(100).nullish(),
  interaction_type: z.string().max(50).nullish(),
  is_main_site: z.boolean().optional(),
  extra: z.record(z.string(), z.unknown()).optional().refine(
    (v) => validateExtra(v),
    { message: "Extra data exceeds 4KB or nesting depth > 2" }
  ),
});

const BatchSchema = z.object({
  events: z.array(EventSchema).min(1).max(50),
});

/* ── Helpers ── */

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_type: "page_open",
    demo_id: "28f3c61d-44a4-43a7-986c-f951173e752f",
    hash: "NOVA-L9WwimTebmm",
    session_id: "d14d45ef-ecee-44f1-96ba-709fa1c4bf67",
    idempotency_key: "d14d45ef_page_open_1234567890_abc1",
    page_url: "https://www.sitely.ge/demo/NOVA-L9WwimTebmm",
    referrer: "",
    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    ...overrides,
  };
}

/* ════════════════════════════════════════════════════════════
 *  1. EVENT SCHEMA — single event validation
 * ════════════════════════════════════════════════════════════ */

describe("EventSchema validation", () => {
  /* ── Valid payloads ── */

  it("accepts a minimal page_open event", () => {
    const result = EventSchema.safeParse(validEvent());
    expect(result.success).toBe(true);
  });

  it("accepts page_leave with duration_ms and scroll_depth", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "page_leave",
        duration_ms: 36773,
        scroll_depth: 79,
      })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration_ms).toBe(36773);
      expect(result.data.scroll_depth).toBe(79);
    }
  });

  it("accepts section_view with section_name", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "section_view",
        section_name: "aboutSec",
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts click_cta with extra href", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "click_cta",
        extra: { href: "https://sitely.ge/contact" },
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts web_vital with metric data", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "web_vital",
        extra: { metric: "LCP", value: 2500, unit: "ms" },
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts interaction_3d with interaction_type", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "interaction_3d",
        interaction_type: "3d_rotate",
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts js_error with error details", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "js_error",
        extra: {
          message: "TypeError: Cannot read property 'x' of undefined",
          source: "https://sitely.ge/demo/test.js",
          line: 42,
          col: 15,
          type: "runtime",
        },
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts rage_click event", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "rage_click",
        extra: { x: 100, y: 200, tag: "BUTTON", cls: "btn-primary" },
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts form_start event", () => {
    const result = EventSchema.safeParse(
      validEvent({
        event_type: "form_start",
        extra: { field: "email" },
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts form_abandon event", () => {
    const result = EventSchema.safeParse(
      validEvent({ event_type: "form_abandon" })
    );
    expect(result.success).toBe(true);
  });

  it("coerces numeric demo_id to string", () => {
    const result = EventSchema.safeParse(validEvent({ demo_id: 12345 }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.demo_id).toBe("12345");
    }
  });

  it("accepts all active_time milestones", () => {
    for (const s of ["10s", "30s", "60s", "180s", "300s"]) {
      const result = EventSchema.safeParse(
        validEvent({ event_type: `active_time_${s}` })
      );
      expect(result.success, `active_time_${s} should be valid`).toBe(true);
    }
  });

  it("accepts all scroll milestones", () => {
    for (const m of [25, 50, 75, 100]) {
      const result = EventSchema.safeParse(
        validEvent({ event_type: `scroll_${m}` })
      );
      expect(result.success, `scroll_${m} should be valid`).toBe(true);
    }
  });

  it("accepts all click types", () => {
    for (const t of ["click_phone", "click_email", "click_cta", "click_sitely"]) {
      const result = EventSchema.safeParse(validEvent({ event_type: t }));
      expect(result.success, `${t} should be valid`).toBe(true);
    }
  });

  /* ── Invalid payloads ── */

  it("rejects unknown event_type", () => {
    const result = EventSchema.safeParse(
      validEvent({ event_type: "page_click" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing event_type", () => {
    const { event_type: _, ...rest } = validEvent();
    const result = EventSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing demo_id", () => {
    const { demo_id: _, ...rest } = validEvent();
    const result = EventSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid session_id (not UUID)", () => {
    const result = EventSchema.safeParse(
      validEvent({ session_id: "not-a-uuid" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects duration_ms out of range", () => {
    const result = EventSchema.safeParse(
      validEvent({ event_type: "page_leave", duration_ms: 700000 })
    );
    expect(result.success).toBe(false);
  });

  it("rejects negative duration_ms", () => {
    const result = EventSchema.safeParse(
      validEvent({ event_type: "page_leave", duration_ms: -1 })
    );
    expect(result.success).toBe(false);
  });

  it("rejects scroll_depth > 100", () => {
    const result = EventSchema.safeParse(
      validEvent({ event_type: "page_leave", scroll_depth: 150 })
    );
    expect(result.success).toBe(false);
  });

  it("rejects page_url > 2000 chars", () => {
    const result = EventSchema.safeParse(
      validEvent({ page_url: "https://x.com/" + "a".repeat(2000) })
    );
    expect(result.success).toBe(false);
  });

  it("rejects user_agent > 500 chars", () => {
    const result = EventSchema.safeParse(
      validEvent({ user_agent: "X".repeat(501) })
    );
    expect(result.success).toBe(false);
  });

  it("rejects section_name > 100 chars", () => {
    const result = EventSchema.safeParse(
      validEvent({ section_name: "x".repeat(101) })
    );
    expect(result.success).toBe(false);
  });

  it("rejects idempotency_key > 128 chars", () => {
    const result = EventSchema.safeParse(
      validEvent({ idempotency_key: "k".repeat(129) })
    );
    expect(result.success).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════
 *  2. EXTRA FIELD — size & depth constraints
 * ════════════════════════════════════════════════════════════ */

describe("Extra field validation", () => {
  it("accepts null extra", () => {
    expect(validateExtra(null)).toBe(true);
  });

  it("accepts undefined extra", () => {
    expect(validateExtra(undefined)).toBe(true);
  });

  it("accepts a flat object within size limit", () => {
    expect(validateExtra({ key: "value", num: 42 })).toBe(true);
  });

  it("accepts depth-2 nesting", () => {
    expect(validateExtra({ device: { screen_w: 1920 } })).toBe(true);
  });

  it("rejects depth-3 nesting", () => {
    expect(validateExtra({ a: { b: { c: "too deep" } } })).toBe(false);
  });

  it("rejects extra > 4KB", () => {
    const big = { data: "x".repeat(5000) };
    expect(validateExtra(big)).toBe(false);
  });

  it("accepts extra at exactly 4KB boundary", () => {
    // JSON overhead for {"d":"..."}  = ~7 chars, so we need ~4089 chars of value
    const val = "x".repeat(4080);
    expect(validateExtra({ d: val })).toBe(true);
  });

  it("rejects event with oversized extra via schema", () => {
    const result = EventSchema.safeParse(
      validEvent({ extra: { huge: "z".repeat(5000) } })
    );
    expect(result.success).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════
 *  3. BATCH SCHEMA — array constraints
 * ════════════════════════════════════════════════════════════ */

describe("BatchSchema validation", () => {
  it("accepts a batch of 1 event", () => {
    const result = BatchSchema.safeParse({ events: [validEvent()] });
    expect(result.success).toBe(true);
  });

  it("accepts a batch of 50 events (max)", () => {
    const events = Array.from({ length: 50 }, (_, i) =>
      validEvent({
        idempotency_key: `key_${i}`,
        event_type: "section_view",
        section_name: `section_${i}`,
      })
    );
    const result = BatchSchema.safeParse({ events });
    expect(result.success).toBe(true);
  });

  it("rejects empty batch", () => {
    const result = BatchSchema.safeParse({ events: [] });
    expect(result.success).toBe(false);
  });

  it("rejects batch > 50 events", () => {
    const events = Array.from({ length: 51 }, () => validEvent());
    const result = BatchSchema.safeParse({ events });
    expect(result.success).toBe(false);
  });

  it("rejects batch with one invalid event", () => {
    const events = [validEvent(), validEvent({ event_type: "invalid_event" })];
    const result = BatchSchema.safeParse({ events });
    expect(result.success).toBe(false);
  });

  it("accepts mixed event types in batch", () => {
    const batch = BatchSchema.safeParse({
      events: [
        validEvent({ event_type: "page_open" }),
        validEvent({ event_type: "scroll_50", idempotency_key: "k2" }),
        validEvent({ event_type: "click_cta", idempotency_key: "k3" }),
        validEvent({
          event_type: "section_view",
          section_name: "hero",
          idempotency_key: "k4",
        }),
        validEvent({
          event_type: "page_leave",
          duration_ms: 15000,
          scroll_depth: 80,
          idempotency_key: "k5",
        }),
      ],
    });
    expect(batch.success).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════
 *  4. ENGAGEMENT WEIGHTS — scoring calculations
 * ════════════════════════════════════════════════════════════ */

describe("Engagement scoring", () => {
  const ENGAGEMENT_WEIGHTS: Record<string, number> = {
    scroll_25: 1, scroll_50: 2, scroll_75: 3, scroll_100: 5,
    time_10s: 1, time_30s: 2, time_60s: 4, time_180s: 8, time_300s: 12,
    active_time_10s: 1, active_time_30s: 2, active_time_60s: 4, active_time_180s: 8, active_time_300s: 12,
    click_phone: 15, click_email: 15, click_cta: 20, click_sitely: 10,
    form_submit: 50, form_start: 3, section_view: 2, interaction_3d: 5, web_vital: 0,
  };

  it("form_submit has highest weight (50)", () => {
    const maxEvent = Object.entries(ENGAGEMENT_WEIGHTS).sort(
      (a, b) => b[1] - a[1]
    )[0];
    expect(maxEvent[0]).toBe("form_submit");
    expect(maxEvent[1]).toBe(50);
  });

  it("click_cta has weight 20", () => {
    expect(ENGAGEMENT_WEIGHTS["click_cta"]).toBe(20);
  });

  it("web_vital has weight 0 (no score impact)", () => {
    expect(ENGAGEMENT_WEIGHTS["web_vital"]).toBe(0);
  });

  it("all trackable event types have defined weights", () => {
    const eventTypes = [
      "scroll_25", "scroll_50", "scroll_75", "scroll_100",
      "active_time_10s", "active_time_30s", "active_time_60s",
      "click_phone", "click_email", "click_cta", "click_sitely",
      "form_submit", "form_start", "section_view", "interaction_3d",
    ];
    for (const et of eventTypes) {
      expect(ENGAGEMENT_WEIGHTS[et], `${et} should have a weight`).toBeDefined();
      expect(ENGAGEMENT_WEIGHTS[et]).toBeGreaterThan(0);
    }
  });

  it("computes correct total score for a typical session", () => {
    const sessionEvents = [
      "page_open",       // not in weights → 0
      "scroll_25",       // 1
      "scroll_50",       // 2
      "active_time_10s", // 1
      "active_time_30s", // 2
      "section_view",    // 2
      "section_view",    // 2
      "click_cta",       // 20
      "page_leave",      // not in weights → 0
    ];

    let score = 0;
    for (const et of sessionEvents) {
      score += ENGAGEMENT_WEIGHTS[et] ?? 0;
    }

    expect(score).toBe(1 + 2 + 1 + 2 + 2 + 2 + 20); // 30
  });
});

/* ════════════════════════════════════════════════════════════
 *  5. VALIDATE-DATE-RANGE (imported directly)
 * ════════════════════════════════════════════════════════════ */

import { validateDateRange } from "@/lib/validate-date-range";

describe("validateDateRange", () => {
  it("both null → valid with null dates", () => {
    const r = validateDateRange(null, null);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.from).toBeNull();
      expect(r.to).toBeNull();
    }
  });

  it("valid 7-day range", () => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const r = validateDateRange(from, to);
    expect(r.valid).toBe(true);
  });

  it("rejects from without to", () => {
    const r = validateDateRange("2026-01-01", null);
    expect(r.valid).toBe(false);
  });

  it("rejects to without from", () => {
    const r = validateDateRange(null, "2026-01-01");
    expect(r.valid).toBe(false);
  });

  it("rejects from >= to", () => {
    const r = validateDateRange("2026-04-05", "2026-04-01");
    expect(r.valid).toBe(false);
  });

  it("rejects range > 365 days", () => {
    const r = validateDateRange("2024-01-01", "2026-04-05");
    expect(r.valid).toBe(false);
  });

  it("rejects invalid date strings", () => {
    const r = validateDateRange("not-a-date", "also-not");
    expect(r.valid).toBe(false);
  });
});
