"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePost } from "@/hooks/social/posts/usePost";
import {
  TypographyH2,
  TypographyMuted,
  TypographyP,
} from "@repo/ui/typography";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { EllipsisVerticalIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import { LikeButton } from "@/components/buttons/LikeButton";
import { ShareButton } from "@/components/buttons/ShareButton";
import { BookmarkButton } from "@/components/buttons/BookmarkButton";
import { CommentButton } from "@/components/buttons/CommentButton";
import PostDropdown from "@/components/dropdowns/Post";
import PostAvatar from "@/components/avatar-icons/PostAvatar";
import CreateComment from "@/components/features/CreateComment";
import PostLayout from "@/components/cards/media/layout/PostLayout";
import Comments from "@/components/pages/Comments";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const { post, loading, error, fetchPost } = usePost(params.id);
  const media = post?.post_media ?? [];

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="grid place-content-center w-full h-[calc(100dvh-64px)] text-muted-foreground">
        <TypographyH2>Loading post...</TypographyH2>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="grid place-content-center w-full h-[calc(100dvh-64px)] p-4 gap-1">
        <TypographyH2>Post not found</TypographyH2>
        <TypographyMuted>
          {error ?? "This post is unavailable."}
        </TypographyMuted>
      </div>
    );
  }

  return (
    <article>
      <div className="flex flex-col gap-2 p-2">
        {/* Header */}
        <div className="flex items-center gap-1">
          <PostAvatar userId={post.fursona_id} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={"icon"} variant={"ghost"} className="p-2">
                <EllipsisVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <PostDropdown contentId={post.id} userId={post.fursona_id} />
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {post.content && (
            <TypographyP className="max-w-[90%] text-foreground whitespace-pre-wrap wrap-break-word lg:max-w-[80%]">
              {post.content}
            </TypographyP>
          )}

          {media.length > 0 && (
            <div className="w-full">
              <PostLayout media={media} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center gap-2 shrink-0">
          <div>
            <LikeButton id={post.id} count={post.likes_count} />
            <CommentButton id={post.id} count={post.likes_count} />
            <ShareButton id={post.id} count={post.shares_count} />
          </div>

          <BookmarkButton id={post.id} />
        </div>
      </div>

      <Separator className="h-0.5" />

      <section className="py-2 select-none">
        <Comments content={post} />
      </section>

      <div className="sticky bottom-0 left-0 p-2 bg-linear-to-b from-0% via-0% to-background">
        <CreateComment />
      </div>
    </article>
  );
}
