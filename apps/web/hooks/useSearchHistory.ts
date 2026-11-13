"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addHistorySelection,
  isSearchHistoryEntry,
  MAX_HISTORY_ITEMS,
  type SearchHistoryEntry,
} from "@/lib/search/searchHistoryEntries";

const STORAGE_KEY = "pawpals:recent-search-selections";

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const saved = globalThis.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setHistory(
          parsed.filter(isSearchHistoryEntry).slice(0, MAX_HISTORY_ITEMS),
        );
      }
    } catch {
      globalThis.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const save = useCallback((items: SearchHistoryEntry[]) => {
    setHistory(items);
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addSelection = useCallback(
    (entry: SearchHistoryEntry) => {
      save(addHistorySelection(history, entry));
    },
    [history, save],
  );

  const clearHistory = useCallback(() => save([]), [save]);

  return { history, addSelection, clearHistory };
}
