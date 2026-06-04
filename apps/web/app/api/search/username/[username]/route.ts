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

    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select("username")
      .eq("username", query)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!fursona) return notFound();

    return Response.json({ exists: true });
  } catch (error) {
    return serverError((error as Error).message);
  }
}
