"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseClient } from "./useSupabaseClient";
import type { User } from "@supabase/supabase-js";
import { AUTH_ROUTES } from "@/lib/auth/routes";
type UserProfile = Record<string, unknown>;

export type UserHookType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;

  try {
    return new Error(typeof err === "string" ? err : JSON.stringify(err));

  } catch {
    return new Error("Unknown error");
  }
}

export function useUser(): UserHookType {
  const supabase = useSupabaseClient();
  const mountedRef = useRef(true);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const currentUser = authData.user ?? null;

      if (mountedRef.current) {
        setUser(currentUser);
      }

      if (!currentUser) {
        if (mountedRef.current) {
          setProfile(null);
        }
        return;
      }

    } catch (err) {
      if (!mountedRef.current) return;
      setError(toError(err));
      setUser(null);
      setProfile(null);

    } finally {
      if (mountedRef.current) { setLoading(false) }
    }
  }, [supabase]);

  useEffect(() => {
    mountedRef.current = true;

    refresh();

    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mountedRef.current) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      await refresh();
    });

    const subscription = data?.subscription;

    return () => {
      mountedRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [refresh, supabase]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) { throw error }

      globalThis.location.assign(AUTH_ROUTES.HOME);
      
    } catch (err) {
      if (!mountedRef.current) return;
      setError(toError(err));
    }
  }, [supabase]);

  return { user, profile, loading, error, refresh, signOut };
}

export default useUser;
