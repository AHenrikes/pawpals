"use client";

import { useState } from "react";
import { PostType } from "@/types/post";
import { DialogContent } from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { TypographySmall } from "@repo/ui/typography";
import { HeartIcon, MessageCircleIcon, ShareIcon } from "lucide-react";
import PostAvatar from "@/components/avatars/PostAvatar";
import PostLayout from "@/components/cards/media/layout/PostLayout";

export default function PostModal({ post }: Readonly<{ post: PostType }>) {
  const media = post.post_media ?? [];
  const [liked, setLiked] = useState(false);

  return (
    <DialogContent className="gap-2 sm:max-w-7xl">
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

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button
            size="icon"
            variant="ghost"
            className="group p-2"
            onClick={() => setLiked((s) => !s)}
          >
            <HeartIcon className="size-4" />
            <span className="ml-2 text-sm">{(post.likes_count ?? 0) + (liked ? 1 : 0)}</span>
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

        <div className="text-sm text-muted-foreground">
          <TypographySmall>{post.visibility ?? "Public"}</TypographySmall>
        </div>
      </div>
    </DialogContent>
  );
}
