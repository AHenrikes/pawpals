"use client";

import Image from "next/image";
import { type MediaItem } from "@/types/post";

interface MediaTilesProps {
  media: MediaItem[];
  className?: string;
}

type OrientationType = "landscape" | "portrait";

type LayoutType = 
  | "singleL" | "singleP"
  | "2L" | "2P" | "1L1P"
  | "3L" | "3P" | "2L1P" | "1L2P"
  | "4L" | "4P" | "3L1P" | "1L3P" | "2L2P";

interface MediaWithOrientation extends MediaItem {
  orientation: OrientationType;
}

/**
 * Determine if media is landscape, portrait, or square
 * Landscape: width > height (ratio > 1.1)
 * Portrait: height > width (ratio < 0.9)
 * Square: roughly equal (0.9 - 1.1)
 */
function analyzeOrientation(width: number, height: number): OrientationType {
  const ratio = width / height;
  
  if (ratio > 1.1) return "landscape";
  return "portrait";
}

/**
 * Analyze all media and categorize by orientation
 */
function analyzeMedia(media: MediaItem[]): {
  analyzed: MediaWithOrientation[];
  landscapeCount: number;
  portraitCount: number;
} {
  const analyzed = media.map(item => ({
    ...item,
    orientation: analyzeOrientation(item.width, item.height),
  }));

  const landscapeCount = analyzed.filter(m => m.orientation === "landscape").length;
  const portraitCount = analyzed.filter(m => m.orientation === "portrait").length;

  return { analyzed, landscapeCount, portraitCount };
}

/**
 * Choose layout based on media counts and orientations
 */
function chooseLayout(
  count: number,
  landscapeCount: number,
  portraitCount: number
): LayoutType {
  if (count === 1) {
    return portraitCount === 1 ? "singleP" : "singleL";
  }

  if (count === 2) {
    if (landscapeCount === 2) return "2L";
    if (portraitCount === 2) return "2P";
    return "1L1P";
  }

  if (count === 3) {
    if (landscapeCount === 3) return "3L";
    if (portraitCount === 3) return "3P";
    if (landscapeCount === 2) return "2L1P";
    if (portraitCount === 2) return "1L2P";
  }

  if (count >= 4) {
    if (landscapeCount >= 3) return "3L1P";
    if (portraitCount >= 3) return "1L3P";
    return "2L2P";
  }

  return "2L";
}

/**
 * CSS Grid layout configurations for different combinations
 */
const layoutGridClasses: Record<LayoutType, string> = {
  singleL: "singleL grid grid-cols-1",
  singleP: "singleP grid grid-cols-1",
  "2L": "2L grid grid-row-2 gap-1",
  "2P": "2P grid grid-cols-1 gap-1",
  "1L1P": "1L1P flex gap-1",
  "3L": "3L grid grid-cols-2 gap-1",
  "3P": "3P grid grid-cols-1 gap-1",
  "2L1P": "2L1P grid grid-cols-3 gap-1",
  "1L2P": "1L2P grid grid-cols-2 gap-1",
  "4L": "4L grid grid-cols-4 gap-1",
  "4P": "4P grid grid-cols-2 gap-1",
  "3L1P": "3L1P grid grid-cols-3 gap-1",
  "1L3P": "1L3P grid grid-cols-2 gap-1",
  "2L2P": "2L2P grid grid-cols-2 gap-1",
};

interface MediaImageProps {
  item: MediaWithOrientation;
  layout: LayoutType;
  index: number;
}

/**
 * Individual media image with responsive sizing
 */
function MediaImage({ item, index }: Readonly<MediaImageProps>) {
  return (
    <Image
      src={item.url}
      alt={`Media ${index + 1}`}
      fill
      className={`object-cover h-full w-${item.width}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
      loading="lazy"
    />
  );
}

/**
 * Main MediaTiles component
 * Automatically arranges images in clean layouts based on orientation
 */
export default function MediaTiles({ media, className = "" }: Readonly<MediaTilesProps>) {
  if (!media || media.length === 0) {
    return <div className="text-gray-400">No media to display</div>;
  }

  const { analyzed, landscapeCount, portraitCount } = analyzeMedia(media);
  const layout = chooseLayout(media.length, landscapeCount, portraitCount);
  const gridClass = layoutGridClasses[layout];

  return (
    <div className={`${gridClass} ${className}`}>
      {analyzed.map((item, index) => (
        <MediaImage key={`${item.type}-${index}`} item={item} layout={layout} index={index} />
      ))}
    </div>
  );
}
