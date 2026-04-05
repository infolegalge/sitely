import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the anon client
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createAnonClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

const { GET } = await import("@/app/api/companies/by-ref/route");

function makeRequest(params: string) {
  const url = new URL(`http://localhost/api/companies/by-ref?${params}`);
  return {
    nextUrl: url,
  } as unknown as import("next/server").NextRequest;
}

describe("GET /api/companies/by-ref — Onboard Prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing ref", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(400);
  });

  it("rejects non-UUID ref", async () => {
    const res = await GET(makeRequest("ref=not-a-uuid"));
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown ref", async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () => Promise.resolve({ data: null }),
      }),
    });

    const res = await GET(
      makeRequest("ref=a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4")
    );
    expect(res.status).toBe(404);
  });

  it("returns company data for valid ref", async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: { name: "Test Co", email: "test@co.ge", phone: "+995 555 12 34" },
          }),
      }),
    });

    const res = await GET(
      makeRequest("ref=a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.name).toBe("Test Co");
    expect(json.email).toBe("test@co.ge");
    expect(json.phone).toBe("+995 555 12 34");
  });

  it("returns empty strings for missing fields", async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: { name: null, email: null, phone: null },
          }),
      }),
    });

    const res = await GET(
      makeRequest("ref=b0b0b0b0-c1c1-d2d2-e3e3-f4f4f4f4f4f4")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.name).toBe("");
    expect(json.email).toBe("");
    expect(json.phone).toBe("");
  });
});
