import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createServer } from "@repo/supabase/server";
import { type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? AUTH_ROUTES.HOME;
  const supabase = await createServer();

  const errorRedirect = (msg: string): never =>
    redirect(`${AUTH_ROUTES.ERROR}?error=${encodeURIComponent(msg)}`);

  const handleUser = async (user: User) => {
    const metadata = user.user_metadata ?? {};
    const initFursona = metadata.onboarding_init_fursona;

    const { error } = await supabase.rpc("create_account_with_fursona", {
      p_user_id: user.id,
      p_firstname: metadata.firstname,
      p_lastname: metadata.lastname,
      p_email: user.email,
      p_dob: metadata.dob,
      p_display_name: initFursona.display_name,
      p_username: initFursona.username,
      p_species: initFursona.species ?? null,
      p_pronouns: initFursona.pronouns ?? null,
      p_bio: initFursona.bio ?? null,
    });

    if (error) errorRedirect(error.message);
  };

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) errorRedirect(error.message);
    if (data.user) await handleUser(data.user);
    const safeNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  if (code) {
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);
    if (error) errorRedirect(error.message);
    if (user) await handleUser(user);
    const safeNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(
    new URL(`/error?error=No token hash or type`, request.url),
  );
}
