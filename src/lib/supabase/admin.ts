import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getOptionalServiceRoleKey, getPublicSupabaseEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { anonKey, url } = getPublicSupabaseEnv();
  const serviceRoleKey = getOptionalServiceRoleKey() ?? anonKey;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
