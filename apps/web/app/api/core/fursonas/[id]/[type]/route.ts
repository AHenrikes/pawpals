import { NextRequest } from "next/server";
import { withUser } from "@/lib/auth/withUser";
import {
  badRequest,
  notFound,
  okPrivateRead,
  serverError,
} from "@/lib/api/responses";

const PAGE_SIZE = 20;
const FOLLOW_TYPES = new Set(["followers", "following"]);

type RouteContext = {
  params: Promise<{ id: string; type: string }>;
};

export const GET = withUser(
  async ({ supabase }, request: NextRequest, { params }: RouteContext) => {
    const { id: identifier, type } = await params;
    if (!identifier || !type || !FOLLOW_TYPES.has(type)) {
      return badRequest("A fursona id and follow type are required");
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );
    const { data: target, error: targetError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq(isUuid ? "id" : "username", identifier)
      .eq("is_active", true)
      .maybeSingle();

    if (targetError) return serverError(targetError.message);
    if (!target) return notFound("Fursona not found");

    const cursor = request.nextUrl.searchParams.get("cursor");
    const relationshipColumn =
      type === "followers" ? "following_fursona_id" : "follower_fursona_id";
    const resultColumn =
      type === "followers" ? "follower_fursona_id" : "following_fursona_id";

    let relationshipQuery = supabase
      .schema("social")
      .from("followers")
      .select(`${resultColumn}, created_at`)
      .eq(relationshipColumn, target.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) relationshipQuery = relationshipQuery.lt("created_at", cursor);

    const { data: relationships, error: relationshipError } =
      await relationshipQuery;
    if (relationshipError) return serverError(relationshipError.message);

    const hasMore = (relationships?.length ?? 0) > PAGE_SIZE;
    const page = (relationships ?? []).slice(0, PAGE_SIZE) as Array<{
      created_at: string;
      follower_fursona_id?: string;
      following_fursona_id?: string;
    }>;
    const ids = page
      .map(
        (relationship) =>
          relationship[
            resultColumn as "follower_fursona_id" | "following_fursona_id"
          ],
      )
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) {
      return okPrivateRead({ follows: [], nextCursor: null });
    }

    const { data: fursonas, error: fursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id, username, display_name, avatar_url, bio")
      .in("id", ids)
      .eq("is_active", true);

    if (fursonaError) return serverError(fursonaError.message);

    const fursonaById = new Map(
      (fursonas ?? []).map((fursona) => [fursona.id, fursona]),
    );
    const follows = ids.map((id) => fursonaById.get(id)).filter(Boolean);
    const nextCursor = hasMore ? (page.at(-1)?.created_at ?? null) : null;

    return okPrivateRead({ follows, nextCursor });
  },
);
