import { NextRequest } from "next/server";
import { badRequest, notFound, ok, serverError } from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { withUser } from "@/lib/auth/withUser";
import { normalizeOptionalText } from "@/lib/helpers/normalizeInput";
import type { MediaItem, PostTypeValue, PostVisibility } from "@/types/post";
import { type SupabaseClient } from "@supabase/supabase-js";

const VALID_POST_TYPES = new Set<PostTypeValue>(["yap", "reel", "gallery"]);
const VALID_VISIBILITY = new Set<PostVisibility>([
  "everyone",
  "followers",
  "mutuals",
  "private",
  "archived",
]);

type RouteContext = { params: Promise<{ id: string }> };

function normalizeMedia(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];

    const media = item as Record<string, unknown>;
    const mediaTypeValue =
      (media.media_type as MediaItem["media_type"]) ?? "image";

    if (typeof media.url !== "string" || !media.url) return [];

    // let mediaType: MediaItem["media_type"] = "image";
    // if (media.media_type === "gif" || media.media_type === "video") mediaType = media.media_type;

    return [
      {
        media_type: mediaTypeValue,
        poster_url:
          typeof media.poster_url === "string" ? media.poster_url : null,
        url: media.url,
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
          typeof media.order_index === "number" ? media.order_index : index,
      },
    ];
  });
}

function validatePost(
  postType: PostTypeValue,
  content: string | null,
  media: MediaItem[],
) {
  if (postType === "yap" && !content && media.length === 0) {
    return "Yap posts must include text or media.";
  }

  if ((postType === "reel" || postType === "gallery") && media.length === 0) {
    return `${postType} posts require at least one media item.`;
  }

  return null;
}

async function findOwnedFursona(
  supabase: SupabaseClient,
  fursonaId: string,
  accountId: string,
) {
  return supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("id", fursonaId)
    .eq("account_id", accountId)
    .maybeSingle();
}

async function replacePostMedia(
  supabase: SupabaseClient,
  postId: string,
  media: MediaItem[],
) {
  const { error: deleteError } = await supabase
    .schema("social")
    .from("post_media")
    .delete()
    .eq("post_id", postId);

  if (deleteError) return deleteError;
  if (media.length === 0) return null;

  const { error: insertError } = await supabase
    .schema("social")
    .from("post_media")
    .insert(
      media.map((item, index) => ({
        post_id: postId,
        media_type: item.media_type ?? "image",
        url: item.url,
        poster_url: item.poster_url ?? null,
        duration_seconds: item.duration_seconds ?? null,
        width: item.width ?? null,
        height: item.height ?? null,
        file_size_bytes: item.file_size_bytes ?? null,
        order_index: item.order_index ?? index,
      })),
    );

  return insertError;
}

export const GET = withUser(
  async ({ supabase }, req: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const postId = id || req.nextUrl.searchParams.get("id");

    if (!postId) return badRequest(ERROR_MESSAGES.POST_NOT_FOUND);

    const { data, error } = await supabase
      .schema("social")
      .from("posts")
      .select(
        `
        id,
        fursona_id,
        post_type,
        content,
        post_media (*),
        views_count,
        likes_count,
        comments_count,
        shares_count,
        bookmarks_count,
        visibility,
        created_at
      `,
      )
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return notFound();
      return serverError(ERROR_MESSAGES.SERVER_ERROR);
    }

    const media_urls = Array.isArray(data.post_media)
      ? data.post_media.map((item: any) => ({
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

    return ok({
      post: {
        ...data,
        content: data.content ?? null,
        // media_urls,
        media: media_urls,
        created_at: data.created_at,
      },
    });
  },
);

export const PATCH = withUser(
  async ({ supabase, account }, req: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const { data: current, error: currentError } = await supabase
      .schema("social")
      .from("posts")
      .select(
        `
          id,
          fursona_id,
          post_type,
          content,
          post_media (*),
          visibility
        `,
      )
      .eq("id", id)
      .single();

    if (currentError || !current) {
      if (currentError?.code === "PGRST116") return notFound();
      return serverError(ERROR_MESSAGES.SERVER_ERROR);
    }

    const { data: ownedFursona, error: ownerError } = await findOwnedFursona(
      supabase,
      current.fursona_id,
      account.id,
    );

    if (ownerError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
    if (!ownedFursona) return notFound();

    const postType = (body.post_type ?? current.post_type) as PostTypeValue;
    const content =
      body.content === undefined
        ? (current.content ?? null)
        : normalizeOptionalText(body.content);
    const visibility = (body.visibility ??
      current.visibility) as PostVisibility;
    const replacesMedia =
      body.media !== undefined || body.media_urls !== undefined;
    const media = replacesMedia
      ? normalizeMedia(body.media ?? body.media_urls)
      : normalizeMedia(current.post_media);

    if (!VALID_POST_TYPES.has(postType)) {
      return badRequest(ERROR_MESSAGES.INVALID_POST_TYPE);
    }
    if (!VALID_VISIBILITY.has(visibility)) {
      return badRequest(ERROR_MESSAGES.INVALID_VISIBILITY_TYPE);
    }

    const validationError = validatePost(postType, content, media);
    if (validationError) return badRequest(validationError);

    const { data: updated, error: updateError } = await supabase
      .schema("social")
      .from("posts")
      .update({ post_type: postType, content, visibility })
      .select(
        `
          id,
          fursona_id,
          post_type,
          content,
          visibility,
          created_at,
          updated_at
        `,
      )
      .eq("id", id)
      .single();

    if (updateError || !updated) {
      return serverError(updateError?.message || ERROR_MESSAGES.SERVER_ERROR);
    }

    if (replacesMedia) {
      const mediaError = await replacePostMedia(supabase, id, media);
      if (mediaError) {
        return serverError(
          mediaError.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
        );
      }
    }

    return ok({ post: { ...updated, media_urls: media, media } });
  },
);

export const DELETE = withUser(
  async (
    { supabase, account },
    _req: NextRequest,
    { params }: RouteContext,
  ) => {
    const { id } = await params;
    if (!id) return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    const { data: post, error: postError } = await supabase
      .schema("social")
      .from("posts")
      .select("id, fursona_id")
      .eq("id", id)
      .single();

    if (postError || !post) {
      if (postError?.code === "PGRST116") return notFound();
      return serverError(ERROR_MESSAGES.SERVER_ERROR);
    }

    const { data: ownedFursona, error: ownerError } = await findOwnedFursona(
      supabase,
      post.fursona_id,
      account.id,
    );

    if (ownerError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
    if (!ownedFursona) return notFound();

    const { error: deleteError } = await supabase
      .schema("social")
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError)
      return serverError(deleteError.message || ERROR_MESSAGES.SERVER_ERROR);

    return ok({ ok: true });
  },
);
