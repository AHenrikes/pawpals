import { type NextRequest } from "next/server";
import type { FursonaTypesWithID } from "@/types/fursona";
import type { RouteContext } from "@/lib/types/api";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import { requireUser } from "@/lib/auth/requireUser";
import {
  unauthorized,
  badRequest,
  serverError,
  notFound,
} from "@/lib/api/responses";

function buildPatchUpdates(body: FursonaTypesWithID) {
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

export async function PATCH(
  request: NextRequest,
  context: RouteContext<{ id: string }>,
) {
  const { supabase, account, response } = await requireUser();

  if (response) return response;
  if (account === null) return unauthorized();

  const { id: fursonaId } = await context.params;

  if (!fursonaId) return badRequest("Missing fursona id.");

  const body = (await request.json().catch(() => ({}))) as FursonaTypesWithID;
  const { updates, error } = buildPatchUpdates(body);

  if (error) return badRequest(error);

  const hasUpdates = Object.keys(updates).length > 0;
  const isSettingCurrent = body.is_current === true;
  const isSettingDefault = body.is_default === true;

  if (!hasUpdates && !isSettingDefault) {
    return badRequest("No valid fields to update.");
  }

  if (hasUpdates) {
    if (isSettingCurrent) {
      // Use a transaction-safe RPC to atomically switch is_current
      const { error: switchError } = await supabase.rpc(
        "switch_current_fursona",
        {
          p_account_id: account.id,
          p_fursona_id: fursonaId,
          p_updates: updates, // pass remaining field updates too
        },
      );
      if (switchError) return badRequest(switchError.message);
    } else {
      const { error: updateError } = await supabase
        .schema("core")
        .from("fursonas")
        .update(updates)
        .eq("id", fursonaId)
        .eq("account_id", account.id);

      if (updateError) return badRequest(updateError.message);
    }
  }

  if (isSettingDefault) {
    const { error: setDefaultError } = await supabase.rpc(
      "set_default_fursona",
      {
        p_fursona_id: fursonaId,
      },
    );
    if (setDefaultError) return badRequest(setDefaultError.message);
  }

  const { data: fursona, error: fetchError } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current",
    )
    .eq("id", fursonaId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (fetchError) return serverError(fetchError.message);
  if (!fursona) return notFound("Fursona not found.");

  return new Response(JSON.stringify({ fursona }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<{ id: string }>,
) {
  const { supabase, account, response } = await requireUser();
  if (response) return response;
  if (account === null) return unauthorized();

  const { id: fursonaId } = await context.params;

  if (!fursonaId) return badRequest("Missing fursona id.");

  // Verify user has at least one fursona after deletion
  const { count, error: countError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);

  if (countError) return serverError(countError.message);
  if ((count ?? 0) <= 1) {
    return badRequest("At least one fursona is required.");
  }

  // Delete the fursona
  const { error: deleteError } = await supabase
    .schema("core")
    .from("fursonas")
    .delete()
    .eq("id", fursonaId)
    .eq("account_id", account.id);

  if (deleteError) return badRequest(deleteError.message);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
