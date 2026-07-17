import { requireUser } from "@/lib/auth/requireUser";
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
  serverError,
  unauthorized,
} from "@/lib/api/responses";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

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

  return ok<FursonaProfile>(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, account, response } = await requireUser();
  if (account === null) return unauthorized();
  if (response) return response;

  const { id } = await params;

  if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  const body = (await request.json().catch(() => ({}))) as FursonaWithBoolean;
  const { updates, error } = buildPatchUpdates(body);

  if (error) return badRequest(error);

  const hasUpdates = Object.keys(updates).length > 0;
  const isSettingCurrent = body.is_current === true;
  const isSettingDefault = body.is_default === true;

  if (!hasUpdates && !isSettingDefault)
    return badRequest("No valid fields to update.");

  if (hasUpdates) {
    if (isSettingCurrent) {
      const { error: switchError } = await supabase.rpc(
        "switch_current_fursona",
        {
          p_fursona_id: id,
        },
      );
      if (switchError) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    } else {
      const { error: updateError } = await supabase
        .schema("core")
        .from("fursonas")
        .update(updates)
        .eq("id", id)
        .eq("account_id", account.id);

      if (updateError) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }

  if (isSettingDefault) {
    const { error: setDefaultError } = await supabase.rpc(
      "set_default_fursona",
      {
        p_fursona_id: id,
      },
    );

    if (setDefaultError) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  }

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
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, account, response } = await requireUser();
  if (response) return response;
  if (account === null) return unauthorized();

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
}
