import { AUTH_ROUTES } from "@/lib/constants/auth";
import { createServer } from "@repo/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { type User } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? AUTH_ROUTES.HOME;
  const supabase = await createServer();

  const errorRedirect = (msg: string) =>
    NextResponse.redirect(
      new URL(
        `${AUTH_ROUTES.ERROR}?error=${encodeURIComponent(msg)}`,
        request.url,
      ),
    );

  const handleUser = async (user: User) => {
    const metadata = user.user_metadata ?? {};
    const initFursona = metadata.onboarding_init_fursona;

    if (!initFursona) {
      const { data: existingAccount, error } = await supabase
        .schema("core")
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return errorRedirect(error.message);
      if (existingAccount) return null;
    }

    if (!initFursona?.display_name || !initFursona?.username || !user.email) {
      return errorRedirect(
        "Sign-up profile data is incomplete. Please sign up again.",
      );
    }

    const { error } = await supabase.rpc("create_account", {
      p_email: user.email,
      p_display_name: initFursona.display_name,
      p_username: initFursona.username,
      p_first_name: metadata.firstname,
      p_last_name: metadata.lastname,
      p_species: initFursona.species ?? null,
      p_pronouns: initFursona.pronouns ?? null,
      p_bio: initFursona.bio ?? null,
    });

    if (error) return errorRedirect(error.message);
    return null;
  };

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (error) return errorRedirect(error.message);
    if (data.user && type !== "email_change") {
      const redirectResponse = await handleUser(data.user);
      if (redirectResponse) return redirectResponse;
    }
  } else if (code) {
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) return errorRedirect(error.message);
    if (user) {
      const redirectResponse = await handleUser(user);
      if (redirectResponse) return redirectResponse;
    }
  } else {
    return NextResponse.redirect(
      new URL(`/error?error=No token hash or type`, request.url),
    );
  }

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
      ? next
      : "/";
  if (type !== "email_change") {
    await supabase.auth.updateUser({ data: { onboarding_init_fursona: null } });
  }
  return NextResponse.redirect(new URL(safeNext, request.url));
}
