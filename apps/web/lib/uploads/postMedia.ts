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
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
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
  const dimensions = isVideo
    ? await getVideoDimensions(file)
    : await getImageDimensions(file);

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase();
  const fileId = makeOptimisticId();
  const path = `${accountId}/${fursonaId}/${fileId}.${ext}`;

  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type
    });

  if (error) throw error;

  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");

  return {
    url: data.publicUrl,
    width: dimensions.width,
    height: dimensions.height,
    type: isVideo ? "video" : "image",
  };
}
