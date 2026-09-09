import { NextRequest } from "next/server";
import { withUser } from "@/lib/auth/withUser";
import {
  badRequest,
  notFound,
  ok,
  okPrivateRead,
  serverError,
} from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { normalizeOptionalText } from "@/lib/helpers/normalizeInput";
import type { PostType, PostCreate } from "@/types/post";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const GET = withUser(
  async (
    { supabase },
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    const searchParams = req.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      MAX_LIMIT,
    );

    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_FOUND);

    // Verify the fursona exists and is active
    const { data: fursona, error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (fursonaError) {
      if (fursonaError.code === "PGRST116") {
        return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
      }
      return serverError(ERROR_MESSAGES.SERVER_ERROR);
    }

    if (!fursona) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

    let query = supabase
      .schema("social")
      .from("posts")
      .select(
        `
          id,
          fursona_id,
          post_type,
          content,
          post_media (
            id,
            media_type,
            poster_url,
            url,
            width,
            height,
            duration_seconds,
            file_size_bytes,
            order_index,
            created_at
          )
          views_count,
          likes_count,
          comments_count,
          shares_count,
          bookmarks_count,
          visibility,
          created_at,
          updated_at
      `,
      )
      .eq("fursona_id", fursona.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // fetch one extra to determine if there's a next page

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;

    if (error) return serverError(error.message);

    const hasMore = data.length > limit;
    const posts = (hasMore
      ? data.slice(0, limit)
      : data) as unknown as PostType[];

    const lastPostCreatedAt = posts.at(-1)?.created_at
      ? new Date(posts.at(-1)!.created_at).toISOString()
      : null;

    const nextCursor = hasMore ? lastPostCreatedAt : null;

    return okPrivateRead<{ posts: PostType[]; nextCursor: string | null }>({
      posts,
      nextCursor,
    });
  },
);

export const POST = withUser(async ({ supabase, account }, req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as PostCreate;
  const content = normalizeOptionalText(body.content);
  const media = Array.isArray(body.media) ? body.media : [];

  if ((!content || content.length === 0) && media.length === 0) {
    return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  }

  const { data: fursona, error: fursonaError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (fursonaError || !fursona) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  const { data, error } = await supabase.rpc("create_post_with_media", {
    p_fursona_id: fursona.id,
    p_post_type: body.post_type,
    p_content: content ?? null,
    p_visibility: body.visibility ?? "public",
    p_media: media,
  });

  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  return ok({ post: data });
});
