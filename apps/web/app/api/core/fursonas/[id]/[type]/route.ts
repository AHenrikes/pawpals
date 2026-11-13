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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

type FollowCursor = { createdAt: string; fursonaId: string };

function decodeCursor(value: string): FollowCursor | null {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(value)) return null;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString(),
    );
    if (!parsed || typeof parsed !== "object") return null;
    const { createdAt, fursonaId } = parsed as Partial<FollowCursor>;
    if (
      typeof createdAt !== "string" ||
      !TIMESTAMP.test(createdAt) ||
      Number.isNaN(Date.parse(createdAt)) ||
      typeof fursonaId !== "string" ||
      !UUID.test(fursonaId)
    )
      return null;
    return { createdAt, fursonaId };
  } catch {
    return null;
  }
}

function encodeCursor(cursor: FollowCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

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

    const cursorValue = request.nextUrl.searchParams.get("cursor");
    const cursor = cursorValue === null ? null : decodeCursor(cursorValue);
    if (cursorValue !== null && !cursor) return badRequest("Invalid cursor");
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
      .order(resultColumn, { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      relationshipQuery = relationshipQuery.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},${resultColumn}.lt.${cursor.fursonaId})`,
      );
    }

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

    const { data: fursonas, error: profileError } = await supabase
      .schema("social")
      .rpc("get_fursona_profiles_by_ids", {
        p_ids: ids,
        p_actor_fursona_id: actingFursonaId,
      });
    if (profileError) return serverError(profileError.message);

    const profileRows = (fursonas ?? []) as Array<{
      id: string;
      [key: string]: unknown;
    }>;
    const fursonaById = new Map(
      profileRows.map((fursona) => [fursona.id, fursona]),
    );
    const follows = ids.map((id) => fursonaById.get(id)).filter(Boolean);
    const last = page.at(-1);
    const lastId =
      last?.[resultColumn as "follower_fursona_id" | "followed_fursona_id"];
    const nextCursor =
      hasMore && last && lastId
        ? encodeCursor({ createdAt: last.created_at, fursonaId: lastId })
        : null;

    return okPrivateRead({ follows, nextCursor });
  },
);
