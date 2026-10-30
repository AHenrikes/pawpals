"use client";

import { useQuery } from "@tanstack/react-query";
import { type FursonaProfile } from "@/types/fursona";
import { api } from "@/lib/api/api-client";
import { useUser } from "@/providers/UserProvider";

export function useProfile(id: string, initialProfile?: FursonaProfile) {
  const { currentFursona, loading: userLoading } = useUser();
  const {
    data: profile = initialProfile ?? null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fursona", id, currentFursona?.id],
    initialData: initialProfile,
    enabled: !!id && !userLoading,
    staleTime: 0,
    queryFn: async () => {
      try {
        return await api.get<FursonaProfile>(
          `/api/core/fursonas/${encodeURIComponent(id)}`,
        );
      } catch (cause) {
        if (
          cause &&
          typeof cause === "object" &&
          "status" in cause &&
          cause.status === 404
        )
          return null;
        throw cause;
      }
    },
  });

  return { profile, loading: !initialProfile && (userLoading || isLoading), error, refetch };
}
