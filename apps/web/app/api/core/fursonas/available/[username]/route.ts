import { serverError, badRequest } from "@/lib/api/responses";
import { createServer } from "@repo/supabase/server";
import type { RouteContext } from "@/lib/types/api";
import type { NextRequest } from "next/server";

/**
 * GET /api/core/fursonas/available/[username]
 * Check username availability and get suggestions if taken
 *
 * Response:
 * - available: true → username is free
 * - error: string → validation failed
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<{ username: string }>,
) {
  const supabase = await createServer();
  try {
    const { username: query } = await context.params;

    if (!query?.trim() || query.length < 3 || query.length > 50) {
      return badRequest("Invalid username: must be 3-50 characters");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(query)) {
      return badRequest(
        "Invalid username format: only alphanumeric, underscore, and hyphen allowed",
      );
    }

    const { data: isAvailable, error } = await supabase.rpc(
      "check_username_availability",
      {
        p_username: query,
      },
    );

    if (error) return serverError(error.message);

    return Response.json({ available: isAvailable, username: query, error });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
