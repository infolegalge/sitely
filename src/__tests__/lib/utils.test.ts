import { describe, it, expect } from "vitest";
import { cn, lerp, clamp } from "@/lib/utils";

describe("cn (classnames)", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns empty string when all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("handles single class", () => {
    expect(cn("solo")).toBe("solo");
  });

  it("handles no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles boolean conditions", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("btn", isActive && "active", isDisabled && "disabled")).toBe(
      "btn active",
    );
  });
});

describe("lerp (linear interpolation)", () => {
  it("returns start when factor is 0", () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it("returns end when factor is 1", () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it("returns midpoint when factor is 0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it("works with negative numbers", () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it("handles factor > 1 (extrapolation)", () => {
    expect(lerp(0, 100, 1.5)).toBe(150);
  });

  it("handles factor < 0 (extrapolation)", () => {
    expect(lerp(0, 100, -0.5)).toBe(-50);
  });

  it("returns start when start === end", () => {
    expect(lerp(42, 42, 0.7)).toBe(42);
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("works with negative ranges", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it("works with floating point", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(-0.1, 0, 1)).toBe(0);
  });
});
