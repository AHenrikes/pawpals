"use client";

import { api } from "@/lib/api/api-client";
import { parseMediaUrls } from "@/lib/helpers/parseMediaUrls";
import { makeCache } from "@/lib/helpers/profile-cache";
import { useCallback, useRef, useState } from "react";
import type { PostType } from "@/types/post";

interface PostsFeed {
  posts: PostType[];
  nextCursor: string | null;
}

interface UsePaginatedPostsState {
  posts: PostType[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

interface UsePaginatedPostsOptions {
  endpoint: string;
  initialLoading?: boolean;
}

const postsCache = makeCache<PostsFeed>(15 * 1000);

export function usePaginatedPosts({
  endpoint,
  initialLoading = false,
}: UsePaginatedPostsOptions) {
  const [state, setState] = useState<UsePaginatedPostsState>({
    posts: [],
    nextCursor: null,
    loading: initialLoading,
    loadingMore: false,
    error: null,
  });

  const fetchingRef = useRef(false);
  const fetchingMoreRef = useRef(false);

  const fetchPosts = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await postsCache.get(endpoint, () => api.get<PostsFeed>(endpoint));
      const parsedPosts = parseMediaUrls(data.posts);
      setState((s) => ({
        ...s,
        posts: parsedPosts,
        nextCursor: data.nextCursor,
      }));
    } catch {
      setState((s) => ({ ...s, error: "Failed to load posts." }));
    } finally {
      setState((s) => ({ ...s, loading: false }));
      fetchingRef.current = false;
    }
  }, [endpoint]);

  const fetchMore = useCallback(async () => {
    if (!state.nextCursor || fetchingMoreRef.current) return;
    fetchingMoreRef.current = true;
    setState((s) => ({ ...s, loadingMore: true }));

    try {
      const cacheKey = `${endpoint}?cursor=${encodeURIComponent(state.nextCursor)}`;
      const data = await postsCache.get(cacheKey, () =>
        api.get<PostsFeed>(cacheKey),
      );
      const parsedPosts = parseMediaUrls(data.posts);
      setState((s) => ({
        ...s,
        posts: [...s.posts, ...parsedPosts],
        nextCursor: data.nextCursor,
      }));
    } catch {
      setState((s) => ({ ...s, error: "Failed to load more posts." }));
    } finally {
      setState((s) => ({ ...s, loadingMore: false }));
      fetchingMoreRef.current = false;
    }
  }, [endpoint, state.nextCursor]);

  return {
    ...state,
    fetchPosts,
    fetchMore,
    hasMore: !!state.nextCursor,
  };
}
