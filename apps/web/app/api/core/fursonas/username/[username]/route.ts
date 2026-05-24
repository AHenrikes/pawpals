import { type NextRequest } from "next/server";
import type { RouteContext } from "@/lib/types/api";
import { serverError, notFound } from "@/lib/api/responses";
import { createServer } from "@repo/supabase/server";

export async function GET(
  _request: NextRequest,
  context: RouteContext<{ username: string }>,
) {
  try {
    const supabase = await createServer();
    const { username } = await context.params;

    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        `
        id,
        account_id,
        display_name,
        username,
        avatar_url,
        banner_url,
        species,
        pronouns,
        bio,
        reputation,
        is_default,
        is_current,
        created_at
      `,
      )
      .eq("username", username)
      .single();

    if (error || !fursona) return notFound();

    return new Response(JSON.stringify({ fursona }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
