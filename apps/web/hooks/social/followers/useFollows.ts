"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

export interface FursonaPreview {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface UseFollowsReturn {
  follows: FursonaPreview[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor: string | null;
  fetchMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

type FollowType = "followers" | "following";

/**
 * Hook for fetching and paginating follower/following lists.
 * Implements cursor-based pagination for efficient data loading.
 *
 * @param fursonaIdentifier - The fursona UUID or username to fetch for
 * @param type - 'followers' to get followers, 'following' to get following list
 * @returns Object with follows array, loading state, error, and pagination
 *
 * @example
 * ```tsx
 * const { follows, loading, hasMore, fetchMore } = useFollows('alice', 'followers');
 *
 * return (
 *   <div>
 *     {follows.map(fursona => (
 *       <ProfileCard key={fursona.id} fursona={fursona} />
 *     ))}
 *     {hasMore && (
 *       <button onClick={fetchMore} disabled={loading}>
 *         Load More
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useFollows(
  fursonaIdentifier: string,
  type: FollowType,
): UseFollowsReturn {
  const [follows, setFollows] = useState<FursonaPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchFollows = useCallback(async () => {
    if (!fursonaIdentifier) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        follows: FursonaPreview[];
        nextCursor: string | null;
      }>(`/api/core/fursonas/${encodeURIComponent(fursonaIdentifier)}/${type}`);
      setFollows(res.follows);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(toError(err));
      setFollows([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [fursonaIdentifier, type]);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        follows: FursonaPreview[];
        nextCursor: string | null;
      }>(
        `/api/core/fursonas/${encodeURIComponent(fursonaIdentifier)}/${type}?cursor=${encodeURIComponent(
          nextCursor,
        )}`,
      );
      setFollows((prev) => [...prev, ...res.follows]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [fursonaIdentifier, type, nextCursor, loading]);

  useEffect(() => {
    fetchFollows();
  }, [fetchFollows]);

  return {
    follows,
    loading,
    error,
    hasMore: !!nextCursor,
    nextCursor,
    fetchMore,
    refetch: fetchFollows,
  };
}
