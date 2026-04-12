import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getServiceRoleKey } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
