"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildInternalMemberEmail,
  getSelfMemberEditProblem,
  validateMemberCreateInput,
  validateMemberUpdateInput,
  validatePasswordResetInput,
  type MemberRole,
} from "@/lib/admin/members";
import { requireAdminAppUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MEMBER_SELECT = "id, name, role, color_hex, is_active, created_at, updated_at";

type MemberRecord = {
  color_hex: string;
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  role: MemberRole;
  updated_at: string;
};

type MemberLogInput = {
  actionType:
    | "member_created"
    | "member_updated"
    | "member_deleted"
    | "member_role_changed"
    | "member_password_reset";
  actorUserId: string;
  description: string;
  snapshot: Record<string, unknown>;
  targetUserId?: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(kind: "error" | "success", message: string): never {
  const params = new URLSearchParams({ [kind]: message });

  redirect(`/admin/members?${params.toString()}`);
}

function getMemberDbErrorMessage(error: { code?: string } | null) {
  if (error?.code === "23505") {
    return "A member with that name already exists.";
  }

  return "The member could not be saved. Try again.";
}

async function writeMemberLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  input: MemberLogInput
) {
  const { error } = await supabase.from("log_entries").insert({
    action_type: input.actionType,
    actor_user_id: input.actorUserId,
    description: input.description,
    snapshot: input.snapshot,
    target_user_id: input.targetUserId ?? null,
  });

  return error;
}

function hasMemberChanged(before: MemberRecord, after: MemberRecord) {
  return (
    before.name !== after.name ||
    before.role !== after.role ||
    before.is_active !== after.is_active
  );
}

async function getMemberById(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  id: string
) {
  const { data, error } = await supabase
    .from("users")
    .select(MEMBER_SELECT)
    .eq("id", id)
    .maybeSingle<MemberRecord>();

  return { data, error };
}

export async function createMember(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const supabase = createSupabaseAdminClient();
  const { data: existingUsers, error: existingUsersError } = await supabase
    .from("users")
    .select("color_hex");

  if (existingUsersError) {
    redirectWithMessage("error", "Could not load member colors.");
  }

  const validation = validateMemberCreateInput({
    existingColors: (existingUsers ?? []).map((user) => user.color_hex),
    isActive: getFormString(formData, "is_active"),
    name: getFormString(formData, "name"),
    password: getFormString(formData, "password"),
    passwordConfirmation: getFormString(formData, "password_confirmation"),
    role: getFormString(formData, "role"),
  });

  if (!validation.ok) {
    redirectWithMessage("error", validation.error);
  }

  const email = buildInternalMemberEmail(
    validation.value.name,
    randomUUID().replace(/-/g, "")
  );
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: validation.value.password,
    user_metadata: {
      name: validation.value.name,
    },
  });

  if (authError || !authUser) {
    redirectWithMessage("error", "Auth account could not be created.");
  }

  const { data: createdProfile, error: profileError } = await supabase
    .from("users")
    .upsert(
      {
        color_hex: validation.value.color_hex,
        id: authUser.id,
        is_active: validation.value.is_active,
        name: validation.value.name,
        role: validation.value.role,
      },
      { onConflict: "id" }
    )
    .select(MEMBER_SELECT)
    .single<MemberRecord>();

  if (profileError || !createdProfile) {
    await supabase.auth.admin.deleteUser(authUser.id);
    redirectWithMessage("error", getMemberDbErrorMessage(profileError));
  }

  const logError = await writeMemberLog(supabase, {
    actionType: "member_created",
    actorUserId: currentUser.id,
    description: `Member "${createdProfile.name}" created.`,
    snapshot: { after: createdProfile },
    targetUserId: createdProfile.id,
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Member created, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/members");
  redirectWithMessage("success", `Member "${createdProfile.name}" created.`);
}

export async function updateMember(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const validation = validateMemberUpdateInput({
    isActive: getFormString(formData, "is_active"),
    name: getFormString(formData, "name"),
    role: getFormString(formData, "role"),
  });

  if (!id) {
    redirectWithMessage("error", "Missing member id.");
  }

  if (!validation.ok) {
    redirectWithMessage("error", validation.error);
  }

  const selfProblem = getSelfMemberEditProblem({
    currentUserId: currentUser.id,
    nextIsActive: validation.value.is_active,
    nextRole: validation.value.role,
    targetUserId: id,
  });

  if (selfProblem) {
    redirectWithMessage("error", selfProblem);
  }

  const supabase = createSupabaseAdminClient();
  const { data: before, error: beforeError } = await getMemberById(supabase, id);

  if (beforeError || !before) {
    redirectWithMessage("error", "Member not found.");
  }

  const after = {
    ...before,
    ...validation.value,
  };

  if (!hasMemberChanged(before, after)) {
    redirectWithMessage("success", "No member changes.");
  }

  const { data: updated, error } = await supabase
    .from("users")
    .update(validation.value)
    .eq("id", id)
    .select(MEMBER_SELECT)
    .single<MemberRecord>();

  if (error || !updated) {
    redirectWithMessage("error", getMemberDbErrorMessage(error));
  }

  const roleChanged = before.role !== updated.role;
  const logError = await writeMemberLog(supabase, {
    actionType: roleChanged ? "member_role_changed" : "member_updated",
    actorUserId: currentUser.id,
    description: roleChanged
      ? `Member "${updated.name}" role changed.`
      : `Member "${updated.name}" updated.`,
    snapshot: { after: updated, before },
    targetUserId: updated.id,
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Member updated, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/members");
  redirectWithMessage("success", `Member "${updated.name}" updated.`);
}

export async function resetMemberPassword(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const validation = validatePasswordResetInput({
    password: getFormString(formData, "password"),
    passwordConfirmation: getFormString(formData, "password_confirmation"),
  });

  if (!id) {
    redirectWithMessage("error", "Missing member id.");
  }

  if (!validation.ok) {
    redirectWithMessage("error", validation.error);
  }

  const supabase = createSupabaseAdminClient();
  const { data: member, error: memberError } = await getMemberById(supabase, id);

  if (memberError || !member) {
    redirectWithMessage("error", "Member not found.");
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(id, {
    password: validation.value.password,
  });

  if (authError) {
    redirectWithMessage("error", "Password could not be reset.");
  }

  const logError = await writeMemberLog(supabase, {
    actionType: "member_password_reset",
    actorUserId: currentUser.id,
    description: `Password reset for member "${member.name}".`,
    snapshot: { target: member },
    targetUserId: member.id,
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Password reset, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/members");
  redirectWithMessage("success", `Password reset for "${member.name}".`);
}

export async function deleteMember(formData: FormData) {
  const currentUser = await requireAdminAppUser();
  const id = getFormString(formData, "id");
  const confirmation = getFormString(formData, "confirmation").trim();

  if (!id) {
    redirectWithMessage("error", "Missing member id.");
  }

  const selfProblem = getSelfMemberEditProblem({
    currentUserId: currentUser.id,
    isDelete: true,
    targetUserId: id,
  });

  if (selfProblem) {
    redirectWithMessage("error", selfProblem);
  }

  const supabase = createSupabaseAdminClient();
  const { data: member, error: memberError } = await getMemberById(supabase, id);

  if (memberError || !member) {
    redirectWithMessage("error", "Member not found.");
  }

  if (confirmation !== member.name) {
    redirectWithMessage(
      "error",
      `Type "${member.name}" exactly to delete this member.`
    );
  }

  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", id)
    .limit(1);

  if (bookingError) {
    redirectWithMessage("error", "Could not verify member bookings.");
  }

  if (bookingRows && bookingRows.length > 0) {
    redirectWithMessage(
      "error",
      "This member has bookings. Set them inactive instead."
    );
  }

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);

  if (authDeleteError) {
    redirectWithMessage("error", "Auth account could not be deleted.");
  }

  const logError = await writeMemberLog(supabase, {
    actionType: "member_deleted",
    actorUserId: currentUser.id,
    description: `Member "${member.name}" deleted.`,
    snapshot: { before: member },
  });

  if (logError) {
    redirectWithMessage(
      "error",
      "Member deleted, but the audit log could not be written."
    );
  }

  revalidatePath("/admin/members");
  redirectWithMessage("success", `Member "${member.name}" deleted.`);
}
