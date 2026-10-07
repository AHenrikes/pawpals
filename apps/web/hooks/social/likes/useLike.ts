"use client";

import { useToggleState } from "@/hooks/social/useToggleState";

interface LikeStatusResponse {
  isFollowing: boolean;
  isMutual: boolean;
  mutualSince: string | null;
}

interface UseLikeReturn {
  isLiked: boolean;
  loading: boolean;
  error: Error | null;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing a like/favorite toggle on a fursona or post.
 *
 * @param id - resource identifier used for the underlying endpoint
 */
export function useLike(id?: string): UseLikeReturn {
  const endpoint = id ? `/api/core/fursonas/${id}/follow` : "";

  const {
    isActive: isLiked,
    loading,
    error,
    toggle,
  } = useToggleState<LikeStatusResponse>({
    id,
    endpoint,
    queryKey: id ? ["profile-counts", id] : [],
    getIsActive: (response) => response.isFollowing,
  });

  return { isLiked, loading, error, toggle };
}
