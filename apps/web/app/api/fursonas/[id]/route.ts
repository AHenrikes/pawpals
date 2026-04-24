import { NextResponse, type NextRequest } from "next/server";
import requireUser from "@/lib/auth/requireUser";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

function Unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function parseFursonaId(rawId: string) {
  // Fursona IDs are bigint in DB; enforce numeric path IDs to avoid invalid-cast queries.
  if (!/^\d+$/.test(rawId)) {
    return null;
  }

  return rawId;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { supabase, user, response } = await requireUser();

  if (response) { return response }
  if (user === null) { return Unauthorized() }

  const { id } = await Promise.resolve(context.params);
  const fursonaId = parseFursonaId(id);

  if (!fursonaId) {
    return NextResponse.json({ error: "Invalid fursona id." }, { status: 400 });
  }

  const { data: fursona, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id, user_id, name, username, species, pronouns, bio, is_default, created_at")
    .eq("id", fursonaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) { return NextResponse.json({ error: error.message }, { status: 500 })}
  if (!fursona) { return NextResponse.json({ error: "Fursona not found." }, { status: 404 })}

  return NextResponse.json({ fursona });
}
