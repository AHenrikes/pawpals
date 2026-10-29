import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { NextRequest } from "next/server";
import {
  badRequest,
  conflict,
  notFound,
  ok,
  serverError,
} from "@/lib/api/responses";
import { withUser } from "@/lib/auth/withUser";

export const GET = withUser(
  async (
    { supabase, account },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

    const actingFursonaId =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    if (!actingFursonaId) {
      return ok({ isFollowing: false, isPending: false, isMutual: false, mutualSince: null });
    }

    const [{ data: following }, { data: followedBy }] = await Promise.all([
      supabase
        .schema("social")
        .from("follows")
        .select("created_at, status")
        .eq("follower_fursona_id", actingFursonaId)
        .eq("followed_fursona_id", id)
        .maybeSingle(),

      supabase
        .schema("social")
        .from("follows")
        .select("created_at")
        .eq("follower_fursona_id", id)
        .eq("followed_fursona_id", actingFursonaId)
        .eq("status", "accepted")
        .maybeSingle(),
    ]);

    return ok({
      isPending: following?.status === "pending",
      isFollowing: following?.status === "accepted",
      isMutual: !!followedBy,
      mutualSince: followedBy?.created_at ?? null,
    });
  },
);

export const POST = withUser(
  async (
    { supabase, account },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

    const actingFursonaId =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    if (!actingFursonaId) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    if (actingFursonaId === id) return badRequest("Cannot follow yourself");

    const { data: status, error } = await supabase.rpc("request_follow", {
      p_actor_fursona_id: actingFursonaId,
      p_target_fursona_id: id,
    });

    if (error?.code === "23505") return conflict("Already following");
    if (error) return serverError(error.message);

    return ok({ following: status === "accepted", status });
  },
);

// follow -> unfollow
export const DELETE = withUser(
  async (
    { supabase, account },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

    const actingFursonaId =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    if (!actingFursonaId) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

    const { error } = await supabase
      .schema("social")
      .from("follows")
      .delete()
      .eq("follower_fursona_id", actingFursonaId)
      .eq("followed_fursona_id", id);

    if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

    return ok({ following: false });
  },
);
