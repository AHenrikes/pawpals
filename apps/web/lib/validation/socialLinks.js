const socialPlatformValues = new Set([
  "website",
  "bluesky",
  "discord",
  "instagram",
  "telegram",
  "tiktok",
  "twitch",
  "x",
  "youtube",
]);

/** @param {unknown} links @returns {{ platform: string; url: string }[] | null} */
export function normalizeSocialLinks(links) {
  if (!Array.isArray(links) || links.length > 6) return null;

  /** @type {{ platform: string; url: string }[]} */
  const normalized = [];
  for (const link of links) {
    if (!link || typeof link !== "object") return null;
    /** @type {Record<string, unknown>} */
    const candidate = link;
    if (
      typeof candidate.platform !== "string" ||
      typeof candidate.url !== "string"
    )
      return null;
    const url = candidate.url.trim();
    if (
      !socialPlatformValues.has(candidate.platform) ||
      !url ||
      url.length > 300
    )
      return null;
    try {
      if (new URL(url).protocol !== "https:") return null;
    } catch {
      return null;
    }
    normalized.push({ platform: candidate.platform, url });
  }
  return normalized;
}

/** @param {unknown} links */
export function safeSocialLinks(links) {
  return normalizeSocialLinks(links) ?? [];
}
