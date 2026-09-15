"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

interface UseFollowReturn {
  isFollowing: boolean;
  isMutual: boolean;
  mutualSince: string | null;
  loading: boolean;
  error: Error | null;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing follow/unfollow state for a fursona
 *
 * @param fursonaId - id of the fursona to follow/unfollow
 */
export function useFollow(id?: string): UseFollowReturn {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [mutualSince, setMutualSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const checkFollowState = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{
          isFollowing: boolean;
          isMutual: boolean;
          mutualSince: string | null;
        }>(`/api/core/fursonas/${id}/follow`);

        if (!cancelled) {
          setIsFollowing(res.isFollowing);
          setIsMutual(res.isMutual);
          setMutualSince(res.mutualSince);
        }
      } catch (err) {
        if (!cancelled) setError(toError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkFollowState();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const method = isFollowing ? "delete" : "post";
      const endpoint = `/api/core/fursonas/${id}/follow`;

      await api[method](endpoint);

      setIsFollowing((prev) => !prev);
      await queryClient.invalidateQueries({
        queryKey: ["profile-counts", id],
      });
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [id, isFollowing, queryClient]);

  return { isFollowing, isMutual, mutualSince, loading, error, toggle };
}
