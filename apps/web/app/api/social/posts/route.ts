import { NextRequest } from "next/server";
import { withUser } from "@/lib/auth/withUser";
import { okPrivateRead, serverError } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { type PostType } from "@/types/post";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const GET = withUser(async ({ supabase }, req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const cursor = params.get("cursor");
  const limit = Math.min(
    Number.parseInt(params.get("limit") ?? String(DEFAULT_LIMIT), 10),
    MAX_LIMIT,
  );

  let query = supabase
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
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  const hasMore = data.length > limit;
  const posts = (hasMore ? data.slice(0, limit) : data) as PostType[];
  const nextCursor = hasMore
    ? posts.at(-1)?.created_at
      ? new Date(posts.at(-1)!.created_at).toISOString()
      : null
    : null;

  return okPrivateRead<{ posts: PostType[]; nextCursor: string | null }>({
    posts,
    nextCursor,
  });
});
