import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

async function loadLogoutRoute() {
  vi.resetModules();

  const signOut = vi.fn(async () => ({ error: null }));
  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(async () => ({
      auth: { signOut },
    })),
  }));

  return {
    ...(await import("./route")),
    signOut,
  };
}

describe("logout route", () => {
  it("does not expose a GET logout handler", async () => {
    const route = await loadLogoutRoute();

    expect("GET" in route).toBe(false);
  });

  it("signs out on POST and preserves the optional reason", async () => {
    const { POST, signOut } = await loadLogoutRoute();
    const response = await POST(
      new NextRequest("https://fleettime.test/auth/logout?reason=inactive-user")
    );

    expect(signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://fleettime.test/login?error=inactive-user"
    );
  });
});
