export type Fetcher<T> = () => Promise<T>;

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export function makeCache<T>(ttl = 10 * 60 * 1000) {
  const map = new Map<string, CacheEntry<T>>();

  function isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp >= ttl;
  }

  return {
    async get(key: string, fetcher: Fetcher<T>): Promise<T> {
      const entry = map.get(key);
      if (entry && !isExpired(entry)) return entry.value;

      const value = await fetcher();
      map.set(key, { value, timestamp: Date.now() });
      return value;
    },

    set(key: string, value: T): void {
      map.set(key, { value, timestamp: Date.now() });
    },

    /** Returns the cached value only if present and not expired — no fetch. */
    peek(key: string): T | undefined {
      const entry = map.get(key);
      if (!entry || isExpired(entry)) return undefined;
      return entry.value;
    },

    has(key: string): boolean {
      const entry = map.get(key);
      return !!entry && !isExpired(entry);
    },

    delete(key: string): boolean {
      return map.delete(key);
    },

    /** Removes all expired entries without clearing valid ones. */
    prune(): void {
      for (const [key, entry] of map) {
        if (isExpired(entry)) map.delete(key);
      }
    },

    clear(): void {
      map.clear();
    },

    get size(): number {
      return map.size;
    },
  };
}
