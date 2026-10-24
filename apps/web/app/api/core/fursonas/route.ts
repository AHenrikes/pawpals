import { withUser } from "@/lib/auth/withUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import type { FursonaWithBoolean, FursonaInput } from "@/types/fursona";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import { badRequest, serverError, ok, okNoStore } from "@/lib/api/responses";
import { type NextRequest } from "next/server";

export const GET = withUser(async ({ supabase, account }) => {
  const { data: fursonas, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "id, display_name, username, bio, species, pronouns, avatar_url, banner_url, visibility, featured_achievements, social_links, show_reputation, show_events, show_communities, status, created_at, updated_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  if (!fursonas) return badRequest(ERROR_MESSAGES.FURSONAS_NOT_FOUND);

  return okNoStore<{ fursonas: FursonaWithBoolean[] }>({
    fursonas: (fursonas ?? []).map((fursona) => ({
      ...fursona,
      is_current: false,
      is_default: fursona.id === account.default_fursona_id,
    })),
  });
});

export const POST = withUser(
  async ({ supabase, account }, req: NextRequest) => {
    const body = (await req.json().catch(() => ({}))) as FursonaWithBoolean;
    const display_name = normalizeRequiredName(body.display_name);
    const username = normalizeOptionalText(body.username);
    const wantsDefault = body.is_default === true || body.is_current === true;

    if (display_name.length === 0) {
      return badRequest(ERROR_MESSAGES.FURSONA_NAME_REQUIRED);
    }

    if (!username || username.length === 0) {
      return badRequest(ERROR_MESSAGES.FURSONA_USERNAME_REQUIRED);
    }

    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
      return badRequest(ERROR_MESSAGES.FURSONA_USERNAME_FORMAT);
    }

    const { data: inserted, error } = await supabase.rpc("create_fursona", {
      p_display_name: display_name,
      p_username: username,
      p_species: normalizeOptionalText(body.species),
      p_pronouns: normalizeOptionalText(body.pronouns),
      p_bio: normalizeOptionalText(body.bio),
    });

    if (error)
      return badRequest(error.message || ERROR_MESSAGES.FURSONA_UPDATE_FAILED);

    const fursonaId = typeof inserted === "string" ? inserted : inserted?.id;
    if (!fursonaId) return badRequest(ERROR_MESSAGES.FURSONA_UPDATE_FAILED);

    if (wantsDefault || !account.default_fursona_id) {
      const { error: defaultError } = await supabase.rpc(
        "set_default_fursona",
        {
          p_fursona_id: fursonaId,
        },
      );

      if (defaultError) {
        return badRequest(
          defaultError.message || ERROR_MESSAGES.FURSONA_SWITCH_FAILED,
        );
      }
    }

    const { data: createdFursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        "id, display_name, username, bio, species, pronouns, avatar_url, banner_url, visibility, featured_achievements, social_links, show_reputation, show_events, show_communities, status, created_at, updated_at",
      )
      .eq("id", fursonaId)
      .single();

    if (fetchError) return serverError(ERROR_MESSAGES.SERVER_ERROR);

    return ok<{
      fursona: FursonaInput & { is_default: boolean; is_current: boolean };
    }>({
      fursona: {
        ...createdFursona,
        is_default: wantsDefault || !account.default_fursona_id,
        is_current: false,
      },
    });
  },
);
