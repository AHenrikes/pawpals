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
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { type PrivateAccountTypes } from "@/types/account";
import type { FursonaTypes } from "@/types/fursona";

export type UserContextType = {
  account: PrivateAccountTypes | null;
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
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const initialLoadDone = useRef(false);
  const refreshIdRef = useRef(0);
  const { navigate } = usePageTransition();

  const [account, setAccount] = useState<PrivateAccountTypes | null>(null);
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
    api.setActingFursona(null);
    queryClient.clear();
    setState({
      account: null,
      fursonas: [],
      currentFursona: null,
      error: null,
    });
  }, [queryClient, setState]);

  const refresh = useCallback(async () => {
    const id = ++refreshIdRef.current;
    setState({ loading: true, error: null });

    try {
      const res = await api.get<{
        account: PrivateAccountTypes;
        currentFursona: FursonaTypes | null;
      }>("/api/core/accounts");

      if (refreshIdRef.current !== id) return;

      setState({
        account: {
          ...res.account,
          dob: res.account.dob ? new Date(res.account.dob) : null,
          age_verified_at: res.account.age_verified_at
            ? new Date(res.account.age_verified_at)
            : null,
          created_at: new Date(res.account.created_at),
          updated_at: res.account.updated_at
            ? new Date(res.account.updated_at)
            : null,
        },
        currentFursona: res.currentFursona,
      });

      initialLoadDone.current = true;
    } catch (err: unknown) {
      if (refreshIdRef.current !== id) return;
      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        (err as { status: number }).status === 401
      ) {
        clearAuthState();
        navigate(AUTH_ROUTES.SIGN_IN, { replace: true, transition: false });
        await supabase.auth.signOut();
        return;
      }
      if (isMountedRef.current) setState({ error: toError(err) });
    } finally {
      if (refreshIdRef.current === id) setState({ loading: false });
    }
  }, [supabase, setState, clearAuthState, navigate]);

  const fetchFursonas = useCallback(async () => {
    try {
      const fursonas = await queryClient.fetchQuery({
        queryKey: ["user-fursonas"],
        staleTime: 10 * 60 * 1000,
        queryFn: async () => {
          const res = await api.get<{ fursonas: FursonaTypes[] }>(
            "/api/core/fursonas",
          );
          return res.fursonas ?? [];
        },
      });
      const storedActingId = api.getActingFursona();
      const acting =
        fursonas.find((fursona) => fursona.id === storedActingId) ??
        fursonas.find((fursona) => fursona.id === account?.default_fursona_id) ??
        fursonas[0] ??
        null;
      api.setActingFursona(acting?.id ?? null);
      setState({ fursonas, currentFursona: acting });
    } catch (err) {
      setState({ error: toError(err) });
    }
  }, [account?.default_fursona_id, queryClient, setState]);

  useEffect(() => {
    isMountedRef.current = true;
    let skipNextInitialSignIn = true;

    refresh();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!isMountedRef.current) return;

      if (event === "SIGNED_OUT") {
        clearAuthState();
        navigate(AUTH_ROUTES.SIGN_IN, { replace: true, transition: false });
        setState({ loading: false });
        return;
      }

      // Skip the SIGNED_IN that fires on initial session restore
      // if (event === "SIGNED_IN" && !initialLoadDone.current) {
      //   initialLoadDone.current = true;
      //   return;
      // }
      if (event === "SIGNED_IN" && skipNextInitialSignIn) {
        skipNextInitialSignIn = false;
        return;
      }
      skipNextInitialSignIn = false;

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
  }, [navigate, refresh, supabase, clearAuthState, setState]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }, [supabase]);

  const switchCurrentFursona = useCallback(
    async (fursonaId: string) => {
      try {
        setState({ loading: true, error: null });

        let ownedFursonas = fursonas;
        let updated = ownedFursonas.find((fursona) => fursona.id === fursonaId);

        // A newly created fursona is not yet present in this provider's state.
        // Refresh ownership from the server before rejecting the switch.
        if (!updated) {
          const res = await api.get<{ fursonas: FursonaTypes[] }>(
            "/api/core/fursonas",
          );
          ownedFursonas = res.fursonas ?? [];
          updated = ownedFursonas.find((fursona) => fursona.id === fursonaId);
        }

        if (!updated) throw new Error("Fursona is not owned by this account.");
        api.setActingFursona(fursonaId);

        // Update local fursonas list to reflect the current flag
        const next = ownedFursonas.map((f) => ({
          ...f,
          is_current: f.id === updated.id,
        }));

        setState({ fursonas: next, currentFursona: updated });

        queryClient.setQueryData(["user-fursonas"], next);
      } catch (err) {
        setState({ error: toError(err) });
        throw err;
      } finally {
        setState({ loading: false });
      }
    },
    [fursonas, queryClient, setState],
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
