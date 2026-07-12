import { describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";

async function loadNameLogin(rpcResult: { data?: unknown; error?: unknown }) {
  vi.resetModules();

  const supabase = createSupabaseMock({
    users: { data: { id: "user-1" } },
  });
  supabase.rpc.mockResolvedValue({
    data: rpcResult.data ?? null,
    error: rpcResult.error ?? null,
  });

  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(async () => supabase),
  }));

  return {
    ...(await import("./name-login")),
    supabase,
  };
}

describe("lookupEmailByName", () => {
  it("returns null for blank names before calling Supabase", async () => {
    const { lookupEmailByName, supabase } = await loadNameLogin({
      data: "alex@example.test",
    });

    await expect(lookupEmailByName("   ")).resolves.toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("returns the auth email from the name lookup RPC", async () => {
    const { lookupEmailByName, supabase } = await loadNameLogin({
      data: "alex@example.test",
    });

    await expect(lookupEmailByName("  Alex  ")).resolves.toBe(
      "alex@example.test"
    );
    expect(supabase.rpc).toHaveBeenCalledWith("lookup_auth_email_by_name", {
      p_name: "Alex",
    });
  });

  it("does not fall back to anon table reads or auth admin lookups", async () => {
    const { lookupEmailByName, supabase } = await loadNameLogin({ data: null });

    await expect(lookupEmailByName("Super Admin")).resolves.toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.auth.admin.getUserById).not.toHaveBeenCalled();
  });
});
