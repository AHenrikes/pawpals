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
export function useFollow(username: string): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    const checkFollowState = async () => {
      setLoading(true);

      try {
        const res = await api.get<{ isFollowing: boolean }>(`/api/core/fursona/${username}/follow`);

        if (!cancelled) setIsFollowing(res.isFollowing);
      } catch {
        
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkFollowState();
    return () => { cancelled = true };
  }, [username])

 const toggle = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const method = isFollowing ? "delete" : "post";
    const endpoint = `/api/core/fursona/${username}/follow`;

    await api[method](endpoint);
    
    setIsFollowing(prev => !prev);
  } catch (err) {
    setError(toError(err));
  } finally {
    setLoading(false);
  }
}, [username, isFollowing]);

  return { isFollowing, loading, error, toggle };
}
