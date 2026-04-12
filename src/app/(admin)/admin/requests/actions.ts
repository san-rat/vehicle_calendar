"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAppUser } from "@/lib/auth/user";
import { validateRejectionReason, type BookingStatus } from "@/lib/booking/bookings";
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

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(kind: "error" | "success", message: string): never {
  const params = new URLSearchParams({ [kind]: message });

  redirect(`/admin/requests?${params.toString()}`);
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
      "Booking request rejected, but the audit log entry could not be written."
    );
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/vehicles/${updated.vehicle_id}/date/${updated.date}`);
  revalidatePath(`/vehicles/${updated.vehicle_id}/calendar`);
  redirectWithMessage("success", "Booking request rejected.");
}
