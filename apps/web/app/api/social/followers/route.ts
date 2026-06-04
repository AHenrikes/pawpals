import { requireUser } from "@/lib/auth/requireUser";
import {
  unauthorized,
  notFound,
  serverError,
  badRequest,
} from "@/lib/api/responses";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { supabase, account, response } = await requireUser();

  if (response) return response;
  if (account === null) return unauthorized();

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  let fursonaId: string;
  let isFollowing = false;

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
      const { data: followRow } = await supabase
        .schema("social")
        .from("followers")
        .select("id")
        .eq("follower_fursona_id", myFursona.id)
        .eq("following_fursona_id", fursonaId)
        .maybeSingle();
      isFollowing = !!followRow;
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
    "get_fursona_follow_stats",
    { p_fursona_id: fursonaId },
  );

  if (statsError) return serverError(statsError.message);

  return NextResponse.json({
    followers_count: stats?.followers_count ?? 0,
    following_count: stats?.following_count ?? 0,
    following: (stats?.following ?? []).map(({ username, display_name }: { username: string; display_name: string }) => ({ username, display_name })),
    followers: (stats?.followers ?? []).map(({ username, display_name }: { username: string; display_name: string }) => ({ username, display_name })),
    is_following: isFollowing,
  });
}

export async function POST(request: Request) {
  const { supabase, account, response } = await requireUser();
  if (response) return response;
  if (!account) return unauthorized();

  const { username } = await request.json();
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

  const { error } = await supabase.schema("social").from("followers").insert({
    follower_fursona_id: myFursona.id,
    following_fursona_id: targetFursona.id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already following" }, { status: 409 });
    }

    return serverError(error.message);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { account, supabase, response } = await requireUser();
  if (response) return response;
  if (!account) return unauthorized();

  const { username } = await request.json();
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
    .from("followers")
    .delete()
    .eq("follower_fursona_id", myFursona.id)
    .eq("following_fursona_id", targetFursona.id);

  if (error) return serverError(error.message);

  return NextResponse.json({ success: true });
}
