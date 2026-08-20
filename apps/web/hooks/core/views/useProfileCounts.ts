"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { makeCache } from "@/lib/helpers/profile-cache";

type SocialStats = {
  following: number;
  follower: number;
  reputation: number;
  post: number;
  likes: number;
};

type SocialData = SocialStats & {
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const initialState: SocialStats = {
  following: 0,
  follower: 0,
  likes: 0,
  post: 0,
  reputation: 0,
};

type ProfileCountsResponse = {
  follower_count: number;
  following_count: number;
  like_count: number;
  post_count: number;
  reputation_count: number;
};

const profileCountsCache = makeCache<ProfileCountsResponse>(10 * 1000);

/**
 * Hook for fetching social stats
 *
 * @param fursonaId - id of the fursona to get social stats
 */
export function useProfileCounts(id?: string): SocialData {
  const [social, setSocial] = useState<SocialStats>(initialState);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const { signOut } = useUser();

  const fetchSocialData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `/api/core/fursonas/${id}/counts`;
      const data = await profileCountsCache.get(cacheKey, () =>
        api.get<ProfileCountsResponse>(cacheKey),
      );

      setSocial({
        follower: data.follower_count ?? 0,
        following: data.following_count ?? 0,
        likes: data.like_count ?? 0,
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
  }, [signOut, id]);

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
