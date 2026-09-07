"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import { getInitials } from "@/utils/getInitials";
import { useFursonaData } from "@/hooks/useFursonaData";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import {
  TypographyH2,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@repo/ui/typography";
import {
  BookmarkIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  MessageCircleIcon,
  ShareIcon,
} from "lucide-react";
import { useProfilePosts } from "@/hooks/core/fursonas/useProfilePosts";
import { cn } from "@repo/ui/lib/utils";
import { Separator } from "@repo/ui/separator";
import { type PostType } from "@/types/post";
import PostDropdown from "@/components/dropdowns/Post";
import GalleryLayout from "./layout/GalleryLayout";

type GalleryListProps = {
  galleries: PostType[];
  hasMore: boolean;
  fetchMore: () => void;
  loading: boolean;
};

export default function Gallery({ gallery }: Readonly<{ gallery: PostType }>) {
  const { user, loading } = useFursonaData(gallery.fursona_id);
  const media = gallery.media_urls ?? [];
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate collapsed height based on actual line count (max 3 lines)
  const lineCount = gallery.content?.split("\n").length ?? 0;
  const collapsedHeight = `calc(1.5rem * ${Math.min(lineCount, 3)})`;

  return (
    <article
      className={cn(
        "flex flex-col w-full max-h-[80dvh] min-h-0 py-3 gap-3",
        "overflow-hidden transition-colors",
      )}
    >
      {/* Header: Name, Username, Timestamp */}
      <div className="flex justify-between items-center px-3">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />

            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage
                src={user?.avatar_url ?? undefined}
                alt={user?.display_name}
              />
              <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <TypographyP className="font-bold truncate text-sm">
                {user?.display_name}
              </TypographyP>
              <TypographyMuted className="text-sm truncate">
                @{user?.username}
              </TypographyMuted>
              {/* <span className="text-muted-foreground text-sm">·</span> */}
              {/* <TypographyMuted className="text-sm shrink-0">{timeAgo(String(post.created_at))}</TypographyMuted> */}
            </div>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size={"icon"} variant={"ghost"} className="p-2">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <PostDropdown />
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {/* Caption */}
        {gallery.content && (
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
                {gallery.content}
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
            <GalleryLayout
              media={media}
              className="w-auto h-full rounded-2xl"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 max-w-xs text-muted-foreground shrink-0 px-3">
        <Button size="icon" variant="ghost">
          <MessageCircleIcon className="size-4" />
          <span className="ml-1">{gallery.comments_count ?? 0}</span>
        </Button>

        <Button size="icon" variant="ghost">
          <ShareIcon className="size-4" />
          <span className="ml-1">{gallery.shares_count ?? 0}</span>
        </Button>

        <Button size="icon" variant="ghost">
          <HeartIcon className="size-4" />
          <span className="ml-1">{gallery.likes_count ?? 0}</span>
        </Button>

        <Button size="icon" variant="ghost">
          <BookmarkIcon className="size-4" />
        </Button>
      </div>
    </article>
  );
}

export function ProfileGallery({
  username: fursonaId,
}: Readonly<{ username: string }>) {
  const { posts, hasMore, fetchPosts, fetchMore, loading } =
    useProfilePosts(fursonaId);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <GalleryLists
      galleries={posts}
      hasMore={hasMore}
      fetchMore={fetchMore}
      loading={loading}
    />
  );
}

export function GalleryLists({
  galleries,
  hasMore,
  fetchMore,
  loading,
}: Readonly<GalleryListProps>) {
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

  if (!loading && galleries.length < 1) {
    return (
      <div className="grid place-content-center w-full h-full">
        <TypographyH2>No posted content</TypographyH2>
      </div>
    );
  } else {
    return (
      <Fragment>
        {galleries.map((gallery) => (
          <Fragment key={gallery.id}>
            <Gallery gallery={gallery} />

            <Separator className="h-0.5" />
          </Fragment>
        ))}

        {hasMore && (
          <button
            onClick={fetchMore}
            className="py-4 text-sm text-muted-foreground hover:text-primary transition-colors w-full"
          >
            Load more
          </button>
        )}
      </Fragment>
    );
  }
}
