"use client";

import { usePaginatedPosts } from "@/hooks/usePaginatedPosts";

export function usePosts() {
  return usePaginatedPosts({
    endpoint: "/api/social/posts",
    initialLoading: false,
  });
}
