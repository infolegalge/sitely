import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest } from "next/server";

// Mock createServerClient from @supabase/ssr
const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

function makeRequest(pathname: string) {
  const url = new URL(pathname, "http://localhost:3000");
  return new NextRequest(url);
}

describe("updateSession (proxy middleware)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users from /secure-access/dashboard to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = makeRequest("/secure-access/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/secure-access/login"
    );
  });

  it("allows unauthenticated users to access /secure-access/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = makeRequest("/secure-access/login");
    const response = await updateSession(request);

    // Should pass through (200), not redirect
    expect(response.status).toBe(200);
  });

  it("blocks user with user_metadata role but no app_metadata role", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "hacker@example.com",
          user_metadata: { role: "super_admin" },
          app_metadata: {},
        },
      },
    });

    const request = makeRequest("/secure-access/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/secure-access/login"
    );
  });

  it("allows user with app_metadata.role = super_admin", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "admin-1",
          email: "admin@sitely.ge",
          user_metadata: {},
          app_metadata: { role: "super_admin" },
        },
      },
    });

    const request = makeRequest("/secure-access/dashboard");
    const response = await updateSession(request);

    // Should pass through, not redirect
    expect(response.status).toBe(200);
  });

  it("redirects authenticated admin from login page to dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "admin-1",
          email: "admin@sitely.ge",
          user_metadata: {},
          app_metadata: { role: "super_admin" },
        },
      },
    });

    const request = makeRequest("/secure-access/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/secure-access/dashboard"
    );
  });

  it("does not redirect non-admin authenticated user from login page", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          user_metadata: {},
          app_metadata: { role: "viewer" },
        },
      },
    });

    const request = makeRequest("/secure-access/login");
    const response = await updateSession(request);

    // Not a super_admin, so should stay on login page (pass through)
    expect(response.status).toBe(200);
  });

  it("does not interfere with non-secure routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = makeRequest("/about");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });
});
