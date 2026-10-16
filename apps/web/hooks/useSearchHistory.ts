"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pawpals:search-history";
const MAX_HISTORY_ITEMS = 30;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = globalThis.localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved) as string[]);
    } catch {
      globalThis.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const save = useCallback((items: string[]) => {
    setHistory(items);
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addSearch = useCallback(
    (query: string) => {
      const normalized = query.trim();
      if (!normalized) return;
      save(
        [
          normalized,
          ...history.filter(
            (item) => item.toLowerCase() !== normalized.toLowerCase(),
          ),
        ].slice(0, MAX_HISTORY_ITEMS),
      );
    },
    [history, save],
  );

  const clearHistory = useCallback(() => save([]), [save]);

  return { history, addSearch, clearHistory };
}
