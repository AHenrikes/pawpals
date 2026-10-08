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

    const actingFursonaId = request.headers.get("x-acting-fursona-id");
    const { data: target, error: targetError } = await supabase
      .schema("social")
      .rpc("get_fursona_profile_by_identifier", {
        p_identifier: identifier,
        p_actor_fursona_id: actingFursonaId,
      })
      .maybeSingle();

    if (targetError) return serverError(targetError.message);
    if (!target) return notFound("Fursona not found");
    const targetId = (target as { id: string }).id;

    const cursor = request.nextUrl.searchParams.get("cursor");
    const relationshipColumn =
      type === "followers" ? "followed_fursona_id" : "follower_fursona_id";
    const resultColumn =
      type === "followers" ? "follower_fursona_id" : "followed_fursona_id";

    let relationshipQuery = supabase
      .schema("social")
      .from("follows")
      .select(`${resultColumn}, created_at`)
      .eq(relationshipColumn, targetId)
      .eq("status", "accepted")
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
      followed_fursona_id?: string;
    }>;
    const ids = page
      .map(
        (relationship) =>
          relationship[
            resultColumn as "follower_fursona_id" | "followed_fursona_id"
          ],
      )
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) {
      return okPrivateRead({ follows: [], nextCursor: null });
    }

    const profileResults = await Promise.all(
      ids.map((id) =>
        supabase.schema("social").rpc("get_fursona_profile", {
          p_target_fursona_id: id,
          p_actor_fursona_id: actingFursonaId,
        }),
      ),
    );
    const profileError = profileResults.find((result) => result.error)?.error;
    if (profileError) return serverError(profileError.message);
    const fursonas = profileResults.flatMap((result) => result.data ?? []);

    const fursonaById = new Map(
      fursonas.map((fursona) => [fursona.id, fursona]),
    );
    const follows = ids.map((id) => fursonaById.get(id)).filter(Boolean);
    const nextCursor = hasMore ? (page.at(-1)?.created_at ?? null) : null;

    return okPrivateRead({ follows, nextCursor });
  },
);
