import { badRequest, unauthorized } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/requireUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { supabase, account, response } = await requireUser();
  if (response) return response;
  if (!account) return unauthorized();

  const { username } = await params;
 
  if (!username) return badRequest("Username is required");
 
  const { data, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select(
      "username, display_name, avatar_url, banner_url, species, pronouns, bio, reputation, created_at"
    )
    .eq("username", username)
    .eq("is_active", true)
    .single();
 
  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
 
  return NextResponse.json(data);
}
