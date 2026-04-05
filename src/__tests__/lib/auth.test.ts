import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyAdmin } from "@/lib/auth";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
}));

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no user is authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await verifyAdmin();
    expect(result).toBeNull();
  });

  it("returns null when user has role in user_metadata only", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: { role: "super_admin" },
          app_metadata: {},
        },
      },
    });
    const result = await verifyAdmin();
    expect(result).toBeNull();
  });

  it("returns null when user has wrong role in app_metadata", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: {},
          app_metadata: { role: "viewer" },
        },
      },
    });
    const result = await verifyAdmin();
    expect(result).toBeNull();
  });

  it("returns user when app_metadata.role is super_admin", async () => {
    const adminUser = {
      id: "admin-1",
      email: "admin@sitely.ge",
      user_metadata: {},
      app_metadata: { role: "super_admin" },
    };
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });

    const result = await verifyAdmin();
    expect(result).toEqual(adminUser);
  });

  it("returns user even if user_metadata has different role", async () => {
    const adminUser = {
      id: "admin-1",
      email: "admin@sitely.ge",
      user_metadata: { role: "viewer" },
      app_metadata: { role: "super_admin" },
    };
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });

    const result = await verifyAdmin();
    expect(result).toEqual(adminUser);
  });
});
