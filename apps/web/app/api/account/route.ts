import { createServer } from "@repo/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createServer();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if(userError || !user) { return NextResponse.json({ error: "No user found"}, { status: 500 }) };
  
}

export async function POST() {

}