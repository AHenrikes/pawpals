import { createClient } from "@repo/supabase/client";

type Bucket = "fursona-avatars" | "fursona-banners";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadFursonaImage(
  file: File,
  accountId: string,
  fursonaId: string,
  bucket: Bucket,
): Promise<string> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than 5MB. Got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${accountId}/${fursonaId}.${ext}`;

  // Delete old files with any extension before uploading new one
  // This handles format changes (e.g., PNG → GIF) and supports animation
  const possibleExtensions = ["jpg", "png", "gif", "webp"];
  for (const oldExt of possibleExtensions) {
    if (oldExt !== ext) {
      const oldPath = `${accountId}/${fursonaId}.${oldExt}`;
      await supabase.storage
        .from(bucket)
        .remove(
          [oldPath]
        )
        .catch(() => {
          // Silently ignore if file doesn't exist 
        })
    }
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Failed to generate public URL for uploaded file");
  }

  return data.publicUrl;
}

export async function deleteFursonaMedia(
  accountId: string,
  fursonaId: string,
  buckets: Bucket[] = ["fursona-avatars", "fursona-banners"],
): Promise<void> {
  const supabase = createClient();
  const extensions = ["jpg", "png", "gif", "webp"];

  for (const bucket of buckets) {
    for (const ext of extensions) {
      const path = `${accountId}/${fursonaId}.${ext}`;
      await supabase.storage
        .from(bucket)
        .remove([path])
        .catch(() => {
          // Silently ignore if file doesn't exist
        });
    }
  }
}
