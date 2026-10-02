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
    const { reported_fursona_id, reported_post_id, reason, description } = body;

    if (
      (!reported_fursona_id && !reported_post_id) ||
      (reported_fursona_id && reported_post_id) ||
      !reason
    ) {
      return badRequest("Exactly one report target and a reason are required");
    }

    const { data: reporter } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (!reporter) return unauthorized();
    if (reported_fursona_id === reporter.id) {
      return badRequest("Cannot report your own profile");
    }

    const { error } = await supabase
      .schema("social")
      .from("post_reports")
      .insert({
        reporter_fursona_id: reporter.id,
        reported_fursona_id: reported_fursona_id || null,
        reported_post_id: reported_post_id || null,
        reason,
        description: description || null,
      });

    if (error) return serverError(error.message);

    return created({ success: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
