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

    // Soft delete account (mark as deleted)
    const { error: deleteError } = await supabase
      .schema("core")
      .from("accounts")
      .update({
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", account_id);

    if (deleteError) return serverError(deleteError.message);

    // Delete all associated fursonas (soft delete)
    const { error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("account_id", account_id);

    if (fursonaError) return serverError(fursonaError.message);

    // Log admin action
    await supabase.schema("core").from("admin_logs").insert({
      admin_id: account.id,
      action: "delete",
      target_account_id: account_id,
      reason,
      created_at: new Date().toISOString(),
    });

    ok({ success: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
