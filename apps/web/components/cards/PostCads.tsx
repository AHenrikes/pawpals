"use client";

import { usePosts } from "@/hooks/social/posts/usePosts";
import { useEffect } from "react";
import {
  HeartIcon,
  MessageCircleIcon,
  BookmarkIcon,
  ShareIcon,
} from "lucide-react";
import { PostType, type MediaItem } from "@/types/post";
import Image from "next/image";

function PostMedia({ media }: Readonly<{ media: MediaItem[] }>) {
  if (!media.length) return null;

  const count = media.length;

  const MediaTile = ({
    item,
    className,
    single,
  }: {
    item: MediaItem;
    className?: string;
    single?: boolean;
  }) => (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={
        single
          ? { aspectRatio: `${item.width}/${item.height}`, maxHeight: "75svh" }
          : undefined
      }
    >
      {item.type === "video" ? (
        <video
          src={item.url}
          className="w-full h-full object-cover"
          muted
          playsInline
          loop
          autoPlay
        />
      ) : (
        <Image src={item.url} alt="" fill className="object-cover" />
      )}
    </div>
  );

  if (count === 1) {
    return (
      <div className="w-full overflow-hidden">
        <MediaTile item={media[0]!} single />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        <MediaTile item={media[0]!} className="aspect-[3/4]" />
        <MediaTile item={media[1]!} className="aspect-[3/4]" />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div
        className="grid grid-cols-2 gap-0.5"
        style={{ gridTemplateRows: "1fr 1fr" }}
      >
        <MediaTile item={media[0]!} className="row-span-2 aspect-[3/4]" />
        <MediaTile item={media[1]!} className="aspect-[3/4]" />
        <MediaTile item={media[2]!} className="aspect-[3/4]" />
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {media.map((item) => (
          <MediaTile key={item.url} item={item} className="aspect-square" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-0.5"
      style={{ gridTemplateRows: "2fr 1fr 1fr" }}
    >
      <MediaTile item={media[0]!} className="row-span-2" />
      {media.slice(1).map((item) => (
        <MediaTile key={item.url} item={item} className="aspect-square" />
      ))}
    </div>
  );
}

function PostCard({ post }: Readonly<{ post: PostType }>) {
  const media = post.media_urls ?? [];

  return (
    <article className="border-b border-border">
      {media.length > 0 && <PostMedia media={media} />}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-500 transition-colors">
          <HeartIcon className="h-5 w-5" />
          <span className="text-xs">{post.likes_count ?? 0}</span>
        </button>

        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
          <MessageCircleIcon className="h-5 w-5" />
          <span className="text-xs">{post.comments_count ?? 0}</span>
        </button>

        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
          <ShareIcon className="h-5 w-5" />
        </button>

        <button className="text-muted-foreground hover:text-primary transition-colors">
          <BookmarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Caption */}
      {post.content && (
        <p className="px-4 pb-4 pt-1 text-sm leading-relaxed text-foreground">
          {post.content}
        </p>
      )}
    </article>
  );
}

export default function PostCards({
  username,
}: Readonly<{ username: string }>) {
  const { posts, hasMore, fetchPosts, fetchMore, loading } = usePosts(username);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="flex flex-col">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-border animate-pulse">
            <div className="bg-muted aspect-square w-full" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          onClick={fetchMore}
          className="py-4 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  );
}
