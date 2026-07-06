"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

interface UseFollowReturn {
  isFollowing: boolean;
  loading: boolean;
  error: Error | null;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing follow/unfollow state for a fursona
 *
 * @param fursonaUsername - Username of the fursona to follow/unfollow
 */
export function useFollow(id?: string): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const checkFollowState = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<{ isFollowing: boolean }>(
          `/api/core/fursonas/${id}/follow`,
        );

        if (!cancelled) setIsFollowing(res.isFollowing);
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
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [id, isFollowing]);

  return { isFollowing, loading, error, toggle };
}
