"use client";

import { useState, useEffect } from "react";
import { makeCache } from "@/lib/helpers/profile-cache";
import { api } from "@/lib/api/api-client";
import { useAsyncDataWithCache } from "@/hooks/useAsyncData";
import { type FursonaSearch } from "@/types/fursona";

const searchCache = makeCache<FursonaSearch[]>(2 * 60 * 1000);

export function clearProfileSearchCache() {
  searchCache.clear();
}

export function useProfileSearch(term: string, debounceMs = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(term);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), debounceMs);
    return () => clearTimeout(timer);
  }, [term, debounceMs]);

  const {
    data: results = [],
    loading,
    error,
  } = useAsyncDataWithCache(
    () =>
      api
        .get<{
          fursonas: FursonaSearch[];
        }>(`/api/core/fursonas/search?q=${encodeURIComponent(debouncedTerm)}`)
        .then((res) => res.fursonas ?? []),
    (fetcher) => {
      if (!debouncedTerm.trim()) {
        return Promise.resolve([]);
      }
      return searchCache.get(debouncedTerm, fetcher);
    },
    [debouncedTerm],
  );

  return {
    results: results || [],
    loading,
    error,
  };
}
