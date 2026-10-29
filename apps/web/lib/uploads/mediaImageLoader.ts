import type { ImageLoaderProps } from "next/image";

export function mediaImageLoader({ src, width, quality }: ImageLoaderProps) {
  const params = new URLSearchParams({
    w: String(Math.min(width, 1920)),
    q: String(quality ?? 75),
  });
  return `${src}?${params}`;
}
