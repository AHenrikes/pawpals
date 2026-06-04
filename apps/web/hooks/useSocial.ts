"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { toError } from "@/lib/helpers/error-utils";
import type { FursonaTypes } from "@/types/fursona";
import { useUser } from "@/providers/UserProvider";

type SocialData = {
  following: FursonaTypes[] | null;
  followers: FursonaTypes[] | null;
  likes: FursonaTypes[] | null;
  posts: FursonaTypes[] | null;

  followingCount: number;
  followersCount: number;
  likesCount: number;
  postsCount: number;

  isFollowing: boolean;
  followLoading: boolean;
  toggleFollow: () => Promise<void>;

  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

export function useSocial(username?: string): SocialData {
  const [following, setFollowing] = useState<FursonaTypes[] | null>(null);
  const [followers, setFollowers] = useState<FursonaTypes[] | null>(null);
  const [likes, setLikes] = useState<FursonaTypes[] | null>(null);
  const [posts, setPosts] = useState<FursonaTypes[] | null>(null);

  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const { signOut } = useUser();

  const fetchSocialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If username provided, fetch stats for that user; otherwise fetch for current user
      const endpoint = username
        ? `/api/social/followers?username=${encodeURIComponent(username)}`
        : "/api/social/followers";

      const data = await api.get<{
        following: FursonaTypes[] | null;
        followers: FursonaTypes[] | null;
        likes: FursonaTypes[] | null;
        posts: FursonaTypes[] | null;
        following_count: number;
        followers_count: number;
        likes_count: number;
        posts_count: number;
        is_following: boolean;
      }>(endpoint);

      setFollowing(data.following ?? []);
      setFollowingCount(data.following_count ?? 0);

      setFollowers(data.followers ?? []);
      setFollowersCount(data.followers_count ?? 0);

      setLikes(data.likes ?? []);
      setLikesCount(data.likes_count ?? 0);

      setPosts(data.posts ?? []);
      setPostsCount(data.posts_count ?? 0);

      setIsFollowing(data.is_following ?? false);
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

      setIsFollowing(false);
    } finally {
      setLoading(false);
      setFollowLoading(false);
    }
  }, [signOut, username]);

  const toggleFollow = useCallback(async () => {
    if (!username) return;
    setFollowLoading(true);

    setIsFollowing((prev) => !prev);
    setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));

    try {
      if (isFollowing) {
        await api.delete("/api/social/followers", { username });
      } else {
        await api.post("/api/social/followers", { username });
      }
    } catch {
      setIsFollowing((prev) => !prev);
      setFollowersCount((prev) => (isFollowing ? prev + 1 : prev - 1));
    } finally {
      setFollowLoading(false);
    }
  }, [username, isFollowing]);

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
    isFollowing,
    toggleFollow,
    followLoading,
    loading,
    error,
    refetch: fetchSocialData,
  };
}

export default useSocial;
