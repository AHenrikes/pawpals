"use client";

import { useState, useEffect, useRef } from "react";
import { toError } from "@/lib/helpers/error-utils";

/**
 * Generic hook for fetching data with loading and error states.
 * Handles cancelled requests on unmount and dependency changes.
 *
 * @template T - The type of data being fetched
 * @param fetcher - Async function that fetches the data
 * @param deps - Dependency array for the useEffect
 * @returns Object with data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data: posts, loading, error } = useAsyncData(
 *   () => api.get(`/api/posts/${id}`),
 *   [id]
 * );
 * ```
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(toError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

