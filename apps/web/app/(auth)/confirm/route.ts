import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createServer } from "@repo/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";

async function createAccountSession(supabase: Awaited<ReturnType<typeof createServer>>, errorRedirect: (msg: string) => never) {
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return;

  const metadata = user.user_metadata ?? {};

  // Create account
  const { error: accountError } = await supabase
  .from("core.accounts")
  .upsert(
    {
      id: user.id,
      firstname: metadata.firstname,
      lastname: metadata.lastname,
      email: metadata.email
    },
    { onConflict: "id" }
  );

  if(accountError) errorRedirect(accountError.message);

  // create default fursona
  const defaultFursona = metadata.onboarding_main_fursona;
  if (defaultFursona?.name) {
    const { error: fursonaError } = await supabase
    .from("core.fursonas")
    .insert( {
      account_id: user.id,
      name: defaultFursona.name,
      username: defaultFursona.username,
      species: defaultFursona.species,
      pronouns: defaultFursona.pronouns,
      bio: defaultFursona.bio,
      is_default: true
    });

    if(fursonaError) errorRedirect(fursonaError.message);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createServer();
  const errorRedirect = (msg: string): never => redirect(`${AUTH_ROUTES.ERROR}?error=${encodeURIComponent(msg)}`)

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) errorRedirect(error.message);

    await createAccountSession(supabase, errorRedirect);
    
    // Only allow same-origin absolute paths to prevent open-redirects
    const safeNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(new URL(`/error?error=No token hash or type`, request.url));
}