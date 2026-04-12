import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  const reason = request.nextUrl.searchParams.get("reason");
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";

  if (reason) {
    redirectUrl.searchParams.set("error", reason);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}
