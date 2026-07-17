import {
  serverError,
  badRequest,
  unauthorized,
  notFound,
  ok,
} from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { type NextRequest } from "next/server";

interface ChangeUsernameRequest {
  new_username: string;
}

interface ChangeUsernameResponse {
  success: boolean;
  error?: string;
  old_username?: string;
  new_username?: string;
  changed_at?: string;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
}

/**
 * GET /api/core/fursonas/[id]/change-username
 * Get cooldown information for username change
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, account, response } = await requireUser();
    if (response) return response;
    if (account === null) return unauthorized();

    const { id } = await params;

    // Verify fursona belongs to user
    const { data: fursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id, username, last_username_change_at")
      .eq("account_id", account.id)
      .eq("id", id)
      .single();

    if (!fursona) return badRequest(ERROR_MESSAGES.FURSONAS_NOT_FOUND);
    if (fetchError) return serverError(ERROR_MESSAGES.SERVER_ERROR);

    // Check cooldown
    const { data: cooldownData, error: cooldownError } = await supabase.rpc(
      "check_username_cooldown",
      {
        p_fursona_id: id,
      },
    );

    if (cooldownError) return serverError(cooldownError.message);

    if (cooldownData === null) {
      // No cooldown active
      return Response.json({
        can_change: true,
        current_username: fursona.username,
        last_changed_at: fursona.last_username_change_at,
        cooldown_active: false,
      });
    }

    // Cooldown is active
    const cooldownUntil = new Date(cooldownData);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (cooldownUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Response.json({
      can_change: false,
      current_username: fursona.username,
      last_changed_at: fursona.last_username_change_at,
      cooldown_active: true,
      cooldown_until: cooldownUntil.toISOString(),
      cooldown_days_remaining: daysRemaining,
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}

/**
 * POST /api/core/fursonas/[id]/change-username
 * Change a fursona's username with 30-day cooldown enforcement
 *
 * Request body:
 * {
 *   "new_username": "new_name"
 * }
 *
 * Response:
 * - success: true → username changed
 * - success: false → includes error and optionally cooldown_until date
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, account, response } = await requireUser();
    if (response) return response;
    if (account === null) return unauthorized();

    const { id } = await params;

    // Verify fursona belongs to user
    const { data: fursona, error: fetchError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id, account_id")
      .eq("account_id", account.id)
      .eq("id", id)
      .single();

    if (fetchError) return badRequest(ERROR_MESSAGES.SERVER_ERROR);
    if (!fursona) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

    // Parse request body
    const body = (await request
      .json()
      .catch(() => ({}))) as ChangeUsernameRequest;

    if (!body.new_username || typeof body.new_username !== "string")
      badRequest("New username is required");

    const newUsername = body.new_username.trim().toLowerCase();

    // Call database function to change username
    const { data, error } = await supabase.rpc("change_username", {
      p_fursona_id: fursona.id,
      p_new_username: newUsername,
      p_account_id: account.id,
    });

    if (error) serverError(error.message);

    const result = data as ChangeUsernameResponse;

    if (!result.success) badRequest("Username change failed");

    return ok(result);
  } catch (error) {
    return serverError((error as Error).message);
  }
}
