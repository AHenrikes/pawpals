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
      "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, reputation, is_current, is_default, created_at, updated_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  if (!fursonas) return badRequest(ERROR_MESSAGES.FURSONAS_NOT_FOUND);

  return okNoStore<{ fursonas: FursonaWithBoolean[] }>({
    fursonas: fursonas ?? [],
  });
});

export const POST = withUser(
  async ({ supabase, account }, req: NextRequest) => {
    const body = (await req.json().catch(() => ({}))) as FursonaWithBoolean;
    const display_name = normalizeRequiredName(body.display_name);
    const username = normalizeOptionalText(body.username);

    if (display_name.length === 0) {
      return badRequest(ERROR_MESSAGES.FURSONA_NAME_REQUIRED);
    }

    if (!username || username.length === 0) {
      return badRequest(ERROR_MESSAGES.FURSONA_USERNAME_REQUIRED);
    }

    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
      return badRequest(ERROR_MESSAGES.FURSONA_USERNAME_FORMAT);
    }

    const { data: inserted, error } = await supabase
      .schema("core")
      .from("fursonas")
      .insert({
        account_id: account.id,
        display_name,
        username,
        avatar_url: normalizeOptionalText(body.avatar_url) || undefined,
        banner_url: normalizeOptionalText(body.banner_url) || undefined,
        species: normalizeOptionalText(body.species),
        pronouns: normalizeOptionalText(body.pronouns),
        bio: normalizeOptionalText(body.bio),
        updated_at: body.updated_at ?? null,
        is_default: body.is_default ?? false,
        is_current: body.is_current ?? false,
      })
      .select(
        "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, updated_at",
      )
      .single();

    if (error) return badRequest(ERROR_MESSAGES.FURSONA_UPDATE_FAILED);

    // A transaction-safe RPC to switch current fursona
    const { error: switchError } = await supabase.rpc(
      "switch_current_fursona",
      {
        p_fursona_id: inserted.id,
      },
    );

    if (switchError) return badRequest(ERROR_MESSAGES.FURSONA_SWITCH_FAILED);

    return ok<{ fursona: FursonaInput }>({ fursona: inserted });
  },
);
