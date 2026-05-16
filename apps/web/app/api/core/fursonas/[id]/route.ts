import { type NextRequest } from "next/server";
import type { RouteContext } from "@/lib/types/api";
import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, badRequest, serverError, notFound } from "@/lib/api/responses";

/**
 * Validate and parse fursona ID from path parameter.
 * Fursona IDs are bigint in DB; enforce numeric path IDs to prevent invalid-cast queries.
 */
function parseFursonaId(rawId: string): string | null {
  if (!/^\d+$/.test(rawId)) return null;
  return rawId;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { supabase, user, account, response } = await requireUser();

  if (response) return response;
  if (user === null) return unauthorized();
  if (account === null) return unauthorized();

  const { id } = await Promise.resolve(context.params);
  const fursonaId = parseFursonaId(id);

  if (!fursonaId) return badRequest("Invalid fursona id.");

  const { data: fursona, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id, account_id, display_name, username, avatar_url, banner_url, species, pronouns, bio, is_default, is_current, created_at")
    .eq("id", fursonaId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!fursona) return notFound("Fursona not found.");

  return new Response(JSON.stringify({ fursona }), {
    headers: { "Content-Type": "application/json" },
  });
}
