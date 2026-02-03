type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(
        ", "
      )}. Add them to .env.local before using Supabase.`
    );
  }

  return { url, anonKey };
}
