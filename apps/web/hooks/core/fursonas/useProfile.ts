"use client";

import { useQuery } from "@tanstack/react-query";
import { type FursonaTypes } from "@/types/fursona";
import { api } from "@/lib/api/api-client";
import { useUser } from "@/providers/UserProvider";

export function useProfile(id: string) {
  const { currentFursona, loading: userLoading } = useUser();
  const {
    data: profile = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fursona", id, currentFursona?.id],
    enabled: !!id && !userLoading,
    staleTime: 0,
    queryFn: async () => {
      try {
        return await api.get<FursonaTypes>(
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

  return { profile, loading: userLoading || isLoading, error, refetch };
}
