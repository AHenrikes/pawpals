import { toast } from "@repo/ui/sonner";
import type { MediaItem, PostType } from "@/types/post";

function normalizeMediaItem(value: unknown): MediaItem | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const url = typeof candidate.url === "string" ? candidate.url : null;
  if (!url) return null;

  const normalized: MediaItem = {
    url,
    media_type: (candidate.media_type as MediaItem["media_type"]) ?? "image",
    poster_url:
      typeof candidate.poster_url === "string" ? candidate.poster_url : null,
    width: typeof candidate.width === "number" ? candidate.width : undefined,
    height: typeof candidate.height === "number" ? candidate.height : undefined,
    duration_seconds:
      typeof candidate.duration_seconds === "number"
        ? candidate.duration_seconds
        : null,
    file_size_bytes:
      typeof candidate.file_size_bytes === "number"
        ? candidate.file_size_bytes
        : null,
    order_index:
      typeof candidate.order_index === "number" ? candidate.order_index : 0,
  };

  return normalized;
}

export function parseMediaUrls(posts: PostType[]): PostType[] {
  return posts.map((post) => {
    const rawMedia = Array.isArray(post.post_media) ? post.post_media : [];

    if (rawMedia.length === 0) {
      return { ...post, media_urls: [] };
    }

    const media_urls = rawMedia
      .map((item) => {
        if (typeof item === "string") {
          try {
            const parsed = JSON.parse(item) as unknown;
            return normalizeMediaItem(parsed);
          } catch {
            toast.warning("Failed to parse media URL:", item);
            return null;
          }
        }

        return normalizeMediaItem(item);
      })
      .filter((item): item is MediaItem => item !== null);

    return { ...post, media_urls, media: media_urls };
  });
}
