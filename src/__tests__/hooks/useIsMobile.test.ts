import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/useIsMobile";

describe("useIsMobile", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  it("returns false on desktop (wide screen, no coarse pointer)", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1200 });
    matchMediaMock.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true on narrow screen (<768px)", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 500 });
    matchMediaMock.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns true when coarse pointer detected (touch device)", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1200 });
    matchMediaMock.mockReturnValue({ matches: true });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("responds to window resize", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1200 });
    matchMediaMock.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    Object.defineProperty(window, "innerWidth", { writable: true, value: 400 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });

  it("boundary: exactly 768px is not mobile", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 768 });
    matchMediaMock.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("boundary: 767px is mobile", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 767 });
    matchMediaMock.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("cleans up resize listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    removeSpy.mockRestore();
  });
});
