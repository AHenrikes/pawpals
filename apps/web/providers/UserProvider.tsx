"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { FursonaTypesWithID } from "@/types/fursona";
import type { AccountTypesWithRole } from "@/types/account";
import { makeCache } from "@/lib/helpers/profile-cache";

export type UserContextType = {
  account: AccountTypesWithRole | null;
  fursonas: FursonaTypesWithID[];
  currentFursona: FursonaTypesWithID | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  switchCurrentFursona: (id: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = useSupabaseClient();
  const isMountedRef = useRef(true);
  const initialLoadDone = useRef(false);

  const [account, setAccount] = useState<AccountTypesWithRole | null>(null);
  const [fursonas, setFursonas] = useState<FursonaTypesWithID[]>([]);
  const [currentFursona, setCurrentFursona] =
    useState<FursonaTypesWithID | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const setState = useCallback((updates: Partial<UserContextType>) => {
    if (!isMountedRef.current) return;
    if ("account" in updates) setAccount(updates.account ?? null);
    if ("fursonas" in updates) setFursonas(updates.fursonas ?? []);
    if ("currentFursona" in updates)
      setCurrentFursona(updates.currentFursona ?? null);
    if ("error" in updates) setError(updates.error ?? null);
    if ("loading" in updates) setLoading(updates.loading ?? false);
  }, []);

  const clearAuthState = useCallback(() => {
    setState({
      account: null,
      fursonas: [],
      currentFursona: null,
      error: null,
    });
  }, [setState]);

  const refresh = useCallback(async () => {
    try {
      setState({ loading: true, error: null });

      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        clearAuthState();
        return;
      }

      try {
        const fursonasCache = makeCache<FursonaTypesWithID[]>();

        const [accountData, nextFursonas] = await Promise.all([
          api.get<{ account: AccountTypesWithRole }>("/api/core/accounts"),
          fursonasCache.get("fursonas", async () => {
            const res = await api.get<{ fursonas: FursonaTypesWithID[] }>("/api/core/fursonas");
            return res.fursonas ?? [];
          }),
        ]);

        const currentFursona =
          nextFursonas.find((f: FursonaTypesWithID) => f.is_current) ??
          nextFursonas[0] ??
          null;

        setState({
          account: accountData.account ?? null,
          fursonas: nextFursonas,
          currentFursona
        });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          (err as { status: number }).status === 401
        ) {
          await supabase.auth.signOut();
          return;
        }
        throw err;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setState({ error: toError(err) });
      }
    } finally {
      setState({ loading: false });
    }
  }, [supabase, clearAuthState, setState]);

  useEffect(() => {
    isMountedRef.current = true;
    refresh();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!isMountedRef.current) return;

      if (event === "SIGNED_OUT") {
        clearAuthState();
        setState({ loading: false });
        return;
      }

      // Skip the SIGNED_IN that fires on initial session restore
      if (event === "SIGNED_IN" && !initialLoadDone.current) {
        initialLoadDone.current = true;
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        refresh();
      }
    });

    return () => {
      isMountedRef.current = false;
      data?.subscription?.unsubscribe();
    };
  }, [refresh, supabase, clearAuthState, setState]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setState({ error: toError(err) });
    }
  }, [supabase, setState]);

  const switchCurrentFursona = useCallback(
    async (fursonaId: string) => {
      try {
        setState({ loading: true, error: null });

        const res = await api.patch<{ fursona: FursonaTypesWithID }>(
          `/api/core/fursonas/${fursonaId}`,
          { is_current: true },
        );

        const updated = res.fursona;

        // Update local fursonas list to reflect the current flag
        const next = fursonas.map((f) => ({
          ...f,
          is_current: f.id === updated.id,
        }));

        setState({ fursonas: next, currentFursona: updated });
      } catch (err) {
        setState({ error: toError(err) });
        throw err;
      } finally {
        setState({ loading: false });
      }
    },
    [fursonas, setState],
  );

  const value: UserContextType = useMemo(
    () => ({
      account,
      fursonas,
      currentFursona,
      loading,
      error,
      refresh,
      signOut,
      switchCurrentFursona,
    }),
    [
      account,
      fursonas,
      currentFursona,
      loading,
      error,
      refresh,
      signOut,
      switchCurrentFursona,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook to access user context.
 * Must be called within a UserProvider.
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
