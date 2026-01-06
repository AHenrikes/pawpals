import { NextResponse } from "next/server";
import { createServer } from "@repo/supabase/server";
import type { NextRequest } from "next/server";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "@repo/supabase/user-actions";

export async function GET() {
  const supabase = await createServer();
  const { profile, error } = await getProfile(supabase);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServer();
    const body = await request.json();
    const { profile, error } = await updateProfile(supabase, body ?? {});

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

export async function DELETE() {
  const supabase = await createServer();
  const { ok, error } = await deleteProfile(supabase);
  
  if (!ok) return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
