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
    }

    // Only allow same-origin absolute paths to prevent open-redirects
    const safeNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(new URL(`/error?error=No token hash or type`, request.url));
}