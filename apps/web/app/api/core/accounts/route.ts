import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, serverError, notFound } from "@/lib/api/responses";

export async function GET() {
  const { supabase, account, response } = await requireUser();

  if (response) return response;
  if (account === null) return unauthorized();

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
