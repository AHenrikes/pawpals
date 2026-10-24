import {
  badRequest,
  notFound,
  okPrivateRead,
  serverError,
} from "@/lib/api/responses";
import { withUser } from "@/lib/auth/withUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { NextRequest } from "next/server";

export type ProfileCounts = {
  follower_count: number;
  following_count: number;
  post_count: number;
  like_count: number;
  reputation_count: number;
};

type ProfileStatsRow = Omit<ProfileCounts, "reputation_count"> & {
  reputation: number;
};

export const GET = withUser(
  async (
    { supabase },
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

    const { data, error } = await supabase
      .schema("social")
      .rpc("get_fursona_stats", {
        p_target_fursona_id: id,
        p_actor_fursona_id: request.headers.get("x-acting-fursona-id") || null,
      })
      .maybeSingle();

    if (error) return serverError(error.message);
    if (!data) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
    const stats = data as ProfileStatsRow;

    return okPrivateRead({
      post_count: stats.post_count,
      follower_count: stats.follower_count,
      following_count: stats.following_count,
      like_count: stats.like_count,
      reputation_count: stats.reputation,
    } satisfies ProfileCounts);
  },
);
