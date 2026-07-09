"use client";

import { useProfilePosts } from "@/hooks/core/fursonas/useProfilePosts";
import { usePosts } from "@/hooks/social/posts/usePosts";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HeartIcon,
  MessageCircleIcon,
  BookmarkIcon,
  ShareIcon,
  EllipsisVerticalIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/helpers/timeAgo";
import { TypographyH2, TypographyMuted, TypographyP, TypographySmall } from "@repo/ui/typography";
import { Button } from "@repo/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { getInitials } from "@/utils/getInitials";
import { useFursonaData } from "@/hooks/useFursonaData";
import type { PostType, MediaItem } from "@/types/post";
import Image from "next/image";
import { DropdownMenu, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import PostDropdown from "../dropdowns/Post";
import MediaTiles from "../mediaTiles";

type PostListProps = {
  posts: PostType[];
  hasMore: boolean;
  fetchMore: () => void;
  loading: boolean;
}



function PostCard({ post, isLast = false }: Readonly<{ post: PostType; isLast?: boolean }>) {
  const { user, loading } = useFursonaData(post.fursona_id);
  const media = post.media_urls ?? [];
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate collapsed height based on actual line count (max 3 lines)
  const lineCount = post.content?.split("\n").length ?? 0;
  const collapsedHeight = `calc(1.5rem * ${Math.min(lineCount, 3)})`;

  return (
    <article className={`flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${!isLast ? "border-b border-border" : ""}`}>
      {/* Avatar */}
      {loading ? (
        <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
      ) : (
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage
            src={user?.avatar_url ?? undefined}
            alt={user?.display_name}
          />
          <AvatarFallback>
            {getInitials(user?.display_name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 space-y-4 md:pr-12">
        {/* Header: Name, Username, Timestamp */}
        <div className="flex justify-between items-center">
          {loading ? (
            <div className="space-y-2 animate pulse">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <TypographyP className="font-bold truncate text-sm">{user?.display_name}</TypographyP>
                <span className="text-muted-foreground text-sm">·</span>
                <TypographyMuted className="text-sm shrink-0">{timeAgo(String(post.created_at))}</TypographyMuted>
              </div>

              <TypographyMuted className="text-sm truncate">@{user?.username}</TypographyMuted>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="p-2"
              >
                <EllipsisVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <PostDropdown />
          </DropdownMenu>
        </div>

        <div>
          {/* Caption */}
          {post.content && (
            <>
              <motion.div
                initial={false}
                animate={{
                  height: isExpanded ? "auto" : collapsedHeight,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="overflow-hidden"
              >
                <div className="flex flex-col">
                  <TypographySmall className="text-foreground break-words break-all whitespace-pre-wrap">
                    {post.content}
                  </TypographySmall>
                </div>
              </motion.div>

              {/* Show more/less button */}
              {lineCount > 3 && (
                <motion.button
                  onClick={() => setIsExpanded(!isExpanded)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {isExpanded ? "Show less" : "Show more"}
                </motion.button>
              )}
            </>
          )}

          {/* Media */}
          {media.length > 0 && (
            <MediaTiles media={media} className="relative h-[400px] rounded-2xl overflow-hidden" />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 max-w-xs text-muted-foreground">
          <Button 
            size="iconPair" 
            variant="ghost" 
            className="group p-3 text-xs hover:text-blue-500 hover:bg-blue-500/10"
          >
            <MessageCircleIcon className="size-4" />
            <span className="ml-1">{post.comments_count ?? 0}</span>
          </Button>

          <Button 
            size="iconPair" 
            variant="ghost" 
            className="group p-3 text-xs hover:text-green-500 hover:bg-green-500/10"
          >
            <ShareIcon className="size-4" />
            <span className="ml-1">{post.shares_count ?? 0}</span>
          </Button>

          <Button 
            size="iconPair" 
            variant="ghost" 
            className="group p-3 text-xs hover:text-red-500 hover:bg-red-500/10"
          >
            <HeartIcon className="size-4" />
            <span className="ml-1">{post.likes_count ?? 0}</span>
          </Button>

          <Button 
            size="icon" 
            variant="ghost" 
            className="group p-3 text-xs hover:text-blue-500 hover:bg-blue-500/10"
          >
            <BookmarkIcon className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProfilePostCards({ username: fursonaId }: Readonly<{ username: string }>) {
  const { posts, hasMore, fetchPosts, fetchMore, loading } = useProfilePosts(fursonaId);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return <ProfileLists posts={posts} hasMore={hasMore} fetchMore={fetchMore} loading={loading} />;
}

export function PostCards() {
  const { posts, hasMore, fetchPosts, fetchMore, loading } = usePosts();

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return <ProfileLists posts={posts} hasMore={hasMore} fetchMore={fetchMore} loading={loading} />;
}

export default function ProfileLists({ posts, hasMore, fetchMore, loading }: Readonly<PostListProps>)  {
  if (loading) {
    const skeletonItems = [...Array(3)];
    return (
      <div className="flex flex-col">
        {skeletonItems.map((_, i) => (
          <div key={i} className={`flex px-4 py-3 gap-3 animate-pulse ${i < skeletonItems.length - 1 ? "border-b border-border" : ""}`}>
            <div className="h-12 w-12 bg-muted rounded-full" />

            <div className="flex-1 space-y-5 md:pr-12">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />

                  <div className="h-4 w-16 bg-muted rounded" />
                </div>

                <div className="size-8 bg-muted rounded-full" />
              </div>

              <div className="w-full h-[400px] rounded-md bg-muted" />

              <div className="w-1/4 h-6 bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && posts.length < 1) {
    return (
      <div className="gird place-content-center w-full h-full">
        <TypographyH2>
          No posted content
        </TypographyH2>
      </div>
    );
  } else {
    return (
      <>
        {posts.map((post, idx) => (
          <PostCard key={post.id} post={post} isLast={idx === posts.length - 1} />
        ))}

        {hasMore && (
          <button
            onClick={fetchMore}
            className="py-4 text-sm text-muted-foreground hover:text-primary transition-colors w-full"
          >
            Load more
          </button>
        )}
      </>
    );
  }
}
