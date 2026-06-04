import { createClient } from "@repo/supabase/client";

type Bucket = "fursona-avatars" | "fursona-banners";

export async function uploadFursonaImage(
  file: File,
  accountId: string,
  fursonaId: string,
  bucket: Bucket,
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${accountId}/${fursonaId}.${ext}`;

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

  return data.publicUrl;
}
