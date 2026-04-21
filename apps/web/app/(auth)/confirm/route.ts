import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createServer } from "@repo/supabase/server";
import { type EmailOtpType, type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";

async function createAccountSession(supabase: Awaited<ReturnType<typeof createServer>>, user: User, errorRedirect: (msg: string) => never) {
  const metadata = user.user_metadata ?? {};

  // Create account
  const { error: accountError } = await supabase
  .schema("core")
  .from("accounts")
  .upsert(
    {
      id: user.id,
      firstname: metadata.firstname,
      lastname: metadata.lastname,
      email: user.email,
    },
    { onConflict: "id" },
  );

  if(accountError) errorRedirect(accountError.message);

  // create default fursona
  const initFursona = metadata.onboarding_init_fursona;
  if (initFursona?.name) {
    const { error: fursonaError } = await supabase
    .schema("core")
    .from("fursonas")
    .insert( {
      account_id: user.id,
      name: initFursona.name,
      username: initFursona.username,
      species: initFursona.species,
      pronouns: initFursona.pronouns,
      bio: initFursona.bio,
      is_default: true,
    });

    if(fursonaError) errorRedirect(fursonaError.message);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? AUTH_ROUTES.HOME;

  const supabase = await createServer();
  const errorRedirect = (msg: string): never => redirect(`${AUTH_ROUTES.ERROR}?error=${encodeURIComponent(msg)}`)

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
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if(error) errorRedirect(error?.message);
    if(user) {
      await createAccountSession(supabase, user, errorRedirect)
    }

    errorRedirect("No token hash or type");
  }

  return NextResponse.redirect(new URL(`/error?error=No token hash or type`, request.url));
}
