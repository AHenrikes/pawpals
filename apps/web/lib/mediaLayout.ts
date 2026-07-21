import { type MediaItem } from "@/types/post";

export type OrientationType = "landscape" | "portrait";

export interface MediaWithOrientation extends MediaItem {
  orientation: OrientationType;
  originalIndex: number; // index in the caller's original array — needed for remove/edit actions
}

export interface LayoutConfig {
  container: string;
  img: string[];
}

export function analyzeOrientation(
  width: number,
  height: number,
): OrientationType {
  return width / height > 1.1 ? "landscape" : "portrait";
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

export function getLayout(count: number, landscapeCount: number): LayoutConfig {
  const MAX_H = "max-h-[60svh]";
  const HALF_H = "max-h-[30svh]";
  const MAX_W = "max-w-[1440px]";

  if (count === 4) {
    const isLandscape = landscapeCount === 4;

    if (landscapeCount === 3) {
      return {
        container: "grid grid-cols-3 grid-rows-3 gap-1",
        img: [
          `col-start-1 col-span-1 row-start-1 row-span-3 w-auto h-full ${MAX_H}`,
          "col-start-2 col-span-3 row-start-1 w-full h-full",
          "col-start-2 col-span-3 row-start-2 w-full h-full",
          "col-start-2 col-span-3 row-start-3 w-full h-full",
        ],
      };
    }

    if (landscapeCount === 2) {
      return {
        container: "grid grid-cols-3 grid-rows-2 gap-1",
        img: [
          `col-start-1 col-span-1 row-start-1 w-auto h-full ${HALF_H}`,
          `col-start-1 col-span-1 row-start-2 w-auto h-full ${HALF_H}`,
          "col-start-2 col-span-3 row-start-1 w-auto h-full",
          "col-start-2 col-span-3 row-start-2 w-full h-auto",
        ],
      };
    }

    if (landscapeCount === 1) {
      return {
        container: "grid grid-cols-3 grid-rows-2 gap-1 md:grid-rows-3",
        img: [
          "col-start-1 col-span-1 row-start-1 w-auto h-full",
          "col-start-2 col-span-2 row-start-1 w-auto h-full",
          "col-start-3 col-span-3 row-start-1 w-auto h-full",
          "col-start-1 col-span-3 row-start-2 w-full h-auto md:row-span-2",
        ],
      };
    }

    return {
      container: "grid grid-cols-2 grid-rows-2 gap-1",
      img: isLandscape
        ? ["w-full h-full", "w-full h-full", "w-full h-full", "w-full h-full"]
        : [
            "w-auto h-full justify-self-end",
            "w-auto h-full justify-self-start",
            "w-auto h-full justify-self-end",
            "w-auto h-full justify-self-start",
          ],
    };
  }

  if (count === 3) {
    if (landscapeCount === 3) {
      return {
        container: "grid grid-cols-2 grid-rows-2 gap-1",
        img: [
          "col-start-1 col-span-2 row-start-1 row-span-1 w-full h-auto",
          "w-full h-auto",
          "w-full h-auto",
        ],
      };
    }

    if (landscapeCount === 2) {
      return {
        container: "grid grid-cols-3 grid-rows-2 gap-1",
        img: [
          `col-start-1 col-span-1 row-start-1 row-span-2 w-auto h-full ${MAX_H}`,
          "col-start-2 col-span-3 row-start-1 w-full h-full",
          "col-start-2 col-span-3 row-start-2 w-full h-full",
        ],
      };
    }

    if (landscapeCount === 1) {
      return {
        container: "grid grid-cols-2 grid-rows-2 gap-1",
        img: [
          `col-start-1 col-span-1 row-start-1 w-auto h-full ${MAX_H}`,
          `col-start-2 col-span-1 row-start-1 w-auto h-full ${MAX_H}`,
          "col-start-1 col-span-2 row-start-2 w-full h-auto",
        ],
      };
    }

    return {
      container: "grid grid-cols-2 grid-rows-2 gap-1",
      img: [
        `row-span-2 w-auto h-full ${MAX_H}`,
        `w-auto ${HALF_H}`,
        `w-auto ${HALF_H}`,
      ],
    };
  }

  if (count === 2) {
    if (landscapeCount === 2) {
      return {
        container: "grid grid-rows-2 gap-1 lg:grid-cols-2 lg:grid-rows-1",
        img: [
          `row-start-1 w-full h-auto ${MAX_W} ${HALF_H} lg:col-start-1`,
          `row-start-2 w-full h-auto ${MAX_W} ${HALF_H} lg:row-start-1 lg:col-start-2`,
        ],
      };
    }

    if (landscapeCount === 1) {
      return {
        container:
          "grid grid-rows-[auto_auto] gap-1 lg:grid-rows-1 lg:grid-cols-[auto_1fr]",
        img: [
          `row-start-1 w-auto h-full ${HALF_H}`,
          `row-start-2 w-full h-auto ${HALF_H} lg:row-start-1 lg:col-start-2`,
        ],
      };
    }

    return {
      container: "grid grid-cols-[auto_1fr] gap-1",
      img: [
        `col-start-1 w-auto h-full ${HALF_H}`,
        `col-start-2 w-auto h-full ${HALF_H}`,
      ],
    };
  }

  const isLandscape = landscapeCount === 1;
  return {
    container: "grid",
    img: [
      isLandscape
        ? `w-full h-auto ${MAX_W}`
        : `justify-self-center w-full h-full ${MAX_H} lg:w-auto`,
    ],
  };
}
