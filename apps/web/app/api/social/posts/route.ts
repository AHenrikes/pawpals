import { NextRequest } from "next/server";
import { withUser } from "@/lib/auth/withUser";
import {
  badRequest,
  ok,
  okPrivateRead,
  serverError,
} from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { normalizeOptionalText } from "@/lib/helpers/normalizeInput";
import type {
  MediaItem,
  PostCreate,
  PostType,
  PostTypeValue,
  PostVisibility,
} from "@/types/post";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const VALID_POST_TYPES = new Set<PostTypeValue>(["yap", "reel", "gallery"]);
const VALID_VISIBILITY = new Set<PostVisibility>([
  "everyone",
  "followers",
  "mutuals",
  "private",
  "archived",
] as const);

function getMediaArray(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];

  const mapped = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const media = item as Record<string, unknown>;
      const url = typeof media.url === "string" ? media.url : null;
      if (!url) return null;

      const mediaTypeValue =
        (media.media_type as MediaItem["media_type"]) ?? "image";

      return {
        media_type: mediaTypeValue,
        poster_url:
          typeof media.poster_url === "string" ? media.poster_url : null,
        url,
        width: typeof media.width === "number" ? media.width : undefined,
        height: typeof media.height === "number" ? media.height : undefined,
        duration_seconds:
          typeof media.duration_seconds === "number"
            ? media.duration_seconds
            : null,
        file_size_bytes:
          typeof media.file_size_bytes === "number"
            ? media.file_size_bytes
            : null,
        order_index:
          typeof media.order_index === "number" ? media.order_index : 0,
      } as MediaItem;
    })
    .filter((item): item is MediaItem => item !== null);

  return mapped;
}

function normalizePostRow(row: any): PostType {
  const media_data = Array.isArray(row.post_media)
    ? row.post_media.map((item: any) => ({
        id: item.id,
        media_type: item.media_type,
        poster_url: item.poster_url,
        url: item.url,
        width: item.width,
        height: item.height,
        duration_seconds: item.duration_seconds,
        file_size_bytes: item.file_size_bytes,
        order_index: item.order_index,
      }))
    : [];

  return {
    id: row.id,
    fursona_id: row.fursona_id,
    post_type: row.post_type,
    content: row.content ?? null,
    // media_urls,
    media_urls: media_data,
    views_count: row.views_count ?? 0,
    likes_count: row.likes_count ?? 0,
    comments_count: row.comments_count ?? 0,
    shares_count: row.shares_count ?? 0,
    bookmarks_count: row.bookmarks_count ?? 0,
    visibility: row.visibility,
    created_at: row.created_at,
  };
}

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
        post_type,
        content,
        media_urls (
          id,
          media_type,
          poster_url,
          url,
          width,
          height,
          duration_seconds,
          file_size_bytes,
          order_index
        )
        views_count,
        likes_count,
        comments_count,
        shares_count,
        bookmarks_count,
        visibility,
        created_at,
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  const rows = (data ?? []) as any[];
  const hasMore = rows.length > limit;
  const posts = rows
    .slice(0, hasMore ? limit : rows.length)
    .map(normalizePostRow);
  const nextCursor = hasMore ? (posts.at(-1)?.created_at ?? null) : null;

  return okPrivateRead<{ posts: PostType[]; nextCursor: string | null }>({
    posts,
    nextCursor,
  });
});

export const POST = withUser(
  async ({ supabase, account }, req: NextRequest) => {
    const body = (await req.json().catch(() => ({}))) as PostCreate;
    const claimedFursonaId = body.fursona_id;
    const postType = body.post_type ?? "yap";
    const content = normalizeOptionalText(body.content);
    const media = getMediaArray(body.media ?? body.media_urls ?? []);
    const visibility = body.visibility ?? "everyone";

    if (!VALID_POST_TYPES.has(postType)) {
      return badRequest(ERROR_MESSAGES.INVALID_POST_TYPE);
    }

    if (!VALID_VISIBILITY.has(visibility as PostVisibility)) {
      return badRequest(ERROR_MESSAGES.INVALID_VISIBILITY_TYPE);
    }

    if (postType === "yap" && !content && media.length === 0) {
      return badRequest(ERROR_MESSAGES.POST_ERROR);
    }

    if ((postType === "reel" || postType === "gallery") && media.length === 0) {
      return badRequest(ERROR_MESSAGES.MEDIA_REQUIRED);
    }

    const { data: fursona, error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .maybeSingle();

    if (fursonaError || !fursona) {
      return badRequest(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    }

    const fursonaId = claimedFursonaId ?? fursona.id;

    const { data, error } = await supabase.rpc("create_post_with_media", {
      p_fursona_id: fursonaId,
      p_post_type: postType,
      p_content: content ?? null,
      p_media: media,
      p_visibility: visibility,
    });

    if (error) {
      return serverError(error.message || ERROR_MESSAGES.SERVER_ERROR);
    }

    const createdPost = data as any;
    const { data: mediaRows, error: mediaError } = await supabase
      .schema("social")
      .from("post_media")
      .select(
        `
        id,
        media_type,
        poster_url,
        url,
        width,
        height,
        file_size_bytes,
        duration_seconds,
        order_index
      `,
      )
      .eq("post_id", createdPost.id)
      .order("order_index", { ascending: true });

    if (mediaError) {
      return serverError(mediaError.message || ERROR_MESSAGES.SERVER_ERROR);
    }

    const responsePost: PostType = {
      id: createdPost.id,
      fursona_id: createdPost.fursona_id,
      post_type: createdPost.post_type,
      content: createdPost.content ?? null,
      media_urls: (mediaRows ?? []).map((item: any) => ({
        id: item.id,
        media_type: item.media_type,
        poster_url: item.poster_url,
        url: item.url,
        width: item.width,
        height: item.height,
        duration_seconds: item.duration_seconds,
        file_size_bytes: item.file_size_bytes,
        order_index: item.order_index,
      })),
      views_count: createdPost.views_count ?? 0,
      likes_count: createdPost.likes_count ?? 0,
      comments_count: createdPost.comments_count ?? 0,
      shares_count: createdPost.shares_count ?? 0,
      bookmarks_count: createdPost.bookmarks_count ?? 0,
      // media: (mediaRows ?? []).map((item: any) => ({
      //   id: item.id,
      //   media_type: item.media_type,
      //   poster_url: item.poster_url,
      //   url: item.url,
      //   width: item.width,
      //   height: item.height,
      //   duration_seconds: item.duration_seconds,
      //   file_size_bytes: item.file_size_bytes,
      //   order_index: item.order_index,
      // })),
      visibility: createdPost.visibility,
      created_at: createdPost.created_at,
    };

    return ok<{ post: PostType }>({ post: responsePost });
  },
);
