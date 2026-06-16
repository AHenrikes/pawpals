import { type NextRequest } from "next/server";
import type { RouteContext } from "@/lib/types/api";
import { serverError, badRequest, unauthorized } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/requireUser";

/**
 * GET /api/profile/me/[id]/username-history
 * Get the complete username change history for a fursona
 * 
 * Returns array of username changes in chronological order
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<{ id: string }>,
) {
  try {
    const { supabase, account, response } = await requireUser();
    if (response) return response;
    if (account === null) return unauthorized();

    const { id: fursonaId } = await context.params;

    // Verify fursona belongs to user
    const { data: fursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id, account_id")
      .eq("id", fursonaId)
      .single();

    if (fetchError || !fursona) {
      return badRequest("Fursona not found");
    }

    if (fursona.account_id !== account.id) {
      return unauthorized();
    }

    // Get username history
    const { data: history, error } = await supabase
      .schema("core")
      .from("username_history")
      .select(
        "id, old_username, new_username, changed_at, reason"
      )
      .eq("fursona_id", fursonaId)
      .order("changed_at", { ascending: false });

    if (error) {
      return serverError(error.message);
    }

    return Response.json({
      fursona_id: fursonaId,
      history: history ?? [],
      total_changes: history?.length ?? 0,
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
