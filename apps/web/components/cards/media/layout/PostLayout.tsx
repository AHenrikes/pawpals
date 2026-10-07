"use client";

import { getOrderedVisible } from "@/lib/mediaLayout";
import { cn } from "@repo/ui/lib/utils";
import { UseInView } from "@/lib/helpers/UseInView";
import { type MediaItem } from "@/types/post";
import Image from "next/image";

interface PostLayoutProps {
  media: MediaItem[];
  className?: string;
}

export default function PostLayout({
  media,
  className,
}: Readonly<PostLayoutProps>) {
  const { ref, inView } = UseInView({ threshold: 0.5 });
  const { visible, container, img } = getOrderedVisible(media);

  if (!media || media.length === 0) {
    return <div className="text-muted-foreground">No media to display</div>;
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative flex overflow-x-auto bg-black/50 rounded-base",
        className ?? "",
        container,
      )}
    >
      {visible.map((item, index) => {
        const isGif = /\.gif(\?|$)/i.test(item.url);
        const imageWidth = item.width || 1;
        const imageHeight = item.height || 1;

        if (visible.length < 2) {
          return (
            <Image
              key={item.originalIndex}
              src={isGif && !inView ? "/images/app/party-popper.png" : item.url}
              alt={`${item.orientation}-${item.originalIndex}`}
              width={imageWidth}
              height={imageHeight}
              className={cn(
                "block w-full h-auto object-contain",
                img[index] ?? "",
              )}
              quality={85}
              loading={isGif ? undefined : "eager"}
              unoptimized={isGif}
            />
          );
        }

        return (
          <div
            key={item.originalIndex}
            className={cn(
              `group relative max-w-[85%] max-h-[${imageHeight}] shrink-0`,
              item.orientation === "landscape"
                ? "w-full h-ato"
                : "w-auto h-full",
            )}
          >
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <Image
              src={isGif && !inView ? "/images/app/party-popper.png" : item.url}
              alt={`${item.orientation}-${item.originalIndex}`}
              width={imageWidth}
              height={imageHeight}
              className={cn(
                "object-cover",
                item.orientation === "landscape"
                  ? "w-full h-full"
                  : "w-full h-full max-h-[60svh]",
                img[index] ?? "",
              )}
              quality={85}
              loading={isGif ? undefined : "eager"}
              unoptimized={isGif}
            />
          </div>
        );
      })}
    </div>
  );
}
