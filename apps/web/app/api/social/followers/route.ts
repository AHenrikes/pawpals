import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, notFound, serverError } from "@/lib/api/responses";

export async function GET() {
  const { supabase, account, response } = await requireUser();

  if (response) return response;
  if (account === null) return unauthorized();

  // Get current fursona for the authenticated account
  const { data: fursona, error: fursonaError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_current", true)
    .single();

  if (fursonaError || !fursona) {
    return notFound("No current fursona found");
  }

  // Get follow statistics for the current fursona
  const { data: stats, error: statsError } = await supabase
    .schema("social")
    .rpc("get_fursona_follow_stats", { p_fursona_id: fursona.id });

  if (statsError) return serverError(statsError.message);

  return new Response(
    JSON.stringify({
      followers_count: stats?.followers_count ?? 0,
      following_count: stats?.following_count ?? 0,
      following: stats?.following ?? [],
      followers: stats?.followers ?? [],
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
