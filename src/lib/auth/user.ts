import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppUserRole = "member" | "super_admin";

export type AppUser = {
  id: string;
  name: string;
  role: AppUserRole;
  is_active: boolean;
};

type AppUserState = {
  problem?: "inactive-user" | "profile-missing";
  user: AppUser | null;
};

function isAppUserRole(value: string): value is AppUserRole {
  return value === "member" || value === "super_admin";
}

export function getPostLoginPath(_role: AppUserRole) {
  return "/vehicles";
}

export function getLoginErrorMessage(error?: string) {
  switch (error) {
    case "inactive-user":
      return "Your account is inactive. Contact a super admin.";
    case "invalid-credentials":
      return "Invalid name or password.";
    case "invalid-name":
      return "Enter a valid name to sign in.";
    case "missing-credentials":
      return "Enter both your name and password.";
    case "profile-missing":
      return "Your auth account is missing a linked profile row.";
    default:
      return null;
  }
}

export async function getCurrentAppUserState(): Promise<AppUserState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, name, role, is_active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError || !profile || !isAppUserRole(profile.role)) {
    return { problem: "profile-missing", user: null };
  }

  if (!profile.is_active) {
    return { problem: "inactive-user", user: null };
  }

  return {
    user: {
      id: profile.id,
      is_active: profile.is_active,
      name: profile.name,
      role: profile.role,
    },
  };
}

export async function requireCurrentAppUser() {
  const { user, problem } = await getCurrentAppUserState();

  if (problem) {
    redirect(`/auth/logout?reason=${problem}`);
  }

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdminAppUser() {
  const user = await requireCurrentAppUser();

  if (user.role !== "super_admin") {
    redirect("/vehicles");
  }

  return user;
}
