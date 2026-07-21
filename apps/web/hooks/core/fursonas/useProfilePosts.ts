"use client";

import { usePaginatedPosts } from "@/hooks/usePaginatedPosts";

export function useProfilePosts(fursonaId: string) {
  return usePaginatedPosts({
    endpoint: `/api/core/fursonas/${fursonaId}/posts`,
    initialLoading: true,
  });
}
