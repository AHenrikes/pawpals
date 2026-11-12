import { withUser } from "@/lib/auth/withUser";
import { badRequest, okNoStore, serverError } from "@/lib/api/responses";
import type { NextRequest } from "next/server";

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const GET = withUser(
  async ({ supabase, account }, request: NextRequest) => {
    const actor =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    if (!isUuid(actor)) return badRequest("Select a fursona first.");
    const { data, error } = await supabase
      .schema("social")
      .rpc("list_conversations", { p_actor: actor });
    if (error) return serverError(error.message);
    return okNoStore({ conversations: data ?? [] });
  },
);

export const POST = withUser(
  async ({ supabase, account }, request: NextRequest) => {
    const actor =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    const body = await request.json().catch(() => ({}));
    if (!isUuid(actor) || !isUuid(body.peerId))
      return badRequest("Invalid fursona.");
    const { data, error } = await supabase
      .schema("social")
      .rpc("open_conversation", {
        p_actor: actor,
        p_peer: body.peerId,
      });
    if (error?.code === "42501")
      return badRequest("Messaging requires a mutual follow.");
    if (error) return serverError(error.message);
    return okNoStore({ id: data });
  },
);
