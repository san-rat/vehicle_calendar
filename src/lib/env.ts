type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local before using Supabase."
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local before using Supabase."
    );
  }

  return { url, anonKey };
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local. Never prefix it with NEXT_PUBLIC_."
    );
  }

  return key;
}
