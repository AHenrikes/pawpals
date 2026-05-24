import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import {
  unauthorized,
  badRequest,
  serverError,
  created,
} from "@/lib/api/responses";

export async function POST(request: NextRequest) {
  const { supabase, user, account, response } = await requireUser();
  if (response) return response;
  if (user === null) return unauthorized();
  if (account === null) return unauthorized();

  try {
    const body = await request.json();
    const { reported_user_id, report_type, reason, details } = body;

    if (!reported_user_id || !report_type || !reason) {
      badRequest("Missing required fields");
    }

    // Prevent self-reporting
    if (reported_user_id === account.id) {
      badRequest("Cannot report your own profile");
    }

    const { error } = await supabase
      .schema("core")
      .from("reports")
      .insert({
        reporter_id: account.id,
        reported_user_id,
        report_type,
        reason,
        details: details || null,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (error) return serverError(error.message);

    created({ success: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
