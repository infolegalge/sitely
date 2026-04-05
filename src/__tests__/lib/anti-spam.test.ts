import { describe, it, expect } from "vitest";

describe("anti-spam cooldown logic", () => {
  function shouldSkip(lastContactedAt: string | null, cooldownDays: number): boolean {
    if (!lastContactedAt) return false;
    const lastContact = new Date(lastContactedAt);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cooldownDays);
    return lastContact > cutoff;
  }

  it("does not skip when never contacted", () => {
    expect(shouldSkip(null, 30)).toBe(false);
  });

  it("skips when contacted 5 days ago (within 30-day cooldown)", () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    expect(shouldSkip(fiveDaysAgo.toISOString(), 30)).toBe(true);
  });

  it("does not skip when contacted 31 days ago (past 30-day cooldown)", () => {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    expect(shouldSkip(thirtyOneDaysAgo.toISOString(), 30)).toBe(false);
  });

  it("skips when contacted exactly 29 days ago", () => {
    const twentyNineDaysAgo = new Date();
    twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);
    expect(shouldSkip(twentyNineDaysAgo.toISOString(), 30)).toBe(true);
  });

  it("does not skip DNC status companies (handled separately)", () => {
    // DNC companies are filtered by status check, not cooldown
    // This test confirms cooldown alone doesn't care about status
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    expect(shouldSkip(oneDayAgo.toISOString(), 30)).toBe(true);
  });
});
