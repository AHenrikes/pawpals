import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/responses";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { PostCreate, PostWithId } from "@/types/post";
import { normalizeOptionalText } from "@/lib/helpers/normalizeInput";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const { username } = await params;

  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
    MAX_LIMIT,
  );

  if (!username) return badRequest(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("username", username)
    .single();

  if (selfError) {
    if (selfError.code === "PGRST116") {
      return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    }

    return serverError(ERROR_MESSAGES.SERVER_ERROR);
  }
  if (!self) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

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
    .eq("fursona_id", self.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);

  const hasMore = data.length > limit;
  const posts = (hasMore ? data.slice(0, limit) : data) as PostWithId[];
  const nextCursor = hasMore
    ? posts.at(-1)?.created_at
      ? new Date(posts.at(-1)!.created_at).toISOString()
      : null
    : null;

  return ok<{ posts: PostWithId[]; nextCursor: string | null }>({
    posts,
    nextCursor,
  });
}

export async function POST(
  req: NextRequest,
  // { params }: { params: Promis<{ username: string }>}
) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  // const { username } = await params;
  const body = (await req.json().catch(() => ({}))) as PostCreate;
  const content = normalizeOptionalText(body.content);
  const media = Array.isArray(body.media_urls) ? body.media_urls : [];

  // Bug 1 fixed: reject when there's NO content (and no media either)
  if (!content?.length && media.length === 0)
    return badRequest(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  const { data, error } = await supabase
    .schema("social")
    .from("posts")
    .insert({ ...body, content, media_urls: media })
    .select("fursona_id, content, media_urls, is_published, created_at")
    .single();

  // if (error) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (error) return serverError(error.message);

  return ok<{ post: PostCreate }>({ post: data });
}
