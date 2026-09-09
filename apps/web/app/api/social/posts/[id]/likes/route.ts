import { withUser } from "@/lib/auth/withUser";
import { notFound, serverError, badRequest, conflict, ok } from "@/lib/api/responses";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withUser(
  async ({ supabase, account }, _req: NextRequest, { params }: RouteContext) => {
    const { id: postId } = await params;
    if (!postId) return badRequest("Post id required");

    const { data: currentFursona } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (!currentFursona) return notFound("No current fursona found");

    const [{ count, error: countError }, { data: like, error: likeError }] = await Promise.all([
      supabase.schema("social").from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
      supabase.schema("social").from("post_likes").select("id").eq("post_id", postId).eq("liker_fursona_id", currentFursona.id).maybeSingle(),
    ]);

    if (countError || likeError) return serverError((countError ?? likeError)?.message ?? "Unable to load likes");
    return ok({ likes_count: count ?? 0, is_liked: !!like });
  },
);

export const POST = withUser(
  async ({ supabase, account }, _req: NextRequest, { params }: RouteContext) => {
    const { id: postId } = await params;
    if (!postId) return badRequest("Post id required");

    const { data: myFursona, error: myError } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (myError || !myFursona) return notFound("Couldn't find your Fursona!");

    const { error } = await supabase
      .schema("social")
      .from("post_likes")
      .insert({
        liker_fursona_id: myFursona.id,
        post_id: postId,
      });

    if (error) {
      if (error.code === "23505") {
        return conflict("Already liked");
      }

      return serverError(error.message);
    }

    return NextResponse.json({ success: true });
  },
);

export const DELETE = withUser(
  async ({ supabase, account }, _req: NextRequest, { params }: RouteContext) => {
    const { id: postId } = await params;
    if (!postId) return badRequest("Post id required");

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

    const { error } = await supabase
      .schema("social")
      .from("post_likes")
      .delete()
      .eq("liker_fursona_id", myFursona.id)
      .eq("post_id", postId);

    if (error) return serverError(error.message);

    return NextResponse.json({ success: true });
  },
);
