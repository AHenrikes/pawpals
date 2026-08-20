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
import { makeCache } from "@/lib/helpers/profile-cache";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useRouter } from "next/navigation";
import { clearPostsCache } from "@/hooks/usePaginatedPosts";
import { clearProfileCountsCache } from "@/hooks/core/views/useProfileCounts";
import { clearProfileSearchCache } from "@/hooks/core/fursonas/useProfileSearch";
import { type AccountTypes } from "@/types/account";
import { type FursonaTypes } from "@/types/fursona";

export type UserContextType = {
  account: AccountTypes | null;
  fursonas: FursonaTypes[];
  currentFursona: FursonaTypes | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchFursonas: () => Promise<void>;
  switchCurrentFursona: (id: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = useSupabaseClient();
  const isMountedRef = useRef(true);
  const initialLoadDone = useRef(false);
  const fursonasCacheRef = useRef(makeCache<FursonaTypes[]>());
  const router = useRouter();

  const [account, setAccount] = useState<AccountTypes | null>(null);
  const [fursonas, setFursonas] = useState<FursonaTypes[]>([]);
  const [currentFursona, setCurrentFursona] = useState<FursonaTypes | null>(
    null,
  );
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
    fursonasCacheRef.current.clear();
    clearPostsCache();
    clearProfileCountsCache();
    clearProfileSearchCache();
    setState({
      account: null,
      fursonas: [],
      currentFursona: null,
      error: null,
    });
  }, [setState]);

  const refresh = useCallback(async () => {
    setState({ loading: true, error: null });

    try {
      const res = await api.get<{
        account: AccountTypes;
        currentFursona: FursonaTypes | null;
      }>("/api/core/accounts");

      setState({
        account: {
          ...res.account,
          dob: new Date(res.account.dob),
          created_at: new Date(res.account.created_at),
          updated_at: new Date(res.account.updated_at),
        },
        currentFursona: res.currentFursona,
      });

      initialLoadDone.current = true;
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
      if (isMountedRef.current) setState({ error: toError(err) });
    } finally {
      setState({ loading: false });
    }
  }, [supabase, setState]);

  const fetchFursonas = useCallback(async () => {
    try {
      const fursonas = await fursonasCacheRef.current.get(
        "fursonas",
        async () => {
          const res = await api.get<{ fursonas: FursonaTypes[] }>(
            "/api/core/fursonas",
          );
          return res.fursonas ?? [];
        },
      );
      setState({ fursonas });
    } catch (err) {
      setState({ error: toError(err) });
    }
  }, [setState]);

  useEffect(() => {
    isMountedRef.current = true;
    refresh();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!isMountedRef.current) return;

      if (event === "SIGNED_OUT") {
        router.push(AUTH_ROUTES.SIGN_IN);
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
  }, [router, refresh, supabase, clearAuthState, setState]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }, [supabase]);

  const switchCurrentFursona = useCallback(
    async (fursonaId: string) => {
      try {
        setState({ loading: true, error: null });

        const res = await api.patch<{ fursona: FursonaTypes }>(
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

        fursonasCacheRef.current.set("fursonas", next);
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
      fetchFursonas,
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
      fetchFursonas,
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
