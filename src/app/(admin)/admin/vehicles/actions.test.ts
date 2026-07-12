import { describe, expect, it, vi } from "vitest";
import { makeFormData } from "@/test/form-data";
import { createSupabaseMock } from "@/test/supabase-mock";

const adminUser = {
  id: "admin-1",
  is_active: true,
  name: "Admin",
  role: "super_admin" as const,
};

async function loadVehicleActions(
  tableResults: Parameters<typeof createSupabaseMock>[0]
) {
  vi.resetModules();

  const supabase = createSupabaseMock(tableResults);
  const redirect = vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  const reportAuditLogFailure = vi.fn();
  const revalidatePath = vi.fn();

  vi.doMock("next/navigation", () => ({ redirect }));
  vi.doMock("next/cache", () => ({ revalidatePath }));
  vi.doMock("@/lib/auth/user", () => ({
    requireAdminAppUser: vi.fn(async () => adminUser),
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => supabase),
  }));
  vi.doMock("@/lib/logs/audit", () => ({
    reportAuditLogFailure,
  }));

  return {
    ...(await import("./actions")),
    reportAuditLogFailure,
    revalidatePath,
    supabase,
  };
}

const vehicle = {
  created_at: "2026-04-01T00:00:00Z",
  id: "vehicle-1",
  is_active: true,
  name: "Pool Car",
  type: "car",
  updated_at: "2026-04-12T00:00:00Z",
};

describe("vehicle admin actions", () => {
  it("creates a vehicle and writes an audit log", async () => {
    const { createVehicle, revalidatePath, supabase } = await loadVehicleActions({
      log_entries: { data: null },
      vehicles: { data: vehicle },
    });

    await expect(
      createVehicle(
        makeFormData({ is_active: "true", name: "Pool Car", type: "car" })
      )
    ).rejects.toThrow("redirect:/admin/vehicles?success=Vehicle+%22Pool+Car%22+created.");

    expect(supabase.buildersByTable.get("vehicles")?.[0].insert).toHaveBeenCalledWith({
      is_active: true,
      name: "Pool Car",
      type: "car",
    });
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "vehicle_created" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/vehicles");
  });

  it("logs server-side and succeeds when vehicle audit logging fails", async () => {
    const { createVehicle, reportAuditLogFailure } = await loadVehicleActions({
      log_entries: { error: { message: "log failed" } },
      vehicles: { data: vehicle },
    });

    await expect(
      createVehicle(
        makeFormData({ is_active: "true", name: "Pool Car", type: "car" })
      )
    ).rejects.toThrow("redirect:/admin/vehicles?success=Vehicle+%22Pool+Car%22+created.");
    expect(reportAuditLogFailure).toHaveBeenCalledWith({
      action: "vehicle_created",
      error: { message: "log failed" },
      targetId: "vehicle-1",
    });
  });

  it("short-circuits unchanged vehicle updates", async () => {
    const { updateVehicle } = await loadVehicleActions({
      vehicles: { data: vehicle },
    });

    await expect(
      updateVehicle(
        makeFormData({
          id: "vehicle-1",
          is_active: "true",
          name: "Pool Car",
          type: "car",
        })
      )
    ).rejects.toThrow("redirect:/admin/vehicles?success=No+vehicle+changes.");
  });

  it("deletes a vehicle only after exact confirmation and no bookings", async () => {
    const { deleteVehicle, supabase } = await loadVehicleActions({
      bookings: { data: [] },
      log_entries: { data: null },
      vehicles: [{ data: vehicle }, { data: null }],
    });

    await expect(
      deleteVehicle(makeFormData({ confirmation: "Pool Car", id: "vehicle-1" }))
    ).rejects.toThrow("redirect:/admin/vehicles?success=Vehicle+%22Pool+Car%22+deleted.");

    expect(supabase.buildersByTable.get("vehicles")?.[1].delete).toHaveBeenCalled();
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "vehicle_deleted" })
    );
  });
});
