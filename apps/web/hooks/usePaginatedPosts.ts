"use client";

import { api } from "@/lib/api/api-client";
import { parseMediaUrls } from "@/lib/helpers/parseMediaUrls";
import { CancelledError, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
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

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => parseMediaUrls(page.posts)) ?? [],
    [query.data],
  );
  const nextCursor = useMemo(
    () => query.data?.pages.at(-1)?.nextCursor ?? null,
    [query.data],
  );

  const fetchPosts = useCallback(async () => {
    try {
      await query.refetch({ throwOnError: true });
    } catch (err) {
      if (err instanceof CancelledError) return;
      throw err;
    }
  }, [query.refetch]);

  const fetchMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    try {
      await query.fetchNextPage({ throwOnError: true });
    } catch (err) {
      if (err instanceof CancelledError) return;
      throw err;
    }
  }, [
    query.refetch,
    query.fetchNextPage,
    query.hasNextPage,
    query.isFetchingNextPage,
  ]);

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
