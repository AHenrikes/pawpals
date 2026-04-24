import { NextResponse } from "next/server";
import requireUser from "@/lib/auth/requireUser";

export async function GET() {
  const { supabase, user, response } = await requireUser();

  if (response) {
    return response;
  }

  const { data: account, error } = await supabase
  .schema("core")
  .from("accounts")
  .select("user_id, firstname, lastname, email, dob, created_at")
  .eq("user_id", user.id)
  .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ account })
}
