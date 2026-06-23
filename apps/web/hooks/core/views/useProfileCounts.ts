"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";

type SocialStats = {
  following: number;
  follower: number;
  reputation: number;
  post: number;
  like: number;
};

type SocialData = SocialStats & {
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const initialState: SocialStats = {
  following: 0,
  follower: 0,
  like: 0,
  post: 0,
  reputation: 0,
};

export function useProfileCounts(username?: string): SocialData {
  const [social, setSocial] = useState<SocialStats>(initialState);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const { signOut } = useUser();

  const fetchSocialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<{
        follower_count: number;
        following_count: number;
        like_count: number;
        post_count: number;
        reputation_count: number;
      }>(`/api/core/fursonas/${username}/counts`);

      setSocial({
        follower: data.follower_count ?? 0,
        following: data.following_count ?? 0,
        like: data.like_count ?? 0,
        post: data.post_count ?? 0,
        reputation: data.reputation_count ?? 0,
      });
    } catch (err) {
      const error = toError(err);

      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        (err as { status: number }).status === 401
      ) {
        await signOut();
        return;
      }

      setError(error);
      setSocial(initialState);
    } finally {
      setLoading(false);
    }
  }, [signOut, username]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  return {
    ...social,
    error,
    loading,
    refetch: fetchSocialData,
  };
}

export default useProfileCounts;
