"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseClient } from "./useSupabaseClient";
import type { User } from "@supabase/supabase-js";
import type { FursonaRecord } from "@/types/fursona";

type FursonaApiResponse = {
  fursonas?: FursonaRecord[];
  error?: string;
};

export type UserHookType = {
  user: User | null;
  fursonas: FursonaRecord[];
  currentFursona: FursonaRecord | null;
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
  const [fursonas, setFursonas] = useState<FursonaRecord[]>([]);
  const [currentFursona, setCurrentFursona] = useState<FursonaRecord | null>(null);
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
          setFursonas([]);
          setCurrentFursona(null);
        }
        return;
      }

      const fursonaResponse = await fetch("/api/fursonas", { headers: { Accept: "application/json" } });
      const fursonaPayload = (await fursonaResponse.json().catch(() => ({}))) as FursonaApiResponse;

      if (!fursonaResponse.ok) {
        throw new Error(fursonaPayload.error ?? "Failed to fetch fursonas");
      }

      const nextFursonas = fursonaPayload.fursonas ?? [];
      const nextCurrentFursona = nextFursonas.find((fursona) => fursona.is_default) ?? nextFursonas[0] ?? null;

      if (mountedRef.current) {
        setFursonas(nextFursonas);
        setCurrentFursona(nextCurrentFursona);
      }

    } catch (err) {
      if (!mountedRef.current) return;
      setError(toError(err));
      setUser(null);
      setFursonas([]);
      setCurrentFursona(null);

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
        setFursonas([]);
        setCurrentFursona(null);
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
      
    } catch (err) {
      if (!mountedRef.current) return;
      setError(toError(err));
    }
  }, [supabase]);

  return { user, fursonas, currentFursona, loading, error, refresh, signOut };
}

export default useUser;
