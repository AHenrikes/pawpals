"use client";
import { useSupabaseClient } from "./useSupabaseClient";
import { useEffect, useRef, useState } from "react";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export type useSessionType = {
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
  loading: boolean;
  error: Error | null;
};

export function useSession(): useSessionType {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useSupabaseClient();
  const mountedRef = useRef(true);

  function toError(err: unknown): Error {
    if (err instanceof Error) return err;
    try {
      return new Error(typeof err === "string" ? err : JSON.stringify(err));
    } catch {
      return new Error(String(err));
    }
  }

  const handleSignOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        return;
      }
      globalThis.location.assign(AUTH_ROUTES.HOME);
      
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    async function fetchUser() {
      try {
        const { data, error } = await supabase.auth.getClaims();
        if (!mountedRef.current) return;

        if (error) {
          setError(toError(error));
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(Boolean(data?.claims));
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setError(toError(err));
        setIsLoggedIn(false);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    fetchUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setIsLoggedIn(Boolean(session?.user ?? false));
      setLoading(false);
    });

    const subscription = data?.subscription;

    return () => {
      mountedRef.current = false;

      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (err) {
          console.warn("[useSession] Failed to unsubscribe from auth listener:", err);
        }
      }
    };
  }, [supabase]);

  return { isLoggedIn, signOut: handleSignOut, loading, error };
}
