import { withUser } from "@/lib/auth/withUser";
import { serverError, notFound, ok } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { type AccountTypes } from "@/types/account";
import { type FursonaTypes } from "@/types/fursona";

export const GET = withUser(async ({ supabase }) => {
  const { data: profileRows, error } = await supabase.rpc("get_user_profile");

  if (error) return serverError(error.message);
  if (!profileRows || profileRows.length === 0)
    return notFound(ERROR_MESSAGES.ACCOUNT_NOT_FOUND);

  const profile = profileRows[0];

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
        reputation: profile.current_fursona_reputation,
        created_at: profile.current_fursona_created_at,
        updated_at: profile.current_fursona_updated_at,
        is_default: profile.current_fursona_is_default,
        is_current: true,
      }
    : null;

  return ok<{ account: AccountTypes; currentFursona: FursonaTypes | null }>({
    account: accountData,
    currentFursona,
  });
});
