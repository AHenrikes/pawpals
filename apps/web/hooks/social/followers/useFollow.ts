"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { useToggleState } from "@/hooks/social/useToggleState";

interface FollowStatusResponse {
  isFollowing: boolean;
  isMutual: boolean;
  mutualSince: string | null;
}

interface UseFollowReturn {
  isFollowing: boolean;
  isMutual: boolean;
  mutualSince: string | null;
  loading: boolean;
  error: Error | null;
  toggle: () => Promise<void>;
}

/**
 * Hook for managing follow/unfollow state for a fursona.
 *
 * @param id - fursona identifier to follow or unfollow
 */
export function useFollow(id?: string): UseFollowReturn {
  const endpoint = id ? `/api/core/fursonas/${id}/follow` : "";

  const {
    isActive: isFollowing,
    loading,
    error,
    toggle: toggleFollow,
  } = useToggleState<FollowStatusResponse>({
    id,
    endpoint,
    queryKey: id ? ["profile-counts", id] : [],
    getIsActive: (response) => response.isFollowing,
  });

  const [isMutual, setIsMutual] = useState(false);
  const [mutualSince, setMutualSince] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsMutual(false);
      setMutualSince(null);
      return;
    }

    let cancelled = false;

    const fetchFollowState = async () => {
      try {
        const response = await api.get<FollowStatusResponse>(endpoint);

        if (!cancelled) {
          setIsMutual(response.isMutual);
          setMutualSince(response.mutualSince);
        }
      } catch {
        if (!cancelled) {
          setIsMutual(false);
          setMutualSince(null);
        }
      }
    };

    void fetchFollowState();

    return () => {
      cancelled = true;
    };
  }, [endpoint, id]);

  const toggle = useCallback(async () => {
    await toggleFollow();
  }, [toggleFollow]);

  return { isFollowing, isMutual, mutualSince, loading, error, toggle };
}
