"use client";

import { api } from "@/lib/api/api-client";
import { parseMediaUrls } from "@/lib/helpers/parseMediaUrls";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { PostType } from "@/types/post";

interface PostsFeed {
  posts: PostType[];
  nextCursor: string | null;
}

interface UsePaginatedPostsOptions {
  endpoint: string;
  initialLoading?: boolean;
}

export function usePaginatedPosts({
  endpoint,
  initialLoading = false,
}: UsePaginatedPostsOptions) {
  const query = useInfiniteQuery({
    queryKey: ["posts", endpoint],
    enabled: initialLoading,
    staleTime: 15 * 1000,
    queryFn: ({ pageParam = null }) => {
      const cursor = pageParam as string | null;
      const separator = endpoint.includes("?") ? "&" : "?";
      const url = cursor
        ? `${endpoint}${separator}cursor=${encodeURIComponent(cursor)}`
        : endpoint;
      return api.get<PostsFeed>(url);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts =
    query.data?.pages.flatMap((page) => parseMediaUrls(page.posts)) ?? [];
  const nextCursor = query.data?.pages.at(-1)?.nextCursor ?? null;

  const fetchPosts = useCallback(async () => {
    await query.refetch({ throwOnError: true });
  }, [query]);

  const fetchMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    await query.fetchNextPage({ throwOnError: true });
  }, [query]);

  return {
    posts,
    nextCursor,
    loading: query.isInitialLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error ? "Failed to load posts." : null,
    fetchPosts,
    fetchMore,
    hasMore: !!query.hasNextPage,
  };
}
