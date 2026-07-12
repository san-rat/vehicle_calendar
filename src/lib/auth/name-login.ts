import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Given a user-facing login name, returns the real Supabase Auth email
 * for that user, or null if no matching active user exists.
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

  return null;
}
