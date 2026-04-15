"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAppUser } from "@/lib/auth/user";
import { validateVehicleInput, type VehicleType } from "@/lib/admin/vehicles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const VEHICLE_SELECT = "id, name, type, is_active, created_at, updated_at";

type VehicleRecord = {
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
  updated_at: string;
};

type VehicleLogInput = {
  actionType: "vehicle_created" | "vehicle_updated" | "vehicle_deleted";
  actorUserId: string;
  description: string;
  snapshot: Record<string, unknown>;
  targetVehicleId?: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(kind: "error" | "success", message: string): never {
  const params = new URLSearchParams({ [kind]: message });

  redirect(`/admin/vehicles?${params.toString()}`);
}

function getVehicleDbErrorMessage(error: { code?: string } | null) {
  if (error?.code === "23505") {
    return "A vehicle with that name already exists.";
  }

  return "The vehicle could not be saved. Try again.";
}

async function writeVehicleLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  input: VehicleLogInput
) {
  const { error } = await supabase.from("log_entries").insert({
    action_type: input.actionType,
    actor_user_id: input.actorUserId,
    description: input.description,
    snapshot: input.snapshot,
    target_vehicle_id: input.targetVehicleId ?? null,
  });

  return error;
}

function hasVehicleChanged(before: VehicleRecord, after: VehicleRecord) {
  return (
    before.name !== after.name ||
    before.type !== after.type ||
    before.is_active !== after.is_active
  );
}

export async function createVehicle(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const validation = validateVehicleInput({
    isActive: getFormString(formData, "is_active"),
    name: getFormString(formData, "name"),
    type: getFormString(formData, "type"),
  });

  if (!validation.ok) {
    redirectWithMessage("error", validation.error);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert(validation.value)
    .select(VEHICLE_SELECT)
    .single<VehicleRecord>();

  if (error || !data) {
    redirectWithMessage("error", getVehicleDbErrorMessage(error));
  }

  const logError = await writeVehicleLog(supabase, {
    actionType: "vehicle_created",
    actorUserId: currentUser.id,
    description: `Vehicle "${data.name}" created.`,
    snapshot: { after: data },
    targetVehicleId: data.id,
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Vehicle created, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/vehicles");
  redirectWithMessage("success", `Vehicle "${data.name}" created.`);
}

export async function updateVehicle(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const validation = validateVehicleInput({
    isActive: getFormString(formData, "is_active"),
    name: getFormString(formData, "name"),
    type: getFormString(formData, "type"),
  });

  if (!id) {
    redirectWithMessage("error", "Missing vehicle id.");
  }

  if (!validation.ok) {
    redirectWithMessage("error", validation.error);
  }

  const supabase = createSupabaseAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("vehicles")
    .select(VEHICLE_SELECT)
    .eq("id", id)
    .maybeSingle<VehicleRecord>();

  if (beforeError || !before) {
    redirectWithMessage("error", "Vehicle not found.");
  }

  const after = {
    ...before,
    ...validation.value,
  };

  if (!hasVehicleChanged(before, after)) {
    redirectWithMessage("success", "No vehicle changes.");
  }

  const { data: updated, error } = await supabase
    .from("vehicles")
    .update(validation.value)
    .eq("id", id)
    .select(VEHICLE_SELECT)
    .single<VehicleRecord>();

  if (error || !updated) {
    redirectWithMessage("error", getVehicleDbErrorMessage(error));
  }

  const logError = await writeVehicleLog(supabase, {
    actionType: "vehicle_updated",
    actorUserId: currentUser.id,
    description: `Vehicle "${updated.name}" updated.`,
    snapshot: { after: updated, before },
    targetVehicleId: updated.id,
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Vehicle updated, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/vehicles");
  redirectWithMessage("success", `Vehicle "${updated.name}" updated.`);
}

export async function deleteVehicle(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const confirmation = getFormString(formData, "confirmation").trim();

  if (!id) {
    redirectWithMessage("error", "Missing vehicle id.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select(VEHICLE_SELECT)
    .eq("id", id)
    .maybeSingle<VehicleRecord>();

  if (vehicleError || !vehicle) {
    redirectWithMessage("error", "Vehicle not found.");
  }

  if (confirmation !== vehicle.name) {
    redirectWithMessage(
      "error",
      `Type "${vehicle.name}" exactly to delete this vehicle.`
    );
  }

  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("vehicle_id", id)
    .limit(1);

  if (bookingError) {
    redirectWithMessage("error", "Could not verify vehicle bookings.");
  }

  if (bookingRows && bookingRows.length > 0) {
    redirectWithMessage(
      "error",
      "This vehicle has bookings. Set it inactive instead."
    );
  }

  const { error: deleteError } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id);

  if (deleteError) {
    redirectWithMessage("error", "Vehicle could not be deleted.");
  }

  const logError = await writeVehicleLog(supabase, {
    actionType: "vehicle_deleted",
    actorUserId: currentUser.id,
    description: `Vehicle "${vehicle.name}" deleted.`,
    snapshot: { before: vehicle },
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Vehicle deleted, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/vehicles");
  redirectWithMessage("success", `Vehicle "${vehicle.name}" deleted.`);
}
