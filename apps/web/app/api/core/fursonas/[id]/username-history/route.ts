import { type NextRequest } from "next/server";
import { serverError, badRequest } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { withUser } from "@/lib/auth/withUser";

/**
 * GET /api/core/fursonas/[id]/username-history
 * Get the complete username change history for a fursona
 *
 * Returns array of username changes in chronological order
 */
export const GET = withUser(
  async (
    { supabase, account },
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    // Verify fursona belongs to user
    const { data: fursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id, account_id")
      .eq("account_id", account.id)
      .eq("id", id)
      .single();

    if (!fursona) return badRequest(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    if (fetchError) return serverError(ERROR_MESSAGES.SERVER_ERROR);

    // Get username history
    const { data: history, error } = await supabase
      .schema("core")
      .from("username_history")
      .select("id, old_username, new_username, changed_at, reason")
      .eq("fursona_id", id)
      .order("changed_at", { ascending: false });

    if (error) return serverError(error.message);

    return Response.json({
      fursona_id: id,
      history: history ?? [],
      total_changes: history?.length ?? 0,
    });
  },
);
