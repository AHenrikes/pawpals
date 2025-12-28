import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getProfileForCurrentUser,
  updateProfileForCurrentUser,
  deleteProfileForCurrentUser,
} from "@repo/supabase/user-actions";

export async function GET() {
  const { profile, error } = await getProfileForCurrentUser();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, error } = await updateProfileForCurrentUser(body ?? {});

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

export async function DELETE() {
  const { ok, error } = await deleteProfileForCurrentUser();
  
  if (!ok) return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
