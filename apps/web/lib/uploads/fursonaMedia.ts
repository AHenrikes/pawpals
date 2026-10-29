import { createClient } from "@repo/supabase/client";
import { MAX_IMAGE_SIZE_BYTES } from "./imageLimits";

type Bucket = "fursona-avatars" | "fursona-banners";

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

const BUCKET_CONFIG: Record<Bucket, { maxSize: number; mimeTypes: string[] }> =
  {
    "fursona-avatars": {
      maxSize: MAX_IMAGE_SIZE_BYTES,
      mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
    "fursona-banners": {
      maxSize: MAX_IMAGE_SIZE_BYTES,
      mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
  };

const ALL_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export async function uploadFursonaImage(
  file: File,
  fursonaId: string,
  bucket: Bucket,
): Promise<string> {
  const config = BUCKET_CONFIG[bucket];

  if (!config.mimeTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type for ${bucket}. Allowed: ${config.mimeTypes.join(", ")}`,
    );
  }

  if (file.size > config.maxSize) {
    throw new Error(
      `File too large. Max ${config.maxSize / 1024 / 1024}MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  const supabase = createClient();
  const fileId = makeOptimisticId();
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !ALL_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file extension");
  }
  const path = `${fursonaId}/${fileId}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "300",
    contentType: file.type,
  });

  if (error) throw error;

  return `/api/media/${bucket}/${path}`;
}
