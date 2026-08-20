import {
  badRequest,
  notFound,
  okPrivateRead,
  serverError
} from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/requireUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { NextRequest } from "next/server";

export type ProfileCounts = {
  follower_count: number;
  following_count: number;
  post_count: number;
  like_count: number;
  reputation_count: number;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data, error } = await supabase
    .schema("social")
    .from("v_fursona_stats")
    .select(
      "follower_count, following_count, post_count, like_count, reputation",
    )
    .eq("fursona_id", id)
    .single();

  if (error) return serverError(error.message);
  if (!data) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  return okPrivateRead({
    follower_count: data.follower_count,
    following_count: data.following_count,
    post_count: data.post_count,
    like_count: data.like_count,
    reputation_count: data.reputation,
  } satisfies ProfileCounts);
}
