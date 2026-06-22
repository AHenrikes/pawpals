"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

type SocialActionType = "like" | "repost" | "bookmark";

interface UseSocialActionReturn {
  isActive: boolean;
  loading: boolean;
  error: Error | null;
  toggle: (id: string) => Promise<void>;
  setIsActive: (active: boolean) => void;
  clearError: () => void;
}

/**
 * Unified hook for social actions (like, repost, bookmark) with optimistic updates.
 * Provides consistent state management and error handling across social features.
 *
 * @param resource - The social action type: 'like', 'repost', or 'bookmark'
 * @returns Object with isActive state, loading state, error, and toggle function
 *
 * @example
 * ```tsx
 * const { isActive: isLiked, loading, error, toggle } = useSocialAction('like');
 *
 * return (
 *   <button
 *     onClick={() => toggle(postId)}
 *     disabled={loading}
 *     aria-pressed={isLiked}
 *   >
 *     {loading ? 'Loading...' : isLiked ? 'Unlike' : 'Like'}
 *   </button>
 * );
 * ```
 */
export function useSocialAction(
  resource: SocialActionType
): UseSocialActionReturn {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const toggle = useCallback(
    async (id: string) => {
      const previousState = isActive;
      setLoading(true);
      setError(null);

      try {
        // Optimistic update
        setIsActive(!previousState);

        const method = previousState ? "delete" : "post";
        const endpoint = `/api/social/${resource}/${id}`;

        await api[method as "post" | "delete"](endpoint);
      } catch (err) {
        // Rollback on error
        setIsActive(previousState);
        setError(toError(err));
      } finally {
        setLoading(false);
      }
    },
    [isActive, resource]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isActive,
    loading,
    error,
    toggle,
    setIsActive,
    clearError,
  };
}
