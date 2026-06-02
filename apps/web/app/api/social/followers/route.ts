import { requireUser } from "@/lib/auth/requireUser";
import { unauthorized, notFound, serverError } from "@/lib/api/responses";

export async function GET(request: Request) {
  const { supabase, account, response } = await requireUser();
  
  if (response) return response;
  if (account === null) return unauthorized();

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  let fursonaId: number;

  if (username) {
    // Viewing someone else's profile — look up by username
    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("username", username)
      .single();

    if (error || !fursona) return notFound("Fursona not found");
    fursonaId = fursona.id;
  } else {
    // No username — fetch current user's active fursona
    const { data: fursona, error } = await supabase
      .schema("core")
      .from("fursonas")
      .select("id")
      .eq("account_id", account.id)
      .eq("is_current", true)
      .single();

    if (error || !fursona) return notFound("No current fursona found");
    fursonaId = fursona.id;
  }

  const { data: stats, error: statsError } = await supabase
    .rpc("get_fursona_follow_stats", { p_fursona_id: fursonaId });

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
