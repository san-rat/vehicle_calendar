import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFormData } from "@/test/form-data";
import { createSupabaseMock } from "@/test/supabase-mock";

const adminUser = {
  id: "admin-1",
  is_active: true,
  name: "Admin",
  role: "super_admin" as const,
};

async function loadRequestActions(
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

const requestedBooking = {
  booking_user: { is_active: true, name: "Member" },
  booking_vehicle: { is_active: true, name: "Car" },
  created_at: "2026-04-12T00:00:00Z",
  created_by: "user-1",
  date: "2026-04-13",
  end_time: "10:00",
  id: "request-1",
  is_all_day: false,
  reason: null,
  start_time: "09:00",
  status: "requested",
  updated_at: "2026-04-12T00:00:00Z",
  updated_by: "user-1",
  user_id: "user-1",
  vehicle_id: "vehicle-1",
};

describe("admin booking request actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T02:30:00.000Z"));
  });

  it("approves a request without conflicts", async () => {
    const updated = { ...requestedBooking, status: "confirmed", updated_by: "admin-1" };
    const { approveBookingRequest, revalidatePath, supabase } =
      await loadRequestActions({
        bookings: [
          { data: requestedBooking },
          { data: [] },
          { data: updated },
        ],
        log_entries: { data: null },
      });

    await expect(
      approveBookingRequest(makeFormData({ id: "request-1" }))
    ).rejects.toThrow("redirect:/admin/requests?success=Request+approved.");

    expect(supabase.buildersByTable.get("bookings")?.[2].update).toHaveBeenCalledWith({
      status: "confirmed",
      updated_by: "admin-1",
    });
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ action_type: "booking_confirmed" }),
      ])
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/requests");
  });

  it("requires explicit override confirmation when conflicts exist", async () => {
    const { approveBookingRequest } = await loadRequestActions({
      bookings: [
        { data: requestedBooking },
        {
          data: [
            {
              ...requestedBooking,
              id: "confirmed-1",
              status: "confirmed",
            },
          ],
        },
      ],
    });

    await expect(
      approveBookingRequest(makeFormData({ id: "request-1" }))
    ).rejects.toThrow(
      "redirect:/admin/requests?error=Confirm+the+override+before+approving+this+conflicting+request."
    );
  });

  it("overrides conflicting confirmed bookings before approving", async () => {
    const conflict = { ...requestedBooking, id: "confirmed-1", status: "confirmed" };
    const updatedRequest = { ...requestedBooking, status: "confirmed" };
    const overridden = { ...conflict, status: "overridden", updated_by: "admin-1" };
    const { approveBookingRequest, supabase } = await loadRequestActions({
      bookings: [
        { data: requestedBooking },
        { data: [conflict] },
        { data: [overridden] },
        { data: updatedRequest },
      ],
      log_entries: { data: null },
    });

    await expect(
      approveBookingRequest(
        makeFormData({
          id: "request-1",
          override_confirmation: "override",
          override_note: "Needed urgently",
        })
      )
    ).rejects.toThrow("redirect:/admin/requests?success=Request+approved.");

    expect(supabase.buildersByTable.get("bookings")?.[2].update).toHaveBeenCalledWith({
      status: "overridden",
      updated_by: "admin-1",
    });
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ action_type: "booking_overridden" }),
        expect.objectContaining({ action_type: "booking_confirmed" }),
      ])
    );
  });

  it("maps database overlap violations during approval to a friendly conflict", async () => {
    const { approveBookingRequest } = await loadRequestActions({
      bookings: [
        { data: requestedBooking },
        { data: [] },
        { error: { code: "23P01", message: "exclusion violation" } },
      ],
    });

    await expect(
      approveBookingRequest(makeFormData({ id: "request-1" }))
    ).rejects.toThrow(
      "redirect:/admin/requests?error=This+vehicle+already+has+a+confirmed+booking+during+that+time."
    );
  });

  it("blocks approval for inactive members", async () => {
    const { approveBookingRequest } = await loadRequestActions({
      bookings: {
        data: {
          ...requestedBooking,
          booking_user: { is_active: false, name: "Member" },
        },
      },
    });

    await expect(
      approveBookingRequest(makeFormData({ id: "request-1" }))
    ).rejects.toThrow(
      "redirect:/admin/requests?error=This+member+is+inactive+and+cannot+be+approved."
    );
  });

  it("rejects a request with an optional reason", async () => {
    const updated = { ...requestedBooking, status: "rejected", updated_by: "admin-1" };
    const { rejectBookingRequest, supabase } = await loadRequestActions({
      bookings: [{ data: requestedBooking }, { data: updated }],
      log_entries: { data: null },
    });

    await expect(
      rejectBookingRequest(
        makeFormData({ id: "request-1", rejection_reason: "Not available" })
      )
    ).rejects.toThrow("redirect:/admin/requests?success=Request+rejected.");

    expect(supabase.buildersByTable.get("bookings")?.[1].update).toHaveBeenCalledWith({
      status: "rejected",
      updated_by: "admin-1",
    });
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "booking_rejected",
        snapshot: expect.objectContaining({ rejection_reason: "Not available" }),
      })
    );
  });
});
