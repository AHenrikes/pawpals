export const MAX_HISTORY_ITEMS = 30;

export type SearchHistoryEntry =
  | {
      type: "fursona";
      username: string;
      displayName: string;
      avatarUrl?: string;
    }
  | { type: "nav"; path: string; label: string };

export function isSearchHistoryEntry(
  value: unknown,
): value is SearchHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  if (!("type" in value)) return false;

  if (value.type === "fursona") {
    return (
      "username" in value &&
      typeof value.username === "string" &&
      "displayName" in value &&
      typeof value.displayName === "string" &&
      (!("avatarUrl" in value) || typeof value.avatarUrl === "string")
    );
  }

  return (
    value.type === "nav" &&
    "path" in value &&
    typeof value.path === "string" &&
    value.path.startsWith("/") &&
    !value.path.startsWith("//") &&
    "label" in value &&
    typeof value.label === "string"
  );
}

function entryKey(entry: SearchHistoryEntry): string {
  return entry.type === "fursona"
    ? `fursona:${entry.username.toLowerCase()}`
    : `nav:${entry.path}`;
}

export function addHistorySelection(
  history: readonly SearchHistoryEntry[],
  entry: SearchHistoryEntry,
): SearchHistoryEntry[] {
  return [
    entry,
    ...history.filter((item) => entryKey(item) !== entryKey(entry)),
  ].slice(0, MAX_HISTORY_ITEMS);
}
