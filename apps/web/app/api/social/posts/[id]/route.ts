import { NextRequest } from "next/server";
import { badRequest, notFound, ok, serverError } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { withUser } from "@/lib/auth/withUser";

export const GET = withUser(async ({ supabase }, req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  const { data, error } = await supabase
    .schema("social")
    .from("posts")
    .select(
      `
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
    `,
    )
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return notFound();
    return serverError(ERROR_MESSAGES.SERVER_ERROR);
  }

  return ok({ post: data });
});
