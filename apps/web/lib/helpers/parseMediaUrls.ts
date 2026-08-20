import { toast } from "@repo/ui/sonner";
import type { MediaItem, PostType } from "@/types/post";

// Parse mixed media payloads returned by legacy rows into normalized objects.
export function parseMediaUrls(posts: PostType[]): PostType[] {
  return posts.map((post) => {
    if (!post.media_urls || post.media_urls.length === 0) {
      return post;
    }

    const media_urls = post.media_urls
      .map((item) => {
        if (typeof item === "object" && item !== null && "url" in item) {
          return item;
        }

        if (typeof item === "string") {
          try {
            return JSON.parse(item) as MediaItem;
          } catch {
            toast.warning("Failed to parse media URL:", item);
            return null;
          }
        }

        return null;
      })
      .filter((item): item is MediaItem => item !== null);

    return { ...post, media_urls };
  });
}
