import { type NextRequest } from "next/server";
import type { RouteContext } from "@/lib/types/api";
import { serverError, badRequest, unauthorized } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/requireUser";

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
 * GET /api/core/fursonas/me/[id]/change-username
 * Get cooldown information for username change
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
      .select("id, account_id, username, last_username_change_at")
      .eq("id", fursonaId)
      .single();

    if (fetchError || !fursona) {
      return badRequest("Fursona not found");
    }

    if (fursona.account_id !== account.id) {
      return unauthorized();
    }

    // Check cooldown
    const { data: cooldownData, error: cooldownError } = await supabase.rpc(
      "check_username_cooldown",
      {
        p_fursona_id: fursonaId,
      }
    );

    if (cooldownError) {
      return serverError(cooldownError.message);
    }

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
      (cooldownUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
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
 * POST /api/core/fursonas/me/[id]/change-username
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

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as ChangeUsernameRequest;
    
    if (!body.new_username || typeof body.new_username !== "string") {
      return badRequest("new_username is required");
    }

    const newUsername = body.new_username.trim().toLowerCase();

    // Call database function to change username
    const { data, error } = await supabase.rpc("change_username", {
      p_fursona_id: fursonaId,
      p_new_username: newUsername,
      p_account_id: account.id,
    });

    if (error) {
      return serverError(error.message);
    }

    const result = data as ChangeUsernameResponse;

    if (!result.success) {
      return Response.json(result, {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
