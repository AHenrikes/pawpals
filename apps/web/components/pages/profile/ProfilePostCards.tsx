"use client";

import { useEffect } from "react";
import { useProfilePosts } from "@/hooks/core/fursonas/useProfilePosts";
import ProfileLists from "@/components/cards/media/PostCards";

export default function ProfilePostCards({ fursonaId }: Readonly<{ fursonaId: string }>) {
  const { posts, hasMore, fetchPosts, fetchMore, loading } =
    useProfilePosts(fursonaId);

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
