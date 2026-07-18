import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import {
  badRequest,
  notFound,
  ok,
  okNoStore,
  serverError,
  unauthorized,
} from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { normalizeOptionalText } from "@/lib/helpers/normalizeInput";
import type { PostType, PostCreate } from "@/types/post";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

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
    .eq("fursona_id", fursona.id)
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

  const lastPostCreatedAt = posts.at(-1)?.created_at
    ? new Date(posts.at(-1)!.created_at).toISOString()
    : null;

  const nextCursor = hasMore ? lastPostCreatedAt : null;

  return okNoStore<{ posts: PostType[]; nextCursor: string | null }>({
    posts,
    nextCursor,
  });
}

export async function POST(req: NextRequest) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const body = (await req.json().catch(() => ({}))) as PostCreate;
  const content = normalizeOptionalText(body.content);
  const media = Array.isArray(body.media_urls) ? body.media_urls : [];

  if ((!content || content.length === 0) && media.length === 0) {
    return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  }

  const { data, error } = await supabase
    .schema("social")
    .from("posts")
    .insert({ ...body, content, media_urls: media })
    .select("fursona_id, content, media_urls, is_published, created_at")
    .single();

  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  return ok<{ post: PostCreate }>({ post: data });
}
