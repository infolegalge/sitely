import { describe, it, expect } from "vitest";
import {
  PORTFOLIO_PROJECTS,
  PORTFOLIO_CATEGORIES,
} from "@/lib/portfolio-projects";
import { FEATURED_PROJECTS, NAV_ITEMS } from "@/lib/constants";

describe("PORTFOLIO_PROJECTS data integrity", () => {
  it("has exactly 57 projects", () => {
    expect(PORTFOLIO_PROJECTS).toHaveLength(57);
  });

  it("every project has all required fields", () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.id).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.client).toBeTruthy();
      expect(typeof p.year).toBe("number");
      expect(p.category).toBeTruthy();
      expect(p.thumbnail).toBeTruthy();
      expect(Array.isArray(p.tags)).toBe(true);
      expect(p.tags.length).toBeGreaterThan(0);
      expect(typeof p.featured).toBe("boolean");
    }
  });

  it("all slugs are unique", () => {
    const slugs = PORTFOLIO_PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all ids are unique", () => {
    const ids = PORTFOLIO_PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every thumbnail starts with /images/projects/portfolio/", () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.thumbnail).toMatch(/^\/images\/projects\/portfolio\//);
    }
  });

  it("every thumbnail ends with .webp", () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.thumbnail).toMatch(/\.webp$/);
    }
  });

  it("every category is a valid PORTFOLIO_CATEGORIES member (excluding All)", () => {
    const validCategories = PORTFOLIO_CATEGORIES.filter((c) => c !== "All");
    for (const p of PORTFOLIO_PROJECTS) {
      expect(validCategories).toContain(p.category);
    }
  });

  it("slugs contain only lowercase letters, numbers, and hyphens", () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("years are reasonable (2020-2026)", () => {
    for (const p of PORTFOLIO_PROJECTS) {
      expect(p.year).toBeGreaterThanOrEqual(2020);
      expect(p.year).toBeLessThanOrEqual(2026);
    }
  });
});

describe("PORTFOLIO_CATEGORIES", () => {
  it("has 11 categories including All", () => {
    expect(PORTFOLIO_CATEGORIES).toHaveLength(11);
  });

  it("starts with All", () => {
    expect(PORTFOLIO_CATEGORIES[0]).toBe("All");
  });

  it("has no duplicates", () => {
    expect(new Set(PORTFOLIO_CATEGORIES).size).toBe(
      PORTFOLIO_CATEGORIES.length,
    );
  });
});

describe("FEATURED_PROJECTS", () => {
  it("has exactly 4 featured projects", () => {
    expect(FEATURED_PROJECTS).toHaveLength(4);
  });

  it("all featured projects have required fields", () => {
    for (const p of FEATURED_PROJECTS) {
      expect(p.id).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.featured).toBe(true);
      expect(p.description).toBeTruthy();
      expect(p.challenge).toBeTruthy();
      expect(p.solution).toBeTruthy();
      expect(Array.isArray(p.results)).toBe(true);
      expect(p.liveUrl).toBeTruthy();
      expect(p.accentColor).toBeTruthy();
    }
  });
});

describe("NAV_ITEMS", () => {
  it("has 5 navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("each item has label and href", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\//);
    }
  });

  it("first item is Home /", () => {
    expect(NAV_ITEMS[0]).toEqual({ label: "Home", href: "/" });
  });
});
