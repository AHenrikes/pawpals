import { type NextRequest } from "next/server";
import type { FursonaTypesWithId } from "@/types/fursona";
import {
  normalizeOptionalText,
  normalizeRequiredName,
} from "@/lib/helpers/normalizeInput";
import { requireUser } from "@/lib/auth/requireUser";
import {
  unauthorized,
  badRequest,
  serverError
} from "@/lib/api/responses";

export async function GET() {
  const { supabase, account, response } = await requireUser();
  if (response) return response;
  if (account === null) return unauthorized();

  const { data: fursonas, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current, created_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  if (error) return serverError(error.message);

  return new Response(JSON.stringify({ fursonas: fursonas ?? [] }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const { supabase, account, response } = await requireUser();
  if (response) return response;
  if (account === null) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as FursonaTypesWithId;
  const display_name = normalizeRequiredName(body.display_name);
  const username = normalizeOptionalText(body.username);

  if (display_name.length === 0) {
    return badRequest("Fursona name is required.");
  }

  if (!username || username.length === 0) {
    return badRequest("Username is required.");
  }

  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
    return badRequest("Invalid username format: 3-50 characters, alphanumeric/underscore/hyphen only");
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
      is_default: body.is_default ?? false,
      is_current: body.is_current ?? false,
    })
    .select(
      "id, display_name, username, avatar_url, banner_url, species, pronouns, bio, created_at",
    )
    .single();

  if (error) return badRequest(error.message);

  // A transaction-safe RPC to switch current fursona
  const { error: switchError } = await supabase.rpc("switch_current_fursona",
    { p_fursona_id: inserted.id }
  );

  if (switchError) return badRequest(switchError.message);

  return new Response(JSON.stringify({ fursona: inserted }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
