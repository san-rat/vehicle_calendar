"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAppUser } from "@/lib/auth/user";
import {
  getApprovalTimingProblem,
  getBusinessTimeMinutes,
  getConfirmedBookingConflicts,
  validateOverrideConfirmation,
  validateOverrideNote,
  validateRejectionReason,
  type BookingStatus,
} from "@/lib/booking/bookings";
import { getBusinessToday } from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BOOKING_SELECT =
  "id, user_id, vehicle_id, date, start_time, end_time, is_all_day, reason, status, created_by, updated_by, created_at, updated_at";

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

type JoinedEntity = {
  is_active: boolean;
  name: string;
};

type BookingRequestRecord = BookingRecord & {
  booking_user: JoinedEntity | JoinedEntity[] | null;
  booking_vehicle: JoinedEntity | JoinedEntity[] | null;
};

type ConfirmedBookingRecord = BookingRecord;

type AuditLogEntry = {
  action_type: "booking_confirmed" | "booking_overridden" | "booking_rejected";
  actor_user_id: string;
  booking_id: string;
  description: string;
  snapshot: Record<string, unknown>;
  target_user_id: string;
  target_vehicle_id: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(kind: "error" | "success", message: string): never {
  const params = new URLSearchParams({ [kind]: message });

  redirect(`/admin/requests?${params.toString()}`);
}

function getJoinedOne<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getBookingSnapshot(booking: BookingRecord): BookingRecord {
  return {
    created_at: booking.created_at,
    created_by: booking.created_by,
    date: booking.date,
    end_time: booking.end_time,
    id: booking.id,
    is_all_day: booking.is_all_day,
    reason: booking.reason,
    start_time: booking.start_time,
    status: booking.status,
    updated_at: booking.updated_at,
    updated_by: booking.updated_by,
    user_id: booking.user_id,
    vehicle_id: booking.vehicle_id,
  };
}

export async function approveBookingRequest(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const overrideConfirmation = getFormString(formData, "override_confirmation");
  const overrideNoteValidation = validateOverrideNote(
    getFormString(formData, "override_note")
  );

  if (!id) {
    redirectWithMessage("error", "Missing booking request id.");
  }

  if (!overrideNoteValidation.ok) {
    redirectWithMessage("error", overrideNoteValidation.error);
  }

  const supabase = createSupabaseAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("bookings")
    .select(
      `${BOOKING_SELECT}, booking_user:users!bookings_user_id_fkey(name, is_active), booking_vehicle:vehicles!bookings_vehicle_id_fkey(name, is_active)`
    )
    .eq("id", id)
    .maybeSingle<BookingRequestRecord>();

  if (beforeError || !before) {
    redirectWithMessage("error", "Booking request not found.");
  }

  if (before.status !== "requested") {
    redirectWithMessage("error", "This booking request is no longer pending.");
  }

  const member = getJoinedOne(before.booking_user);
  const vehicle = getJoinedOne(before.booking_vehicle);

  if (!member) {
    redirectWithMessage("error", "Requesting member not found.");
  }

  if (!vehicle) {
    redirectWithMessage("error", "Requested vehicle not found.");
  }

  if (!member.is_active) {
    redirectWithMessage("error", "This member is inactive and cannot be approved.");
  }

  if (!vehicle.is_active) {
    redirectWithMessage("error", "This vehicle is inactive and cannot be approved.");
  }

  const approvalProblem = getApprovalTimingProblem({
    currentTimeMinutes: getBusinessTimeMinutes(),
    date: before.date,
    startTime: before.start_time,
    today: getBusinessToday(),
  });

  if (approvalProblem) {
    redirectWithMessage("error", approvalProblem);
  }

  const { data: confirmedBookings, error: confirmedError } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("vehicle_id", before.vehicle_id)
    .eq("date", before.date)
    .eq("status", "confirmed");

  if (confirmedError) {
    redirectWithMessage("error", "Could not check confirmed booking conflicts.");
  }

  const conflicts = getConfirmedBookingConflicts(
    before,
    (confirmedBookings ?? []) as ConfirmedBookingRecord[]
  );

  let overriddenBookings: BookingRecord[] = [];
  const isOverrideApproval = conflicts.length > 0;
  const conflictBeforeSnapshots = new Map(
    conflicts.map((conflict) => [conflict.id, getBookingSnapshot(conflict)])
  );

  if (conflicts.length > 0) {
    const overrideConfirmationValidation = validateOverrideConfirmation(
      overrideConfirmation || null
    );

    if (!overrideConfirmationValidation.ok) {
      redirectWithMessage("error", overrideConfirmationValidation.error);
    }

    const { data: overrideRows, error: overrideError } = await supabase
      .from("bookings")
      .update({
        status: "overridden",
        updated_by: currentUser.id,
      })
      .in(
        "id",
        conflicts.map((conflict) => conflict.id)
      )
      .eq("status", "confirmed")
      .select(BOOKING_SELECT);

    if (
      overrideError ||
      !overrideRows ||
      overrideRows.length !== conflicts.length
    ) {
      redirectWithMessage(
        "error",
        "Conflicting bookings changed before override approval completed. Refresh and try again."
      );
    }

    overriddenBookings = overrideRows as BookingRecord[];
  }

  const beforeSnapshot = getBookingSnapshot(before);
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      updated_by: currentUser.id,
    })
    .eq("id", id)
    .eq("status", "requested")
    .select(BOOKING_SELECT)
    .maybeSingle<BookingRecord>();

  if (updateError || !updated) {
    redirectWithMessage("error", "Booking request could not be approved.");
  }

  const logEntries: AuditLogEntry[] = overriddenBookings.map((booking) => ({
    action_type: "booking_overridden",
    actor_user_id: currentUser.id,
    booking_id: booking.id,
    description: `Booking overridden by approved request for ${booking.date}.`,
    snapshot: {
      after: booking,
      approved_request_id: updated.id,
      before: conflictBeforeSnapshots.get(booking.id) ?? booking,
      override_note: overrideNoteValidation.value,
    },
    target_user_id: booking.user_id,
    target_vehicle_id: booking.vehicle_id,
  }));

  logEntries.push({
    action_type: "booking_confirmed",
    actor_user_id: currentUser.id,
    booking_id: updated.id,
    description: isOverrideApproval
      ? `Booking request approved with override for ${updated.date}.`
      : `Booking request approved for ${updated.date}.`,
    snapshot: {
      after: updated,
      before: beforeSnapshot,
      override_note: isOverrideApproval ? overrideNoteValidation.value : null,
      overridden_booking_ids: overriddenBookings.map((booking) => booking.id),
    },
    target_user_id: updated.user_id,
    target_vehicle_id: updated.vehicle_id,
  });

  const { error: logError } = await supabase.from("log_entries").insert(logEntries);

  if (logError) {
    redirectWithMessage(
      "error",
      "Request approved, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/vehicles/${updated.vehicle_id}/date/${updated.date}`);
  revalidatePath(`/vehicles/${updated.vehicle_id}/calendar`);
  redirectWithMessage("success", "Request approved.");
}

export async function rejectBookingRequest(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const reasonValidation = validateRejectionReason(
    getFormString(formData, "rejection_reason")
  );

  if (!id) {
    redirectWithMessage("error", "Missing booking request id.");
  }

  if (!reasonValidation.ok) {
    redirectWithMessage("error", reasonValidation.error);
  }

  const supabase = createSupabaseAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", id)
    .maybeSingle<BookingRecord>();

  if (beforeError || !before) {
    redirectWithMessage("error", "Booking request not found.");
  }

  if (before.status !== "requested") {
    redirectWithMessage("error", "This booking request is no longer pending.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "rejected",
      updated_by: currentUser.id,
    })
    .eq("id", id)
    .eq("status", "requested")
    .select(BOOKING_SELECT)
    .maybeSingle<BookingRecord>();

  if (updateError || !updated) {
    redirectWithMessage("error", "Booking request could not be rejected.");
  }

  const { error: logError } = await supabase.from("log_entries").insert({
    action_type: "booking_rejected",
    actor_user_id: currentUser.id,
    booking_id: updated.id,
    description: `Booking request rejected for ${updated.date}.`,
    snapshot: {
      after: updated,
      before,
      rejection_reason: reasonValidation.value,
    },
    target_user_id: updated.user_id,
    target_vehicle_id: updated.vehicle_id,
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Request rejected, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/vehicles/${updated.vehicle_id}/date/${updated.date}`);
  revalidatePath(`/vehicles/${updated.vehicle_id}/calendar`);
  redirectWithMessage("success", "Request rejected.");
}
