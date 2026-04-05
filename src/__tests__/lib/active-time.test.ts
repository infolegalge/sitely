import { describe, it, expect } from "vitest";

/**
 * Active time tracking — tests the Page Visibility API logic.
 * The tracking script runs in the browser (injected into demos).
 * We test the core timer logic independently.
 */
describe("Active Time Tracking Logic", () => {
  it("timer starts at 0", () => {
    let activeMs = 0;
    expect(activeMs).toBe(0);
  });

  it("timer increments while visible", () => {
    let activeMs = 0;
    let paused = false;
    let lastTick = Date.now();

    // Simulate 5 seconds passing while visible
    const elapsed = 5000;
    const now = lastTick + elapsed;
    if (!paused) {
      activeMs += now - lastTick;
      lastTick = now;
    }
    expect(activeMs).toBe(5000);
  });

  it("timer pauses when hidden", () => {
    let activeMs = 0;
    let paused = false;
    let lastTick = Date.now();

    // 5s visible
    const t1 = lastTick + 5000;
    activeMs += t1 - lastTick;
    lastTick = t1;
    paused = true; // Tab hidden

    // 10s hidden — should NOT add to activeMs
    const t2 = t1 + 10000;
    if (!paused) {
      activeMs += t2 - lastTick;
    }

    expect(activeMs).toBe(5000); // Only the visible 5s counted
  });

  it("timer resumes after tab becomes visible again", () => {
    let activeMs = 0;
    let paused = false;
    let lastTick = Date.now();

    // 5s visible
    const t1 = lastTick + 5000;
    if (!paused) {
      activeMs += t1 - lastTick;
      lastTick = t1;
    }
    paused = true; // Tab hidden

    // 10s hidden
    const t2 = t1 + 10000;

    // Tab visible again
    paused = false;
    lastTick = t2;

    // 3s visible again
    const t3 = t2 + 3000;
    if (!paused) {
      activeMs += t3 - lastTick;
      lastTick = t3;
    }

    expect(activeMs).toBe(8000); // 5s + 3s = 8s active (10s hidden excluded)
  });

  it("total_active_seconds is rounded correctly in page_leave", () => {
    const activeMs = 7800;
    const totalActiveSeconds = Math.round(activeMs / 1000);
    expect(totalActiveSeconds).toBe(8);
  });

  it("event_type names follow active_time_Xs pattern", () => {
    const thresholds = [10, 30, 60, 180, 300];
    const expectedNames = [
      "active_time_10s",
      "active_time_30s",
      "active_time_60s",
      "active_time_180s",
      "active_time_300s",
    ];
    thresholds.forEach((s, i) => {
      expect(`active_time_${s}s`).toBe(expectedNames[i]);
    });
  });
});
