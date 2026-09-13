"use client";

import { getOrderedVisible } from "@/lib/mediaLayout";
import { cn } from "@repo/ui/lib/utils";
import { useInView } from "@/lib/useInView";
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
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { visible, container, img } = getOrderedVisible(media);

  if (!media || media.length === 0) {
    return <div className="text-muted-foreground">No media to display</div>;
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative overflow-hidden bg-black/50 min-h-0 h-full",
        className ?? "",
        container,
      )}
    >
      {visible.map((item, index) => {
        const isGif = /\.gif(\?|$)/i.test(item.url);
        const width = item.width ?? 1;
        const height = item.height ?? 1;

        const imageWidth = width || 1;
        const imageHeight = height || 1;

        return (
          <div
            key={item.originalIndex}
            className={cn(
              "relative",
              img[index] ?? "",
            )}
          >
            <div className="absolute inset-0 hover:bg-red-500" />
            <Image
              src={isGif && !inView ? "/images/app/party-popper.png" : item.url}
              alt={`Media ${item.order_index}`}
              width={imageWidth}
              height={imageHeight}
              className={cn(
                "object-cover w-full h-full rounded-[inherit]",
                img[index] ?? "",
              )}
              quality={85}
              loading={isGif ? undefined : "lazy"}
              unoptimized={isGif}
            />
          </div>
        );
      })}
    </div>
  );
}
