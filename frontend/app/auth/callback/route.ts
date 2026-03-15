import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/workbench";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/workbench";
  const error = searchParams.get("error");

  // Handle authentication errors
  if (error) {
    console.error("Auth error:", error);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      // Ensure cookies are wired via shared helper so middleware and routes stay in sync.
      await cookies();
      const supabase = await createServerSupabaseClient();
      
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Exchange code error:", exchangeError);
        const loginUrl = new URL("/login", origin);
        loginUrl.searchParams.set("error", "exchange_failed");
        loginUrl.searchParams.set("message", exchangeError.message);
        return NextResponse.redirect(loginUrl);
      }
      
      // Successfully authenticated - redirect to intended destination
      console.log("Authentication successful, redirecting to:", next);
      return NextResponse.redirect(new URL(next, origin));
    } catch (err) {
      console.error("Callback error:", err);
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "callback_failed");
      loginUrl.searchParams.set("message", "Authentication failed");
      return NextResponse.redirect(loginUrl);
    }
  }

  // No code provided - redirect to login
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "no_code");
  return NextResponse.redirect(loginUrl);
}
