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
  serverError
} from "@/lib/api/responses";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import type { SupabaseClient } from "@supabase/supabase-js";

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
    "username",
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

  // Boolean fields must be handled explicitly to avoid normalizeOptionalText
  // converting non-string booleans to null and violating NOT NULL constraints.
  if (body.is_current !== undefined) {
    updates.is_current = Boolean(body.is_current);
  }

  if (body.is_default !== undefined) {
    updates.is_default = Boolean(body.is_default);
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
    if (body.is_current === true) {
      const { error } = await supabase.rpc("switch_current_fursona", {
        p_fursona_id: fursonaId,
      });
      if (error) return error;
    } else {
      const { error } = await supabase
        .schema("core")
        .from("fursonas")
        .update(updates)
        .eq("id", fursonaId)
        .eq("account_id", accountId);
      if (error) return error;
    }
  }

  if (body.is_default === true) {
    const { error } = await supabase.rpc("set_default_fursona", {
      p_fursona_id: fursonaId,
    });
    if (error) return error;
  }

  return null;
}

export const GET = withUser(async ({ supabase }, _req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  // Support both UUID-based ID and username lookups
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const { data, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "id, username, display_name, avatar_url, banner_url, species, pronouns, bio, reputation, created_at",
    )
    .eq(isUuid ? "id" : "username", id)
    .eq("is_active", true)
    .single();

  if (error?.code === "PGRST116")
    return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
  if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  if (!data) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  return okPrivateRead<FursonaProfile>(data);
});

export const PATCH = withUser(async ({ supabase, account }, request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  const body = (await request.json().catch(() => ({}))) as FursonaWithBoolean;
  const { updates, error } = buildPatchUpdates(body);

  if (error) return badRequest(error);

  const hasUpdates = Object.keys(updates).length > 0;
  const isSettingDefault = body.is_default === true;

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
      "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current, updated_at",
    )
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (fetchError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!fursona) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  return ok<{ fursona: FursonaCreate }>({ fursona });
});

export const DELETE = withUser(async ({ supabase, account }, _req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  // Verify user has at least one fursona after deletion
  const { count, error: countError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);

  if (countError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if ((count ?? 0) <= 1) return badRequest("Cannot delete last fursona");

  // Delete the fursona
  const { error: deleteError } = await supabase
    .schema("core")
    .from("fursonas")
    .delete()
    .eq("id", id)
    .eq("account_id", account.id);

  if (deleteError) return badRequest(deleteError.message);

  return ok({ ok: true });
});
