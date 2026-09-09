"use client";

import { useProfilePosts } from "@/hooks/core/fursonas/useProfilePosts";
import { usePosts } from "@/hooks/social/posts/usePosts";
import { memo, useEffect, useState, Fragment } from "react";
import { motion } from "framer-motion";
import {
  HeartIcon,
  MessageCircleIcon,
  BookmarkIcon,
  ShareIcon,
  EllipsisVerticalIcon,
} from "lucide-react";
import {
  TypographyH2,
  TypographyMuted,
  TypographySmall,
} from "@repo/ui/typography";
import { Button } from "@repo/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import { timeAgo } from "@/lib/helpers/timeAgo";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { type PostType } from "@/types/post";
import PostLayout from "./layout/PostLayout";
import PostDropdown from "../../dropdowns/Post";
import PostAvatar from "@/components/avatars/PostAvatar";
import PostModal from "@/components/dialogs/CreatePostModal";

type PostListProps = {
  posts: PostType[];
  hasMore: boolean;
  fetchMore: () => void;
  loading: boolean;
};

// export const ACTION_BUTTON_CLASSES = {
//   comment: "group p-3 text-xs hover:text-primary hover:bg-primary/10",
//   share: "group p-3 text-xs hover:text-emerald-500 hover:bg-emerald-500/10",
//   like: "group p-3 text-xs hover:text-destructive hover:bg-destructive/10",
//   bookmark: "group p-3 text-xs hover:text-primary hover:bg-primary/10",
// } as const;

const PostCard = memo(function PostCard({
  post,
}: Readonly<{ post: PostType }>) {
  const media = post.post_media ?? [];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Calculate collapsed height based on actual line count (max 3 lines)
  const lineCount = post.content?.split("\n").length ?? 0;
  const collapsedHeight = `calc(1.5rem * ${Math.min(lineCount, 3)})`;

  return (
    <>
      <article
        className={cn(
          "flex flex-col w-full min-h-0 py-3 gap-3",
          "rounded-base overflow-hidden transition-colors",
          "hover:bg-accent/10 cursor-pointer",
        )}
      >
        {/* Header: Name, Username, Timestamp */}
        <div className="flex justify-between items-center px-3">
          <PostAvatar post={post} />

          <div className="flex items-center gap-3">
            <TypographyMuted className="text-xs shrink-0">
              {timeAgo(String(post.created_at))}
            </TypographyMuted>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={"icon"} variant={"ghost"} className="p-2">
                  <EllipsisVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <PostDropdown />
            </DropdownMenu>
          </div>
        </div>

        <Button
          variant="none"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-col items-start p-0 h-full text-start"
        >
          {/* Content */}
          <div className="flex w-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
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
                  className="px-3 overflow-hidden shrink-0"
                >
                  <TypographySmall className="text-foreground wrap-break-word break-all whitespace-pre-wrap">
                    {post.content}
                  </TypographySmall>
                </motion.div>

                {/* Show more/less button */}
                {lineCount > 3 && (
                  <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="px-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </motion.button>
                )}
              </>
            )}

            {/* Media */}
            {media.length > 0 && (
              <div className="flex-1 min-h-0 px-3">
                <PostLayout
                  media={media}
                  className="w-auto h-full rounded-2xl"
                />
              </div>
            )}
          </div>
        </Button>

        {/* Actions */}
        <div className="flex justify-between gap-2 text-muted-foreground shrink-0 px-3">
          <div>
            <Button
              size="icon"
              variant="ghost"
              // className={ACTION_BUTTON_CLASSES.comment}
              className="group p-3 text-xs hover:text-primary hover:bg-primary/10"
            >
              <MessageCircleIcon className="size-4" />
              <span className="ml-1">{post.comments_count ?? 0}</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              // className={ACTION_BUTTON_CLASSES.share}
              className="group p-3 text-xs hover:text-primary hover:bg-primary/10"
            >
              <ShareIcon className="size-4" />
              <span className="ml-1">{post.shares_count ?? 0}</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              // className={ACTION_BUTTON_CLASSES.like}
              className="group p-3 text-xs hover:text-primary hover:bg-primary/10"
            >
              <HeartIcon className="size-4" />
              <span className="ml-1">{post.likes_count ?? 0}</span>
            </Button>
          </div>

          <Button
            size="icon"
            variant="ghost"
            // className={ACTION_BUTTON_CLASSES.bookmark}
            className="group p-3 text-xs hover:text-primary hover:bg-primary/10"
          >
            <BookmarkIcon className="size-4" />
          </Button>
        </div>
      </article>

      <PostModal isOpen={isOpen} onClose={() => setIsOpen((prev) => !prev)} />
    </>
  );
});

// PostCard.displayName = "PostCard";

export function ProfilePostCards({
  username: fursonaId,
}: Readonly<{ username: string }>) {
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

export function PostCards() {
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

export default function ProfileLists({
  posts,
  hasMore,
  fetchMore,
  loading,
}: Readonly<PostListProps>) {
  if (loading) {
    const skeletonItems = [
      "post-skeleton-a",
      "post-skeleton-b",
      "post-skeleton-c",
    ];

    return (
      <>
        {skeletonItems.map((skeletonId) => (
          <div
            key={skeletonId}
            className="flex flex-col max-h-[90svh] py-3 gap-3 animate-pulse"
          >
            <div className="flex justify-between items-center px-3">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 bg-muted rounded-full" />

                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>

              <div className="size-8 bg-muted rounded-full" />
            </div>

            <div className="space-y-3 px-3">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>

            <div className="h-64 w-full bg-muted" />
          </div>
        ))}
      </>
    );
  }

  if (!loading && posts.length < 1) {
    return (
      <div className="grid place-content-center w-full h-full">
        <TypographyH2>No posted content</TypographyH2>
      </div>
    );
  } else {
    return (
      <>
        {posts.map((post) => (
          <Fragment key={post.id}>
            <PostCard post={post} />

            <Separator className="h-0.5" />
          </Fragment>
        ))}

        {hasMore && (
          <Button
            onClick={fetchMore}
            className="py-4 text-sm text-muted-foreground hover:text-primary transition-colors w-full"
          >
            Load more
          </Button>
        )}
      </>
    );
  }
}
