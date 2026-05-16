"use client";

import { useCallback, useEffect, useState } from "react";
import type { FursonaTypesWithID } from "@/types/fursona";
import { useUser } from "@/providers/UserProvider";

type SocialData = {
  following: FursonaTypesWithID[] | null;
  followers: FursonaTypesWithID[] | null;
  likes: FursonaTypesWithID[] | null;
  posts: FursonaTypesWithID[] | null;

  followingCount: number;
  followersCount: number;
  likesCount: number;
  postsCount: number;

  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error("Unknown error");
  }
}

export function useSocial(): SocialData {
  const [following, setFollowing] = useState<FursonaTypesWithID[] | null>(null);
  const [followers, setFollowers] = useState<FursonaTypesWithID[] | null>(null);
  const [likes, setLikes] = useState<FursonaTypesWithID[] | null>(null);
  const [posts, setPosts] = useState<FursonaTypesWithID[] | null>(null);

  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const { signOut } = useUser();

  const fetchSocialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const followersRes = await fetch("/api/social/followers", { headers: { Accept: "application/json" } });

      if (followersRes.status === 401) {
        await signOut();
        return;
      }

      const followersData = await followersRes.json().catch(() => ({}));

      // Check for errors in responses
      if (!followersRes.ok) throw new Error(followersData.error ?? "Failed to fetch followers");

      setFollowing(followersData.following ?? []);
      setFollowingCount(followersData.following_count ?? 0);
      
      setFollowers(followersData.followers ?? []);
      setFollowersCount(followersData.followers_count ?? 0);
      
      setLikes([]);
      setLikesCount(0);
      
      setPosts([]);
      setPostsCount(0);

    } catch (err) {
      const error = toError(err);

      setError(error);
      setFollowing(null);
      setFollowers(null);
      setLikes(null);
      setPosts(null);

      setFollowingCount(0);
      setFollowersCount(0);
      setLikesCount(0);
      setPostsCount(0);

    } finally {
      setLoading(false);
    }
  }, [signOut]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  return {
    following,
    followers,
    likes,
    posts,
    followingCount,
    followersCount,
    likesCount,
    postsCount,
    loading,
    error,
    refetch: fetchSocialData,
  };
}

export default useSocial;
