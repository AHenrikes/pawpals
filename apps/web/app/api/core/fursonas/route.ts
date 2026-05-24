import { type NextRequest } from "next/server";
import type { FursonaTypes } from "@/types/fursona";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, badRequest, serverError } from "@/lib/api/responses";

export async function GET() {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) return unauthorized();
  if (account === null) return unauthorized();

  const { data: fursonas, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "id, account_id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current, created_at",
    )
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
  if (user === null) return unauthorized();
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
      is_current: body.is_current,
    })
    .select(
      "id, account_id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current",
    )
    .single();

  if (error) return badRequest(error.message);

  const shouldBeMain = body.is_default === true;

  if (shouldBeMain) {
    const { error: setDefaultError } = await supabase.rpc(
      "set_default_fursona",
      { p_fursona_id: inserted.id },
    );
    if (setDefaultError) return badRequest(setDefaultError.message);
  }

  return new Response(JSON.stringify({ fursona: inserted }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
