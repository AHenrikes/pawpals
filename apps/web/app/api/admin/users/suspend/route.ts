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
      badRequest("Missing required fields");
    }

    // Prevent self-suspension
    if (account_id === account.id) {
      badRequest("Cannot suspend your own account");
    }

    // Update account status to suspended
    const { error } = await supabase
      .schema("core")
      .from("accounts")
      .update({
        status: "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", account_id);

    if (error) return serverError(error.message);

    // Log admin action
    await supabase.schema("core").from("admin_logs").insert({
      admin_id: account.id,
      action: "suspend",
      target_account_id: account_id,
      reason,
      created_at: new Date().toISOString(),
    });

    ok({ status: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
