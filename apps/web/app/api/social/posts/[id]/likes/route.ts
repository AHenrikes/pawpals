import { withUser } from "@/lib/auth/withUser";
import { notFound, serverError, badRequest } from "@/lib/api/responses";
import { NextRequest, NextResponse } from "next/server";

export const GET = withUser(async ({ supabase, account }, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  let fursonaId: string;
  let isLiked = false;

  if (username) {
    // Viewing someone else's profile — look up by username
    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("username", username)
      .single();

    if (error || !fursona) return notFound("Fursona not found");
    fursonaId = fursona.id;

    // Check if current user follows this profile
    const { data: myFursona } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (myFursona) {
      const { data: likeRow } = await supabase
        .schema("social")
        .from("fursona_likes")
        .select("id")
        .eq("liker_fursona_id", myFursona.id)
        .eq("liked_fursona_id", fursonaId)
        .maybeSingle();
      isLiked = !!likeRow;
    }
  } else {
    // No username — fetch current user's active fursona
    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (error || !fursona) return notFound("No current fursona found");
    fursonaId = fursona.id;
  }

  const { data: stats, error: statsError } = await supabase.rpc(
    "get_profile_stats",
    { p_fursona_id: fursonaId },
  );

  if (statsError) return serverError(statsError.message);

  return NextResponse.json({
    likes_received_count: stats?.likes_received_count ?? 0,
    // likes_given_count: stats?.likes_given_count ?? 0,
    // liked_by: (stats?.liked_by ?? []).map(({ username, display_name }: { username: string; display_name: string }) => ({ username, display_name })),
    // likes_given: (stats?.likes_given ?? []).map(({ username, display_name }: { username: string; display_name: string }) => ({ username, display_name })),
    is_liked: isLiked,
  });
});

export const POST = withUser(
  async ({ supabase, account }, req: NextRequest) => {
    const { username } = await req.json();
    if (!username) return badRequest("Username required");

    // GET current active fursona
    const { data: myFursona, error: myError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (myError || !myFursona) return notFound("Couldn't find your Fursona!");

    // GET targeted fursona
    const { data: targetFursona, error: targetError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("username", username)
      .single();

    if (targetError || !targetFursona) return notFound("Fursona not found");
    if (myFursona.id === targetFursona.id)
      return badRequest("Cannot follow yourself!");

    const { error } = await supabase
      .schema("social")
      .from("fursona_likes")
      .insert({
        liker_fuserona_id: myFursona.id,
        liked_fursona_id: targetFursona.id,
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already liked" }, { status: 409 });
      }

      return serverError(error.message);
    }

    return NextResponse.json({ success: true });
  },
);

export const DELETE = withUser(
  async ({ supabase, account }, req: NextRequest) => {
    const { username } = await req.json();
    if (!username) return badRequest("Username required");

    // GET current active fursona
    const { data: myFursona, error: myFursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (myFursonaError || !myFursona)
      return notFound("Couldn't find your fursona!");

    // GET targeted fursona
    const { data: targetFursona, error: targetFursonaError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("username", username)
      .single();

    if (targetFursonaError || !targetFursona)
      return notFound("Fursona not found");

    const { error } = await supabase
      .schema("social")
      .from("fursona_likes")
      .delete()
      .eq("liker_fursona_id", myFursona.id)
      .eq("liked_fursona_id", targetFursona.id);

    if (error) return serverError(error.message);

    return NextResponse.json({ success: true });
  },
);
