import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const legacyLoginEmails: Record<string, string> = {
  "super admin": "super@admin.com",
};

/**
 * Given a user-facing login name, returns the real Supabase Auth email
 * for that user, or null if no matching active user exists.
 *
 * Flow: name → look up public.users (case-insensitive) → get user ID
 *       → use admin client to get the real auth email by ID.
 *
 * This means the email format in Supabase Auth does not matter at all —
 * users only ever deal with their name and password.
 */
export async function lookupEmailByName(name: string): Promise<string | null> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: rpcEmail } = await supabase.rpc("lookup_auth_email_by_name", {
    p_name: trimmedName,
  });

  if (typeof rpcEmail === "string" && rpcEmail) {
    return rpcEmail;
  }

  const legacyEmail = legacyLoginEmails[trimmedName.toLowerCase()];

  if (legacyEmail) {
    return legacyEmail;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id")
    .ilike("name", trimmedName)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error: authError } =
    await adminClient.auth.admin.getUserById(profile.id);

  if (authError || !data.user?.email) {
    return null;
  }

  return data.user.email;
}
