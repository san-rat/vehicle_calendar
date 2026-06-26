import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFormData } from "@/test/form-data";
import { createSupabaseMock } from "@/test/supabase-mock";

const currentUser = {
  id: "user-1",
  is_active: true,
  name: "Test Member",
  role: "member" as const,
};

function redirectError(url: string) {
  return new Error(`redirect:${url}`);
}

async function loadCreateBooking(
  tableResults: Parameters<typeof createSupabaseMock>[0]
) {
  vi.resetModules();

  const supabase = createSupabaseMock(tableResults);
  const redirect = vi.fn((url: string) => {
    throw redirectError(url);
  });
  const revalidatePath = vi.fn();

  vi.doMock("next/navigation", () => ({ redirect }));
  vi.doMock("next/cache", () => ({ revalidatePath }));
  vi.doMock("@/lib/auth/user", () => ({
    requireCurrentAppUser: vi.fn(async () => currentUser),
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => supabase),
  }));

  const actions = await import("./actions");

  return {
    createBooking: actions.createBooking,
    redirect,
    revalidatePath,
    supabase,
  };
}

function bookingForm(overrides: Record<string, string> = {}) {
  return makeFormData({
    end_time: "10:00",
    reason: "",
    start_time: "09:00",
    ...overrides,
  });
}

describe("createBooking server action", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T02:30:00.000Z"));
  });

  it("redirects when the vehicle is unavailable", async () => {
    const { createBooking } = await loadCreateBooking({
      vehicles: { data: null },
    });

    await expect(
      createBooking("vehicle-1", "2026-04-13", bookingForm())
    ).rejects.toThrow("redirect:/vehicles/vehicle-1/date/2026-04-13?error=Vehicle+unavailable.");
  });

  it("creates a confirmed booking when booking freedom is enabled", async () => {
    const createdBooking = {
      created_at: "2026-04-12T00:00:00Z",
      created_by: "user-1",
      date: "2026-04-13",
      end_time: "10:00",
      id: "booking-1",
      is_all_day: false,
      reason: null,
      start_time: "09:00",
      status: "confirmed",
      updated_at: "2026-04-12T00:00:00Z",
      updated_by: "user-1",
      user_id: "user-1",
      vehicle_id: "vehicle-1",
    };
    const { createBooking, revalidatePath, supabase } = await loadCreateBooking({
      bookings: [{ data: [] }, { data: createdBooking }],
      log_entries: { data: null },
      privilege_config: {
        data: {
          allow_booking_freedom: true,
          max_days_in_future: 30,
          require_reason: false,
          time_limit_minutes: null,
        },
      },
      vehicles: { data: { id: "vehicle-1", name: "Pool Car" } },
    });

    await expect(
      createBooking("vehicle-1", "2026-04-13", bookingForm())
    ).rejects.toThrow(
      "redirect:/vehicles/vehicle-1/date/2026-04-13?success=Booking+confirmed."
    );

    const bookingInsert = supabase.buildersByTable.get("bookings")?.[1].insert;
    const logInsert = supabase.buildersByTable.get("log_entries")?.[0].insert;

    expect(bookingInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed",
        user_id: "user-1",
        vehicle_id: "vehicle-1",
      })
    );
    expect(logInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "booking_confirmed" })
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/vehicles/vehicle-1/date/2026-04-13"
    );
  });

  it("creates a requested booking when approval is required", async () => {
    const createdBooking = {
      created_at: "2026-04-12T00:00:00Z",
      created_by: "user-1",
      date: "2026-04-13",
      end_time: "10:00",
      id: "booking-1",
      is_all_day: false,
      reason: null,
      start_time: "09:00",
      status: "requested",
      updated_at: "2026-04-12T00:00:00Z",
      updated_by: "user-1",
      user_id: "user-1",
      vehicle_id: "vehicle-1",
    };
    const { createBooking, supabase } = await loadCreateBooking({
      bookings: [{ data: [] }, { data: createdBooking }],
      log_entries: { data: null },
      privilege_config: {
        data: {
          allow_booking_freedom: false,
          max_days_in_future: 30,
          require_reason: false,
          time_limit_minutes: null,
        },
      },
      vehicles: { data: { id: "vehicle-1", name: "Pool Car" } },
    });

    await expect(
      createBooking("vehicle-1", "2026-04-13", bookingForm())
    ).rejects.toThrow(
      "redirect:/vehicles/vehicle-1/date/2026-04-13?success=Booking+request+submitted."
    );

    expect(supabase.buildersByTable.get("bookings")?.[1].insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "requested" })
    );
    expect(supabase.buildersByTable.get("log_entries")?.[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "booking_requested" })
    );
  });

  it("rejects input that conflicts with a confirmed booking", async () => {
    const { createBooking } = await loadCreateBooking({
      bookings: {
        data: [
          {
            end_time: "10:00:00",
            is_all_day: false,
            start_time: "09:00:00",
          },
        ],
      },
      privilege_config: {
        data: {
          allow_booking_freedom: true,
          max_days_in_future: 30,
          require_reason: false,
          time_limit_minutes: null,
        },
      },
      vehicles: { data: { id: "vehicle-1", name: "Pool Car" } },
    });

    await expect(
      createBooking("vehicle-1", "2026-04-13", bookingForm({ start_time: "09:30" }))
    ).rejects.toThrow(
      "redirect:/vehicles/vehicle-1/date/2026-04-13?error=This+vehicle+already+has+a+confirmed+booking+during+that+time."
    );
  });

  it("maps database overlap violations to a friendly booking conflict", async () => {
    const { createBooking } = await loadCreateBooking({
      bookings: [
        { data: [] },
        { error: { code: "23P01", message: "exclusion violation" } },
      ],
      privilege_config: {
        data: {
          allow_booking_freedom: true,
          max_days_in_future: 30,
          require_reason: false,
          time_limit_minutes: null,
        },
      },
      vehicles: { data: { id: "vehicle-1", name: "Pool Car" } },
    });

    await expect(
      createBooking("vehicle-1", "2026-04-13", bookingForm())
    ).rejects.toThrow(
      "redirect:/vehicles/vehicle-1/date/2026-04-13?error=This+vehicle+already+has+a+confirmed+booking+during+that+time."
    );
  });

  it("reports when audit logging fails after saving a booking", async () => {
    const { createBooking } = await loadCreateBooking({
      bookings: [
        { data: [] },
        {
          data: {
            created_at: "2026-04-12T00:00:00Z",
            created_by: "user-1",
            date: "2026-04-13",
            end_time: "10:00",
            id: "booking-1",
            is_all_day: false,
            reason: null,
            start_time: "09:00",
            status: "confirmed",
            updated_at: "2026-04-12T00:00:00Z",
            updated_by: "user-1",
            user_id: "user-1",
            vehicle_id: "vehicle-1",
          },
        },
      ],
      log_entries: { error: { message: "log failed" } },
      privilege_config: {
        data: {
          allow_booking_freedom: true,
          max_days_in_future: 30,
          require_reason: false,
          time_limit_minutes: null,
        },
      },
      vehicles: { data: { id: "vehicle-1", name: "Pool Car" } },
    });

    await expect(
      createBooking("vehicle-1", "2026-04-13", bookingForm())
    ).rejects.toThrow(
      "redirect:/vehicles/vehicle-1/date/2026-04-13?error=Booking+saved%2C+but+the+audit+log+could+not+be+written."
    );
  });
});
