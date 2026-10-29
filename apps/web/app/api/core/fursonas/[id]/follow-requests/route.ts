import { withUser } from "@/lib/auth/withUser";
import { badRequest, notFound, okNoStore, serverError } from "@/lib/api/responses";
import { type NextRequest } from "next/server";

type Context = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = withUser(async ({ supabase }, _request: NextRequest, { params }: Context) => {
  const { id } = await params;
  if (!UUID.test(id)) return badRequest("Invalid profile id");
  const { data, error } = await supabase.rpc("pending_follows", { p_actor_fursona_id: id });
  if (error?.code === "42501") return notFound("Profile not found");
  if (error) return serverError("Unable to load requests");
  return okNoStore({ requests: data ?? [] });
});

export const PATCH = withUser(async ({ supabase }, request: NextRequest, { params }: Context) => {
  const { id } = await params;
  const body = await request.json().catch(() => null) as { followerId?: string; accept?: boolean } | null;
  if (!UUID.test(id) || !body?.followerId || !UUID.test(body.followerId) || typeof body.accept !== "boolean")
    return badRequest("Invalid follow request");
  const { error } = await supabase.rpc("respond_follow", {
    p_actor_fursona_id: id,
    p_follower_fursona_id: body.followerId,
    p_accept: body.accept,
  });
  if (error?.code === "42501" || error?.code === "P0002") return notFound("Request not found");
  if (error) return serverError("Unable to update request");
  return okNoStore({ status: body.accept ? "accepted" : "rejected" });
});
