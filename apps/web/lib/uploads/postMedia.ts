import { createClient } from "@repo/supabase/client";
import { type MediaItem } from "@/types/post";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];
const MAX_SIZE = 20 * 1024 * 1024;

let optimisticCounter = 0;

function makeOptimisticId() {
  const random = globalThis.crypto?.randomUUID;
  if (typeof random === "function") return random.call(globalThis.crypto);

  const fillRandom = globalThis.crypto?.getRandomValues;
  if (typeof fillRandom === "function") {
    const bytes = new Uint8Array(16);
    fillRandom.call(globalThis.crypto, bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    return `tmp-${hex}`;
  }

  // Last-resort fallback for very old browsers with no Web Crypto API.
  optimisticCounter += 1;
  return `tmp-${Date.now()}-${optimisticCounter}`;
}

async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };
    img.src = url;
  });
}

async function getVideoDimensions(
  file: File,
): Promise<{ width: number; height: number; poster: Blob }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration || 0);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      canvas.toBlob(
        (poster) => {
          URL.revokeObjectURL(url);
          if (!poster) {
            reject(new Error("Failed to create video poster"));
            return;
          }
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            poster,
          });
        },
        "image/jpeg",
        0.85,
      );
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read video dimensions"));
    };
    video.src = url;
  });
}

export async function uploadPostMedia(
  file: File,
  accountId: string,
  fursonaId: string,
): Promise<MediaItem> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large: max 20MB`);
  }

  const isVideo = file.type.startsWith("video/");
  let dimensions: { width: number; height: number };
  let poster: Blob | null = null;

  if (isVideo) {
    const videoDimensions = await getVideoDimensions(file);
    dimensions = videoDimensions;
    poster = videoDimensions.poster;
  } else {
    dimensions = await getImageDimensions(file);
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase();
  const fileId = makeOptimisticId();
  const path = `${accountId}/${fursonaId}/${fileId}.${ext}`;

  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
    });

  if (error) throw error;

  let posterUrl: string | null = null;

  if (poster) {
    const posterPath = `${accountId}/${fursonaId}/${fileId}-poster.jpg`;
    const posterBlob = poster;

    const { error: posterError } = await supabase.storage
      .from("post-media")
      .upload(posterPath, posterBlob, {
        cacheControl: "31536000",
        contentType: "image/jpeg",
      });

    if (posterError) throw posterError;

    const posterResult = supabase.storage
      .from("post-media")
      .getPublicUrl(posterPath);
    posterUrl = posterResult.data.publicUrl || null;
  }

  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");

  return {
    media_type: isVideo ? "video" : "image",
    poster_url: posterUrl,
    url: data.publicUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}
