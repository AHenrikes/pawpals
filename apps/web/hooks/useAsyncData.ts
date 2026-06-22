"use client";

import { useState, useEffect } from "react";
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
  deps: React.DependencyList
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
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
  }, deps);

  return { data, loading, error };
}

/**
 * Generic hook for fetching data with optional caching.
 * Handles cancelled requests on unmount and dependency changes.
 *
 * @template T - The type of data being fetched
 * @param fetcher - Async function that fetches the data
 * @param cacheGetter - Function to check cache and return cached data if available
 * @param deps - Dependency array for the useEffect
 * @returns Object with data, loading, and error states
 *
 * @example
 * ```tsx
 * const cache = makeCache<UserProfile>(10 * 60 * 1000); // 10 min TTL
 * const { data: profile, loading, error } = useAsyncDataWithCache(
 *   () => api.get(`/api/users/${id}`),
 *   (fetcher) => cache.get(id, fetcher),
 *   [id]
 * );
 * ```
 */
export function useAsyncDataWithCache<T>(
  fetcher: () => Promise<T>,
  cacheGetter: (fetcher: () => Promise<T>) => Promise<T | null>,
  deps: React.DependencyList
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    cacheGetter(fetcher)
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
  }, deps);

  return { data, loading, error };
}
