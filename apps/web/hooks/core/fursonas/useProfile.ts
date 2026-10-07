"use client";

import { useQuery } from "@tanstack/react-query";
import { type FursonaTypes } from "@/types/fursona";

export function useProfile(id: string) {
  const {
    data: profile = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fursona", id],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(`/api/core/fursonas/${encodeURIComponent(id)}`);

      if (res.status === 404) return null;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      return res.json() as Promise<FursonaTypes>;
    },
  });

  return { profile, loading: isLoading, error };
}
