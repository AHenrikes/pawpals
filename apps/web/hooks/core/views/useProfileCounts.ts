"use client";

import { api } from "@/lib/api/api-client";
import { useUser } from "@/providers/UserProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type SocialStats = {
  posts: number;
  followers: number;
  following: number;
  likes: number;
  reputation: number;
};

type SocialData = SocialStats & {
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const initialState: SocialStats = {
  posts: 0,
  followers: 0,
  following: 0,
  likes: 0,
  reputation: 0,
};

type ProfileCountsResponse = {
  post_count: number;
  follower_count: number;
  following_count: number;
  like_count: number;
  reputation_count: number;
};

export function useProfileCounts(id?: string): SocialData {
  const { signOut } = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile-counts", id],
    enabled: !!id,
    staleTime: 10 * 1000,
    queryFn: async () => {
      if (!id) {
        throw new Error("Missing fursona id");
      }

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
        posts: data.post_count ?? 0,
        followers: data.follower_count ?? 0,
        following: data.following_count ?? 0,
        likes: data.like_count ?? 0,
        reputation: data.reputation_count ?? 0,
      }
    : initialState;

  const refetch = async () => {
    if (!id) return;

    await queryClient.invalidateQueries({
      queryKey: ["profile-counts", id],
    });
  };

  return {
    ...social,
    error: query.error instanceof Error ? query.error : null,
    loading: query.isLoading,
    refetch,
  };
}

export default useProfileCounts;
