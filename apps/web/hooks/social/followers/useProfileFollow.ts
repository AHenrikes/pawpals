"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";

type FollowStatus = {
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  mutualSince: string | null;
};

const EMPTY_STATUS: FollowStatus = {
  isFollowing: false,
  isPending: false,
  isMutual: false,
  mutualSince: null,
};

export function useProfileFollow(id?: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);
  const endpoint = id ? `/api/core/fursonas/${id}/follow` : "";

  const load = useCallback(async () => {
    if (!id) {
      setStatus(EMPTY_STATUS);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setStatus(await api.get<FollowStatus>(endpoint));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [endpoint, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (status.isFollowing || status.isPending) await api.delete(endpoint);
      else await api.post(endpoint);
      await Promise.all([
        load(),
        queryClient.invalidateQueries({ queryKey: ["fursona"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-counts", id] }),
      ]);
    } catch (cause) {
      setError(toError(cause));
      setLoading(false);
    }
  }, [endpoint, id, load, queryClient, status.isFollowing, status.isPending]);

  return { ...status, loading, error, toggle };
}
