import { createServer } from "@repo/supabase/server";
import { NextResponse } from "next/server";

/**
 * Server-side authentication guard and user data fetcher.
 * Creates a fresh Supabase server client and retrieves authenticated user + account.
 * Must be called fresh in each server function (avoid global variables).
 */
export async function requireUser() {
  const supabase = await createServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      account: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Fetch the user's account record
  const { data: account, error: accountError } = await supabase
    .schema("core")
    .from("accounts")
    .select("id, status, platform_role, default_fursona_id")
    .eq("user_id", user.id)
    .single();

  if (accountError) {
    return {
      supabase,
      user: null,
      account: null,
      response: NextResponse.json(
        { error: `Account query failed: ${accountError.message}` },
        { status: 404 },
      ),
    };
  }

  if (!account) {
    return {
      supabase,
      user: null,
      account: null,
      response: NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      ),
    };
  }

  if (account.status !== "active") {
    return {
      supabase,
      user: null,
      account: null,
      response: NextResponse.json(
        { error: "Account is inactive or suspended" },
        { status: 403 },
      ),
    };
  }

  return { supabase, user, account, response: null };
}
