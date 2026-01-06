import { SupabaseClient } from "@supabase/supabase-js";
/**
 * Server-side auth helpers for common user actions.
 * Place reusable, server-only auth logic here so all apps can import it.
*/
export async function getSession(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session ?? null, error: error ?? null };
}

export async function getUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error: error ?? null };
}

export async function getProfile(supabase: SupabaseClient) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { profile: null, error: userErr };
  const userId = userData?.user?.id;
  if (!userId) return { profile: null, error: new Error("No authenticated user") };

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return { profile: data ?? null, error: error ?? null };
}

export async function getProfileById(supabase: SupabaseClient, userId: string) {
  if (!userId) return { profile: null, error: new Error("userId required") };
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return { profile: data ?? null, error: error ?? null };
}

export async function updateProfile(supabase: SupabaseClient, updates: Record<string, unknown>) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { profile: null, error: userErr };
  const userId = userData?.user?.id;
  if (!userId) return { profile: null, error: new Error("No authenticated user") };

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().maybeSingle();
  return { profile: data ?? null, error: error ?? null };
}

export async function deleteProfile(supabase: SupabaseClient) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { ok: false, error: userErr };
  const userId = userData?.user?.id;
  if (!userId) return { ok: false, error: new Error("No authenticated user") };

  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  return { ok: !error, error: error ?? null };
}

/**
 * Deletes an auth user via Supabase Admin API. Requires a service role key.
 * This is dangerous and must only be run on trusted server environments.
 */
export async function adminDeleteUser(userId: string) {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE is not set in environment");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment");

  // Supabase Admin endpoint
  const url = `${baseUrl.replace(/\/$/, "")}/auth/v1/admin/users/${userId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin delete failed: ${res.status} ${text}`);
  }

  return { ok: true };
}

export default {
  getUser,
  getSession,
  getProfile,
  updateProfile,
  deleteProfile,
  adminDeleteUser,
};
