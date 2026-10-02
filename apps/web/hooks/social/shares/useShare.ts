"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

interface UseFollowReturn {
  isShared: boolean;
  loading: boolean;
  error: Error | null;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing follow/unfollow state for a fursona
 *
 * @param fursonaId - id of the fursona to follow/unfollow
 */
export function useShare(id?: string): UseFollowReturn {
  const queryClient = useQueryClient();
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const checkShareState = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{
          isFollowing: boolean;
          isMutual: boolean;
          mutualSince: string | null;
        }>(`/api/core/fursonas/${id}/follow`);

        if (!cancelled) {
          setIsShared(res.isFollowing);
        }
      } catch (err) {
        if (!cancelled) setError(toError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkShareState();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const method = isShared ? "delete" : "post";
      const endpoint = `/api/core/fursonas/${id}/follow`;

      await api[method](endpoint);

      setIsShared((prev) => !prev);
      await queryClient.invalidateQueries({
        queryKey: ["profile-counts", id],
      });
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [id, isShared, queryClient]);

  return { isShared, loading, error, toggle };
}
