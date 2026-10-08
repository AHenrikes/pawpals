import { withUser } from "@/lib/auth/withUser";
import { serverError, notFound, ok } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { type AccountTypes } from "@/types/account";
import { type FursonaTypes } from "@/types/fursona";
import { type NextRequest } from "next/server";

export const GET = withUser(
  async ({ supabase, account }, request: NextRequest) => {
    const { data: accountRows, error: accountError } = await supabase
      .schema("core")
      .from("accounts")
      .select("id, user_id, status, default_fursona_id, created_at, updated_at")
      .eq("id", account.id)
      .maybeSingle();

    if (accountError) return serverError(accountError.message);
    if (!accountRows) return notFound(ERROR_MESSAGES.ACCOUNT_NOT_FOUND);

    const { data: accountPrivateRows, error: privateError } = await supabase
      .schema("core")
      .from("account_private_details")
      .select("firstname, lastname, email, dob, created_at, updated_at")
      .eq("account_id", accountRows.id)
      .maybeSingle();

    if (privateError) return serverError(privateError.message);

    const requestedFursonaId =
      request.headers.get("x-acting-fursona-id") ??
      accountRows.default_fursona_id;
    const { data: defaultFursona, error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        "id, username, display_name, avatar_url, banner_url, species, pronouns, bio, created_at, updated_at",
      )
      .eq("account_id", accountRows.id)
      .eq("id", requestedFursonaId ?? "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    if (fursonaError) return serverError(fursonaError.message);

    const profile = {
      account_id: accountRows.id,
      account_firstname: accountPrivateRows?.firstname ?? null,
      account_lastname: accountPrivateRows?.lastname ?? null,
      account_email: accountPrivateRows?.email ?? null,
      account_dob: accountPrivateRows?.dob ?? null,
      account_created_at: accountRows.created_at,
      account_updated_at: accountRows.updated_at,
      current_fursona_id: defaultFursona?.id ?? null,
      current_fursona_username: defaultFursona?.username ?? null,
      current_fursona_display_name: defaultFursona?.display_name ?? null,
      current_fursona_avatar_url: defaultFursona?.avatar_url ?? null,
      current_fursona_banner_url: defaultFursona?.banner_url ?? null,
      current_fursona_species: defaultFursona?.species ?? null,
      current_fursona_pronouns: defaultFursona?.pronouns ?? null,
      current_fursona_bio: defaultFursona?.bio ?? null,
      current_fursona_created_at: defaultFursona?.created_at ?? null,
      current_fursona_updated_at: defaultFursona?.updated_at ?? null,
      current_fursona_is_default: !!defaultFursona,
    };

    const accountData = {
      id: profile.account_id,
      firstname: profile.account_firstname,
      lastname: profile.account_lastname,
      email: profile.account_email,
      dob: profile.account_dob,
      created_at: profile.account_created_at,
      updated_at: profile.account_updated_at,
    };

    const currentFursona = profile.current_fursona_id
      ? {
          id: profile.current_fursona_id,
          username: profile.current_fursona_username,
          display_name: profile.current_fursona_display_name,
          avatar_url: profile.current_fursona_avatar_url,
          banner_url: profile.current_fursona_banner_url,
          species: profile.current_fursona_species,
          pronouns: profile.current_fursona_pronouns,
          bio: profile.current_fursona_bio,
          created_at: profile.current_fursona_created_at,
          updated_at: profile.current_fursona_updated_at,
          is_default: profile.current_fursona_is_default,
          is_current: !!profile.current_fursona_is_default,
        }
      : null;

    return ok<{ account: AccountTypes; currentFursona: FursonaTypes | null }>({
      account: accountData,
      currentFursona,
    });
  },
);
