export function avatarImageSrc(
  src: string | null | undefined,
  width: number,
): string | undefined {
  if (!src) return undefined;
  if (!src.startsWith("/api/media/")) return src;
  const params = new URLSearchParams({ w: String(width), q: "75" });
  return `${src}?${params}`;
}
