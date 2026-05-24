"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";
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

      // Use centralized API client instead of raw fetch
      const data = await api.get<{
        following: FursonaTypesWithID[] | null;
        followers: FursonaTypesWithID[] | null;
        likes: FursonaTypesWithID[] | null;
        posts: FursonaTypesWithID[] | null;
        following_count: number;
        followers_count: number;
        likes_count: number;
        posts_count: number;
      }>("/api/social/followers");

      setFollowing(data.following ?? []);
      setFollowingCount(data.following_count ?? 0);

      setFollowers(data.followers ?? []);
      setFollowersCount(data.followers_count ?? 0);

      setLikes(data.likes ?? []);
      setLikesCount(data.likes_count ?? 0);

      setPosts(data.posts ?? []);
      setPostsCount(data.posts_count ?? 0);
    } catch (err) {
      const error = toError(err);

      // Check if error is 401 (unauthorized) and sign out
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
