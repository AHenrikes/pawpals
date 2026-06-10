"use client";

import { useCallback, useState } from "react";
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
 * @param initialFollowState - Initial follow state (optional)
 */
export function useFollow(
  fursonaUsername: string,
  initialFollowState = false,
): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const toggle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = isFollowing
        ? `/api/core/fursonas/${fursonaUsername}/follow?action=unfollow`
        : `/api/core/fursonas/${fursonaUsername}/follow?action=follow`;

      await api.post(endpoint);
      setIsFollowing(!isFollowing);
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [fursonaUsername, isFollowing]);

  return { isFollowing, loading, error, toggle };
}
