import { withUser } from "@/lib/auth/withUser";
import { badRequest, okNoStore, serverError } from "@/lib/api/responses";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Context = { params: Promise<{ id: string }> };
const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const GET = withUser(
  async ({ supabase, account }, request: NextRequest, context: Context) => {
    const actor =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    const { id } = await context.params;
    if (!isUuid(actor) || !isUuid(id))
      return badRequest("Invalid conversation.");
    const { data, error } = await supabase
      .schema("social")
      .rpc("list_direct_messages", {
        p_actor: actor,
        p_conversation: id,
      });
    if (error?.code === "42501") return badRequest("Conversation unavailable.");
    if (error) return serverError(error.message);
    return okNoStore({ messages: data ?? [] });
  },
);

export const POST = withUser(
  async ({ supabase, account }, request: NextRequest, context: Context) => {
    const actor =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (
      !isUuid(actor) ||
      !isUuid(id) ||
      typeof body.body !== "string" ||
      !body.body.trim() ||
      body.body.trim().length > 4000
    )
      return badRequest("Message must be 1 to 4000 characters.");
    const { data, error } = await supabase
      .schema("social")
      .rpc("send_direct_message", {
        p_actor: actor,
        p_conversation: id,
        p_body: body.body,
      });
    if (error?.code === "42501")
      return badRequest("Messaging requires a mutual follow.");
    if (error?.code === "PT429")
      return NextResponse.json(
        { error: "Too many messages. Try again in a minute." },
        { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
      );
    if (error) return serverError(error.message);
    return okNoStore({ message: data });
  },
);

export const PATCH = withUser(
  async ({ supabase, account }, request: NextRequest, context: Context) => {
    const actor =
      request.headers.get("x-acting-fursona-id") ?? account.default_fursona_id;
    const { id } = await context.params;
    if (!isUuid(actor) || !isUuid(id))
      return badRequest("Invalid conversation.");
    const { error } = await supabase
      .schema("social")
      .rpc("mark_conversation_read", {
        p_actor: actor,
        p_conversation: id,
      });
    if (error?.code === "42501") return badRequest("Conversation unavailable.");
    if (error) return serverError(error.message);
    return okNoStore({ ok: true });
  },
);
