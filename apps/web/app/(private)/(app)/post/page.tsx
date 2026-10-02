"use client";

import { useEffect } from "react";
import { usePosts } from "@/hooks/social/posts/usePosts";
import ProfileLists from "@/components/cards/media/PostCards";

export default function PostCards() {
  const { posts, hasMore, fetchPosts, fetchMore, loading } = usePosts();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <ProfileLists
      posts={posts}
      hasMore={hasMore}
      fetchMore={fetchMore}
      loading={loading}
    />
  );
}
