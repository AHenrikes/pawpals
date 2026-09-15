"use client";

import { useCallback } from "react";
import { api } from "@/lib/api/api-client";
import { useUser } from "@/providers/UserProvider";
import { useQuery } from "@tanstack/react-query";

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

/**
 * Hook for fetching social stats
 *
 * @param fursonaId - id of the fursona to get social stats
 */
export function useProfileCounts(id?: string): SocialData {
  const { signOut } = useUser();
  const query = useQuery({
    queryKey: ["profile-counts", id],
    enabled: !!id,
    staleTime: 10 * 1000,
    queryFn: async () => {
      try {
        return await api.get<ProfileCountsResponse>(
          `/api/core/fursonas/${id}/counts`,
        );
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          (err as { status: number }).status === 401
        ) {
          await signOut();
        }
        throw err;
      }
    },
  });

  const data = query.data;
  const social: SocialStats = data
    ? {
        follower: data.follower_count ?? 0,
        following: data.following_count ?? 0,
        likes: data.like_count ?? 0,
        post: data.post_count ?? 0,
        reputation: data.reputation_count ?? 0,
      }
    : initialState;

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    ...social,
    error: query.error instanceof Error ? query.error : null,
    loading: query.isLoading,
    refetch,
  };
}

export default useProfileCounts;
