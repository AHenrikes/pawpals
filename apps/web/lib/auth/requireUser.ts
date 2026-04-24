import { createServer } from "@repo/supabase/server";
import { NextResponse } from "next/server";

export default async function requireUser() {
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
