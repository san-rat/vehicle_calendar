"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lookupEmailByName } from "@/lib/auth/name-login";
import { getPostLoginPath, type AppUserRole } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function isAppUserRole(value: string): value is AppUserRole {
  return value === "member" || value === "super_admin";
}

export async function logInWithName(formData: FormData) {
  const name = getFormValue(formData, "name");
  const password = getFormValue(formData, "password");

  if (!name.trim() || !password) {
    redirect("/login?error=missing-credentials");
  }

  // Resolve the real Supabase Auth email from the user-facing name.
  // Users never need to know or enter an email address.
  const email = await lookupEmailByName(name);

  if (!email) {
    redirect("/login?error=invalid-credentials");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid-credentials");
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    await supabase.auth.signOut();
    redirect("/login?error=invalid-credentials");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError || !profile || !isAppUserRole(profile.role)) {
    await supabase.auth.signOut();
    redirect("/login?error=profile-missing");
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive-user");
  }

  revalidatePath("/", "layout");
  redirect(getPostLoginPath(profile.role));
}
