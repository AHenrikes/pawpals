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

export const GET = withUser(async ({ supabase, account }, _req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (selfError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!self) {
    return ok({ isFollowing: false, isMutual: false, mutualSince: null });
  }

  const [{ data: following }, { data: followedBy }] = await Promise.all([
    supabase
      .schema("social")
      .from("followers")
      .select("id")
      .eq("follower_fursona_id", self.id)
      .eq("following_fursona_id", id)
      .maybeSingle(),

    supabase
      .schema("social")
      .from("followers")
      .select("id, created_at")
      .eq("follower_fursona_id", id)
      .eq("following_fursona_id", self.id)
      .maybeSingle(),
  ]);

  return ok({
    isFollowing: !!following,
    isMutual: !!followedBy,
    mutualSince: followedBy?.created_at ?? null,
  });
});

export const POST = withUser(async ({ supabase, account }, _req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (selfError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!self) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
  if (self.id === id) return badRequest("Cannot follow yourself");

  const { error } = await supabase
    .schema("social")
    .from("followers")
    .insert({ follower_fursona_id: self.id, following_fursona_id: id });

  if (error?.code === "23505") return conflict("Already following");
  if (error) return serverError(error.message);

  return ok({ following: true });
});

// follow -> unfollow
export const DELETE = withUser(async ({ supabase, account }, _req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!id) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (selfError) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  if (!self) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  const { error } = await supabase
    .schema("social")
    .from("followers")
    .delete()
    .eq("follower_fursona_id", self.id)
    .eq("following_fursona_id", id);

  if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  return ok({ following: false });
});
