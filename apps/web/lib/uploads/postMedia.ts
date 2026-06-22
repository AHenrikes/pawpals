import { createClient } from "@repo/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
const MAX_SIZE = 20 * 1024 * 1024;

export async function uploadPostMedia(
  file: File,
  accountId: string,
  fursonaId: string,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large: max 20MB`);
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase();
  const fileId = crypto.randomUUID();
  // path: {accountId}/{fursonaId}/{fileId}.{ext}
  const path = `${accountId}/${fursonaId}/${fileId}.${ext}`;

  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");
  return data.publicUrl;
}
