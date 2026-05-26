"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api/api-client";
import type { FursonaTypesWithID } from "@/types/fursona";
import { makeCache } from "@/lib/helpers/profile-cache";

export type ProfileContextType = {
  getProfile: (username: string) => Promise<FursonaTypesWithID | null>;
  loading: boolean;
  error: string | null;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * ProfileProvider: Independent provider for fetching ANY public fursona profile
 * NOT specific to logged-in user - just a generic profile lookup cache
 * Usage: useProfile().getProfile(username)
 */
export function ProfileProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cacheRef = useRef(makeCache<FursonaTypesWithID>(CACHE_TTL));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfile = useCallback(
    async (username: string): Promise<FursonaTypesWithID | null> => {
      const cacheKey = username;
      try {
        setLoading(true);
        setError(null);

        const fursona = await cacheRef.current.get(cacheKey, async () => {
          const data = await api.get<{ fursona: FursonaTypesWithID }>(
            `/api/core/fursonas/username/${cacheKey}`,
          );
          return data.fursona;
        });

        setError(null);
        return fursona;
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Failed to fetch profile";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const value: ProfileContextType = useMemo(
    () => ({
      getProfile,
      loading,
      error,
    }),
    [getProfile, loading, error],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
