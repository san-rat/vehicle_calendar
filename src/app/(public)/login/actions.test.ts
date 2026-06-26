import { describe, expect, it, vi } from "vitest";
import { makeFormData } from "@/test/form-data";
import { createSupabaseMock } from "@/test/supabase-mock";

async function loadLoginAction(options: {
  email?: string | null;
  profile?: { is_active: boolean; role: string } | null;
  signInError?: unknown;
  user?: { id: string } | null;
}) {
  vi.resetModules();

  const supabase = createSupabaseMock({
    users: { data: options.profile ?? null },
  });
  supabase.auth.signInWithPassword.mockResolvedValue({
    error: options.signInError ?? null,
  });
  supabase.auth.getUser.mockResolvedValue({
    data: { user: options.user ?? { id: "user-1" } },
    error: null,
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });

  const redirect = vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  const revalidatePath = vi.fn();

  vi.doMock("next/navigation", () => ({ redirect }));
  vi.doMock("next/cache", () => ({ revalidatePath }));
  vi.doMock("@/lib/auth/name-login", () => ({
    lookupEmailByName: vi.fn(async () => options.email ?? null),
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(async () => supabase),
  }));

  return {
    ...(await import("./actions")),
    revalidatePath,
    supabase,
  };
}

describe("logInWithName action", () => {
  it("requires both credentials before looking up auth", async () => {
    const { logInWithName } = await loadLoginAction({});

    await expect(
      logInWithName(makeFormData({ name: "", password: "" }))
    ).rejects.toThrow("redirect:/login?error=missing-credentials");
  });

  it("rejects unknown names and invalid passwords", async () => {
    const unknown = await loadLoginAction({ email: null });
    await expect(
      unknown.logInWithName(makeFormData({ name: "Alex", password: "password" }))
    ).rejects.toThrow("redirect:/login?error=invalid-credentials");

    const invalidPassword = await loadLoginAction({
      email: "alex@example.test",
      signInError: { message: "bad password" },
    });
    await expect(
      invalidPassword.logInWithName(
        makeFormData({ name: "Alex", password: "password" })
      )
    ).rejects.toThrow("redirect:/login?error=invalid-credentials");
  });

  it("signs out users with missing or inactive profiles", async () => {
    const missingProfile = await loadLoginAction({
      email: "alex@example.test",
      profile: null,
    });
    await expect(
      missingProfile.logInWithName(
        makeFormData({ name: "Alex", password: "password" })
      )
    ).rejects.toThrow("redirect:/login?error=profile-missing");
    expect(missingProfile.supabase.auth.signOut).toHaveBeenCalled();

    const inactiveProfile = await loadLoginAction({
      email: "alex@example.test",
      profile: { is_active: false, role: "member" },
    });
    await expect(
      inactiveProfile.logInWithName(
        makeFormData({ name: "Alex", password: "password" })
      )
    ).rejects.toThrow("redirect:/login?error=inactive-user");
  });

  it("revalidates layout and redirects active members after login", async () => {
    const { logInWithName, revalidatePath, supabase } = await loadLoginAction({
      email: "alex@example.test",
      profile: { is_active: true, role: "member" },
    });

    await expect(
      logInWithName(makeFormData({ name: "Alex", password: "password" }))
    ).rejects.toThrow("redirect:/vehicles");

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "alex@example.test",
      password: "password",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
