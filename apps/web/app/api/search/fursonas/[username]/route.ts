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
    const { username: query } = await context.params;

    const { data: fursonas, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select(
        `
        display_name,
        username,
        avatar_url,
        banner_url,
        species,
        pronouns,
        bio,
        reputation
      `,
      )
      .ilike("username", `%${query}%`)
      .limit(10);

    if (error || !fursonas || fursonas.length === 0) return notFound();

    return new Response(JSON.stringify({ fursonas }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
