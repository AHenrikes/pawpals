import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { notFound, serverError } from "@/lib/api/responses";

/**
 * Centralized route helper functions to prevent duplication across API routes.
 * Handles common patterns like fetching fursonas by username.
 */

export interface SupabaseClient {
  schema(name: string): any;
}

/**
 * Get a fursona by username from the database.
 * Throws appropriate errors for not found and database errors.
 *
 * @param supabase - Supabase client instance
 * @param username - Username to search for
 * @returns Fursona ID
 * @throws Returns NextResponse with 404 or 500 status
 */
export async function getFursonaByUsername(
  supabase: SupabaseClient,
  username: string
) {
  const { data: target, error: targetError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id, account_id")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (targetError?.code === "PGRST116") {
    throw { status: 404, response: notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND) };
  }
  if (targetError) {
    throw { status: 500, response: serverError(ERROR_MESSAGES.SERVER_ERROR) };
  }
  if (!target) {
    throw { status: 404, response: notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND) };
  }

  return target;
}

/**
 * Get current user's active fursona.
 * Returns null if user has no active fursona.
 *
 * @param supabase - Supabase client instance
 * @param accountId - Account ID of the current user
 * @returns Fursona or null
 * @throws Returns NextResponse with 500 status on database error
 */
export async function getCurrentUserFursona(
  supabase: SupabaseClient,
  accountId: string
) {
  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", accountId)
    .eq("is_current", true)
    .single();

  if (selfError?.code === "PGRST116") {
    // User has no current fursona
    return null;
  }
  if (selfError) {
    throw { status: 500, response: serverError(ERROR_MESSAGES.SERVER_ERROR) };
  }

  return self;
}

/**
 * Check if a follow relationship exists between two fursonas.
 *
 * @param supabase - Supabase client instance
 * @param followerFursonaId - ID of the follower
 * @param followingFursonaId - ID of the fursona being followed
 * @returns Boolean indicating if follow relationship exists
 * @throws Returns NextResponse with 500 status on database error
 */
export async function checkFollowExists(
  supabase: SupabaseClient,
  followerFursonaId: string,
  followingFursonaId: string
) {
  const { data, error } = await supabase
    .schema("social")
    .from("followers")
    .select("id")
    .eq("follower_fursona_id", followerFursonaId)
    .eq("following_fursona_id", followingFursonaId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw { status: 500, response: serverError(ERROR_MESSAGES.SERVER_ERROR) };
  }

  return !!data;
}

/**
 * Get a fursona by ID.
 *
 * @param supabase - Supabase client instance
 * @param fursonaId - Fursona ID to fetch
 * @returns Fursona data
 * @throws Returns NextResponse with 404 or 500 status
 */
export async function getFursonaById(
  supabase: SupabaseClient,
  fursonaId: string
) {
  const { data, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select("*")
    .eq("id", fursonaId)
    .single();

  if (error?.code === "PGRST116") {
    throw { status: 404, response: notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND) };
  }
  if (error) {
    throw { status: 500, response: serverError(ERROR_MESSAGES.SERVER_ERROR) };
  }
  if (!data) {
    throw { status: 404, response: notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND) };
  }

  return data;
}
