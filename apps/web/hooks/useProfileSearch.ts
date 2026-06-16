"use client";

import { useState, useEffect } from "react";
import { makeCache } from "@/lib/helpers/profile-cache";
import { toError } from "@/lib/helpers/error-utils";
import type { FursonaSearch } from "@/types/fursona";
import { api } from "@/lib/api/api-client";

const searchCache = makeCache<FursonaSearch[]>(2 * 60 * 1000);

export function useProfileSearch(term: string, debounceMs = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(term);
  const [results, setResults] = useState<FursonaSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), debounceMs);
    return () => clearTimeout(timer);
  }, [term, debounceMs]);

  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    searchCache
      .get(debouncedTerm, () => 
        api.get<{ fursonas: FursonaSearch[] }>(`/api/search/fursonas?q=${encodeURIComponent(debouncedTerm)}`)
        .then((res) => res.fursonas ?? [])
      )
      .then((data) => { if (!cancelled) setResults(data); })
      .catch((err) => { if (!cancelled) setError(toError(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedTerm]);

  return { results, loading, error };
}