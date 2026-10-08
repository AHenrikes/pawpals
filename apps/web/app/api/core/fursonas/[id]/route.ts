import { withUser } from "@/lib/auth/withUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import {
  FursonaCreate,
  FursonaWithBoolean,
  type FursonaProfile,
} from "@/types/fursona";
import { NextRequest } from "next/server";
import {
  badRequest,
  notFound,
  ok,
  okPrivateRead,
  serverError,
} from "@/lib/api/responses";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import { type SupabaseClient } from "@supabase/supabase-js";

function buildPatchUpdates(body: FursonaWithBoolean) {
  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    const name = normalizeRequiredName(body.display_name);
    if (name.length === 0) {
      return {
        updates,
        error: "Fursona name cannot be empty.",
      };
    }
    updates.display_name = name;
  }

  const optionalFields = [
    "banner_url",
    "avatar_url",
    "species",
    "pronouns",
    "bio",
  ] as const;
  for (const field of optionalFields) {
    if (body[field] !== undefined) {
      updates[field] = normalizeOptionalText(body[field]);
    }
  }

  return { updates, error: null };
}

async function applyFursonaPatch(
  supabase: SupabaseClient,
  fursonaId: string,
  accountId: string,
  body: FursonaWithBoolean,
  updates: Record<string, unknown>,
) {
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .schema("core")
      .from("fursonas")
      .update(updates)
      .eq("id", fursonaId)
      .eq("account_id", accountId);
    if (error) return error;
  }

  if (body.is_default === true || body.is_current === true) {
    const { error: setDefaultError } = await supabase.rpc(
      "set_default_fursona",
      {
        p_fursona_id: fursonaId,
      },
    );
    if (setDefaultError) return setDefaultError;
  }

  return null;
}

export const GET = withUser(
  async (
    { supabase },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

    const { data: profile, error } = await supabase
      .schema("social")
      .rpc("get_fursona_profile_by_identifier", {
        p_identifier: id,
        p_actor_fursona_id: request.headers.get("x-acting-fursona-id") || null,
      })
      .maybeSingle();

    if (error?.code === "PGRST116")
      return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    if (!profile) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    return okPrivateRead<FursonaProfile>(profile as unknown as FursonaProfile);
  },
);

export const PATCH = withUser(
  async (
    { supabase, account },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const body = (await request.json().catch(() => ({}))) as FursonaWithBoolean;
    const { updates, error } = buildPatchUpdates(body);

    if (error) return badRequest(error);

    const hasUpdates = Object.keys(updates).length > 0;
    const isSettingDefault =
      body.is_default === true || body.is_current === true;

    if (!hasUpdates && !isSettingDefault)
      return badRequest("No valid fields to update.");

    const patchError = await applyFursonaPatch(
      supabase,
      id,
      account.id,
      body,
      updates,
    );

    if (patchError) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const { data: fursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, updated_at",
      )
      .eq("id", id)
      .eq("account_id", account.id)
      .maybeSingle();

    if (fetchError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
    if (!fursona) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

    return ok<{
      fursona: FursonaCreate & { is_default: boolean; is_current: boolean };
    }>({
      fursona: {
        ...fursona,
        is_default:
          account.default_fursona_id === fursona.id || isSettingDefault,
        is_current: false,
      },
    });
  },
);

export const DELETE = withUser(
  async (
    { supabase },
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const { error: deleteError } = await supabase.rpc("delete_fursona", {
      p_fursona_id: id,
    });

    if (deleteError) return badRequest(deleteError.message);

    return ok({ ok: true });
  },
);
