import { type NextRequest } from "next/server";
import type { RouteContext } from "@/lib/types/api";
import { serverError, badRequest } from "@/lib/api/responses";
import { createServer } from "@repo/supabase/server";

/**
 * GET /api/search/username/[username]
 * Check if a username exists and get profile info
 * 
 * Response includes:
 * - exists: boolean
 * - profile: fursona profile data (if exists)
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<{ username: string }>,
) {
  try {
    const supabase = await createServer();
    const { username: query } = await context.params;

    // Input validation: check length and format
    if (!query?.trim() || query.length < 3 || query.length > 50) {
      return badRequest("Invalid username: must be 3-50 characters");
    }

    // Validate username format (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(query)) {
      return badRequest(
        "Invalid username format: only alphanumeric, underscore, and hyphen allowed"
      );
    }

    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        "id, username, display_name, avatar_url, banner_url, bio, species, pronouns, reputation"
      )
      .eq("username", query)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!fursona) {
      return Response.json({ exists: false, profile: null });
    }

    return Response.json({ 
      exists: true, 
      profile: fursona 
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
