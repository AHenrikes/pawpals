import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, serverError, badRequest, ok } from "@/lib/api/responses";

export async function POST(request: NextRequest) {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) return unauthorized();
  if (account === null) return unauthorized();

  try {
    const body = await request.json();
    const { account_id, reason } = body;

    if (!account_id || !reason) {
      return badRequest("Missing required fields");
    }

    if (account_id !== account.id) {
      return badRequest(
        "Account deletion is only supported for the authenticated account",
      );
    }

    const { error } = await supabase.rpc("delete_user_account");
    if (error) return serverError(error.message);

    return ok({ success: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
