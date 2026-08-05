"use client";

import Image from "next/image";
import { type MediaItem } from "@/types/post";
import { getOrderedVisible } from "@/lib/mediaLayout";
import { cn } from "@repo/ui/lib/utils";

interface MediaTilesProps {
  media: MediaItem[];
  className?: string;
}

export default function MediaTiles({
  media,
  className,
}: Readonly<MediaTilesProps>) {
  if (!media || media.length === 0) {
    return <div className="text-muted-foreground">No media to display</div>;
  }

  const { visible, container, img } = getOrderedVisible(media);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-black/50 min-h-0 h-full",
        className ?? "",
        container
      )}
    >
      {visible.map((item, index) => {
        // const isLandscape = item.width / item.height > 1.1;
        // const aspectClass = isLandscape ? "aspect-[16/9]" : "aspect-[3/4]";

        return (
          <Image
            key={`${item.type}-${item.originalIndex}`}
            src={item.url}
            alt={`Media ${index + 1}`}
            width={item.width}
            height={item.height}
            className={cn(
              "object-cover w-full h-full rounded-[inherit]",
              img[index] ?? "",
              // aspectClass
            )}
            quality={85}
            loading="lazy"
          />
        );
      })}
    </div>
  );
}
