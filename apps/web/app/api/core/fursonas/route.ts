import { type NextRequest } from "next/server";
import type { FursonaTypes } from "@/types/fursona";
import { normalizeOptionalText, normalizeRequiredName } from "@/utils/normalizeInput"
import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { unauthorized, badRequest, serverError, notFound } from "@/lib/api/responses";

function buildPatchUpdates(body: FursonaTypes) {
  const updates: Record<string, string | null> = {};

  if (body.display_name !== undefined) {
    const name = normalizeRequiredName(body.display_name);
    if (name.length === 0) {
      return {
        updates,
        error: "Fursona name cannot be empty.",
      };
    }
    updates.name = name;
  }

  const optionalFields = ["banner_url", "avatar_url", "species", "pronouns", "bio", "is_current","is_default"] as const;
  for (const field of optionalFields) {
    if (body[field] !== undefined) {
      updates[field] = normalizeOptionalText(body[field]);
    }
  }

  return { updates, error: null };
}

export async function GET() {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) redirect(AUTH_ROUTES.SIGN_IN);
  if (account === null) return unauthorized();

  const { data: fursonas, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id, account_id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  if (error) return serverError(error.message);

  return new Response(JSON.stringify({ fursonas: fursonas ?? [] }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) redirect(AUTH_ROUTES.SIGN_IN);
  if (account === null) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as FursonaTypes;
  const display_name = normalizeRequiredName(body.display_name);

  if (display_name.length === 0) {
    return badRequest("Fursona name is required.");
  }

  const { data: inserted, error } = await supabase
    .schema("core")
    .from("fursonas")
    .insert({
      account_id: account.id,
      display_name,
      username: normalizeOptionalText(body.username),
      avatar_url: normalizeOptionalText(body.avatar_url),
      banner_url: normalizeOptionalText(body.banner_url),
      species: normalizeOptionalText(body.species),
      pronouns: normalizeOptionalText(body.pronouns),
      bio: normalizeOptionalText(body.bio),
      is_default: body.is_default,
      is_current: body.is_current
    })
    .select("id, account_id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current")
    .single();

  if (error) return badRequest(error.message);

  const shouldBeMain = body.is_default === true;

  if (shouldBeMain) {
    const { error: setDefaultError } = await supabase.rpc("set_default_fursona", { p_fursona_id: inserted.id });
    if (setDefaultError) return badRequest(setDefaultError.message);
  }

  return new Response(JSON.stringify({ fursona: inserted }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) redirect(AUTH_ROUTES.SIGN_IN);
  if (account === null) return unauthorized();

  const fursonaId = request.nextUrl.searchParams.get("id");

  if (!fursonaId) return badRequest("Missing fursona id.");

  const body = (await request.json().catch(() => ({}))) as FursonaTypes;
  const { updates, error } = buildPatchUpdates(body);

  if (error) return badRequest(error);

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .schema("core")
      .from("fursonas")
      .update(updates)
      .eq("id", fursonaId)
      .eq("account_id", account.id);

    if (updateError) return badRequest(updateError.message);
  }

  if (body.is_default === true) {
    const { error: setDefaultError } = await supabase.rpc("set_default_fursona", { p_fursona_id: fursonaId });
    if (setDefaultError) return badRequest(setDefaultError.message);
  }

  const { data: fursona, error: fetchError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id, account_id, display_name, username, species, pronouns, bio, is_default, is_current")
    .eq("id", fursonaId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (fetchError) return serverError(fetchError.message);
  if (!fursona) return notFound("Fursona not found.");

  return new Response(JSON.stringify({ fursona }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) redirect(AUTH_ROUTES.SIGN_IN);
  if (account === null) return unauthorized();

  const fursonaId = request.nextUrl.searchParams.get("id");

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
