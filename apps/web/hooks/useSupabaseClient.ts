"use client";

import { useMemo } from "react";
import { createClient } from "@repo/supabase/client";

/**
 * Hook to get a memoized Supabase client instance.
 * Prevents unnecessary re-instantiation of the client on every render.
 */
export function useSupabaseClient() {
  return useMemo(() => createClient(), []);
}
