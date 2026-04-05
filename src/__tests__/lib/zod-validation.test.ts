import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the schemas from the tracking route for unit testing
const EventSchema = z.object({
  event_type: z.enum([
    "page_open", "page_leave",
    "scroll_25", "scroll_50", "scroll_75", "scroll_100",
    "time_10s", "time_30s", "time_60s", "time_180s", "time_300s",
    "active_time_10s", "active_time_30s", "active_time_60s", "active_time_180s", "active_time_300s",
    "click_phone", "click_email", "click_cta", "click_sitely", "form_submit",
  ]),
  demo_id: z.union([z.string(), z.number()]),
  hash: z.string().optional(),
  session_id: z.string().uuid().optional(),
  page_url: z.string().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  user_agent: z.string().max(500).optional(),
  duration_ms: z.number().int().min(0).max(600000).optional(),
  scroll_depth: z.number().min(0).max(100).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

const BatchSchema = z.object({
  events: z.array(EventSchema).min(1).max(50),
});

describe("Zod validation — EventSchema", () => {
  it("accepts a valid single event", () => {
    const result = EventSchema.safeParse({
      event_type: "page_open",
      demo_id: "123",
      session_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown event_type", () => {
    const result = EventSchema.safeParse({
      event_type: "hacked_event",
      demo_id: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing demo_id", () => {
    const result = EventSchema.safeParse({
      event_type: "page_open",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration_ms", () => {
    const result = EventSchema.safeParse({
      event_type: "page_leave",
      demo_id: "1",
      duration_ms: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration_ms > 600000", () => {
    const result = EventSchema.safeParse({
      event_type: "page_leave",
      demo_id: "1",
      duration_ms: 999999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects scroll_depth > 100", () => {
    const result = EventSchema.safeParse({
      event_type: "scroll_50",
      demo_id: "1",
      scroll_depth: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects scroll_depth < 0", () => {
    const result = EventSchema.safeParse({
      event_type: "scroll_50",
      demo_id: "1",
      scroll_depth: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID session_id", () => {
    const result = EventSchema.safeParse({
      event_type: "page_open",
      demo_id: "1",
      session_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts numeric demo_id", () => {
    const result = EventSchema.safeParse({
      event_type: "page_open",
      demo_id: 42,
    });
    expect(result.success).toBe(true);
  });

  it("rejects page_url longer than 2000 chars", () => {
    const result = EventSchema.safeParse({
      event_type: "page_open",
      demo_id: "1",
      page_url: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("Zod validation — BatchSchema", () => {
  it("accepts a batch of valid events", () => {
    const result = BatchSchema.safeParse({
      events: [
        { event_type: "page_open", demo_id: "1" },
        { event_type: "scroll_25", demo_id: "1", scroll_depth: 25 },
        { event_type: "time_10s", demo_id: "1" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty events array", () => {
    const result = BatchSchema.safeParse({ events: [] });
    expect(result.success).toBe(false);
  });

  it("rejects batch with more than 50 events", () => {
    const events = Array.from({ length: 51 }, () => ({
      event_type: "page_open",
      demo_id: "1",
    }));
    const result = BatchSchema.safeParse({ events });
    expect(result.success).toBe(false);
  });

  it("rejects batch with one invalid event", () => {
    const result = BatchSchema.safeParse({
      events: [
        { event_type: "page_open", demo_id: "1" },
        { event_type: "INVALID", demo_id: "1" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
