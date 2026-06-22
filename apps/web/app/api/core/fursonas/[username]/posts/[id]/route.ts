import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";

export async function GET(req: NextRequest) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  const { data, error } = await supabase
    .schema("social")
    .from("posts")
    .select(`
      id,
      fursona_id,
      content,
      media_urls,
      likes_count,
      comments_count,
      views_count,
      bookmarks_count,
      shares_count,
      is_published,
      created_at
    `)
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return notFound();
    return serverError(ERROR_MESSAGES.SERVER_ERROR);
  }

  return ok({ post: data });
}
