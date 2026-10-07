"use client";

import { useToggleState } from "@/hooks/social/useToggleState";

interface BookmarkStatusResponse {
  isFollowing: boolean;
  isMutual: boolean;
  mutualSince: string | null;
}

interface UseBookmarkReturn {
  isBookmarked: boolean;
  loading: boolean;
  error: Error | null;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing bookmark state for a resource.
 *
 * @param id - resource identifier used for the underlying endpoint
 */
export function useBookmark(id?: string): UseBookmarkReturn {
  const endpoint = id ? `/api/core/fursonas/${id}/follow` : "";

  const {
    isActive: isBookmarked,
    loading,
    error,
    toggle,
  } = useToggleState<BookmarkStatusResponse>({
    id,
    endpoint,
    queryKey: id ? ["profile-counts", id] : [],
    getIsActive: (response) => response.isFollowing,
  });

  return { isBookmarked, loading, error, toggle };
}
