"use client";

import { makeCache } from "@/lib/helpers/profile-cache";
import { useAsyncDataWithCache } from "@/hooks/useAsyncData";
import { type FursonaTypes } from "@/types/fursona";

const profileCache = makeCache<FursonaTypes | null>(10 * 60 * 1000);

export function useProfile(id: string) {
  const {
    data: profile,
    loading,
    error,
  } = useAsyncDataWithCache(
    async () => {
      const res = await fetch(`/api/core/fursonas/${encodeURIComponent(id)}`);

      if (res.status === 404) return null;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      return res.json() as Promise<FursonaTypes>;
    },
    (fetcher) => profileCache.get(id, fetcher),
    [id],
  );

  return { profile, loading, error };
}
