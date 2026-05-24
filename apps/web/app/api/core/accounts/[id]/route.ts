import { type NextRequest } from "next/server";
import type { RouteContext } from "@/lib/types/api";
import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, serverError, notFound } from "@/lib/api/responses";

export async function GET(
  _request: NextRequest,
  context: RouteContext<{ id: string }>,
) {
  const { supabase, user, account, response } = await requireUser();

  if (response) return response;
  if (!user || !account) return unauthorized();

  const { id } = await context.params;

  // Only allow fetching the signed-in user's own account data
  if (id !== account.id.toString()) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: accountData, error } = await supabase
    .schema("core")
    .from("accounts")
    .select("id, user_id, firstname, lastname, email, dob")
    .eq("id", account.id)
    .maybeSingle();

  if (error) return serverError(error.message);
  if (!accountData) return notFound("Account not found.");

  return new Response(JSON.stringify({ account: accountData }), {
    headers: { "Content-Type": "application/json" },
  });
}
