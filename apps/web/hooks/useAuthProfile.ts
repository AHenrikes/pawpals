"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseClient } from "./useSupabaseClient";

type UserProfile = Record<string, unknown>;

export interface UseAuthProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to track current user profile from Supabase
 * Automatically syncs when auth state changes
 * 
 * @returns Object with profile, loading, error, and refetch function
 */
export function useAuthProfile(): UseAuthProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const supabase = useSupabaseClient();

  // Fetch profile from server action
  const fetchProfile = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/profile", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const json = await res.json();
      const userProfile = json.profile ?? null;

      if (mountedRef.current) {
        setProfile(userProfile);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setProfile(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Fetch initial profile
    fetchProfile();

    // Subscribe to auth state changes
    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mountedRef.current) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // User signed in or token refreshed - fetch new profile
        await fetchProfile();
      } else if (event === "SIGNED_OUT") {
        // User signed out - clear profile
        setProfile(null);
        setError(null);
      }
    });

    subscriptionRef.current = data?.subscription ?? null;

    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [fetchProfile, supabase]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

/**
 * Hook to update user profile
 * 
 * @returns Object with updateProfile function and loading/error states
 * 
 * @example
 * const { updateProfile, loading } = useUpdateProfile();
 * await updateProfile({ firstName: "John" });
 */
export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      avatarUrl: string;
      bio?: string | null;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/profile", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Update failed: ${res.status} ${errText}`);
        }

        const json = await res.json();
        const updated = json.profile ?? null;
        if (!updated) throw new Error("Failed to update profile");
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateProfile, loading, error };
}
