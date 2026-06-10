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
import type { FursonaTypesWithId } from "@/types/fursona";
import type { AccountTypesWithRole } from "@/types/account";
import { makeCache } from "@/lib/helpers/profile-cache";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useRouter } from "next/navigation";

export type UserContextType = {
  account: AccountTypesWithRole | null;
  fursonas: FursonaTypesWithId[];
  currentFursona: FursonaTypesWithId | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchFursonas: () => Promise<void>
  switchCurrentFursona: (id: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = useSupabaseClient();
  const isMountedRef = useRef(true);
  const initialLoadDone = useRef(false);
  const fursonasCacheRef = useRef(makeCache<FursonaTypesWithId[]>());
  const router = useRouter();

  const [account, setAccount] = useState<AccountTypesWithRole | null>(null);
  const [fursonas, setFursonas] = useState<FursonaTypesWithId[]>([]);
  const [currentFursona, setCurrentFursona] = useState<FursonaTypesWithId | null>(null);
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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        clearAuthState();
        return;
      }

      const { data: profileRows, error: rpcError } = await supabase.rpc('get_user_profile');
      if (rpcError) throw rpcError;

      if (!profileRows || profileRows.length === 0) {
        await supabase.auth.signOut();
        return;
      }

      const profile = profileRows[0];

      const account: AccountTypesWithRole = {
        id: profile.account_id,
        firstname: profile.account_firstname,
        lastname: profile.account_lastname,
        email: profile.account_email,
        dob: new Date(profile.account_dob),
        account_role: profile.account_role,
        created_at: new Date(profile.account_created_at),
        updated_at: new Date(profile.account_updated_at),
      };

      const currentFursona: FursonaTypesWithId | null = profile.current_fursona_id ? {
        id: profile.current_fursona_id,
        account_id: account.id,
        username: profile.current_fursona_username,
        display_name: profile.current_fursona_display_name,
        avatar_url: profile.current_fursona_avatar_url,
        banner_url: profile.current_fursona_banner_url,
        species: profile.current_fursona_species,
        pronouns: profile.current_fursona_pronouns,
        bio: profile.current_fursona_bio,
        reputation: profile.current_fursona_reputation,
        created_at: profile.current_fursona_created_at,
        updated_at: profile.current_fursona_updated_at,
        is_default: profile.current_fursona_is_default,
        is_current: true,
      } : null;

      setState({ account, currentFursona });
      initialLoadDone.current = true;

    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err &&
          (err as { status: number }).status === 401) {
        await supabase.auth.signOut();
        return;
      }
      if (isMountedRef.current) setState({ error: toError(err) });
    } finally {
      setState({ loading: false });
    }
  }, [supabase, clearAuthState, setState]);

  const fetchFursonas = useCallback(async () => {
    try {
      const fursonas = await fursonasCacheRef.current.get("fursonas", async () => {
        const res = await api.get<{ fursonas: FursonaTypesWithId[] }>("/api/core/fursonas");
        return res.fursonas ?? [];
      });
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
        clearAuthState();
        setState({ loading: false });
        router.push(AUTH_ROUTES.SIGN_IN);
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

        const res = await api.patch<{ fursona: FursonaTypesWithId }>(
          `/api/profile/me/${fursonaId}`,
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
