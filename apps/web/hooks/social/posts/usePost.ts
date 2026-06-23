"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api/api-client";
import { PostWithId } from "@/types/post";

interface UsePostState {
  post: PostWithId | null;
  loading: boolean;
  error: string | null;
}

export function usePost(id: string) {
  const [state, setState] = useState<UsePostState>({
    post: null,
    loading: false,
    error: null,
  });

  const fetchPost = useCallback(async () => {
    if (!id) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await api.get<{ post: PostWithId }>(
        `/api/social/posts?id=${id}`,
      );
      setState((s) => ({ ...s, post: data.post }));
    } catch {
      setState((s) => ({ ...s, error: "Post not found." }));
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [id]);

  return { ...state, fetchPost };
}
