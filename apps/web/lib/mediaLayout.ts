import { type MediaItem } from "@/types/post";

export type OrientationType = "landscape" | "portrait";

export interface MediaWithOrientation extends MediaItem {
  orientation: OrientationType;
  originalIndex: number; // index in the caller's original array — needed for remove/edit actions
}

interface LayoutConfig {
  container: string;
  img: string[];
}

function analyzeOrientation(width?: number, height?: number): OrientationType {
  const safeWidth = width ?? 1;
  const safeHeight = height ?? 1;
  return safeWidth / safeHeight > 1.1 ? "landscape" : "portrait";
}

export function analyzeMedia(media: MediaItem[]) {
  const analyzed: MediaWithOrientation[] = media.map((item, originalIndex) => ({
    ...item,
    orientation: analyzeOrientation(item.width, item.height),
    originalIndex,
  }));

  const landscape = analyzed.filter((m) => m.orientation === "landscape");
  const portrait = analyzed.filter((m) => m.orientation === "portrait");

  return {
    landscape,
    portrait,
    landscapeCount: landscape.length,
    portraitCount: portrait.length,
  };
}

/**
 * Given a set of media, returns the items in the order getLayout's img[]
 * classes expect (portrait first, then landscape), each still tagged with
 * its originalIndex so callers can map back to remove/edit actions.
 */
export function getOrderedVisible(media: MediaItem[], maxVisible = 4) {
  const { landscape, portrait, landscapeCount } = analyzeMedia(media);
  const totalCount = landscape.length + portrait.length;
  const visibleTotal = Math.min(totalCount, maxVisible);

  const ordered = [...portrait, ...landscape];
  const visible = ordered.slice(0, visibleTotal);
  const remaining = totalCount - visible.length;

  const layout = getLayout(visible.length, landscapeCount);

  return { visible, remaining, ...layout };
}

const TILE = "min-h-[12rem]";
const PORTRAIT_TILE = `${TILE} aspect-[3/4]`;
const LANDSCAPE_TILE = `${TILE} aspect-[16/9]`;
const MAX_H = "max-h-[60svh]";

function layoutForFour(landscapeCount: number): LayoutConfig {
  const isLandscape = landscapeCount === 4;

  switch (landscapeCount) {
    case 3:
      return {
        // container: "grid grid-cols-2 gap-1",
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE],
      };

    case 2:
      return {
        // container: `grid grid-cols-2 gap-1 ${MAX_H}`,
        // img: [PORTRAIT_TILE, PORTRAIT_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE]
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, PORTRAIT_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE],
      };

    case 1:
      return {
        // container: `grid grid-cols-2 gap-1 ${MAX_H} xl:grid-cols-3`,
        // img: [PORTRAIT_TILE, PORTRAIT_TILE, PORTRAIT_TILE, `xl:col-span-3 ${LANDSCAPE_TILE}`]
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, PORTRAIT_TILE, PORTRAIT_TILE, LANDSCAPE_TILE],
      };

    default:
      return {
        // container: `grid grid-cols-2 gap-1 ${MAX_H} ${!isLandscape ? "xl:grid-cols-4" : null}`,
        container: `flex gap-2 ${MAX_H}`,
        img: isLandscape
          ? [LANDSCAPE_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE]
          : [PORTRAIT_TILE, PORTRAIT_TILE, PORTRAIT_TILE, PORTRAIT_TILE],
      };
  }
}

function layoutForThree(landscapeCount: number): LayoutConfig {
  switch (landscapeCount) {
    case 3:
      return {
        // container: `grid grid-cols-2 gap-1 ${MAX_H}`,
        // img: [`col-span-2 ${LANDSCAPE_TILE}`, LANDSCAPE_TILE, LANDSCAPE_TILE]
        container: `flex gap-2 ${MAX_H}`,
        img: [LANDSCAPE_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE],
      };

    case 2:
      return {
        // container: `grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-1 ${MAX_H}`,
        // img: [`row-span-2 ${PORTRAIT_TILE}`, LANDSCAPE_TILE, LANDSCAPE_TILE]
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, LANDSCAPE_TILE, LANDSCAPE_TILE],
      };

    case 1:
      return {
        // container: `grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-1 ${MAX_H}`,
        // img: [PORTRAIT_TILE, PORTRAIT_TILE, `w-full ${LANDSCAPE_TILE} col-span-2`,]
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, PORTRAIT_TILE, LANDSCAPE_TILE],
      };

    default:
      return {
        // container: `grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1 2xl:grid-cols-3 ${MAX_H}`,
        // img: [`row-span-2 ${PORTRAIT_TILE} 2xl:row-span-1`, PORTRAIT_TILE, PORTRAIT_TILE],
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, PORTRAIT_TILE, PORTRAIT_TILE],
      };
  }
}

function layoutForTwo(landscapeCount: number): LayoutConfig {
  switch (landscapeCount) {
    case 2:
      return {
        // container: `grid gap-1 grid-cols-1 max-h-[53dvh] ${MAX_H}`,
        container: `flex gap-2 ${MAX_H}`,
        img: [LANDSCAPE_TILE, LANDSCAPE_TILE],
      };

    case 1:
      return {
        container:
          // `grid gap-1 grid-cols-1 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] ${MAX_H}`,
          `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, LANDSCAPE_TILE],
      };

    default:
      return {
        // container: `grid grid-cols-2 gap-1 ${MAX_H}`,
        // img: [PORTRAIT_TILE, PORTRAIT_TILE],
        container: `flex gap-2 ${MAX_H}`,
        img: [PORTRAIT_TILE, `w-auto ${PORTRAIT_TILE}`],
      };
  }
}

function layoutForOne(landscapeCount: number): LayoutConfig {
  return {
    // container: `flex justify-center items-center ${MAX_H}`,
    container: `flex justify-center items-center overflow-hidden ${MAX_H}`,
    img: [landscapeCount === 1 ? "w-full h-auto" : "w-auto h-full"],
  };
}

function getLayout(count: number, landscapeCount: number): LayoutConfig {
  switch (count) {
    case 4:
      return layoutForFour(landscapeCount);

    case 3:
      return layoutForThree(landscapeCount);

    case 2:
      return layoutForTwo(landscapeCount);

    default:
      return layoutForOne(landscapeCount);
  }
}
