import { requireUser } from "@/lib/auth/requireUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { type FursonaProfile } from "@/types/fursona";
import { NextRequest } from "next/server";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/responses";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const { username } = await params;

  if (!username) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "username, display_name, avatar_url, banner_url, species, pronouns, bio, reputation, created_at",
    )
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  if (!data) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  return ok<FursonaProfile>(data);
}
