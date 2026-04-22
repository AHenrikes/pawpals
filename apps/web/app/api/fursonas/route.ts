import { createServer } from "@repo/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

type FursonaInput = {
  name?: string;
  species?: string;
  pronouns?: string;
  bio?: string;
  isMain?: boolean;
};

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function requireUser() {
  const supabase = await createServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user: data.user, response: null };
}

function isUnauthorized(user: User | null): user is null {
  return user === null;
}

function buildPatchUpdates(body: FursonaInput) {
  const updates: Record<string, string | null> = {};

  if (body.name !== undefined) {
    const name = normalizeRequiredName(body.name);
    if (name.length === 0) {
      return {
        updates,
        error: "Fursona name cannot be empty.",
      };
    }
    updates.name = name;
  }

  const optionalFields = ["species", "pronouns", "bio"] as const;
  for (const field of optionalFields) {
    if (body[field] !== undefined) {
      updates[field] = normalizeOptionalText(body[field]);
    }
  }

  return { updates, error: null };
}

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (response) {
    return response;
  }

  if (isUnauthorized(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: fursonas, error } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id,user_id,name,species,pronouns,bio,is_default,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fursonas: fursonas ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) {
    return response;
  }
  if (isUnauthorized(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as FursonaInput;

  const name = normalizeRequiredName(body.name);
  if (name.length === 0) {
    return NextResponse.json({ error: "Fursona name is required." }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await supabase
    .schema("core")
    .from("fursonas")
    .insert({
      user_id: user.id,
      name,
      species: normalizeOptionalText(body.species),
      pronouns: normalizeOptionalText(body.pronouns),
      bio: normalizeOptionalText(body.bio),
      is_default: false,
    })
    .select("id, user_id, name, species, pronouns, bio, is_default")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ fursona: inserted }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) {
    return response;
  }

  if (isUnauthorized(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fursonaId = request.nextUrl.searchParams.get("id");
  if (!fursonaId) {
    return NextResponse.json({ error: "Missing fursona id." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as FursonaInput;
  const { updates, error } = buildPatchUpdates(body);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .schema("core")
      .from("fursonas")
      .update(updates)
      .eq("id", fursonaId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  if (body.isMain === true) {
    const { error: setMainError } = await supabase.rpc("set_main_fursona", { p_fursona_id: fursonaId });
    if (setMainError) {
      return NextResponse.json({ error: setMainError.message }, { status: 400 });
    }
  }

  const { data: fursona, error: fetchError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id, user_id, name, species, pronouns, bio, is_main, updated_at")
    .eq("id", fursonaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!fursona) {
    return NextResponse.json({ error: "Fursona not found." }, { status: 404 });
  }

  return NextResponse.json({ fursona });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) {
    return response;
  }
  if (isUnauthorized(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fursonaId = request.nextUrl.searchParams.get("id");
  if (!fursonaId) {
    return NextResponse.json({ error: "Missing fursona id." }, { status: 400 });
  }

  const { count, error: countError } = await supabase
    .schema("core")
    .from("fursonas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: "At least one fursona is required." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .schema("core")
    .from("fursonas")
    .delete()
    .eq("id", fursonaId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
