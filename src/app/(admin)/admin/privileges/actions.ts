"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validatePrivilegeInput } from "@/lib/admin/privileges";
import { requireAdminAppUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PRIVILEGE_SELECT =
  "id, time_limit_minutes, allow_booking_freedom, max_days_in_future, require_reason, created_at, updated_at";

type PrivilegeConfigRecord = {
  allow_booking_freedom: boolean;
  created_at: string;
  id: string;
  max_days_in_future: number;
  require_reason: boolean;
  time_limit_minutes: number | null;
  updated_at: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(kind: "error" | "success", message: string): never {
  const params = new URLSearchParams({ [kind]: message });

  redirect(`/admin/privileges?${params.toString()}`);
}

function hasPrivilegeConfigChanged(
  before: PrivilegeConfigRecord,
  after: PrivilegeConfigRecord
) {
  return (
    before.time_limit_minutes !== after.time_limit_minutes ||
    before.allow_booking_freedom !== after.allow_booking_freedom ||
    before.max_days_in_future !== after.max_days_in_future ||
    before.require_reason !== after.require_reason
  );
}

export async function updatePrivileges(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const validation = validatePrivilegeInput({
    allowBookingFreedom: getFormString(formData, "allow_booking_freedom"),
    maxDaysInFuture: getFormString(formData, "max_days_in_future"),
    requireReason: getFormString(formData, "require_reason"),
    timeLimitMinutes: getFormString(formData, "time_limit_minutes"),
  });

  if (!id) {
    redirectWithMessage("error", "Missing privilege config id.");
  }

  if (!validation.ok) {
    redirectWithMessage("error", validation.error);
  }

  const supabase = createSupabaseAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("privilege_config")
    .select(PRIVILEGE_SELECT)
    .eq("id", id)
    .maybeSingle<PrivilegeConfigRecord>();

  if (beforeError || !before) {
    redirectWithMessage("error", "Privilege configuration not found.");
  }

  const after = {
    ...before,
    ...validation.value,
  };

  if (!hasPrivilegeConfigChanged(before, after)) {
    redirectWithMessage("success", "No privilege changes.");
  }

  const { data: updated, error } = await supabase
    .from("privilege_config")
    .update(validation.value)
    .eq("id", id)
    .select(PRIVILEGE_SELECT)
    .single<PrivilegeConfigRecord>();

  if (error || !updated) {
    redirectWithMessage("error", "Privileges could not be saved.");
  }

  const { error: logError } = await supabase.from("log_entries").insert({
    action_type: "privilege_updated",
    actor_user_id: currentUser.id,
    description: "Booking privileges updated.",
    snapshot: { after: updated, before },
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Privileges updated, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/privileges");
  redirectWithMessage("success", "Booking privileges updated.");
}
