import { requireUser } from "@/lib/auth/requireUser";
import { ERROR_MESSAGES } from "@/lib/constants/errors";
import { NextRequest } from "next/server";
import {
  badRequest,
  conflict,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/responses";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const { username } = await params;
  if (!username) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data: target, error: targetError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (targetError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!target) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (selfError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!self) return ok({ isFollowing: false });

  const { data } = await supabase
    .schema("social")
    .from("followers")
    .select("id")
    .eq("follower_fursona_id", self.id)
    .eq("following_fursona_id", target.id)
    .single();

  return ok({ isFollowing: !!data });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const { username } = await params;
  if (!username) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data: target, error: targetError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (targetError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!target) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

  const { data: self, error: selfError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (selfError) return serverError(ERROR_MESSAGES.SERVER_ERROR);
  if (!self) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);
  if (self.id === target.id) return badRequest("Cannot follow yourself");

  const { error } = await supabase
    .schema("social")
    .from("followers")
    .insert({ follower_fursona_id: self.id, following_fursona_id: target.id });

  if (error?.code === "23505") return conflict("Already following");
  if (error) return serverError(error.message);

  return ok({ following: true });
}

// follow -> unfollow
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { supabase, account, response } = await requireUser();
  if (!account) return unauthorized();
  if (response) return response;

  const { username } = await params;
  if (!username) return badRequest(ERROR_MESSAGES.FURSONA_NOT_IDENTIFIED);

  const { data: target, error: targetError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (targetError) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  if (!target) return notFound(ERROR_MESSAGES.FURSONA_NOT_FOUND);

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
    .eq("following_fursona_id", target.id);

  if (error) return serverError(ERROR_MESSAGES.SOMETHING_WENT_WRONG);

  return ok({ following: false });
}
