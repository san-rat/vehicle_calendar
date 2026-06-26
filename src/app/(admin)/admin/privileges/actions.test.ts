import { describe, expect, it, vi } from "vitest";
import { makeFormData } from "@/test/form-data";
import { createSupabaseMock } from "@/test/supabase-mock";

const adminUser = {
  id: "admin-1",
  is_active: true,
  name: "Admin",
  role: "super_admin" as const,
};

async function loadPrivilegeActions(
  tableResults: Parameters<typeof createSupabaseMock>[0]
) {
  vi.resetModules();

  const supabase = createSupabaseMock(tableResults);
  const redirect = vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  const revalidatePath = vi.fn();

  vi.doMock("next/navigation", () => ({ redirect }));
  vi.doMock("next/cache", () => ({ revalidatePath }));
  vi.doMock("@/lib/auth/user", () => ({
    requireAdminAppUser: vi.fn(async () => adminUser),
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => supabase),
  }));

  return {
    ...(await import("./actions")),
    revalidatePath,
    supabase,
  };
}

const beforeConfig = {
  allow_booking_freedom: true,
  created_at: "2026-04-01T00:00:00Z",
  id: "config-1",
  max_days_in_future: 30,
  require_reason: false,
  time_limit_minutes: null,
  updated_at: "2026-04-12T00:00:00Z",
};

describe("privilege admin action", () => {
  it("updates changed privileges and writes an audit log", async () => {
    const updated = {
      ...beforeConfig,
      allow_booking_freedom: false,
      require_reason: true,
      time_limit_minutes: 120,
    };
    const { revalidatePath, supabase, updatePrivileges } =
      await loadPrivilegeActions({
        log_entries: { data: null },
        privilege_config: [{ data: beforeConfig }, { data: updated }],
      });

    await expect(
      updatePrivileges(
        makeFormData({
          allow_booking_freedom: "false",
          id: "config-1",
          max_days_in_future: "30",
          require_reason: "true",
          time_limit_minutes: "120",
        })
      )
    ).rejects.toThrow("redirect:/admin/privileges?success=Booking+privileges+updated.");

    expect(supabase.buildersByTable.get("privilege_config")?.[1].update).toHaveBeenCalledWith({
      allow_booking_freedom: false,
      max_days_in_future: 30,
      require_reason: true,
      time_limit_minutes: 120,
    });
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "privilege_updated" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/privileges");
  });

  it("does not write when privilege input matches current config", async () => {
    const { updatePrivileges } = await loadPrivilegeActions({
      privilege_config: { data: beforeConfig },
    });

    await expect(
      updatePrivileges(
        makeFormData({
          allow_booking_freedom: "true",
          id: "config-1",
          max_days_in_future: "30",
          require_reason: "false",
          time_limit_minutes: "",
        })
      )
    ).rejects.toThrow("redirect:/admin/privileges?success=No+privilege+changes.");
  });
});
