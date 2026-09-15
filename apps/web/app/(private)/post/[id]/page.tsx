"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePost } from "@/hooks/social/posts/usePost";
import { TypographyH2, TypographySmall, TypographyMuted, TypographyP } from "@repo/ui/typography";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { BookmarkIcon, HeartIcon, MessageCircleIcon, ShareIcon } from "lucide-react";
import { timeAgo } from "@/lib/helpers/timeAgo";
import PostAvatar from "@/components/avatar-icons/PostAvatar";
import PostLayout from "@/components/cards/media/layout/PostLayout";
import HeaderAvatar from "@/components/avatar-icons/HeaderAvatar";
import { Input } from "@repo/ui/input";
import { DropdownMenu } from "@repo/ui/dropdown-menu";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const { post, loading, error, fetchPost } = usePost(params.id);
  const [liked, setLiked] = useState(false);
  const media = post?.post_media ?? [];

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="grid place-content-center w-full h-[calc(100dvh-64px)] text-muted-foreground">
        <TypographyH2>Loading post...</TypographyH2>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="grid place-content-center w-full h-[calc(100dvh-64px)] p-4 gap-1">
        <TypographyH2>Post not found</TypographyH2>
        <TypographyMuted>{error ?? "This post is unavailable."}</TypographyMuted>
      </div>
    );
  }

  return (
    <article className="flex flex-col w-full h-full p-4 gap-4 rounded-base">
      <div className="flex items-start justify-between gap-4">
        <PostAvatar post={post} />
      </div>

      <div>
        {post.content && (
          <div className="whitespace-pre-wrap wrap-break-word">
            <TypographySmall className="text-foreground">
              {post.content}
            </TypographySmall>
          </div>
        )}

        {media.length > 0 && (
          <div className="w-full">
            <PostLayout media={media} />
          </div>
        )}
      </div>

      <div className="flex gap-2 text-muted">
        <TypographySmall>
          {timeAgo(String(post.created_at))}
        </TypographySmall>
          
        *

        <span>
          {post.views_count}VIEWS
        </span>
      </div>

      <Separator className="h-0.5" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button size="icon" variant="ghost" className="group p-2"
            onClick={() => setLiked((state) => !state)}
          >
            <HeartIcon className="size-4" />
            <span className="ml-2 text-sm">
              {(post.likes_count ?? 0) + (liked ? 1 : 0)}
            </span>
          </Button>

          <Button size="icon" variant="ghost" className="group p-2">
            <MessageCircleIcon className="size-4" />
            <span className="ml-2 text-sm">{post.comments_count ?? 0}</span>
          </Button>

          <Button size="icon" variant="ghost" className="group p-2">
            <ShareIcon className="size-4" />
            <span className="ml-2 text-sm">{post.shares_count ?? 0}</span>
          </Button>
        </div>

        <Button size="icon" variant="ghost" className="group p-2">
          <BookmarkIcon className="size-4" />
          <span className="ml-2 text-sm">{post.bookmarks_count ?? 0}</span>
        </Button>
      </div>

      <Separator className="h-0.5" />

      <form className="flex gap-2">
        <DropdownMenu>
          <HeaderAvatar />
        </DropdownMenu>

        <Input />
      </form>

      <Separator className="h-0.5" />

      {new Array(0, 1, 2, 3, 4, 5).map((idx) => (
        <div key={idx}>
          <div className="flex justify-between">
            <DropdownMenu>
              <HeaderAvatar />
            </DropdownMenu>

            <TypographyMuted>
              {timeAgo(String(post.created_at))}
            </TypographyMuted>
          </div>

          <TypographyP>
            Hello chat!
          </TypographyP>
        </div>
      ))}
    </article>
  );
}
