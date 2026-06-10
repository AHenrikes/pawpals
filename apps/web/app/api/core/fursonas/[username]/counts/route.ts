import { badRequest, notFound, serverError } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/requireUser";

export type ProfileCounts = {
  follower_count: number;
  following_count: number;
  post_count: number;
  like_count: number;
  reputation_count: number;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { supabase, response } = await requireUser();
  if (response) return response;

  const {username} = await params;

  if (!username) return badRequest("Username is required");

  const { data, error } = await supabase
    .schema("social")
    .from("v_fursona_stats")
    .select("follower_count, following_count, post_count, like_count, reputation")
    .eq("username", username)
    .single();

  if (error) return serverError(error.message);
  if (!data) return notFound("Fursona not found.");

  return Response.json({
    follower_count: data.follower_count,
    following_count: data.following_count,
    post_count: data.post_count,
    like_count: data.like_count,
    reputation_count: data.reputation,
  } satisfies ProfileCounts);
}

