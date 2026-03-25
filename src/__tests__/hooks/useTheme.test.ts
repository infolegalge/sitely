import { describe, it, expect } from "vitest";
import { useTheme } from "@/hooks/useTheme";

describe("useTheme", () => {
  it("always returns dark theme", () => {
    const result = useTheme();
    expect(result.theme).toBe("dark");
  });

  it("returns the correct shape", () => {
    const result = useTheme();
    expect(result).toEqual({ theme: "dark" });
  });

  it("returns a stable reference type", () => {
    const a = useTheme();
    const b = useTheme();
    expect(a.theme).toBe(b.theme);
  });
});
