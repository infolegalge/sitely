import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyClient } from "@/lib/auth";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
}));

describe("verifyClient — Portal Auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no user is authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await verifyClient();
    expect(result).toBeNull();
  });

  it("returns null when user has no role", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          app_metadata: {},
        },
      },
    });
    const result = await verifyClient();
    expect(result).toBeNull();
  });

  it("returns null for non-client role (e.g. viewer)", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          app_metadata: { role: "viewer" },
        },
      },
    });
    const result = await verifyClient();
    expect(result).toBeNull();
  });

  it("returns user for client role", async () => {
    const clientUser = {
      id: "client-1",
      email: "client@example.com",
      app_metadata: { role: "client", company_id: "comp-1" },
    };
    mockGetUser.mockResolvedValue({ data: { user: clientUser } });

    const result = await verifyClient();
    expect(result).toEqual(clientUser);
  });

  it("returns user for super_admin role (admins can access portal)", async () => {
    const adminUser = {
      id: "admin-1",
      email: "admin@sitely.ge",
      app_metadata: { role: "super_admin" },
    };
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });

    const result = await verifyClient();
    expect(result).toEqual(adminUser);
  });

  it("ignores user_metadata role (only checks app_metadata)", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: { role: "client" },
          app_metadata: {},
        },
      },
    });
    const result = await verifyClient();
    expect(result).toBeNull();
  });
});
