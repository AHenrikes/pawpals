"use client"

import { useState, useCallback, useRef } from "react"
import { api } from "@/lib/api/api-client"
import { PostWithId } from "@/types/post"

interface PostsFeed {
  posts: PostWithId[]
  nextCursor: string | null
}

interface UsePostsState {
  posts: PostWithId[]
  nextCursor: string | null
  loading: boolean
  loadingMore: boolean
  error: string | null
}

export function usePosts(username: string) {
  const [state, setState] = useState<UsePostsState>({
    posts: [],
    nextCursor: null,
    loading: false,
    loadingMore: false,
    error: null,
  })

  // prevent double-fetching in dev (StrictMode)
  const fetchingRef = useRef(false);
  const baseUrl = `/api/core/fursonas/${username}/posts`;

  const fetchPosts = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const data = await api.get<PostsFeed>(baseUrl);
      setState(s => ({
        ...s,
        posts: data.posts,
        nextCursor: data.nextCursor,
      }))
    } catch {
      setState(s => ({ ...s, error: "Failed to load posts." }))
    } finally {
      setState(s => ({ ...s, loading: false }))
      fetchingRef.current = false
    }
  }, [baseUrl])

  const fetchMore = useCallback(async () => {
    if (!state.nextCursor || state.loadingMore) return
    setState(s => ({ ...s, loadingMore: true }))

    try {
      const data = await api.get<PostsFeed>(
        `${baseUrl}?cursor=${encodeURIComponent(state.nextCursor!)}`
      )
      setState(s => ({
        ...s,
        posts: [...s.posts, ...data.posts],
        nextCursor: data.nextCursor,
      }))
    } catch {
      setState(s => ({ ...s, error: "Failed to load more posts." }))
    } finally {
      setState(s => ({ ...s, loadingMore: false }))
    }
  }, [baseUrl, state.nextCursor, state.loadingMore])

  return {
    ...state,
    fetchPosts,
    fetchMore,
    hasMore: !!state.nextCursor,
  }
}
