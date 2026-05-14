import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Given a user-facing login name, returns the real Supabase Auth email
 * for that user, or null if no matching active user exists.
 *
 * Users only ever deal with their name and password. The database RPC runs
 * as a SECURITY DEFINER function so login can still resolve the hidden Auth
 * email after RLS is enabled.
 */
export async function lookupEmailByName(name: string): Promise<string | null> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("lookup_auth_email_by_name", {
    p_name: trimmedName,
  });

  if (error || typeof data !== "string" || !data) {
    return null;
  }

  return data;
}
