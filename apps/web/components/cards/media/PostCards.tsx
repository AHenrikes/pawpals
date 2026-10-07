"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { EllipsisVerticalIcon } from "lucide-react";
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
import { Dialog, DialogTrigger } from "@repo/ui/dialog";
import { useSidebar } from "@/providers/SidebarProvider";
import { LikeButton } from "@/components/buttons/LikeButton";
import { CommentButton } from "@/components/buttons/CommentButton";
import { ShareButton } from "@/components/buttons/ShareButton";
import { ViewButton } from "@/components/buttons/ViewButton";
import { BookmarkButton } from "@/components/buttons/BookmarkButton";
import { type PostType } from "@/types/post";
import Link from "next/link";
import PostLayout from "./layout/PostLayout";
import PostDropdown from "../../dropdowns/Post";
import PostAvatar from "@/components/avatar-icons/PostAvatar";
// import PostModal from "@/components/modals/PostModal";

type PostListProps = {
  posts: PostType[];
  hasMore: boolean;
  fetchMore: () => void;
  loading: boolean;
};

const PostCard = memo(function PostCard({
  post,
}: Readonly<{ post: PostType }>) {
  const media = post.post_media ?? [];
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMobile } = useSidebar();

  // Calculate collapsed height based on actual line count (max 3 lines)
  const lineCount = post.content?.split("\n").length ?? 0;
  const collapsedHeight = `calc(1.5rem * ${Math.min(lineCount, 3)})`;

  const content = (
    <>
      {/* Caption */}
      {post.content && (
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : collapsedHeight,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="relative max-w-[80%] shrink-0 overflow-hidden"
        >
          <TypographySmall
            className="text-foreground whitespace-pre-wrap wrap-break-word"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            {post.content}
          </TypographySmall>

          {/* {!isExpanded && (
            <span className="absolute bottom-0 right-0 px-1 text-foreground">
              ...
            </span>
          )} */}
        </motion.div>
      )}

      {/* Media */}
      {media.length > 0 && <PostLayout media={media} />}
    </>
  );

  const card = (
    <div
      className={cn(
        "w-full min-h-0 px-1 py-4 space-y-2",
        "overflow-hidden transition-colors",
        "text-left hover:bg-accent/30 cursor-pointer",
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <PostAvatar userId={post.fursona_id} actionButton={false} />

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

            <PostDropdown contentId={post.id} userId={post.fursona_id} />
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {isMobile ? (
        <Link
          href={`/post/${post.id}`}
          className="flex w-full min-h-0 flex-1 flex-col gap-4 px-2"
        >
          {content}
        </Link>
      ) : (
        <div className="flex w-full min-h-0 flex-1 flex-col gap-4 px-2">
          {content}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center gap-2 px-1 shrink-0">
        <div>
          <LikeButton id={post.id} count={post.likes_count} />
          <CommentButton id={post.id} count={post.likes_count} />
          <ShareButton id={post.id} count={post.shares_count} />
        </div>

        <div>
          <ViewButton id={post.id} count={post.bookmarks_count} />
          <BookmarkButton id={post.id} />
        </div>
      </div>
    </div>
  );

  return <DialogTrigger asChild>{card}</DialogTrigger>;
});

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
          <Dialog key={post.id}>
            <PostCard post={post} />

            <Separator className="h-0.5" />

            {/* <PostModal post={post} /> */}
          </Dialog>
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
