import { badRequest, notFound } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/requireUser";
import sharp from "sharp";

const BUCKETS = new Set(["fursona-avatars", "fursona-banners"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE = /^[0-9a-zA-Z-]+\.(jpg|jpeg|png|webp|gif)$/i;
const MAX_WIDTH = 1920;

function imageOptions(request: Request) {
  const url = new URL(request.url);
  const widthValue = url.searchParams.get("w");
  const qualityValue = url.searchParams.get("q");
  if (widthValue === null) return null;

  const width = Number(widthValue);
  const quality = qualityValue === null ? 75 : Number(qualityValue);
  if (!Number.isInteger(width) || width < 1 || width > MAX_WIDTH ||
      !Number.isInteger(quality) || quality < 1 || quality > 100) {
    return false;
  }
  return { width, quality };
}

export async function GET(request: Request, { params }: {
  params: Promise<{ bucket: string; fursonaId: string; file: string }>;
}) {
  const { bucket, fursonaId, file } = await params;
  if (!BUCKETS.has(bucket) || !UUID.test(fursonaId) || !FILE.test(file)) return badRequest("Invalid media path");
  const options = imageOptions(request);
  if (options === false) return badRequest("Invalid image options");

  const { supabase, response } = await requireUser();
  if (response) return response;
  const { data, error } = await supabase.storage.from(bucket).download(`${fursonaId}/${file}`);
  if (error) return notFound("Media not found");
  if (!data) return notFound("Media not found");
  const resize = options && data.type !== "image/gif";
  const body = resize
    ? await sharp(Buffer.from(await data.arrayBuffer()))
        .rotate()
        .resize({ width: options.width, withoutEnlargement: true })
        .webp({ quality: options.quality })
        .toBuffer()
    : data;

  return new Response(body, {
    headers: {
      "Content-Type": resize ? "image/webp" : data.type || "application/octet-stream",
      "Cache-Control": "private, max-age=300",
      Vary: "Cookie, x-acting-fursona-id",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
