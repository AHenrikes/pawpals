import { createServer } from "@repo/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("q");

  if (!term?.trim()) {
    return NextResponse.json({ fursonas: [] });
  }

  const supabase = await createServer();

  const { data, error } = await supabase.rpc("search_fursonas", {
    search_term: term,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fursonas: data ?? [] });
}
