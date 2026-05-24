import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createServer } from "@repo/supabase/server";
import { type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";

async function createAccountSession(
  supabase: Awaited<ReturnType<typeof createServer>>,
  user: User,
  errorRedirect: (msg: string) => never,
) {
  const metadata = user.user_metadata ?? {};

  // Create account
  const { error: accountError } = await supabase
    .schema("core")
    .from("accounts")
    .upsert(
      {
        user_id: user.id,
        firstname: metadata.firstname,
        lastname: metadata.lastname,
        email: user.email,
        dob: metadata.dob,
      },
      { onConflict: "user_id" },
    );

  if (accountError) errorRedirect(accountError.message);

  // Get the account id
  const { data: accountData, error: fetchError } = await supabase
    .schema("core")
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (fetchError || !accountData)
    errorRedirect(fetchError?.message || "Failed to retrieve account");

  // create default fursona
  const initFursona = metadata.onboarding_init_fursona;
  if (initFursona.display_name) {
    const { error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .insert({
        account_id: accountData.id,
        display_name: initFursona.display_name,
        username: initFursona.username,
        species: initFursona.species,
        pronouns: initFursona.pronouns,
        bio: initFursona.bio,
        is_current: true,
        is_default: true,
      });

    if (fursonaError) errorRedirect(fursonaError.message);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? AUTH_ROUTES.HOME;

  const supabase = await createServer();
  const errorRedirect = (msg: string): never =>
    redirect(`${AUTH_ROUTES.ERROR}?error=${encodeURIComponent(msg)}`);

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) errorRedirect(error.message);

    const user = data.user;
    if (user) {
      await createAccountSession(supabase, user, errorRedirect);
    }

    // Only allow same-origin absolute paths to prevent open-redirects
    const safeNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  if (code) {
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);
    if (error) errorRedirect(error?.message);
    if (user) {
      await createAccountSession(supabase, user, errorRedirect);
    }

    // Only allow same-origin absolute paths to prevent open-redirects
    const safeNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(
    new URL(`/error?error=No token hash or type`, request.url),
  );
}
