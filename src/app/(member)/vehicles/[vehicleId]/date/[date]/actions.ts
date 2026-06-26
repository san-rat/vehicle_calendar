"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentAppUser } from "@/lib/auth/user";
import {
  getBookingStatusForFreedom,
  getBusinessTimeMinutes,
  getBookingPersistenceErrorMessage,
  validateBookingInput,
  getCancellationTimingProblem,
  type BookingStatus,
  type BookingTimeWindow,
} from "@/lib/booking/bookings";
import { getBusinessToday } from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BOOKING_SELECT =
  "id, user_id, vehicle_id, date, start_time, end_time, is_all_day, reason, status, created_by, updated_by, created_at, updated_at";

type PrivilegeConfigRecord = {
  allow_booking_freedom: boolean;
  max_days_in_future: number;
  require_reason: boolean;
  time_limit_minutes: number | null;
};

type VehicleRecord = {
  id: string;
  name: string;
};

type BookingRecord = {
  created_at: string;
  created_by: string | null;
  date: string;
  end_time: string;
  id: string;
  is_all_day: boolean;
  reason: string | null;
  start_time: string;
  status: BookingStatus;
  updated_at: string;
  updated_by: string | null;
  user_id: string;
  vehicle_id: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getOptionalFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : null;
}

function redirectWithMessage(
  vehicleId: string,
  date: string,
  kind: "error" | "success",
  message: string
): never {
  const params = new URLSearchParams({ [kind]: message });

  redirect(`/vehicles/${vehicleId}/date/${date}?${params.toString()}`);
}

export async function createBooking(
  vehicleId: string,
  date: string,
  formData: FormData
) {
  const currentUser = await requireCurrentAppUser();
  const supabase = createSupabaseAdminClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, name")
    .eq("id", vehicleId)
    .eq("is_active", true)
    .maybeSingle<VehicleRecord>();

  if (vehicleError || !vehicle) {
    redirectWithMessage(vehicleId, date, "error", "Vehicle unavailable.");
  }

  const { data: config, error: configError } = await supabase
    .from("privilege_config")
    .select(
      "time_limit_minutes, allow_booking_freedom, max_days_in_future, require_reason"
    )
    .maybeSingle<PrivilegeConfigRecord>();

  if (configError || !config) {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      "Booking policy is missing."
    );
  }

  const { data: confirmedBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("start_time, end_time, is_all_day")
    .eq("vehicle_id", vehicleId)
    .eq("date", date)
    .eq("status", "confirmed");

  if (bookingsError) {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      "Could not check existing bookings."
    );
  }

  const validation = validateBookingInput({
    allDay: getOptionalFormString(formData, "is_all_day"),
    confirmedBookings: (confirmedBookings ?? []) as BookingTimeWindow[],
    currentTimeMinutes: getBusinessTimeMinutes(),
    date,
    endTime: getFormString(formData, "end_time"),
    maxDaysInFuture: config.max_days_in_future,
    reason: getFormString(formData, "reason"),
    requireReason: config.require_reason,
    startTime: getFormString(formData, "start_time"),
    timeLimitMinutes: config.time_limit_minutes,
    today: getBusinessToday(),
  });

  if (!validation.ok) {
    redirectWithMessage(vehicleId, date, "error", validation.error);
  }

  const status = getBookingStatusForFreedom(config.allow_booking_freedom);
  const { data: createdBooking, error: createError } = await supabase
    .from("bookings")
    .insert({
      created_by: currentUser.id,
      date: validation.value.date,
      end_time: validation.value.end_time,
      is_all_day: validation.value.is_all_day,
      reason: validation.value.reason,
      start_time: validation.value.start_time,
      status,
      updated_by: currentUser.id,
      user_id: currentUser.id,
      vehicle_id: vehicle.id,
    })
    .select(BOOKING_SELECT)
    .single<BookingRecord>();

  if (createError || !createdBooking) {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      getBookingPersistenceErrorMessage(createError) ??
        "Booking could not be saved."
    );
  }

  const actionType =
    status === "confirmed" ? "booking_confirmed" : "booking_requested";
  const { error: logError } = await supabase.from("log_entries").insert({
    action_type: actionType,
    actor_user_id: currentUser.id,
    booking_id: createdBooking.id,
    description:
      status === "confirmed"
        ? `Booking confirmed for "${vehicle.name}" on ${date}.`
        : `Booking requested for "${vehicle.name}" on ${date}.`,
    snapshot: { after: createdBooking },
    target_user_id: currentUser.id,
    target_vehicle_id: vehicle.id,
  });

  if (logError) {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      "Booking saved, but the audit log could not be written."
    );
  }

  revalidatePath(`/vehicles/${vehicleId}/date/${date}`);
  revalidatePath(`/vehicles/${vehicleId}/calendar`);
  redirectWithMessage(
    vehicleId,
    date,
    "success",
    status === "confirmed" ? "Booking confirmed." : "Booking request submitted."
  );
}

export async function cancelBooking(
  vehicleId: string,
  date: string,
  formData: FormData
) {
  const currentUser = await requireCurrentAppUser();
  const bookingId = getFormString(formData, "id");

  if (!bookingId) {
    redirectWithMessage(vehicleId, date, "error", "Missing booking id.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .eq("vehicle_id", vehicleId)
    .eq("date", date)
    .maybeSingle<BookingRecord>();

  if (beforeError || !before) {
    redirectWithMessage(vehicleId, date, "error", "Booking not found.");
  }

  if (before.user_id !== currentUser.id && currentUser.role !== "super_admin") {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      "You cannot cancel this booking."
    );
  }

  if (before.status !== "confirmed" && before.status !== "requested") {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      "This booking cannot be cancelled."
    );
  }

  const timingProblem = getCancellationTimingProblem({
    currentTimeMinutes: getBusinessTimeMinutes(),
    date: before.date,
    startTime: before.start_time,
    today: getBusinessToday(),
  });

  if (timingProblem) {
    redirectWithMessage(vehicleId, date, "error", timingProblem);
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      updated_by: currentUser.id,
    })
    .eq("id", before.id)
    .in("status", ["confirmed", "requested"])
    .select(BOOKING_SELECT)
    .maybeSingle<BookingRecord>();

  if (updateError || !updated) {
    redirectWithMessage(vehicleId, date, "error", "Booking could not be cancelled.");
  }

  const { error: logError } = await supabase.from("log_entries").insert({
    action_type: "booking_cancelled",
    actor_user_id: currentUser.id,
    booking_id: updated.id,
    description: `Booking cancelled for ${updated.date}.`,
    snapshot: { after: updated, before },
    target_user_id: updated.user_id,
    target_vehicle_id: updated.vehicle_id,
  });

  if (logError) {
    redirectWithMessage(
      vehicleId,
      date,
      "error",
      "Booking cancelled, but the audit log could not be written."
    );
  }

  revalidatePath(`/vehicles/${vehicleId}/date/${date}`);
  revalidatePath(`/vehicles/${vehicleId}/calendar`);
  redirectWithMessage(vehicleId, date, "success", "Booking cancelled.");
}
