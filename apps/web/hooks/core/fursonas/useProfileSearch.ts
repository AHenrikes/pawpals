"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/api-client";
import { type FursonaSearch } from "@/types/fursona";
import { useQuery } from "@tanstack/react-query";

export function useProfileSearch(term: string, debounceMs = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(term);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), debounceMs);
    return () => clearTimeout(timer);
  }, [term, debounceMs]);

  const {
    data: results = [],
    isFetching,
    error,
  } = useQuery<FursonaSearch[], Error>({
    queryKey: ["fursona-search", debouncedTerm],
    enabled: !!debouncedTerm.trim(),
    staleTime: 2 * 60 * 1000,
    queryFn: () =>
      api
        .get<{
          fursonas: FursonaSearch[];
        }>(`/api/core/fursonas/search?q=${encodeURIComponent(debouncedTerm)}`)
        .then((res) => res.fursonas ?? []),
  });

  return {
    results: results || [],
    loading: Boolean(term.trim()) && (term !== debouncedTerm || isFetching),
    error,
  };
}
