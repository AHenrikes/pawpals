"use client";

import Image from "next/image";
import { type MediaItem } from "@/types/post";
import { getOrderedVisible } from "@/lib/mediaLayout";

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
      className={`relative ${container} max-w-360 max-h-[60svh] overflow-hidden bg-black/50 ${className ?? ""}`}
    >
      {visible.map((item, index) => (
        <Image
          key={`${item.type}-${item.originalIndex}`}
          src={item.url}
          alt={`Media ${index + 1}`}
          width={item.width}
          height={item.height}
          className={`object-cover ${img[index] ?? ""}`}
          sizes="(max-width: 800px) 100vw, (max-width: 1440px) 50vw, 33vw"
          quality={85}
          loading="lazy"
        />
      ))}
    </div>
  );
}
