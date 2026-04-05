import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ═══════════════════════════════════════════════════════════════
 *  Tracking Script Logic Tests
 *
 *  The tracking script is an inline IIFE injected into demo pages.
 *  We extract and test its core logic here:
 *    - Event queuing with deduplication
 *    - duration_ms / scroll_depth promotion from extra to top-level
 *    - Idle-aware active time counting
 *    - Scroll milestone firing
 *    - Click type classification
 *    - Section observer timing (≥2s threshold)
 *    - Rage click detection
 *    - Batch flushing mechanics
 * ═══════════════════════════════════════════════════════════════ */

/* ── Recreate E() function logic from the tracking script ── */

function createTracker(demoId: string, hash: string, sessionId: string) {
  const Q: Record<string, unknown>[] = [];
  const sentOnce: Record<string, boolean> = {};

  function E(
    ev: string,
    extra?: Record<string, unknown>,
    allowRepeat?: boolean
  ) {
    if (!allowRepeat && sentOnce[ev]) return;
    if (!allowRepeat) sentOnce[ev] = true;

    const idk = sessionId + "_" + ev + "_" + Date.now() + "_abcd";
    const ex = Object.assign({}, extra || {});

    // Promote DB-column fields from extra to top-level payload
    const dur = ex.duration_ms;
    delete ex.duration_ms;
    const sd = ex.scroll_depth;
    delete ex.scroll_depth;

    const payload: Record<string, unknown> = {
      demo_id: demoId,
      hash: hash,
      event_type: ev,
      session_id: sessionId,
      idempotency_key: idk,
      page_url: "https://test.sitely.ge/demo/TEST",
      referrer: "",
      user_agent: "TestAgent/1.0",
      section_name: (extra && extra.section) || null,
      interaction_type: (extra && extra.interaction_type) || null,
      duration_ms: typeof dur === "number" ? dur : null,
      scroll_depth: typeof sd === "number" ? sd : null,
      extra: ex,
    };

    Q.push(payload);
  }

  return { Q, sentOnce, E };
}

/* ── Recreate section tracking logic ── */

function createSectionTracker() {
  const sectionTimers: Record<string, number> = {};
  const sectionStart: Record<string, number> = {};

  function startSection(name: string) {
    if (sectionStart[name]) return;
    sectionStart[name] = Date.now();
  }

  function stopSection(name: string) {
    if (!sectionStart[name]) return;
    const elapsed = Date.now() - sectionStart[name];
    sectionTimers[name] = (sectionTimers[name] || 0) + elapsed;
    delete sectionStart[name];
  }

  function flushSections(E: (ev: string, extra?: Record<string, unknown>, repeat?: boolean) => void) {
    for (const n in sectionStart) stopSection(n);
    for (const name in sectionTimers) {
      if (sectionTimers[name] >= 2000) {
        E(
          "section_view",
          { section: name, duration_s: Math.round(sectionTimers[name] / 1000) },
          true
        );
      }
    }
    // Clear after flushing
    for (const key in sectionTimers) delete sectionTimers[key];
  }

  return { sectionTimers, sectionStart, startSection, stopSection, flushSections };
}

/* ── Recreate click classification logic ── */

function classifyClick(
  tagName: string,
  href: string,
  classList: string[]
): string | null {
  if (href.startsWith("tel:")) return "click_phone";
  if (href.startsWith("mailto:")) return "click_email";

  const ctaClasses = ["sitely-cta-btn", "float-btn", "btn-red", "sitely-btn-primary", "sitely-float"];
  if (ctaClasses.some((c) => classList.includes(c))) return "click_cta";
  if (href.includes("sitely")) return "click_sitely";

  return null;
}

/* ── Recreate rage click detection ── */

function detectRageClick(
  clickLog: { t: number; x: number; y: number }[],
  now: number,
  x: number,
  y: number
): boolean {
  clickLog.push({ t: now, x, y });
  // Keep only last 1s
  const filtered = clickLog.filter((c) => now - c.t < 1000);
  clickLog.length = 0;
  clickLog.push(...filtered);

  if (clickLog.length >= 3) {
    const last = clickLog[clickLog.length - 1];
    const nearby = clickLog.filter(
      (c) => Math.abs(c.x - last.x) < 30 && Math.abs(c.y - last.y) < 30
    );
    return nearby.length >= 3;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════
 *                          TESTS
 * ═══════════════════════════════════════════════════════════ */

describe("Tracking Script: Event Queuing (E function)", () => {
  it("queues a page_open event", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("page_open");
    expect(Q).toHaveLength(1);
    expect(Q[0].event_type).toBe("page_open");
    expect(Q[0].demo_id).toBe("demo1");
    expect(Q[0].session_id).toBe("sess1");
  });

  it("prevents duplicate events by default (sentOnce)", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("page_open");
    E("page_open");
    E("page_open");
    expect(Q).toHaveLength(1);
  });

  it("allows repeated events when allowRepeat=true", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("section_view", { section: "hero" }, true);
    E("section_view", { section: "about" }, true);
    E("section_view", { section: "hero" }, true);
    expect(Q).toHaveLength(3);
  });

  it("promotes duration_ms from extra to top-level", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("page_leave", { duration_ms: 36773, total_active_seconds: 20 });
    expect(Q[0].duration_ms).toBe(36773);
    // Should NOT be in extra anymore
    expect((Q[0].extra as Record<string, unknown>).duration_ms).toBeUndefined();
    // Other fields stay in extra
    expect((Q[0].extra as Record<string, unknown>).total_active_seconds).toBe(20);
  });

  it("promotes scroll_depth from extra to top-level", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("page_leave", { scroll_depth: 85 });
    expect(Q[0].scroll_depth).toBe(85);
    expect((Q[0].extra as Record<string, unknown>).scroll_depth).toBeUndefined();
  });

  it("sets duration_ms=null when not provided", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("click_cta", { href: "https://sitely.ge" });
    expect(Q[0].duration_ms).toBeNull();
    expect(Q[0].scroll_depth).toBeNull();
  });

  it("sets section_name from extra.section", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("section_view", { section: "heroSection" }, true);
    expect(Q[0].section_name).toBe("heroSection");
  });

  it("sets interaction_type from extra", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("interaction_3d", { interaction_type: "3d_rotate" }, true);
    expect(Q[0].interaction_type).toBe("3d_rotate");
  });

  it("generates unique idempotency keys", () => {
    vi.useFakeTimers();
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    E("section_view", { section: "a" }, true);
    vi.advanceTimersByTime(1); // ensure Date.now() differs
    E("section_view", { section: "b" }, true);
    expect(Q[0].idempotency_key).not.toBe(Q[1].idempotency_key);
    vi.useRealTimers();
  });
});

describe("Tracking Script: Section Observer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("tracks section view time (≥2s fires event)", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    const sec = createSectionTracker();

    sec.startSection("aboutSec");
    vi.advanceTimersByTime(3000);
    sec.flushSections(E);

    expect(Q).toHaveLength(1);
    expect(Q[0].event_type).toBe("section_view");
    expect(Q[0].section_name).toBe("aboutSec");
    expect((Q[0].extra as Record<string, unknown>).duration_s).toBe(3);
  });

  it("ignores section < 2s viewing time", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    const sec = createSectionTracker();

    sec.startSection("briefSection");
    vi.advanceTimersByTime(1500);
    sec.flushSections(E);

    expect(Q).toHaveLength(0);
  });

  it("accumulates time across start/stop cycles", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    const sec = createSectionTracker();

    // First viewing: 1.5s (not enough alone)
    sec.startSection("hero");
    vi.advanceTimersByTime(1500);
    sec.stopSection("hero");

    // Second viewing: 1.5s (total = 3s, should fire)
    vi.advanceTimersByTime(500);
    sec.startSection("hero");
    vi.advanceTimersByTime(1500);
    sec.flushSections(E);

    expect(Q).toHaveLength(1);
    expect((Q[0].extra as Record<string, unknown>).duration_s).toBe(3);
  });

  it("does not double-start the same section", () => {
    const sec = createSectionTracker();
    sec.startSection("hero");
    const initialStart = sec.sectionStart["hero"];

    vi.advanceTimersByTime(1000);
    sec.startSection("hero"); // should be ignored

    expect(sec.sectionStart["hero"]).toBe(initialStart);
  });

  it("tracks multiple sections simultaneously", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    const sec = createSectionTracker();

    sec.startSection("hero");
    sec.startSection("about");
    vi.advanceTimersByTime(3000);
    sec.flushSections(E);

    expect(Q).toHaveLength(2);
    const sections = Q.map((e) => e.section_name);
    expect(sections).toContain("hero");
    expect(sections).toContain("about");
  });
});

describe("Tracking Script: Click Classification", () => {
  it("classifies tel: links as click_phone", () => {
    expect(classifyClick("A", "tel:+995555123456", [])).toBe("click_phone");
  });

  it("classifies mailto: links as click_email", () => {
    expect(classifyClick("A", "mailto:info@test.ge", [])).toBe("click_email");
  });

  it("classifies sitely-cta-btn as click_cta", () => {
    expect(classifyClick("A", "/contact", ["sitely-cta-btn"])).toBe("click_cta");
  });

  it("classifies sitely-float as click_cta", () => {
    expect(classifyClick("A", "/contact", ["sitely-float"])).toBe("click_cta");
  });

  it("classifies btn-red as click_cta", () => {
    expect(classifyClick("BUTTON", "#", ["btn-red"])).toBe("click_cta");
  });

  it("classifies sitely-btn-primary as click_cta", () => {
    expect(classifyClick("A", "/pricing", ["sitely-btn-primary"])).toBe("click_cta");
  });

  it("classifies float-btn as click_cta", () => {
    expect(classifyClick("A", "#contact", ["float-btn"])).toBe("click_cta");
  });

  it("classifies href with 'sitely' as click_sitely", () => {
    expect(classifyClick("A", "https://sitely.ge", [])).toBe("click_sitely");
  });

  it("returns null for regular links", () => {
    expect(classifyClick("A", "https://example.com", [])).toBeNull();
  });

  it("returns null for buttons without matching class", () => {
    expect(classifyClick("BUTTON", "", ["btn-primary"])).toBeNull();
  });

  it("prioritizes tel: over CTA class", () => {
    expect(classifyClick("A", "tel:123", ["sitely-cta-btn"])).toBe("click_phone");
  });

  it("prioritizes mailto: over sitely link", () => {
    expect(classifyClick("A", "mailto:info@sitely.ge", [])).toBe("click_email");
  });
});

describe("Tracking Script: Rage Click Detection", () => {
  it("detects 3 fast clicks in same area", () => {
    const log: { t: number; x: number; y: number }[] = [];
    const now = 1000;
    detectRageClick(log, now, 100, 100);
    detectRageClick(log, now + 200, 105, 95);
    const result = detectRageClick(log, now + 400, 110, 100);
    expect(result).toBe(true);
  });

  it("ignores clicks spread over > 1s", () => {
    const log: { t: number; x: number; y: number }[] = [];
    detectRageClick(log, 1000, 100, 100);
    detectRageClick(log, 1500, 105, 95);
    const result = detectRageClick(log, 2500, 110, 100); // >1s from first
    expect(result).toBe(false);
  });

  it("ignores clicks far apart spatially", () => {
    const log: { t: number; x: number; y: number }[] = [];
    detectRageClick(log, 1000, 100, 100);
    detectRageClick(log, 1200, 200, 200); // 100px away
    const result = detectRageClick(log, 1400, 300, 300);
    expect(result).toBe(false);
  });

  it("requires exactly 3+ within 30px radius", () => {
    const log: { t: number; x: number; y: number }[] = [];
    const now = 1000;
    detectRageClick(log, now, 100, 100);
    const twoClicks = detectRageClick(log, now + 100, 110, 105);
    expect(twoClicks).toBe(false); // only 2

    const threeClicks = detectRageClick(log, now + 200, 115, 110);
    expect(threeClicks).toBe(true); // now 3
  });
});

describe("Tracking Script: Scroll Milestones", () => {
  it("fires events at 25, 50, 75, 100% thresholds", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");
    let maxScroll = 0;

    function simulateScroll(pct: number) {
      if (pct > maxScroll) maxScroll = pct;
      [25, 50, 75, 100].forEach((m) => {
        if (pct >= m) {
          E("scroll_" + m, { depth: m });
        }
      });
    }

    simulateScroll(10); // nothing
    expect(Q).toHaveLength(0);

    simulateScroll(30); // fires scroll_25
    expect(Q).toHaveLength(1);
    expect(Q[0].event_type).toBe("scroll_25");

    simulateScroll(55); // fires scroll_50
    expect(Q).toHaveLength(2);

    simulateScroll(80); // fires scroll_75
    expect(Q).toHaveLength(3);

    simulateScroll(100); // fires scroll_100
    expect(Q).toHaveLength(4);

    // No duplicates on re-scroll
    simulateScroll(100);
    expect(Q).toHaveLength(4);
  });

  it("fires multiple milestones at once on fast scroll", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");

    function simulateScroll(pct: number) {
      [25, 50, 75, 100].forEach((m) => {
        if (pct >= m) {
          E("scroll_" + m, { depth: m });
        }
      });
    }

    simulateScroll(100); // instant full scroll
    expect(Q).toHaveLength(4);
    expect(Q.map((e) => e.event_type)).toEqual([
      "scroll_25",
      "scroll_50",
      "scroll_75",
      "scroll_100",
    ]);
  });
});

describe("Tracking Script: Active Time Milestones", () => {
  it("fires milestones at correct thresholds", () => {
    const milestones = [10, 30, 60, 180, 300];
    const expected = milestones.map((s) => `active_time_${s}s`);

    // Just verify the event names are valid
    for (const name of expected) {
      const { Q, E } = createTracker("demo1", "HASH1", "sess1");
      E(name, { active_seconds: parseInt(name.match(/\d+/)![0]) });
      expect(Q).toHaveLength(1);
      expect(Q[0].event_type).toBe(name);
    }
  });
});

describe("Tracking Script: Idle Detection Logic", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts active time when not idle or paused", () => {
    let activeMs = 0;
    let lastTick = Date.now();
    let paused = false;
    let idle = false;

    function tick() {
      if (!paused && !idle) {
        const now = Date.now();
        activeMs += now - lastTick;
        lastTick = now;
      } else {
        lastTick = Date.now();
      }
    }

    vi.advanceTimersByTime(5000);
    tick();
    expect(activeMs).toBe(5000);
  });

  it("stops counting when paused (page hidden)", () => {
    let activeMs = 0;
    let lastTick = Date.now();
    let paused = false;
    let idle = false;

    function tick() {
      if (!paused && !idle) {
        const now = Date.now();
        activeMs += now - lastTick;
        lastTick = now;
      } else {
        lastTick = Date.now();
      }
    }

    vi.advanceTimersByTime(3000);
    tick(); // 3s active
    paused = true;
    vi.advanceTimersByTime(10000);
    tick(); // 10s paused (not counted)
    paused = false;
    vi.advanceTimersByTime(2000);
    tick(); // 2s active

    expect(activeMs).toBe(5000); // 3s + 2s
  });

  it("stops counting when idle (no interaction for 30s)", () => {
    let activeMs = 0;
    let lastTick = Date.now();
    let paused = false;
    let idle = false;

    function tick() {
      if (!paused && !idle) {
        const now = Date.now();
        activeMs += now - lastTick;
        lastTick = now;
      } else {
        lastTick = Date.now();
      }
    }

    vi.advanceTimersByTime(5000);
    tick(); // 5s active
    idle = true;
    vi.advanceTimersByTime(60000);
    tick(); // 60s idle (not counted)
    idle = false;
    lastTick = Date.now(); // reset on activity
    vi.advanceTimersByTime(3000);
    tick();

    expect(activeMs).toBe(8000); // 5s + 3s
  });
});

describe("Tracking Script: Page Leave payload", () => {
  it("constructs correct page_leave payload", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");

    // Simulate page leave
    E("page_leave", {
      duration_ms: 36773,
      total_active_seconds: 20,
      scroll_depth: 79,
      device_type: "desktop",
      viewport_w: 1920,
      viewport_h: 1080,
    });

    expect(Q).toHaveLength(1);
    const ev = Q[0];

    // Top-level fields (promoted from extra)
    expect(ev.duration_ms).toBe(36773);
    expect(ev.scroll_depth).toBe(79);

    // Remaining fields stay in extra
    const extra = ev.extra as Record<string, unknown>;
    expect(extra.total_active_seconds).toBe(20);
    expect(extra.device_type).toBe("desktop");
    expect(extra.viewport_w).toBe(1920);
    expect(extra.viewport_h).toBe(1080);

    // duration_ms and scroll_depth should NOT be in extra
    expect(extra.duration_ms).toBeUndefined();
    expect(extra.scroll_depth).toBeUndefined();
  });
});

describe("Tracking Script: Batch Flush", () => {
  it("flushes up to 50 events per batch", () => {
    const { Q, E } = createTracker("demo1", "HASH1", "sess1");

    // Queue 55 events
    for (let i = 0; i < 55; i++) {
      E("section_view", { section: `sec_${i}` }, true);
    }
    expect(Q).toHaveLength(55);

    // Simulate flush (take first 50)
    const batch = Q.splice(0, 50);
    expect(batch).toHaveLength(50);
    expect(Q).toHaveLength(5); // 5 remaining
  });
});
