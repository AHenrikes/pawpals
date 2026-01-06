import { createServer } from "@repo/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createServer();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (error) {
      const url = new URL(`/error?error=${encodeURIComponent(error.message)}`, request.url);
      return NextResponse.redirect(url);

    } else {
      // Only allow same-origin absolute paths to prevent open-redirects
      const safeNext = next && next.startsWith("/") ? next : "/";
      const url = new URL(safeNext, request.url);
      const res = NextResponse.redirect(url);

      // short-lived, server-only flag for the signup-success flow
      res.cookies.set("signup_success", "1", {
        maxAge: 60,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return res;
    }
  }

  return NextResponse.redirect(new URL(`/error?error=No token hash or type`, request.url));
}